# Environment Variable Catalogue

This is the planned environment-variable inventory. It contains names and handling rules only—never real values.

Variables are introduced only when their roadmap part is implemented. Validate required values at startup/build boundaries and maintain separate local, test, staging, and production values.

## Classification

- **Public:** Safe for browser bundles when explicitly designed as public.
- **Server secret:** Server-only credential or key.
- **Restricted:** High-impact secret requiring limited access, rotation, and audited handling.
- **Operational:** Non-secret behaviour/configuration value.

## Foundation

| Variable       | Classification | Purpose                                                                | Introduced |
| -------------- | -------------- | ---------------------------------------------------------------------- | ---------- |
| `APP_ENV`      | Operational    | `local`, `test`, `staging`, or `production`                            | Part 0.1   |
| `APP_BASE_URL` | Operational    | Canonical application origin                                           | Part 0.1   |
| `LOG_LEVEL`    | Operational    | Structured logger threshold                                            | Part 0.3   |
| `DEBUG_MODE`   | Operational    | Explicit local/staging debug behaviour; false in production by default | Part 0.3   |

## Supabase

| Variable                               | Classification | Purpose                                             | Introduced |
| -------------------------------------- | -------------- | --------------------------------------------------- | ---------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Public         | Supabase project API URL                            | Part 0.4   |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public         | Browser publishable key protected by RLS            | Part 0.4   |
| `SUPABASE_DB_URL`                      | Restricted     | Migration/controlled server database connection     | Part 0.4   |
| `SUPABASE_SECRET_KEY`                  | Restricted     | Narrow server/job administration only; bypasses RLS | Part 1.2   |

## Security and encryption

| Variable                       | Classification | Purpose                                                       | Introduced |
| ------------------------------ | -------------- | ------------------------------------------------------------- | ---------- |
| `FIELD_ENCRYPTION_KEY_ID`      | Operational    | Active managed key identifier/version, not key material       | Part 3.1   |
| `FIELD_ENCRYPTION_PROVIDER_*`  | Restricted     | Provider-specific managed encryption credentials if required  | Part 3.1   |
| `FIELD_LOOKUP_HMAC_KEY_ID`     | Operational    | Active blind-index key identifier/version, not key material   | Part 3.1   |
| `FIELD_LOOKUP_HMAC_PROVIDER_*` | Restricted     | Managed blind-index key credentials, separate from encryption | Part 3.1   |
| `CRON_JOB_SECRET`              | Server secret  | Authenticates scheduled internal jobs                         | Part 5.3   |

## Observability

| Variable                   | Classification | Purpose                                                          | Introduced |
| -------------------------- | -------------- | ---------------------------------------------------------------- | ---------- |
| `SENTRY_DSN`               | Server secret  | Server exception/event destination                               | Part 0.3   |
| `NEXT_PUBLIC_SENTRY_DSN`   | Public         | Browser error destination configured to avoid sensitive payloads | Part 0.3   |
| `TELEGRAM_ALERT_BOT_TOKEN` | Restricted     | Critical-alert bot authentication                                | Part 0.3   |
| `TELEGRAM_ALERT_CHAT_ID`   | Server secret  | Environment-specific alert destination                           | Part 0.3   |

## Email and web push

| Variable                       | Classification | Purpose                              | Introduced |
| ------------------------------ | -------------- | ------------------------------------ | ---------- |
| `RESEND_API_KEY`               | Restricted     | Outbound transactional email         | Part 5.4   |
| `EMAIL_FROM_ADDRESS`           | Operational    | Verified environment-specific sender | Part 5.4   |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public         | Web Push subscription public key     | Part 5.4   |
| `VAPID_PRIVATE_KEY`            | Restricted     | Web Push signing key                 | Part 5.4   |
| `VAPID_SUBJECT`                | Operational    | Web Push contact URI/email           | Part 5.4   |

## WhatsApp

| Variable                       | Classification | Purpose                                       | Introduced |
| ------------------------------ | -------------- | --------------------------------------------- | ---------- |
| `META_APP_SECRET`              | Restricted     | WhatsApp webhook signature verification       | Part 7.2   |
| `META_WEBHOOK_VERIFY_TOKEN`    | Server secret  | Meta webhook setup challenge                  | Part 7.2   |
| `WHATSAPP_ACCESS_TOKEN`        | Restricted     | WhatsApp Cloud API authentication             | Part 7.2   |
| `WHATSAPP_PHONE_NUMBER_ID`     | Server secret  | Environment-specific sending number reference | Part 7.2   |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Server secret  | Business account reference                    | Part 7.2   |

## Later channels

Twilio, inbound email, and Messenger variables will be specified when those staged channel increments begin. Do not add unused credentials early.

## Handling checklist

- [ ] `.env.example` contains variable names/placeholders only.
- [ ] Test/local values cannot contact real customers.
- [ ] Preview builds never inherit production secrets.
- [ ] Server secrets are never prefixed `NEXT_PUBLIC_`.
- [ ] Secret values are redacted from logs, errors, Telegram, CI, screenshots, and support UI.
- [ ] Ownership, rotation interval, last rotation, and recovery location are tracked outside Git.
- [ ] Removing a provider also removes/revokes its variables and credentials.
