# PieShop Agent Instructions

## Required reading

Before making changes, read:

1. `doc/AI_CONTEXT.md`
2. `doc/DEVELOPMENT_STATUS.md`
3. The current part in `doc/DEVELOPMENT_ROADMAP.md`
4. The topic documents referenced by `doc/AI_CONTEXT.md`

The documentation in `doc/` is the source of truth. Record material product, security, privacy, data, provider, or architecture decisions in `doc/DECISIONS.md` and update affected documents in the same change.

## Development method

- Work on only the current approved roadmap part.
- Agree or confirm acceptance examples before implementation.
- Follow TDD: observe a relevant test fail, implement the smallest behaviour that passes, then refactor while green.
- Run all checks required by the current part and report evidence.
- Do not advance the roadmap status until automated checks pass and the user accepts the UI/process checkpoint.
- Manual testing is for visual quality, wording, usability, and device/browser judgement—not repeatable business-rule regression.

## Non-negotiable safeguards

- Preserve tenant isolation, real actor identity, support-grant scope, transaction immutability, and merchant privacy.
- Do not add public merchant sign-up, hidden impersonation, payment evidence uploads, transaction hard-delete paths, or platform-held customer funds.
- Use central messages, typed errors, structured/redacted logging, UTC instants, IANA merchant timezones, and integer minor-unit money.
- Never expose secrets, tokens, complete bank details, personal data, production data, or service-role credentials in source, tests, logs, alerts, or browser bundles.
- Enforce authorization in server/database policy rather than UI alone.
- Keep provider SDKs outside domain code and validate all external input/webhook signatures.

## Change discipline

- Preserve user work and keep changes focused.
- Use migrations for database changes and add RLS/authorization tests in the same change.
- Update `doc/DEVELOPMENT_STATUS.md` with evidence and user acceptance; do not mark work complete speculatively.
- If implementation conflicts with documented requirements, stop and surface the conflict.

## Standing workflow authorisation

- Within an explicitly approved roadmap part, Codex may implement, install planned dependencies, run local development services and non-destructive checks, and update documentation without additional confirmation.
- In slow mode, Git staging, commits, and pushes are owner-operated. In quick mode, Codex may stage, commit, and push a passing approved checkpoint to `origin/main`.
- Codex may continue automatically between backend-only steps within that approved part.
- Stop for owner approval at every documented UI/process checkpoint.
- Also stop before destructive or irreversible operations, staging or production changes, paid actions, transmitting credentials or personal data, changing access or security permissions, contacting external recipients, or materially expanding the approved scope.

## Token-efficient collaboration

### Workflow modes

- **Slow mode (default):** Codex runs and explains focused tests, cloud integration tests, full quality gates, and browser checks while keeping the owner informed about files, architecture, security, and results. Git staging, commits, and pushes remain owner-operated using commands supplied by Codex.
- **Quick mode (explicit opt-in):** When the owner says to use quick mode, Codex runs tests and approved development-only migration/seed commands, completes documentation, stages changes, commits, and pushes passing checkpoints. Quick mode never broadens product scope or overrides the safeguards and approval boundaries in this file.
- A mode remains active until the owner explicitly switches modes or says `break`. After `break`, revert to slow mode unless the owner selects quick mode again.
- Current owner selection: **Quick mode**, active from 2026-08-28 until the owner says `break` or requests slow mode.

- Default to giving the owner an `Owner Actions` checklist for work they can perform cheaply: starting/stopping the local server, opening the local URL, desktop/mobile visual review, wording/usability review, checking browser-console errors, confirming GitHub Actions, creating provider accounts, and configuring dashboard environment-variable names.
- Do not start a local development server or perform automated browser review unless the owner asks, the current acceptance contract requires automated browser evidence, or diagnosis cannot reasonably proceed without it.
- The owner supplies credentials only through local environment files or provider dashboards, never through chat. Stop if a task would expose or transmit credentials or personal data.
- During TDD, run focused tests as needed. Run formatting, lint, strict type checking, the complete automated suite, production build, dependency audit, secret scan, and end-to-end suite once at the end of an approved batch unless a failure or material cross-cutting change requires another run.
- Combine closely related roadmap parts only when the owner explicitly approves the complete batch. Security-sensitive boundaries such as authentication, RLS/tenant isolation, support access, payments, and production deployment retain their dedicated acceptance gates.
- Within an approved batch, continue through backend-only steps and consolidate documentation updates and the final quality gate. Prefer one owner UI/process review and one correction round at the batch boundary, then provide one grouped set of Git commands for the owner.
- Keep progress updates compact. Report material decisions, blockers, failed checks, and final evidence; avoid repeating established context.
- Before the final commit when owner testing is required, provide a concise checklist containing the exact command, URL, scenarios, and expected results. Treat the owner's reported visual/CI results as checkpoint evidence and record them in `doc/DEVELOPMENT_STATUS.md`.
- At the end of a completed milestone, state `Milestone achieved` clearly, then render the necessary owner commands in one copyable PowerShell code block. Include only commands the owner still needs to run, ordered safely, including Git staging, commit, and push when applicable.
- In slow mode, Codex announces each meaningful test batch before running it, explains what it verifies and the expected result, and reports failures and security implications promptly. The owner is not required to run tests unless Codex cannot access the relevant local/provider environment or explicitly asks for independent confirmation.
- Codex may run narrowly focused tests to observe TDD red, diagnose failures, verify corrections, and complete routine green, cloud, build, browser, and quality-gate checks. Owner-reported results remain valid evidence when the owner runs a check independently.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
