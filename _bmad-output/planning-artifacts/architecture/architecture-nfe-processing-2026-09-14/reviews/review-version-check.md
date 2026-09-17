---
review: version-check
target: ARCHITECTURE-SPINE.md (monthly-report, 2026-09-14)
reviewer-lens: "toda decisão de stack/versão foi web-pesquisada ou checada contra a realidade (repo/starter), não apenas assumida do treino"
date: 2026-09-14
---

# Review — Version & Reality Check

**Verdict:** The headline conclusions (Nest 11 compatibility, Brevo's 300/day, nodemailer's own TS types) are directionally correct, but the spine contains one claim explicitly tagged "verificado 2026-09-14" that is factually wrong when checked against the real npm registry, and the Node-runtime compatibility bridge for nodemailer is an inference from `@types/node`, not something actually checked against this repo — so this does not pass clean as written.

## Critical

### C-1 — `@nestjs/schedule` peerDependencies claim is wrong, despite being tagged "verificado 2026-09-14"

- **Spine text (Stack table):** "`@nestjs/schedule` ^12.0.1 (peerDependencies aceita `@nestjs/common` ^10||^11 — compatível com o Nest 11 do projeto; verificado 2026-09-14)"
- **Checked:** Fetched the real npm registry entry and the exact pinned version's package.json.
  - `https://registry.npmjs.org/@nestjs/schedule` → `dist-tags.latest` = `12.0.2`; version history …10.0.x, 11.0.0, 12.0.0, 12.0.1, 12.0.2.
  - `https://unpkg.com/@nestjs/schedule@12.0.1/package.json` (the exact version cited) → `peerDependencies`: `"@nestjs/common": "^11.0.0 || ^12.0.0"`, `"@nestjs/core": "^11.0.0 || ^12.0.0"`.
  - `https://unpkg.com/@nestjs/schedule@12.0.2/package.json` → same peer range.
- **Finding:** The actual peer range is `^11.0.0 || ^12.0.0`, **not** `^10.0.0 || ^11.0.0` as written. The bottom-line conclusion ("compatible with the project's Nest 11", confirmed against `package.json`: `@nestjs/common`/`@nestjs/core` are `^11.0.1`) happens to still hold, only because `^11` appears in both the real and the stated range — but the specific fact cited was not actually read from the package, it was asserted. This is precisely the failure mode this gate exists to catch: a "verified" tag attached to a claim that doesn't survive an actual check. Anyone trusting the tag and building on "supports Nest 10 too" (e.g. for a future downgrade path) would be building on a fabricated fact.
- **Action:** Correct the Stack table entry to the real range and re-verify the whole line was checked against the registry/unpkg (not recalled), or drop the specific peer-range claim and keep only "compatible with Nest 11 (confirmed via npm registry, 2026-09-14)".

## High

### H-1 — Node runtime floor for nodemailer is asserted from `@types/node`, not checked against the repo

- **Spine text (Stack table):** "`nodemailer` ^10.0.10 … requer Node ≥20; projeto já presume Node atual via `@types/node` ^24"
- **Checked:**
  - `https://registry.npmjs.org/nodemailer/latest` → `version: 10.0.10`, `engines: {"node": ">=20.0.0"}`. Version number and Node floor are both accurate.
  - Repo `package.json` → no `engines` field at all.
  - Repo search for `.nvmrc`, `Dockerfile*`, `.github/workflows/*` → none exist (only an unrelated `.nvmrc` inside `node_modules/tsconfig-paths-webpack-plugin`).
- **Finding:** `@types/node ^24` is a dev-time TypeScript typings package — it has zero effect on which Node binary actually runs `npm run start:dev` or a future `node dist/main` in production. There is currently **nothing in this repository** — no `engines` field, no `.nvmrc`, no container/CI pin — that guarantees the runtime is even Node ≥20, let alone "Node atual". If a contributor or a deploy target is on Node 18 (still common, still one major below the requirement), nodemailer 10.x will fail at runtime the moment `SendMonthlyReportEmailService` is exercised, and nothing in the toolchain will have warned anyone beforehand.
- **Also relevant:** as of the spine's own date (2026-09-14), Node 20 itself is already end-of-life (EOL 2026-04-30, per nodejs.org release schedule); the practically sane floor for a project starting now is Node 22 (Maintenance LTS, EOL 2027-04-30) or Node 24 (Active LTS). Phrasing the requirement as "Node ≥20" reads as if 20 were still a live target rather than already unsupported upstream.
- **Action:** Add an explicit `engines.node` field to `package.json` (e.g. `>=22`) as part of this feature's setup, and consider `.nvmrc`, since this is the first dependency in the project with a hard runtime-version floor. Don't rely on `@types/node`'s version as a proxy for the runtime.

### H-2 — nodemailer v10 is very freshly released; the spine doesn't flag the stabilization risk

- **Checked:** `https://github.com/nodemailer/nodemailer/blob/master/CHANGELOG.md`.
- **Finding:** `nodemailer@10.0.0` was published 2026-09-03 — 11 days before this spine — as a rewrite ("migrate to TypeScript with ES module and CommonJS builds") that also dropped everything below Node 20. In the 11 days since, it has shipped **ten** patch releases (10.0.1 → 10.0.10), fixing real correctness bugs: DKIM header unfolding and SMTP reply reassembly not running in linear time, MIME boundary/control-character handling, double base64-encoding of Buffer input, Windows attachment path handling, address-parsing edge cases. That cadence is a signal the v10 rewrite is still actively settling, not a mature, quiet release line.
- **Action:** Not a blocker — the version and Node-floor facts in the spine are accurate — but for a production email-sending feature with per-company failure handling (AD-7) and volume-sensitive scheduling (AD-6), the spine or its Deferred section should note this recency explicitly (e.g., "pin the exact patch used at implementation time and re-check the changelog before go-live" rather than treating `^10.0.10` as an unremarkable, settled choice).

## Medium

### M-1 — `@nestjs/schedule` version cited (`^12.0.1`) is already one patch behind npm's actual latest (`12.0.2`)

- **Checked:** `https://registry.npmjs.org/@nestjs/schedule` → `dist-tags.latest` = `12.0.2`.
- **Finding:** No functional impact — the caret range `^12.0.1` resolves to `12.0.2` on install regardless. But an architecture doc that specifically annotates a version as "verificado 2026-09-14" should reflect what the registry actually shows as latest on that date, not a version one step behind it. Combined with C-1 (wrong peerDependencies for that same line), this reinforces that the verification for this row wasn't done by actually opening the registry at write time.
- **Action:** Cosmetic fix — update the table to `^12.0.2` or note explicitly that `^12.0.1` was the pin intentionally (e.g., to avoid a same-day release), if that was the actual reasoning.

## Low (confirmed correct — no action needed, listed for completeness)

- **L-1 — Nest version match.** `package.json` has `@nestjs/common`/`@nestjs/core` at `^11.0.1`. Spine's "compatível com o Nest 11 do projeto" premise is correct, independent of the wrong peer-range text in C-1.
- **L-2 — nodemailer ships its own TS types.** Confirmed via changelog: v10.0.0 "migrate to TypeScript with ES module and CommonJS builds" — the spine's "tipos próprios, sem `@types/nodemailer`" is accurate; no `@types/nodemailer` install is needed or would even be meaningful for v10.
- **L-3 — Brevo free tier: 300 emails/day.** Confirmed across Brevo's own site (brevo.com/free-smtp-server, brevo.com/pricing) and independent 2026 pricing writeups: free forever, no credit card, 300 emails/day, sender must be individually verified, sent from a shared IP by default (dedicated IP is a paid add-on). Matches the spine's claim exactly, including the "remetente individual verificado" detail.
- **L-4 — `@nestjs/schedule` still exists, is still the official Nest scheduling package, and is actively maintained** (latest release 12.0.2, regular version history through 2026). No superseding/deprecated-package concern.
- **L-5 — AD-1's module-boundary claim about the existing codebase is accurate, not asserted.** Read `insights.module.ts` and `analytics.module.ts`: both declare `PrismaService` as their own provider (`import { PrismaService } from "prisma/prisma.service"` + listed in `providers`) rather than importing `PrismaModule`. `invoice.module.ts` is the one existing module that does `import { PrismaModule } from "prisma/prisma.module"` and lists it in `imports`. This matches the spine's stated inconsistency exactly and confirms it was checked against the real repo rather than assumed.

## Sources

- https://registry.npmjs.org/@nestjs/schedule
- https://unpkg.com/@nestjs/schedule@12.0.1/package.json
- https://unpkg.com/@nestjs/schedule@12.0.2/package.json
- https://registry.npmjs.org/nodemailer/latest
- https://github.com/nodemailer/nodemailer/blob/master/CHANGELOG.md
- https://www.brevo.com/free-smtp-server/
- https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans (referenced via search snippet; direct fetch returned 403)
- https://nodejs.org/en/about/eol (via search snippet on Node LTS schedule)
- Repo: `C:\Users\Gabriel\OneDrive\backup\package.json`, `src\v1\modules\invoice\invoice.module.ts`, `src\v1\modules\insights\insights.module.ts`, `src\v1\modules\analytics\analytics.module.ts`
