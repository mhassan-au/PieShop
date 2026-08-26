# PieShop

PieShop is a mobile-first, multi-tenant order and fulfilment platform for small merchants who receive orders through WhatsApp, Messenger, SMS, email, or phone calls.

The MVP uses a Progressive Web App for merchants. Customers do not create accounts. Customer payments go directly to merchants through PayID, bank transfer, cash on delivery, or cash on pickup. The platform invoices merchants separately.

## Current status

**Part 0.1: Repository and quality pipeline** is implemented and awaiting the owner's UI/process acceptance. Part 0.2 is not authorised. See [development status](doc/DEVELOPMENT_STATUS.md).

## Documentation

- [Documentation index](doc/README.md)
- [MVP requirements](doc/MVP_PRODUCT_REQUIREMENTS.md)
- [Development roadmap](doc/DEVELOPMENT_ROADMAP.md)
- [Current development status](doc/DEVELOPMENT_STATUS.md)
- [Technical architecture](doc/TECHNICAL_ARCHITECTURE.md)
- [Data model](doc/DATA_MODEL.md)
- [Coding standards](doc/CODING_STANDARDS.md)
- [Security and privacy review](doc/SECURITY_PRIVACY_REVIEW.md)
- [Project checklists](doc/PROJECT_CHECKLISTS.md)
- [AI coding context](doc/AI_CONTEXT.md)
- [Agent instructions](AGENTS.md)

## Development method

PieShop is built in small 1–2 day parts using test-driven development:

```text
Agree examples -> failing test -> minimum implementation -> refactor
-> automated checks -> preview -> user UI/process check -> acceptance
```

Only one roadmap part is active at a time. Repeatable testing is automated; manual testing focuses on UI and process quality.

## Local setup

Install Node.js 22.18.0 and npm 10.9.3, then run:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The local defaults are safe and require no provider credentials.

## Verification

```powershell
npm run check
npm run test:e2e
```

`npm run check` runs formatting, lint, strict type checking, unit/component tests, a production build, the repository secret scan, and the high-severity dependency audit.

## Git remote

The `main` branch tracks [mhassan-au/PieShop](https://github.com/mhassan-au/PieShop.git).
