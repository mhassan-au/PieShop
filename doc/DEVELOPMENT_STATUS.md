# Development Status

This file records the single current roadmap part and its acceptance evidence. It is not a substitute for Git history or the detailed roadmap.

## Project state

- **Overall state:** Phase 1 implementation
- **Current approved part:** Part 1.1 — Internal platform-owner password login
- **Part status:** Acceptance examples accepted — TDD implementation started
- **Next part:** Part 1.2 — Merchant list and create form
- **Next part authorised:** No
- **Remote repository:** `https://github.com/mhassan-au/PieShop.git`
- **Last updated:** 2026-08-30 Australia/Sydney

## Current part objective

Implement the private, synthetic-data-only platform-owner email/password login with authoritative role checks, revocable bounded sessions, enumeration resistance, and a preserved production AAL2 gate.

## Acceptance source

See `doc/PART_1_1_ACCEPTANCE.md`, `doc/PHASE_1_THREAT_MODEL.md`, and Part 1.1 in `doc/DEVELOPMENT_ROADMAP.md`.

## TDD evidence

### Current Part 1.1

- Acceptance examples confirmed: Yes — Mehedi Hassan accepted all 26 threat-mapped examples on 2026-08-30 Australia/Sydney
- Slice 1 red observed: Yes — authentication message keys and the login-input/safe-redirect modules were absent; 3 files failed
- Slice 1 green: Passed — 34 focused assertions cover central authentication copy, strict/mass-assignment-safe credentials, and control-plane-only redirects
- Slice 2 red observed: Yes — the Supabase owner-auth adapter was absent; its focused suite failed
- Slice 2 green: Passed — 4 focused assertions cover token discard, safe credential rejection, provider outage mapping, and missing-identity fail-closed behavior
- Slice 3 red observed: Yes — the authoritative platform-owner policy and Supabase current-role repository were absent, and the provider identity lacked an explicit assurance level
- Slice 3 green: Passed — 14 focused assertions cover self-bound active/missing/inactive role lookup, fresh checks after role change, database failure, AAL1 development access, and the blocking AAL2 release policy
- Slice 4 red observed: Yes — owner session lifecycle and opaque credential modules were absent
- Slice 4 green: Passed — 18 focused assertions cover exact 12-hour absolute and 2-hour idle boundaries, activity without absolute extension, revocation, invalid chronology, 256-bit base64url credentials, SHA-256 hashes, and malformed-cookie rejection
- Slice 5 red observed: Yes — the owner-session persistence migration was absent; 4 migration-contract assertions failed
- Slice 5 local green: Passed — 4 migration-contract assertions verify hash-only storage, exact deadlines, full table privilege revocation, Data API-accessible but self-bound safe-list/create/touch/revoke RPCs, and append-only audit events; guarded cloud dry-run found exactly one pending migration
- Approved dependencies: `@supabase/ssr` `0.12.4` and `@supabase/supabase-js` `2.112.4`, exact-pinned; installation audit reported 0 vulnerabilities
- UI checkpoint prepared: `UI_TEST_CHECKLISTS.md` contains the shared milestone checklist and Part 1.1 login/session cases
- Implementation status: In progress — session migration awaits explicit cloud-apply approval; direct server-entry integration, throttling/audit orchestration, and UI remain; manual UI testing is not ready

### Completed foundation

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
- `PHASE_1_THREAT_MODEL.md` version 1.0 assesses 24 threats, defines verification requirements for Parts 1.1–1.4, records six accepted security decisions and four phase-entry gates, and restricts the current design to private development with synthetic data. No Phase 1 product code has started.
- The owner accepted all six Phase 1 security decisions and authorised Part 1.1 on 2026-08-30 Australia/Sydney. Mehedi Hassan accepted the 26 Part 1.1 examples and authorised TDD implementation on the same date.
- On 2026-08-30, the owner accepted ADR-022: application-level encryption for customer contact/location data, notes/messages, order-address snapshots, merchant bank/PayID settings, and provider secrets, with separately keyed HMAC blind indexes for exact phone/email lookup. This becomes a blocking Phase 3 entry requirement and does not expand current Part 1.1 implementation.

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
