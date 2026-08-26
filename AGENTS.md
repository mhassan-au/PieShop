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

- Within an explicitly approved roadmap part, Codex may implement, install planned dependencies, run local development services and non-destructive checks, update documentation, create commits, and push passing checkpoint commits to `origin/main` without additional confirmation.
- Codex may continue automatically between backend-only steps within that approved part.
- Stop for owner approval at every documented UI/process checkpoint.
- Also stop before destructive or irreversible operations, staging or production changes, paid actions, transmitting credentials or personal data, changing access or security permissions, contacting external recipients, or materially expanding the approved scope.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
