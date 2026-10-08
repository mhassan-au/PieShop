# SH-4 Design — Merchant Settings Integrity

## Purpose

SH-4 closes the remaining S06 settings-lifecycle gaps before catalogue work begins. It makes settings provisioning, authorization, validation, locking, versioning, acknowledgement, and auditing one coherent database transaction while preserving the accepted Part 2.1 tenant and privacy boundaries.

This part does not broaden merchant roles, add multi-business selection, expose settings to platform roles, introduce real vendor data, or weaken the private-development MFA/AAL2 release gate.

## Current evidence

- Migration `20261008010000_provision_merchant_settings.sql` now backfills missing settings rows and provisions a row after every business insert. The browser repair proved this closes the create-after-migration rendering failure.
- The current update RPC evaluates some nullable SQL inputs through three-valued comparisons, so required `NULL` values are not rejected consistently with the application domain.
- Authorization is resolved before row locks. A concurrent suspension can therefore change business/session eligibility while an update waits and then continues without a locked recheck.
- The current helper counts only businesses matching the supplied session. It does not enforce the accepted Part 2.1 requirement that the authenticated identity have exactly one eligible active merchant-owner membership overall.
- The update RPC returns the complete settings row. The repository accepts additional acknowledgement fields and maps every provider failure, including optimistic conflicts, to one generic response.
- The rollback-safe live settings harness covers 17 authorization, persistence, and isolation assertions, but it uses one database connection and therefore does not prove suspension/update race behavior.

## Accepted boundary proposed for SH-4

### Settings lifecycle

1. Keep the existing private insert trigger and migration backfill as the only automatic provisioning paths. The trigger remains inaccessible to application roles.
2. The hardened update must require an existing settings row after authorization and locking. If the invariant is unexpectedly missing, it fails before changing `businesses` or writing a success audit. Forward migration backfill is the safe recovery path.
3. No settings, business, audit, membership, or session row is deleted or replaced by SH-4.

### Tenant and role resolution

4. The authenticated provider user must have exactly one active `merchant_owner` membership whose business is `onboarding` or `active`. Multiple eligible owner memberships fail closed; SH-4 adds no business selector.
5. The supplied opaque PieShop session hash must identify that same user and same business, remain unrevoked, and remain inside its absolute lifetime.
6. Merchant staff, platform owners, users without a membership, anonymous callers, cross-tenant hashes, malformed hashes, suspended/archived businesses, and expired/revoked sessions remain denied.

### Validation and atomic mutation

7. SQL rejects every required `NULL` explicitly before normalization. Business name, normalized lowercase email, E.164 phone, `AUD`, `Australia/Sydney`, and positive integer version follow the same bounds as the typed domain layer.
8. The transaction uses one lock order: resolve the candidate from the caller-bound session, lock the business row, then recheck business status, exactly-one owner membership, exact session validity, and finally lock the settings row. Status/session changes use the business as the serialization boundary.
9. If suspension obtains the business lock first, the waiting settings update observes suspended/revoked state and makes no mutation or audit. If a valid settings update obtains it first, that update commits atomically before suspension proceeds; suspension then revokes the session. No partial business-only update is allowed.
10. An identical retry is idempotent even when it carries the prior version: it returns the current acknowledgement and writes no second audit. A different stale update fails with a stable conflict classification and changes nothing.
11. A successful logical update changes the business and settings rows together, increments the settings version once, uses one UTC database timestamp, and appends exactly one audit event attributed to the real merchant actor.

### Output, errors, and privacy

12. The update RPC returns only `business_id`, `version`, and `updated_at`. The repository rejects missing or additional acknowledgement fields.
13. The database uses a stable conflict SQLSTATE that the repository maps to a typed conflict result. The server action uses centralized safe conflict copy; all other provider/validation failures remain generic.
14. Contact values never appear in audit context, structured logs, thrown public errors, conflict messages, URLs, test names, or notifications. Audit context contains only changed field names and the resulting version.
15. Direct settings-table privileges stay revoked for `public`, `anon`, and `authenticated`; only the narrowly granted read/update RPCs remain callable by `authenticated`.
16. Platform metadata remains unable to reveal settings values. SH-4 changes no owner-control query or support-access boundary.

## Acceptance examples

1. **Provision after migration** — Creating a business automatically creates exactly one default settings row in the same transaction; rollback removes both.
2. **Historical missing-row repair** — The forward migration backfills a missing settings row without overwriting an existing row.
3. **Missing invariant during update** — If an authorized business lacks its settings row, update fails without changing the business name and without a success audit.
4. **Valid read and save** — The sole active merchant owner with the exact live session reads, saves, and reads back normalized settings; version increments once.
5. **Required NULLs** — Each required RPC argument supplied as `NULL` is denied atomically, including name, email, phone, currency, timezone, version, and session hash.
6. **Domain parity** — Invalid/control-character name, malformed email/phone, unsupported currency/timezone, malformed hash, and non-positive version are denied without mutation.
7. **Cross-tenant substitution** — One merchant cannot read or update another merchant by supplying the other session hash or any client tenant identifier.
8. **Role denials** — Merchant staff, platform owner, authenticated user without membership, and anonymous caller cannot read or update settings.
9. **Session denials** — Missing, expired, or revoked exact application sessions cannot read or update settings.
10. **Business-state denials** — Suspended or archived merchants cannot read or update settings even when the provider session remains valid.
11. **Exactly-one membership** — A user with two eligible active merchant-owner memberships fails closed even when the supplied session belongs to one of them.
12. **Identical retry** — Repeating the same logical update with the original version returns the current acknowledgement and retains one audit event.
13. **Stale conflict** — A different update using a stale version returns centralized conflict feedback and leaves values, version, and audit count unchanged.
14. **Successful audit privacy** — One successful update produces one real-actor audit containing only changed field names and resulting version; contact values are absent.
15. **Suspension wins the race** — With two connections and deterministic barriers, suspension holding the business lock causes the waiting settings update to deny after recheck with no settings audit.
16. **Update wins the race** — With two connections and deterministic barriers, a valid update holding the business lock commits both rows and one audit before suspension proceeds and revokes the session; no partial state appears.

## TDD and verification plan

1. Add failing migration-contract, repository-result, action-message, and guarded live SQL expectations before implementation.
2. Prepare one forward-only migration that replaces the effective helper/RPC definitions without editing historical migrations or deleting data.
3. Extend the guarded live harness for NULL/domain parity, missing-row atomicity, exactly-one membership, strict acknowledgement, audit privacy, and two-connection race cases. Synthetic fixtures must be isolated and rolled back or explicitly cleaned by their deterministic test design.
4. Run focused tests, TypeScript, lint, formatting, migration dry-run, schema/hardening/foundation/owner/SH-3/settings database gates, the complete application suite, production build, secret scan, and production dependency audit.
5. Apply the reviewed migration only to the guarded synthetic development Supabase target, rerun every applicable gate, then request one grouped merchant settings UI/process checkpoint.

## Owner gate

Acceptance of this design and all 16 examples authorizes local TDD implementation, the reviewed non-destructive migration, guarded synthetic-development application, automated verification, commits, and pushes under active quick mode. It does not authorize staging/production, real vendor or customer data, destructive migration, MFA/AAL2 deferral, multi-business selection, or broader merchant/support access.
