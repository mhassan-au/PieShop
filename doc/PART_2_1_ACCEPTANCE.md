# Part 2.1 Acceptance — Merchant Shell and Setup Checklist

**Owner:** Mehedi Hassan  
**Scope:** Private synthetic development only  
**Status:** Acceptance examples approved for TDD implementation by Mehedi Hassan on 2026-09-06 Australia/Sydney

## Locked scope

- Build the protected, mobile-first merchant shell with `Today`, `Orders`, `Catalogue`, and `Settings` navigation. Unimplemented destinations use clear, non-deceptive empty/coming-next states rather than exposing incomplete operations.
- Persist tenant-owned business name, fixed business currency, validated IANA timezone, and synthetic business contact email/phone settings.
- Store and derive a resumable setup checklist from authoritative tenant data. The browser cannot submit its own completion percentage or mark protected steps complete directly.
- Only a freshly authenticated merchant owner with an active membership, active/onboarding business, and live PieShop application session may read or change Part 2.1 settings.
- Future staff roles are denied settings mutation until a separately accepted capability grants it. Platform roles have no merchant shell, settings, contact-value, or setup-state access.
- Every query and mutation derives `business_id` from the current authenticated actor at the server/database boundary. Client-supplied tenant identifiers are rejected or ignored.
- Merchant pages and action responses are private/no-store. Contact values, tenant identifiers, provider details, and session material do not enter URLs, logs, audit payloads, Telegram, or public errors.
- All settings input uses strict allow-lists, bounded normalization, canonical UTC where an instant is needed, and central typed feedback through the app-owned dialog system.
- Currency uses a supported ISO 4217 code and cannot diverge across merchant settings. Money values remain integer minor units when introduced later.
- Phase 2 remains synthetic-only. Delivery zones, pickup addresses, payment instructions, products, images, support access, public preview, real contacts, and real vendor data are not Part 2.1.

## Acceptance examples

1. Anonymous users and sessions with missing, malformed, expired, or revoked PieShop credentials are redirected to merchant login without reading merchant data.
2. A valid Supabase identity without exactly one active merchant membership cannot enter the shell or call its settings RPCs.
3. Suspended or archived businesses cannot enter the shell or read/update settings even if provider cookies remain valid.
4. A merchant owner sees only their current business settings and setup state; changing any client tenant identifier cannot read or mutate another business.
5. Platform owners, support administrators without a future grant, and future staff without an explicit settings capability receive equivalent denials from direct database/RPC calls.
6. Cross-tenant foreign references and direct table access are rejected by grants, constraints, and RLS—not only by the UI or server action.
7. The shell provides accessible phone-sized navigation for `Today`, `Orders`, `Catalogue`, and `Settings`, with a visible current destination and usable keyboard/focus behavior.
8. Unimplemented destinations state their status safely and expose no fake counts, actions, customer data, or platform-control links.
9. Setup progress is derived from stored valid fields, is deterministic, never accepts a browser-supplied percentage, and resumes after logout/login or browser restart.
10. Business name and contact inputs enforce trimming, Unicode/control-character policy, length bounds, valid email/E.164 formats, and reject unknown or mass-assigned fields.
11. Currency accepts only the supported business currency and timezone accepts only a canonical supported IANA zone; invalid or contradictory updates are atomic failures.
12. A repeated identical settings mutation is idempotent and does not create duplicate audit outcomes; a stale concurrent update returns safe conflict feedback instead of overwriting newer data.
13. Successful mutations audit the real merchant actor, business target, changed field names, and safe outcome—never old/new contact values or other merchant content.
14. Protected pages and mutations enforce trusted-origin/POST controls and private/no-store headers; errors, redirects, URLs, logs, and Telegram contain no contact values or provider internals.
15. The UI uses centralized PieShop dialogs for validation, success, warning, and failure feedback and never invokes browser-native `alert`, `confirm`, or `prompt`.
16. Existing owner-control metadata queries remain unable to infer setup field values or merchant content; they may receive only the already approved coarse onboarding progress metadata.

## Required evidence

- TDD begins with failing policy, setup-state, validation, migration, authorization, repository, action, component, privacy, and navigation tests.
- The database migration uses tenant-bound constraints, revoked defaults, narrow RPC grants, RLS, optimistic concurrency, idempotent audit behavior, and direct hostile-role tests.
- Targeted checks pass during each slice; the complete relevant check, Supabase schema/hardening/security checks, and production build pass before the owner UI checkpoint.
- Applying the reviewed migration to development Supabase requires a separate explicit owner authorization.
- Mehedi Hassan completes, leaves, resumes, and edits the synthetic setup flow on a phone-sized screen and accepts the UI/process checkpoint.
