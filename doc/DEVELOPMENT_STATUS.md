# Development Status

This file records the single current roadmap part and its acceptance evidence. It is not a substitute for Git history or the detailed roadmap.

## Project state

- **Overall state:** Phase 1 complete; Phase 2 security gate accepted for private synthetic development
- **Current approved part:** SH-4 design and acceptance preparation — merchant settings integrity (S06)
- **Part status:** Design accepted, migration applied, and automated gates passed — final merchant settings UI/process checkpoint pending
- **Completed current part:** Emergency owner password recovery — implementation, development migration, security gates, browser checkpoint, and owner acceptance passed
- **Completed security part:** SH-2 — exact-session migration, application gates, grouped UI/process checkpoint, and owner acceptance passed
- **Next part:** SH-4 design and acceptance preparation — merchant settings integrity (S06)
- **Next part authorised:** Yes — SH-4 implementation and guarded synthetic-development verification; final owner acceptance remains required
- **Execution mode:** Quick mode activated by Mehedi Hassan on 2026-10-08 Australia/Sydney for ordinary in-scope implementation, guarded synthetic-development migrations, verification, commits, and pushes. Pause only for required owner testing/intervention or existing non-delegable safety gates.
- **Remote repository:** `https://github.com/mhassan-au/PieShop.git`
- **Last updated:** 2026-10-08 Australia/Sydney
- **CI mode:** Manual GitHub Actions dispatch during private synthetic development; automatic push/PR triggers must be restored and green before staging, real-vendor demo, or production

## Current part objective

Make merchant settings creation, validation, locking, authorization, versioning, acknowledgement, and auditing atomic while preserving the accepted single-business merchant-owner and privacy boundaries.

## Acceptance source

The proposed SH-4 boundary and 16 acceptance examples are in `doc/SECURITY_HARDENING_SH_4_DESIGN.md`. Mehedi Hassan explicitly started SH-4 on 2026-10-08 Australia/Sydney and requested a large autonomous implementation workstream with pauses only for mandatory owner gates and final manual review. Implementation remains gated on acceptance of the proposed design. Completed SH-3, recovery, SH-2, Part 2.1, and earlier evidence remains preserved below.

## TDD evidence

### Current SH-4

- Authorization: Mehedi Hassan explicitly started SH-4 design and requested autonomous implementation, small automated tests, guarded development work, commits, and pushes on 2026-10-08 Australia/Sydney.
- Design acceptance: Mehedi Hassan accepted the SH-4 security boundary and all 16 merchant-settings integrity examples on 2026-10-08 Australia/Sydney, authorizing TDD implementation and the reviewed non-destructive guarded development migration under quick mode.
- Evidence reviewed: The settings-row trigger/backfill now covers provisioning, but the effective update RPC still has nullable-input, pre-lock authorization, exactly-one-membership, broad acknowledgement, generic-conflict, and untested concurrency gaps identified by S06.
- Proposed boundary: Preserve the single-business owner rule; explicitly reject required NULLs; serialize on the business row; recheck business, membership, and exact session after locking; fail atomically on a missing settings invariant; keep identical retries idempotent; return a strict three-field acknowledgement; map only the stable conflict classification to central safe copy; and prove both suspension/update orderings with two connections.
- TDD red evidence: Focused tests failed because the SH-4 migration, stable conflict type/copy, and strict acknowledgement parsing were absent; the repository accepted an unexpected contact field in the update response.
- Implementation: Migration `20261008020000_harden_merchant_settings_integrity.sql` explicitly rejects required NULLs, enforces exactly one eligible owner business, serializes on the business row, rechecks membership/business/exact-session state under locks, fails atomically on missing settings, preserves identical-retry idempotency, uses stable conflict SQLSTATE `40001`, returns only business/version/time acknowledgement fields, and keeps value-free real-actor auditing. The repository strictly parses that acknowledgement and maps only `40001` to centralized conflict copy.
- Development database: The accepted non-destructive SH-4 migration is applied to the guarded synthetic development target; follow-up dry-run reports the remote database is up to date.
- Database gate: Passed — 19 rollback-safe live settings authorization/persistence/isolation assertions, two deterministic two-connection business-lock ordering probes with all probe mutations rolled back, schema/hardening/foundation/owner/SH-3 regression gates, and the migration dry-run are green.
- Application gate: Passed — formatting, lint, TypeScript, 85 Vitest files/335 assertions, notification/tooling tests, production build, secret scan, and production dependency audit with zero vulnerabilities are green. The full audit remains non-green only for the owner-accepted ADR-030 development lint-chain advisory; the offered force fix remains an incompatible downgrade.
- Browser-checkpoint repair: The first stale-tab attempt proved the database conflict was atomic but left the client in `Saving…` while Next.js coupled the Server Action result to route revalidation. The action now returns feedback before any refresh, the successful client refreshes afterward, and the version-keyed form synchronizes uncontrolled fields only when a newer settings version renders. Focused red/green tests cover both regressions; final conflict-copy review remains pending.
- Next gate: Complete one final merchant settings UI/process checkpoint covering a valid save/read-back, identical resubmission, and safe stale-version conflict feedback, then request SH-4 owner acceptance.

### Current SH-3

- Authorization: Mehedi Hassan instructed progression to the next roadmap step on 2026-10-04 Australia/Sydney, authorizing design and acceptance preparation only.
- Design acceptance: Mehedi Hassan accepted the fresh-authentication boundary, five-minute creation window, legacy grant removal, and all 16 examples on 2026-10-04 Australia/Sydney. This authorizes local TDD and migration preparation but not cloud application.
- Evidence reviewed: The current owner and returning-merchant creation RPCs accept caller-selected application hashes without binding to provider `session_id`, authentication method/time, or a consumed ceremony. Foundation placeholder grants still expose catalogue and transaction paths whose policies check membership but not merchant status or the exact PieShop session.
- Proposed boundary: Derive signed provider session/method/time only from verified JWT claims, confirm the live provider session, anchor application expiry to the authentication instant, enforce a five-minute creation window and one binding per provider session/context, and fail closed on insufficient evidence. Remove obsolete creation signatures and legacy placeholder table grants/policies without deleting rows.
- External validation: Current Supabase documentation confirms that access tokens carry a `session_id` corresponding to `auth.sessions`, refresh stays within the provider session, and authentication-method claims include method timestamps. A redacted integration probe against the pinned development provider remains mandatory before migration implementation.
- TDD red evidence: The focused SH-3 run failed in all expected new boundaries before implementation: seven missing migration-contract expectations and four adapters still calling the obsolete owner, returning-merchant, and invitation-redemption signatures.
- Local draft evidence: The three adapters now target fresh-authentication RPC names; the reviewable forward migration draft derives signed provider evidence, binds provider sessions, anchors deadlines to authentication time, makes exact retries idempotent, retires old grants, and removes the catalogue/transaction bypass. The focused run passes 21 assertions across four files. Nothing has been applied to Supabase.
- Redacted live provider evidence: A fresh owner password login produced a signed UUID-shaped `session_id`, `aal1`, and exactly one `amr` entry with method `password` and an integer authentication timestamp. Merchant invitation and returning-login PKCE completions each produced a distinct UUID-shaped provider session, `aal1`, and exactly one integer-timestamped `magiclink` AMR entry. Recovery produced another distinct UUID-shaped provider session with one integer-timestamped `recovery` AMR entry, so it cannot satisfy password or merchant session creation. Explicit token refreshes retained every provider-session binding and original authentication method/timestamp rather than creating fresh authentication evidence. No token, provider-session identifier, user identifier, email, or password was exposed by the temporary local-only probe, which was removed after the checkpoint.
- Rollback SQL evidence: The guarded SH-3 test applies the forward migration inside a transaction, exercises fresh owner password and merchant magic-link creation, exact retry idempotency, conflicting hash and recovery denial, deadline anchoring, audit redaction/count, old/new function grants, direct-table privilege removal, and obsolete policy removal, then rolls back both migration and synthetic fixtures. Seven grouped assertions pass. Provider-session advisory transaction locks and unique indexes serialize concurrent creation; the post-application gate must still exercise true multi-connection contention.
- Migration dry-run: Passed — exactly `20261004010000_fresh_session_creation_and_legacy_access.sql` is pending; no database change was made.
- Dependency remediation: Mehedi Hassan approved the non-breaking transitive update from `source-map-js@1.2.1` to `1.2.2` on 2026-10-06 Australia/Sydney. The lockfile changed only that package entry; the production dependency audit now reports zero vulnerabilities.
- Local Release gate: Formatting, lint, TypeScript, 83 Vitest files/325 assertions, notification/tooling tests, the Next.js production build, secret scan, production dependency audit, guarded SH-3 rollback SQL test, and migration dry-run pass. The full all-dependency audit remains non-green only for the owner-accepted ADR-030 development lint-chain advisory, whose automated fix would downgrade `eslint-config-next` incompatibly.
- Effective privilege diff: The migration revokes authenticated catalogue `SELECT`/`INSERT`/`UPDATE` and transaction `SELECT`/`INSERT`, removes all five obsolete membership-only policies, and revokes authenticated execution of the three caller-mintable session-creation signatures. It grants authenticated execution only to the new password- or magic-link-bound creation signatures; `anon` receives none. Existing rows, constraints, immutability triggers, and control-plane metadata boundaries are preserved.
- Development database: Mehedi Hassan explicitly authorized and the guarded target applied `20261004010000_fresh_session_creation_and_legacy_access.sql` on 2026-10-06 Australia/Sydney. The follow-up dry-run reports the remote database is up to date.
- Post-application database gate: Passed — schema, hardening, owner exact-session, merchant settings, updated foundation isolation/immutability, and SH-3 fresh-authentication/idempotency/audit/privilege tests pass with synthetic fixtures rolled back. The migration includes provider-session advisory transaction locks plus unique binding indexes; exact multi-connection RPC contention remains a grouped post-application acceptance observation because successful RPC creation writes an intentionally immutable audit event.
- Post-application application gate: Passed — formatting, lint, TypeScript, 83 Vitest files/325 assertions, production build, secret scan, production dependency audit, and diff hygiene are green.
- Owner browser checkpoint: Passed on 2026-10-06 Australia/Sydney — a fresh password-authenticated owner reached the protected `/control` page. Refresh retained the same `2026-10-06 02:41:27 UTC` application-session creation time and `2026-10-06 14:41:27 UTC` absolute expiry while only last activity advanced; no duplicate current application session appeared and no credential or session identifier was exposed.
- Invitation browser checkpoint: Passed on 2026-10-08 Australia/Sydney — the manually pre-provisioned synthetic merchant identity completed invitation-bound PKCE, consumed the invitation, reached `/merchant`, and remained signed in across refresh without exposing authentication material.
- Checkpoint repair: The first protected merchant render exposed that merchants created after the original settings migration lacked a required `merchant_settings` row. Migration `20261008010000_provision_merchant_settings.sql` non-destructively backfills missing rows and installs a private trigger for future businesses. The guarded development migration is applied; 17 live authorization/persistence/isolation assertions, 8 focused tests, the 84-file/327-assertion application suite, formatting, lint, TypeScript, production build, secret scan, migration dry-run, and production dependency audit pass. The newly reported Sharp production advisory was removed by the non-breaking `0.35.5` lockfile update; only the owner-accepted ADR-030 development lint-chain advisory remains.
- Returning-merchant browser checkpoint: Passed on 2026-10-08 Australia/Sydney — the synthetic merchant signed out, requested a fresh returning-login magic link, completed PKCE at `/auth/merchant-confirm`, reached the protected `/merchant` workspace, and refreshed successfully. Redacted server evidence shows the callback redirect followed by two successful merchant renders and no application error.
- Grouped browser checkpoint: Passed — fresh owner password login and refresh/idempotency, invitation PKCE, returning-merchant PKCE, protected owner/merchant rendering, and refreshed-session behavior are complete. Recovery-method denial is separately evidenced by the redacted live provider probe and post-application database test.
- Owner acceptance: Passed — Mehedi Hassan accepted SH-3 on 2026-10-08 Australia/Sydney.
- Completion: SH-3 is complete for private synthetic development. The no-MFA/AAL2 external-release block remains unchanged. SH-4 merchant-settings integrity is next but remains unauthorized until explicitly started.

### Current owner password recovery

- Authorization: Mehedi Hassan explicitly authorized pausing SH-2, accepted the 14 private-development recovery examples, and instructed implementation on 2026-10-03 Australia/Sydney.
- Red observed: Yes — the focused suites failed because the recovery policy module and `20261003010000_owner_password_recovery.sql` migration were absent.
- Local green: Passed — 30 focused recovery/login/message assertions plus strict TypeScript pass; the complete suite passes 82 files and 317 assertions.
- Security boundary: The request action returns equivalent public responses, uses process-local hashed throttling and Supabase PKCE, binds callback identity to the same browser, issues a ten-minute single-use opaque grant only after fresh active-owner verification, and rejects normal authenticated sessions without that grant.
- Revocation boundary: The forward migration derives `auth.uid()`, requires an active platform-owner role, revokes every live PieShop owner session before password mutation, and writes an actor-unclaimed value-free audit event. Global Supabase sign-out follows a successful password update.
- Local Release gate: Formatting, lint, TypeScript, 82 Vitest files/317 assertions, tooling tests, Next.js `16.3.8` production build, and secret scan pass. The full dependency audit remains non-green only for the owner-accepted ADR-030 development-lint advisory; the production dependency audit remains clean.
- Live checkpoint repair: A successful recovery and fresh login exposed an obsolete owner-session list parameter (`p_current_token_hash`) left in the application adapter after the SH-2 RPC hardening migration. A regression test reproduced the contract mismatch; the adapter now passes the required exact-session parameter (`p_owner_session_token_hash`) so `/control` can list only the freshly authenticated owner session.
- Development database: Owner-authorized migration `20261003010000_owner_password_recovery.sql` is applied; the guarded follow-up dry-run reports the remote database is up to date.
- Post-application database gate: Passed — schema, hardening, rollback-safe foundation security, and owner exact-session authorization/privacy/revocation checks pass against the guarded synthetic development target.
- Browser checkpoint: Passed — generic recovery request, same-browser callback, reset form, eight-character complexity policy, password mutation, login redirect, fresh exact-bound owner login, protected control-page rendering, and recovery-driven session revocation were observed in the local synthetic flow. Mehedi Hassan separately confirmed on 2026-10-04 Australia/Sydney that the old password is rejected and the new password succeeds.
- Owner acceptance: Passed — Mehedi Hassan accepted the emergency owner password-recovery result on 2026-10-04 Australia/Sydney.
- Completion: The emergency recovery part is complete for private synthetic development only. MFA/AAL2 recovery, durable throttling, notification, and external-environment controls remain mandatory before any real-vendor demo, real data, staging, production, or external release.

### Current SH-2

- Authorization: Mehedi Hassan accepted the exact-session design and all 14 acceptance examples on 2026-09-06 Australia/Sydney.
- Red observed: Yes — the migration contract first failed because `20260906080000_owner_exact_session_rpc_boundaries.sql` was absent; six focused access/repository expectations then failed because owner proof was not passed.
- Database boundary: Prepared — the forward migration locks and verifies the exact live owner session, moves obsolete owner functions into the inaccessible private schema, exposes only hash-bound replacements, removes the platform-owner branch from direct business reads, and preserves merchant membership reads.
- Server boundary: Passed locally — the server-only access result returns its already verified hash; the control page and merchant/invitation/status/session repositories pass it only as an RPC parameter. Login cookie-write cleanup uses exact token-hash logout rather than the interactive revoke-other-session RPC.
- Focused verification: Passed — 27 boundary/repository assertions plus 10 owner login/logout assertions and TypeScript pass.
- Migration dry-run: Passed — exactly `20260906080000_owner_exact_session_rpc_boundaries.sql` is pending; no database change was made.
- Release-mode local gate: Passed — formatting, lint, TypeScript, 80 Vitest files/313 assertions, tooling tests, production build, secret scan, and dependency audit with 0 vulnerabilities.
- Development database: Owner-authorized migration `20260906080000_owner_exact_session_rpc_boundaries.sql` is applied; the guarded follow-up dry-run reports the remote database is up to date.
- Post-application database gate: Passed — schema, hardening, 12 rollback-safe foundation isolation/immutability assertions, 16 merchant-settings authorization/persistence assertions, and 10 owner exact-session authorization/privacy/revocation assertions pass.
- Harness correction: The first owner revocation verification was correctly denied direct `application_sessions` access with SQLSTATE `42501`; the test now verifies the same outcome through the exact-session-bound safe-list RPC and passes without weakening table privacy.
- Dependency remediation: Owner-authorized exact upgrades to Next.js `16.3.8`, Nodemailer `10.0.13`, and ESLint Config Next `16.3.8`, plus non-force transitive lockfile fixes, remove the critical application advisory and all other fixable findings. No forced downgrade or audit bypass was used.
- Post-remediation local gate: Formatting, lint, TypeScript, 80 Vitest files/313 assertions, notifier/chat-ID/target-guard tooling tests, the Next.js `16.3.8` production build, and secret scan pass. The full dependency audit remains non-green only because `eslint-config-next` reaches unpatched development-only `braces@3.0.3`; npm reports five high findings along that single chain, the registry has no newer `braces` release, and npm's offered force fix would incorrectly downgrade ESLint Config Next to `14.2.35`.
- Residual-risk decision: Accepted by Mehedi Hassan on 2026-10-03 for private synthetic development only and recorded in ADR-030. The production dependency audit reports zero vulnerabilities; the unpatched development-lint advisory remains visible and blocks real-vendor demos, real data, staging, production, and external release.
- Live contract repair: The first resumed control-page load exposed the obsolete application parameter `p_current_token_hash` after the database RPC had moved to `p_owner_session_token_hash`; the repository regression test reproduced the mismatch and the corrected exact-session parameter restored the protected control page.
- Grouped owner UI/process checkpoint: Passed in the synthetic development environment on 2026-10-04 Australia/Sydney — exact-session-bound metadata loaded without merchant business content or session hashes; a dedicated `.test` onboarding fixture was created; its Mailtrap sandbox invitation was issued and revoked; the existing synthetic merchant was suspended and restored to active; another owner session was revoked; logout returned to login; and direct `/control` replay remained denied.
- Checkpoint UI repairs: The checkpoint found that active merchants with a non-used invitation state incorrectly displayed the sandbox invitation action even though the server correctly denied delivery outside onboarding. A red regression test now limits invitation management to onboarding merchants. It also found confirmed `useActionState` mutations running outside a React transition; the shared confirmation component now starts those actions inside `startTransition`. A post-fix suspend/reactivate cycle completed, restored the merchant to active, and produced no browser warnings or errors.
- Post-checkpoint Release gate: Passed — formatting, lint, strict TypeScript, 82 Vitest files/318 assertions, Next.js `16.3.8` production build, secret scan, production dependency audit with zero vulnerabilities, diff whitespace validation, and 10 rollback-safe owner exact-session authorization/privacy/revocation assertions pass.
- Owner acceptance: Passed — Mehedi Hassan accepted the grouped SH-2 UI/process result on 2026-10-04 Australia/Sydney.
- Completion: SH-2 is complete. Do not begin SH-3 until the current emergency recovery part is formally accepted and SH-3 is separately authorized.

### Current SH-1

- Authorization: Mehedi Hassan accepted the 12 SH-1 examples and instructed implementation to continue on 2026-09-06 Australia/Sydney.
- Red observed: Yes — the focused tooling test failed because the shared Supabase test-target guard was absent.
- Local safety tooling: Passed — seven assertions cover matching target acceptance, environment/confirmation/project/host/port denial, and arbitrary database-error redaction.
- Database harness: Passed — 16 effective merchant-settings RPC, tenant isolation, denied mutation, session/business/role denial, direct privilege, persistence, version, NULL/stale conflict, retry, failure rollback, and audit assertions ran against guarded development Supabase and rolled all synthetic data back. Two simultaneous runs also passed without fixture collision.
- Existing regression evidence: Passed — expanded foundation hardening covers 11 RLS tables; the original 12 foundation isolation/immutability assertions still pass with synthetic rollback.
- Evidence repair: Passed — duplicate Phase 1 threat numbering, malformed UI checklist boundaries, cloud-only workstation requirements, stale implementation boundary, and owner route examples are corrected with historical context retained.
- Release-mode quality gate: Passed — formatting, lint, TypeScript, 79 Vitest files/309 assertions, Git/notifier/chat-ID/target-guard tooling tests, production build, secret scan, and dependency audit with 0 vulnerabilities.
- Owner result acceptance: Passed — Mehedi Hassan accepted SH-1 and instructed continuation on 2026-09-06 Australia/Sydney.
- Completion: SH-1 is complete. SH-2 design is prepared but implementation remains gated by owner acceptance of its security boundary and examples.
- UI checkpoint: Not required so far because SH-1 has not changed visible behavior.

### Current Part 2.1

- Authorization: Mehedi Hassan accepted the Phase 2 security decisions and authorized Part 2.1 on 2026-09-06 Australia/Sydney.
- Threat gate: Accepted for private synthetic development; real vendors/data, public preview, support access, and Part 2.3 image dependencies remain blocked.
- Acceptance contract: Mehedi Hassan accepted all 16 threat-mapped examples on 2026-09-06 Australia/Sydney.
- Slice 1 red observed: Yes — the merchant-settings policy module and Part 2.1 migration were absent; both focused suites failed.
- Slice 1 local green: Passed — 12 assertions cover strict synthetic settings normalization, invalid/mass-assigned input, deterministic setup progress, database-output allow-listing, tenant-owned storage, direct-table denial, fresh merchant-owner/application-session self-binding, optimistic concurrency, idempotency, and value-free auditing. TypeScript and targeted lint pass.
- Slice 1 migration gate: Guarded remote dry-run identifies exactly `20260906060000_merchant_setup_settings.sql`; applying it requires explicit owner authorization.
- Slice 1 development database: Owner-authorized migration applied successfully; follow-up dry-run is clean, schema/hardening pass, and 12 rollback-safe isolation/immutability assertions pass.
- Slice 2 repository: Passed — session-hash-bound read/update RPC mapping, explicit parameter allow-listing with no tenant input, strict response parsing, and provider-error redaction are covered; 15 grouped domain/migration/repository assertions pass with TypeScript and targeted lint.
- Slice 3 red observed: Yes — the merchant workspace component and settings action contract were absent; both focused suites failed.
- Slice 3 protected shell: Passed — 44 grouped assertions cover the mobile navigation, server-derived resumable progress, approved-field-only settings form, centralized feedback, fresh access/session hashing, tenant-free action input, repository/domain/migration behavior, and message regression. Formatting, lint, TypeScript, production compilation, secret scan, dependency audit with 0 vulnerabilities, remote schema/hardening, and 12 rollback-safe database assertions pass.
- Slice 3 browser checkpoint: Passed on 2026-09-06 Australia/Sydney — anonymous/new browser access redirects to `/merchant/login`; after owner magic-link login, the repaired workspace rendered the tenant-bound business name, saved timezone, editable settings, and deterministic 3-of-4 progress. Today, Orders, Catalogue, and Settings navigation worked without mutation or runtime error. Owner visual/process acceptance remains pending.
- Slice 3 live failure: The authenticated settings read failed closed with SQLSTATE `42703`; a redacted synthetic diagnostic found the helper used non-existent session columns `session_token_hash`/`expires_at` instead of canonical `token_hash`/`absolute_expires_at`. No mutation occurred.
- Slice 3 repair: Passed — Mehedi Hassan authorized and the additive migration `20260906070000_fix_merchant_settings_session_columns.sql` was applied to development on 2026-09-06 Australia/Sydney. The helper now uses canonical `token_hash` and `absolute_expires_at` columns while preserving self-bound owner, membership, business-status, revocation, and exact-session checks. Remote dry-run is clean; schema, hardening, and all 12 rollback-safe security assertions pass; authenticated rendering confirms the original runtime failure is resolved.
- Part 2.1 owner UI/process acceptance: Passed — Mehedi Hassan accepted the authenticated merchant shell, navigation, saved settings display, and resumable 3-of-4 setup progress on 2026-09-06 Australia/Sydney.
- Part 2.1 completion: Complete — do not begin Part 2.2 until its product/threat acceptance examples are prepared and accepted.

### Current Part 1.3

- Authorization: Mehedi Hassan accepted the Part 1.2 UI and authorized grouped Part 1.3 implementation on 2026-09-05 Australia/Sydney
- UI verification approach: Codex performs small in-app browser checks after grouped changes; the owner performs the final manual UI/process checkpoint after the major invitation feature
- Slice 1 red observed: Yes — the secure invitation-token module was absent and its focused suite failed to resolve
- Slice 1 token primitive: Passed — 4 focused assertions cover 256-bit URL-safe randomness, deterministic SHA-256 storage hashes, strict malformed-token rejection, and the inclusive 24-hour UTC expiry boundary
- Slice 2 red observed: Yes — all 4 invitation lifecycle migration assertions failed because the migration was absent
- Slice 2 lifecycle migration: Passed — owner-authorized migration `20260905010000_secure_merchant_invitation_lifecycle.sql` is applied; issue/rotation and idempotent revoke are self-authorizing, row-locked, cooldown-protected, redacted, and audited. Remote dry-run is clean; foundation schema/hardening pass and 12 isolation/immutability assertions pass with synthetic rollback
- Slice 3 local delivery and owner controls: Passed — local/test-only preview links fail closed elsewhere; owner actions reauthorize, accept only a business UUID, generate/hash tokens server-side, and expose one preview link without logging or persisting raw material. Focused repository/component contracts pass
- Slice 3 browser check: Passed — Codex issued one synthetic invitation, observed issued status and one-time preview feedback, opened the public preview showing only business name/UTC expiry/no-account notice, then revoked it and observed revoked status. The trace-observed synthetic link was invalidated immediately
- Slice 4 redemption migration: Passed — owner-authorized migration `20260905020000_secure_merchant_invitation_redemption.sql` is applied; public inspection is read-only, while authenticated redemption locks the row, matches normalized Auth email, creates one membership, consumes once, and audits atomically. Remote schema, hardening, and 12 rollback-safe isolation checks pass
- Provider-free UI checkpoint: Accepted by Mehedi Hassan on 2026-09-05 Australia/Sydney after reviewing issue, one-time preview, safe invitation detail, revoke, and unavailable-link behavior
- Slice 5 red observed: Yes — the accepted 30-day merchant-session policy module was absent and its focused suite failed to resolve
- Slice 5 session persistence: Passed — owner-authorized migration `20260905030000_merchant_application_sessions.sql` is applied. Redemption now atomically creates membership, hash-only application session, invitation consumption, and audit evidence; the obsolete signature is removed. Verification freshly checks Supabase identity, revocation/30-day expiry, active membership, and onboarding/active merchant state. Remote schema, hardening, and 12 rollback-safe isolation checks pass
- Slice 5 server adapter: Passed — focused tests cover canonical UTC boundaries, hardened 30-day HttpOnly/SameSite cookie policy, safe repository mapping, provider-error redaction, and hash-only redemption/session verification calls
- Slice 6 sandbox delivery: Passed — Mailtrap SMTP is exact-pinned behind a server-only adapter and restricted to local/test. The owner confirmed the credential-free connection message; the owner-authorized `20260905040000_server_only_invitation_delivery_target.sql` migration exposes only one onboarding recipient/name pair to `service_role`, with no anon/authenticated grant. Delivery failure revokes the issued token and all UI/action responses omit recipient and token material. Eight focused files and 26 assertions, TypeScript, lint, remote schema/hardening, and 12 rollback-safe security assertions pass.
- Slice 6 browser check: Passed by Codex — an active merchant was rejected with centralized safe copy, while the synthetic onboarding merchant produced the success state and a Mailtrap-captured invitation without exposing its address or link on the owner page. Final owner review of the captured invitation and redemption flow remains pending.
- Slice 6 owner checkpoint: Accepted by Mehedi Hassan on 2026-09-05 Australia/Sydney after verifying the captured Mailtrap invitation, merchant name, review link, and safe invitation page.
- Merchant Auth provisioning decision: Accepted for MVP — the owner manually pre-provisions the exact invited synthetic identity in Supabase; automatic creation and public signup remain disabled. Automated owner-controlled provisioning is mandatory before leaving MVP (ADR-026).
- Slice 7 PKCE confirmation: Passed — the invitation page requests Supabase email authentication with `shouldCreateUser: false`, stores only a 15-minute HttpOnly/SameSite invitation hash binding, and redirects to `/auth/confirm`. The callback exchanges the PKCE code before the existing atomic email-bound redemption, creates the opaque 30-day application session, clears the binding, and removes authentication/invitation material from the URL. The protected `/merchant` route freshly verifies both Supabase identity and the application session.
- Slice 7 database/security gate: Passed — owner-authorized migration `20260906010000_server_invitation_auth_target.sql` exposes only the live invitation recipient email to `service_role`; browser roles have no grant. Remote migration dry-run is clean, schema/hardening pass, and 12 rollback-safe isolation assertions pass. The complete gate passes 59 test files and 263 assertions, production build, secret scan, and dependency audit with 0 vulnerabilities.
- Slice 7 live repair: The first matched-recipient redemption failed atomically with PostgreSQL `42702` because the PL/pgSQL output name `business_id` conflicted with the membership upsert conflict target. Owner-authorized migration `20260906020000_fix_merchant_redemption_conflict_target.sql` targets the named unique constraint; remote schema/hardening and 12 rollback-safe security assertions pass.
- Slice 7 owner checkpoint: Passed — Mehedi Hassan completed the same-browser Mailtrap/Supabase magic-link flow on 2026-09-06 Australia/Sydney and reached the protected `/merchant` page with authentication and invitation material removed from the URL.
- Slice 7 final gate: Passed — 60 test files and 265 assertions, formatting, lint, TypeScript, production build, secret scan, and dependency audit with 0 vulnerabilities.
- Slice 8 exact-session logout: Passed — owner-authorized migration `20260906030000_revoke_current_merchant_session.sql` revokes only the authenticated merchant's exact hash-bound application session, records the real actor in an append-only safe audit event, clears both application and provider sessions, and redirects to merchant login. Remote schema/hardening and 12 rollback-safe isolation assertions pass.
- Slice 9 returning merchant login: Passed — owner-authorized migration `20260906040000_returning_merchant_magic_link.sql` restricts eligibility lookup to `service_role`, requires exactly one active merchant-owner membership before self-authorized session creation, preserves the 30-day absolute limit, and audits session creation without email or token material. The separate email-only `/merchant/login` uses equivalent public responses, hashed process-local account/source throttling, a 15-minute HttpOnly identity binding, PKCE, and disabled signup.
- Slice 9 complete gate: Passed — 67 test files and 279 assertions, formatting, lint, TypeScript, production build, secret scan, dependency audit with 0 vulnerabilities, remote schema/hardening, and 12 rollback-safe isolation assertions. Codex browser smoke checks confirm separate accessible owner and merchant entry screens and reciprocal navigation without exposing signup or recovery.
- Slice 9 owner UI checkpoint: Accepted by Mehedi Hassan on 2026-09-06 Australia/Sydney — returning magic-link login reached the protected merchant workspace; owner logout and protected-route redirect, generic unknown-email response, merchant-route redirect, and separated login navigation were verified through Codex UI. The initial cross-tab PKCE failure was safely diagnosed as `BINDING_MISSING`; same-tab confirmation succeeded.
- Implementation status: Complete and owner accepted — Part 1.3 closed on 2026-09-06 Australia/Sydney

### Current Part 1.4

- Authorization: Mehedi Hassan authorized continued implementation on 2026-09-06 Australia/Sydney.
- Threat and acceptance contract: Passed — `PART_1_4_ACCEPTANCE.md` locks the transition graph, terminal non-deleting archive, activation prerequisites, atomic suspension revocation, real-actor audit, idempotency, and metadata-only progress.
- TDD red observed: Yes — status policy and migration suites failed because the module and migration did not exist.
- Local implementation: Passed — strict input, privacy-safe progress derivation, self-authorizing repository/action boundary, centralized confirmations, and valid-next-action UI pass 5 focused files and 35 assertions plus TypeScript and lint.
- Development database: Passed — owner-authorized migration `20260906050000_merchant_status_transitions.sql` applied successfully; remote dry-run is clean, schema/hardening pass, and 12 isolation/immutability assertions pass with synthetic rollback.
- Codex UI checkpoint: Passed on 2026-09-06 Australia/Sydney — Syntext IT moved onboarding → active → suspended → active; suspension displayed session revocation, `/merchant` redirected to `/merchant/login`, reactivation did not restore a session, and archive was not invoked.
- Implementation status: Complete — Part 1.4 and Phase 1 acceptance gates are satisfied for private synthetic development. Real-vendor demo, staging, and production remain blocked by the documented MFA/AAL2 and durable-control release gates.

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
