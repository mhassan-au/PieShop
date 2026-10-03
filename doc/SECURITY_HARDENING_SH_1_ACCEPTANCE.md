# SH-1 Acceptance — Evidence and Safe Test Harness

**Owner:** Mehedi Hassan  
**Scope:** Private synthetic development only  
**Status:** Accepted for TDD implementation by Mehedi Hassan on 2026-09-06 Australia/Sydney

## Objective

Make PieShop's security evidence accurate and add a safely targeted, rollback-protected database integration harness for merchant settings and exposed RPC authorization. SH-1 improves verification only; it must not change production behavior, authorization policy, provider configuration, or stored development data.

## Locked scope

- Reconcile documentation claims with evidence that was actually observed. Preserve dated history and owner UI acceptance while marking missing evidence as missing.
- Add evidence states of `verified`, `historical`, `missing`, `blocked`, and `accepted residual risk` where security requirements are mapped to tests.
- Correct structural documentation defects identified by S01, including the duplicate Phase 1 threat identifier and malformed UI checklist sections, without rewriting accepted decisions.
- Add a separate executable merchant-settings/RPC database integration harness using synthetic identities, businesses, sessions, and settings.
- Apply the existing Supabase project-reference and environment guard before the harness opens a database connection or creates fixtures.
- Run every fixture and assertion inside a rollback-protected transaction. Use collision-resistant synthetic identifiers so parallel or interrupted runs cannot target normal records.
- Extend schema/hardening inventories to cover the currently implemented owner sessions, merchant sessions, and merchant settings security objects.
- Emit only stable, redacted failure categories. Never print connection strings, credentials, JWTs, session tokens/hashes, contact values, SQL text, or provider error details.
- Keep existing static migration-contract tests as supplemental evidence, not proof of live authorization behavior.
- Do not modify RLS, grants, function signatures, application authorization, Supabase configuration, dependencies, or product UI in SH-1.

## Acceptance examples

1. Missing `APP_ENV`, a value other than `local` or `test`, a missing confirmation, a project-reference mismatch, a non-Supabase host, or an unsafe pooler mode is rejected before any database connection or fixture write is attempted.
2. A valid local/test configuration whose API URL, database URL, and explicit project confirmation identify the same development project may start the harness.
3. Success, assertion failure, database failure, and unexpected exceptions all close connections and roll back every synthetic row; no success path commits fixtures.
4. Test fixtures use reserved synthetic values and unique run identifiers so they cannot select, overwrite, or delete ordinary merchant records and do not collide during parallel runs.
5. A valid merchant owner with the matching authenticated identity and exact active PieShop merchant session can read their settings through the effective live RPC.
6. Anonymous callers, platform owners, users without membership, future staff without an accepted capability, expired sessions, revoked sessions, and suspended or archived businesses cannot read or update merchant settings through direct RPC calls.
7. A merchant cannot substitute another tenant's business, membership, session hash, or settings reference to read or mutate that tenant.
8. A valid settings update persists only approved normalized fields, returns only the accepted response shape, increments the expected version, and creates exactly one value-free audit outcome.
9. Invalid and SQL `NULL` inputs, unknown fields, stale versions, and repeated submissions fail or behave idempotently according to the accepted Part 2.1 contract; failures leave settings and audit state unchanged.
10. Direct grants and RLS remain denied for merchant settings, and the hardening inventory verifies RLS/grants for all implemented security-sensitive tables and callable functions rather than only the original foundation tables.
11. Harness output uses stable stage/result codes and synthetic counts only. Injected provider/database messages containing token-, contact-, URL-, or credential-shaped values do not appear in terminal output, logs, Telegram, or test artifacts.
12. Documentation distinguishes verified runtime evidence from source inspection, historical results, planned controls, and accepted residual risks; no generic foundation pass is presented as proof of settings or owner-session authorization.

## TDD and verification evidence required

- Start with focused failing tests for target validation, cleanup/rollback, redacted diagnostics, expanded hardening inventory, and effective settings RPC behavior.
- Prefer reusable guard logic over copying a weaker environment-only check into another script.
- Prove the unsafe target is rejected before constructing the Postgres client through dependency injection or another observable boundary.
- Exercise the latest effective database definitions. SQL source assertions may remain but cannot satisfy direct-call, tenant-isolation, session, mutation, or audit cases.
- Record each command, final exit code, assertion count, and whether evidence is local static, local executable, or development-cloud executable.
- Run targeted tests and TypeScript/lint checks while iterating, then the complete relevant Release-mode checks routed by `WORKFLOW_CLASSIFICATION.md` before closing SH-1.
- No manual UI checkpoint is expected unless implementation changes visible UI behavior. Any unexpected UI change stops SH-1 for owner review.
- Update `SECURITY_IMPROVEMENT_HANDOFF_SOL.md`, applicable threat/acceptance documents, and `DEVELOPMENT_STATUS.md` with actual results. Never mark an unexecuted cloud assertion as passed.

## Completion gate

SH-1 is complete only when all acceptance examples are covered, relevant checks pass, documentation evidence is reconciled, and Mehedi Hassan accepts the result. SH-2 remains unauthorized until then. Any discovered authorization-policy defect is recorded for SH-2 through SH-4 rather than silently fixed within this verification-only part.

## Evidence matrix

| Acceptance area                                  | State          | Current evidence or remaining work                                                                                                          |
| ------------------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Target/environment/project confirmation          | Verified       | Seven local tooling assertions cover a valid target and stable denials for environment, confirmation, project, host, and pooler mode        |
| Stable redacted tooling failures                 | Verified       | Unit coverage proves arbitrary database error content is replaced; live scripts emit allow-listed target/stage codes only                   |
| Success rollback                                 | Verified       | Sixteen development-cloud assertions complete inside the rollback sentinel and report synthetic rollback                                    |
| Failure cleanup and parallel collision behavior  | Verified       | An injected failure leaves no marker row; two simultaneous 16-assertion runs pass with independent random synthetic identifiers             |
| Effective settings read authorization            | Verified       | Development-cloud positive, cross-tenant, malformed, revoked, suspended, and platform-owner direct RPC cases pass                           |
| Effective settings mutation and audit behavior   | Verified       | Valid update, version increment, idempotent retry, exactly-one audit, cross-tenant mutation denial, NULL rejection, and stale conflict pass |
| Direct-table denial and hardening inventory      | Verified       | Direct merchant-settings privilege denial passes; hardening now covers application sessions, merchant sessions, and settings                |
| Staff/no-membership/anonymous direct RPC denials | Verified       | Live staff/no-membership calls return no settings; anonymous has no function execution privilege                                            |
| Documentation evidence reconciliation            | Verified       | Threat numbering, checklist boundaries, cloud-only prerequisites, current implementation scope, and owner route examples are corrected      |
| UI checkpoint                                    | Not applicable | No visible application behavior has changed                                                                                                 |

## Implementation result

Automated implementation evidence is complete and awaiting owner result acceptance. No application UI, database schema, RLS policy, grant, provider setting, dependency, or persisted development record changed. The live harness ran twice concurrently and all synthetic transactions rolled back.
