# Threat Modeling Standard

## Purpose

PieShop performs and records a threat model before implementation begins in every roadmap phase. The model is updated when a part adds or materially changes actors, assets, data flows, trust boundaries, providers, authorization, storage, or deployment.

This process follows the four questions in the OWASP Threat Modeling guidance:

1. What are we working on?
2. What can go wrong?
3. What are we going to do about it?
4. Did we do a good enough job?

OWASP ASVS 5.0.0 Level 2 remains the verification baseline. A threat model identifies applicable risks and controls; ASVS and project tests verify those controls.

## Phase gate

Before the first part of each phase is authorised:

- Define the target of evaluation and explicitly excluded systems.
- Identify actors, assets, entry points, data flows, dependencies, and trust boundaries.
- Record security and privacy invariants that must never be violated.
- Identify threats using STRIDE plus privacy, business-logic, supply-chain, availability, and operational abuse cases.
- Rate inherent risk and record existing/planned controls.
- Assign an owner, target phase/part, evidence, and status to every treatment.
- Identify blockers that must be resolved before the phase starts.
- Obtain owner acceptance of residual risk.

Every part acceptance contract must reference the current phase threat model and add tests for affected invariants. A material design change reopens the model before implementation continues.

## Risk rating

Rate likelihood and impact from 1 to 3:

| Score | Likelihood                     | Impact                                                                       |
| ----- | ------------------------------ | ---------------------------------------------------------------------------- |
| 1     | Unlikely with current exposure | Limited and recoverable                                                      |
| 2     | Plausible                      | Meaningful tenant, privacy, integrity, or operational harm                   |
| 3     | Likely or readily exploitable  | Cross-tenant, credential, financial, immutable-record, or broad service harm |

Risk score is likelihood multiplied by impact:

- 1–2: Low
- 3–4: Medium
- 6–9: High

Any threat affecting tenant isolation, privileged identity, merchant-content privacy, transaction immutability, production secrets, or real customer data may be treated as a blocker regardless of numeric score.

## Required model contents

Each `PHASE_N_THREAT_MODEL.md` includes:

1. Scope, version, reviewers, date, and status.
2. Assumptions and environment/data restrictions.
3. Architecture/data-flow view and trust boundaries.
4. Actors, assets, entry points, and dependencies.
5. Security/privacy invariants.
6. Threat register with stable IDs.
7. Existing controls and evidence.
8. Required treatments with owner and deadline.
9. Accepted residual risks and explicit blockers.
10. Review triggers and approval record.

Threat descriptions must state an actor or failure, an action, the affected asset/boundary, and the consequence. Avoid vague entries such as “hacking” or “data leak.”

## Treatment states

- `Open`: identified but not resolved.
- `Planned`: treatment and target are agreed.
- `Mitigated`: control exists and evidence passed.
- `Accepted`: owner explicitly accepts the residual risk for the stated environment and period.
- `Transferred`: a named provider/contract owns part of the treatment; PieShop still verifies configuration and shared responsibility.
- `Closed`: no longer applicable, with reason recorded.

An accepted internal-development risk does not automatically carry into staging, a real-vendor demo, or production.

## Evidence

Evidence can include:

- Unit, component, integration, RLS, browser, security, and abuse-case tests.
- Migration and privilege inspection.
- Configuration validation.
- Dependency and secret scans.
- Manual security review with exact file/decision references.
- Provider configuration or dashboard evidence recorded without secrets.
- Owner acceptance date and environment limitation.

Do not mark a control mitigated because it appears in a planning document. It must exist in implementation or verified provider configuration.

## Review triggers

Update the active model when PieShop introduces or changes:

- Authentication, sessions, recovery, MFA, roles, or support access.
- Tenant tables, RLS, privileged functions, service-role use, or database grants.
- Customer data, addresses, payments, files, exports, or retention.
- Public links, APIs, webhooks, messaging channels, providers, or AI processing.
- Logging, alerts, archives, monitoring, backups, or incident response.
- Hosting environments, domains, CSP, cookies, proxies, rate limiting, or deployment topology.
- A security defect, incident, penetration-test result, or material dependency advisory.

## References

- [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html)
- [OWASP Application Security Verification Standard 5.0](https://owasp.org/www-project-application-security-verification-standard/)
- `SECURITY_PRIVACY_REVIEW.md`
- `CODING_STANDARDS.md`
- `TECHNICAL_ARCHITECTURE.md`
