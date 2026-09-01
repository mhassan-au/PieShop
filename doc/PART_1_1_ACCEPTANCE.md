# Part 1.1 Acceptance — Internal Platform-Owner Password Login

**Status:** Accepted by the owner on 2026-08-30 Australia/Sydney

**Project and code owner:** Mehedi Hassan

**Prepared:** 2026-08-30 Australia/Sydney

**Roadmap scope:** Part 1.1 only

**Security scope:** `PHASE_1_THREAT_MODEL.md`, especially TM1-01–TM1-10, TM1-17, TM1-20–TM1-22, and TM1-24

## Objective

Allow the single, manually provisioned synthetic platform owner to sign in with email and password, enter a metadata-only control-plane shell, inspect and revoke their application sessions, sign out, and sign in again. Authentication must not create an account, infer authorization from authentication alone, or weaken the mandatory production MFA gate.

## Fixed boundaries

- Private local development and the disposable Supabase development project only.
- Synthetic identity and data only; credentials are never placed in chat, source, fixtures, logs, screenshots, or test output.
- No owner registration, public signup, automatic account creation, self-service password recovery, merchant login, merchant content, support access, or MFA implementation in this part.
- Owner sessions have a 12-hour absolute maximum and a 2-hour inactivity maximum. Activity never extends the absolute deadline.
- Authentication provider code stays behind PieShop adapters.
- Proxy/middleware and client UI may improve navigation but never provide authoritative authorization.

## Acceptance examples

### A. Login input and enumeration resistance

1. **Valid pre-provisioned owner** — Correct credentials for an active Auth user with an active `platform_owner` database role create a PieShop session and redirect only to the internal control-plane landing page. (TM1-03, TM1-04, TM1-10)
2. **Wrong password** — Login returns the central generic authentication failure and does not reveal whether the email exists. (TM1-01, TM1-02)
3. **Unknown email** — The public response, status family, and user-visible path match the wrong-password case. (TM1-02)
4. **Malformed or oversized input** — Validation fails safely before provider authentication, uses central copy, and never echoes a password. (TM1-01, TM1-18, TM1-19)
5. **Repeated failures** — Attempts are bounded per normalized account key and source key; a throttled attempt receives generic central copy and does not call the provider. Test time and limiter storage are injected. (TM1-01, TM1-02, TM1-18, TM1-19)
6. **No secret leakage** — Captured logs, alerts, errors, and rendered output contain no password, access/refresh token, session cookie, authorization header, or complete email address. (TM1-05, TM1-16, TM1-18)

### B. Authentication is not authorization

7. **Auth user without platform role** — Correct provider credentials do not grant control-plane access; any provisional provider session is terminated and the public response remains generic. (TM1-03)
8. **Inactive or removed role** — An authenticated user whose platform role is inactive, removed, or changed is denied on the next protected request. (TM1-03, TM1-08)
9. **Direct entry-point calls** — Every protected page data loader, route handler, and Server Action denies missing or unauthorized sessions when called directly, regardless of client state or proxy routing. (TM1-04, TM1-09)
10. **Stale claims ignored** — A stale role claim or previously rendered page cannot restore authority after the database role changes. (TM1-04, TM1-08)
11. **Metadata-only shell** — The first protected page contains no merchant catalogue, transaction, payment, bank, message, address, or customer query/payload. (TM1-15)

### C. Session lifecycle

12. **Secure cookie contract** — The application session cookie is HttpOnly, Secure outside local HTTP development, SameSite=Lax or stricter, path-scoped appropriately, and contains only an opaque identifier. (TM1-05, TM1-06, TM1-09)
13. **Absolute timeout** — A session is valid immediately before 12 hours and denied at or after its absolute expiry. (TM1-07)
14. **Idle timeout** — A session is valid immediately before 2 hours of inactivity and denied at or after the idle deadline without exceeding its absolute expiry. (TM1-07)
15. **Logout** — Logout invalidates the server-side application session, clears the browser cookie, records the real actor, and prevents cookie replay. (TM1-05, TM1-08, TM1-17)
16. **Session list and revocation** — The owner sees only their safe session metadata and can revoke another listed session; raw tokens and opaque identifier hashes are never returned. Revocation blocks the next request. (TM1-05, TM1-08, TM1-14)
17. **Privilege/recovery invalidation** — Role removal/change, account suspension, or the documented internal recovery procedure invalidates relevant application sessions. (TM1-08, TM1-21)
18. **Concurrent/repeated revocation** — Repeated or concurrent revocation is idempotent and creates no contradictory session state. (TM1-23)

### D. Request, redirect, and cache safety

19. **Origin protection** — Cross-origin login, logout, and session-revocation mutations are rejected safely. (TM1-06, TM1-09)
20. **Redirect allow-list** — Missing or valid relative return paths resolve safely; absolute, scheme-relative, encoded, or unapproved destinations resolve to the control-plane default. (TM1-10)
21. **No shared auth caching** — Login, logout, protected HTML/data, and every response that changes cookies use dynamic/no-store behavior and cannot be replayed across two synthetic sessions. (TM1-20)
22. **No public account routes** — Owner signup, automatic account creation, and self-service recovery routes/actions are absent. Provider calls explicitly prohibit implicit signup where applicable. (TM1-12, TM1-21)

### E. Audit, failure, and future release gate

23. **Audited security events** — Successful login, failed/throttled login, logout, session revocation, authorization denial, and expired-session denial create structured, redacted evidence with UTC time and correlation data; only authenticated actions claim an actor identity. (TM1-17, TM1-18)
24. **Provider failure** — Provider timeout or unavailable Auth fails closed with typed central copy, no raw provider message, no partial PieShop session, and a sanitized diagnostic event. (TM1-13, TM1-19)
25. **AAL policy seam** — Protected authorization accepts an injected assurance policy. Private synthetic development permits the documented reduced-assurance policy; a production-like configuration refuses owner access below AAL2. (TM1-22)
26. **Dependency isolation** — Tests can replace the Auth provider without importing Supabase into domain/session policy code; auth package versions are exact-pinned and secret/client import scans remain green. (TM1-16, TM1-24)

## TDD sequence

1. Central authentication messages, typed inputs, and safe redirect tests.
2. Provider adapter contract and generic login-result mapping.
3. Authoritative platform-role policy and direct-entry authorization tests.
4. Application session lifecycle, expiry, revocation, and audit tests.
5. Login/control-plane/session UI component tests.
6. Server integration, cache/cookie, Supabase authorization, and browser-flow tests.

Each sequence must show the relevant failure before its minimum implementation is added. Closely related focused tests may be run together.

## Required completion evidence

- All 26 examples have automated evidence or a documented reason for an owner-only visual check.
- Relevant migration, schema, RLS, authorization, session concurrency, and audit tests pass.
- `npm run check` passes, including production build, secret scan, and dependency audit.
- Relevant `npm run test:e2e` desktop and mobile login/logout scenarios pass.
- The owner confirms login, generic error wording, protected-page behavior, session visibility/revocation, logout, and responsive usability on phone and desktop.
- `doc/DEVELOPMENT_STATUS.md` records evidence and owner acceptance before Part 1.2 is authorised.

## Owner checkpoint

Mehedi Hassan confirmed that these examples express the intended Part 1.1 behavior and authorised TDD implementation on 2026-08-30 Australia/Sydney. At the UI checkpoint, the owner uses only the synthetic pre-provisioned account through local environment/provider configuration and never shares its credentials in chat.

Use the shared and Part 1.1 owner test cases in `UI_TEST_CHECKLISTS.md` for the final UI/process checkpoint.

The controlled synthetic-development recovery baseline is recorded in `OWNER_ACCOUNT_RECOVERY.md`; it exposes no public recovery route and requires transactional PieShop-session revocation plus actor-unclaimed audit evidence.

## Completion record

Part 1.1 was completed and accepted by Mehedi Hassan on 2026-09-01 Australia/Sydney. The final evidence comprises 37 passing test files with 182 assertions, the production build, formatting/lint/TypeScript checks, secret scanning, a dependency audit with zero vulnerabilities, eight passing desktop/mobile browser regressions, applied guarded development migrations, and owner-verified login, protected access, logout, session revocation, safe session metadata, and current-session distinction. Part 1.2 is not authorised by this acceptance.
