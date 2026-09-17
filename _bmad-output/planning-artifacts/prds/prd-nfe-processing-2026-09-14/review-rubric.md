# PRD Quality Review — Relatório Mensal de Inteligência de Compras

## Overall verdict

This is a well-calibrated PRD for what it actually is: a pre-launch, internal-tool-stakes distribution feature for an existing analytics engine, and it does not pretend to be more than that. The thesis is sharp ("o problema não é falta de inteligência — é falta de acesso a ela"), every FR traces back to it, trade-offs are named as decisions rather than smoothed into "considerations" (the Brevo-vs-Resend call in the addendum is the clearest example), and open risks are self-flagged with unusual discipline (three `[ASSUMPTION]` tags, all indexed cleanly; two `[NOTE FOR PM]` at genuine deferred tensions; 7 Open Questions that are actually open). The two things that would trip up downstream work are narrow and fixable: one FR-level NFR sets a numeric limit (Brevo's 300/day) but leaves the actual trigger condition ("se aproximar desse limite") unquantified, and a domain term load-bearing for FR-4 ("Fornecedor principal") is used repeatedly but never added to the Glossary. Neither undermines the PRD's usefulness; both are quick fixes before architecture/story work leans on this document.

## Decision-readiness — strong

Decisions are stated as decisions, not hedged into neutrality. The email-provider choice lives in the addendum with the rejected alternative and the reason for rejection spelled out: "Decisão: Brevo, unicamente porque o projeto ainda não tem domínio próprio e Resend exigiria comprar/configurar um antes de enviar a qualquer pessoa fora da conta do Gabriel" (addendum, "Decisão de provedor de e-mail," lines 22–26) — what was given up (Resend's higher volume, 3.000/mês vs. Brevo's ~9.000/mês cap) is named, not buried. Non-Goals (§5) read the same way: each item carries a reason, not just a label (e.g. WhatsApp is "o cotovelo natural... mas não faz parte deste PRD").

The seven Open Questions (§8) are genuinely open — none is a rhetorical question answered in the next sentence. OQ2 ("Diferenciação competitiva não comprovada... Qive já cobre algo parecido") and OQ3 (value hypothesis untested) are real unresolved tensions carried faithfully from the addendum's market research, not smoothed over. The two `[NOTE FOR PM]` callouts (§5, lines 116 and 121) sit at real decision points — "quando considerar o e-mail validado o suficiente" gates a future channel investment — not at safe, already-answered checkpoints.

### Findings
- **low** Failure-handling trade-off stated but not weighed (§4 FR-6, lines 108–109) — "Se o envio falhar para uma Empresa, o sistema registra o erro e segue... sem interromper o job nem tentar reenviar automaticamente" is a real trade-off (simplicity over resilience — a company could silently miss a report for a cycle, or several in a row, with only passive log visibility) but it isn't framed as one, and no Open Question or NOTE FOR PM covers "what if the same Empresa fails repeatedly." *Fix:* either accept explicitly ("acceptable for v1 because X") or add a NOTE FOR PM on repeated-failure escalation.

## Substance over theater — strong

No persona theater: §2 uses a single JTBD framing with an explicit non-decision about vertical ("Nenhum nicho vertical específico foi escolhido ainda," tagged `[ASSUMPTION]`, §2.2) rather than manufacturing personas to look thorough. No innovation theater: the Vision (§1) doesn't claim novelty, and the addendum's competitive research reaches an honest "lacuna parcial, não total" conclusion (Qive already does something similar, just enterprise-packaged) rather than asserting a clean market gap. The Feature-specific NFR in §4 ("limite gratuito do Brevo (300 e-mails/dia)") is a concrete, product-specific number, not boilerplate "must be scalable." The Vision text is specific to this system — it names `savings_opportunities`, `product_history`, `topSeller` and the actual distribution gap ("só o Gabriel os vê") — it would not drop cleanly into another PRD unchanged.

No findings.

## Strategic coherence — strong

The thesis is explicit and load-bearing: the analytics engine already exists, the gap is distribution, and every FR (1–6) is scoped to "não introduz nenhuma análise nova... concentra o trabalho novo em elegibilidade, composição do texto, agendamento e envio" (§4.1, line 51). Nothing in the FR list reads as "capability someone wanted" outside that arc.

Success Metrics validate the thesis rather than measuring activity for its own sake: SM-1 checks the pipeline runs unattended, SM-2 checks comprehensibility, and both are explicitly scoped down given the pre-launch context ("avaliam esta iteração específica... não o produto como negócio," §7 preamble, line 141) — this is the PRD calibrating itself correctly rather than overclaiming. Counter-metrics are present and doing real work: SM-C1 explicitly forbids optimizing alert volume at the cost of precision, and SM-C2 keeps the untested core value hypothesis out of the success-metric set rather than dressing it up as measured. MVP scope logic matches a "problem-solving" shape (deliver existing value, don't add new analysis, don't build UX) consistently across §4, §6, and §5.

No findings.

## Done-ness clarity — adequate

Most FRs are unforgiving in the right way: FR-1 gives a literal, testable threshold ("ao menos 1 Produto comprado em 2 ou mais notas fiscais distintas"); FR-2 and FR-3 specify the exact fields each rendered item must show; FR-4 gives verbatim example copy for the Situação Normal branch ("Nenhuma mudança relevante de preço identificada este mês..."). No instances of "reasonable performance," "handles gracefully," or "user-friendly" appear anywhere in the FR set.

Two gaps keep this from "strong":

### Findings
- **medium** Brevo throttling trigger has no bound (§4, Feature-specific NFRs, line 112) — "Se o número de Empresas × Usuários elegíveis se aproximar desse limite, o disparo precisa ser distribuído ao longo do dia" leaves "se aproximar" undefined. This is the same shape of problem the rubric calls out for "reasonable performance" — there's a real number in the sentence (300/day) but no number for the trigger itself, so an engineer can't build a testable condition from it. *Fix:* pick a percentage or absolute headroom (e.g. "quando Empresas × Usuários elegíveis ultrapassar 250/dia") — note this is distinct from, and doesn't resolve, Open Question 4, which is about confirming the schedule, not the throttle trigger.
- **low** FR-4's two branches are specified at different levels of detail (§4 FR-4, lines 87–88) — Situação Normal gets verbatim example copy; the "linha fixa" about Fornecedor principal is described only as "framing de concentração (texto-modelo fixo)" without an example. *Fix:* either add example copy for symmetry or note explicitly that copy is deferred to implementation for both.

## Scope honesty — strong

Non-Goals (§5) does real work — every item carries a reason, not just a label, and §6.2 correctly avoids duplicating that rationale ("Mesma lista de §5 Non-Goals — sem duplicar o racional aqui"). The three `[ASSUMPTION]` tags (§2.2, §4 FR-1, §4 FR-5) all round-trip cleanly into the §9 Assumptions Index — nothing inline is missing from the index, nothing in the index lacks an inline tag. Given the explicitly agreed internal-tool/pre-launch stakes, the density of self-flagged uncertainty (7 Open Questions + 3 Assumptions + 2 NOTE FOR PM = 12 open items) is appropriate rather than alarming — this is a PRD being honest about a genuinely early-stage bet, not a green-light-to-scale document hiding behind hedges.

Where the task brief asked to check whether the self-flagging itself is adequate: it holds up. The competitive gap (Qive) is neither overstated as blue ocean nor buried — the addendum's own language ("evidência fraca-a-moderada, suficiente para prosseguir, não para reivindicar oceano azul validado") is appropriately calibrated, and §8 OQ2 carries it into the PRD body faithfully. The untested value hypothesis is flagged in four places (§2.2 framing, §5 Non-Goals, §7 SM-C2, addendum "Hipóteses não testadas") without inflating any of them into a false certainty.

One gap noted above under Decision-readiness (repeated send-failure escalation, §4 FR-6) is arguably also a scope-honesty item — it's a consequence stated as fact rather than flagged as a deliberately accepted risk — but it's low severity given the current single-operator reality of the project, so it isn't double-counted here.

No new findings beyond the cross-reference above.

## Downstream usability — adequate

This PRD explicitly feeds `bmad-architecture` and `bmad-create-epics-and-stories` (§0, line 13), so this dimension matters. FR/SM traceability is genuinely strong: every SM states which FRs it validates ("Valida FR-1, FR-5, FR-6," etc.), IDs are contiguous with no gaps (FR-1–FR-6, SM-1–SM-3, SM-C1–SM-C2), and cross-references resolve (§4 FR-4's "ver §5 Non-Goals," §8's "ver addendum" — the addendum exists and contains the referenced content).

### Findings
- **medium** "Fornecedor principal" is a load-bearing term never added to the Glossary (§4 FR-4, lines 84, 88; referenced again in §5 line 121 and §6.1 line 131) — the Glossary (§3) defines nine terms including adjacent ones like *Situação Normal* and *Limiar de Aumento*, but not the supplier-concentration concept that FR-4's second clause is built on ("linha fixa citando o Fornecedor principal do período e seu percentual do gasto total"). A story-writer or architect pulling FR-4 in isolation has no definition to source from. *Fix:* add a Glossary entry, e.g. "Fornecedor principal — o Fornecedor com maior percentual do gasto total da Empresa no período, calculado via `GET /analytics/topSeller`."
- **low** Minor glossary drift: "Alerta de Aumento de Preço" (as defined in §3) is shortened to "Alerta de Aumento" in a few places (§5, line 121; §7 SM-C1 prose, line 151). Doesn't cause ambiguity but is inconsistent. *Fix:* use the full glossary term or note the shorthand is intentional.

## Shape fit — strong

This is not a UJ-shaped product and the PRD correctly doesn't force it into one. The deliverable is a one-way, passive monthly email — there's no interactive flow for a named protagonist to walk through, and the PRD substitutes the right thing instead: a Glossary, FR-level consequences with example copy, and SM-to-FR traceability, which is the correct "capability/content-spec" shape for a notification artifact. The one place a UJ might have added value — what the recipient does after reading the email — is deliberately out of scope and tracked as the open, untested value hypothesis (§5, §7 SM-C2, §8 OQ3) rather than silently assumed away, which is the right call: forcing a UJ here would have required inventing a resolution to a question the PRD is honest about not having answered yet.

No findings.

## Mechanical notes

- Glossary: "Fornecedor principal" missing (see Downstream usability, medium finding above); "Alerta de Aumento de Preço" shortened inconsistently in a few spots (low, see above).
- ID continuity: FR-1–FR-6, SM-1–SM-3/SM-C1–SM-C2 all contiguous and unique; no duplicates or gaps found.
- Cross-references: all checked references (§4 FR-4 → §5; §5 → §8; §8 → addendum; §9 → inline `[ASSUMPTION]` tags) resolve to real content.
- Assumptions Index roundtrip: clean. 3 inline `[ASSUMPTION]` tags (§2.2, §4 FR-1, §4 FR-5), all 3 indexed in §9, nothing extra in either direction.
- Tag-format inconsistency (cosmetic): the §2.2 assumption uses bare `[ASSUMPTION]` with detail in the following sentence, while §4 FR-1 and FR-5 use the inline `[ASSUMPTION: detail]` form. Both resolve fine via the Index; not worth fixing unless the PRD template wants one convention enforced.
- UJ protagonist naming: not applicable — no UJs in this PRD, consistent with Shape fit judgment above.
- Required sections: all present for the agreed stakes (Vision, Target User, Glossary, Features/FRs, Non-Goals, MVP Scope, Success Metrics, Open Questions, Assumptions Index), plus a well-used addendum for content that would otherwise clutter the PRD body.
