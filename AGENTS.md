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

