# Decision Log

Use this file for decisions that materially affect scope, data, security, providers, or architecture. Add entries; do not rewrite history. Superseding decisions should reference the earlier entry.

## ADR-001: Merchant application is a PWA

- **Status:** Accepted
- **Date:** 2026-08-27
- **Decision:** Build one mobile-first Next.js Progressive Web App rather than native iOS and Android applications for the MVP.
- **Reason:** Faster delivery and one codebase while retaining installability and web push on supported devices.
- **Consequence:** Push delivery is subject to browser/OS rules, especially iOS installation and permission requirements; provide in-app notifications and email fallback.

## ADR-002: Customer funds go directly to merchants

- **Status:** Accepted
- **Date:** 2026-08-27
- **Decision:** Support PayID, bank transfer, cash on delivery, and cash on pickup. PieShop does not hold, split, or transfer customer funds in the MVP.
- **Reason:** Reduces operational, compliance, and integration complexity.
- **Consequence:** Manual payment assertions require merchant verification; Stripe is excluded from MVP.

## ADR-003: Phone number and address requirements

- **Status:** Accepted
- **Date:** 2026-08-27
- **Decision:** Every order requires a phone number. Every delivery order requires a full address and deliverability check before confirmation; pickup is exempt.
- **Reason:** Enables cross-channel contact and prevents acceptance of undeliverable orders.
- **Consequence:** Messenger, email, manual, and future web flows must collect a phone number; saved addresses must be reconfirmed and revalidated.

## ADR-004: Multi-channel domain with staged integrations

- **Status:** Accepted
- **Date:** 2026-08-27
- **Decision:** All channels use one normalised message contract and order workflow. Build manual/simulated orders first and WhatsApp as the first live integration, then Messenger, SMS, and email.
- **Reason:** Proves core fulfilment independently of provider approvals while preserving the product's multi-channel requirement.
- **Consequence:** Provider code remains in adapters and channel features use flags.

## ADR-005: UTC storage and merchant-local presentation

- **Status:** Accepted
- **Date:** 2026-08-27
- **Decision:** Store instants in UTC, store an IANA timezone per merchant, and convert at presentation/scheduling boundaries.
- **Reason:** Supports deployment across locations and correct daylight-saving behaviour.

## ADR-006: Centralised copy, errors, and notifications

- **Status:** Accepted
- **Date:** 2026-08-27
- **Decision:** All public messages use typed keys/templates; errors and notifications use central services.
- **Reason:** Ensures consistency, safe error disclosure, easy wording changes, and future localisation.

## ADR-007: Structured logs with Supabase Storage archives

- **Status:** Accepted
- **Date:** 2026-08-27
- **Decision:** Produce structured, redacted logs through a central logger; maintain concurrency-safe live events and export immutable daily compressed JSONL batches to a private Supabase Storage bucket.
- **Reason:** Serverless local files are not durable, and repeatedly overwriting a shared Storage object is unsafe under concurrency.
- **Consequence:** Archive jobs require checksums, manifests, retention, monitoring, and restricted service access.

## ADR-008: Telegram is an alert channel, not the log store

- **Status:** Accepted
- **Date:** 2026-08-27
- **Decision:** Send asynchronous, sanitised, rate-limited critical alerts to a Telegram channel while retaining the durable event elsewhere.
- **Reason:** Telegram offers fast operator awareness but is not suitable as authoritative storage.

## ADR-009: Initial platform billing model

- **Status:** Proposed for validation
- **Date:** 2026-08-27
- **Decision:** Test A$1 per delivered/collected order capped at A$39 per month, with an equivalent subscription option. Invoices are sent outside the platform.
- **Reason:** Low entry risk for occasional merchants and predictable maximum cost.
- **Consequence:** Create exactly one immutable billable event per completed order and track external invoice status.

## ADR-010: Platform-owned merchant provisioning

- **Status:** Accepted
- **Date:** 2026-08-27
- **Decision:** For the 1–5 merchant MVP, only the platform owner can create merchant accounts and issue single-use owner invitations. Merchant self-registration is disabled.
- **Reason:** Allows a controlled pilot and deliberate onboarding/support.
- **Consequence:** The platform requires a private control-plane UI for merchant metadata, invitations, status, billing, and integration health.

## ADR-011: Platform privacy and merchant-granted support

- **Status:** Accepted
- **Date:** 2026-08-27
- **Decision:** Platform owners and support administrators cannot view merchant business content by default. A merchant owner may create a scoped, expiring, revocable support grant. Support sessions preserve the administrator's identity, display a persistent banner, and audit sensitive reads and all mutations.
- **Reason:** The platform owner can operate accounts without unnecessarily seeing what merchants sell, while merchants can deliberately request hands-on assistance.
- **Consequence:** Support is not password sharing or invisible impersonation. RLS/server authorization must validate the active grant and prohibit sensitive settings outside its scope.

## ADR-012: Transaction and audit immutability

- **Status:** Accepted
- **Date:** 2026-08-27
- **Decision:** No application role can hard-delete orders, order item snapshots, payment records, state events, billable completion events, invoices, or audit events. Corrections are append-only; privacy erasure anonymises permitted personal fields through a separate controlled process.
- **Reason:** Preserves financial, operational, support, and security integrity.
- **Consequence:** Database privileges, RLS, repositories, APIs, UI actions, and tests must all enforce the absence of transaction deletion.

## ADR-013: Privileged MFA and step-up authentication

- **Status:** Accepted
- **Date:** 2026-08-27
- **Decision:** Platform owners, support administrators, and merchant owners require MFA/AAL2. Support access and other sensitive actions require recent step-up authentication. Recovery/factor reset cannot silently bypass MFA and revokes existing sessions.
- **Reason:** These roles can affect account access, privacy, payment instructions, or merchant operations.
- **Consequence:** Authorization policies inspect assurance level and recovery/session lifecycle is audited and tested.

## ADR-014: Payment evidence excluded from MVP

- **Status:** Accepted
- **Date:** 2026-08-27
- **Decision:** Do not accept or store customer payment receipts/screenshots in the MVP. Customers report payment and merchants verify funds independently.
- **Reason:** Uploaded evidence is not proof of settlement and creates malware, fraud, storage, and personal-data risk without sufficient MVP value.
- **Consequence:** Reintroducing uploads requires a threat/privacy review, safe file pipeline, access policy, and retention schedule.

## ADR-015: Security verification and privacy baseline

- **Status:** Accepted
- **Date:** 2026-08-27
- **Decision:** Target OWASP ASVS 5.0 Level 2, maintain a data inventory and field-level retention schedule, and design Australian APP/NDB readiness subject to legal applicability review.
- **Reason:** The platform processes phone numbers, addresses, messages, merchant bank settings, and privileged support access.
- **Consequence:** Pilot launch requires documented security tests, privacy notices/terms, subprocessor/region review, recovery/incident runbooks, and verified deletion/de-identification and backup behaviour.

## ADR-016: Restricted-field encryption and customer-link security

- **Status:** Accepted
- **Date:** 2026-08-27
- **Decision:** Encrypt provider credentials, webhook secrets, and merchant bank/PayID settings with versioned managed keys separate from ciphertext. Customer links use hash-only tokens with at least 128 bits of randomness, expiry/revocation/rate limits, no-store/no-referrer responses, and stronger challenges for sensitive actions.
- **Reason:** Database/storage encryption at rest alone does not limit damage from application-layer disclosure, and forwarded bearer links must not grant unrestricted authority.
- **Consequence:** Implement key rotation, token lifecycle, browser-header, and recovery tests before pilot launch.

## ADR-017: Cloud-only Supabase development workflow

- **Status:** Accepted
- **Date:** 2026-08-27
- **Decision:** Use a dedicated disposable Supabase Cloud project for Part 0.4 development and database security tests instead of running Supabase through local Docker.
- **Reason:** The owner does not want to operate Docker locally and will manage the cloud project configuration.
- **Consequence:** Reset/seed tooling must require an explicit development/test environment marker and project identity, refuse staging/production targets, use synthetic data only, and minimise remote test round trips. Credentials remain in ignored local environment files or provider secret stores and are never pasted into chat or committed.

## ADR-018: Passwordless authentication and approved devices

- **Status:** Accepted
- **Date:** 2026-08-27
- **Decision:** Merchant staff and platform administrators use passwordless email with a magic link as the primary action and a six-digit email OTP fallback. Automatic sign-up is disabled, confirmation uses server-side PKCE, and token material is removed from the URL after exchange. A successfully authenticated user may register the current browser/device so a still-valid session can restore automatically. Approved devices are individually visible and revocable.
- **Reason:** Removes password creation and reset friction while keeping the small MVP simple on phones and the web.
- **Consequence:** Device approval never counts as MFA. Platform owners, support administrators, and merchant owners must still reach AAL2 using TOTP and repeat step-up for sensitive actions. New, cleared, expired, suspicious, or revoked devices reauthenticate. Device/session records use opaque hashed identifiers, server-side validation, idle/absolute expiry, revocation on privilege or recovery events, and append-only security audits. The UI handles expired or email-scanner-consumed links through the OTP fallback. Custom SMTP with link tracking disabled is required before the merchant pilot.

## ADR-019: Reduced authentication assurance for internal synthetic-data MVP

- **Status:** Accepted; supersedes ADR-013 and ADR-018 only for internal synthetic-data MVP development
- **Date:** 2026-08-28
- **Decision:** The owner manually creates the single platform-owner user in Supabase Auth. It signs in with email and password without MFA during internal synthetic-data MVP development, and PieShop exposes no owner-registration flow. Invited merchant owners use server-side PKCE magic links and may restore the same revocable browser session for an absolute maximum of 30 days. Automatic user creation and public sign-up remain disabled.
- **Reason:** Reduce authentication friction while the owner develops and evaluates the MVP internally.
- **Consequence:** The reduced-assurance mode must contain synthetic data only. Sessions end earlier on logout, revocation, suspension, recovery, privilege change, or security events. MFA/AAL2, step-up authentication, stricter session controls, and recovery tests are a blocking release gate before any demo to a real vendor, real merchant/customer data, staging pilot, or production rollout. ADR-013 and ADR-018 remain the required target for that gate.

## ADR-020: Threat modeling is a phase-entry gate

- **Status:** Accepted
- **Date:** 2026-08-28
- **Decision:** Create or refresh a structured threat model before the first part of every roadmap phase. Resolve phase-entry blockers and obtain owner acceptance of explicitly recorded residual risks before implementation begins. Material trust-boundary changes reopen the active model.
- **Reason:** The general security/privacy baseline identifies controls but does not prove that the implemented data flows and phase-specific abuse cases have been reviewed.
- **Consequence:** Each phase has a versioned `PHASE_N_THREAT_MODEL.md` following `THREAT_MODELING_STANDARD.md`; affected invariants map into part acceptance tests. A completed phase may receive retrospective findings that block the next phase without erasing its earlier acceptance evidence.

## ADR-021: Phase 1 internal authentication controls

- **Status:** Accepted for private synthetic development
- **Date:** 2026-08-30
- **Decision:** The platform-owner application session has a 12-hour absolute maximum and a 2-hour inactivity maximum with fresh authoritative role checks. Merchant sessions have a fixed 30-day absolute maximum enforced by PieShop. Phase 1 provides no self-service recovery UI. Process-local rate limiting and Supabase development email are permitted only while the application is private/local and uses synthetic identities. Supabase Auth packages are exact-pinned behind PieShop adapters.
- **Reason:** These controls make the internal MVP testable and usable without treating reduced-assurance development authentication as production-ready security.
- **Consequence:** Activity never extends an absolute session deadline. Durable distributed limiting, controlled SMTP, MFA/AAL2, and stricter privileged session/recovery controls remain mandatory before a real-vendor demo, real data, staging, or production.
