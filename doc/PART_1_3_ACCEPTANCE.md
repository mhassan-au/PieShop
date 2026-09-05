# Part 1.3 Acceptance — Secure Merchant Invitation

**Owner:** Mehedi Hassan  
**Scope:** Private synthetic development only  
**Status:** Authorized for TDD implementation on 2026-09-05 Australia/Sydney

## Locked scope

- Only an active platform owner may issue, resend, or revoke a draft merchant-owner invitation.
- Invitations use a cryptographically random, single-use token; only its hash is stored. Tokens expire after 24 hours.
- Opening an invitation link shows a confirmation page and never consumes it. Redemption occurs only after an explicit POST, authenticated email verification, and recipient match.
- Redemption atomically creates exactly one active `merchant_owner` membership, marks the invitation used, records the real actor, and starts a revocable merchant session with a 30-day absolute maximum.
- Public signup, implicit membership, passwords, owner access to merchant content, real recipients, and production readiness remain excluded.

## Acceptance examples

1. Missing, inactive, or non-owner identities cannot issue, resend, or revoke invitations through direct action/RPC calls.
2. The target must be an existing onboarding merchant with a draft, issued, or revoked merchant-owner invitation.
3. Token material has at least 256 bits of entropy, appears only in the delivery link, and never enters database rows, logs, alerts, browser bundles, or owner responses.
4. Stored token hashes are deterministic for verification but do not reveal the token.
5. Issuing sets a UTC expiry 24 hours ahead and records an append-only audit event without email or token material.
6. Resending rotates the token, invalidates the prior link, applies cooldown/rate limits, and does not create another invitation row.
7. Revocation invalidates the link immediately and is idempotent.
8. GET/link-preview requests never consume an invitation or create a user/membership/session.
9. Tampered, malformed, expired, revoked, already-used, or superseded tokens fail with the same safe response.
10. Redemption requires an authenticated provider identity whose normalized email matches the invited recipient.
11. An uninvited Auth identity receives no membership even when it can authenticate.
12. Concurrent or replayed redemption creates exactly one membership and one successful audit outcome.
13. Injected failure creates neither a partial membership nor a used invitation; retry remains safe.
14. Successful redemption removes token material from the URL before entering merchant pages.
15. Merchant sessions fail after logout, revocation, suspension, privilege change, or the 30-day absolute deadline.
16. Owner responses expose operational status/timestamps only and never expose invited email, token, Auth identifiers, merchant content, or provider errors.
17. Delivery is behind a server-only adapter; automated tests use a capture adapter and send no real email.
18. Owner controls and public confirmation remain keyboard-accessible, mobile usable, and use centralized pending/success/failure copy.

## Required evidence

- Token, lifecycle, recipient-binding, expiry, replay, concurrency, partial-failure, authorization/RLS, audit, redaction, action, component, and browser tests pass.
- A guarded development migration dry-run identifies only reviewed Part 1.3 migrations; cloud apply requires explicit owner authorization.
- Supabase redirect/auth configuration and synthetic delivery require an owner checkpoint. No real recipient is used.
- The owner accepts the combined issue/resend/revoke and merchant redemption flow before Part 1.4.
