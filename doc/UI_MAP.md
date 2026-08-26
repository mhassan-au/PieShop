# Initial UI Map

This is a screen inventory and navigation contract, not a final visual design. Screens are built only when their roadmap part becomes active.

## 1. Platform control plane

The platform owner can manage merchant accounts without seeing merchant business content.

```text
Platform sign-in
  -> MFA enrol/challenge
  -> Merchants
      -> Create merchant
      -> Merchant account detail
          -> status
          -> owner invitation
          -> onboarding progress
          -> plan/invoice metadata
          -> integration health
          -> support grant/session metadata
  -> Support administrators
  -> Platform operations/alerts
  -> Platform profile and active sessions
```

Merchant catalogue, customers, orders, messages, addresses, payment details, and files do not appear in the normal platform control plane.

## 2. Merchant application

Primary mobile navigation:

```text
Today | Orders | Catalogue | Settings
```

### Authentication and onboarding

```text
Invitation acceptance
  -> credentials
  -> MFA enrol/challenge
  -> business details
  -> timezone/currency
  -> pickup and delivery zones
  -> payment methods
  -> first product
  -> test order/notification
```

### Today

```text
New / awaiting review
Awaiting payment verification
Preparing
Ready for pickup/delivery
Out for delivery
Overdue
Recently completed
```

Each order card has one primary next action.

### Orders

```text
Order list/search/filter
  -> Order detail
      -> customer/contact
      -> masked/authorised address
      -> items and totals
      -> payment state/actions
      -> fulfilment state/actions
      -> timeline
      -> notifications
      -> cancel/correct via append-only operations
```

### Catalogue

```text
Catalogue list
  -> Add product
  -> Product detail/edit
  -> Image upload/replace
  -> Duplicate
  -> Available/sold out/hidden/archive
  -> Categories and ordering
  -> Customer-style preview
```

### Settings

```text
Business
Delivery zones and pickup
Payment methods (step-up MFA)
Staff and roles (if enabled)
Notifications and PWA install
Support access grants/sessions
Privacy requests/exports
Security, MFA and active sessions
```

### Support mode

```text
Support admin sign-in + MFA
  -> select active merchant grant
  -> enter support session
      -> persistent merchant/support/expiry banner
      -> catalogue-only screens by default
      -> exit support
```

Support mode does not expose orders, customers, messages, payment settings, ownership, security, or exports under the default scope.

## 3. Customer pages

Customers do not have accounts.

```text
Secure confirmation link
  -> masked order/address summary
  -> confirm / request change / cancel / help
  -> stronger channel/OTP challenge for sensitive actions

Secure tracking link
  -> order and payment status
  -> sanitised timeline
  -> merchant contact/help
```

Customer pages use no-store/no-referrer controls and no third-party analytics/scripts.

## 4. Conversational flow

```text
WhatsApp / SMS / Messenger / email / phone
  -> phone captured or requested
  -> pickup or address
  -> delivery eligibility
  -> products and quantities
  -> structured summary
  -> confirmation
  -> direct payment instructions
  -> status updates/tracking
```

Ambiguity creates a draft or merchant-review task, never a silent committed order.

## 5. Shared UI states

Every screen/flow designs and tests:

- Loading/skeleton.
- Empty/first-use.
- Success.
- Validation error.
- Recoverable provider/system error.
- Permission denied.
- Session/grant expired.
- Offline/reconnect where relevant.
- Destructive/corrective confirmation.
- Keyboard focus and accessible labels.
- Phone and desktop layouts.
