# Development Status

This file records the single current roadmap part and its acceptance evidence. It is not a substitute for Git history or the detailed roadmap.

## Project state

- **Overall state:** Phase 1 security planning
- **Current approved part:** Phase 1 threat-model gate only
- **Part status:** Assessment complete — awaiting owner acceptance of the six security decisions
- **Next part:** Part 1.1 — Internal platform-owner password login, after the threat-model gate passes
- **Next part authorised:** No
- **Remote repository:** `https://github.com/mhassan-au/PieShop.git`
- **Last updated:** 2026-08-28 Australia/Sydney

## Current part objective

Review and accept the Phase 1 authentication and merchant-administration threat assessment before authorising product implementation.

## Acceptance source

See `doc/PART_0_4_ACCEPTANCE.md` and Part 0.4 in `doc/DEVELOPMENT_ROADMAP.md`.

## TDD evidence

- Acceptance examples confirmed: Yes — owner accepted Part 0.3 and authorised Part 0.4 on 2026-08-27 Australia/Sydney
- Failing tests observed: Yes — missing target guard, absent foundation tables, absent immutable triggers, missing deterministic seed, and missing health component were observed before implementation
- Minimum implementation completed: Yes
- Refactor completed: Yes — migrations, target guard, cloud command wrapper, read-only probes, transactional security tests, and health presentation are separated
- Cloud connection smoke: Passed — Auth and Data API accepted the development publishable key
- Migration/schema check: Passed — two forward migrations applied; six required foundation tables found
- RLS/authorization tests: Passed — 12 isolation, self-bound authorization, invitation, platform-privacy, and immutability assertions; synthetic records rolled back
- Hardening check: Passed — eight RLS tables, self-bound authorization helpers, two mutation triggers, and invitation constraints verified
- Deterministic seed check: Passed — synthetic development business applied idempotently
- Unit/component/tooling tests: Passed — 14 files, 48 tests
- Type check: Passed — TypeScript strict mode
- Formatting/lint: Passed
- Production build: Passed — Next.js 16.3.3
- Dependency scan: Passed — 0 vulnerabilities
- Secret scan: Passed
- Browser smoke test: Passed — desktop and mobile Chromium, 2 tests, no horizontal overflow
- Full quality gate: Passed

## User checkpoint

- Preview URL: Local `http://localhost:3100`
- UI/process check requested: Yes — database readiness/privacy panel ready for owner review
- User feedback: Health screen accepted; readiness was understandable and no credentials or private data were exposed
- User accepted current part: Yes — 2026-08-28 Australia/Sydney

## Notes and blockers

- Part 0.1 was accepted by the owner on 2026-08-27 Australia/Sydney.
- Part 0.2 was accepted by the owner on 2026-08-27 Australia/Sydney; implementation commit: `921e08c`.
- Part 0.3 was accepted by the owner on 2026-08-27 Australia/Sydney; implementation commit: `19dff04`.
- No real Telegram or Sentry transmission is authorised for this part's checkpoint. Tests and UI must use injected fake providers and synthetic data.
- Supabase log persistence/archive work remains deferred until the database foundation exists.
- Browser review found one page-level heading, four visible redactions, the no-transmission notice, and no horizontal overflow at 1280 px or 390 px.
- Sentry SDK is pinned at `10.71.0`; default integrations and default PII collection are disabled, and only the sanitised adapter may report exceptions.
- The owner selected Supabase Cloud instead of local Docker. Part 0.4 must target a dedicated disposable development/test project and must refuse destructive reset/test operations against staging or production.
- Supabase CLI `2.116.0` and Postgres.js `3.4.9` are pinned for the cloud migration/test harness.
- `20260827050000_foundation_security.sql` and `20260827060000_immutable_record_guards.sql` are applied to the confirmed development project.
- The owner explicitly authorised the disposable development database reset on 2026-08-28 Australia/Sydney. The guarded reset reapplied both migrations and deterministic seed data; all post-reset cloud checks passed.
- Authentication policy was revised on 2026-08-28: the owner manually creates the single platform-owner user in Supabase Auth, which uses email/password without MVP MFA; invited merchants use magic links with a server-enforced 30-day absolute session maximum. MFA and stricter sessions are mandatory before any real-vendor demo, real data, staging pilot, or production rollout.
- The retrospective Phase 0 threat model is recorded in `PHASE_0_THREAT_MODEL.md`. TM0-01 was mitigated by migration `20260828010000_self_bound_authorization_helpers.sql`: authorization helpers now derive identity from `auth.uid()`, unsafe signatures were removed, and the owner reported the hardening plus 12-assertion transactional security suites passed on 2026-08-28.
- The Windows secret-scan failure `spawnSync git ENOENT` was corrected with a tested Git executable resolver. Four tooling regression tests cover explicit configuration, invalid configuration, standard Windows installation discovery, and non-Windows PATH behaviour; the secret scan and complete quality gate passed afterward.
- Part 1.1 remains unauthorised pending the Phase 1 threat-model and acceptance gates.
- `PHASE_1_THREAT_MODEL.md` version 0.1 assesses 24 threats, defines verification requirements for Parts 1.1–1.4, records six security decisions and four phase-entry gates, and restricts the current design to private development with synthetic data. No Phase 1 product code has started.

## Completion record template

When the part is complete, record:

```text
Completed UTC: 2026-08-28
Commit:
Automated-check summary: 44 unit/component tests, 10 cloud security assertions, schema/seed/hardening probes, and 2 browser tests passed; formatting, lint, strict types, production build, dependency audit, and secret scan passed
Preview URL: http://localhost:3100
User UI/process feedback: Health screen accepted; readiness was understandable and no credentials or private data were exposed
Corrections completed: Guarded reset made non-interactive after the first CLI invocation cancelled at its confirmation prompt
User acceptance date: 2026-08-28 Australia/Sydney
Security/privacy notes: Cloud target guard, explicit least privilege, RLS, platform privacy, hashed invitations, and database mutation triggers implemented; secrets remain ignored locally
Documentation/ADR changes: Added cloud-only Supabase, passwordless/approved-device decisions, Part 0.4 acceptance contract, and environment catalogue updates
```
