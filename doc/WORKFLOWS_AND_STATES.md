# Workflows and State Models

## 1. Canonical order flow

```text
Inbound message or manual entry
  -> identify merchant and channel
  -> capture/normalise phone number
  -> identify/create merchant-scoped customer
  -> select pickup or capture address
  -> validate delivery eligibility
  -> build draft from catalogue snapshot
  -> calculate fees and total
  -> customer or merchant confirms
  -> select direct-payment method
  -> merchant verifies payment when applicable
  -> prepare
  -> ready / dispatch
  -> delivered / collected
```

Every external event is idempotent. Duplicate provider webhooks must resolve to the original message/order operation rather than create a second order.

## 2. Order state

Canonical states:

```text
draft
awaiting_customer_confirmation
awaiting_merchant_review
confirmed
preparing
ready_for_pickup
ready_for_delivery
out_for_delivery
delivered
collected
cancelled
rejected
```

Allowed primary transitions:

```text
draft -> awaiting_customer_confirmation | awaiting_merchant_review | confirmed | cancelled
awaiting_customer_confirmation -> confirmed | draft | cancelled
awaiting_merchant_review -> awaiting_customer_confirmation | confirmed | rejected
confirmed -> preparing | cancelled
preparing -> ready_for_pickup | ready_for_delivery | cancelled
ready_for_pickup -> collected
ready_for_delivery -> out_for_delivery | delivered
out_for_delivery -> delivered
```

Terminal states are `delivered`, `collected`, `cancelled`, and `rejected`. Reopening a terminal order is not supported; create a replacement order with a reference to the original.

## 3. Payment state

```text
unpaid
payment_submitted
paid
cash_due
refunded
void
```

- PayID/bank transfer starts `unpaid`, becomes `payment_submitted` when the customer reports payment, and becomes `paid` only after merchant verification.
- Cash on delivery/pickup starts `cash_due` and becomes `paid` when collected.
- `payment_submitted` does not authorise the UI to say that funds were received.
- A refund is a merchant-recorded fact in the MVP; PieShop does not move the money.

Order cancellation and payment state are separate. Cancelling a paid order requires the merchant to handle and record any refund.

## 4. Delivery eligibility

```text
pickup selected -> validate pickup location and availability
delivery selected -> normalise address -> extract postcode
  -> matching active zone: calculate fee/minimum/free threshold
  -> no matching zone: offer pickup or merchant review
```

Final confirmation is blocked until the full address is recorded for delivery and the order meets zone rules or has a documented merchant override.

## 5. Conversational ordering

The channel adapter normalises inbound messages. The order engine may extract candidate items, but ambiguous messages produce a draft or merchant-review task.

Example confirmation:

```text
Order PIE-1042
2 x Apple Pie        A$30.00
Delivery              A$5.00
Total                 A$35.00

Deliver to: 15 S***** Street, 2***
Reply YES to confirm, CHANGE to update, or CANCEL.
```

The exact text comes from the central message catalogue, not channel-specific business logic.

## 6. Repeat customer flow

1. Match the normalised phone number within the merchant.
2. Offer the most recently used active address in masked form.
3. Require explicit confirmation or collect a new address.
4. Re-run delivery eligibility on every new order because merchant zones may have changed.

## 7. Notification flow

```text
domain event committed
  -> durable notification job created
  -> template selected by message key
  -> channel adapter sends
  -> delivery attempt recorded
  -> retry transient failures with backoff
  -> permanent failure shown to merchant
  -> critical/repeated failure alerts operations
```

Never send a notification before the associated database transaction commits. A failed notification does not roll back a valid order.

## 8. Merchant alert escalation

1. Create in-app notification and web-push attempt immediately.
2. Send email fallback according to merchant preference or when push is unavailable.
3. Mark the order visibly unacknowledged until opened or acted upon.
4. Optional paid SMS/WhatsApp escalation is deferred/configurable.

## 9. Cancellation

- Customer cancellation before preparation may be accepted automatically according to merchant policy.
- Later cancellations require merchant review.
- Capture actor, reason, previous state, timestamp, and refund requirement.
- Cancellation never deletes an order.

## 10. Platform fulfilment billing

An order becomes billable exactly once when it first reaches `delivered` or `collected`. Store a durable billable event/ledger entry so later reporting does not depend on recalculating mutable order history.

## 11. Platform-owner merchant onboarding

```text
platform owner creates merchant metadata
  -> system creates single-use expiring owner invitation
  -> merchant owner accepts and creates own credentials
  -> merchant completes business onboarding
  -> platform owner sees completion/health metadata only
```

There is no public merchant sign-up route. The platform owner cannot use onboarding to enter the merchant workspace or inspect catalogue/transaction content.

## 12. Merchant-granted support

```text
merchant owner selects support scope + duration + optional reason
  -> grant created and audited
  -> support administrator authenticates as themselves
  -> support session validates grant, scope, expiry and revocation
  -> persistent support banner is shown
  -> sensitive reads and all changes are attributed to support actor
  -> merchant revokes, support exits, or grant expires
```

The default support scope is catalogue assistance. Transaction hard deletion, audit deletion, merchant-owner changes, payment-instruction changes, security changes, and data export are never granted through ordinary support mode.

## 13. Correcting transaction records

Transactional history is never hard-deleted. Use explicit corrective actions:

- Incorrect order: cancel and create a replacement linked to the original.
- Incorrect payment assertion: reject, void, or supersede it with an explanatory record.
- Refund: append a refund record and retain the original payment record.
- Incorrect state: append an authorised corrective transition/reason; never rewrite history silently.
- Privacy request: anonymise permitted personal fields through the controlled retention process while preserving required transaction integrity.
