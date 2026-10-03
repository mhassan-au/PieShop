# SH-2 Design — Exact Owner Session Enforcement

**Owner:** Mehedi Hassan  
**Scope:** Private synthetic development only  
**Status:** Design and 14 acceptance examples accepted for local TDD implementation by Mehedi Hassan on 2026-09-06 Australia/Sydney

## Problem

The Next.js owner guard verifies and touches the PieShop application session, but several authenticated Data API RPCs independently authorize only with `auth.uid()` plus the active `platform_owner` role. A caller holding a valid owner Supabase JWT can therefore bypass the additional PieShop session expiry/revocation boundary by calling those RPCs directly.

SH-2 closes that gap for existing owner control-plane operations. It does not redesign how a new owner session is created; fresh-authentication binding belongs to SH-3/S03.

## Inventoried operations

The following authenticated owner operations require exact-session enforcement:

| Operation                                                     | Current application caller   | SH-2 requirement                                                                                             |
| ------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `list_platform_merchants()`                                   | Control page                 | Require current owner session hash                                                                           |
| `create_platform_merchant(text, text, text, text)`            | Create merchant action       | Require current owner session hash                                                                           |
| `issue_platform_merchant_invitation(uuid, text, timestamptz)` | Issue invitation action      | Require current owner session hash                                                                           |
| `revoke_platform_merchant_invitation(uuid)`                   | Revoke invitation action     | Require current owner session hash                                                                           |
| `change_platform_merchant_status(uuid, text)`                 | Status action                | Require current owner session hash                                                                           |
| `list_current_user_application_sessions(text)`                | Control page                 | Validate the supplied current hash as a live exact owner session before listing                              |
| `revoke_current_owner_session(uuid, text)`                    | Revoke-other-session action  | Require a separate current-session hash; target ID remains server-validated                                  |
| `revoke_all_current_user_sessions(text)`                      | Recovery/administrative flow | Require a current-session hash for an interactive owner call; preserve any separately reviewed recovery path |

`touch_current_owner_session(text)` and `revoke_current_owner_session_by_token(text)` already bind their effect to the supplied hash and authenticated owner identity. Logout must remain able to revoke its matching session without requiring a second session. `create_current_owner_session(text, text)` is the login bootstrap exception and moves to the SH-3 fresh-authentication review.

Service-role-only invitation delivery lookup is not converted into a browser RPC. Its server caller must first complete the same exact owner-session guard, and its existing service-role grant remains isolated.

## Accepted design if approved

1. Add a non-public helper equivalent to `app_private.is_current_owner_session(text)`.
2. The helper derives identity only from `auth.uid()` and returns true only when:
   - the hash has exactly 64 lowercase hexadecimal characters;
   - the authenticated user has an active `platform_owner` role;
   - the matching `application_sessions` row belongs to that same user;
   - it is not revoked; and
   - both absolute and idle expiry are still in the future.
3. The helper does not accept a user ID, role, time, assurance level, or session ID from the caller. It does not expose session rows or hashes.
4. Every inventoried owner RPC receives `p_owner_session_token_hash text` and checks the helper at the database boundary before reading, locking, mutating, or writing audit events.
5. Read-only checks do not silently extend session lifetime. The existing request guard remains responsible for the bounded activity touch.
6. Replace old callable signatures atomically in one forward migration and revoke/drop obsolete signatures so they cannot remain as bypasses.
7. Repositories require an opaque server-only session proof/hash argument and include it in the RPC parameter allow-list. No browser form, URL, component prop, action state, message, log, audit context, or provider response contains it.
8. `verifyRequestPlatformOwnerAccess` returns the already-computed hash only in its server-only authorized result, preventing repeated cookie reads and inconsistent re-hashing. The value is never serializable across a client boundary.
9. Replace the platform-owner branch of the direct `businesses` SELECT policy with membership-only access. Platform metadata remains available only through the exact-session-bound list RPC. Merchant membership access remains unchanged; broader legacy grants remain for SH-3/S04 review.
10. All denials are equivalent and fail before mutation. They reveal neither whether the role, user, target session, business, or hash exists.

## Acceptance examples

1. Correct owner JWT, active owner role, and matching live current-session hash can list merchant metadata.
2. The same JWT with no hash, malformed hash, unknown hash, another device's hash, another user's hash, revoked session, idle-expired session, or absolute-expired session receives no owner metadata.
3. A valid hash without an authenticated identity, a merchant identity, an inactive/absent owner role, or a different authenticated owner is denied equivalently.
4. Every merchant-create, invitation-issue/revoke, and merchant-status mutation denial leaves businesses, invitations, sessions, and audit events unchanged.
5. Direct authenticated invocation of every obsolete owner RPC signature fails after migration.
6. Direct `businesses` SELECT by a platform owner no longer returns merchant rows; a legitimate active merchant membership retains its currently approved self-bound business metadata read.
7. Session listing requires the exact active current hash and never returns hashes. A different session belonging to the same owner cannot be substituted as the current proof.
8. Revoking another owner session requires both its target UUID and the caller's different exact current hash. A target UUID alone, another device's proof used as current proof, or another owner's target cannot revoke anything.
9. Exact-session logout can still revoke its own matching session, clear cookies, and leave other devices unchanged even when the session is near expiry.
10. Existing create-session login behavior remains unchanged and explicitly tracked as SH-3 residual risk; SH-2 must not claim to establish fresh authentication.
11. Successful mutations preserve real actor identity and existing value-free audit semantics. Hashes and session proof never appear in audit payloads or returned rows.
12. Server actions and the control page obtain proof only from the server-only access result and pass no caller-supplied tenant, actor, role, or session identity.
13. Concurrent revocation/status changes use the existing row-lock/idempotency behavior and recheck exact-session authority at the mutation boundary where waiting could make the earlier check stale.
14. Provider/database failures remain generic and centrally handled; tests and debug logging use stable stages without credentials or merchant content.

## TDD and migration sequence

1. Add failing migration-contract, repository, request-guard, action, and direct database tests for the examples above.
2. Add the private helper and replacement RPC signatures in one additive forward migration. Preserve historical migrations.
3. Update server-only access result and repository/action callers in the same working change so no route uses obsolete signatures.
4. Run targeted tests, TypeScript, lint, migration dry-run, SH-1 harnesses, owner direct-RPC security tests, and the complete Release-mode quality gate.
5. Present the exact migration and direct-call matrix for review. Applying it to development Supabase requires separate explicit owner authorization.
6. After application, rerun dry-run, schema, hardening, foundation security, owner RPC security, and merchant settings security checks.
7. Perform a grouped owner UI/process checkpoint: load control metadata, create a synthetic merchant only if a reversible fixture is needed, issue/revoke an invitation without exposing it, change a reversible status, list sessions, revoke another synthetic session, and log out/replay.

## Non-goals and residual risk

- No MFA/AAL2 production rollout.
- No redesign of owner login/session creation; SH-3 owns fresh-authentication replay prevention.
- No public signup, support impersonation, catalogue access, or merchant-content access for the platform owner.
- No service-role substitution for normal owner operations.
- No changes to merchant settings/catalogue authorization except preserving existing membership reads while removing the owner direct-table branch.
- No production/staging action, real vendor data, dependency, provider setting, or recurring cost.

## Decision requested

Approve this exact-session design and its 14 acceptance examples for local TDD implementation. This approval permits preparing a forward migration and running guarded rollback-only development tests, but it does not authorize applying the migration to Supabase. That application remains a separate checkpoint after the migration diff and dry-run are reviewed.
