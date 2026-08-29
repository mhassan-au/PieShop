# Codex Workflow Classification

Use this routing policy before every implementation request. It keeps context and verification proportional while preserving PieShop’s roadmap, TDD, privacy, and security gates.

## Classification line

Start with one short line:

> **Classification:** Bug fix · Economy mode · Low risk — proceeding with targeted checks.

State the approval trigger instead and wait only when approval is required.

## Execution modes

### Economy

For isolated, reversible work within one boundary. Search for affected symbols, inspect only affected files and routed documents, then run TypeScript/compilation where relevant plus targeted lint and tests.

Typical verification:

- Documentation only: `npx prettier --check <changed-markdown-files>` and `git diff --check`.
- TypeScript code: `npm run typecheck`, targeted ESLint, and targeted Vitest files.
- UI presentation: targeted component tests plus owner visual review when meaningful.

### Standard

For features, connected behaviour, scheduling, persistence, database work, or changes crossing multiple application boundaries. Read the routed domain/architecture documents and run all checks relevant to the affected flow.

Typical verification includes targeted tests during TDD, then `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, applicable Supabase checks, and relevant Playwright scenarios. Run `npm run build` when routing, rendering, server/client boundaries, or deployment output changed.

### Release

For authentication, permissions, native/platform configuration, analytics, cloud services, dependencies, security controls, production builds, deployment, or release readiness. Read the active threat model and security/release documents, honour dedicated acceptance gates, and run full relevant builds and audits.

Typical verification includes `npm run check`, `npm run test:e2e`, relevant Supabase schema/security/hardening checks, configuration/authorization matrices, and provider-specific validation. Never target staging or production, spend money, change permissions, or transmit real data without explicit approval.

## Change-type routing

“Approval” below means extra approval beyond a clear request and the current authorised roadmap part.

| Change type                        | Default mode                                                                              | Risk        | Documents to read                                                                                                                                                                                          | Relevant verification                                                                                                    | Approval                                                                                                                                                                                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bug fix                            | Economy; Standard if cross-boundary or persistent                                         | Low–medium  | `doc/DEVELOPMENT_STATUS.md`; affected acceptance/domain document; `doc/CODING_STANDARDS.md` for code                                                                                                       | Reproduce with failing test; typecheck; targeted lint/tests; broader regression checks if connected                      | No when cause and fix are in scope; yes if escalation trigger applies                                                                                                                                                                         |
| UI change                          | Economy presentation-only; Standard for business logic/stored data                        | Low–medium  | `doc/DEVELOPMENT_STATUS.md`, `doc/UI_MAP.md`; relevant requirements/workflow section                                                                                                                       | Typecheck; targeted lint/component tests; visual/accessibility checkpoint; relevant E2E if flow changes                  | No unless it changes product behaviour or crosses a locked boundary                                                                                                                                                                           |
| New feature                        | Standard                                                                                  | Medium      | `doc/DEVELOPMENT_STATUS.md`, current part of `doc/DEVELOPMENT_ROADMAP.md`, relevant acceptance file, `doc/MVP_PRODUCT_REQUIREMENTS.md`; architecture/data/security docs as affected                        | TDD; complete relevant unit/component/integration/E2E checks; build when boundaries change                               | No when clearly in the authorised part; yes for scope expansion or materially different choices                                                                                                                                               |
| Feature change                     | Standard                                                                                  | Medium      | Same routing as new feature plus `doc/DECISIONS.md` when a recorded decision may change                                                                                                                    | TDD and full relevant regression flow; update affected docs                                                              | No when intent is clear and in scope; yes for material product/security trade-offs                                                                                                                                                            |
| Scheduling/database or persistence | Standard; Release if production, permissions, destructive migration, or new cloud service | Medium–high | `doc/DEVELOPMENT_STATUS.md`, current roadmap/acceptance, `doc/DATA_MODEL.md`, `doc/TECHNICAL_ARCHITECTURE.md`, `doc/CODING_STANDARDS.md`, applicable threat model                                          | Migration dry run; schema, RLS/authorization, idempotency/concurrency and rollback tests; relevant quality checks        | No for additive reversible development work; yes for deletion/replacement, irreversible migration, production, permissions, cost, or service introduction                                                                                     |
| Documentation/copy                 | Economy                                                                                   | Low         | Affected document and its source-of-truth document; central message catalogue for application copy                                                                                                         | Markdown formatting and `git diff --check`; targeted catalogue tests for runtime copy                                    | No unless documentation makes a material product/security decision requiring owner choice                                                                                                                                                     |
| Future idea/brainstorm             | Economy; no implementation                                                                | Low         | Only directly relevant product/roadmap documents when needed                                                                                                                                               | Consistency review; no application tests                                                                                 | No for analysis/recording; yes before broadening MVP or implementation scope                                                                                                                                                                  |
| Release/security/permissions       | Release                                                                                   | High        | `doc/DEVELOPMENT_STATUS.md`, `doc/PROJECT_CHECKLISTS.md`, `doc/SECURITY_PRIVACY_REVIEW.md`, `doc/SECURITY_OBSERVABILITY.md`, applicable architecture/data docs, active threat model and `doc/DECISIONS.md` | `npm run check`, E2E, dependency/secret audits, applicable Supabase and authorization tests, build/deployment validation | Required for permission/access changes, external/production actions, new dependencies/services/costs, real data, or unresolved residual risk; ordinary requested local security coding needs no redundant approval after its gate is accepted |

## Documentation router

Read the smallest relevant set; do not read every Markdown file by default.

- Always inspect `doc/DEVELOPMENT_STATUS.md` for implementation work to identify the authorised part and gate.
- Product/UI behaviour: relevant sections of `doc/MVP_PRODUCT_REQUIREMENTS.md`, `doc/WORKFLOWS_AND_STATES.md`, and `doc/UI_MAP.md`.
- Backend/integration: relevant sections of `doc/TECHNICAL_ARCHITECTURE.md`, `doc/DATA_MODEL.md`, and `doc/CODING_STANDARDS.md`.
- Logging/security: `doc/SECURITY_OBSERVABILITY.md`, `doc/SECURITY_PRIVACY_REVIEW.md`, and the applicable coding-standard sections.
- Threat/security boundary: `doc/THREAT_MODELING_STANDARD.md` and the active `doc/PHASE_N_THREAT_MODEL.md`.
- Environment/release/operations: `doc/ENVIRONMENT_VARIABLES.md`, `doc/PROJECT_CHECKLISTS.md`, and relevant architecture/security sections.
- Material decision: inspect and update `doc/DECISIONS.md` plus affected source-of-truth documents.
- Next.js implementation: relevant installed documentation under `node_modules/next/dist/docs/`.

Use `doc/AI_CONTEXT.md` only when the task spans several product areas or the relevant boundary is unclear; it is not mandatory for every isolated task.

## Approval policy

Proceed automatically for clear low- and medium-risk work within the authorised roadmap part. Do not request approval for ordinary in-scope coding, TDD, non-destructive development migrations, or verification.

Ask before proceeding when:

- a routine request unexpectedly requires Release mode;
- existing data may be deleted, replaced, or irreversibly migrated;
- a production dependency, permission, backend/cloud service, or recurring cost is introduced;
- work crosses a locked product or security boundary;
- the safe implementation is materially broader than requested; or
- multiple product choices have significantly different outcomes.

An explicitly requested Release-mode task still follows its dedicated project gate. Do not ask twice when the exact consequential action is already clearly authorised, but stop at any later external, destructive, paid, permission, real-data, staging, or production action not covered by that approval.

## Automatic escalation

- UI-only presentation changes remain Economy.
- UI changes affecting stored data or business rules become Standard.
- Database, migration, scheduling, and persistence work uses Standard.
- Production/destructive database changes escalate to Release and require approval.
- Permissions, native manifests, authentication, analytics, cloud services, security dependencies, and store/releases use Release.
- A change touching authentication, authorization, RLS, support access, payments, restricted data, external providers, or deployment must satisfy its active threat-model and acceptance gate.

## Context-saving rules

- Search for affected symbols before opening large files.
- Read only documentation routed by the classification.
- Do not reread files already read in the same logical task unless they changed.
- Use targeted tests for Economy work.
- Bundle related inspections and checks where practical.
- Prefer file sections and focused searches over dumping whole large documents.
- Keep classification and progress messages concise.
- Do not start the local server or browser review unless acceptance requires it, the owner asks, or diagnosis cannot proceed without it.
- Do not run the application test suite for documentation-only changes.
