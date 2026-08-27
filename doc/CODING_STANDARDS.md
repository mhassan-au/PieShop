# Coding Standards

These standards are mandatory unless an approved decision in `DECISIONS.md` explicitly supersedes them.

## 1. Language and correctness

- Use TypeScript in strict mode. Do not use `any` without a narrow, documented boundary.
- Validate all external input at runtime with a schema library.
- Prefer small pure domain functions for totals, eligibility, and state transitions.
- Use exhaustive checks for order/payment states.
- Store money as integer minor units, never floating point.
- Store instants in UTC; never derive authoritative server timestamps from a client clock.
- Do not place business logic in React components or provider webhook handlers.

## 2. Centralised messages

All user-facing messages, validation errors, confirmations, pop-ups, notification text, email subjects, and conversational templates use a typed central message catalogue.

```text
src/messages/
  catalogue.ts          typed keys, templates, placeholders and formatter
  en-AU.ts              locale entry point
src/errors/
  app-error.ts          typed internal error and safe public envelope
```

Rules:

- Components and services reference stable message keys.
- Templates accept typed parameters.
- Internal exception messages are not reused as public copy.
- Channel-specific formatting wraps shared semantic content.
- No important user-facing literal strings are scattered through feature code.
- Message changes require tests for required placeholders.
- Formatted catalogue output is plain text. Encode it for its eventual output context and never pass it to raw-HTML rendering.

## 3. Errors

Use a typed `AppError` family containing:

- Stable error code.
- Severity: debug, info, warning, error, or fatal.
- Safe public message key.
- Retryable flag.
- HTTP/status mapping where relevant.
- Original cause.
- Sanitised structured context.
- Request and trace IDs.

Expected domain failures are not treated as programmer exceptions. API routes translate internal errors through one global handler. React uses route/global error boundaries. Background jobs record failure and retry policy consistently.

Never return stack traces, SQL details, provider secrets, raw exceptions, or internal object data to customers.

## 4. Logging and debug mode

- All logs go through the central logger; no direct `console.log` in application code.
- Local logger output may use the console in a readable format.
- Production/staging logger output is structured JSON.
- `LOG_LEVEL=debug` enables debug events. Debug mode never disables redaction or security controls.
- Use `debug`, `info`, `warn`, `error`, and `fatal` consistently.
- Include event name, schema version, UTC timestamp, environment, service, outcome, request ID, trace ID, and safe entity IDs.
- Do not log entire request/response bodies by default.
- Never log passwords, tokens, secrets, full bank data, raw payment evidence, session cookies, or unnecessary message contents.

The Part 0.3 implementation keeps these responsibilities under `src/observability/`: recursive redaction, structured event construction, sink interfaces, critical-alert policy, Telegram transport, and the sanitised Sentry boundary. Provider SDKs and transports must remain outside feature and domain code.

## 5. Date and time

- Database fields use `timestamptz` for instants.
- APIs use ISO 8601 UTC, such as `2026-08-27T02:14:31.402Z`.
- Merchants store an IANA timezone, not a numeric offset.
- Convert to local time only at the UI, notification, and scheduling boundary.
- Tests cover daylight-saving transitions and date-boundary reporting.
- A “billing day” or “delivery day” is interpreted in the merchant timezone, then converted to UTC.

## 6. Naming and structure

- Use descriptive domain names; avoid vague `utils`, `data`, `manager`, or `helper` modules.
- Files/modules have one clear responsibility.
- React components use PascalCase; functions and variables use camelCase; database names use snake_case.
- Booleans read positively where practical: `isActive`, `canDeliver`, `hasPaid`.
- Stable public identifiers are not sequential database IDs.
- Comments explain why, constraints, or risk—not what readable code already says.

## 7. Database and tenancy

- Every tenant query explicitly carries `businessId` even when RLS also applies.
- All migrations are forward, reviewed, and tested against representative data.
- Use transactions for multi-record state changes.
- Use optimistic concurrency/versioning for competing order updates.
- Use idempotency keys at every external-event boundary.
- Repositories return domain-shaped values rather than leaking raw provider responses.
- Never use a service-role client in browser code.
- Platform roles never bypass tenant privacy merely because they are administrators; catalogue/transaction access requires an active, scoped merchant support grant.
- Preserve the real actor and effective business separately during support sessions.
- Do not implement `DELETE` repository methods or routes for orders, order items, payments, state events, billable events, invoices, or audits.
- Corrections use explicit append-only domain operations such as cancel, void, refund, adjust, or supersede.

## 8. API and integrations

- Verify webhook signatures before processing.
- Validate payload schema and enforce size limits.
- Acknowledge providers within required time and move long work to a durable job.
- Apply explicit timeouts, retry only safe operations, and use exponential backoff with jitter.
- Translate provider errors to stable internal codes.
- Store provider message/event IDs for deduplication.
- Do not make provider SDK types part of domain interfaces.
- Verify webhooks over the exact raw body before parsing; enforce replay/timestamp windows where supported.
- Treat inbound text, email, attachments, filenames, provider errors, catalogue content, and template variables as hostile input and encode for the output context.

## 9. Security

- Default deny authorization.
- Enforce permission checks on the server and RLS in the database.
- Apply rate limits to login, OTP, tracking tokens, inbound messages, uploads, and public actions.
- Validate file type by content, set size limits, use private buckets, and consider malware scanning.
- Redact personal and secret data before logs or Telegram alerts are created.
- Use cryptographically secure random tokens and store token hashes.
- Do not invent cryptography; use established platform/library primitives.
- Require MFA/AAL2 for privileged roles and step-up authentication for sensitive actions; enforce in server/database policy, not UI alone.
- Protect cookie-authenticated mutations from CSRF and reject unexpected origins/hosts.
- Set and test CSP, HSTS, frame, referrer, MIME-sniffing, permissions, and no-store headers by route sensitivity.
- Never trust authorization stored in user-editable metadata or stale client state.
- Product images must be decoded/re-encoded with metadata removed; do not accept arbitrary customer payment attachments in MVP.
- Restricted-field encryption uses versioned managed keys and authenticated encryption; include rotation and failure tests.
- Account recovery, factor reset, and privilege change revoke relevant sessions and notify the affected user.

## 10. Testing

Every feature includes proportionate automated tests:

- Unit tests for totals, delivery eligibility, state transitions, time, and message formatting.
- Integration tests for repositories, RLS/tenant isolation, jobs, and webhook idempotency.
- Authorization tests proving platform owners cannot view merchant content by default and support access ends on expiry/revocation.
- Immutability tests proving all application roles are denied hard deletion of transactional/audit records.
- Contract tests for channel adapters using recorded sanitised fixtures.
- End-to-end tests for merchant onboarding, catalogue, manual order, payment verification, fulfilment, and tracking.
- Accessibility checks for core pages.
- Security tests mapped to the project's OWASP ASVS 5.0 Level 2 baseline.
- Automated dependency, secret, static-analysis, and production-header checks.

A defect fix includes a failing regression test when feasible. Tests must be deterministic and must not call production providers.

## 11. Quality gates

Before merging:

- Formatting, linting, and TypeScript checks pass.
- Relevant unit/integration/end-to-end tests pass.
- Database migrations and RLS changes receive explicit review.
- No secrets or personal data appear in fixtures/snapshots.
- User-visible copy uses message keys.
- New errors/logs follow the structured schema.
- Documentation is updated when behaviour or decisions change.
- Security/privacy-impacting changes include threat-model and data-retention review.

## 12. Git and change discipline

- Keep changes focused and reviewable.
- Do not mix unrelated refactors with feature work.
- Use clear commit/PR descriptions including risk, migrations, tests, and rollback considerations.
- Backward-compatible migrations precede code that depends on them where zero-downtime deployment matters.
- Feature flags protect incomplete external integrations.
