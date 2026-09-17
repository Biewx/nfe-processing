# Reconciliation: brief.md vs prd.md

Source input: `briefs/brief-nfe-processing-2026-09-10/brief.md`
Derived PRD: `prds/prd-nfe-processing-2026-09-14/prd.md`

Scope of this reconciliation: gaps only — content, nuance, or intent from the brief that got silently dropped or contradicted in the PRD. Decisions explicitly made *during* PRD drafting (eligibility threshold, "Situação Normal", supplier-concentration context line, per-company failure handling) are treated as correct and intentional, not gaps, per the task brief.

## Gaps found

1. **Long-term product evolution ("descobrir a perda" → "recomendar a ação") is dropped, not just deferred.**
   The brief's closing "Visão" section describes two axes of future growth: (a) channel — from monthly email to near-real-time WhatsApp alerts, and (b) *capability* — from "descobrir a perda" (discover the loss) to "recomendar a ação" (recommend the action: trocar de fornecedor, renegociar). The PRD's Non-Goals (§5) captures axis (a) — WhatsApp is named as the "cotovelo natural" — but axis (b) does not appear anywhere in the PRD: not in §1 Vision, not in §5 Non-Goals, not in §8 Open Questions. This matters because CLAUDE.md's product vision explicitly names "recomendação de melhor fornecedor" as the direction the product should grow toward, and the brief is the one document that ties this specific report to that longer arc. Anyone building architecture or epics from the PRD alone loses that directional thread — the report reads as a terminal feature ("send today's numbers") rather than step one toward a recommendation engine.

2. **The core pain point's epistemic hedge is structurally decoupled from the claim it qualifies.**
   In the brief, the pain-point paragraph ("Pequenos negócios... não têm visibilidade sistemática sobre se estão pagando o preço certo") is immediately followed, in the same section, by: "**Importante: esta dor ainda não foi validada com nenhum dono de negócio real** [...] Tratar como validada seria enganoso." The two sentences are inseparable in the brief — you cannot read the claim without the caveat.
   In the PRD, the identical claim reappears twice with no local hedge: §1 Vision ("...não tem visibilidade sistemática sobre se está pagando o preço certo") and §2.1 Jobs To Be Done ("...querem saber [...] se estão pagando o preço certo"). Both read as settled fact. The equivalent caveat does exist in the PRD, but only in §7 SM-C2 and §8 Open Question 3 — five and seven sections away from the claim, in parts of the document a reader focused on "what are we building and for whom" (§1–§2) may never reach. See also the Tone section below — this is the specific "hypothesis silently upgraded to fact" risk the task asked to check for.

3. **The specific competitive contrast ("why this beats quotation platforms") has no home in the PRD.**
   The brief's differentiation argument is concrete and mechanism-level: automatic NFe-based data entry is different from "plataformas de cotação (que dependem de pedir orçamento ativamente a fornecedores cadastrados)." This is the brief's actual argument for *why* the product is lighter than alternatives. The PRD's only competitive-landscape content is §8 Open Question 2, which discusses a different competitor ("Qive," enterprise/consultivo, presumably from `addendum.md`) — a supersession that may be intentional (addendum has fuller research), but it means the brief's original "vs. quotation platforms" reasoning is nowhere in the PRD, superseded or dropped without a trace either way. Worth confirming with Gabriel whether this was a deliberate replacement or just fell through the cracks between brief and PRD-drafting conversation.

4. **"Não é um fosso defensável" is genericized into "não comprovada."**
   The brief has a standalone, deliberately blunt caution, separate from the assumption about the differentiation itself: "Isso ainda não é um fosso defensável — é uma leitura de mercado, não um diferencial comprovado." This isn't just "we're not sure it's different" (that's the `[ASSUMPTION]` one line above it) — it's a second, sharper warning not to treat the differentiation as a strategic moat even if it holds. The PRD folds both into one line in §8 OQ2: "Diferenciação competitiva não comprovada." The substance survives; the specific "moat" framing — which is the more actionable warning against over-investing in this as a defensible edge — does not. Minor relative to #1–#3, but consistent with the same pattern: sharper epistemic cautions in the brief become flatter, more generic uncertainty notes in the PRD.

5. **(Minor/note only) "sem domínio próprio" dropped from MVP Scope wording.**
   Brief's Escopo says the email goes out via "Brevo (SMTP, remetente individual verificado, **sem domínio próprio**)." PRD §6.1 keeps "remetente individual verificado" but drops "sem domínio próprio." Given §0 of the PRD explicitly routes email-provider rationale to `addendum.md`, this is plausibly just relocated, not lost — flagging for completeness rather than as a real gap.

## Tone/intent preserved or lost

Mostly preserved, with one real erosion worth naming directly.

**Preserved well:**
- The "no real users yet, these are iteration metrics not business metrics" framing survives almost verbatim from brief §Critérios de Sucesso into PRD §7, including the explicit refusal to treat the central value hypothesis as measurable this round (SM-C2).
- The niche-breadth `[ASSUMPTION]` ("aposta deliberada... também um risco em aberto... não uma decisão fechada com convicção") is carried into PRD §2.2 almost word-for-word — this is the strongest example of the PRD *correctly* preserving the brief's honesty about an open bet.
- SM-C1 (don't optimize for alert volume at the cost of precision, because false positives destroy trust faster than a quiet month) is new phrasing but faithfully extends the brief's spirit — no issue here.
- The "não é nunca, é não agora" (deferred, not cancelled) framing for out-of-scope items survives in substance for individual items (WhatsApp as "cotovelo natural," test data as "não bloqueia esta iniciativa"), even though the brief's blanket one-line framing covering the whole list isn't restated as a general principle in the PRD.

**Where hypothesis risks reading as fact:**
As detailed in Gap #2, the PRD does not accidentally *state* the core pain as validated anywhere (no false claim of evidence is introduced), but it does let the claim stand unhedged in the two sections (§1 Vision, §2.1 JTBD) a downstream reader is most likely to build assumptions from, before the hedge shows up in §7/§8. This is not a factual contradiction of the brief — it's a placement problem. A downstream `bmad-architecture` or `bmad-create-epics-and-stories` pass that reads §1–§4 (which is a normal way to consume this document) and stops before §7–§8 would walk away treating "pequenos negócios não sabem se pagam o preço certo" as established truth rather than an explicitly unvalidated hypothesis, which is exactly the outcome the brief's author went out of their way to warn against ("Tratar como validada seria enganoso").

Recommend: add a one-line pointer in §1 Vision or §2.1 (e.g., "ver §8 OQ3 — hipótese não validada em campo") so the hedge travels with the claim, the way it does in the brief.

## Nothing to report

N/A — see Gaps found above.
