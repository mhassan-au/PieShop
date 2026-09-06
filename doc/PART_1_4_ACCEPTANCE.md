# Part 1.4 Acceptance — Merchant Status and Onboarding Progress

**Owner:** Mehedi Hassan  
**Scope:** Private synthetic development only  
**Status:** Authorized for TDD implementation on 2026-09-06 Australia/Sydney

## Locked scope

- Only a freshly authorized active platform owner may change merchant account status.
- Allowed transitions are `onboarding → active`, `onboarding → suspended`, `active → suspended`, `suspended → active`, and `suspended → archived`.
- Archive is terminal, requires prior suspension, and never deletes merchant or transaction history.
- Activation requires an accepted invitation and exactly one active merchant-owner membership.
- Suspension atomically revokes every active merchant application session before the operation succeeds.
- Onboarding progress is derived only from account and invitation metadata; it exposes no merchant catalogue, order, payment, bank, customer, or address data.

## Acceptance examples

1. Anonymous, merchant, inactive-owner, and stale-owner sessions cannot call the transition RPC or action.
2. Invalid business IDs, target states, and disallowed transitions fail without partial mutation.
3. Activation fails until the owner invitation is used and an active merchant-owner membership exists.
4. Suspension revokes all current merchant application sessions with reason `suspension`; the next protected request fails despite valid provider cookies.
5. Reactivation restores account eligibility but does not restore revoked sessions; the merchant requests a fresh magic link.
6. Archive is permitted only from suspended, is terminal, and performs no delete.
7. Successful transitions record the real owner actor, business target, previous/next state, and no sensitive content in an append-only audit event.
8. Repeating an already-completed target is idempotent and does not create duplicate audit outcomes.
9. The owner UI shows clear onboarding progress and only valid next actions with centralized confirmation/success/failure copy.
10. Owner payloads retain the existing metadata allow-list and contain no merchant business content.

## Required evidence

- Transition, authorization, session revocation, audit, idempotency, privacy-boundary, repository, action, and component tests pass.
- The guarded development migration dry-run identifies only the reviewed Part 1.4 migration; applying it requires explicit owner authorization.
- Mehedi Hassan suspends/reactivates the synthetic merchant and accepts the UI/process checkpoint.
