# Security and Privacy Review

## Review status

- **Reviewed:** 2026-08-27
- **Scope:** All MVP product, workflow, architecture, data, coding, security, delivery, AI-context, and decision documents.
- **Target:** A controlled Australian pilot with 1–5 merchants.
- **Verification baseline:** OWASP ASVS 5.0 Level 2 as the target for internet-facing application controls, with risk-based additions for privileged/support functions.

This document is an engineering baseline, not legal advice. Privacy notices, merchant terms, retention periods, and Notifiable Data Breaches obligations require Australian legal/privacy review before production use.

## Strengths already present

- Explicit tenant isolation using `business_id`, RLS, and server authorization.
- Platform owner cannot inspect merchant content by default.
- Merchant-granted, scoped, expiring, attributable support access.
- Append-only transaction and audit history.
- Centralised safe messages, typed errors, structured/redacted logs, and UTC timestamps.
- Idempotent provider handling and durable notification jobs.
- Private purpose-specific storage buckets.
- Customer-to-merchant payments keep platform payment scope small.

## Hardening requirements added by this review

### Identity and privileged access

- Require MFA/AAL2 for platform owners, support administrators, and merchant owners. Require step-up AAL2 immediately before support grants/sessions, staff/role changes, bank/PayID changes, exports, security changes, or account suspension.
- Prefer TOTP or phishing-resistant factors when available; SMS recovery is not the sole privileged recovery path.
- Recovery cannot bypass MFA silently. Recovery and factor reset require re-verification, revoke existing sessions, notify the account owner, and create a high-severity audit/security event.
- Support grants default to catalogue-only, maximum 4 hours and never more than 24 hours. A merchant owner must create/approve them at AAL2; the platform owner may revoke but cannot grant merchant-content access.
- Support sessions use 15-minute idle timeout, absolute grant expiry, no background persistence, and immediate termination on revocation, role change, or account suspension.
- Users can view and revoke active sessions. Privilege changes revoke/refresh sessions rather than trusting stale JWT claims.

### Authorization and database safety

- Revoke default database privileges; grant only per operation. Enable RLS on every exposed table, storage object path, view, and realtime channel.
- Authorization data must come from server-controlled membership/role tables or trusted app metadata, never user-editable metadata.
- Use `security_invoker` for exposed views where appropriate and test that views/functions cannot bypass RLS.
- Separate control-plane APIs from merchant-data APIs. Platform metadata endpoints must not join or aggregate merchant content.
- Service-role credentials are restricted to narrowly scoped server modules/jobs, never browser code or general support tooling.

### Sessions, browser and customer links

- Use secure, HttpOnly, SameSite cookies where applicable; protect mutations against CSRF and validate `Origin`/`Host`.
- Rotate session identifiers after authentication and privilege changes. Define idle/absolute timeouts and revoke sessions after password/MFA recovery.
- Customer confirmation/tracking tokens contain at least 128 bits of randomness, are stored only as hashes, are rate limited, can be rotated/revoked, and expire after their purpose ends.
- Sensitive customer actions require a channel-bound challenge or OTP, not possession of a forwarded tracking link alone.
- Customer pages use `Cache-Control: no-store`, `Referrer-Policy: no-referrer`, frame protection, CSP, HSTS, MIME sniffing protection, and no third-party analytics/scripts that could receive tokens or personal data.

### Data protection and privacy

- Publish a clear collection notice explaining purpose, merchant/platform roles, channels/providers, disclosures, retention, access/correction, complaints, and overseas processing before collecting customer data.
- Maintain a data inventory and field-level retention schedule. Default to collecting no date of birth, government identifiers, or unrelated free-form personal notes.
- Mask personal data in lists and support views; reveal only when necessary for the authorised task.
- Encrypt provider credentials, bank/PayID configuration, webhook secrets, and other restricted fields using managed/envelope encryption with versioned keys and rotation. Do not place keys beside ciphertext in the database.
- Document deletion/de-identification across live data, Storage, exports, logs, archives, providers, and backups; verify third-party deletion where applicable and assess re-identification risk.
- Maintain a subprocessor register covering purpose, data category, storage/processing country, retention, contract/DPA, deletion capability, incident notification, and access controls.
- Disable payment-evidence uploads for the MVP. A customer can report payment; the merchant verifies funds in their bank. Reconsider uploads only after a documented threat/privacy review.

### Files, messaging and external input

- Product images are authenticated, size-limited, content-signature validated, decoded/re-encoded, stripped of EXIF/location metadata, renamed with server-generated identifiers, and served from a non-executable media path/domain.
- Treat email, message text, attachments, filenames, provider errors, and catalogue content as untrusted. Escape output contextually and never pass raw content into logs, HTML, SQL, shell commands, or AI prompts.
- Verify webhook signatures over the exact raw body, enforce timestamp/replay windows where supported, deduplicate provider IDs, and isolate webhook secrets per environment.
- Outbound messages prevent formula/HTML/template injection and do not expose full addresses or bank details beyond the intended recipient/channel.

### Resilience and evidence

- Backups and log archives use access credentials separate from ordinary application/support roles. Test restoration and record results.
- Archive manifests use cryptographic checksums; audit batches should be write-once/versioned where the provider supports it. Detect missing, duplicated, reordered, or altered batches.
- Security clocks use trusted UTC sources; monitor clock drift because token expiry and audit ordering depend on it.
- Dependency lockfiles, automated vulnerability/secret scanning, protected production branches, reviewed migrations/RLS, and a software inventory/SBOM are release requirements.

### Incident and Australian privacy readiness

- Maintain named security/privacy contacts and a breach register.
- Preserve evidence without copying personal data into tickets/chat.
- Assess suspected eligible breaches promptly. Where the Australian Notifiable Data Breaches scheme applies, take reasonable steps to complete the assessment within 30 calendar days, treating that as a maximum rather than a target.
- The response plan covers containment, credential/token rotation, tenant scoping, provider coordination, harm reduction, notification decision, communication, recovery, and lessons learned.

## Required security tests before pilot

1. Cross-tenant read/write/delete tests for every table, view, RPC, storage bucket, realtime subscription, export, and job.
2. Platform-owner denial tests for catalogue, customer, order, message, payment, address, and file access.
3. Support grant AAL2, scope, idle timeout, absolute expiry, revocation, suspension, and actor-attribution tests.
4. Transaction/audit hard-delete denial, including service endpoints and cascades.
5. Customer-link entropy, hashing, expiry, revocation, rate limit, caching, referrer, and sensitive-action challenge tests.
6. Authentication enumeration, brute-force, recovery, MFA reset, stale-session, and privilege-change tests.
7. CSRF, XSS, injection, open redirect, SSRF, file upload, webhook replay/signature, and mass-assignment tests.
8. Log/Telegram/exception redaction tests with seeded secrets, phone numbers, addresses, bank details, tokens, and malicious newlines.
9. Backup restoration, archive checksum/tamper detection, and privacy erasure/de-identification tests.
10. Dependency, secret, static analysis, and production security-header checks.

## Residual risks requiring owner decisions before launch

- Confirm whether the Privacy Act/APPs and NDB scheme apply to the platform and each merchant; design follows them as a prudent baseline regardless.
- Approve exact customer/order/audit retention periods with legal/accounting advice.
- Select service regions and approve overseas disclosures/subprocessors.
- Decide whether support administrators may ever view orders; the current default permits catalogue-only support.
- Decide whether merchants can add staff in MVP or only the platform owner provisions the first owner.
- Select recovery process for a merchant owner who loses all MFA factors without creating a social-engineering bypass.

## Authoritative references

- [OWASP Application Security Verification Standard 5.0](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [Supabase Multi-Factor Authentication](https://supabase.com/docs/guides/auth/auth-mfa)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase secure product configuration](https://supabase.com/docs/guides/security/product-security)
- [OAIC APP 11 — Security of personal information](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-11-app-11-security-of-personal-information)
- [OAIC Notifiable Data Breaches scheme](https://www.oaic.gov.au/privacy/notifiable-data-breaches/preventing-preparing-for-and-responding-to-data-breaches/data-breach-preparation-and-response/part-4-notifiable-data-breach-ndb-scheme)
