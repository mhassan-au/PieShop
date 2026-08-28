# PieShop Developer Walkthrough

## 1. Purpose

This guide explains how PieShop is organised, where to make common changes, and how work moves safely from an idea to an accepted Git checkpoint. It is for the platform owner, human engineers, and AI coding agents.

Read `AI_CONTEXT.md` and `DEVELOPMENT_STATUS.md` first. Detailed product, architecture, security, and roadmap documents remain authoritative.

## 2. Project map

```text
PieShop/
├── src/             Application code
├── supabase/        Database configuration, migrations, and synthetic seed
├── scripts/         Development, database, security, and verification commands
├── tests/           Browser end-to-end tests
├── doc/             Project source-of-truth documents
├── public/          Static browser assets
├── package.json     Commands and dependencies
├── .env.local       Private local configuration; never commit or share
├── .env.example     Safe environment-variable template
└── AGENTS.md        Mandatory AI-agent instructions
```

```text
src         = application
supabase    = database
scripts     = developer automation
tests       = browser-flow verification
doc         = requirements and decisions
```

Do not manually edit generated folders such as `.next`, `node_modules`, `playwright-report`, or `test-results`.

## 3. Application structure

Implemented source areas:

```text
src/
├── app/              Next.js routes, layouts, error boundaries, and global styles
├── components/       Reusable visual components
├── config/           Validated configuration and environment guards
├── errors/           Typed errors and safe public envelopes
├── messages/         Central user-facing wording and templates
└── observability/    Logging, redaction, Sentry, and Telegram alerts
```

Add these planned boundaries only when a roadmap part needs them:

```text
src/
├── features/         Feature UI and application orchestration
├── domain/           Pure business rules
├── server/           Server-only repositories, services, and integrations
├── channels/         Messaging contracts and provider adapters
└── lib/              Small generic utilities only
```

| Change                              | Primary location     |
| ----------------------------------- | -------------------- |
| URL, page, or layout                | `src/app/`           |
| Reusable visual element             | `src/components/`    |
| Feature-specific form or flow       | `src/features/`      |
| Business rule                       | `src/domain/`        |
| Database or server-secret operation | `src/server/`        |
| Messaging provider                  | `src/channels/`      |
| User-facing wording                 | `src/messages/`      |
| Error meaning                       | `src/errors/`        |
| Logs and alerts                     | `src/observability/` |
| Environment setting                 | `src/config/`        |

Page files compose features. React components do not contain authoritative authorization, money, delivery, order-state, or provider logic.

## 4. Central messages and errors

All visible headings, labels, validation errors, confirmations, notifications, and channel templates come from `src/messages/catalogue.ts`. Update message tests when adding keys or placeholders.

`src/errors/app-error.ts` defines stable errors with a safe message key, internal code, severity, retryability, status, request/trace IDs, sanitised context, and optional internal cause.

Never display raw SQL, stack traces, provider responses, secrets, tokens, or internal objects.

```text
What the message says       → messages/
What the error means        → errors/
How the error looks         → components/
Where the error is caught   → app/
```

## 5. Configuration and secrets

`.env.local` contains private values and must never be committed, pasted into chat, or included in screenshots. `.env.example` lists safe names and examples.

`NEXT_PUBLIC_` variables may enter the browser bundle and must never contain secrets. Service-role credentials, database URLs, Telegram tokens, and provider secrets remain server-only.

When adding configuration, update `.env.local`, `.env.example`, `src/config/env.ts`, its tests, `doc/ENVIRONMENT_VARIABLES.md`, and an authorised hosting dashboard if applicable.

The Supabase target guard must continue to block destructive commands unless the environment, project URL, database URL, and explicit project-reference confirmation identify the same disposable development/test project.

## 6. Observability

Application code uses `src/observability/logger.ts`, not direct `console.log`. `LOG_LEVEL=debug` enables debug events but never disables redaction.

`redaction.ts` removes passwords, tokens, cookies, phone numbers, addresses, bank details, nested sensitive fields, and log-injection content before any sink receives an event.

Telegram is a sanitised, asynchronous, deduplicated, rate-limited alert destination—not the permanent log store. Sentry is isolated behind a sanitising adapter with default PII collection disabled.

Planned durable logs follow this flow:

```text
Application event → redaction → structured event
→ immutable daily UTC JSONL batch → private Supabase Storage
```

## 7. Database and Supabase

Database files live under `supabase/`. Never edit an applied migration to alter a cloud database. Create a later forward migration.

Tenant tables require `business_id`, indexes, constraints, explicit grants, RLS policies, and isolation tests. Server authorization must also verify protected membership and role records.

Audit and transaction history is append-only. Never add hard-delete paths for orders, order items, payments, state history, billable events, invoices, or audits. Correct through cancel, void, refund, adjust, or supersede operations.

`seed.sql` contains deterministic synthetic data only.

```powershell
npm run db:push:apply
npm run db:seed:apply
npm run db:reset:development
```

The reset destroys development data and requires explicit owner authorisation for the exact disposable target.

## 8. Tests and quality gates

Use focused tests while developing and the consolidated gate once at the end of a cohesive batch.

```powershell
npm test
npm run test:watch
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run test:e2e
npm run security:secrets
npm run security:audit
npm run check
```

Cloud verification:

```powershell
npm run test:supabase:connection
npm run test:supabase:schema
npm run test:supabase:security
npm run test:supabase:hardening
npm run test:supabase:seed
```

`test:e2e` starts its own server on port 3100. Stop a manually running development server first if it holds the Next.js lock.

| Change           | Focused verification                                                                  |
| ---------------- | ------------------------------------------------------------------------------------- |
| Wording          | Message and affected component tests                                                  |
| UI               | Component/accessibility tests, then browser test                                      |
| Interface        | Type check and affected tests                                                         |
| Database         | Migration, schema, RLS, hardening, and seed tests                                     |
| Authentication   | Unit, component, integration, authorization, rate-limit, redaction, and browser tests |
| Final checkpoint | `npm run check`, relevant cloud checks, and browser tests                             |

Manual review is for appearance, wording, usability, keyboard/device behaviour, and whether the process feels natural. Repeatable rules belong in automated tests.

## 9. Documentation map

| Question                             | Document                      |
| ------------------------------------ | ----------------------------- |
| What must every engineer know first? | `AI_CONTEXT.md`               |
| Where is development now?            | `DEVELOPMENT_STATUS.md`       |
| What comes next?                     | `DEVELOPMENT_ROADMAP.md`      |
| What should the product do?          | `MVP_PRODUCT_REQUIREMENTS.md` |
| How should workflows behave?         | `WORKFLOWS_AND_STATES.md`     |
| How is the system designed?          | `TECHNICAL_ARCHITECTURE.md`   |
| What data will be stored?            | `DATA_MODEL.md`               |
| How should code be written?          | `CODING_STANDARDS.md`         |
| Why was a decision made?             | `DECISIONS.md`                |
| What must be ready for hosting?      | `PROJECT_CHECKLISTS.md`       |

Add an ADR when changing scope, authorization, privacy, data, security, providers, or architecture. Preserve earlier decisions and explicitly identify what is superseded.

## 10. Normal change workflow

```text
Outcome → approved roadmap part → acceptance examples → failing test
→ minimum passing implementation → refactor → consolidated checks
→ owner UI review → documentation → commit and push
```

Quick mode lets Codex test, apply approved development-only migrations/seeds, document, stage, commit, and push passing checkpoints. Slow mode leaves routine green checks and Git actions to the owner. Neither authorises production, paid actions, credential transmission, real data, unapproved destructive operations, or expanded scope.

## 11. Security and privacy boundaries

- Every merchant-owned row carries `business_id` and uses server authorization plus RLS.
- Platform owners manage metadata but cannot see merchant catalogue or transaction content by default.
- Support requires an explicit, scoped, expiring, revocable grant and preserves the real support actor.
- Customer payments go directly to merchants; `payment_submitted` is not `paid`.
- Payment evidence uploads are excluded.
- Secrets and unnecessary PII never enter source, browser bundles, logs, alerts, fixtures, screenshots, or chat.
- Internal development uses synthetic data only.
- MFA/AAL2 and stricter session/recovery controls block any real-vendor demo, real data, staging pilot, or production rollout until implemented and verified.

## 12. Daily routine

```powershell
cd C:\Users\shami.AMINAALAM\DevProjects\PieShop
git status
git log --oneline -5
npm run dev -- --port 3100
```

Read status and the current roadmap part first. Keep the development terminal open and stop it with `Ctrl+C`.

When reporting a failure, provide the command, failing test or final error, first relevant stack trace, expected result, and recent change. Never provide `.env.local`, credentials, tokens, connection strings, or real records.

## 13. Current boundary

Implemented: project quality pipeline, central messages/errors, structured observability, Supabase migration/seed workflow, foundation identity/tenancy schema, RLS, platform privacy, immutability protection, and the responsive foundation screen.

Planned: platform login, merchant provisioning and magic links, merchant application, catalogue, customers, delivery, orders, payments, fulfilment, notifications, support, channels, archives, and production hardening.

# Case Study: Platform-Owner Email and Password Login

## A. Define the outcome

The owner manually creates one platform-owner user in Supabase Auth. The user enters email and password at `/login` and reaches `/platform` only when authentication succeeds and an active protected `platform_owner` assignment exists. Email is the login identifier; PieShop creates no separate username lookup.

## B. Establish scope

In scope: login form, password visibility, loading, safe errors, protected route, logout, session restoration, role verification, rate-limit baseline, redacted security events, and accessible phone/desktop UI.

Out of scope: signup, in-app owner creation, merchant login, magic links, password reset UI, MFA, support, merchant features, real data, staging, and production.

## C. Review the project

Read AI context, development status, Part 1.1 roadmap, product requirements, architecture, coding standards, security review, and relevant installed Next.js 16 documentation. Inspect existing messages, errors, observability, configuration, dependencies, and Git state.

## D. Approve the acceptance contract

Create `PART_1_1_ACCEPTANCE.md` with scope, scenarios, threats, automated evidence, and owner checkpoint. Start implementation only after owner approval is recorded in it and `DEVELOPMENT_STATUS.md`.

| Scenario                                | Expected result                            |
| --------------------------------------- | ------------------------------------------ |
| Correct active-owner credentials        | Session established; `/platform` opens     |
| Unknown email or incorrect password     | Same generic response                      |
| Valid user without active platform role | Access denied and session ended            |
| Signed-out request to `/platform`       | Redirect to `/login`                       |
| Authorised owner opens `/login`         | Redirect to `/platform`                    |
| Double submit                           | Only one attempt proceeds                  |
| Provider unavailable                    | Safe retryable response                    |
| Logout                                  | Session ends and protected route is denied |
| Repeated failures                       | Safe temporary rate limit                  |

## E. Inspect Supabase configuration

Confirm the dedicated development project, browser-safe URL/key, server configuration, enabled email/password provider, redirect URLs, and disabled public signup. Never copy values into documentation or chat.

## F. Provision the identity

The owner creates a synthetic development user in the Supabase dashboard with a strong unique password. PieShop exposes no registration endpoint. Provision its protected active platform role through a controlled development step; authentication alone grants no platform access.

## G. Confirm database authorization

Review `platform_roles`, grants, RLS, and helper functions. Add a forward migration only if needed. Authorization reads server-controlled records—not form fields, query parameters, client state, user-editable metadata, or stale role claims.

## H. Plan file boundaries

Likely responsibilities are `app/login`, `app/platform`, `features/auth`, `server/auth`, and `server/platform-access`. Exact files follow installed Next.js 16 guidance. Server secrets and authoritative role checks never enter client components.

## I. Define the authentication adapter

Separate authentication from authorization. A request-scoped server adapter validates input, invokes Supabase, translates outcomes to stable internal results, and keeps provider types out of UI and authorization code.

## J. Define session behaviour

Document how the installed stack creates, refreshes, validates, and clears sessions. Use secure cookie controls where applicable. Logout, role disablement, recovery, expiry, malformed cookies, and privilege changes must deny the next protected request.

## K. Define redirects

Use `/platform` or a validated allow-listed internal destination. Reject external, protocol-relative, encoded-bypass, and unknown destinations. Add open-redirect tests.

## L. Add central messages

Add keys for headings, labels, password visibility, submit/pending state, generic failure, temporary failure, rate limit, logout, and access denial. Test placeholders. Never expose provider error text.

## M. Add typed errors

Define stable errors for invalid credentials, rate limit, provider unavailability, invalid session, missing/disabled role, unsafe redirect, and unexpected failure. Unknown email and wrong password share one public response.

## N. Plan security events

Plan login success/failure/rate-limit, logout, invalid session, and access-denial events. Log request/trace IDs, safe internal IDs after authentication, outcome, and reason code. Never log passwords, tokens, cookies, complete emails, request bodies, raw provider responses, or unnecessary IP data.

## O. Design rate limiting

Define window, maximum attempts, minimised dimensions, proxy handling, retention, cleanup, response, and controllable test time. An in-memory local limiter is not sufficient for multi-instance or external deployment.

## P. Write validation tests and observe red

Test required values, email handling, input limits, double submission, safe redirects, and generic credential failure. Confirm each failure represents missing behaviour rather than broken setup.

## Q. Write component tests and observe red

Test labels, keyboard submission, concealed password, visibility control, pending state, error announcement, focus, and recovery after failure. Never persist the password.

## R. Write authentication tests and observe red

Use an injected fake adapter for success, invalid credentials, provider failure, malformed response, logout, and expired session. Unit/component tests do not call real providers. Verify server-only modules cannot enter the browser bundle.

## S. Write authorization tests and observe red

Test active owner, missing role, disabled role, unauthenticated access, stale claims, and platform attempts to read merchant content. Preserve existing platform-privacy tests.

## T. Implement the minimum server behaviour

Create only the request-scoped Supabase adapter, session handling, role check, safe redirects, error translation, rate-limit boundary, and redacted events required by failing tests. Do not add signup, merchant login, recovery, MFA, or unrelated frameworks.

## U. Implement the minimum UI

Build a mobile-first form using central messages and standard errors. Include email, password, visibility, pending state, single submission, accessible feedback, and the minimum protected platform screen needed to prove access and logout.

## V. Refactor while green

Remove duplication, clarify interfaces, isolate provider code, and keep components presentational. Review browser/server imports, messages, errors, events, role checks, redirects, and session lifecycle without broadening scope.

## W. Run focused integration checks

Run authentication, authorization, redaction, configuration, and affected Supabase security tests. Real cloud checks use the development project and synthetic accounts only.

## X. Run the final quality gate

Run formatting, lint, strict types, all unit/component tests, production build, secret scan, dependency audit, relevant cloud checks, and browser tests once at the batch end. Record exact evidence.

## Y. Complete owner UI review

Give the owner the exact command, URL, scenarios, and expected results. The owner checks phone/desktop appearance, wording, password visibility, pending/error states, keyboard use, redirect, login, and logout without sharing credentials.

Convert repeatable defects into regression tests before fixing them.

## Z. Close and maintain

After checks and owner acceptance, update the acceptance and status documents, record material decisions, document migration/rollback considerations, commit one coherent checkpoint, push according to the active mode, confirm CI, and leave a clean worktree.

Before any real-vendor demo, real data, staging, or production, implement MFA/AAL2, step-up, durable distributed rate limiting, stronger recovery/session controls, production email readiness, security headers, and all release-gate tests.

## 14. Troubleshooting quick reference

- Connection refused: run `npm run dev -- --port 3100` and keep the terminal open.
- Next.js lock: verify the exact PieShop process before stopping it; never kill all Node processes blindly.
- Playwright conflict: stop the manual server before `npm run test:e2e`.
- Import failure: verify existence, relative path, casing, export, and saved state.
- Configuration failure: compare variable names without exposing values.
- Supabase 401: verify project/key match, Data API configuration, and restarted processes.
- URI error: percent-encode reserved characters in the private database password.
- Missing tables: apply migrations and run the schema check.
- Seed failure: apply deterministic seed and rerun its check.
- Git rejection: inspect status, branch, remotes, and history; do not force-push reflexively.
- Secret scan failure: remove and rotate a real secret; do not weaken the scan merely to pass.

## 15. Final rule

When uncertain, preserve tenant isolation, real actor identity, platform privacy, transaction immutability, secret redaction, and synthetic-only internal development. Stop and record a decision before weakening any boundary.
