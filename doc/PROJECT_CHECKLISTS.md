# PieShop Project Checklists

These checklists are operational gates. Check an item only when evidence exists, such as a recorded decision, screenshot, test result, configuration export, runbook, invoice, restore report, or named owner.

Do not place passwords, tokens, recovery codes, customer information, or complete bank details in this document or the repository.

## 1. Prerequisite checklist

### 1.1 Product and pilot decisions

- [ ] Confirm the MVP product name and working domain name.
- [ ] Confirm the initial operating country, currency, and default timezone.
- [ ] Identify the first 1–5 pilot merchants.
- [ ] Identify one primary contact and one merchant owner for each pilot merchant.
- [ ] Confirm that merchant self-sign-up remains disabled.
- [ ] Confirm that the platform owner creates merchants and sends invitations.
- [ ] Confirm whether merchants can add their own staff during MVP.
- [ ] Confirm that support access remains catalogue-only by default.
- [ ] Decide whether support administrators may ever view orders during MVP.
- [ ] Confirm PayID, bank transfer, cash on delivery, and cash on pickup as the only MVP payment methods.
- [ ] Confirm that payment evidence/receipt uploads remain disabled.
- [ ] Confirm postcode-based delivery zones for MVP.
- [ ] Confirm WhatsApp as the first live conversational channel.
- [ ] Confirm the sequence for SMS, inbound email, and Messenger.
- [ ] Approve the initial platform fee model and invoice cycle.
- [ ] Define measurable pilot success and stop/go criteria.

### 1.2 Ownership and contacts

- [ ] Name the product owner and final product decision-maker.
- [ ] Name the primary developer and code reviewer.
- [ ] Name the production deployment approver.
- [ ] Name the security incident lead and backup contact.
- [ ] Name the privacy/customer-request contact.
- [ ] Name the merchant-support contact and support hours.
- [ ] Name the billing/invoice owner.
- [ ] Record provider escalation contacts and account owners.
- [ ] Store the contact register outside the public repository.

### 1.3 Business, legal, and privacy preparation

- [ ] Confirm business entity, ABN, invoicing identity, and business contact details.
- [ ] Obtain Australian legal/privacy advice on Privacy Act, APP, Spam Act, telecommunications, consumer, tax-record, and NDB applicability.
- [ ] Draft platform terms with merchant/platform responsibilities.
- [ ] Draft merchant support-access terms and acceptable-use rules.
- [ ] Draft customer privacy/collection notice.
- [ ] Draft merchant privacy and data-processing terms.
- [ ] Draft acceptable-use and prohibited-products policy if required.
- [ ] Approve customer access, correction, opt-out, complaint, deletion, and de-identification process.
- [ ] Approve a field-level data-retention schedule.
- [ ] Document which transaction information must be retained and for how long.
- [ ] Document backup/archive deletion or “beyond use” treatment.
- [ ] Create a subprocessor register including country/region, purpose, data, retention, deletion, and breach notification.
- [ ] Review cross-border disclosures and service regions.
- [ ] Create a Notifiable Data Breach assessment and communication runbook.
- [ ] Confirm insurance needs, including professional and cyber insurance.

### 1.4 Security decisions

- [ ] Approve OWASP ASVS 5.0 Level 2 as the MVP security verification target.
- [ ] Select privileged MFA factors and secure lost-factor recovery process.
- [ ] Confirm support grant default of four hours and maximum of 24 hours.
- [ ] Confirm support-session idle timeout of 15 minutes.
- [ ] Approve session idle and absolute timeouts for each role.
- [ ] Select restricted-field encryption/key-management approach.
- [ ] Approve backup frequency, retention, recovery point objective, and recovery time objective.
- [ ] Approve application, security, audit, and archive retention periods.
- [ ] Define severity levels and Telegram escalation thresholds.
- [ ] Define production access approval and emergency-access process.
- [ ] Perform initial threat modelling and record accepted/residual risks.

### 1.5 Provider and account prerequisites

- [ ] Create a dedicated company-controlled email address for provider ownership.
- [ ] Use a password manager and individual named accounts; do not share credentials.
- [ ] Enable MFA on domain registrar, email, source control, Vercel, Supabase, Meta, Twilio, Resend, Sentry, Telegram, and any DNS/CDN account.
- [ ] Store recovery codes in a secure location separate from the primary factor.
- [ ] Register the domain under the business, not a developer’s personal account.
- [ ] Create a source-control organisation/repository under business control.
- [ ] Create separate provider projects/accounts for staging and production where supported.
- [ ] Create the Meta Business account and start WhatsApp business verification early.
- [ ] Reserve/test the intended WhatsApp business number.
- [ ] Create Twilio only when the SMS milestone approaches.
- [ ] Select inbound email provider only when the email milestone approaches.
- [ ] Create Resend and authenticate a non-production sending domain/subdomain.
- [ ] Create a private Telegram channel and dedicated alert bot for non-production.
- [ ] Define who owns provider billing and spending alerts.

Prerequisite gate:

- [ ] Product, legal/privacy, security, ownership, and account decisions required for Phase 0 are complete.
- [ ] Unknown decisions are documented with owner and due date; none silently block the first roadmap part.

## 2. Development tools checklist

### 2.1 Workstation

- [ ] Supported operating system is patched.
- [ ] Full-disk encryption is enabled.
- [ ] Automatic screen lock is enabled.
- [ ] Endpoint protection is active.
- [ ] Separate non-administrator daily user is used where practical.
- [ ] Git is installed and identity is configured correctly.
- [ ] Current supported Node.js LTS is installed through a version manager.
- [ ] Package manager and version are pinned in the repository.
- [ ] Supabase CLI is installed and pinned/recorded.
- [ ] Docker-compatible local runtime is installed for local Supabase.
- [ ] A supported code editor is installed.
- [ ] Browser developer tools are available for Chrome/Edge, Firefox, and Safari/iOS testing access.
- [ ] Password manager and MFA authenticator are available.

### 2.2 Repository foundation

- [ ] Repository default branch is protected.
- [ ] Pull requests and at least one review are required for production-bound changes.
- [ ] Force-push and direct production-branch commits are restricted.
- [ ] `.gitignore` covers environment files, local databases, logs, test artifacts, and credentials.
- [ ] `.env.example` contains names/descriptions but no real secrets.
- [ ] Runtime and package-manager versions are pinned.
- [ ] Lockfile is committed.
- [ ] Contribution/setup instructions are documented.
- [ ] Architecture and AI context documents are linked from the repository root.
- [ ] Dependency update policy and ownership are defined.

### 2.3 Application and quality tools

- [ ] Next.js and strict TypeScript are configured.
- [ ] Tailwind CSS and the selected accessible component system are configured.
- [ ] Formatter is configured and enforced.
- [ ] Linter is configured with TypeScript, React, accessibility, and security-relevant rules.
- [ ] Unit/component test runner is configured.
- [ ] Browser end-to-end test runner is configured.
- [ ] Accessibility testing is included in component/end-to-end tests.
- [ ] Visual regression support is configured for stable high-value pages when designs settle.
- [ ] Coverage reporting is configured by risk area, not as a vanity percentage alone.
- [ ] Tests can control time, IDs, jobs, and provider responses.
- [ ] Deterministic seed/factory data is available.
- [ ] Tests never require production credentials or data.

### 2.4 Local backend and data

- [ ] Local Supabase starts from repository-controlled configuration/migrations.
- [ ] Database migration command is documented.
- [ ] Database reset/seed command is documented.
- [ ] RLS/authorization test harness is configured.
- [ ] Separate test database/data isolation strategy is configured.
- [ ] Storage policies are reproducible locally.
- [ ] Local email/message/push providers are fake or captured safely.
- [ ] No local test sends a real customer message.
- [ ] Database types/schema are generated in CI and drift is detected.

### 2.5 Security and observability tools

- [ ] Secret scanning runs locally/pre-commit and in CI.
- [ ] Dependency vulnerability scanning runs in CI.
- [ ] Static application security scanning is configured.
- [ ] Structured logger and redaction tests are configured.
- [ ] Sentry development/staging project is configured without sensitive payload collection.
- [ ] Telegram development alert channel/bot is configured and redaction tested.
- [ ] Security-header tests are configured.
- [ ] Software inventory/SBOM generation is configured before pilot release.
- [ ] Threat-model template and security-review checklist are available.

### 2.6 Continuous integration

- [ ] Formatting check runs on every pull request.
- [ ] Lint runs on every pull request.
- [ ] Type checking runs on every pull request.
- [ ] Unit/component tests run on every pull request.
- [ ] Database/RLS integration tests run on every relevant pull request.
- [ ] End-to-end smoke tests run on preview/staging.
- [ ] Security and secret scans run on every pull request.
- [ ] Migration/RLS changes require explicit review.
- [ ] Failed checks prevent merge.
- [ ] CI logs and test artifacts contain no secrets or personal data.

Development-tool gate:

- [ ] A fresh workstation can clone, configure, start, test, reset, and build the project using documented commands.
- [ ] A deliberate test failure blocks CI and no production credentials are required.

## 3. MVP/pilot hosting checklist

MVP hosting means a controlled pilot environment for the initial merchants. It still contains real personal and order data, so it must not be treated as an insecure demo.

### 3.1 Environment separation

- [ ] Local, preview, staging, and MVP/pilot production are clearly named and separated.
- [ ] MVP/pilot uses its own Supabase project and Vercel project.
- [ ] Development/staging credentials cannot access MVP data.
- [ ] MVP credentials cannot be used in preview builds.
- [ ] Provider test and live credentials are separated.
- [ ] Test merchants/orders are visibly marked and cannot contact real customers accidentally.

### 3.2 Domain, DNS, and transport

- [ ] MVP domain/subdomain is selected and owned by the business.
- [ ] DNS access is restricted and MFA protected.
- [ ] HTTPS is enforced.
- [ ] HSTS and required security headers pass automated checks.
- [ ] Cookie scope/domain/path are reviewed.
- [ ] Customer token pages use no-store/no-referrer and no third-party scripts.
- [ ] Sender domains have SPF, DKIM, and DMARC configured appropriately.

### 3.3 Vercel application hosting

- [ ] Vercel project is business-owned with named individual access.
- [ ] Production branch and deployment permissions are restricted.
- [ ] Environment variables are entered through the secret manager, not committed.
- [ ] Preview environments do not inherit production secrets.
- [ ] Deployment region is selected and documented.
- [ ] Function/runtime limits and webhook response deadlines are understood.
- [ ] Scheduled jobs and background processing do not rely on ephemeral local files.
- [ ] Health/readiness endpoint is deployed without exposing sensitive internals.
- [ ] Rollback to a known prior deployment is tested.
- [ ] Spending and usage alerts are configured.

### 3.4 Supabase hosting

- [ ] Supabase project is business-owned and region is approved.
- [ ] Organisation/project MFA is enforced.
- [ ] Database password and service credentials are securely stored.
- [ ] Default grants are revoked and all exposed tables have tested RLS.
- [ ] Views/functions/RPCs, Storage, and Realtime authorization are tested.
- [ ] Service-role use is isolated to named server modules/jobs.
- [ ] Database migrations are applied by controlled deployment, not manual dashboard edits.
- [ ] Private Storage buckets and policies are created separately by purpose.
- [ ] Product-image upload controls are enabled.
- [ ] Payment evidence bucket/upload is absent.
- [ ] Restricted fields use approved versioned encryption.
- [ ] Backup schedule and retention meet the approved pilot target.
- [ ] One restoration exercise is completed before real merchant onboarding.
- [ ] Database/storage usage and spending alerts are configured.

### 3.5 Authentication and access

- [ ] Public merchant sign-up is disabled.
- [ ] Only the platform owner provisioning endpoint can create merchants.
- [ ] Platform owner, support admin, and merchant owner require MFA/AAL2.
- [ ] Step-up authentication is enforced for sensitive actions.
- [ ] Invitation and recovery redirects are exact allowlisted URLs.
- [ ] Session idle/absolute timeouts are configured and tested.
- [ ] Account recovery/factor reset procedure is tested and audited.
- [ ] Support grants/sessions enforce scope, expiry, idle timeout, and revocation.
- [ ] Platform owner cannot self-grant merchant-content access.
- [ ] Active-session listing and revocation work.

### 3.6 Messaging, notifications, and external providers

- [ ] Resend sending domain is verified and production recipients are controlled.
- [ ] Web Push VAPID/private key is stored securely and rotated/tested as planned.
- [ ] Meta application/business/WhatsApp test/live setup is documented.
- [ ] Webhook URLs use HTTPS and signature verification over raw bodies.
- [ ] Webhook secrets are unique per environment.
- [ ] Replay, duplicate, malformed, and oversized webhook tests pass.
- [ ] Provider rate limits, templates, opt-out/help requirements, and retry behaviour are documented.
- [ ] Telegram production/pilot alert bot posts only sanitised test alerts.
- [ ] Provider outage does not roll back or lose orders.
- [ ] External usage/spending alerts are configured.

### 3.7 Logging, monitoring, and recovery

- [ ] Sentry project is separated from development and configured to minimise/redact personal data.
- [ ] Application/security/audit logs use structured schema and UTC.
- [ ] Debug mode is off by default in MVP hosting.
- [ ] Daily immutable log archive job is configured.
- [ ] Archive checksums/manifests and tamper alerts are tested.
- [ ] Archive/backup credentials are separated from application/support roles.
- [ ] Telegram critical alert routing and deduplication are tested.
- [ ] Queue age, job failures, webhook lag, notification delivery, auth failures, and error rate are monitored.
- [ ] Clock synchronisation/drift is monitored where applicable.
- [ ] Incident and restore runbooks are accessible during an outage.

### 3.8 Pilot privacy and readiness

- [ ] Privacy/collection notice is available at data collection points.
- [ ] Merchant terms and support-access terms are accepted and versioned.
- [ ] Subprocessor/region register is current.
- [ ] Retention/de-identification jobs are configured or scheduled with named owner.
- [ ] Privacy request process is tested with seeded data.
- [ ] Data export excludes other tenants and unnecessary sensitive fields.
- [ ] Pilot merchants receive onboarding, support, privacy, and security guidance.
- [ ] Pilot launch and rollback criteria are documented.
- [ ] Complete manual-order and WhatsApp sandbox/live-test flows pass.

MVP hosting gate:

- [ ] All automated launch checks pass.
- [ ] Backup restoration, support revocation, privacy request, and incident alert have been exercised.
- [ ] Product owner accepts the complete UI/process flow.
- [ ] Known pilot risks have owners, mitigations, and review dates.

## 4. Production hosting checklist

Use this gate before expanding beyond the controlled pilot or treating availability/support as a production commitment.

### 4.1 Governance and production access

- [ ] Production environment has named business owner and technical owner.
- [ ] Production access is least-privilege, individually assigned, MFA protected, and reviewed regularly.
- [ ] No shared production accounts exist.
- [ ] Support administrators have no infrastructure/database access by default.
- [ ] Emergency/break-glass process is documented, time limited, alerted, and audited.
- [ ] Provider ownership is recoverable by the business if a developer is unavailable.
- [ ] Joiner/mover/leaver process revokes access promptly.
- [ ] Quarterly access review is scheduled.

### 4.2 Production architecture and capacity

- [ ] Production region/data residency is approved.
- [ ] Capacity assumptions and limits are documented for merchants, orders, messages, storage, jobs, and connections.
- [ ] Load tests cover peak order and webhook bursts without real providers/customers.
- [ ] Database indexes and slow-query monitoring are reviewed.
- [ ] Connection pooling and concurrency are configured.
- [ ] Queues/jobs have back-pressure and dead-letter handling.
- [ ] Rate limits are set by endpoint, tenant, user, token, and provider risk.
- [ ] External-provider timeouts/circuit breakers are tested.
- [ ] Single points of failure and provider dependencies are documented.
- [ ] Scaling thresholds and cost alerts are defined.

### 4.3 Deployment and change control

- [ ] Production deployments require successful CI, review, and approval.
- [ ] Build artifacts are reproducible and traceable to a commit.
- [ ] Production does not build from unreviewed local code.
- [ ] Database changes follow expand/migrate/contract where required.
- [ ] Migration backup and rollback/roll-forward plan is documented.
- [ ] Feature flags protect incomplete channels and risky changes.
- [ ] Deployment smoke and critical-flow tests run automatically.
- [ ] Rollback is tested periodically.
- [ ] Change record includes risk, tests, migration, monitoring, and rollback.

### 4.4 Security assurance

- [ ] OWASP ASVS 5.0 Level 2 checklist is complete with evidence/exceptions.
- [ ] Threat model is updated for production architecture and all enabled channels.
- [ ] Independent penetration test or qualified security review is completed before material scale.
- [ ] Critical/high findings are resolved or formally accepted with expiry.
- [ ] Dependency, secret, static, dynamic, and configuration scans pass.
- [ ] SBOM/software inventory and vulnerability response owner exist.
- [ ] Security headers and TLS configuration are externally verified.
- [ ] RLS/authorization matrix covers every table/view/RPC/Storage/Realtime route.
- [ ] Service-role and privileged database operations receive dedicated review.
- [ ] Key/secret rotation is tested and scheduled.
- [ ] Customer token/recovery/brute-force protections are load/security tested.

### 4.5 Availability, backup, and disaster recovery

- [ ] Production SLOs and support commitments are defined.
- [ ] RPO and RTO are approved and measurable.
- [ ] Automated backups cover database, Storage references/configuration, code, infrastructure configuration, and required provider configuration.
- [ ] Backups are encrypted, access-separated, and protected against ordinary administrator/application deletion.
- [ ] Restore tests are scheduled and results retained.
- [ ] Disaster-recovery scenario and communications are exercised.
- [ ] Provider outage/degradation modes are defined for each channel.
- [ ] Data reconciliation process exists after queue/provider recovery.
- [ ] Status communication channel/page is available if the application is unavailable.

### 4.6 Monitoring and incident response

- [ ] Dashboards cover availability, latency, errors, authentication, authorization denial, queues, webhooks, notifications, storage, database, and costs.
- [ ] Alert thresholds have owners, severity, escalation path, and runbook.
- [ ] On-call coverage and acknowledgement expectations are defined.
- [ ] Alerts are tested periodically, including Telegram failure.
- [ ] Security/privacy incident register is maintained.
- [ ] Forensic logs are time-synchronised, access-controlled, redacted, and tamper-evident.
- [ ] NDB assessment workflow and 30-calendar-day maximum are documented where applicable.
- [ ] Provider breach notification paths and contractual timeframes are recorded.
- [ ] Incident tabletop exercises occur at least annually and after major architectural change.

### 4.7 Privacy and lifecycle

- [ ] Current privacy notices, terms, consent/opt-out text, and subprocessor list are published.
- [ ] Each collected field has documented purpose and retention.
- [ ] Data minimisation review is completed for every new feature/channel.
- [ ] Access/correction/deletion/de-identification requests have response targets and evidence.
- [ ] De-identification re-identification risk is tested.
- [ ] Retention applies to caches, exports, temporary files, logs, archives, providers, and backups.
- [ ] Merchant offboarding export, access revocation, retention, and deletion process is tested.
- [ ] Provider termination includes verified data deletion where required.
- [ ] AI use of production/customer data is prohibited unless separately approved and disclosed.

Production hosting gate:

- [ ] Security, privacy, reliability, capacity, recovery, operations, and legal gates have named approval.
- [ ] No unresolved critical vulnerability or unknown tenant-isolation risk remains.
- [ ] Production rollback and disaster recovery have been exercised.
- [ ] Operational team can run the service without direct developer database intervention.

## 5. Operations checklist

### 5.1 Every merchant onboarding

- [ ] Verify merchant identity and authorised owner contact.
- [ ] Create merchant metadata without viewing merchant business content.
- [ ] Send single-use expiring owner invitation.
- [ ] Confirm merchant owner enrols MFA.
- [ ] Confirm timezone, currency, contact, pickup, delivery, and payment settings.
- [ ] Confirm privacy/terms/support-access acceptance versions.
- [ ] Add at least one product and complete a test order.
- [ ] Test merchant push/email notification.
- [ ] Confirm WhatsApp/channel connection health where enabled.
- [ ] Confirm merchant understands `payment_submitted` versus `paid`.
- [ ] Confirm support process and how to revoke support access.
- [ ] Record onboarding completion without recording catalogue/order content in platform notes.

### 5.2 Daily operations

- [ ] Review critical/fatal alerts and acknowledge incidents.
- [ ] Review failed/dead-letter jobs and notification/webhook failures.
- [ ] Check application, database, auth, queue, and provider health.
- [ ] Check backup/archive job completion and tamper alerts.
- [ ] Review unusual authentication, authorization denial, support, export, and payment-state events.
- [ ] Respond to merchant support within the stated support window.
- [ ] Use merchant-granted support session only when necessary; verify scope/expiry/banner.
- [ ] Exit support session immediately after work and record outcome without unnecessary personal data.
- [ ] Never troubleshoot by copying production customer data to chat, email, tickets, or local files.

### 5.3 Weekly operations

- [ ] Review error trends, queue age, notification success, webhook lag, and provider limits.
- [ ] Review active/stale support grants and sessions.
- [ ] Review new platform/support accounts and privilege changes.
- [ ] Review storage/database usage and projected costs.
- [ ] Review merchant onboarding progress and unresolved support issues.
- [ ] Verify retention/privacy jobs and failed actions.
- [ ] Review vulnerability/dependency alerts and prioritise updates.
- [ ] Reconcile sample completed-order counts against billing ledger.
- [ ] Test one non-destructive alert path or operational runbook step.

### 5.4 Monthly billing operations

- [ ] Close merchant billing periods in merchant timezone/approved billing rules.
- [ ] Verify completed/collected billable events are unique.
- [ ] Exclude drafts, cancellations, rejections, and failed payments.
- [ ] Apply subscription/cap/rate snapshot accurately.
- [ ] Generate privacy-safe invoice summary without merchant product/order content.
- [ ] Send invoice externally and record invoice number, date, amount, due date, and status.
- [ ] Reconcile paid/overdue platform invoices.
- [ ] Notify merchant using central approved templates.
- [ ] Audit adjustments; never rewrite/delete original billing events.

### 5.5 Monthly security and privacy operations

- [ ] Review privileged and provider account access.
- [ ] Review MFA status and stale sessions.
- [ ] Review support grants, sensitive reads, exports, denials, and suspicious patterns.
- [ ] Review dependency/SBOM vulnerability status.
- [ ] Review secret/key age and upcoming rotations.
- [ ] Review subprocessor/service changes and region notices.
- [ ] Review privacy requests and response targets.
- [ ] Verify retention/de-identification completion and exceptions.
- [ ] Review incident/breach register and corrective actions.
- [ ] Sample log/Telegram records for redaction quality.
- [ ] Confirm no production data entered test environments.

### 5.6 Quarterly operations

- [ ] Complete user/provider/infrastructure access review.
- [ ] Test backup restoration and record RPO/RTO results.
- [ ] Test support grant/revocation and account suspension.
- [ ] Test customer token expiry/revocation and recovery controls.
- [ ] Review threat model and top residual risks.
- [ ] Review retention schedule and data inventory.
- [ ] Rotate scheduled secrets/keys according to policy.
- [ ] Review capacity, performance, availability, and cost trends.
- [ ] Review merchant feedback and approve/reject scope changes.
- [ ] Confirm documentation/runbooks match the running system.

### 5.7 Annual or major-change operations

- [ ] Conduct penetration/security assessment.
- [ ] Run security/privacy incident tabletop exercise.
- [ ] Run disaster-recovery exercise.
- [ ] Review legal/privacy terms, notices, APP/NDB applicability, and subprocessors.
- [ ] Review insurance and provider contracts.
- [ ] Review ASVS evidence and accepted exceptions.
- [ ] Review all data categories for deletion/de-identification opportunities.
- [ ] Train platform/support personnel on privacy, social engineering, and support access.

### 5.8 Merchant offboarding

- [ ] Verify authorised offboarding request.
- [ ] Suspend new orders/channel intake at agreed time.
- [ ] Revoke merchant users, sessions, support grants, provider tokens, push subscriptions, and integrations.
- [ ] Provide approved export through a short-lived secure link after step-up verification.
- [ ] Preserve immutable transaction/billing/audit information only as required.
- [ ] Delete/de-identify other personal/business data according to retention policy.
- [ ] Apply deletion to Storage, exports, providers, logs/archives/backups as policy requires.
- [ ] Record provider deletion verification and retention exceptions.
- [ ] Close billing and record final invoice status.
- [ ] Audit completion without placing merchant content in platform notes.

### 5.9 Incident response

- [ ] Open incident record with UTC timestamp, severity, owner, and safe reference.
- [ ] Contain access or provider impact without destroying evidence.
- [ ] Revoke/rotate affected sessions, tokens, secrets, or keys.
- [ ] Determine affected merchants, people, data, locations, providers, and time range.
- [ ] Preserve relevant sanitised/tamper-evident evidence.
- [ ] Contact affected providers and legal/privacy advisers.
- [ ] Begin harm reduction and merchant/customer communications as appropriate.
- [ ] Assess NDB eligibility promptly and within applicable maximum timeframe.
- [ ] Recover, reconcile data/jobs/messages, and validate security before reopening.
- [ ] Document root cause, timeline, decisions, notifications, and corrective actions.
- [ ] Add regression/security tests and update threat model/runbooks.

