# PieShop Agent Policy

## Start every implementation request with classification

Before acting, classify the request using `doc/WORKFLOW_CLASSIFICATION.md` and begin with one concise line:

> **Classification:** UI change · Economy mode · Low risk — proceeding with targeted checks.

If a listed approval trigger applies, explain it briefly and wait. Otherwise proceed without asking. Do not require reading every Markdown file: inspect affected symbols/files first, then read only the documents routed by the classification.

## Always-applicable project rules

- Preserve user work, keep changes scoped, and work only within the current authorised roadmap part recorded in `doc/DEVELOPMENT_STATUS.md`.
- Follow TDD for behaviour changes: agree acceptance examples, observe a relevant failure where practical, implement the minimum behaviour, refactor while green, and record evidence. Do not advance a part until automated checks pass and the owner accepts its UI/process checkpoint.
- `doc/` is the product source of truth. Record material product, security, privacy, data, provider, or architecture decisions in `doc/DECISIONS.md` and update affected documents in the same change.
- Update `doc/DEVELOPMENT_STATUS.md` with completed evidence and owner acceptance; never mark work complete speculatively. If implementation conflicts with documented requirements, stop and surface the conflict.
- Use migrations for database changes and include RLS/authorization tests. Enforce authorization on the server and in database policy, never only in UI, middleware, client state, user metadata, or stale token claims.
- Use central typed messages/errors, structured redacted logging, UTC instants, IANA merchant timezones, and integer minor-unit money. Do not use direct `console.log` outside the logger or local tooling.
- Keep provider SDKs behind adapters. Validate external input and webhook signatures, use idempotency, and preserve the real actor in append-only audit events.
- Never expose secrets, tokens, complete bank details, personal/production data, or service-role credentials in source, tests, logs, alerts, URLs, or browser bundles. Credentials belong only in ignored local environment files or provider dashboards, never chat.
- For Next.js code, read the relevant installed guide under `node_modules/next/dist/docs/` first; this repository’s Next.js version may differ from prior conventions.

## Product and security boundaries

- The platform owner provisions the initial 1–5 merchants; no public merchant signup or implicit account creation.
- Platform administration is metadata-only. The owner cannot view merchant catalogue or transactions by default.
- Support access must be merchant-granted, scoped, expiring, revocable, visibly disclosed, use the support actor’s own identity, and be fully audited. Never add hidden impersonation.
- Customers have no accounts. Every order requires a valid phone number; delivery requires an address and deliverability decision.
- Customer funds go directly to merchants through approved manual methods. The platform never holds customer funds, and `payment_submitted` is not `paid` until merchant verification.
- Never add payment-evidence uploads or hard-delete paths for orders, payments, histories, billable events, invoices, or audit events without a new approved product and threat-model decision.
- Preserve tenant isolation, transaction immutability, support-grant scope, merchant privacy, and real actor identity.
- Complete or refresh the phase threat model before each phase. Authentication, authorization, RLS, support, payments, external providers, and deployment changes retain dedicated security acceptance gates.
- The current no-MFA authentication design is restricted to private synthetic development. MFA/AAL2 and stronger session controls are mandatory before any real-vendor demo, real data, staging pilot, or production use.

## Approval and escalation

Proceed automatically for clear, in-scope low- and medium-risk work and ordinary testing. Ask first only when:

- a routine request unexpectedly requires Release mode;
- existing data may be deleted, replaced, or irreversibly migrated;
- a production dependency, permission, backend/service, or recurring cost is introduced;
- work crosses a locked product/security boundary;
- the safe solution is materially broader than requested; or
- materially different product choices need an owner decision.

UI presentation-only work stays Economy. UI connected to stored data or business logic becomes Standard. Database, migration, scheduling, and persistence work is Standard. Permissions, native manifests, authentication, analytics, cloud services, dependencies, and releases are Release.

Stop before destructive/irreversible operations, staging or production changes, paid actions, transmitting credentials or personal data, changing access/security permissions, or contacting external recipients. Never infer those approvals.

## Verification and collaboration

- Use the checks routed by `doc/WORKFLOW_CLASSIFICATION.md`; do not run the full application suite for documentation-only changes.
- Bundle related inspection and verification, search for affected symbols before opening large files, and do not reread unchanged files in the same logical task.
- Keep progress updates concise but report changed files, architecture/security implications, failures, and evidence.
- Manual owner review is for visual quality, wording, usability, and browser/device judgement—not repeatable rule testing.
- Git staging, commits, and pushes are owner-operated by default. Codex may do them only when the owner explicitly requests it or explicitly activates quick mode. A break returns to the owner-operated default.
- At a completed milestone, state `Milestone achieved` and provide only the remaining owner commands in one PowerShell block.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
