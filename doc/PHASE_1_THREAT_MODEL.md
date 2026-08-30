# Phase 1 Threat Model — Platform Owner and Merchant Access

**Version:** 1.0 — accepted

**Assessment date:** 2026-08-28 Australia/Sydney

**Scope:** Roadmap Parts 1.1–1.4

**Environment:** Private local development and disposable Supabase development project with synthetic data only

## Assessment outcome

The owner accepted the six Phase 1 security decisions and authorised Part 1.1 on 2026-08-30 Australia/Sydney. Phase 1 may proceed one roadmap part at a time after applicable threats are mapped to automated acceptance tests. This assessment contains no product implementation.

The current design is suitable for private MVP development with synthetic data. It is **not approved for a real-vendor demo, real personal data, staging, or production** until MFA, durable distributed rate limiting, production email controls, and the production security gate are complete.

## Scope

Phase 1 introduces:

- platform-owner email/password login for a manually provisioned Supabase Auth user;
- server-side session and platform-role verification;
- a privacy-preserving merchant-account dashboard;
- owner-controlled merchant creation and invitation;
- merchant passwordless login through one-time magic links;
- an application-enforced 30-day merchant session maximum;
- merchant status and suspension controls; and
- append-only authentication and administration audit events.

Excluded from Phase 1 are public signup, real merchants or customer data, MFA, self-service recovery, support access, catalogue and transaction management, customer ordering, and payments.

## Actors and protected assets

### Actors

- **Platform owner:** manages approved merchant account metadata but cannot inspect merchant catalogue or transactions.
- **Merchant:** accesses only businesses covered by an active membership.
- **Unauthenticated visitor:** reaches public authentication routes only.
- **Supabase Auth/database and email delivery:** external trust boundaries.
- **Attacker:** may possess a guessed email, stolen password, stolen link, browser access, or a valid account without an application role.

### Protected assets

- passwords, access/refresh tokens, PKCE verifiers, magic links, and session cookies;
- platform roles, memberships, invitations, and merchant status;
- merchant existence and administrative metadata;
- merchant catalogue, transaction, payment, bank, and customer privacy;
- service-role credentials and database connection strings; and
- immutable audit evidence identifying the real actor, action, target, result, and UTC time.

## Trust boundaries

1. Browser to public Next.js authentication routes.
2. Browser to Server Actions and route handlers; every request and parameter is untrusted.
3. Next.js server to Supabase Auth.
4. Next.js server to Postgres and RLS policies.
5. Supabase Auth to email delivery, merchant inboxes, and automated link scanners.
6. Routing middleware/proxy checks to authoritative server/database authorization.
7. Platform administration to merchant-owned data.
8. Development tooling to the disposable cloud database.

## Security invariants

- Authentication alone never grants a platform role or membership.
- Every protected operation revalidates the session and authoritative role or membership server-side.
- Middleware/proxy is an early redirect only, never the authorization control.
- Platform-owner queries return allow-listed merchant account metadata only.
- Public signup and implicit Auth-user creation remain disabled.
- Invitations are scoped, expiring, single-use, hashed at rest, intended-recipient-bound, and atomically redeemed.
- Suspension or removal blocks the next protected request even when a browser retains a syntactically valid session.
- PieShop enforces the merchant's 30-day absolute deadline on every protected request.
- Secrets, tokens, raw links, complete email addresses, and personal data never enter logs, alerts, URLs, source, tests, or browser bundles.
- Administrative/security events are append-only and preserve the real actor.
- Service-role credentials remain server-only and never replace normal authorization.

## Inherited Phase 0 controls

Phase 1 depends on the target guard, secret scan, typed errors, central messages, structured redacted logs, UTC instants, RLS, self-bound authorization helpers, immutable audit records, deterministic synthetic seed, and transactional cloud security harness. A regression in any inherited control blocks Phase 1.

## Threat register

| ID     | Threat or abuse case                                                                 | Risk     | Required control and evidence                                                                                                 |
| ------ | ------------------------------------------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| TM1-01 | Credential stuffing or owner-password guessing                                       | High     | Generic response, bounded attempts, strong manually managed password, throttling; rate-limit tests                            |
| TM1-02 | Login wording, timing, or recovery reveals whether an account exists                 | High     | One central generic failure path; unknown-email/wrong-password equivalence tests                                              |
| TM1-03 | A valid Auth user without an active platform role reaches owner functions            | Critical | Deny-by-default authoritative role checks; authenticated-without-role tests                                                   |
| TM1-04 | Client state, middleware, layout checks, or stale JWT claims become authorization    | Critical | Recheck session and database authority inside every protected handler/action; direct-entry tests                              |
| TM1-05 | Stolen cookie or refresh token is reusable                                           | High     | Secure HttpOnly SameSite cookies, TLS outside local, no token logging, expiry/revocation; cookie and revoked-session tests    |
| TM1-06 | Login CSRF or session swapping binds a victim to an attacker session                 | High     | PKCE/state and origin validation, session rotation; invalid-state/cross-origin tests                                          |
| TM1-07 | Provider defaults leave sessions valid indefinitely                                  | High     | Application absolute/inactivity deadlines checked on protected requests; injected-clock boundary tests                        |
| TM1-08 | Suspension or role/membership removal fails to revoke access promptly                | Critical | Fresh authoritative checks and provider revocation where available; mutation-then-access tests                                |
| TM1-09 | Cross-site requests perform authenticated administration                             | High     | SameSite cookies, origin validation, framework CSRF controls; cross-origin mutation tests                                     |
| TM1-10 | Callback or `next` creates an open redirect                                          | High     | Allow-list relative application paths; external, encoded, and scheme-relative redirect tests                                  |
| TM1-11 | Invitation is stolen, replayed, consumed by a scanner, or redeemed concurrently      | Critical | Hashed single-use token, expiry, email binding, confirmation before consumption, atomic redemption; replay/race/scanner tests |
| TM1-12 | Magic-link request creates an unapproved user or enables public signup               | Critical | Disable signup, `shouldCreateUser: false`, require valid invitation; uninvited-email tests                                    |
| TM1-13 | Auth creation succeeds while business, membership, or audit creation fails           | High     | Recoverable provisioning state, idempotency and compensation; injected-failure/retry tests                                    |
| TM1-14 | Mass assignment or IDOR modifies another merchant                                    | Critical | Allow-listed typed input, target lookup, role check, RLS and affected-row check; alternate-ID/extra-field tests               |
| TM1-15 | Owner administration exposes catalogue, transaction, bank, payment, or customer data | Critical | Least-privilege metadata query contract and forbidden-field assertions                                                        |
| TM1-16 | Service-role credential reaches the browser or broadly bypasses authorization        | Critical | Server-only adapter, narrow usage, import boundary and secret/bundle scans                                                    |
| TM1-17 | Administrative action is unaudited or its audit evidence is mutable                  | High     | Same-workflow append-only audit with real actor and UTC; success/failure and mutation-denial tests                            |
| TM1-18 | Auth/invitation flows leak addresses or permit email flooding                        | High     | Redaction, generic response, cooldown and source/account limits; log-capture/send-limit tests                                 |
| TM1-19 | Auth traffic exhausts application, database, Auth, or email capacity                 | Medium   | Size/time bounds, throttling, provider timeout and safe failure; resource-limit tests                                         |
| TM1-20 | Authenticated HTML or a `Set-Cookie` response is shared from cache                   | Critical | Dynamic/no-store auth responses and no shared caching of cookie-setting responses; cache/cross-session tests                  |
| TM1-21 | Password recovery becomes an unreviewed authentication bypass                        | High     | No MVP recovery UI; controlled internal reset, revoke sessions and audit; route-absence/procedure review                      |
| TM1-22 | MVP assurance is mistaken for production readiness                                   | Critical | Environment gate blocks real-vendor demo/data/staging/production until MFA and production controls pass                       |
| TM1-23 | Retries create duplicate businesses, memberships, invitations, or audit outcomes     | High     | Idempotency, unique constraints and transaction/locking; concurrent-submit tests                                              |
| TM1-24 | Beta SSR-auth dependency changes cookie/session behaviour                            | High     | Exact version pin, PieShop adapter, reviewed upgrades, lifecycle integration tests and lockfile audit                         |

## Required verification by roadmap part

### Part 1.1 — Internal platform-owner login

The acceptance contract must cover TM1-01–TM1-10, TM1-17, and TM1-20–TM1-22 plus TM1-24. Tests must call protected actions and handlers directly; browser redirects alone are insufficient evidence.

### Part 1.2 — Privacy-preserving merchant dashboard

The acceptance contract must cover TM1-03, TM1-04, TM1-08, TM1-14, TM1-15, TM1-17, TM1-20, and TM1-23. A forbidden-field assertion must prove that owner payloads cannot contain catalogue, transaction, payment, bank, or customer fields.

### Part 1.3 — Merchant creation and invitation

The acceptance contract must cover TM1-10–TM1-18 and TM1-23. Invitation redemption must be tested for expiry, replay, recipient mismatch, link scanning, injected partial failure, and concurrency.

### Part 1.4 — Merchant status and suspension

The acceptance contract must cover TM1-04, TM1-08, TM1-14, TM1-17, and TM1-23. Suspension must block a new protected request despite a still-valid browser session.

## Phase 1 security decisions

1. **Owner session:** use a 12-hour absolute maximum and 2-hour inactivity maximum in the private MVP, with a fresh role check for protected operations.
2. **Merchant session:** use an exact 30-day absolute maximum enforced by PieShop; user activity does not extend it.
3. **Rate limiting:** process-local limiting is acceptable only while private/local and synthetic. Durable shared limiting is mandatory before external access.
4. **Recovery:** provide no self-service recovery UI in Phase 1. Use a documented internal Supabase procedure, revoke sessions, and record the action.
5. **Email:** use Supabase development email only with synthetic addresses. Require controlled SMTP and a security/deliverability review before inviting a real merchant.
6. **Auth libraries:** exact-pin `@supabase/ssr` and `@supabase/supabase-js`, place them behind PieShop adapters, and require auth integration tests for upgrades.

## Phase-entry gates

- [x] The owner accepted the six decisions above on 2026-08-30 Australia/Sydney.
- [x] `PART_1_1_ACCEPTANCE.md` maps applicable threat IDs to proposed automated evidence; owner confirmation of its examples remains pending.
- [x] The owner accepted that the app remains private/local with synthetic data while MFA and durable shared rate limiting are absent.
- [ ] The owner creates or confirms a synthetic Supabase Auth owner without sharing credentials in chat; platform role assignment uses a reviewed, auditable development procedure before the cloud login checkpoint.

## Residual risks

- No owner MFA is accepted only for private synthetic development and is prohibited for a real-vendor demo or external environment.
- Magic-link security partly depends on the recipient mailbox and delivery path. Short-lived, single-use, recipient-bound invitations reduce but cannot eliminate this dependency.
- Supabase may enforce configured session time limits during refresh rather than continuously. PieShop therefore checks its own deadline on protected requests.
- Process-local rate limiting resets on restart and does not coordinate multiple instances; it is not suitable for external deployment.
- Supabase documents its SSR helper as beta. Pinning, adapters, and integration tests reduce but do not eliminate upstream risk.

## Review triggers

Review this model before changing authentication method, session duration, cookie strategy, invitation delivery, email provider, recovery process, auth dependency, role/membership schema, hosting exposure, or before introducing a real person or production-like data.

## References

- `THREAT_MODELING_STANDARD.md`
- `PHASE_0_THREAT_MODEL.md`
- `MVP_PRODUCT_REQUIREMENTS.md`
- `TECHNICAL_ARCHITECTURE.md`
- `DATA_MODEL.md`
- `SECURITY_PRIVACY_REVIEW.md`
- Supabase server-side authentication, sessions, password, passwordless, and PKCE documentation
- Next.js 16 authentication, data-security, Server Actions, cookies, and proxy documentation installed with this repository
