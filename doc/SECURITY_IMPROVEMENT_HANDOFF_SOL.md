# Security improvement review and SOL implementation handoff

Review date: 2026-09-06 Australia/Sydney. Product/code owner: Mehedi Hassan.

Status: Review and proposed work packages only. No application code, database, provider configuration, or access permissions were changed by this review. Part 2.1 UI acceptance is preserved. Part 2.2 remains unstarted.

## 1. Read this first, SOL

This document is intended for SOL working in small, explicit batches. It does not depend on a particular model version and does not authorize launching another agent or changing models. Use the model the owner selects.

The owner requested a security review and a written implementation handoff. That request alone is not authorization to apply every proposal below. When the owner assigns a ticket or batch, implement the local work and tests within that assignment without asking again for routine coding. Prepare a concrete migration/diff before requesting any still-required cloud-application or permission approval. Do not treat earlier approval of the session-column repair as approval of new migrations.

Always follow root `AGENTS.md`, `WORKFLOW_CLASSIFICATION.md`, current status, and accepted ADRs. Keep private synthetic development, no public signup, metadata-only platform access, no hidden support impersonation, immutable history, central messages/dialogs, redacted logs, UTC, and the no-real-data gate. Preserve all existing uncommitted Part 2.1 work. Do not stage, commit, push, reset, change provider settings, or introduce dependencies unless the current owner authorization covers that action.

### Execution protocol

1. Start with one classification line. Read this ticket, its referenced files, current status, and the relevant threat-model sections. The reviewer already read the full documentation set; do not repeat that for each ticket.
2. Reconfirm the finding against the latest migration definitions and code. A later migration may replace an earlier function. If already fixed, record the actual evidence and skip implementation.
3. Write down the ticket's acceptance examples and reproduce a meaningful failure. Source-string assertions may supplement tests but cannot prove authorization, concurrency, or SQL execution.
4. Implement one ticket or the small assigned batch. Keep dependency/provider types behind adapters. For Next.js changes, read the relevant installed `node_modules/next/dist/docs/` guidance first.
5. Run targeted tests during TDD and the relevant project gate at the batch end. Capture command, exit code, test scope, and result. An incomplete terminal result is unverified, not passed.
6. Record evidence here and update affected acceptance/threat/status documents. Preserve owner acceptance separately from missing automated evidence. Do not claim all threats mitigated because a generic foundation suite passed.
7. Stop only at a real unresolved design decision, an unapproved consequential operation, or the grouped owner UI checkpoint. State exactly what is ready and what approval or manual action remains.

For S02–S04 and S06, prepare the design and regression tests first. Their session/authorization changes need explicit security review of the proposed boundary before cloud application; SOL must not invent cryptographic protocols, turn off RLS, introduce general service-role bypasses, or weaken accepted session deadlines to make tests pass. Local tests and a reviewable proposed migration can proceed under the assigned ticket.

### Pre-Part 2.2 development sequence

This review is a security hardening gate between completed Part 2.1 and Part 2.2. Work through it as small roadmap parts, not as one unrestricted security rewrite. Part 2.2 remains unauthorized until SH-1 through SH-5 are verified and the owner accepts the gate result.

| Part                                      | Target duration | Tickets       | Outcome                                                                                                             | Owner intervention                                                                                                 |
| ----------------------------------------- | --------------- | ------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| SH-1 — Evidence and safe test harness     | 1–2 days        | S01, S05, S11 | Correct the evidence record and add guarded executable database tests before changing security behavior             | Accept the proposed acceptance examples before implementation; no UI checkpoint unless tooling exposes UI behavior |
| SH-2 — Owner session enforcement          | 1–2 days        | S02           | Bind every exposed owner operation to the exact active PieShop owner session and prove direct-call denials          | Accept the security-boundary design; authorize the reviewed development migration before it is applied             |
| SH-3 — Session creation and legacy access | 1–2 days        | S03, S04      | Prevent stale provider sessions from minting new app lifetimes and retire direct-table authorization bypasses       | Accept the fresh-authentication design; authorize the reviewed development migration before it is applied          |
| SH-4 — Merchant settings integrity        | 1–2 days        | S06           | Make settings creation, validation, locking, authorization, versioning, and audit behavior atomic                   | Authorize the reviewed development migration before it is applied; perform a grouped settings UI/process check     |
| SH-5 — Auth and browser protections       | 1–2 days        | S07, S08, S09 | Make callback/logout cleanup reliable, verify request/response protections, and bound authentication abuse controls | Perform one grouped owner/merchant login/logout UI checkpoint after automated checks pass                          |

S10 and S14 are the next maintenance batch after this gate unless their affected code is touched sooner. S12, S13, and S15 remain explicit pre-external-use/release work and cannot be pulled into this gate without separate scope or provider/dependency approval.

For every SH part, follow the repository TDD loop: classify; inspect only routed context; agree or use the accepted examples; observe a relevant failure; implement the smallest safe change; refactor while green; run targeted checks and then the routed closing checks; update the threat/evidence/status documents; complete any listed UI checkpoint; obtain owner acceptance; then advance. Do not combine SH parts merely to reduce reporting. Related tests and inspections inside one SH part should be bundled.

Git remains owner-operated unless the owner explicitly requests Git actions or activates quick mode for the current working period. A development migration may be prepared and dry-run as normal in-scope work, but applying it to Supabase must stop at the explicit approval point stated above. Never treat a Telegram reply or notification as approval.

## 2. Review scope and confidence

All 34 existing Markdown documents in the actual `doc/` directory were read. There is no separate `docs/` directory. The review also inspected root policy, repository/script inventory, dirty Git state, package scripts/dependencies, CI, and the implemented settings/authentication/database/observability paths named below.

This is a static code and documentation review, not a penetration test or a fresh verification of hosted Supabase configuration. No credential files were read, no live exploit was attempted, and no application test suite was run for this documentation-only task. Earlier test results remain historical evidence. Findings marked **confirmed in source** describe the checked-in/working-tree logic; their runtime impact still needs the specified executable regression tests. **Verification gap** means the required control was not demonstrated, not that an exploit was proved.

Existing strengths: explicit grants and safe-search-path definer functions; self-derived identity; separate owner and merchant routes; server-only privileged client factory; hash-only opaque sessions; strict domain schemas; value-free settings audits; immutable audit triggers; app-owned dialogs; privacy restrictions; reviewed phase gates.

Risk uses the project's Low/Medium/High vocabulary. High-priority session and authorization gaps should be resolved before building on these boundaries. Private synthetic exposure reduces immediate impact but does not make those controls correct. This review does not certify ASVS compliance or production readiness.

## 3. Prioritized work list

| ID  | Suggested priority / risk    | Finding class                                | Work package                                                            | Gate                                |
| --- | ---------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------- |
| S01 | First / Medium               | Verification gap                             | Correct evidence and threat traceability                                | Documentation                       |
| S02 | First / High                 | Confirmed in source                          | Enforce application sessions on direct owner RPCs                       | Security design + new migration     |
| S03 | First / High                 | Confirmed in source                          | Prevent provider-session replay from minting fresh application sessions | Security design + new migration     |
| S04 | First / High                 | Confirmed in source                          | Close legacy table paths that survive merchant suspension               | Security design + new migration     |
| S05 | First / High assurance gap   | Verification gap                             | Execute real settings/RPC authorization and persistence tests           | Guarded synthetic database tests    |
| S06 | First / Medium               | Confirmed gaps; race needs reproduction      | Make settings lifecycle, validation, and authorization atomic           | New migration                       |
| S07 | Next / Medium                | Confirmed in source                          | Make authentication callback/logout failure cleanup reliable            | Auth review; UI checkpoint          |
| S08 | Next / Medium                | Confirmed gaps; CSRF exploit not established | Verify origins, response headers, caching, and redirect privacy         | Local HTTP/browser tests            |
| S09 | Next / Medium                | Confirmed in source                          | Bound limiter memory and invitation authentication requests             | Local auth tests                    |
| S10 | Next / Medium                | Confirmed in source                          | Strengthen redaction and repository secret detection                    | Offline synthetic tests             |
| S11 | Next / Medium                | Confirmed in source                          | Harden database test tooling and isolate browser tests                  | Tooling tests                       |
| S12 | Before external use / High   | Confirmed gate gap                           | Enforce private-development and MFA release boundaries                  | Owner-reviewed release design       |
| S13 | Before external use / Medium | Existing accepted debt                       | Repair CI portability and supply-chain verification                     | CI/dependency approval where needed |
| S14 | Next / Medium                | Confirmed omissions                          | Add bounded provider calls and safe failure evidence                    | Adapter tests                       |
| S15 | Before real contacts / High  | Existing accepted debt                       | Implement approved privacy, encryption, and operational gates           | Separate provider/privacy decisions |

The authoritative execution grouping is SH-1 through SH-5 above. Ticket priority remains useful for triage, but it does not override the development sequence or authorize later parts. Do not start Part 2.2 product features inside an SH part.

## 4. Ticket instructions and acceptance tests

### S01 — Make security evidence trustworthy

Evidence: `DEVELOPMENT_STATUS.md` declares Part 2.1 complete, but its browser record covers rendering/navigation without a settings save. The historical turn did not establish the full final suite/build result. `PART_2_1_ACCEPTANCE.md` requires live hostile-role, stale-write, idempotency, cache/origin, and resume evidence. `UI_TEST_CHECKLISTS.md` has the Part 1.3/1.4 completion sections inside a code fence and the Part 2.1 section under the template heading. `PHASE_1_THREAT_MODEL.md` uses TM1-24 twice (returning login and dependency risk). Phase 2 treatments still say Planned despite partial implementation.

SOL work: add a requirement-to-test matrix with evidence states: verified, historical, missing, blocked, accepted residual risk. Give the duplicate threat a unique ID and update references with a migration note so historical links retain meaning. Fix checklist structure and stale current-state language without erasing dated history or owner UI acceptance. Distinguish design-only controls from implementation. Reconcile cloud-only development with Docker entries in `PROJECT_CHECKLISTS.md`; update stale route/auth examples in `DEVELOPER_WALKTHROUGH.md`, `UI_MAP.md`, and `WORKFLOWS_AND_STATES.md` as needed. Do not rewrite accepted ADR history.

Done: every Part 2.1 example has an actual test reference or an explicit evidence gap; no fake green/compliance claim; unique threat IDs and usable Markdown headings. Documentation checks only for this ticket.

### S02 — Enforce owner sessions at the Data API boundary

Evidence: `20260828010000_self_bound_authorization_helpers.sql::is_current_user_active_platform_owner` checks only `auth.uid()` and active role. `list_platform_merchants`, latest `create_platform_merchant` in `20260901040000_fix_platform_merchant_lock_key.sql`, invitation issue/revoke in `20260905010000_secure_merchant_invitation_lifecycle.sql`, and `change_platform_merchant_status` in `20260906050000_merchant_status_transitions.sql` are executable by authenticated users and rely on that role check. They do not require a live PieShop owner session. The Next.js guard cannot protect a direct Data API request.

Consequence: possession of a still-valid owner provider JWT can perform these operations without the app cookie or after the PieShop session expires/revokes. This does not give an unrelated user the owner role; it bypasses the additional session policy for an already authorized identity.

SOL work: inventory every exposed owner operation, including session-list/revoke RPCs and direct metadata reads. Design a common database-enforced binding between the current provider identity/session and an active PieShop owner session. Preserve 12-hour absolute and 2-hour idle limits. If parameters/signatures change, update repositories atomically with a forward migration and revoke/drop obsolete callable signatures. Do not accept any active session belonging to the user as a substitute for the current session. Do not solve this by routing ordinary owner operations through service-role access.

Tests: correct JWT plus no app session; wrong hash; another device's binding; idle/absolute expiry; revoked session; disabled role; merchant identity; anonymous identity; valid owner positive control. Each denied mutation must leave data and audit state unchanged. Verify direct RPCs as well as server actions. Include AAL1 denial under the later release policy. Review with S03 so session creation cannot bypass this fix.

### S03 — Bind application-session creation to fresh authentication

Evidence: `20260830010000_owner_application_sessions.sql::create_current_owner_session` and `20260906040000_returning_merchant_magic_link.sql::start_current_merchant_session` accept a caller-selected hash and are granted to authenticated users. They create new deadlines from the call time with no binding to provider `session_id`, authentication age/method, or consumed login ceremony. The merchant function also audits `method: magic_link` without proving that method at its boundary.

Consequence: a retained provider session can request a replacement PieShop session and restart its maximum lifetime. Next.js PKCE/email-binding checks do not constrain direct calls to the SQL function. A fresh JWT issued during token refresh is not evidence of fresh authentication.

SOL work: prepare a reviewed design using authoritative provider authentication/session evidence or a narrowly scoped single-use server-issued completion capability. Derive identity from verified evidence; never trust caller-supplied user IDs, `method`, AAL, timestamps, or unsigned cookies. Store sufficient binding to prevent a refreshed/revoked/old provider session from minting a new application lifetime. Preserve the explicit login flow and legitimate new-device login. Include invitation redemption and account recovery in the design inventory. Require stronger review before choosing a new trust boundary.

Tests: old provider session after app expiry/logout, token refresh without login, repeated/concurrent creation, forged method/time, wrong user, legitimate fresh password login, legitimate fresh merchant PKCE login, exact 30-day boundary, and accurate audit method. Verify old function signatures no longer provide a bypass. Cloud application needs its own authorization.

### S04 — Remove legacy direct-table bypasses

Evidence: foundation grants permit authenticated SELECT/INSERT/UPDATE on `catalogue_entries` and SELECT/INSERT on `transaction_records`. Latest membership policies in `20260828010000_self_bound_authorization_helpers.sql` inspect membership status only. `change_platform_merchant_status` revokes merchant application sessions but leaves active membership rows. Direct placeholder queries therefore do not apply business suspension or PieShop expiry/revocation.

SOL work: enumerate all direct table/view/RPC grants after replaying the complete migrations. These tables are foundation placeholders, not the future product/order implementation. Prefer retiring unnecessary application grants while preserving rows and the immutability harness; any retained route must enforce the accepted business/session/capability policy. Inspect `businesses`/membership metadata access separately and preserve explicitly allowed self/control-plane metadata. Do not indiscriminately remove grants needed by legitimate self-bound RPCs.

Tests: merchant suspended with membership still active and valid provider JWT; revoked/expired app session; staff role; cross-tenant identity; owner privacy denial; required positive control. Audit/transaction histories remain immutable. Verify no future feature accidentally reuses a permissive placeholder policy.

### S05 — Execute the security tests against real SQL behavior

Evidence: `scripts/test-foundation-security.mjs` executes twelve foundation assertions and never calls the merchant settings RPCs. `scripts/check-foundation-hardening.mjs` enumerates only eight foundation tables, omitting owner sessions, merchant sessions, and settings. Settings migration/action tests use `readFileSync` and `toContain`; the original migration test even requires the obsolete session-column expression that caused the runtime failure.

SOL work: create a separate rollback-safe settings integration harness and extend schema/grant inventories. Exercise the latest effective migrations, not SQL text in isolation. Use distinct synthetic tenants/roles/sessions, explicit `authenticated`/`anon` execution contexts, and positive controls. Test direct actions by invoking them with injected dependencies rather than proving a guard name exists in source. Retain useful static checks as supplemental evidence.

Required cases: get/save/read-back; new merchant after migration; cross-tenant hash substitution; no role/staff/platform owner/anonymous; missing/expired/revoked session; suspended/archived business; malformed and NULL RPC inputs; unchanged retry; stale version; one audit per successful logical update; injected rollback; contact values absent from logs/audits/errors. Add two-connection concurrency tests with isolated fixtures and explicit cleanup design; do not assume a single-connection rollback test proves races.

Done: the old column-name defect would fail this harness before a browser session is needed. Report which checks actually execute SQL and which remain unit/static tests. Integrate the new script into the appropriate check documentation; never call an unimplemented npm alias.

### S06 — Correct settings lifecycle and atomicity

Evidence: `20260906060000_merchant_setup_settings.sql` backfills settings once. Latest merchant creation inserts a business/invitation/audit only; no trigger or later path creates its settings row. `get_current_merchant_settings` uses an inner join, so newly created merchants lack a settings result. The update validates nullable SQL arguments using comparisons that can evaluate UNKNOWN; NULL email/phone pass through to nullable columns despite the application requiring both. Authorization is resolved before acquiring business/settings locks, with no explicit recheck after waiting. The helper counts only businesses matching the supplied session, not all active owner memberships. The repository returns a passthrough update row and collapses conflicts into generic failure.

SOL work in substeps: (a) establish atomic settings-row creation for every supported provisioning path and safe missing-row recovery; (b) explicitly handle SQL NULLs and validate consistently with the domain; (c) establish a consistent lock order and recheck authority/state at the mutation boundary; (d) return only required acknowledgement fields and translate expected conflict errors to central safe copy. Preserve original migrations. Define how exactly-one-business selection should behave and follow the accepted Part 2.1 rule rather than silently enabling multi-business access.

Tests: create-after-migration then first settings load; missing settings cannot produce business-only mutation or success audit; NULL required fields; duplicate/stale submissions; exactly-one membership ambiguity; suspension/logout racing an update with deterministic barriers; version and audit count. Race impact is a hypothesis until reproduced. Do not replace the generic public error with raw SQL/provider text. Settings contact privacy and fixed AUD/timezone boundaries remain intact.

### S07 — Close partial authentication and logout failures

Evidence: invitation callback `src/app/auth/confirm/route.ts` clears only the invitation binding on failure after code exchange; it does not compensate a newly created app session if cookie persistence fails. Returning callback `src/app/auth/merchant-confirm/route.ts` calls sign-out before clearing the binding, so a thrown sign-out can skip cleanup; it also lacks compensation for a created app session. `merchantLogoutAction` ignores the unavailable result from `logoutMerchant` and redirects normally. The logout service starts provider sign-out and database revocation concurrently using the same client, which needs a race regression.

SOL work: test and implement explicit partial-success tracking, exact-session compensation, reliable finally cleanup, and safe observable logout failure. Do not revoke other devices or a pre-existing unrelated owner session. Clearing a browser cookie does not prove server-side revocation. Preserve real-actor audit and avoid false success.

Tests: provider exchange succeeds then identity check fails; app session created then cookie write fails; sign-out throws; database revocation fails or returns false; missing binding/code; replay; shared-client sign-out/revoke ordering; existing separate device unaffected. Callback tests must invoke the handler and inspect response/cookies/dependency calls. Group owner UI review at the end.

### S08 — Verify browser request and response protections

Evidence: `next.config.ts` sets basic headers but no CSP/HSTS or route-specific no-store. Merchant page is force-dynamic and invitation page has no-referrer metadata, which are useful controls. Callbacks return redirects without explicit privacy headers, and the proxy matcher omits `/auth/merchant-confirm`. Existing browser tests cover the shell and owner login; they do not verify authenticated cache isolation or cross-origin mutations. Absence of custom CSRF code is not proof of a CSRF bug: Next.js Server Actions have framework protections that must be tested.

SOL work: read installed Next.js guides; define/test a route matrix for owner/merchant pages, login actions, invitations, callbacks, failures, redirects, and cookie refresh. Verify actual HTTP/RSC headers in production-build behavior. Add explicit private/no-store and no-referrer where needed; do not assume metadata protects every redirect or request. Determine whether the returning callback needs proxy participation instead of mechanically adding it. Plan CSP and HTTPS-only HSTS before external use; do not require HSTS on localhost or ship unsafe-eval as a production shortcut.

Tests: hostile/missing Origin according to framework contract; forged Host/forwarded host; POST controls; internal-only redirect destinations; Set-Cookie success/failure responses; two isolated sessions; logout/back navigation; no token URL in referrer or diagnostic output. Verify the HTML/RSC flow still works with the chosen CSP. External hosting configuration remains owner-operated.

### S09 — Bound authentication abuse controls

Evidence: owner and merchant limiters keep Maps whose stale entries are filtered only when the same key is revisited. New email/source values grow the maps without a total cap; source values come from untrusted forwarded headers. `src/app/invite/actions.ts` has no application limiter before invitation target lookup and OTP delivery, unlike returning login. Provider throttling is not a substitute for a measured application budget.

SOL work: add injected-clock, bounded storage with cleanup and defined capacity behavior. Do not evict active limits in a way that permits unlimited attempts. Apply invitation-token/account/source budgets before expensive operations without retaining raw identities/tokens. Keep generic merchant responses; avoid test-time sleeps. Source spoofing remains a documented private-development limit until a trusted proxy design and durable distributed limiter are approved.

Tests: many unique keys, stale-key cleanup, full-capacity behavior, limits across both dimensions, malformed input, provider not called when limited, invitation replay/flood, no identity material retained. Before external use, add distributed atomic limits and trusted client-source handling in a separate reviewed ticket.

### S10 — Extend secret/redaction defenses without overstating them

Evidence: `scripts/check-secrets.mjs` has a small pattern set, wholly skips `.env.example` and `doc/ENVIRONMENT_VARIABLES.md`, and silently ignores read failures. It does not detect all newly used Mailtrap/Codex Telegram assignments or arbitrary standalone Supabase secret values. `src/observability/redaction.ts` masks sensitive key names but value patterns omit several credential formats, opaque link tokens, and database URLs without obvious identifiers. Regex redaction cannot identify arbitrary names/addresses under innocent keys. Sentry initialization disables default integrations/PII, but has no final `beforeSend` scrubber.

SOL work: first add synthetic adversarial fixtures for actual credential formats and carrier fields. Replace broad file skips with narrowly justified placeholder handling; report unreadable tracked inputs safely. Add event-specific context allow-lists and a final telemetry scrubber where appropriate. Keep provider credentials server-only and inspect application import boundaries. Never paste actual secrets into tests or output matching content. A professional scanner/history scan is a separately reviewed tool/dependency choice, not a reason to weaken existing checks.

Tests: nested innocent-key credentials, tokenized URLs, connection URLs, mixed case/separators, malicious keys/control characters, oversize inputs, public publishable-key distinction, safe placeholders, unreadable files, final Sentry payload. Output only safe rule/file references. No finding here proves that an actual credential was leaked.

### S11 — Make security verification itself safe and repeatable

Evidence: `scripts/test-foundation-security.mjs` checks only APP_ENV before connecting and writing synthetic fixtures; it does not call the matching-project guard used by migration tooling. It runs broad UPDATE/DELETE attempts on immutable tables: if a broken guard allowed them, rollback normally protects data but triggers/external effects and mis-targeting remain avoidable risks. It prints arbitrary error messages. `playwright.config.ts` may reuse an existing server and retains traces on failure; its webServer does not itself establish a dedicated isolated test configuration.

SOL work: route all mutating database test tools through validated project identity before connecting; inspect `scripts/test-platform-merchant-rpc.mjs` too. Scope hostile mutation attempts to this run's synthetic rows, set transaction/statement limits, and redact failures. Design safe isolated concurrency fixtures without resetting the owner's working database. Make E2E test environment explicit and avoid reusing a server loaded with development credentials unintentionally. Keep live auth traces/cookies/links out of retained artifacts; do not disable the protection merely to simplify tests.

Tests: mismatch/missing confirmation/staging/production target rejected before connection; rollback on success/failure; cleanup evidence; no raw provider errors; parallel-run collision handling; unexpected server reuse rejected. Docker is not required or authorized for the owner's workstation.

### S12 — Enforce the private-development release boundary

Evidence: owner request access selects an AAL2 policy outside local/test. `verifyRequestMerchantAccess` has no corresponding environment/AAL check; SQL settings/session functions do not verify AAL. `APP_BASE_URL` is only a URL schema and accepts inappropriate non-HTTPS/noncanonical forms; an explicit local environment marker can be supplied in hosting. Current reduced assurance is an accepted development exception, not an external-use policy.

SOL work: propose explicit configuration gates that reject unsupported exposure before private-development auth is used. Canonicalize and restrict application origin (scheme, host, credentials, path/query/fragment); preserve localhost/127.0.0.1 developer choice consistently. Before real use, implement MFA/AAL2, recent step-up, recovery invalidation, and merchant session/device management at server and database boundaries. Do not add a boolean claiming MFA is implemented or silently block legitimate local builds. Provider enforcement must have separate verifiable evidence.

Tests: private local/test allowed under ADR-019; hosted mislabel rejected; AAL1 denied in external mode on direct server/RPC paths; unsafe origin rejected; correct HTTPS origin; recovery/role-change stale sessions denied. Provider settings and real-vendor access require explicit owner action.

### S13 — Repair CI and strengthen the release supply chain

Evidence: ADR-024 intentionally makes CI manual. `.github/workflows/ci.yml` uses mutable action tags and Ubuntu jobs; `npm run check` includes notifier tooling tests that require portability review. No cloud migration/RLS job exists. `package.json` uses a range for Supabase CLI despite documentation claiming it is pinned; there is no SBOM/static-security command in the scripts.

SOL work: diagnose the existing manual workflow and tool tests from source before adding tools. Preserve manual triggers until the owner authorizes restoring automatic CI. Define isolated cloud test credentials/fixtures (never production secrets or privileged secrets on untrusted PR code). Prepare reviewed SHA-pinned actions, consistent dependency pinning, supported runtime evidence, secret/static scanning and software inventory as release tasks. Do not claim current dependencies have zero vulnerabilities from an old audit or run automatic force upgrades.

Tests/evidence: clean locked install, platform-correct tooling tests, full relevant checks with final exit status, manual workflow success, reviewed dependency changes. Before release restore required PR/protected-branch checks with owner approval.

### S14 — Add bounded provider calls and useful safe diagnostics

Evidence: Supabase factories do not set a PieShop request deadline; Mailtrap transport sets neither explicit connection/socket time budgets nor required TLS. `secure: false` can use opportunistic STARTTLS, so it is not proof mail was transmitted unencrypted. Merchant settings failures collapse into a generic Error and returning-login failures are swallowed without safe operational events. The logger sink deliberately isolates failure, but there is no durable sink-health evidence in this implementation.

SOL work: define bounded Auth/database/mail adapter timeouts and required SMTP TLS appropriate to the chosen port. Do not retry non-idempotent session creation or invitation sends blindly. Add stable allow-listed failure stages/codes and correlation IDs without emails, settings values, tokens, SQL messages, or stacks. Keep user-facing copy generic except expected safe conflict/retry feedback. Align mail subjects/body templates with central messages while retaining HTML escaping.

Tests: timeout/cancellation, TLS-unavailable failure, provider error redaction, mutation ambiguity, repeated send safety, diagnostic sink failure isolation, one safe event per failure. Durable audit/log delivery, archives, and secondary alerting belong to the operations gate rather than an improvised fire-and-forget task.

### S15 — Preserve the already agreed future privacy/security gates

These are documented requirements, not newly discovered vulnerabilities in unimplemented features. Keep them linked and scheduled:

- Before real business contacts: approve field classification, minimizing/masking, encryption, exports/backups, retention, and Auth/provider-held copies (TM2-26). Synthetic labels are not technical enforcement of data provenance.
- Before Phase 3: implement ADR-022 managed versioned envelope encryption and separately keyed business-scoped lookup HMACs; authenticate tenant/field/key-version context, test rotation, key loss/unavailability, isolation, and encrypted snapshots. SOL must not select keys/KMS or implement custom cryptography without design review.
- Before Part 2.3: approve raster decoder, byte/pixel/time limits, quarantine, metadata removal, private Storage grants, short-lived authorized reads, orphan cleanup, and cost limits. No active formats or payment-evidence uploads.
- Before real operations: implement durable outbox/audit/log pipelines, UTC archive integrity, retention and recovery evidence; define key/provider outage behavior and test restore. App roles remain unable to rewrite/delete history.
- Before support/customer links/channels: use the respective phase model and existing scope, expiry, strong challenge, signature, replay, actor, and data-minimization requirements.
- Before external use: verify hosted Auth signup/redirect/SMTP settings, provider MFA, production sender controls, regions/subprocessors, legal/privacy/retention decisions, and incident ownership. These settings were not inspected in this review.

Owner decisions remain required for providers, recurring cost, real data, retention/legal choices, and production rollout. This handoff does not make those decisions.

## 5. Verification commands and reporting

For documentation-only tickets:

```powershell
npx prettier --check doc/SECURITY_IMPROVEMENT_HANDOFF_SOL.md
git diff --check
```

For assigned code work, run targeted `npx vitest run <actual-test-paths>`, `npm run typecheck`, and targeted ESLint while iterating. Before closing a security/auth batch use `npm run check` and relevant `npm run test:e2e` scenarios, per `WORKFLOW_CLASSIFICATION.md`. Do not reuse an authenticated browser state as an automated credential fixture.

After a reviewed migration is authorized for the dedicated development project, use the existing scripts:

```powershell
npm run db:push:dry-run
# Apply only after the displayed migration set is reviewed and authorized.
npm run db:push:apply
npm run db:push:dry-run
npm run test:supabase:schema
npm run test:supabase:hardening
npm run test:supabase:security
```

The current foundation commands do not prove S02–S06. Add and run the assigned feature-specific harness and document its actual command. Do not execute the apply command just because it appears in this document. Never reset the database to complete a test without exact separate authorization.

Use this result format for each ticket:

```text
Ticket / classification:
Scope assigned by owner:
Finding reproduced (or disproved) with:
Files and migrations changed:
Red test and reason:
Green commands / final exit codes / coverage:
Direct RPC and cross-tenant evidence:
UI checkpoint required / result:
Residual risk / decision / next gate:
Status: proposed | in progress | awaiting approval | verified
```

Suggested owner prompt for the next SOL task:

> Read AGENTS.md and doc/SECURITY_IMPROVEMENT_HANDOFF_SOL.md. Prepare SH-1 acceptance examples for S01, S05, and S11. Preserve my current work, follow TDD after I accept the examples, and report actual evidence. Do not start SH-2 or Part 2.2, apply cloud changes, or perform Git actions without the applicable owner instruction.

## 6. Documentation inventory read for this review

All existing files in `doc/`, before this handoff was added:

```text
AI_CONTEXT.md
CODEX_TELEGRAM_NOTIFIER.md
CODING_STANDARDS.md
DATA_MODEL.md
DECISIONS.md
DELIVERY_PLAN.md
DEVELOPER_WALKTHROUGH.md
DEVELOPMENT_ROADMAP.md
DEVELOPMENT_STATUS.md
ENVIRONMENT_VARIABLES.md
MVP_PRODUCT_REQUIREMENTS.md
OWNER_ACCOUNT_RECOVERY.md
PART_0_1_ACCEPTANCE.md
PART_0_2_ACCEPTANCE.md
PART_0_3_ACCEPTANCE.md
PART_0_4_ACCEPTANCE.md
PART_1_1_ACCEPTANCE.md
PART_1_2_ACCEPTANCE.md
PART_1_3_ACCEPTANCE.md
PART_1_4_ACCEPTANCE.md
PART_2_1_ACCEPTANCE.md
PHASE_0_THREAT_MODEL.md
PHASE_1_THREAT_MODEL.md
PHASE_2_THREAT_MODEL.md
PROJECT_CHECKLISTS.md
README.md
SECURITY_OBSERVABILITY.md
SECURITY_PRIVACY_REVIEW.md
TECHNICAL_ARCHITECTURE.md
THREAT_MODELING_STANDARD.md
UI_MAP.md
UI_TEST_CHECKLISTS.md
WORKFLOW_CLASSIFICATION.md
WORKFLOWS_AND_STATES.md
```

## 7. Primary reference checks

Checked on 2026-09-06; repository-specific findings above come from source inspection.

- [Supabase sessions](https://supabase.com/docs/guides/auth/sessions): provider JWTs carry `session_id`; refresh and provider session validity must be distinguished from fresh authentication. This informs S03; it does not validate PieShop's implementation.
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security): grants, RLS and privileged-function boundaries inform the direct Data API review in S02/S04/S05.
- [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html): verify authorization on every operation and test denial paths; a UI guard alone is insufficient.

Review limitations: no live configuration audit, authenticated penetration testing, complete dependency advisory audit, retention/legal review, or production approval was performed. Newly proposed treatments require evidence before being marked verified.
