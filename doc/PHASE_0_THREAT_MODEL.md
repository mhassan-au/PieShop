# Phase 0 Threat Model — Safe Project Foundation

## Review record

- **Model version:** 1.0
- **Review date:** 2026-08-28 Australia/Sydney
- **Scope:** Implemented Parts 0.1–0.4
- **Environment:** Local application plus dedicated disposable Supabase Cloud development project
- **Data classification:** Synthetic data only
- **Status:** Accepted for internal synthetic-data development; TM0-01 mitigated and verified
- **Next review:** Before Part 1.1 authorisation and whenever a Phase 0 review trigger occurs

This is a retrospective threat model of implemented code and migrations. It supplements the broader `SECURITY_PRIVACY_REVIEW.md`, which is a control baseline rather than a phase-specific threat model.

## 1. Target of evaluation

Phase 0 contains:

- Next.js application shell and browser security-header baseline.
- Environment validation and development/test separation.
- Central messages, typed errors, and public error envelopes.
- Structured logging, recursive redaction, Telegram critical-alert adapter, and sanitised Sentry adapter.
- Supabase Cloud target guard, migration/reset/seed tooling, foundation schema, grants, RLS, helper functions, and immutable-record triggers.
- Unit/component/browser/cloud security tests, CI quality/browser jobs, dependency audit, and repository secret scan.

Excluded because they are not implemented:

- Login, sessions, recovery, MFA, merchant invitations, and authenticated application routes.
- Real merchant/customer/order/payment data.
- Product uploads, public customer links, webhooks, messaging providers, log archives, staging, and production deployment.

## 2. Actors and dependencies

### Actors

- Platform owner/developer with local filesystem and Supabase dashboard access.
- Human or AI engineer changing source, migrations, configuration, or tests.
- GitHub contributor or compromised dependency/build action.
- Unauthenticated browser visitor to the foundation screen.
- Authenticated Supabase user used by synthetic database security tests.
- Attacker with browser access, leaked development credentials, repository access, or ability to influence untrusted log/error input.

### External dependencies

- Supabase Auth, PostgreSQL, Data API, and Cloud database pooler.
- GitHub and GitHub Actions.
- npm registry and locked dependencies.
- Sentry and Telegram adapters, although real transmission is disabled for the accepted Phase 0 checkpoint.

## 3. Assets

- Supabase development project and credentials.
- Database roles, grants, RLS policies, migrations, and migration history.
- Tenant identifiers and synthetic control-plane/merchant records.
- Audit and transaction-placeholder integrity.
- Source code, lockfile, CI workflow, and Git history.
- Central messages and public error boundary.
- Structured logs, alert payloads, request/trace/reference IDs.
- Environment classification and destructive-operation confirmation.

## 4. Trust boundaries and data flows

```text
Unauthenticated browser
  → Next.js foundation UI
  → central messages/error presentation

Application/test code
  → observability redaction
  → local sink or injected fake Sentry/Telegram transport

Developer workstation + private .env.local
  → target guard
  → Supabase CLI/Postgres connection
  → disposable cloud-development database

Authenticated synthetic Supabase identity
  → Data API/PostgreSQL grants
  → RLS/helper functions
  → control-plane or tenant rows

Git repository
  → GitHub Actions
  → npm install, checks, build, and browser tests
```

Trust boundaries exist between the browser and server, application and observability providers, local secrets and source control, application roles and PostgreSQL, tenants, platform control plane and merchant content, and repository code and third-party build dependencies.

## 5. Security and privacy invariants

1. No credential, token, full bank detail, complete phone/address/email, or raw message enters a public error, log sink, alert, browser bundle, committed fixture, or chat.
2. A local/test label alone cannot authorise a destructive cloud reset; the API and database project identities and explicit confirmation must match.
3. Unauthenticated and cross-tenant database access is denied by default.
4. Platform roles receive no implicit merchant catalogue or transaction access.
5. Authorization derives from protected database records and the authenticated identity, not caller-supplied role claims.
6. Audit and transaction records cannot be rewritten or hard-deleted by application identities.
7. Synthetic development data cannot be mistaken for or replaced by real merchant/customer data.
8. Provider failure cannot expose sensitive context or fail the original application operation.
9. CI and local checks must detect security regressions before an accepted checkpoint is pushed.

## 6. Existing controls and evidence

- Strict environment schema; production debug mode is rejected.
- `.env.local` is ignored; browser-safe and server-only variable names are separated.
- Target guard validates HTTPS Supabase API host, approved database host, matching project reference, session-mode port, safe environment, and explicit destructive confirmation.
- Central public error envelopes omit internal causes and stacks.
- Redaction covers sensitive keys/values, nesting, cycles, truncation, and newline/control-character injection.
- Telegram/Sentry receive sanitised payloads through adapters; failures are isolated.
- Explicit database grants, revoked defaults, RLS on eight exposed tables, protected role/membership records, and platform-content denial tests.
- Invitation tokens are hash-only with expiry/revocation/use constraints.
- Immutable triggers reject update/delete of audit and transaction placeholders.
- Guarded cloud reset reapplied both migrations and deterministic seed.
- Evidence passed: 44 unit/component tests, 10 cloud isolation/immutability assertions, schema/seed/hardening probes, two browser tests, strict types, lint, formatting, build, dependency audit, and secret scan.

## 7. Threat register

| ID     | Category                          | Threat and consequence                                                                                                                                                                                                                          | Inherent risk                                                     | Current controls                                                                                                                                                   | Status / treatment                                                                                                                                         |
| ------ | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TM0-01 | Elevation / disclosure            | An authenticated caller invokes `app_private.is_active_platform_owner(user_id)` or `has_active_membership(user_id, business_id)` with arbitrary UUIDs, creating a platform-role or membership existence oracle outside the intended self-check. | Medium (2×2)                                                      | Migration `20260828010000_self_bound_authorization_helpers.sql` derives identity from `auth.uid()`, rewires dependent RLS policies, and removes unsafe signatures. | **Mitigated 2026-08-28.** Hardening passed; 12 transactional isolation/immutability assertions passed with synthetic data rolled back.                     |
| TM0-02 | Tampering                         | A mistaken or malicious database command resets the wrong cloud project or applies unreviewed schema.                                                                                                                                           | High (2×3)                                                        | Safe-environment restriction, matching API/database project refs, exact destructive confirmation, session-mode host/port check, explicit owner approval.           | Mitigated for disposable development. Production/staging remain prohibited.                                                                                |
| TM0-03 | Information disclosure            | Secrets or personal data enter errors, logs, Telegram, Sentry, fixtures, or the browser.                                                                                                                                                        | High (2×3)                                                        | Central safe envelopes, recursive redaction, provider adapters, configuration boundary, synthetic tests, ignored `.env.local`, secret scan.                        | Mitigated for tested patterns; TM0-06 tracks scan breadth and future sink/retention risks.                                                                 |
| TM0-04 | Elevation                         | Tenant or platform user bypasses RLS through grants, helper functions, user-editable claims, or service credentials.                                                                                                                            | High (2×3)                                                        | Revoked defaults, explicit grants, RLS, self-bound protected-role helpers, `SECURITY DEFINER` safe search path, isolation tests, no browser service-role client.   | Mitigated for Phase 0; every new table/RPC still requires matrix tests.                                                                                    |
| TM0-05 | Tampering / repudiation           | Application or privileged code rewrites/deletes audit or transaction history, or important actions lack durable attribution.                                                                                                                    | High (2×3)                                                        | Update/delete triggers and revoked application grants; structured correlation fields.                                                                              | Immutability mitigated. Durable audit insertion/workflow and log archive are not implemented; required in relevant future parts before real operations.    |
| TM0-06 | Supply chain / secrets            | A credential format not covered by the small custom regex set, a malicious dependency, or mutable CI action tag escapes current checks.                                                                                                         | Medium (2×2)                                                      | Lockfile, `npm ci`, high-severity npm audit, limited secret scan, read-only CI token permissions.                                                                  | Planned: evaluate dedicated secret scanner, dependency review/SBOM, and commit-SHA pinning before external deployment; expand patterns with each provider. |
| TM0-07 | Security regression               | GitHub CI does not run cloud migration/RLS tests, so database-policy regressions can merge when only local evidence is used.                                                                                                                    | Medium (2×2)                                                      | Local guarded cloud suite and documented acceptance evidence; CI runs quality and browser checks.                                                                  | Planned before Phase 1 database/auth merge: isolated CI database-security job or an explicitly approved secure alternative with no production credentials. |
| TM0-08 | Information disclosure / spoofing | Foundation health or error UI exposes environment URLs, keys, schema details, raw causes, or suggests production readiness.                                                                                                                     | Medium (2×2)                                                      | Central safe copy/errors, component and browser tests, visible synthetic/no-transmission wording, owner UI acceptance.                                             | Mitigated for Phase 0 screen. Reassess every operational/admin screen.                                                                                     |
| TM0-09 | Denial of service                 | Hostile or cyclic log context consumes memory/CPU or alert floods overwhelm providers/operators.                                                                                                                                                | Medium (2×2)                                                      | Depth/key/array/string limits, event-name validation, alert deduplication/rate limiting/timeouts, provider-failure isolation.                                      | Mitigated for local single-instance use. Durable shared alert gate required before multi-instance deployment.                                              |
| TM0-10 | Browser attack                    | Missing CSP/HSTS and incomplete route-specific cache/cookie/origin controls permit XSS impact, downgrade, clickjacking, CSRF, or caching once authenticated/public routes exist.                                                                | High for external deployment; Low for current local static screen | `nosniff`, frame deny, referrer and permissions policies; no authenticated mutations or public token pages yet.                                                    | Accepted only for current local screen. Must be modeled and implemented in Phases 1 and 5, and verified before any external demo.                          |
| TM0-11 | Availability / evidence loss      | Logger sink failures are swallowed and live logs/alerts are process-local, so critical evidence may be lost without detection.                                                                                                                  | Medium (2×2)                                                      | Original operation remains safe; reference IDs and adapters exist.                                                                                                 | Planned: durable live events, sink-health metrics, alert dead-letter/secondary signal, and immutable archives before real operations.                      |
| TM0-12 | Privacy / environment misuse      | Real merchant or customer information is placed in the disposable development database, logs, screenshots, or tests.                                                                                                                            | High (2×3)                                                        | Synthetic-only policy, deterministic seed, documentation, owner-controlled project.                                                                                | Accepted only with strict synthetic-data restriction. Any real data immediately blocks development and requires containment/cleanup review.                |

## 8. Required treatments

### Completed before Phase 1

- **TM0-01:** Replaced caller-supplied user identities with `auth.uid()`-bound helpers, removed unsafe signatures, and verified self, cross-business, platform-role, and platform/merchant separation behaviour.

### Required during Phase 1 before authentication checkpoint completion

- **TM0-07:** Decide and implement how CI proves migrations and RLS/auth policies without production credentials or shared mutable test state.
- Reassess TM0-10 for sessions, cookies, CSRF/origin validation, redirects, login rate limiting, and authenticated caching.
- Extend TM0-03/TM0-06 tests for email/password/session token fields without logging real credentials.

### Required before external demo, staging, or production

- Complete MFA/AAL2 and stricter session/recovery controls.
- Implement CSP, HSTS, secure cookies, CSRF/origin/host validation, and deployment-header tests.
- Use durable distributed rate limiting and alert state.
- Strengthen secret/supply-chain controls and pin critical CI actions appropriately.
- Implement durable audit/log evidence and archive health before processing real operations.

## 9. Residual-risk decision

The owner may continue internal development with synthetic data. TM0-01 is mitigated and no Phase 0 threat remains as a Phase 1 entry blocker. Phase 1 still requires its own threat model, owner residual-risk acceptance, and Part 1.1 acceptance approval. The current foundation is not approved for real-vendor demonstration, real data, staging pilot, or production.

## 10. Review triggers

Reopen this model if Phase 0 controls, migrations, RLS helpers, environment guards, logging/redaction, CI, or security headers change, or if a secret/security incident or material dependency advisory occurs.

## References

- [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html)
- [OWASP Application Security Verification Standard 5.0](https://owasp.org/www-project-application-security-verification-standard/)
- `SECURITY_PRIVACY_REVIEW.md`
- `PART_0_1_ACCEPTANCE.md` through `PART_0_4_ACCEPTANCE.md`
