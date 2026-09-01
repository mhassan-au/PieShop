# Internal Platform-Owner Account Recovery

**Scope:** Private local development with synthetic data only  
**Owner:** Mehedi Hassan  
**Public recovery:** Prohibited

This procedure is the Part 1.1 recovery baseline. It is not approved for a real-vendor demo, real data, staging, or production. Those environments require MFA/AAL2, independent operator verification, notifications, durable security monitoring, and a separately approved recovery ceremony.

## When to use it

Use this procedure only when the manually provisioned development platform owner has lost access or its password may be compromised. Never accept a recovery request through email, SMS, chat, or an application form.

## Before changing anything

1. Confirm the Supabase project reference matches the dedicated disposable development project.
2. Confirm `APP_ENV` is `local` or `test` and the project contains synthetic data only.
3. Identify the owner through the Supabase Auth dashboard without copying its email, password, token, or user ID into chat, logs, screenshots, or this repository.
4. Stop if more than one candidate owner exists, the active `platform_owner` role is ambiguous, or the target is not the development project.

## Recovery sequence

1. In the Supabase Auth dashboard, set a new strong unique password for the confirmed owner. Do not send or store it in PieShop.
2. In the Supabase SQL editor, run one transaction that:
   - selects the confirmed Auth user ID into a local transaction value;
   - updates every non-revoked `public.application_sessions` row for that user with `revoked_at = now()` and `revoked_reason = 'recovery'`;
   - captures the affected-row count;
   - inserts one `public.audit_events` row with a null `actor_user_id`, event type `auth.recovery.completed`, target type `auth_user`, the recovered user ID as `target_id`, and safe context containing only `method: internal_dashboard` and the revoked-session count;
   - commits only if all statements succeed.
3. Do not claim the recovered user as the audit actor. Dashboard recovery happens outside an authenticated PieShop request, so the application actor is unknown.
4. Close every browser tab holding the old session and clear PieShop site data on the recovered device.

## Required verification

1. An old browser session or copied old PieShop cookie cannot open `/control`.
2. The new password can authenticate the confirmed owner and creates a new application session.
3. The session list contains the new session and shows old sessions as revoked.
4. The audit table contains `auth.recovery.completed` with UTC `occurred_at`, no claimed actor, no email/password/token/cookie, and the expected revoked count.
5. The normal secret scan and authentication test suite remain green.

Record the date, development project reference, outcome, and audit-event ID in the private operations record—not in Git if it would identify a person or account. If any verification fails, disable the Auth user and treat the event as a security incident.

## Release blocker

Before external access, replace this single-operator development procedure with a reviewed privileged-recovery runbook covering identity verification, dual control where appropriate, MFA-factor reset, user notification, provider/admin audit export, monitoring, escalation, and incident response.
