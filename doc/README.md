# PieShop MVP Documentation

PieShop is a multi-tenant, mobile-first order and fulfilment platform for small merchants who sell a limited catalogue and receive orders through conversational channels.

This folder is the source of truth for the MVP. If implementation and documentation disagree, record the decision in `DECISIONS.md` and update the affected documents in the same change.

## Document map

| Document                                                   | Purpose                                                                                 |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [MVP_PRODUCT_REQUIREMENTS.md](MVP_PRODUCT_REQUIREMENTS.md) | Product scope, actors, requirements, acceptance criteria, and exclusions                |
| [WORKFLOWS_AND_STATES.md](WORKFLOWS_AND_STATES.md)         | Customer, merchant, payment, delivery, notification, and order-state flows              |
| [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md)     | Proposed stack, system boundaries, integrations, tenancy, and deployment                |
| [DATA_MODEL.md](DATA_MODEL.md)                             | Initial entities, relationships, constraints, and data-handling rules                   |
| [CODING_STANDARDS.md](CODING_STANDARDS.md)                 | Mandatory implementation, error-handling, messaging, testing, and time standards        |
| [SECURITY_OBSERVABILITY.md](SECURITY_OBSERVABILITY.md)     | Security controls, structured logging, audit history, Telegram alerts, and retention    |
| [SECURITY_PRIVACY_REVIEW.md](SECURITY_PRIVACY_REVIEW.md)   | Security/privacy assessment, hardening baseline, required tests, and residual decisions |
| [DELIVERY_PLAN.md](DELIVERY_PLAN.md)                       | Milestones, priorities, test strategy, launch gates, and deferred work                  |
| [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md)           | TDD roadmap split into 1–2 day parts with UI acceptance gates                           |
| [PROJECT_CHECKLISTS.md](PROJECT_CHECKLISTS.md)             | Prerequisite, development-tool, MVP hosting, production hosting, and operations gates   |
| [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md)             | Current roadmap part, automated evidence, blockers, and user acceptance                 |
| [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md)       | Planned environment-variable names, classification, ownership, and introduction point   |
| [UI_MAP.md](UI_MAP.md)                                     | Initial platform, merchant, support, customer, and shared-state screen map              |
| [PART_0_1_ACCEPTANCE.md](PART_0_1_ACCEPTANCE.md)           | Test-first acceptance examples for the first development part                           |
| [PART_0_2_ACCEPTANCE.md](PART_0_2_ACCEPTANCE.md)           | Test-first acceptance examples for central messages and safe application errors         |
| [AI_CONTEXT.md](AI_CONTEXT.md)                             | Compact operating context and instructions for AI coding agents                         |
| [DECISIONS.md](DECISIONS.md)                               | Architecture and product decision log                                                   |

## Product statement

> Add products once, take orders from conversational channels, and manage payment and fulfilment in one simple app.

## MVP success test

A merchant can onboard, add a product on a phone, configure delivery and direct-payment options, receive or manually create an order, confirm customer payment, fulfil the order, and notify the customer without needing a native mobile app.

For the controlled 1–5 merchant pilot, only the platform owner provisions merchant accounts. Platform administration is privacy-preserving by default; merchant catalogue and transaction data is available to support administrators only through an explicit, scoped, expiring, audited merchant support grant. Transaction and audit history cannot be hard-deleted by any application role.
