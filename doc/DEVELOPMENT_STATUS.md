# Development Status

This file records the single current roadmap part and its acceptance evidence. It is not a substitute for Git history or the detailed roadmap.

## Project state

- **Overall state:** Phase 1 implementation
- **Current approved part:** Part 1.3 — Secure merchant invitation
- **Part status:** Acceptance contract and TDD implementation authorized
- **Next part:** Part 1.4 — Account status and onboarding progress
- **Next part authorised:** No
- **Remote repository:** `https://github.com/mhassan-au/PieShop.git`
- **Last updated:** 2026-09-01 Australia/Sydney

## Current part objective

Build a scanner-resistant, recipient-bound merchant invitation lifecycle with single-use hashed tokens, atomic membership creation, and a revocable 30-day merchant session.

## Acceptance source

See `doc/PART_1_3_ACCEPTANCE.md`, `doc/PHASE_1_THREAT_MODEL.md`, and Part 1.3 in `doc/DEVELOPMENT_ROADMAP.md`.

## TDD evidence

### Current Part 1.3

- Authorization: Mehedi Hassan accepted the Part 1.2 UI and authorized grouped Part 1.3 implementation on 2026-09-05 Australia/Sydney
- UI verification approach: Codex performs small in-app browser checks after grouped changes; the owner performs the final manual UI/process checkpoint after the major invitation feature
- Slice 1 red observed: Yes — the secure invitation-token module was absent and its focused suite failed to resolve
- Slice 1 token primitive: Passed — 4 focused assertions cover 256-bit URL-safe randomness, deterministic SHA-256 storage hashes, strict malformed-token rejection, and the inclusive 24-hour UTC expiry boundary
- Slice 2 red observed: Yes — all 4 invitation lifecycle migration assertions failed because the migration was absent
- Slice 2 lifecycle migration: Passed — owner-authorized migration `20260905010000_secure_merchant_invitation_lifecycle.sql` is applied; issue/rotation and idempotent revoke are self-authorizing, row-locked, cooldown-protected, redacted, and audited. Remote dry-run is clean; foundation schema/hardening pass and 12 isolation/immutability assertions pass with synthetic rollback
- Implementation status: In progress — secure lifecycle storage is ready; delivery adapter/provider, redemption, merchant session, and UI remain

### Completed Part 1.2

- Authorization: Mehedi Hassan activated quick mode and authorized Part 1.2 implementation on 2026-09-01 Australia/Sydney using onboarding status, AUD, Australia/Sydney, and draft-not-sent owner invitations
- Slice 1 metadata boundary: Passed — 15 focused assertions cover normalization, strict/mass-assignment-safe create input, AUD/IANA validation, allow-listed output mapping, and structural rejection of catalogue, transaction, payment, bank, customer, address, message, and order fields
- Slice 2 migration contract: Passed locally — 5 migration assertions cover onboarding/AUD schema, token-free draft invitations, platform-owner-only list/create RPCs, transactional duplicate serialization, safe audit context, narrow grants, forbidden-field absence, and regression protection against PostgreSQL null-byte lock keys
- Slice 2 development database: Owner-authorized Part 1.2 migration applied successfully; remote dry-run reports no pending migrations, foundation schema found all six required tables, 12 transactional isolation/immutability assertions passed with rollback, and hardening/RLS/invitation checks remain green
- Slice 3 repository boundary: Passed — 22 grouped metadata/migration/repository assertions cover exact RPC calls, normalized parameter mapping, runtime allow-list validation, forbidden-row rejection, contradictory create-result rejection, and provider-detail redaction; TypeScript and targeted lint pass
- Slice 4 protected UI/action: Passed — the create action re-authorizes before strict input parsing and persistence, extracts only four approved fields, uses central safe copy, and revalidates only `/control`; responsive list/create UI renders operational metadata only with accessible persistent labels, pending feedback, empty state, onboarding status, and draft-invitation state
- Slice 4 release gate: Passed — 42 test files and 211 assertions, formatting/lint/TypeScript, production build, secret scan, dependency audit with 0 vulnerabilities, and 8 desktop/mobile browser regressions
- Slice 4 database repair: Passed — the first owner UI create attempt failed before persistence with PostgreSQL `54000` because the advisory-lock text key contained `chr(0)`. Migration `20260901040000_fix_platform_merchant_lock_key.sql` replaces it with `chr(31)`; the owner authorized its development deployment, remote dry-run is clean, and a rollback-safe live RPC check passed creation and duplicate idempotency without retaining synthetic data
- Manual UI checkpoint: Accepted by Mehedi Hassan on 2026-09-05 Australia/Sydney after the live lock-key repair
- Implementation status: Complete — automated gates and rollback-safe cloud RPC evidence pass, and the owner accepted the merchant list/create process

### Completed Part 1.1

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
- Slice 5 development database: Owner-authorized migration applied successfully; the follow-up guarded dry-run reported the remote database up to date with no pending migrations
- Slice 6 red observed: Yes — the Supabase owner-session repository module was absent and its focused suite failed to resolve the import
- Slice 6 green: Passed — 4 repository assertions cover hash-only create/touch calls, safe metadata mapping, self-bound revocation calls, runtime response validation, and redacted provider failures; migration plus repository suites total 8 passing assertions, with targeted lint and TypeScript green
- Slice 7 red observed: Yes — the owner-session cookie contract module was absent and its focused suite failed to resolve the import
- Slice 7 green: Passed — 5 cookie assertions cover secure `__Host-` behavior outside local HTTP, local/test compatibility, HttpOnly/SameSite/path/priority controls, exact 12-hour browser lifetime, scope-matched clearing, and malformed-token rejection; cookie, token, and repository suites total 18 passing assertions, with targeted lint and TypeScript green
- Slice 8 red observed: Yes — the owner login orchestration module was absent and its focused suite failed to resolve the import
- Slice 8 green: Passed — 5 orchestration cases cover authentication/authorization/persistence ordering, hash-only persistence, generic credential rejection, inactive or missing-role cleanup, and fail-closed persistence cleanup; the Supabase adapter now terminates only its local provider session
- Slice 8 release gate: Passed — 25 test files and 129 assertions, full lint and TypeScript, production build, secret scan, and dependency audit with 0 vulnerabilities; no route/UI changed, so browser E2E remains deferred to the UI integration checkpoint
- Slice 9 red observed: Yes — the Supabase server-cookie policy module was absent; its focused contract could not load
- Slice 9 green: Passed — 3 provider-cookie assertions enforce HttpOnly/SameSite/root-path controls, strip unsafe caller scope, preserve safe lifetime fields, and permit insecure transport only for local/test HTTP
- Slice 9 server boundary: Added a request-scoped server-only Supabase client and an unexposed login Server Action that filters `FormData`, applies the environment AAL policy, sets only the hardened PieShop cookie after success, and attempts both database revocation and provider sign-out if cookie persistence fails
- Slice 9 release gate: Passed — 26 test files and 132 assertions, full formatting/lint/TypeScript, production build, secret scan, and dependency audit with 0 vulnerabilities; the action remains unreachable until a reviewed page imports it, so browser E2E remains deferred
- Slice 10 red observed: Yes — current-owner verification and protected-access service modules were absent; their focused contracts could not load
- Slice 10 green: Passed — provider-verified `getUser()` identity and current AAL, malformed/missing-cookie short-circuiting, fresh database role checks, hash-only live-session touch, inactive-role denial, and revoked/expired-session denial are covered; provider details fail closed
- Slice 10 refresh boundary: Added a Next.js 16 `/control/:path*` proxy used only for provider-cookie refresh, with all cookies updated atomically, hardened response cookies, and provider no-cache headers; 6 matcher assertions prove it excludes public paths, while authorization remains inside the reusable server-only request guard
- Slice 10 release gate: Passed — 29 test files and 148 assertions, full formatting/lint/TypeScript, production build with Proxy recognized, secret scan, and dependency audit with 0 vulnerabilities
- Slice 11 red observed: Yes — the owner login form and metadata-only control shell components were absent; their focused component contracts failed to resolve
- Slice 11 green: Passed — the accessible password form, persistent labels/autocomplete, absence of signup/recovery actions, central authentication copy, and forbidden merchant-business-content shell assertion are covered; successful login redirects server-side only after the hardened cookie is written
- Slice 11 release gate: Passed — 31 test files and 157 assertions, full formatting/lint/TypeScript, production build with static `/login`, dynamic `/control`, and Proxy recognized, secret scan, and dependency audit with 0 vulnerabilities
- Slice 11 browser gate: Passed — 8 desktop/mobile Chromium scenarios cover responsive login rendering, no public account paths, central malformed-input wording, signed-out direct `/control` redirection, existing foundation-shell regression, and no unexpected browser console errors in the reviewed rendering flow
- Slice 12 red observed: Yes — the process-local owner login limiter was absent and its focused suite failed to resolve; the orchestration contract then proved throttling was not wired before provider authentication
- Slice 12 green: Passed — 4 limiter and 6 orchestration assertions cover normalized-account and source limits, rolling-window expiry, successful-account reset, ephemeral keyed identifiers, injected time/storage behavior, and provider bypass when throttled; central generic throttle copy is wired into the login action
- Slice 13 red observed: Yes — the exact-current-session logout RPC and logout orchestration were absent; focused migration, repository, service, copy, and UI contracts failed before implementation
- Slice 13 local green: Passed — 30 focused assertions cover exact hash-bound self-only revocation, append-only actor-preserving audit, narrow authenticated RPC grant, independent database/provider logout attempts, cookie-independent provider sign-out, centralized copy, and accessible control-shell logout UI
- Slice 13 development database: Owner-authorized exact-session logout migration applied successfully; the follow-up guarded dry-run reported the remote database up to date with no pending migrations
- Slice 13 release gate: Passed — 34 test files and 169 assertions, full formatting/lint/TypeScript, production build with dynamic `/control`, secret scan, and dependency audit with 0 vulnerabilities; browser logout/replay verification is ready for owner review
- Slice 13 owner UI evidence: Passed on 2026-09-01 Australia/Sydney — Sign out redirected to `/login`, direct protected-route replay remained denied, and a fresh valid login restored `/control`
- Slice 14 red observed: Yes — the owner security-audit adapter was absent and its focused suite failed to resolve; the session list UI then failed its missing-heading/button contract
- Slice 14 green: Passed — login success, failure, throttle, provider outage, and post-auth authorization denial emit redacted structured UTC evidence with server-generated correlation; anonymous outcomes claim no actor and audit-sink failure cannot change authentication results. The control page lists only safe self-bound session metadata, renders universal UTC instants, validates strict UUID-only revocation input, re-authorizes direct mutation calls, and uses the existing append-only audited revocation RPC
- Slice 14 release gate: Passed — 36 test files and 178 assertions, full formatting/lint/TypeScript, production build with dynamic `/control`, secret scan, and dependency audit with 0 vulnerabilities; session-list and revocation browser verification is ready for owner review
- Slice 14 owner UI evidence: Passed on 2026-09-01 Australia/Sydney — the owner confirmed safe device metadata and UTC lifecycle times, revoked the active session, observed protected access end, signed in again, and confirmed the replacement active session without credential or personal-data exposure
- Slice 15 protected-access evidence: Passed — 16 focused assertions cover redacted session/authorization denials, expired or revoked session evidence, provider/database unavailability, authenticated-actor attribution only after identity verification, and audit-sink isolation
- Slice 15 recovery baseline: Documented — `OWNER_ACCOUNT_RECOVERY.md` defines the private synthetic-development dashboard procedure, transactional all-session revocation, actor-unclaimed recovery audit, protected-route replay verification, and the stronger external-release blocker; no public recovery endpoint was added
- Slice 16 current-session distinction: Passed locally — 29 focused assertions plus TypeScript and lint verify a self-bound `is_current` result without returning credential hashes, a visible current-session label, no revoke-other-device action on the current browser, and strict revocation input
- Slice 16 development database: Owner-authorized current-session identification migration applied successfully; the follow-up guarded dry-run reported the remote database up to date with no pending migrations
- Slice 16 owner UI evidence: Passed on 2026-09-01 Australia/Sydney — the active browser was visibly identified as `Current session`, did not expose the other-device revocation action, and displayed no token or credential hash
- Final Part 1.1 release gate: Passed — 37 test files and 182 assertions, formatting, lint, TypeScript, production build, secret scan, dependency audit with 0 vulnerabilities, and 8 desktop/mobile browser regressions
- Manual UI checkpoint: Accepted — login/control shell, exact-session logout/protected-route replay, safe session visibility/revocation, and current-session distinction passed owner review
- Owner UI evidence: Valid synthetic-owner credentials initially failed closed because no active database role was linked. After the owner explicitly assigned the sole development Auth user an active `platform_owner` role in Supabase, login redirected successfully to the protected `/control` shell. The redacted linkage diagnostic confirms exactly one Auth user and an active linked owner without exposing identity data.
- Approved dependencies: `@supabase/ssr` `0.12.4` and `@supabase/supabase-js` `2.112.4`, exact-pinned; installation audit reported 0 vulnerabilities
- UI checkpoint prepared: `UI_TEST_CHECKLISTS.md` contains the shared milestone checklist and Part 1.1 login/session cases
- Implementation status: Complete — all 26 Part 1.1 acceptance examples have automated or documented evidence, required development migrations are applied, automated gates pass, and Mehedi Hassan accepted the UI/process checkpoints on 2026-09-01 Australia/Sydney. Part 1.2 remains unauthorised.

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
