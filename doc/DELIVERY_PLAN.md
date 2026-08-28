# MVP Delivery Plan

The MVP is delivered in vertical slices. Each milestone must be demonstrable on a phone and include tests, audit events, centralised copy, structured errors, and observability appropriate to its risk.

The executable day-by-day sequence is maintained in `DEVELOPMENT_ROADMAP.md`. No roadmap part advances until automated checks pass and the user accepts its UI/process checkpoint.

## Milestone 0: Foundation

- Scaffold Next.js/TypeScript/PWA application.
- Establish formatting, linting, strict type checking, tests, and CI.
- Configure local/staging/production environments.
- Implement validated configuration and secret handling.
- Implement central message catalogue, `AppError`, logger, request/trace IDs, Sentry, and sanitised Telegram adapter.
- Create Supabase project/migrations, tenancy model, RLS test harness, audit events, and log archive design.
- Establish OWASP ASVS 5.0 Level 2 checklist, threat model, data inventory, subprocessor register, privacy/retention draft, security headers, dependency/secret scanning, and backup/restore plan.
- For internal synthetic-data MVP work, use a pre-provisioned platform-owner password account and invitation-only merchant magic links with a 30-day absolute session maximum. Enforce MFA/AAL2 and stricter recovery/session management before any real-vendor demo, real data, staging pilot, or production rollout.
- Record dependency and environment setup in repository documentation.

Exit: a test merchant can authenticate; tenant isolation tests pass; an intentional test failure is correlated in logs without leaking sensitive data.

## Milestone 1: Merchant onboarding and catalogue

- Platform-owner control plane for creating the initial 1–5 merchants and sending single-use owner invitations; no public merchant sign-up.
- Business, membership, timezone, currency, pickup, and merchant onboarding checklist.
- Mobile catalogue CRUD, images, categories, availability, and simple options.
- Owner/staff authorization baseline.
- Product price-change audit history.
- Privacy tests proving platform owners cannot see merchant catalogue or transactions.

Exit: the platform owner provisions a merchant without seeing merchant content, and the invited merchant adds and publishes a product in under one minute on a target phone.

## Milestone 2: Delivery, customers, and manual orders

- Merchant-scoped customers and saved addresses.
- Postcode delivery zones, fees, minimums, COD fees, and pickup.
- Manual order creation with server-calculated totals and catalogue snapshots.
- Order/payment state engines and timeline.
- Today and Orders screens.

Exit: a phone order can be entered, validated, priced, confirmed, and progressed without an external channel.

## Milestone 3: Direct payments and customer pages

- PayID, bank transfer, COD, and cash-on-pickup settings.
- Unique order payment references.
- Customer payment-submitted flow and merchant verification.
- Secure confirmation/tracking tokens and mobile customer pages.
- Payment evidence upload is excluded from MVP; customer reports payment and merchant verifies independently.

Exit: the UI never confuses submitted with verified payment, and forwarded tracking links reveal no unnecessary personal information.

## Milestone 4: Notifications and operational readiness

- In-app notification centre.
- PWA web push, installation guidance, and test notification.
- Outbound email fallback.
- Durable outbox/jobs, retries, delivery attempts, and failure UI.
- Daily UTC log archives in private Supabase Storage.
- Health checks, backup/restore runbook, critical alert runbooks.

Exit: provider failure does not lose orders; retries and alerts are observable.

## Milestone 5: WhatsApp pilot

- Meta webhook verification and signature checks.
- Normalised inbound/outbound adapter.
- Phone identity capture, conversational draft, address collection, confirmation, and human handoff.
- Approved central message templates.
- Duplicate/replay handling and channel health display.

Exit: a pilot customer completes a WhatsApp-originated order through delivery with no manual database intervention.

## Milestone 6: Remaining MVP channels

- Messenger adapter and phone collection.
- SMS adapter through Twilio.
- Inbound email adapter and phone collection.
- Common conversation/support view and channel-specific policy compliance.
- Feature flags and merchant-by-merchant enablement.

Exit: the same order workflow behaves consistently across enabled channels, or a provider-approval limitation is documented with a reliable manual fallback.

## Milestone 7: Administration, reporting, and pilot launch

- Merchant administration and suspension.
- Support-administrator management plus merchant-granted, scoped, expiring, visible support sessions.
- Support audit trail and immediate revocation.
- Operational reports and billable completion ledger.
- Merchant billing-period/invoice tracking.
- CSV exports and deletion/anonymisation workflow.
- Accessibility, performance, threat modelling, privacy, and recovery review.
- Pilot onboarding/support material.

Exit: usage produces a reproducible merchant invoice report and all launch gates pass.

## Launch gates

- No open critical/high tenant-isolation or authorization defects.
- Platform owner has no default merchant-content access; support grant/expiry/revocation tests pass.
- Transaction/audit hard-delete attempts fail for every application role.
- RLS and server authorization tests pass.
- Backups exist and a restore has been exercised.
- Webhook signatures and idempotency are tested.
- All critical state changes are audited.
- Logs/Telegram test proves required context and redaction.
- Core mobile flows meet accessibility and usability criteria.
- Provider terms, customer consent, opt-out, privacy policy, and retention policy are reviewed.
- Support and incident runbooks have named owners.
- Test data is separated from production.
- MFA/AAL2, recovery/session revocation, CSRF/security headers, restricted-field encryption, customer-link security, and upload hardening tests pass.
- Privacy notice/terms, field-level retention schedule, subprocessor/region review, privacy-request workflow, and NDB assessment runbook receive owner and legal/privacy review.
- Dependency/secret/static scans pass; software inventory exists; backup restoration and archive-tamper detection have been exercised.

## Deferred backlog

- Public web catalogue/storefront.
- Merchant-owned card payments.
- Automated PayID/bank reconciliation.
- Native iOS/Android applications.
- Map radius and route optimisation.
- Live courier tracking.
- Advanced inventory and supplier purchasing.
- AI-assisted order extraction beyond supervised drafts.
- Multi-language customer experiences.
- Automated platform subscription collection.

## Suggested pilot metrics

- Time to add first product.
- Onboarding completion rate.
- Draft-to-confirmed conversion.
- Orders requiring merchant correction.
- Payment-submitted to verified time.
- Median fulfilment time.
- Notification success and acknowledgement rate.
- Duplicate-order incidence.
- Cancellation rate.
- Merchant weekly active use and support requests.
