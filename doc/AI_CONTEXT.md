# AI Coding Context

Read this file first, then read the topic document relevant to the task. This file summarises requirements; detailed documents remain authoritative.

## Mission

Build PieShop, a simple multi-tenant PWA for small merchants to manage a small catalogue and fulfil orders originating from WhatsApp, Messenger, SMS, email, or phone/manual entry. A public storefront is future scope; secure confirmation and tracking pages are MVP scope.

## Non-negotiable product rules

- Every order requires a valid phone number.
- Delivery orders require a full address and successful postcode-zone check or explicit merchant override before confirmation.
- Pickup can bypass delivery eligibility.
- Customers do not create accounts.
- PayID, bank transfer, COD, and cash on pickup pay the merchant directly.
- `payment_submitted` is not `paid`; only a merchant verifies manual funds.
- Platform merchant invoices are separate and manual in the MVP.
- The platform owner creates the initial 1–5 merchant accounts; merchant public sign-up/self-registration is disabled.
- Platform owners can manage account metadata, status, invitations, billing, and integration health but cannot view what merchants sell or see merchant transactions by default.
- Merchant owners may grant a support administrator explicit, scoped, expiring support access. Support uses the administrator's own identity, shows a persistent banner, is revocable, and is fully audited.
- No role can hard-delete orders, payments, state history, billable events, invoices, or audit events. Correct with append-only cancel/void/refund/adjust/supersede operations.
- Payment-evidence uploads are excluded from MVP; never add them without a new threat/privacy decision.
- The internal synthetic-data MVP uses one platform-owner account manually created by the owner in Supabase Auth; it signs in with email and password and has no MFA yet. Merchant owners use invitation-only email magic links and may retain the same revocable browser session for at most 30 days.
- MFA/AAL2 and stricter privileged-session controls are a mandatory release gate before any demo to a real vendor, real merchant/customer data, staging pilot, or production rollout. They are not optional production backlog.
- Support grants default to catalogue-only, four hours, maximum 24 hours; support sessions idle-expire after 15 minutes and terminate on revocation/role change/suspension.
- Payment and fulfilment states are independent.
- External-channel interpretation creates drafts; it never silently commits an uncertain order.
- Merchant UX is mobile-first with `Today`, `Orders`, `Catalogue`, and `Settings`.
- Use a PWA, not native apps, for MVP merchant notifications.

## Proposed technical baseline

- Next.js, React, strict TypeScript, Tailwind, shadcn/ui.
- Supabase PostgreSQL/Auth/Storage/Realtime with RLS.
- Vercel deployment.
- Meta WhatsApp Cloud API first; adapters for Messenger, Twilio SMS, and inbound email.
- Resend outbound email, Web Push, Sentry, structured logging, sanitised Telegram fatal alerts.
- Durable jobs/outbox for notifications and provider work.

Do not assume exact package versions; inspect the repository and current official documentation before adding dependencies.

## Mandatory engineering rules

1. All user-facing errors, confirmations, pop-ups, notifications, and channel templates come from a typed central message catalogue.
2. Use central typed error handling and safe public message keys.
3. Use the central structured logger. No direct `console.log` outside logger implementation/local tooling.
4. `LOG_LEVEL=debug` enables debug logs but never disables redaction.
5. Fatal/security alerts go through an asynchronous, rate-limited, sanitised Telegram adapter.
6. Live structured logs are concurrency-safe; immutable daily UTC JSONL archives go to private Supabase Storage. Do not append/overwrite one shared log object.
7. Store time in UTC and merchant timezone as an IANA ID; display locally only at boundaries.
8. Store money as integer minor units with currency.
9. Require `business_id`, RLS, and server authorization for tenant data.
   Platform roles are a separate control plane and receive no implicit merchant-content access. Validate support actor, grant, scope, expiry, and revocation on every support request; preserve the real actor.
10. Validate all external input and webhook signatures; use idempotency keys.
11. Keep provider SDKs out of domain code.
12. Important mutations write append-only audit events.
13. Never log secrets, full bank data, payment evidence, tokens, or unnecessary PII.
14. Add tests for domain rules, tenancy, idempotency, state transitions, time, and totals.
15. Target OWASP ASVS 5.0 Level 2 and implement secure headers, CSRF/origin protection, session/recovery controls, dependency/secret scanning, and threat-model review.
16. Customer links use hash-only high-entropy expiring tokens, no-store/no-referrer pages, rate limits, and a stronger challenge for sensitive actions.
17. Encrypt restricted configuration fields with managed versioned keys separate from ciphertext; design rotation.
18. Apply approved field-level retention/de-identification to live data, files, exports, logs, archives, providers, and backups.

## State summary

Order: `draft`, `awaiting_customer_confirmation`, `awaiting_merchant_review`, `confirmed`, `preparing`, `ready_for_pickup`, `ready_for_delivery`, `out_for_delivery`, `delivered`, `collected`, `cancelled`, `rejected`.

Payment: `unpaid`, `payment_submitted`, `paid`, `cash_due`, `refunded`, `void`.

Only first transition to `delivered` or `collected` creates one billable fulfilment event.

## Working instructions for AI agents

- Before coding, inspect the repository and applicable documents; do not invent existing architecture.
- Preserve user changes and keep edits scoped.
- Record a material product/architecture decision in `DECISIONS.md` and update affected docs.
- Prefer vertical slices and managed services, but do not couple domain logic to providers.
- Do not broaden MVP scope without explicit approval.
- For any ambiguous payment, privacy, authorization, retention, or cross-tenant behaviour, choose the safer non-destructive behaviour and surface the decision.
- Never add a transaction hard-delete endpoint or hidden administrator impersonation path.
- Never rely on UI-only authorization, user-editable metadata, possession of a forwarded tracking link, or stale JWT claims for privileged decisions.
- Do not claim a feature is complete without appropriate automated verification.
- When implementation conflicts with these requirements, stop and report the conflict rather than silently changing product behaviour.
- Follow `DEVELOPMENT_ROADMAP.md` one part at a time. Do not start the next part until the current part's automated checks pass and the user accepts the UI/process flow.
- Before each phase begins, create or refresh its threat model using `THREAT_MODELING_STANDARD.md`, resolve all phase-entry blockers, and record owner acceptance of residual risk. Material trust-boundary changes reopen the active model.
- Use TDD: agree acceptance examples, observe a relevant test fail, implement the minimum behaviour, refactor under green tests, and record evidence. Manual testing is for UI/usability/device judgement, not repeatable business-rule regression.

## Task reading guide

- Product/UI work: `MVP_PRODUCT_REQUIREMENTS.md` and `WORKFLOWS_AND_STATES.md`.
- Backend/integration work: `TECHNICAL_ARCHITECTURE.md`, `DATA_MODEL.md`, and `CODING_STANDARDS.md`.
- Logging/security work: `SECURITY_OBSERVABILITY.md` and `CODING_STANDARDS.md`.
- Planning/release work: `DELIVERY_PLAN.md` and `DECISIONS.md`.
- Threat modeling: `THREAT_MODELING_STANDARD.md` and the active `PHASE_N_THREAT_MODEL.md`.
- Day-to-day implementation order and acceptance gates: `DEVELOPMENT_ROADMAP.md`.
- Environment, hosting, release, and operational readiness: `PROJECT_CHECKLISTS.md`.
