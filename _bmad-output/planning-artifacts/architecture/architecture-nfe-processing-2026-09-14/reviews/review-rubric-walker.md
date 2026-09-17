# Rubric Walker Review — ARCHITECTURE-SPINE.md (monthly-report)

**Verdict:** Changes requested — the paradigm, module-boundary rule, and idempotency/failure-isolation design are sound and mostly ratify the brownfield code, but two ADs (AD-4, AD-6) make claims that are factually wrong against the actual codebase/constraint they cite, and one integration step required for `@nestjs/schedule` to work at all is missing from the seed — each of these is exactly the kind of thing that lets two implementers of the level below diverge (or silently build a job that never fires, or an alert that's never actually period-scoped).

---

## Critical

### C1 — AD-6's "distribute across the day" does not prevent the problem it names, and is silent on the real hard-cap case
**Location:** `ARCHITECTURE-SPINE.md:69-73` (AD-6)

AD-6's stated `Prevents` is "estourar o limite diário do Brevo (300/dia) disparando tudo de uma vez." But Brevo's 300/day is a **calendar-day total quota**, not a burst/rate limiter (confirmed by the addendum's own framing: "300 e-mails/dia grátis para sempre" — `addendum.md:25`). Spreading a fixed number of sends across the same calendar day changes *when* the quota is consumed, not *how much* — 280 emails sent in one burst at 00:05 and 280 emails trickled from 00:05 to 23:55 both consume 280 of the 300-per-day quota. Pacing cannot make a same-day total fit under a same-day cap it already fits under, and it cannot make a same-day total that *exceeds* 300 fit either. Two consequences AD-6 doesn't address:

1. If the real risk is a Brevo-side per-minute/per-connection SMTP throttle (a real, different thing many free SMTP relays enforce), the AD should say that explicitly and size the drain interval/batch against *that* number — not against the 300/day figure, which pacing can't help with.
2. If `empresas × usuários elegíveis` for a single cycle actually exceeds 300 (not just 250), no amount of intra-day spreading avoids breaching the quota — some companies will simply fail to send that day. The spine has no rule for this case (roll over to next day? mark FAILED immediately? never discussed).

**Fix:** Rewrite AD-6's `Prevents`/`Rule` to name the actual mechanism being guarded against (burst/connection-rate throttling vs. calendar-day quota), and add an explicit rule for what happens when total eligible recipients for a cycle exceeds 300 (e.g., cap sends at 300/day and carry the remainder to the next day's drain window, with its own idempotency implication for AD-5).

### C2 — AD-4 asserts `GetProductPriceIncreaseService` is already period-scoped; it is not
**Location:** `ARCHITECTURE-SPINE.md:57-61` (AD-4), specifically the line "Nenhuma modificação em `GetProductPriceIncreaseService` é necessária — ele já aceita período via `FiltersDto`."

Checked against the actual code:
- `src/v1/modules/insights/services/get-product-price-increase.service.ts:15-20` only reads `params.productId` from the `FiltersDto` (to validate it's present) and forwards the whole `params` to the repository.
- `src/v1/modules/insights/repositories/insights.repository.ts:43-70` (`findPurchaseHistoryByProduct`) builds its `where` from `productId` and `companyId` only — `params.month`/`params.year` are never read. The result is ordered `issuedAt desc` over the **entire unbounded history** of that product; "current" is simply whatever purchase is most recent overall, "previous" is everything before it.

So calling `getProductPriceIncrease({ month, year, productId }, companyId)` for January and for August returns the **exact same result** today, because month/year are silently ignored. AD-4's premise that "monthly-report always passes the reference month" therefore does nothing to scope the alert to that month — the report's price-increase section would compare against whatever purchase is globally most recent at run time, not against the reported period. This also contradicts AD-4's own `Prevents` clause (which exists specifically to avoid duplicating date-scoping logic, on the assumption the service already has it).

Notably, AD-3 (`ARCHITECTURE-SPINE.md:51-55`) correctly identifies and fixes the *exact same class of bug* in `GetSavingsOpportunitiesService`/`findLatestPurchasePerProduct` — the spine author reasoned about this problem once and then missed the analogous case two ADs later.

**Fix:** Add a rule (either fold into AD-4 or a new AD-4a) requiring `findPurchaseHistoryByProduct` to bound its `where.invoice.issuedAt` by the given `month`/`year` window when present, mirroring AD-3's treatment of `findLatestPurchasePerProduct`. Without this, FR-3's alerts are not actually about "the period" in any report cycle.

---

## High

### H1 — `ScheduleModule.forRoot()` is never wired anywhere in the seed
**Location:** Stack table `ARCHITECTURE-SPINE.md:93` (adds `@nestjs/schedule`); Structural Seed `ARCHITECTURE-SPINE.md:100-101` (`monthly-report.module.ts # imports: InsightsModule, AnalyticsModule, PrismaModule, ConfigModule`)

`@nestjs/schedule`'s `@Cron()` decorator only registers with Nest's `SchedulerRegistry` if `ScheduleModule.forRoot()` has been imported somewhere in the module graph (conventionally `AppModule`, confirmed clean in `src/app.module.ts:8-18` which currently has no scheduling at all). The Structural Seed lists `monthly-report.module.ts`'s imports explicitly and omits it; nothing else in the spine mentions adding it to `AppModule` either. Left as-is, an implementer who takes the seed literally ends up with two `@Cron`-annotated methods that are silently inert — no error, no logs, the job just never runs. This is precisely the class of divergence a spine exists to prevent (one implementer happens to know the Nest gotcha, another doesn't).

**Fix:** Add `ScheduleModule.forRoot()` explicitly to the Structural Seed (either in `AppModule` or `MonthlyReportModule`'s imports list) and call it out as a one-line note, since it's a well-known but easy-to-miss integration step.

### H2 — AD-5's per-company audit granularity can't represent partial multi-user send failure
**Location:** `ARCHITECTURE-SPINE.md:63-67` (AD-5), `ARCHITECTURE-SPINE.md:75-79` (AD-7)

`MonthlyReportRun` is keyed `(companyId, referenceMonth, referenceYear)` — one row per company per cycle, status `PENDING → SENT | FAILED`. But FR-6 fans delivery out per-`User`, and every `Company` can have multiple `User`s (`prisma/schema.prisma:46-55`, no cardinality limit). AD-7 wraps "composição → render → envio" for a whole company in one `try/catch`; if sending succeeds for 2 of 5 users in a company and throws on the 3rd, the spine has no rule for what the row becomes: marking it `FAILED` overstates the failure (2 people did receive the report) and understates it if the loop happens to mark the row `SENT` after only logging the one bad send. Either way, SM-3 ("falhas de envio... ficam registradas e auditáveis") can't actually be satisfied at user granularity with this schema, only at company granularity — two implementers could reasonably build "stop at first user failure" vs. "best-effort all users, mark FAILED if any failed" and get different real-world delivery outcomes from the same spine.

**Fix:** Either (a) make `MonthlyReportRun` per `(companyId, userId, referenceMonth, referenceYear)` so per-recipient success/failure is directly representable, or (b) explicitly decide and document the company-level semantics (e.g., "best-effort: send to every user regardless of individual failures, mark FAILED only if *all* sends for the company failed, log each individual user failure via `Logger` without a DB row") so implementers don't have to invent this.

### H3 — AD-1's module graph diagram contradicts its own text and the Deferred retrofit item
**Location:** mermaid graph `ARCHITECTURE-SPINE.md:35-43`; Deferred bullet `ARCHITECTURE-SPINE.md:165`

The diagram draws `InsightsModule --> AnalyticsModule` and `InsightsModule --> PrismaModule` as part of the target graph. But AD-1's own rule text and the Deferred section ("Retrofitar os módulos existentes que já violam essa regra é decisão separada") both explicitly say `InsightsModule` keeps redeclaring `ExpensesService`/`AnalyticsRepository`/`PrismaService` as its own providers rather than importing those modules — confirmed still true in the code (`src/v1/modules/insights/insights.module.ts:13-27`, `imports: []`). The diagram shows an edge that this same document says will not exist after this feature ships. A story-writer skimming the diagram (the fastest thing to read in a spine) will reasonably conclude `InsightsModule` already imports `AnalyticsModule`/`PrismaModule`, and may either skip wiring `monthly-report`'s own direct imports of those modules (since "insights already brings them in") or attempt the retrofit inside this feature's scope by mistake.

**Fix:** Either split the diagram into "today" vs. "after this feature" graphs, or drop the two aspirational edges and annotate `InsightsModule`/`AnalyticsModule` nodes with a note like "still self-declares AnalyticsRepository/PrismaService as providers — see Deferred."

### H4 — No wiring for how a Product's description reaches a price-increase alert
**Location:** `ARCHITECTURE-SPINE.md:57-61` (AD-4), Capability Map row `ARCHITECTURE-SPINE.md:155`

FR-3 requires each alert to show "Produto, Fornecedor, percentual de aumento, preço anterior vs. preço atual" (`prd.md:80`). `GetProductPriceIncreaseService.getProductPriceIncrease` returns `Record<supplierId, {supplier, lastPrice, previousAverage, percentageChange, alert}>` — there is no product name/description anywhere in that payload (confirmed in `get-product-price-increase.service.ts:42-89`); the caller only knows which product it asked about because *it* supplied the `productId` in the request. AD-4 says monthly-report "levanta os `productId` distintos... e chama `getProductPriceIncrease(...)` uma vez por produto, mantendo só as entradas com `alert === true`," but never states how the resulting alert entries get the product's description attached back on before rendering (the loop variable holding the description is one level up the call stack from the filtered result). This is a small thing to under-specify but is exactly the kind of join two implementers will do differently (one attaches it eagerly per iteration, another tries to re-derive it from `productId` later and needs an extra query no one budgeted for).

**Fix:** Add one sentence to AD-4 or the Structural Seed: "`ComposeMonthlyReportService` pairs each filtered alert with the `description` already available from the distinct-products query (AD-4) before handing it to render — no additional product lookup is needed."

---

## Medium

### M1 — Timezone of the monthly cron trigger and of "mês anterior completo" is undecided and undeferred
**Location:** Consistency Conventions table `ARCHITECTURE-SPINE.md:87` (cron expression via `ConfigService`/`.env`); Deferred bullet on deploy environment `ARCHITECTURE-SPINE.md:166`

`@nestjs/schedule`'s `@Cron()` runs in the host process's local/system timezone by default (or an explicit `timeZone` option, not mentioned here). "Dia 1, de madrugada" (PRD `prd.md:102`, OQ4 `prd.md:160`) and "mês anterior completo" (FR-5) both depend on which timezone answers "what day/month is it." The existing codebase's own date-window code (`suppliers.service.ts:17-19`, `get-best-supplier.service.ts:110-119`) already constructs `Date` objects with the bare `new Date(year, month, day)` constructor, which resolves in the process's local timezone — so this ambiguity already exists in the brownfield code, but this feature is the first to tie it to a *scheduled trigger time*, not just a query filter. The "Ambiente de deploy" Deferred bullet discusses long-lived-process vs. serverless but never mentions timezone.

**Fix:** Either add a one-line AD ("cron and reference-period math both use `America/Sao_Paulo` explicitly via `@Cron(cron, { timeZone: 'America/Sao_Paulo' })`, independent of host OS timezone") or extend the existing deploy-environment Deferred bullet to explicitly flag timezone as a follow-on decision once hosting is chosen.

### M2 — Drain cron has no batch cap, which can recreate the burst AD-6 tries to avoid
**Location:** `ARCHITECTURE-SPINE.md:73` (AD-6 rule, drain cron)

"Um segundo `@Cron` de intervalo curto... busca `PENDING` com `scheduledAt <= now()`, envia e atualiza o status" has no `LIMIT`/batch size. If the process is down for part of a day (deploy, crash) and comes back up, every `PENDING` row whose `scheduledAt` has already passed gets dequeued and sent in the very next 10-minute tick — a burst, which is the exact scenario AD-6 exists to avoid. This compounds with C1: whatever throttling behavior AD-6 is actually protecting against (see C1) has no backstop if scheduledAt slots pile up.

**Fix:** Add a per-tick send cap (e.g., "drain sends at most N per tick, oldest `scheduledAt` first") to AD-6's rule.

---

## Low

### L1 — ER diagram omits `MonthlyReportRun.id`
**Location:** `ARCHITECTURE-SPINE.md:136-147`

Cosmetic only — the entity block lists `companyId, referenceMonth, referenceYear, status, errorMessage, scheduledAt, sentAt` but not a primary key field, unlike every other Prisma model in `schema.prisma` (all have `id Int @id @default(autoincrement())`). Doesn't block implementation since Prisma models need an `@id` regardless, but worth tidying so the illustration matches what will actually be migrated.

### L2 — `User` is absent from the ER diagram despite being the actual email recipient
**Location:** `ARCHITECTURE-SPINE.md:136-147`

The diagram only shows `Company ||--o{ MonthlyReportRun`. Given H2 above turns on exactly the Company↔User cardinality, a `Company ||--o{ User` edge (already in the real schema, `prisma/schema.prisma:41`) would have made the partial-failure gap easier to spot during review and would help implementers see the fan-out at a glance.

---

## What's solid (not findings, noted for balance)

- AD-1's diagnosis of the brownfield violation (`InsightsModule` redeclaring `ExpensesService`/`AnalyticsRepository`/`PrismaService` instead of importing) is verified accurate against `insights.module.ts:13-27` and `analytics.module.ts:11-22` — neither module currently has an `exports` array, matching the spine's claim.
- AD-3's fix to `GetSavingsOpportunitiesService`/`findLatestPurchasePerProduct` is well-reasoned and directly analogous to the bug missed in AD-4 (see C2) — the spine's own AD-3 is the evidence that the AD-4 gap is a real, catchable class of mistake, not a nitpick.
- The `ConfigService`/`.env` convention for SMTP creds and cron expression correctly mirrors the existing JWT secret pattern (`auth.module.ts:19-26`).
- `GET /analytics/topSeller` (`analytics.controller.ts:31-36`) and the "no `@UseGuards`/`CurrentUser`, iterate via Prisma directly" convention for a cron-triggered coordinator are both accurate to the current code and a sensible convention.
- FR-1 through FR-6 are all present in the Capability → Architecture Map, each pointing at a specific governing AD.
- No duplicate AD ids, no invalid Mermaid, no placeholder text found.
