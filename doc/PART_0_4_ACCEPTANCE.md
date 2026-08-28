# Part 0.4 Acceptance Examples

## Objective

Create the Supabase Cloud development-project migration and security-test foundation for PieShop's control-plane identities and tenant isolation. Database authorization must default deny, preserve the real actor, and prevent platform roles from reading merchant content by default.

The owner accepted Part 0.3 and authorised Part 0.4 on 2026-08-27 Australia/Sydney.

## In scope

- Reproducible dedicated Supabase Cloud development/test configuration, migrations, reset, and deterministic synthetic seed data.
- Businesses, profiles, memberships, platform roles, invitations, and append-only audit events.
- Minimal merchant-content and transaction placeholders needed to prove privacy and immutability policies.
- Explicit grants, revoked defaults, Row Level Security, and database-policy test harness.
- A simple environment/health presentation using central messages; owner performs the visual check.

## Out of scope

- Staging/production Supabase projects, production credentials, deployment, or production data.
- Public merchant registration, merchant onboarding workflow, invitation acceptance, MFA UI, catalogue/order features, or support sessions.
- Service-role access from browser code or general-purpose service-role bypass helpers.
- Hard-delete paths for transactions or audit events.

## Acceptance examples

1. One controlled reset command targets only the explicitly configured disposable development/test project, applies every migration in order, and loads deterministic synthetic seed data without manual SQL edits.
2. Unauthenticated clients cannot read or write protected control-plane, tenant, audit, or transaction-placeholder records.
3. Merchant A cannot read or mutate Merchant B records even when supplying Merchant B's identifier directly.
4. A platform owner can access permitted merchant account metadata but cannot read merchant catalogue or transaction placeholders.
5. Authorization derives from protected database records and authenticated identity, not client-supplied roles, businesses, or user-editable metadata.
6. Application identities cannot update or delete audit records; permitted important mutations create attributable append-only audit events with database-generated UTC timestamps.
7. Application identities cannot hard-delete transaction placeholders or rewrite protected history fields.
8. Invitations store token hashes rather than plaintext tokens and enforce expiry, revocation, and single-use constraints.
9. Default privileges are revoked and only minimum operations protected by explicit RLS policies are granted.
10. The health screen communicates local database readiness without exposing URLs, keys, connection strings, schema contents, or personal data.

## Automated evidence required

- [x] Migration/reset test first fails and later passes.
- [x] Unauthenticated and cross-tenant denial tests first fail and later pass.
- [x] Platform-owner merchant-content denial test first fails and later passes.
- [x] Audit/transaction mutation-denial tests first fail and later pass.
- [x] Invitation hash/expiry constraints pass.
- [x] Migration lint, application checks, dependency scan, and secret scan pass.
- [ ] CI run passes.

## Owner UI/process checkpoint

The owner configures the dedicated cloud-development credentials locally, starts the application using the provided command, opens the health screen, and confirms that readiness is understandable and no credentials or private data are displayed.

Accepted by the owner on 2026-08-28 Australia/Sydney. The guarded disposable-development reset reapplied all migrations and deterministic seed data, and the post-reset cloud verification suite passed.

Part 1.1 remains unauthorised until the automated security evidence passes and the owner accepts this checkpoint.
