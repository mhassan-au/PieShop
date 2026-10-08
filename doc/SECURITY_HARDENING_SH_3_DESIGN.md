# SH-3 Design — Fresh Session Creation and Legacy Access Removal

**Owner:** Mehedi Hassan
**Scope:** Private synthetic development only
**Status:** Design and 16 acceptance examples accepted by Mehedi Hassan on 2026-10-04 Australia/Sydney

## Problem

PieShop currently lets an authenticated caller create a new owner or merchant application session by supplying a new application-session hash. The database derives the user from `auth.uid()`, but it does not prove that the caller just completed the required password or PKCE login ceremony. A retained or refreshed provider session can therefore mint a new PieShop lifetime.

Foundation placeholder grants also still allow authenticated direct access to `catalogue_entries` and `transaction_records`. Their membership-only policies do not enforce merchant business status or the exact PieShop application session, so suspension or application-session revocation can be bypassed through the Data API.

## Provider evidence and chosen boundary

Supabase access tokens contain a signed `session_id` that identifies the provider session. Authentication-method reference (`amr`) entries carry the method and authentication timestamp, while token refresh changes token issuance without proving a new login. SH-3 uses those signed claims as evidence; it does not accept caller-supplied identity, provider-session ID, method, assurance, or authentication time.

Before migration implementation, a redacted development integration probe must confirm the exact signed claim shape produced by the pinned Supabase version for:

- owner password login;
- merchant invitation PKCE completion;
- returning merchant magic-link PKCE completion;
- token refresh; and
- recovery, which must not create a PieShop application session.

Missing, malformed, ambiguous, unexpected, or future-dated evidence fails closed. If the pinned provider does not expose sufficient signed evidence, implementation stops for a new owner decision; it must not silently introduce a service-role capability, Auth Hook, or weaker timestamp heuristic.

Live evidence recorded on 2026-10-04 and 2026-10-06 Australia/Sydney: a fresh owner password login emitted a UUID-shaped signed `session_id`, `aal1`, and one `password` AMR entry with an integer timestamp. Merchant invitation and returning-login PKCE completions each emitted a distinct UUID-shaped provider session, `aal1`, and one integer-timestamped `magiclink` AMR entry; returning login did not reuse the earlier invitation session. Recovery emitted another distinct UUID-shaped provider session with one integer-timestamped `recovery` AMR entry. Explicit refreshes preserved every provider-session binding and original authentication method/timestamp, so refresh did not create fresh ceremony evidence. The temporary local-only probe exposed no token, session identifier, user identifier, email, or password and was removed after the checkpoint. The pinned provider therefore supplies sufficient signed evidence for the accepted SH-3 boundary.

## Accepted design if approved

### Fresh authentication and provider-session binding

1. Add immutable provider-binding fields to owner and merchant application sessions: provider `session_id`, authoritative authentication method, and authentication instant. Store no JWT, refresh token, email, OTP, PKCE code, or raw application-session token.
2. Read provider evidence only from verified `auth.jwt()` claims at the database boundary. Continue deriving identity from `auth.uid()` and current role/membership rows.
3. Verify that the signed provider `session_id` is a UUID, belongs to the authenticated user, and still corresponds to a live row in `auth.sessions` at creation time. A refreshed access token retains the same provider-session binding and authentication instant.
4. Owner creation accepts only a freshly authenticated password ceremony for the active platform owner. Merchant invitation redemption and returning login accept only their verified PKCE email-link ceremony. AAL and method are derived, never supplied by the caller.
5. Use a short creation window measured from the authoritative authentication-method timestamp. The proposed private-development window is five minutes, inclusive at the lower boundary and exclusive after five minutes. Provider/session time, not a browser clock, is authoritative.
6. Anchor `created_at` and absolute expiry to the authentication instant rather than the RPC call time. Owner expiry remains authentication time plus 12 hours; merchant expiry remains authentication time plus 30 days. Refreshing a token or delaying/retrying an RPC cannot restart either lifetime.
7. Bind at most one live PieShop application session to the same provider session and business context. An exact retry with the same application-session hash is idempotent and returns the existing safe result. A different hash for an already-bound provider session is denied rather than rotating authority.
8. Invitation redemption remains atomic: invitation lock and recipient match, active business check, membership creation/reactivation, provider-bound application-session creation, invitation consumption, and audit append either all commit or all roll back.
9. Audit method, assurance, and authentication instant only from verified provider evidence. Do not include provider-session IDs, hashes, tokens, emails, or provider payloads in audit context or returned rows.
10. Move obsolete session-creation signatures into the inaccessible private schema or drop them, revoke every browser-role grant, and expose only the new self-authorizing signatures. Server adapters change atomically with the forward migration.
11. Password recovery does not create a PieShop session. After recovery and global sign-out, the owner must complete a fresh password login that produces a new provider session before PieShop session creation.
12. This private-development boundary remains AAL1. MFA/AAL2 and recent step-up remain mandatory before any real-vendor demo, real data, staging, production, or external release.

### Legacy direct-table access

13. Replay all migrations and inventory effective table, view, sequence, and function privileges for `anon`, `authenticated`, and `service_role` before changing grants.
14. Revoke authenticated `SELECT`/`INSERT`/`UPDATE` access from `catalogue_entries` and `SELECT`/`INSERT` access from `transaction_records`; remove their obsolete membership-only direct policies so a later grant cannot silently reactivate the bypass.
15. Preserve all rows, foreign keys, indexes, immutable-transaction triggers, audit protections, and rollback-safe security tests. SH-3 adds no hard-delete path and does not redesign future catalogue or transaction behavior.
16. Preserve only explicitly required self/control-plane metadata access for `businesses`, `profiles`, `memberships`, and `platform_roles`. Future catalogue/order work must use separately reviewed exact-session-bound RPCs rather than restoring broad table grants.

## Acceptance examples

1. A fresh owner password login with an active platform-owner role and valid signed provider evidence creates one exact-bound owner application session whose 12-hour limit starts at the authentication instant.
2. A refreshed JWT from the same provider session cannot extend or recreate that owner lifetime; an exact retry is idempotent and a different application hash is denied.
3. Owner creation is denied for missing/malformed provider session evidence, absent or ambiguous method evidence, non-password authentication, a future or older-than-five-minutes authentication instant, missing provider session, inactive role, wrong user, merchant identity, or anonymous identity.
4. A legitimate owner login on a new device has a distinct provider-session binding and can create its own application session without affecting another device.
5. A fresh merchant invitation PKCE completion atomically consumes the correct invitation and creates one provider-bound 30-day merchant session anchored to the authentication instant.
6. A fresh returning merchant magic-link PKCE completion creates one provider-bound 30-day session only for exactly one active merchant-owner membership and an onboarding or active business.
7. Merchant creation is denied for password, recovery, refresh-only, forged method/time, wrong identity, missing/expired/revoked provider session, inactive membership, suspended/archived business, multiple eligible businesses, anonymous identity, or an authentication instant outside the five-minute window.
8. Repeated or concurrent creation for one provider session produces at most one application session and one success audit outcome; conflicting hashes fail without extending expiry or changing the accepted row.
9. Invitation redemption replay, recipient mismatch, expiry, concurrency, or injected failure leaves membership, invitation, session, and audit state atomic and consistent.
10. Old callable session-creation signatures fail for `authenticated`, `anon`, and `public`; direct Data API calls cannot bypass the new provider-session and method checks.
11. Successful session audits report only the verified method/assurance and safe result; returned rows, logs, errors, URLs, cookies exposed to JavaScript, and audit payloads contain no provider-session ID, hashes, tokens, codes, or email.
12. A suspended merchant with an active membership and valid provider JWT cannot read or mutate `catalogue_entries` or insert/read `transaction_records` directly.
13. Missing, expired, or revoked PieShop application sessions; staff-only membership; cross-tenant identity; platform owner; and anonymous callers are denied the legacy table paths equivalently, with no row or audit mutation.
14. Authenticated direct table privileges for both placeholder tables are absent after migration, while transaction and audit immutability protections still pass.
15. Required self/control-plane metadata reads continue to work through their accepted exact-session or membership boundaries without exposing merchant business content to the platform owner.
16. A full Release-mode gate passes: static migration contracts, application adapters, rollback-safe live SQL authorization/concurrency checks, schema/hardening inventories, existing owner and merchant security suites, production build, secret scan, production dependency audit, and grouped owner login/invitation/returning-login browser checkpoint.

## TDD and migration sequence

1. Add failing provider-evidence parser, repository, migration-contract, authorization, idempotency, concurrency, and privilege-inventory tests.
2. Run the redacted development claim-shape probe. Stop for owner review if authoritative evidence is insufficient or differs materially from this design.
3. Prepare one forward migration that adds provider bindings, replaces creation RPCs, retires obsolete signatures, and removes legacy placeholder grants/policies without deleting data.
4. Update owner login, invitation redemption, and returning-login adapters atomically. Keep provider SDK access behind existing server adapters and retain compensation on failed cookie persistence.
5. Run the complete local and rollback-safe development database gates. Present the migration, effective grant diff, and direct-call matrix for review.
6. Applying the migration to development Supabase requires separate explicit owner authorization.
7. After application, rerun every relevant database and application gate, then perform one grouped owner UI/process checkpoint before requesting SH-3 acceptance.

## Non-goals and residual risk

- No MFA/AAL2 rollout, production deployment, real data, or public access.
- No Auth Hook, service-role session-minting endpoint, new provider, dependency, or recurring cost.
- No catalogue, order, payment, or transaction feature implementation.
- No weakening of 12-hour owner, 2-hour owner-idle, or 30-day merchant limits.
- No hidden impersonation, caller-supplied authorization claims, direct-table restoration, or hard deletion.
- The design depends on the pinned provider emitting sufficient signed session and authentication-method evidence. That dependency must be integration-tested and reviewed on provider upgrades.

## Decision requested

Approve this SH-3 fresh-authentication and legacy-access design, including the five-minute creation window and 16 acceptance examples, for local TDD implementation. Approval permits local code, a reviewable forward migration, and guarded rollback-only development tests. It does not authorize applying the migration to Supabase; that remains a separate checkpoint after the migration and privilege diff are reviewed.

## Decision record

Accepted by Mehedi Hassan on 2026-10-04 Australia/Sydney. Local TDD implementation and preparation of the forward migration are authorized. Applying that migration to development Supabase remains separately gated.
