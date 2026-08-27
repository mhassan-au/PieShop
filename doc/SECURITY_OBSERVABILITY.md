# Security and Observability

## 1. Objectives

The system must protect tenant isolation, customer contact/address data, merchant bank instructions, order integrity, and communication credentials while producing structured evidence suitable for debugging and later automated anomaly analysis.

Target OWASP ASVS 5.0 Level 2 for the internet-facing application, with additional privileged-access controls in this document. Maintain a traceable security checklist rather than claiming compliance from design alone.

## 2. Data classification

### Restricted

Secrets, tokens, authentication material, complete bank details, raw payment evidence. Never log or send to Telegram.

Payment evidence is not collected in the MVP. Provider credentials, webhook secrets, and bank/PayID configuration use versioned managed/envelope encryption in addition to provider/storage encryption at rest.

### Personal

Phone numbers, names, email addresses, delivery addresses, message content. Minimise, mask in logs, and retain only for a documented purpose.

### Business confidential

Orders, prices, reports, merchant notes, integration health. Tenant-isolated.

### Operational

Sanitised event codes, durations, status, hashed identifiers, request/trace IDs. Suitable for structured logs.

## 2.1 Platform privacy and support access

- Platform ownership does not imply access to merchant catalogue, customer, message, order, payment, or address data.
- Merchant onboarding and account management operate on a separate metadata/control-plane view.
- Merchant business data becomes accessible to a support administrator only through an active, scoped, merchant-granted support session.
- Support sessions show a persistent UI banner, expire automatically, can be revoked immediately, and retain the true support actor in every request and audit event.
- Support permissions do not include transaction deletion, audit deletion, merchant ownership changes, payment-instruction changes, data exports, or security changes.
- Platform owners, support administrators, and merchant owners require MFA/AAL2. Support grants require recent merchant-owner step-up authentication, default to four hours, and cannot exceed 24 hours.
- Support sessions expire after 15 minutes idle and terminate on revocation, expiry, role change, or suspension. Platform owners can revoke but cannot self-grant merchant-content access.

## 2.2 Privacy governance

- Maintain a data inventory recording purpose, owner, classification, source, recipients/subprocessors, processing/storage regions, lawful basis/notice, retention, deletion mechanism, and backup treatment.
- Provide customer collection notices and merchant/platform privacy terms before production collection.
- Process access, correction, opt-out, deletion, and de-identification requests through a tracked workflow with identity verification and audit history.
- Do not use customer/order data for unrelated marketing, cross-merchant analytics/profiling, or AI model training without a new approved purpose and privacy assessment.
- Maintain a subprocessor register and review security, DPA/contract, overseas disclosure, deletion, breach notification, and access controls before onboarding a provider.

## 3. Log categories

- **Application logs**: runtime and integration diagnostics; short/medium retention.
- **Security events**: suspicious or control-relevant activity; longer retention and alert rules.
- **Audit events**: append-only record of important human/system actions; business record, not debug output.
- **Provider delivery attempts**: notification/message results with sanitised provider codes.

Required event fields:

```json
{
  "schemaVersion": 1,
  "timestamp": "2026-08-27T02:14:31.402Z",
  "level": "warn",
  "environment": "production",
  "service": "orders-api",
  "event": "order.transition_rejected",
  "errorCode": "INVALID_ORDER_TRANSITION",
  "requestId": "req_f821",
  "traceId": "trace_91",
  "businessId": "biz_83",
  "orderId": "ord_491",
  "outcome": "rejected",
  "durationMs": 184,
  "securityRelevant": false
}
```

Identifiers in operational logs must be non-secret and should be shortened/hashed where the full value is unnecessary.

## 4. Daily archive design

Supabase Storage is the immutable archive, not an appendable live file. Live structured events are safely inserted/streamed first; a scheduled job creates compressed JSONL batches for a completed UTC period.

Example paths:

```text
log-archives/production/application/year=2026/month=08/day=27/application-001.jsonl.gz
log-archives/production/security/year=2026/month=08/day=27/security-001.jsonl.gz
log-archives/production/audit/year=2026/month=08/day=27/audit-001.jsonl.gz
```

Each archive batch records row count, time range, checksum, schema version, object path, status, and exporter version. Delete source diagnostic rows only after upload and checksum verification. Audit deletion follows the approved retention policy.

Initial retention targets, subject to legal/privacy review:

- Debug: 7 days.
- Application: 30–90 days.
- Security: 12 months.
- Audit: 12 months or required business/legal duration.
  Payment evidence is disabled for the MVP, so its target retention is zero. Replace provisional ranges with an approved field-level retention schedule before launch. Retention jobs must cover live tables, Storage objects, temporary exports, logs, archives, provider-held data, and backups. Verify deletion/de-identification and record exceptions; test re-identification risk before treating data as de-identified.

Archive/backup access uses credentials separated from application and support roles. Manifests include cryptographic checksums and sequence coverage. Use object versioning/retention protection where available and alert on missing, changed, duplicated, or out-of-order batches.

## 5. Telegram critical alerts

Send sanitised alerts asynchronously for events such as:

- Possible cross-tenant access.
- Database or job-system outage.
- Repeated webhook signature failures or replay attempts.
- Suspected credential exposure.
- Unexpected privileged/admin action.
- Repeated order/payment integrity failure.
- Notification system outage.
- Archive/backup verification failure.

Telegram messages include environment, stable code, UTC time, service, safe IDs, request/trace ID, and an internal investigation link where available. They exclude names, addresses, phone numbers, message bodies, bank details, credentials, and stack traces.

Implement rate limiting, fingerprint-based deduplication, grouping, escalation thresholds, and retry. Telegram failure never blocks the user operation and is itself logged.

The Part 0.3 local implementation provides sanitisation, timeout, failure isolation, fingerprint deduplication, and window rate limiting behind injected interfaces. Its in-memory gate is deterministic test/local infrastructure, not a production coordination mechanism. Durable shared alert state, retries, escalation links, and real provider credentials remain disabled until their later hosting/operations checkpoints.

## 6. Audit events

Audit at minimum:

- Product price/availability changes.
- Delivery-zone or fee changes.
- PayID/bank/payment-method changes.
- Payment verification/rejection/refund record.
- Order state, address, total, cancellation, or manual override changes.
- Staff invitations, role changes, and removal.
- Business suspension/reactivation.
- Data export/deletion.
- Administrator access and support actions.
- Support grant creation/revocation, support session start/end, sensitive-area reads, and every support mutation.
- MFA enrollment/reset, account recovery, session creation/revocation, step-up failure, privilege change, and denied privileged actions.
- Restricted-field encryption/key rotation, privacy requests, retention actions, backup restore tests, and archive verification.

Capture actor, action, reason where needed, target, safe before/after diff, business, request/trace ID, IP/device risk metadata where justified, and UTC timestamp.

## 7. Threat/anomaly readiness

Use stable machine-readable event names and fields so future rules/AI can detect:

- Authentication failure bursts.
- Enumeration of tracking/order tokens.
- One actor accessing unusual numbers of customers/orders.
- Cross-tenant query denials.
- Abnormal exports or attachment downloads.
- Webhook floods/duplicates/signature failures.
- Sudden notification-volume changes.
- Repeated manual payment-state changes.
- Secret/PII patterns in log fields.
- Unexpected geography/device changes for privileged users.

AI analysis must operate on minimised/sanitised data and produce findings for human review; it must not autonomously suspend merchants or alter orders in the MVP.

## 8. Reliability controls

- Health/readiness endpoints for application and workers.
- Database backups and documented restore exercise.
- Durable jobs with retry/dead-letter visibility.
- Idempotent webhooks and notification operations.
- Timeouts and circuit-breaking behaviour for external providers.
- Monitoring of queue age, error rate, delivery success, webhook lag, and archive completion.
- Runbooks for critical alerts before pilot launch.
- Separate backup credentials/roles, encryption, immutable/versioned copies where available, and a scheduled restore exercise with recorded recovery point/time results.
- Trusted UTC clock synchronisation and clock-drift monitoring.
- Dependency lockfiles, software inventory/SBOM, automated dependency and secret scanning, and reviewed update cadence.

## 8.1 Authentication, session and recovery controls

- Rate limit and monitor login, invitation, OTP, MFA, recovery, tracking-token, and support-session endpoints without revealing whether an account exists.
- Require AAL2 for privileged roles and sensitive actions in server/database authorization, not just the UI.
- Prefer TOTP or phishing-resistant factors; do not rely on SMS alone for privileged recovery.
- Recovery/factor reset requires strong identity verification, sends out-of-band notification, revokes existing sessions, and creates a high-severity security event.
- Rotate sessions after authentication/privilege change. Users can inspect and revoke their active sessions.
- Hash session identifiers for correlation; never log raw cookies, JWTs, refresh tokens, invitation tokens, OTPs, or customer tokens.

## 8.2 Customer-link and browser controls

- Confirmation/tracking tokens use at least 128 bits of cryptographic randomness, are stored as hashes, expire/revoke/rotate, and are rate limited.
- A forwarded link cannot authorise sensitive customer changes without a channel-bound challenge or OTP.
- Token pages set no-store/no-referrer controls and load no third-party analytics/scripts.
- Enforce TLS/HSTS, CSP, CSRF controls, origin/host validation, clickjacking protection, MIME-sniffing protection, and secure cookie attributes.

## 8.3 Upload and content controls

- Only authenticated merchants upload product images in the MVP.
- Validate file signature, dimensions and size; decode/re-encode; remove EXIF/geolocation; generate object names server-side; serve as non-executable media.
- Treat all message/email/catalogue content as untrusted and contextually encode it. Avoid rendering raw HTML email.
- Payment receipts and general customer attachments are not stored in the MVP.

## 9. Incident response baseline

1. Alert and record incident ID.
2. Triage severity and affected tenant/data.
3. Contain without destroying evidence.
4. Preserve relevant logs/audit history.
5. Remediate and verify.
6. Notify affected parties when required.
7. Document root cause, timeline, and prevention work.

Maintain a breach register, named security/privacy contacts, provider escalation paths, and pre-approved communication templates. If the Australian Notifiable Data Breaches scheme applies, take reasonable steps to complete a suspected eligible-breach assessment within 30 calendar days, treating 30 days as the maximum. Begin containment and harm reduction immediately rather than waiting for the assessment.

Production access should be least-privilege, attributable to a person, and reviewed. Never troubleshoot by copying production personal data into chat, tickets, source code, or test fixtures.

Transactional and audit records are immutable to application roles. Privacy erasure is performed through a reviewed anonymisation/retention process, not by deleting financial/order history from ordinary application code.
