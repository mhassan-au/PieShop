# Part 0.2 Acceptance Examples

## Objective

Create one typed source for user-facing copy and one safe error contract for browser and API failures. Internal diagnostic details must never cross the public boundary.

The owner authorised this part on 2026-08-27 Australia/Sydney after accepting Part 0.1.

## In scope

- Typed `en-AU` message catalogue.
- Compile-time message keys and parameter shapes.
- Runtime validation for missing, unexpected, or unsupported parameters.
- Typed `AppError` with stable codes and HTTP status mapping.
- Standard public API error envelope with a reference ID.
- App Router error boundary and a friendly reusable fallback.
- Responsive copy-review screen covering validation, confirmation, success, and failure wording.

## Out of scope

- Structured application logging, Sentry, Telegram alerts, or log archives.
- Supabase, authentication, merchants, catalogue, orders, or payments.
- Real notifications, confirmations, mutations, or provider calls.
- Translation management or additional locales.

## Acceptance examples

### A1: Typed messages

Given application code requests a message, then only known keys and the exact parameter shape for that key compile. Static messages require no parameter object.

### A2: Safe formatting

Given a parameterised message, when it is formatted, then every declared placeholder is replaced exactly as text. Missing, unexpected, object, or unsupported parameter values fail with a safe developer error that does not echo the value.

### A3: Safe expected errors

Given a known `AppError`, when it crosses an API boundary, then the envelope contains only its public code, centrally formatted message, reference ID, and appropriate HTTP status.

### A4: Safe unexpected errors

Given an unknown exception containing a secret, internal cause, or stack, when it crosses the public boundary, then the response uses the generic central message and code. It contains none of the exception message, cause, stack, or secret.

### A5: Stable envelope

Every public error response has this shape:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Enter a valid phone number.",
    "referenceId": "err_example"
  }
}
```

### A6: Browser fallback

Given a route render fails, when the App Router boundary is shown, then it displays friendly central copy, a non-sensitive reference ID, and a keyboard-accessible recovery action. It never renders the original error message or stack.

### A7: Copy-review screen

Given phone and desktop widths, when the foundation page opens, then sample validation, confirmation, success, and failure states are readable without horizontal overflow. The page clearly states that these are demonstrations rather than live product actions.

## Automated evidence required

- [x] Message tests first failed and later passed.
- [x] Error-envelope tests first failed and later passed.
- [x] Error-fallback component test first failed and later passed.
- [x] Formatting, lint, type check, unit/component tests, and build passed.
- [x] Desktop and mobile browser tests passed without console errors or horizontal overflow.
- [x] Dependency and secret scans passed.
- [ ] CI run passed.

## Owner UI/process checkpoint

The owner reviews the sample screen and confirms:

- Validation wording is direct and helpful.
- Confirmation wording makes the pending action clear.
- Success wording states what happened and what follows.
- Failure wording avoids technical detail and gives a useful recovery action.
- The reference ID is understandable as support information.

Part 0.3 remains unauthorised until these checks pass and the owner accepts Part 0.2.
