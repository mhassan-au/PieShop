# Codex Telegram Notifier

## Purpose

`scripts/codex-notify.ps1` sends a short one-way Telegram message when unattended local Codex work completes, fails, or needs owner intervention. It is development tooling, not application monitoring, an approval channel, or a log store.

Phase 2 is not started or authorized by this tool.

## Configuration

Copy these variables into the ignored `.env.local` file and supply values obtained from Telegram:

```dotenv
CODEX_TELEGRAM_NOTIFICATIONS=true
CODEX_TELEGRAM_BOT_TOKEN=
CODEX_TELEGRAM_CHAT_ID=
```

Never use a `NEXT_PUBLIC_` prefix. Keep the token out of Git, chat, screenshots, terminal history, logs, and browser code.

When copying the script to another repository, change only `$ProjectName` in the configuration section near the top. The destination repository must ignore its local environment file.

## Usage

Preview safely without credentials or a network request:

```powershell
npm run notify:codex -- -Status waiting -Title "Manual UI review required" -Message "Open the current Codex task for the review steps." -DryRun
```

Send after configuration:

```powershell
npm run notify:codex -- -Status completed -Title "Checks passed" -Message "The requested work is ready for review in Codex."
```

Allowed statuses are `completed`, `waiting`, `failed`, and `approval-required`.

Run its offline tests with:

```powershell
npm run test:codex-notify
```

## Security boundary

- Messages are informational. Telegram replies cannot approve or resume Codex work.
- Send no names, email addresses, phone numbers, addresses, order/catalogue content, database data, credentials, logs, stack traces, provider responses, or URLs containing tokens.
- The script normalizes control characters, limits lengths, and rejects common credential, email, phone, JWT, Telegram-token, and tokenized-URL patterns.
- Configuration absence or notification failure stops the script with a generic local error. Provider responses and credentials are not printed.
- A failed notification must not change application state or cause completed work to be rerun.
- Two-way control, automated approval, a shared service, or non-owner recipients require a separate threat model and explicit owner approval.
