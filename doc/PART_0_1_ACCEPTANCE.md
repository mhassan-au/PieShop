# Part 0.1 Acceptance Examples

## Objective

Create a reproducible Next.js/TypeScript foundation with pinned tooling, automated quality checks, isolated configuration, and a real-browser smoke test.

These examples are proposed and require user confirmation before application scaffolding begins.

## In scope

- Select and pin supported Node.js LTS and package manager.
- Scaffold Next.js with strict TypeScript.
- Configure Tailwind and the initial accessible component foundation.
- Configure formatting, linting, unit/component tests, browser end-to-end tests, and CI.
- Add validated environment configuration for local/test/staging/production boundaries.
- Add dependency and secret scanning.
- Provide a minimal responsive application shell with no product features.
- Document exact setup, test, build, and local-run commands.

## Out of scope

- Supabase project/schema/authentication.
- Merchant, catalogue, order, or payment UI.
- Central message/error infrastructure beyond the smallest placeholder needed by the shell.
- Provider integrations, PWA push, Sentry, Telegram, or deployment.
- Final branding or visual design.

## Acceptance examples

### A1: Fresh setup

Given a supported clean workstation with prerequisites installed, when a developer follows the README, then dependencies install from the committed lockfile and the application starts without undocumented manual steps.

### A2: Strict configuration

Given a required configuration value is missing or invalid, when the relevant server/build boundary starts, then it fails with a clear safe configuration error and does not print secrets.

### A3: Environment separation

Given test or preview mode, when configuration loads, then production-only credentials are neither required nor available and no real customer contact can occur.

### A4: Quality gate

Given a deliberate formatting, lint, type, unit-test, or build failure, when CI runs, then the corresponding job fails and merge is blocked by the configured policy.

### A5: Test-first proof

Given the initial smoke behaviour does not exist, the developer first runs a relevant failing test, then implements the smallest shell that makes it pass, and records the red/green evidence in `DEVELOPMENT_STATUS.md`.

### A6: Browser smoke test

Given the application is running, when the automated browser opens the root page, then it displays the PieShop shell and a stable accessible page heading without browser console errors.

### A7: Responsive shell

Given phone and desktop viewport sizes, when the root page renders, then the layout remains readable without horizontal scrolling and primary content is keyboard reachable.

### A8: No premature product behaviour

Given the foundation is complete, when the application is inspected, then it contains no fake merchant sign-up, product, order, payment, support, or provider behaviour that lacks its roadmap tests.

### A9: Safe repository

Given automated secret/dependency scans run, then committed fixtures/configuration contain no known credentials or production personal data, and `.gitignore` excludes local secrets and generated artifacts.

### A10: Reproducible commands

The repository documents and CI uses consistent commands for:

- Install.
- Development server.
- Format check.
- Lint.
- Type check.
- Unit/component tests.
- Browser smoke test.
- Build.
- Security/secret checks.

## Automated evidence required

- [ ] Configuration test initially failed and later passed.
- [ ] Browser smoke test initially failed and later passed.
- [ ] Formatting check passed.
- [ ] Lint passed.
- [ ] Type check passed.
- [ ] Unit/component tests passed.
- [ ] Browser smoke test passed.
- [ ] Build passed.
- [ ] Dependency scan passed or findings were documented and accepted.
- [ ] Secret scan passed.
- [ ] CI run passed.

## User UI/process checkpoint

The user opens the shell at phone and desktop sizes and confirms:

- The initial visual direction is acceptable for a foundation.
- Text is readable and spacing feels reasonable.
- The application identity is clearly PieShop.
- There is no misleading unfinished product functionality.
- The developer setup/verification process is understandable.

Part 0.2 remains unauthorised until these checks pass and the user accepts Part 0.1.

