# Part 1.2 Acceptance — Privacy-Preserving Merchant Dashboard

**Owner:** Mehedi Hassan  
**Scope:** Private synthetic development only  
**Status:** Accepted for TDD implementation on 2026-09-01 Australia/Sydney

## Locked scope

- The authenticated active platform owner can list and create merchant account metadata.
- A new merchant starts in `onboarding`, currency `AUD`, and an approved IANA timezone defaulting to `Australia/Sydney`.
- Creation also creates an unsent draft merchant-owner invitation. Sending, token delivery, and redemption are Part 1.3.
- No public creation endpoint, merchant self-signup, implicit Auth user creation, merchant membership, or merchant-content access is added.

## Acceptance examples

1. A freshly authorized platform owner receives only merchant ID, public ID, name, status, timezone, currency, onboarding state, invitation state, and UTC timestamps.
2. Catalogue, transaction, order, payment, bank, customer, address, message, and support-content fields are structurally absent from owner results.
3. A missing, inactive, or non-owner identity cannot list or create merchants through direct action/RPC calls.
4. Name and owner email are trimmed; email is lower-cased; malformed, oversized, or extra fields fail before persistence.
5. Public IDs are generated server-side and cannot be supplied by the browser.
6. New merchants always begin in `onboarding`; the browser cannot choose active, suspended, or archived.
7. Currency and timezone are allow-listed and validated server-side.
8. Business and draft invitation creation happen in one transaction or neither persists.
9. The draft invitation is not sent and cannot be redeemed in Part 1.2.
10. Retrying the same normalized owner email and business name does not create duplicate businesses or contradictory audits.
11. Concurrent duplicate submissions produce exactly one business and one draft invitation.
12. Creation records the authenticated platform owner in an append-only audit event without email, token, or merchant-content data.
13. Listing and creation fail closed on database/provider failure with central safe copy.
14. Responses are dynamic/no-store and cannot be shared between sessions.
15. Merchant rows remain tenant isolated; platform access to `businesses` grants no catalogue or transaction access.
16. The list and form remain usable by keyboard and at phone width with persistent labels and clear pending/error states.

## Required evidence

- Domain, validation, repository, migration, authorization/RLS, idempotency/concurrency, forbidden-field, component, direct-action, and browser tests pass.
- Guarded development migration dry-run identifies only reviewed Part 1.2 migrations; cloud apply requires the project’s database gate.
- `npm run check` and relevant Playwright scenarios pass.
- The owner creates one synthetic merchant and accepts the list/detail workflow before Part 1.3 is authorized.
