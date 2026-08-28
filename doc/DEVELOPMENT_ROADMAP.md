# PieShop TDD Development Roadmap

## 1. How this roadmap works

Development is divided into small, independently testable parts intended for one or two focused days. Larger integration or end-to-end parts are marked as good weekend work.

Do not begin the next part merely because code exists. A part is complete only when:

1. Its acceptance examples are agreed.
2. A failing automated test is written first where technically possible.
3. The smallest implementation makes the test pass.
4. Code is refactored while tests remain green.
5. All existing automated checks pass.
6. Security, accessibility, logging, audit, and documentation requirements for the part are complete.
7. The user performs the listed short UI/process check.
8. The user accepts the flow or requested corrections are completed.

Before the first part of every phase, complete or refresh that phase's threat model using `THREAT_MODELING_STANDARD.md`. Resolve all phase-entry blockers, map affected invariants to acceptance tests, and record owner acceptance of residual risk. Material changes to actors, assets, data flows, trust boundaries, providers, authorization, storage, or deployment reopen the model.

This is the project loop:

```text
Agree examples -> Red -> Green -> Refactor -> Automated checks
-> deploy preview -> short UI/process check -> accept -> next part
```

## 2. Testing strategy

The goal is to automate all repeatable testing. Manual testing is reserved for visual quality, wording, usability, device/browser behaviour, and final confirmation that the business flow feels correct.

### Automated layers

- **Unit tests:** domain rules, money, time, state transitions, permissions, redaction, and message formatting.
- **Component tests:** forms, validation, loading/error states, keyboard interaction, and accessible names.
- **Integration tests:** PostgreSQL constraints, repositories, RLS, support grants, audit records, jobs, and provider adapters.
- **API/contract tests:** schemas, authorization, idempotency, error envelopes, webhook signatures, and provider fixtures.
- **End-to-end tests:** critical merchant/customer journeys in a real browser against an isolated test database.
- **Visual regression tests:** stable screenshots for high-value layouts after the design settles; reviewed diffs reduce repeated manual visual checking.
- **Security tests:** cross-tenant denial, privilege boundaries, CSRF, customer tokens, session expiry, immutable records, and log redaction.
- **Static checks:** formatting, lint, TypeScript, dependency scanning, secret scanning, and migration checks.

### Manual checks

For each part, the user checks only:

- Does the UI look and feel right on phone and desktop?
- Is the wording understandable?
- Is the intended process natural and sufficiently simple?
- Are success, empty, loading, error, and confirmation states visually appropriate?

The developer records discovered UI changes as acceptance examples and adds automated component/end-to-end coverage before closing the part where feasible.

## 3. Required test environments

- Local development uses deterministic seed data and fake providers.
- Each automated run gets isolated tenant/customer/order data.
- Staging uses test merchant accounts and provider sandboxes only.
- Production data, credentials, phone numbers, or messages are never used in tests.
- Time, UUIDs, external responses, and jobs are controllable in tests.
- End-to-end tests use stable `data-testid` only when semantic roles/labels are insufficient.

## 4. Definition of done for every part

- [ ] Acceptance examples documented.
- [ ] Tests written first and observed failing.
- [ ] Implementation passes new tests.
- [ ] Full relevant test suite passes.
- [ ] No direct user-facing strings outside the central message catalogue.
- [ ] Errors use typed central handling and safe public copy.
- [ ] Structured logs contain no secrets or unnecessary personal data.
- [ ] Authorization is enforced server-side and by RLS where applicable.
- [ ] Important mutations create audit events.
- [ ] UTC, timezone, and integer-money rules are followed.
- [ ] Keyboard/accessibility checks pass for changed UI.
- [ ] Documentation and decision log are updated if behaviour changed.
- [ ] Preview deployment is available.
- [ ] User completed and accepted the UI/process check.

## 5. Roadmap

### Phase 0 — Safe project foundation

#### Part 0.1: Repository and quality pipeline — 1 day

Build:

- Scaffold Next.js with strict TypeScript, Tailwind, and base component system.
- Add formatting, linting, unit/component test runner, browser end-to-end runner, and CI.
- Add environment validation and local/staging/production configuration boundaries.
- Add dependency and secret scanning.

Tests first:

- A deliberately failing unit test proves CI blocks failure.
- Configuration tests reject missing/unsafe environment values.
- A smoke browser test loads the application shell.

User check: open the empty phone/desktop shell and confirm basic visual direction.

#### Part 0.2: Central messages and application errors — 1 day

Build:

- Typed central message catalogue.
- Parameter-safe formatting.
- `AppError` model and standard API error envelope.
- Global browser error boundary and friendly fallback.

Tests first:

- Message-key and placeholder type/format tests.
- Public errors never expose internal causes/stacks.
- Error boundary shows reference ID and recovery action.

User check: review sample validation, confirmation, success, and failure wording.

#### Part 0.3: Structured logging and critical alerts — 1–2 days

Build:

- Central structured logger with levels and debug configuration.
- Request/trace correlation and redaction.
- Asynchronous sanitised Telegram adapter with deduplication/rate limiting.
- Sentry integration behind an adapter.

Tests first:

- Seeded passwords, tokens, phone numbers, addresses, and bank details are redacted.
- Debug output is enabled only by configuration.
- Telegram failure never fails the original operation.
- Newline/log-injection payloads remain structured.

User check: inspect one local debug event and one sanitised test Telegram alert.

#### Part 0.4: Supabase schema, migrations, and security harness — weekend, 2 days

Build:

- Local Supabase workflow and migration structure.
- Businesses, profiles, memberships, platform roles, invitations, audit events.
- Revoke default privileges and enable initial RLS.
- Automated database reset/seed and RLS test harness.

Tests first:

- Unauthenticated access denied.
- Merchant A cannot access Merchant B.
- Platform owner cannot access merchant catalogue/transaction placeholders.
- Transaction/audit delete/update protections work.

User check: none beyond viewing a simple environment/health screen.

Phase gate: CI is green, tenant denial tests pass, test alerts are redacted, and the user accepts the application shell/copy style.

### Phase 1 — Platform owner and merchant access

#### Part 1.1: Internal platform-owner password login — 1–2 days

Build:

- Private email-and-password sign-in for the single platform-owner user manually created by the owner in Supabase Auth; no in-app owner registration, automatic user creation, public sign-up, or MVP MFA.
- Enumeration-safe responses, throttling/lockout controls, secure recovery baseline, and revocable session listing/logout.
- Keep the authentication boundary ready for mandatory MFA/AAL2 and stricter privileged sessions before any real-vendor demo, real data, staging pilot, or production rollout.

Tests first:

- Only the pre-provisioned active platform owner can enter the control plane.
- Invalid credentials and recovery requests are enumeration-safe and rate limited.
- Public sign-up and automatic account creation remain disabled.
- Revoked, expired, suspended, recovered, or privilege-changed sessions cannot restore access.
- Tests preserve a seam for enforcing AAL2 before the real-vendor/production security gate.

User check: sign in with the pre-provisioned owner login, sign out, and sign in again on phone/desktop.

#### Part 1.2: Merchant list and create form — 1 day

Build:

- Privacy-preserving platform dashboard.
- List merchant metadata/status only.
- Create merchant and draft owner invitation.

Tests first:

- Required fields and duplicate protection.
- Platform owner can create metadata but cannot query merchant content.
- Creation and status changes are audited.

User check: create a test merchant and review the list/detail workflow.

#### Part 1.3: Secure merchant invitation — 1–2 days

Build:

- Single-use, hashed, expiring invitation tokens.
- Resend and revoke controls.
- Merchant owner verifies the invitation through a magic link and receives a revocable session with a 30-day absolute maximum.

Tests first:

- Expired, reused, revoked, and tampered invitations fail safely.
- Accepting creates exactly one owner membership.
- Platform owner never obtains the merchant password.

User check: invite yourself as a synthetic test merchant, accept the magic link, close/reopen the browser, and confirm the session expires or revokes correctly.

#### Part 1.4: Account status and onboarding progress — 1 day

Build:

- Activate, suspend, reactivate, and archive metadata operations.
- Onboarding progress visible without merchant content.
- Suspended merchant sessions lose access.

Tests first:

- State transition rules and audit records.
- Suspension revokes/blocks sessions and jobs appropriately.
- Control-plane response contains no catalogue/order fields.

User check: suspend/reactivate the test merchant and confirm clear UI feedback.

Phase gate: only the platform owner creates merchants; a synthetic test merchant independently signs in by magic link; 30-day absolute expiry and privacy-boundary tests pass. Real-vendor demonstrations remain blocked until the MFA release gate is completed.

### Phase 2 — Merchant setup and catalogue

#### Part 2.1: Merchant application shell and setup checklist — 1–2 days

Build:

- Mobile-first `Today`, `Orders`, `Catalogue`, and `Settings` navigation.
- Resumable setup checklist.
- Business name, currency, IANA timezone, and contact settings.

Tests first:

- Owner/staff/platform permission matrix.
- Timezone/currency validation.
- Setup state calculation and accessibility of navigation/forms.

User check: complete and resume onboarding on a phone-sized screen.

#### Part 2.2: Add and edit a basic product — 1–2 days

Build:

- Product name, integer-minor-unit price, description, availability.
- Add/edit/archive/restore product.
- Product mutation audit events.

Tests first:

- Price parsing/formatting and invalid-input cases.
- Cross-tenant denial and role permissions.
- Referenced products archive rather than delete.

User check: add a product in under one minute and edit it on phone.

#### Part 2.3: Secure product image upload — 1–2 days

Build:

- Authenticated image upload.
- Signature/type, size, and dimension validation.
- Decode/re-encode, EXIF removal, server-generated paths, private upload policy.

Tests first:

- Invalid/polyglot/oversized files rejected.
- Cross-tenant object access denied.
- Metadata is removed and safe output type is produced.

User check: take/upload/crop or replace a product image from phone.

#### Part 2.4: Categories, ordering, sold-out and duplicate — 1–2 days

Build:

- Simple categories and product ordering.
- Duplicate product and sold-out/hidden controls.
- Customer-style catalogue preview, not public storefront.

Tests first:

- Ordering and category constraints.
- Duplicate preserves intended fields but creates new identity.
- Hidden/sold-out products behave correctly in order selection.

User check: organise five test products and review the preview.

Phase gate: merchant can manage a small catalogue entirely from a phone; automated file, tenancy, and audit tests pass.

### Phase 3 — Customers, delivery, and manual ordering

#### Part 3.1: Merchant-scoped customers — 1 day

Build:

- Create/find customer by normalised E.164 phone number.
- Name, preferred channel, safe merchant note, masking in lists.

Tests first:

- Phone normalisation and merchant-scoped uniqueness.
- No cross-merchant customer matching or access.
- Personal data is redacted from logs.

User check: create and find repeat customers using phone numbers.

#### Part 3.2: Address collection and saved-address confirmation — 1–2 days

Build:

- Structured address fields and delivery instructions.
- Saved/recent address selection with masked confirmation.
- Pickup choice bypasses address requirement.

Tests first:

- Delivery requires full address; pickup does not.
- Cross-tenant address denial.
- Reconfirmation required for saved addresses.

User check: enter, save, reuse, change, and mask an address.

#### Part 3.3: Delivery zones and fee calculation — 1–2 days

Build:

- Postcode zones, delivery fee, minimum order, free threshold, COD fee, pickup location.
- Outside-area and manual-review result.

Tests first:

- Table-driven examples at fee/minimum/threshold boundaries.
- No matching zone cannot silently confirm delivery.
- All money remains integer minor units.

User check: configure two zones and try inside/outside addresses.

#### Part 3.4: Manual draft order — weekend, 2 days

Build:

- Select customer/address, products, quantities, delivery/pickup.
- Server-calculated totals and immutable order-item snapshots.
- Draft save/resume and structured summary.

Tests first:

- Totals, quantities, availability, delivery fee, and catalogue price snapshot.
- Concurrent product price change does not alter existing order snapshot.
- Idempotent create prevents duplicate order.

User check: enter a phone order from start to summary on mobile.

#### Part 3.5: Customer confirmation and order state engine — 1–2 days

Build:

- Allowed order transitions and append-only timeline.
- Confirm/change/cancel/request-review operations.
- Merchant order detail with one primary next action.

Tests first:

- Exhaustive allowed/denied transition table.
- State history cannot be rewritten/deleted.
- Concurrent transitions use optimistic versioning.

User check: walk through draft, change, confirm, and cancel scenarios.

Phase gate: the complete manual-order flow works without external providers and all domain behaviour is automated.

### Phase 4 — Direct payments and fulfilment

#### Part 4.1: Merchant payment settings — 1–2 days

Build:

- Enable PayID, bank transfer, COD, and cash pickup.
- Versioned encrypted restricted fields.
- Step-up MFA for changes and safe customer instruction rendering.

Tests first:

- AAL1 and support roles cannot change payment settings.
- Ciphertext/key-version and rotation behaviour.
- Secrets/bank values never enter logs, audit diffs, or platform views.

User check: configure each method and review exactly what a customer sees.

#### Part 4.2: Payment submission and verification — 1–2 days

Build:

- Unique payment reference.
- `unpaid`, `payment_submitted`, `cash_due`, and merchant-verified `paid` flow.
- Reject/void/refund correction records; no receipt upload.

Tests first:

- Customer assertion never becomes `paid` automatically.
- Only authorised merchant role verifies payment.
- Payment history cannot be deleted or overwritten.

User check: test PayID report-paid, merchant verification, and COD collection.

#### Part 4.3: Today view and fulfilment actions — 1–2 days

Build:

- New, awaiting payment, preparing, ready, delivery, overdue, completed groups.
- One primary action and clear payment/fulfilment separation.

Tests first:

- Grouping and next-action rules.
- Merchant timezone boundary and overdue calculation.
- Staff/owner permissions and tenant isolation.

User check: progress several seeded orders from Today on phone.

#### Part 4.4: Billable completion ledger — 1 day

Build:

- Exactly one billable event on first delivered/collected transition.
- Platform billing summary exposes count/amount only, not order content.

Tests first:

- Retries/replays cannot create duplicate charges.
- Cancelled/rejected/draft orders are not billable.
- Platform view cannot traverse into merchant transactions.

User check: compare merchant completed count with privacy-safe platform summary.

Phase gate: customer payment and merchant fulfilment are complete, immutable, and billable without the platform handling funds.

### Phase 5 — Secure customer pages and notifications

#### Part 5.1: Secure confirmation link — 1–2 days

Build:

- Hash-only high-entropy token, expiry, revocation, rotation, and rate limit.
- No-store/no-referrer/security headers and no third-party scripts.
- Channel/OTP challenge for sensitive changes.

Tests first:

- Entropy/lifecycle, forwarded-link restrictions, brute-force/rate limit.
- CSRF, caching, referrer, open redirect, and response-header tests.
- Customer sees only intended masked data.

User check: open confirmation link on phone and test normal/expired/revoked views.

#### Part 5.2: Customer tracking page — 1 day

Build:

- Sanitised order/payment status and timeline.
- Merchant contact/help action.

Tests first:

- No full address/phone/bank data leaks.
- Terminal order token retention/expiry rules.
- Cross-order token substitution fails.

User check: review each tracking state and wording on phone.

#### Part 5.3: Notification outbox and in-app centre — weekend, 2 days

Build:

- Transactional outbox/jobs, idempotency, retry/backoff, dead-letter visibility.
- Central notification templates and merchant in-app centre.

Tests first:

- Notification is created only after domain transaction commits.
- Retry does not duplicate provider delivery.
- Provider failure never loses/rolls back order.

User check: inspect notifications, mark read, retry a simulated failure.

#### Part 5.4: PWA web push and email fallback — 1–2 days

Build:

- Install/permission guidance, subscription management, test notification.
- Outbound email adapter and fallback preference.

Tests first:

- Subscription tenant/user binding and revocation.
- Template rendering/redaction and fallback selection.
- Mock provider contract and retry cases.

User check: install PWA and receive a test/new-order alert on available devices.

Phase gate: secure customer pages and merchant notifications work; delivery failure is observable and recoverable.

### Phase 6 — Merchant-granted support

#### Part 6.1: Support-administrator management — 1 day

Build:

- Platform owner creates/disables support-admin assignment.
- Mandatory MFA/AAL2 and privacy training/acknowledgement marker.

Tests first:

- Disabled/unverified/AAL1 support actor denied.
- Role changes revoke sessions and are audited.

User check: create and disable a test support administrator.

#### Part 6.2: Support grant and revocation — 1–2 days

Build:

- Merchant owner grants catalogue-only access, duration, reason/ticket.
- Four-hour default, 24-hour maximum, immediate revoke.

Tests first:

- Only merchant owner at recent AAL2 can grant.
- Platform owner cannot self-grant.
- Scope, expiry and revocation enforced server-side/RLS.

User check: grant and revoke support while viewing active/recent grants.

#### Part 6.3: Support session and catalogue assistance — weekend, 2 days

Build:

- Distinct support context, persistent banner, exit action, 15-minute idle expiry.
- Catalogue access/mutations only within grant.
- Sensitive reads and all mutations attributed/audited.

Tests first:

- No access to orders/customers/messages/payment settings/exports.
- Idle/absolute expiry, revocation, role change, suspension terminate access.
- Actor is support admin, never merchant owner.

User check: enter support mode, edit catalogue, confirm banner/audit, and test revocation.

Phase gate: support works without hidden impersonation or standing platform access.

### Phase 7 — WhatsApp pilot

#### Part 7.1: Channel adapter contract and fake channel — 1–2 days

Build:

- Normalised inbound/outbound contracts.
- Fake provider for deterministic end-to-end conversational tests.
- Conversation/message persistence and retention controls.

Tests first:

- Schema validation, hostile content encoding, idempotency, tenant routing.
- Domain code has no provider SDK dependency.

User check: run a simulated chat order and review conversation wording.

#### Part 7.2: Meta webhook security and inbound WhatsApp — 1–2 days

Build:

- Verification/signature over raw body, environment-isolated secret, replay/deduplication controls.
- Phone capture and normalised inbound message.

Tests first:

- Invalid signature, replay, duplicate, oversized/malformed payload denied safely.
- Provider fixture contract tests and acknowledgement timing.

User check: send test WhatsApp messages through provider sandbox/test number.

#### Part 7.3: WhatsApp draft order and address flow — weekend, 2 days

Build:

- Structured product/quantity selection or conservative draft extraction.
- Address/postcode collection, deliverability, order summary, change/help/handoff.

Tests first:

- Ambiguous input never commits an order.
- Out-of-area flow offers pickup/review.
- Conversation retries cannot duplicate draft/order.

User check: complete normal, ambiguous, changed, and out-of-area conversations.

#### Part 7.4: WhatsApp confirmation, payment and tracking — 1–2 days

Build:

- Customer confirmation, payment instructions, report-paid, and status messages.
- Secure confirmation/tracking links where needed.

Tests first:

- Central template contracts and no sensitive leakage.
- Customer report-paid remains unverified.
- Delivery retries/idempotency and opt-out/help behaviour.

User check: complete one real sandbox order from message to delivered.

Phase gate: one pilot merchant can complete a WhatsApp-originated order without database intervention.

### Phase 8 — Operations, privacy and pilot release

#### Part 8.1: Daily log archive and tamper checks — 1–2 days

Build:

- UTC JSONL batch export to private Supabase Storage.
- Checksums, sequence manifest, verification, retention status, alerting.

Tests first:

- Missing/changed/duplicate/reordered batches detected.
- Redaction before archive.
- Source cleanup only after verified upload.

User check: inspect one sanitised archive manifest, not raw customer data.

#### Part 8.2: Privacy requests and retention jobs — weekend, 2 days

Build:

- Access/correction/opt-out/de-identification request workflow.
- Field-level retention actions across database, Storage, exports, providers, and backup exceptions.

Tests first:

- Identity verification and audit trail.
- De-identification removes identifiability while preserving allowed transaction facts.
- Cross-tenant/privacy-request abuse denied.

User check: process a seeded customer correction and de-identification request.

#### Part 8.3: Platform billing report and invoice tracking — 1 day

Build:

- Billing periods, plan/rate snapshot, completed count, external invoice metadata/status.

Tests first:

- Cap/subscription calculations and date boundaries.
- Privacy-safe platform output and immutable billable ledger.

User check: reconcile one sample merchant invoice report manually.

#### Part 8.4: Pilot security and recovery gate — weekend, 2 days

Build/verify:

- Full authorization/RLS matrix, ASVS checklist, dependency/secret/static scans.
- Backup restore, archive tamper test, incident/NDB tabletop, provider/subprocessor review.
- Accessibility/performance/browser checks and production configuration review.

Tests:

- Run the complete automated suite and targeted security tests.
- Record recovery point/time and outstanding risks.

User check: execute the full merchant/customer journey and approve pilot release.

Phase gate: all launch gates in `DELIVERY_PLAN.md` pass and residual risks have named decisions/owners.

## 6. Remaining staged channel increments

After the WhatsApp pilot and core flow are stable, implement each remaining MVP channel as its own small sequence:

1. Adapter contract/fixtures.
2. Inbound identity and webhook/email security.
3. Draft/address/confirmation flow.
4. Outbound status, retries, opt-out, and end-to-end pilot.

Recommended order: SMS, inbound email, then Messenger, subject to provider approval and merchant demand. Do not implement all three in one part.

## 7. Progress record template

Copy this beneath a part or into the issue tracker:

```text
Part:
Started:
Acceptance examples:
Tests written first:
Automated checks:
Preview URL:
User UI/process feedback:
Corrections:
Accepted by user:
Completed:
Security/privacy notes:
Documentation/ADR updates:
```
