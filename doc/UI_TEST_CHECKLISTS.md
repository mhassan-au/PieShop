# Milestone UI Test Checklists

These are owner-run visual and usability checks at the end of each development milestone. Automated tests remain responsible for repeatable validation, authorization, tenancy, security, state, money, time, and persistence rules.

## How to use this document

1. Codex completes the milestone’s automated quality gate and supplies the local URL, required synthetic setup, and applicable checklist section.
2. The owner tests with synthetic data only and records pass/fail plus concise observations.
3. Failures become acceptance examples and receive automated coverage where practical.
4. `doc/DEVELOPMENT_STATUS.md` records the owner result before the next roadmap part is authorised.

Never paste credentials, tokens, personal information, real merchant/customer data, or screenshots containing them into chat or issue reports.

## Checklist required for every UI milestone

### Viewports and stability

- [ ] Phone portrait at approximately 390 × 844: no horizontal scrolling, clipped controls, overlapping text, or unreachable actions.
- [ ] Desktop at approximately 1280 × 800: content remains readable, balanced, and does not become unnecessarily wide.
- [ ] Browser zoom at 200%: primary content and actions remain usable without two-dimensional scrolling.
- [ ] Refresh and browser Back/Forward produce understandable states without duplicated submissions.
- [ ] No visible layout jump makes the user lose their place during loading or completion.

### Comprehension and interaction

- [ ] The page purpose and primary action are clear without developer knowledge.
- [ ] Labels and instructions use plain language and match the action performed.
- [ ] Primary, secondary, dangerous, and disabled actions are visually distinguishable.
- [ ] Loading prevents accidental repeat submission and communicates progress.
- [ ] Empty, success, validation, recoverable-error, and unexpected-error states are understandable where applicable.
- [ ] Confirmations describe the consequence before sensitive or destructive actions.
- [ ] No internal identifiers, stack traces, provider messages, secrets, tokens, complete bank details, or unnecessary personal data are visible.

### Keyboard and accessibility

- [ ] All interactive controls are reachable in a logical order using Tab and Shift+Tab.
- [ ] Focus is clearly visible and moves to the most useful location after navigation, validation, dialogs, and completion.
- [ ] Enter/Space activates controls as expected; Escape closes dismissible overlays without losing work.
- [ ] Every input has a persistent accessible label; errors are associated with the affected input and announced.
- [ ] Headings form a meaningful hierarchy and landmarks make the main content easy to find.
- [ ] Status is not communicated by colour alone, and text remains readable in light/dark system settings where supported.

### Privacy and trust

- [ ] The screen exposes only information required for the current actor and task.
- [ ] Sensitive values are masked or omitted where full values are unnecessary.
- [ ] Signed-out, expired, revoked, suspended, or forbidden states do not briefly reveal protected content.
- [ ] Support access, elevated context, or irreversible consequences are visibly disclosed whenever applicable.
- [ ] Browser console shows no unexpected errors during the reviewed flow.

## Part 1.1 — Platform-owner login and sessions

### Setup

- [ ] Use only the manually provisioned synthetic platform-owner account.
- [ ] Open the supplied local URL in a normal desktop browser and a phone-sized browser viewport.
- [ ] Keep credentials in the local browser/provider dashboard only; do not record or share them.

### Sign-in screen

- [ ] The screen clearly says “Platform owner sign in” and does not offer signup, registration, merchant login, or password recovery.
- [ ] Email and Password fields have persistent labels, appropriate input types/autocomplete, and usable touch targets.
- [ ] Password characters are not visible by default.
- [ ] Empty/malformed input produces clear central validation wording without echoing the password.
- [ ] Unknown email and wrong password show the same generic wording and visual treatment.
- [ ] Repeated failed attempts show a calm retry-later message without revealing whether the account exists.
- [ ] The submit button communicates loading and cannot accidentally submit twice.

### Successful access

- [ ] Valid credentials open the platform control-plane shell without flashing protected content beforehand.
- [ ] The shell identifies the platform context but shows no merchant catalogue, orders, customers, messages, addresses, payments, bank details, or transactions.
- [ ] Refresh keeps a valid session, while a signed-out or revoked browser returns to sign-in.
- [ ] Unsafe/external return destinations never navigate outside PieShop.

### Sessions and logout

- [ ] The active-session view shows safe device/session metadata only and never tokens or raw opaque identifiers.
- [ ] The owner can distinguish the current session from other synthetic sessions.
- [ ] Revoking another session gives an understandable confirmation/result and that browser loses access on its next request.
- [ ] Repeating a revocation does not create a confusing or contradictory state.
- [ ] Logout clears access, returns to sign-in, and Back does not reveal protected content.
- [ ] Expired and revoked sessions explain that sign-in is required without exposing internal reasons or provider errors.

### Part 1.1 acceptance record

```text
Date/time (Australia/Sydney):
Desktop browser and viewport:
Phone browser/viewport:
Shared checklist: Pass / Fail
Part 1.1 checklist: Pass / Fail
Console errors: None / Details
Usability or wording observations:
Screenshots stored privately (optional; no credentials/personal data):
Owner decision: Accept / Corrections required
```

## Part 1.3 — Development invitation preview

### Setup

- Use synthetic merchant names and reserved `.test` email addresses only.
- Keep `APP_ENV=local`; no email provider is configured or contacted.

### Primary flow

- [ ] A draft or revoked onboarding merchant shows **Create preview link** and the development-only disclosure.
- [ ] Creating a preview changes status to **Invitation issued**, shows a one-time link, and offers **Revoke invitation**.
- [ ] Opening the preview shows only the expected business name, UTC expiry, and the notice that no account was created.
- [ ] Returning to the control page and revoking changes status to **Invitation revoked** with clear confirmation.

### Alternate and privacy states

- [ ] A malformed, expired, superseded, or revoked preview URL shows the same generic unavailable message.
- [ ] Repeated issue inside the cooldown fails safely without exposing provider/database details.
- [ ] No recipient email, token hash, Auth identifier, catalogue, transaction, payment, bank, customer, or order data appears.
- [ ] Keyboard focus, phone-width layout, pending states, and browser console are acceptable.

### Deferred provider flow

- [ ] Real email delivery, recipient authentication, atomic redemption, and 30-day merchant-session review remain blocked until a provider and Supabase redirect configuration are approved.

### Part 1.3 preview acceptance record

```text
Date/time (Australia/Sydney):
Desktop browser and viewport:
Phone browser/viewport:
Shared checklist: Pass / Fail
Part 1.3 preview checklist: Pass / Fail
Console errors: None / Details
Usability or wording observations:
Owner decision: Accept / Corrections required
```

## Template for each future milestone

Add a section when its acceptance contract is prepared:

```markdown
## Part N.N — Milestone name

### Setup

- [ ] Synthetic accounts/data and starting state are specified.

### Primary flow

- [ ] The milestone’s user-check flow completes on phone and desktop.

### Alternate states

- [ ] Empty, loading, validation, success, recoverable error, forbidden/expired, and retry states relevant to this milestone are reviewed.

### Privacy and permissions

- [ ] The actor sees only allowed data and no protected content flashes during redirects or errors.

### Acceptance record

- Date, environments, shared-checklist result, milestone result, observations, and owner decision.
```
