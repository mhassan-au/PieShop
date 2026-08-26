# PieShop

PieShop is a mobile-first, multi-tenant order and fulfilment platform for small merchants who receive orders through WhatsApp, Messenger, SMS, email, or phone calls.

The MVP uses a Progressive Web App for merchants. Customers do not create accounts. Customer payments go directly to merchants through PayID, bank transfer, cash on delivery, or cash on pickup. The platform invoices merchants separately.

## Current status

The project is in pre-development setup. The next approved unit is **Part 0.1: Repository and quality pipeline**. See [development status](doc/DEVELOPMENT_STATUS.md).

No application framework or dependencies have been scaffolded yet.

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

Setup commands will be added during Part 0.1 after runtime and package-manager versions are selected and pinned. Do not invent setup commands before the scaffold exists.

## Git remote

The repository is initialised locally without a remote. Add the user-provided remote URL later; do not guess or create one.

