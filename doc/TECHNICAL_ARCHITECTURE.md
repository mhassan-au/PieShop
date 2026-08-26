# Technical Architecture

## 1. Recommended stack

| Area                             | MVP technology                                             |
| -------------------------------- | ---------------------------------------------------------- |
| Application                      | Next.js with TypeScript                                    |
| UI                               | React, Tailwind CSS, shadcn/ui                             |
| Mobile experience                | Progressive Web App                                        |
| Database                         | Supabase PostgreSQL                                        |
| Authentication                   | Supabase Auth                                              |
| Product/evidence/archive storage | Private and purpose-specific Supabase Storage buckets      |
| Realtime UI updates              | Supabase Realtime where useful                             |
| WhatsApp                         | Meta WhatsApp Cloud API                                    |
| SMS                              | Twilio                                                     |
| Outbound email                   | Resend                                                     |
| Inbound email                    | Provider selected during channel milestone, behind adapter |
| Messenger                        | Meta Messenger Platform                                    |
| Jobs/retries                     | Trigger.dev or a durable PostgreSQL-backed job system      |
| Merchant push                    | Standards-based Web Push                                   |
| Exceptions                       | Sentry                                                     |
| Structured application logs      | Pino-compatible schema                                     |
| Critical alerts                  | Telegram Bot API through server-only adapter               |
| Hosting                          | Vercel                                                     |

Pin exact package versions when scaffolding. Re-evaluate service pricing and platform policy before production launch.

## 2. Logical architecture

```text
Merchant PWA -----------+
Customer secure pages --+--> Next.js application/API --> domain services --> PostgreSQL
                         |             |                       |
Channel webhooks --------+             |                       +--> audit/outbox/jobs
                                       |
                                       +--> channel adapters
                                       |      WhatsApp / SMS / Email / Messenger / Push
                                       |
                                       +--> private object storage
                                       +--> Sentry / sanitised Telegram alerts
```

## 3. Application boundaries

Recommended source boundaries:

```text
src/
  app/                  Next.js routes and composition
  components/           reusable presentation components
  features/             feature UI and application orchestration
  domain/               entities, state rules, money and delivery logic
  server/               repositories, services, jobs and integrations
  channels/             normalised message contract and provider adapters
  messages/             central user-facing copy and templates
  errors/               typed application errors and public error envelopes
  observability/        logger, tracing and alert adapters
  config/               validated environment configuration
  lib/                  small generic utilities only
```

Domain code must not import provider SDKs or UI components. Provider adapters translate external payloads into internal contracts.

## 4. Multi-tenancy

- `business_id` is required on every merchant-owned record.
- Row Level Security (RLS) is enabled on all exposed tenant tables.
- Server-side authorization is still required; RLS is defence in depth, not the only check.
- Unique constraints include `business_id` where uniqueness is tenant-scoped.
- Background jobs carry and validate tenant context.
- Object paths begin with an authorised business ID for merchant-owned files.
- Platform-wide customer matching is prohibited in merchant-facing operations.

## 5. Authentication and authorization

- Merchant owners/staff and platform administrators use Supabase Auth with their own individual identities.
- Public merchant sign-up is disabled. A server-only platform-owner workflow creates the business and a single-use, expiring merchant-owner invitation.
- Initial roles: `merchant_owner`, `merchant_staff`, `platform_owner`, and `support_admin`.
- Authorization uses business membership plus role/capability checks.
- Customers use secure, random, expiring tokens for order confirmation/tracking; no customer account is required.
- Never store raw tracking tokens; store a cryptographic hash and compare safely.
- Sensitive settings changes require recent step-up authentication.
- Enforce MFA/AAL2 for platform owners, support administrators, and merchant owners. Require recent step-up authentication for support access, role/staff changes, payment-instruction changes, exports, and security/account changes.
- Session recovery or MFA-factor reset revokes existing sessions, notifies the account owner, and produces a high-severity audit/security event.

### 5.1 Privacy boundary for platform roles

Platform roles operate in a separate control plane. Platform-owner queries return account metadata, onboarding state, billing summaries, support-grant state, and integration health—not merchant catalogue or transaction rows. RLS and server authorization enforce this boundary even if the UI accidentally requests merchant content.

### 5.2 Support sessions

Support access uses explicit grants and short-lived derived sessions:

```text
merchant owner creates grant -> support admin enters session
-> server validates actor + grant + expiry + scope on every request
-> support banner displayed -> reads/mutations audited -> expiry/revocation ends access
```

Do not implement support by sharing credentials or replacing the authenticated user ID with the merchant owner's ID. Preserve both `support_actor_id` and `effective_business_id` throughout request context, logs, audits, and mutations. Default support scope can manage catalogue only; payment instructions, merchant ownership, security, exports, and destructive transaction actions are prohibited.

Support grants default to four hours, have a maximum 24-hour lifetime, and require merchant-owner AAL2 approval. Support sessions have a 15-minute idle timeout and terminate immediately on expiry, revocation, role change, or account suspension. The platform owner can revoke support but cannot grant itself merchant-content access.

## 6. Channel adapter contract

Each inbound adapter produces a normalised envelope:

```ts
type InboundMessage = {
  provider: "whatsapp" | "messenger" | "sms" | "email";
  providerMessageId: string;
  businessId: string;
  sender: {
    externalId: string;
    phoneE164?: string;
    email?: string;
  };
  text?: string;
  attachments: Array<{ type: string; providerRef: string }>;
  receivedAtUtc: string;
};
```

Adapters are responsible for signature verification, payload validation, acknowledgement deadlines, and provider error translation. The domain layer owns order behaviour.

## 7. Transaction and event pattern

Persist the business change and an outbox/job record in the same database transaction. Workers deliver notifications asynchronously. Use stable idempotency keys for inbound webhooks, notification sends, payment assertions, and billable completion events.

## 8. Storage buckets

Use separate private buckets and policies:

- `product-images`: merchant-visible catalogue media.
- `log-archives`: platform-operations-only immutable batches.
- `exports`: short-lived merchant data exports.

Payment-evidence uploads are not included in the MVP. Product images must be content-signature validated, size/dimension limited, decoded/re-encoded, stripped of EXIF/location metadata, and served from a non-executable media context. Upload object names are server generated.

Do not append repeatedly to a single Storage object. For logs, insert structured live events safely, then export immutable compressed JSONL batches to paths such as:

```text
production/application/year=2026/month=08/day=27/application-001.jsonl.gz
```

## 9. Time and money

- Store instants as UTC `timestamptz`.
- Exchange timestamps as ISO 8601 UTC strings.
- Store merchant timezone as an IANA identifier, for example `Australia/Sydney`.
- Convert only at presentation/scheduling boundaries.
- Store monetary values as integer minor units plus ISO currency code; never use floating point.
- A business has one operating currency in the MVP.
- Snapshot product name, option, unit price, tax/display information, and currency on order items.

## 10. Deployment environments

Maintain local, staging, and production environments with separate databases, secrets, provider credentials, Telegram channels, and storage. Test/sandbox messages must be visibly identified and must not contact production customers.

Use validated environment variables and fail startup/deployment checks when required values are absent. Secrets never enter source control, browser bundles, logs, or user-facing errors.

Restricted fields such as provider credentials, webhook secrets, and merchant bank/PayID settings use managed/envelope encryption with versioned keys and a rotation procedure. Keys are held separately from database ciphertext. Production credentials are least-privilege and unavailable to support tooling.

## 10.1 Browser and public-link controls

- Use secure, HttpOnly, SameSite cookies where applicable and CSRF protection plus `Origin`/`Host` validation for state-changing requests.
- Apply HSTS, a restrictive Content Security Policy, clickjacking protection, `X-Content-Type-Options: nosniff`, and `Permissions-Policy`.
- Customer token pages use `Cache-Control: no-store` and `Referrer-Policy: no-referrer`; do not load third-party analytics or scripts.
- Confirmation/tracking tokens have at least 128 bits of cryptographic randomness, are hash-only at rest, rate limited, revocable/rotatable, and expire after their operational purpose.
- Use a fresh server-side Supabase client per request and do not cache user-specific server-rendered responses across users.

## 10.2 Database privilege baseline

- Revoke default privileges and grant only required operations.
- Enable/test RLS for every exposed table, view, function/RPC, storage policy, and realtime channel.
- Authorization uses server-controlled membership/role data, never user-editable metadata.
- Exposed views use invoker semantics where appropriate; security-definer functions are exceptional, narrowly granted, set a safe search path, and receive dedicated review/tests.
- Service-role use is isolated to named server modules/jobs and cannot be invoked by browser-controlled parameters to bypass authorization.
- Transaction/audit tables use database privileges and protective triggers so accidental or compromised application/service code cannot `DELETE` or rewrite history. A separate audited retention role may only anonymise/delete fields and records allowed by the approved retention policy.

## 11. PWA notifications

Web push is supported where browsers permit it. On iOS, the merchant generally must install the PWA to the Home Screen and grant permission. Therefore:

- Explain installation and permission steps in onboarding.
- Maintain an in-app notification centre.
- Treat email as a fallback.
- Display notification health and allow a test notification.
- Do not promise that operating systems will deliver every push immediately.

## 12. Architecture acceptance criteria

- A channel can be replaced or mocked without modifying order-domain rules.
- Duplicate inbound events do not duplicate orders or notifications.
- One tenant cannot read or mutate another tenant's records or objects.
- A committed order survives notification-provider failure.
- All critical state changes have an audit event and request/trace correlation.
- UTC, currency, and state-transition rules are covered by automated tests.
- Platform-owner access tests prove catalogue/order/customer rows are inaccessible without a valid support grant.
- Support-session tests cover grant, expiry, revocation, scope, visible session context, and actor-attributed auditing.
- Transaction tables expose no hard-delete application path and reject deletion attempts by every application role.
- MFA/recovery, CSRF/security headers, public-link controls, upload processing, and restricted-field encryption pass security tests.
