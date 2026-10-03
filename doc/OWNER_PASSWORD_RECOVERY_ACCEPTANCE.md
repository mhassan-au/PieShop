# Owner Password Recovery Acceptance

**Mode:** Release
**Scope:** Private local development with synthetic data only
**Status:** Accepted by Mehedi Hassan on 2026-10-03

## Boundary

PieShop may offer recovery only for the manually provisioned platform-owner account. It does not create users, reveal whether an email exists, or authorize merchant recovery. Real-vendor demos, real data, staging, production, and external access remain blocked pending MFA/AAL2 recovery design, independent verification, durable throttling, notification, and operational monitoring.

## Acceptance examples

1. Valid, invalid, unknown, throttled, and provider-failed email submissions return the same public response.
2. Recovery uses Supabase PKCE with an allow-listed `/auth/recover` callback and disabled account creation.
3. The callback requires a code plus the same-browser HttpOnly email-hash binding and rejects mismatched identities.
4. Only an active `platform_owner` may receive a short-lived process-local recovery grant.
5. The grant is opaque, HttpOnly, same-site, environment-secure, expires within ten minutes, and is single-use.
6. A normal signed-in owner session without the recovery grant cannot submit a new password.
7. Password and confirmation are server validated, match, and contain at least eight characters with upper and lower case, a number, and a symbol under the owner-accepted private-development policy.
8. Before password mutation, a self-bound database RPC revokes every live PieShop owner application session with reason `recovery`.
9. The revocation RPC preserves the real boundary by deriving `auth.uid()`, accepting no user ID, and requiring an active platform-owner role.
10. Recovery revocation appends a value-free audit event with no claimed actor and only the revoked-session count.
11. After password mutation, global Supabase sign-out is attempted and all local PieShop/recovery cookies are cleared.
12. Provider or database failure returns central generic copy; no password, code, cookie, token, email, provider response, or raw error is logged.
13. Old PieShop application sessions cannot replay `/control`; the new password can create a fresh exact-bound owner session.
14. The complete local Release gate, migration dry-run, direct database security assertions, and owner browser checkpoint pass before this part closes.

## Owner checkpoint

- Request recovery for the synthetic owner and observe generic copy.
- Open the sandbox recovery email in the same browser and reach the reset form without token material remaining in the URL.
- Confirm mismatch validation, then set a new strong password.
- Confirm redirect to login, denial of the old PieShop session, rejection of the old password, successful new-password login, and a fresh session list.
