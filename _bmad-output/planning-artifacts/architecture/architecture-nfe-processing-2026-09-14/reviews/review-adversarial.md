---
name: 'review-adversarial'
type: architecture-spine-review
lens: adversarial
target: architecture-nfe-processing-2026-09-14/ARCHITECTURE-SPINE.md
created: '2026-09-14'
---

# Adversarial Review — monthly-report Architecture Spine

**Verdict:** The spine is internally coherent at the level of module wiring (AD-1) but leaves the "reference period" concept — the one thing every stage must agree on — underspecified at three separate boundaries, contradicts itself once on when composition actually runs, and defines no atomic claim on `MonthlyReportRun`, so two teams can each follow every AD-1..AD-7 to the letter and still ship a report that silently describes the wrong month, or a drain cron that double-sends.

Each finding below shows two units built independently, both compliant with the current ADs, that don't integrate — with the exact code location where the gap already exists today.

---

## CRITICAL — AD-4's premise that `GetProductPriceIncreaseService` "needs no change" is false, and building on it produces reports that silently describe the wrong month

**The scenario:** Story "Composição" is built strictly per AD-4: it finds distinct `productId`s bought by the company in the reference month and calls `GetProductPriceIncreaseService.getProductPriceIncrease({ month, year, productId }, companyId)` once per product, trusting AD-4's stated rationale — *"Nenhuma modificação em `GetProductPriceIncreaseService` é necessária — ele já aceita período via `FiltersDto`."*

That claim is checked against the actual code and is wrong:

```ts
// src/v1/modules/insights/repositories/insights.repository.ts
async findPurchaseHistoryByProduct(params: FiltersDto, companyId: number) {
    const history = await this.prisma.invoiceItem.findMany({
        ...
        where: {
                productId: params.productId,
                invoice: { companyId },   // <- params.month / params.year never read
            }
    })
    return history
}
```

`params.month`/`params.year` are accepted by the type signature (`FiltersDto` has them) but **never appear in the `where` clause**. `getProductPriceIncrease` (in `get-product-price-increase.service.ts`) then does `const [current, ...previousPurchases] = purchases` on this unbounded, all-time, `issuedAt desc`-sorted list — `current` is *whatever purchase is most recent at query time*, not "the purchase in the reference month," and `previousAverage` is the average of the *entire* remaining history, not a windowed average.

Two independently-built units both comply with AD-4 exactly as written — "no change to `GetProductPriceIncreaseService`" — and the result is a report for e.g. August that, if the company already has a September invoice for that product by the time the job runs (plausible: cron fires day 1, and the company may have same-day invoices), shows `lastPrice`/`percentageChange` computed against **September's** price and an **all-time** average, while the email's headline says "referente a Agosto." FR-3's own consequence — *"preço anterior vs. preço atual"* — silently means something different from what the email claims.

**Why it's a hole, not a story bug:** the spine explicitly tells implementers this is a no-op integration point, so no story-level review is incentivized to check it. The wrong assumption is baked into the AD.

**Suggested fix:** Tighten AD-4 to *require* extending `findPurchaseHistoryByProduct` (and `FiltersDto`'s consumption) so `current` is constrained to the reference month/year window, and explicitly decide what "previous" means for `previousAverage` (rolling N months? all history before the reference month? same convention as `GetBestSupplierService`'s window, see next finding). Do not ship AD-4's "sem mudança" claim unverified — it is the one piece of this spine most likely to produce a silently wrong report rather than a loud failure.

---

## CRITICAL — Sequence diagram contradicts AD-6's prose on when Compose runs, and `MonthlyReportRun` has no column to bridge the two readings

**The scenario:** the Structural Seed's sequence diagram shows:

```
loop cada empresa elegivel
    Run->>Compose: compoe conteudo do periodo
    Compose->>Insights: savings_opportunities, price_increase, topSeller
    Run->>DB: upsert PENDING (scheduledAt)
end
Drain->>DB: busca PENDING com scheduledAt <= now
Drain->>Send: envia para cada usuario da empresa
```

— i.e., **composition happens in the monthly `@Cron`, before the `PENDING` row is even written**, and the drain cron only sends. But AD-6's prose says the monthly cron *"calcula os elegíveis, cria as linhas `MonthlyReportRun` em `PENDING`"* — no mention of composing — and the drain cron *"busca `PENDING` ... envia e atualiza o status"*. AD-7 then describes composição→render→envio as *one* try/catch unit at "the coordinator level" without saying which of the two `@Cron`s that unit lives in.

A team implementing "eligibility + scheduling" strictly off AD-6's prose builds a monthly cron that only computes eligibility and creates bare `PENDING` rows — no content. A team implementing "compose + render + send" strictly off AD-7 builds one atomic function and, since AD-6's prose put "envia" in the drain, wires it to fire from the drain loop. Those two, built independently, integrate fine — content is composed lazily at drain time. But note the `MonthlyReportRun` ER diagram has *no field to hold composed content* (`companyId, referenceMonth, referenceYear, status, errorMessage, scheduledAt, sentAt`) — so the *only* self-consistent reading is "compose is lazy, inside the drain." The sequence diagram, which is the most visual and easiest artifact for a story-writer to copy from, says the opposite. Whoever builds off the diagram (a very plausible choice, since sequence diagrams are usually treated as the authoritative interaction contract) will try to pass composed content from the monthly cron to the drain cron and discover there is nowhere to put it — likely "solving" this by inventing an ad hoc field or an in-memory cache that doesn't survive a restart, quietly reintroducing the exact failure AD-5 exists to prevent (content computed at schedule-time based on data that may no longer match the DB an hour later, or lost entirely across a restart between schedule and drain).

**Suggested fix:** a new AD stating explicitly: *"Composição, renderização e envio happen together, only inside the drain cron's per-row processing, never in the monthly cron."* Fix the sequence diagram to remove `Compose` from the monthly-cron loop (it should only show `Elig` + `DB upsert PENDING`), and show `Compose`/`Render` inside the `Drain` lane instead.

---

## HIGH — No atomic claim on `MonthlyReportRun`; the drain cron can double-send

**The scenario:** AD-5 says *"o job só envia para uma empresa se não existir linha `SENT` para aquele ciclo"* and AD-6 gives the drain cron a plain read-then-act loop: *"busca `PENDING` com `scheduledAt <= now()`, envia e atualiza o status."* No AD specifies an atomic claim (`UPDATE ... WHERE status = 'PENDING' RETURNING *` / `SELECT ... FOR UPDATE SKIP LOCKED`) before sending.

Two concrete ways this breaks even though every AD is honored:
- **Overlapping ticks, single instance.** `@nestjs/schedule`'s `@Cron` does not serialize overlapping executions. If the drain tick's send loop (SMTP round-trips to Brevo across every `PENDING` company) takes longer than the "a cada 10 min" interval — very plausible near the 250-recipient distribution threshold AD-6 itself anticipates — the next tick starts while the previous is still sending, both read the same `PENDING` rows, both pass the "not SENT" check, both send.
- **A future second instance or a manual re-run.** Nothing in the spine states this process is guaranteed to run as a single instance (the Deferred section only notes `@nestjs/schedule` needs a long-lived process — it says nothing about replica count). Two drain loops racing produce the same double-send with no error, no `FAILED` row, nothing for AD-7's try/catch to catch — this race sits *before* AD-7's error boundary, not inside it.

Both a team building "drain send" and a team building "audit/idempotency table" can each satisfy AD-5's literal words ("send only if not already SENT") while leaving the classic TOCTOU gap between the check and the status write.

**Suggested fix:** tighten AD-5/AD-6 to require the drain claim each row atomically before sending (a single `UPDATE MonthlyReportRun SET status='SENDING' WHERE id=$1 AND status='PENDING'` checked by affected-row-count, treating 0 rows affected as "someone else already claimed it, skip"), and state explicitly whether the deployment is assumed single-instance — if so, say so as a constraint (so a future infra change knows to revisit this), since nothing else in the spine currently says it.

---

## HIGH — "Reference month" boundary is computed at least three different ways, with no shared convention or timezone pinned

**The scenario:** the spine's Consistency Conventions table says period is *"sempre como par explícito `(month, year)`"* but never says how `(month, year)` becomes concrete `Date` bounds — and the codebase already has one convention that a new implementation is unlikely to match by accident:

```ts
// src/v1/modules/insights/services/get-best-supplier.service.ts — EXISTING code
private getDateWindow(params: FiltersDto) {
    const now = new Date();
    const referenceYear = params.year ? Number(params.year) : now.getFullYear();
    const referenceMonth = params.month ? Number(params.month) : now.getMonth() + 1;
    const start = new Date(referenceYear, referenceMonth - 2, 1);   // local timezone!
    const end = new Date(referenceYear, referenceMonth, 0, 23, 59, 59);
    return { start, end };
}
```

This builds bounds with the **Node process's local timezone** (`new Date(y, m, d)` is local, not UTC) and spans **two calendar months** (previous + reference), not one. `GetSavingsOpportunitiesService` doesn't even pass its caller's month/year into this window — it re-derives `month`/`year` per purchase from `issuedAt.getMonth() + 1` / `issuedAt.getFullYear()` (also local-timezone reads), then forwards *that* to `getBestSupplier`.

Now overlay AD-3 (which adds a *new*, one-calendar-month window to `findLatestPurchasePerProduct`) and AD-4 (which adds a *third*, brand-new one-calendar-month window query, owned by `monthly-report`, for "distinct products in the period"). Three windows, three independent implementations, none sharing a helper, none told what timezone to use. A developer building AD-3's new repository filter might reasonably use UTC month boundaries (matching how Postgres/Prisma store `DateTime`); the pre-existing `getDateWindow` uses local time. A purchase issued near midnight Brazil time at a month boundary can land inside one query's window and outside the other's, or be read back via `getMonth()` as belonging to a different month than the window that selected it — silently shifting which comparison `GetBestSupplierService` performs, or which product is/isn't counted as "in the reference month" for AD-4's per-product loop.

**Suggested fix:** a new AD introducing one shared `getMonthRange(month, year)` (or equivalent) used by all three call sites, pinning the timezone explicitly (recommend UTC, since that's presumably how `issuedAt` is stored — confirm at story time), and stating whether "período" always means exactly one calendar month or, where `GetBestSupplierService` is reused, the existing two-month comparison window. Also pin the `@Cron` declarations' `timeZone` option (`America/Sao_Paulo`) explicitly in the Stack/Consistency table — `@nestjs/schedule` defaults to the server process's local timezone, and "dia 1, de madrugada" (PRD FR-5, OQ4) plus the "mês anterior completo" rollover both depend on which calendar the cron's clock uses.

---

## MEDIUM — FR-1 eligibility risks being scoped to the reference month by accident, contradicting its own "histórico" wording

**The scenario:** FR-1 is explicit: eligibility is *"ao menos 1 Produto comprado em 2 ou mais notas fiscais distintas ... em seu histórico"* — unbounded, lifetime. AD-4 introduces a *different*, month-bounded query: *"levanta os `productId` distintos comprados pela empresa na janela do período de referência."* The Structural Seed's repository line conflates both under one bullet — *"leitura: empresas+usuários, produtos comprados no período (AD-4)"* — and never gives `CheckReportEligibilityService` its own named query or signature.

A developer building the eligibility stage, seeing that AD-4 already ships a "distinct products with repeat purchases" style query for the same module, could reuse it for FR-1 as an apparent shortcut — producing eligibility scoped to the reference month instead of lifetime history. A company that bought product X twice in June and July but nothing in August (the reference month for a report generated Sept 1) is eligible per FR-1's literal text, but would show ineligible under the reused, month-scoped query. Both "units" — the AD-4 query and the eligibility check — separately satisfy their own AD; only their accidental merge breaks FR-1.

**Suggested fix:** name `CheckReportEligibilityService`'s query explicitly in the Structural Seed (e.g. `findProductsWithRepeatPurchases(companyId)` — no month/year params) as distinct from AD-4's `findProductsPurchasedInPeriod(companyId, month, year)`, so the two are visibly different signatures, not two callers of the same function.

---

## MEDIUM — No contract for numeric/currency shape between Compose and Render

**The scenario:** the three source services already have three different ad hoc numeric conventions: `GetSavingsOpportunitiesService.estimatedLoss` is `Number(x.toFixed(2))` (plain rounded number, no currency formatting); `GetProductPriceIncreaseService.percentageChange`/`previousAverage` are similarly `Number(x.toFixed(2))`; `SuppliersService.getTopSellerSuppliers`'s "percentual do gasto total" (FR-4) has its own independent rounding. None of AD-1..AD-7 nor the Consistency Conventions table defines what `ComposeMonthlyReportService` hands to `RenderMonthlyReportEmailService` — raw numbers, pre-formatted pt-BR strings ("R$ 12,34", "15%"), or something typed in between.

A team building Compose could reasonably pass raw numbers through unchanged (staying out of "business logic," per AD-2); a team building Render could reasonably assume Compose already localized/formatted them (since Compose "knows" the domain values). Both comply with AD-2's letter ("Compose só orquestra, nunca reimplementa comparação") while disagreeing on where formatting — not comparison logic, but still a real contract — lives. Silent failure mode: double-formatted strings, or raw floats with no `R$`/`%` leaking into the email.

**Suggested fix:** add a Consistency Convention entry (or a typed `MonthlyReportContent` DTO in the Structural Seed) stating Compose always returns untouched numeric values in fixed units (money as plain `number` in BRL, percentage as 0–100) and all locale/currency formatting happens exclusively in Render.

---

## LOW — Manual/preview trigger (Deferred) intersecting AD-5's upsert semantics

The Structural Seed's sequence diagram uses "upsert" for the `PENDING` row, which is what makes AD-5's unique constraint idempotent against re-runs. The Deferred section explicitly leaves the manual/preview trigger (PRD SM-2) undecided — "pode ser um script, um endpoint interno... decidir na quebra em stories." If that story is built without re-reading the sequence diagram's specific verb and uses a plain `create()` instead of `upsert()`, a second manual run for a cycle that already has a row (e.g., retrying after a `FAILED` status) throws a unique-constraint violation instead of transitioning the row, which is a materially different failure mode than AD-5 intends. Worth a one-line note in the Deferred entry when this story is scoped: "must reuse the same upsert-by-`(companyId, referenceMonth, referenceYear)` path as the monthly cron, not a fresh `create()`."
