# Part 0.3 Acceptance Examples

## Objective

Create privacy-first structured observability that is useful to humans and future anomaly analysis without exposing secrets or unnecessary personal data. Critical alerts must be asynchronous and must never break the original application operation.

The owner authorised this part on 2026-08-27 Australia/Sydney after accepting Part 0.2.

## In scope

- Central structured logger with `debug`, `info`, `warn`, `error`, and `fatal` levels.
- Configuration-controlled debug output and deterministic UTC timestamps.
- Request/reference/trace correlation fields and schema-versioned JSON events.
- Recursive key/value redaction for credentials, tokens, passwords, phone numbers, addresses, bank details, PayID values, cookies, and message bodies.
- JSON-safe handling of newline/control-character log injection.
- Sink abstraction, local console sink, and in-memory test sink.
- Sanitised Telegram Bot API transport behind an alert adapter.
- Alert fingerprint deduplication, rate limiting, timeout, and failure isolation.
- Sentry exception reporting behind a provider adapter with default PII collection disabled.
- Local responsive observability review screen using deterministic fake data and no external transmission.

## Out of scope

- Sending a real Telegram message or Sentry event before the owner supplies test credentials and separately approves transmission.
- Supabase live log tables, Storage archives, archive manifests, or retention jobs; these require the Part 0.4 database foundation.
- Production monitoring, alert escalation links, deployment, or incident automation.
- Customer, merchant, catalogue, order, payment, or authentication behaviour.

## Acceptance examples

### A1: Structured event contract

Given an accepted log call, then the sink receives one schema-versioned object containing a UTC timestamp, level, environment, service, stable event name, outcome, and available request, trace, reference, and safe entity IDs.

### A2: Debug threshold

Given `LOG_LEVEL=debug`, debug events are emitted. Given any higher threshold, debug events are suppressed. Redaction is identical at every level and is never disabled by `DEBUG_MODE`.

### A3: Sensitive-key redaction

Given nested fields named like password, token, secret, cookie, authorisation, phone, address, bank account, BSB, PayID, message body, or payment evidence, then their values become `[REDACTED]` before any sink, Telegram adapter, or Sentry adapter receives them.

### A4: Sensitive-value redaction

Given credentials or likely phone/bank/PayID values under an innocently named field, then pattern-based redaction masks them. Tests use synthetic values only and no production-like personal data.

### A5: Injection resistance

Given an attacker-controlled value containing newlines or control characters, then serialising one event produces exactly one JSONL record. The event name must match the stable machine-name pattern and invalid names are rejected.

### A6: Telegram sanitisation and isolation

Given a fatal/security event, the adapter sends only an environment label, UTC timestamp, stable code/event, safe IDs, request/trace/reference IDs, and outcome. It excludes stack traces and sensitive context. Transport failure is caught and returned as an alert outcome; it never throws into the original operation.

### A7: Telegram deduplication and rate limit

Given the same fingerprint within its cooldown, only the first alert is sent. Given the configured window limit is reached, later alerts are suppressed until the window advances. State storage is injected so a durable shared implementation can replace the local in-memory implementation before production.

### A8: Sentry provider boundary

Given an `AppError`, the Sentry adapter reports a new safe exception containing only its stable code/reference and sanitised operational context. It does not send the original cause, public parameters, stack, or sensitive values. Provider failure is isolated.

### A9: Safe configuration

Local/test operation requires no provider credentials and cannot transmit externally. Hosted environments validate log/debug settings. Telegram credentials must be supplied together; partial configuration fails safely without echoing values.

### A10: Review screen

Given desktop and phone widths, the review page shows one local debug JSON event and one Telegram test-alert preview, both visibly sanitised, with no horizontal scrolling or browser-console errors. It states that nothing was transmitted.

## Automated evidence required

- [x] Logger/redaction tests first failed and later passed.
- [x] Telegram isolation/deduplication/rate-limit tests first failed and later passed.
- [x] Sentry adapter tests first failed and later passed.
- [x] Configuration tests first failed and later passed.
- [x] Formatting, lint, type check, unit/component tests, and build passed.
- [x] Desktop and mobile browser tests passed without horizontal overflow; the automated Chromium smoke suite reported no console errors.
- [x] Dependency and secret scans passed.
- [ ] CI run passed.

## Owner UI/process checkpoint

The owner reviews the local screen and confirms:

- The debug JSON is understandable and useful for diagnosis or later AI analysis.
- Sensitive fields are unmistakably redacted.
- The Telegram preview contains enough information to investigate without exposing private data.
- The distinction between a stored log event and a short critical alert is clear.
- The “nothing transmitted” state is clear.

Part 0.4 remains unauthorised until these checks pass and the owner accepts Part 0.3.
