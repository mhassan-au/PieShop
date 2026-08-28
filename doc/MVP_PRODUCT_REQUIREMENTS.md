# MVP Product Requirements

## 1. Purpose

PieShop gives small merchants one simple application for receiving and fulfilling orders that originate in WhatsApp, Messenger, SMS, email, or a phone conversation. A public catalogue storefront is a later feature; small secure web pages for confirmation, payment instructions, and tracking are part of the MVP.

The platform does not hold or transfer customer funds in the MVP. Customers pay merchants directly. PieShop invoices each merchant separately for platform usage.

## 2. Product principles

1. Customers do not need an account, password, or application installation.
2. A valid phone number is required for every order and is the primary customer identifier within a merchant.
3. A delivery address is required before a delivery order can be confirmed.
4. Channel complexity is hidden from merchants; all orders share one workflow.
5. Each screen has an obvious primary action and works well with one hand on a phone.
6. Automated interpretation may prepare a draft, but the customer or merchant confirms the final order.
7. Payment state and fulfilment state are independent.
8. All timestamps are stored in UTC and displayed in the merchant's configured timezone.

## 3. Actors

### Merchant owner

Configures the business, catalogue, delivery zones, payment instructions, staff access, notifications, and billing information. Can perform every order action.

### Merchant staff

Views and fulfils orders. Cannot change billing, bank details, security settings, or owner access unless explicitly granted later.

### Customer

Places an order through a supported channel, provides a phone number and address, chooses a direct-payment option, confirms the order, and receives status updates.

### Platform administrator

The platform has two initial administrative roles:

- **Platform owner:** creates and manages the initial 1–5 merchant accounts, assigns merchant owners, controls account status and billing metadata, monitors integration/system health, and manages support administrators. The platform owner cannot view merchant catalogues, customers, orders, messages, payment evidence, or transaction details by default.
- **Support administrator:** can manage platform support work and may enter a merchant support session only after that merchant explicitly grants support access. Support administrators have no standing access to merchant business data.

Every platform action and support session is audited.

For internal MVP development with synthetic data, the platform owner signs in using a pre-provisioned email/login identifier and password. Public sign-up and automatic account creation remain disabled. MFA/AAL2 and stricter privileged-session controls must be implemented and verified before any demo to a real vendor, use of real merchant/customer data, staging pilot, or production rollout.

Invited merchant owners use a one-time email magic link with server-side PKCE confirmation; token material is removed from the browser URL immediately. The authenticated browser session may restore without another email for no more than 30 days from authentication. It ends earlier on logout, explicit revocation, account suspension, recovery, privilege change, or a security event. A new or cleared browser must use a new magic link. Automatic user creation and public merchant sign-up remain disabled. Custom SMTP with link tracking disabled and MFA/AAL2 are required before inviting or demonstrating to a real vendor.

### 3.1 Merchant account provisioning

- Merchant self-registration and public sign-up are disabled in the MVP.
- Only the platform owner can create a merchant account.
- The platform owner enters the business name and merchant-owner contact, then sends a single-use, expiring invitation.
- The invited synthetic merchant owner accepts the single-use invitation and verifies their email through the magic-link flow; no reusable merchant password exists. MFA enrolment becomes mandatory before any real-vendor demonstration or pilot.
- The platform owner can resend/revoke invitations, suspend/reactivate the merchant account, manage plan and invoice metadata, and view onboarding completion state.
- Platform management screens expose operational metadata only and must not infer or display what the merchant sells.
- The MVP is operated for 1–5 merchants, while tenancy rules must not hard-code a maximum of five.

### 3.2 Merchant-granted support access

- Support access is off by default.
- A merchant owner can grant support access to eligible support administrators for a selected duration and optional reason/ticket reference.
- A grant requires recent AAL2 authentication, defaults to catalogue-only access, defaults to four hours, and cannot exceed 24 hours in the MVP.
- Access can be revoked immediately by the merchant owner or platform owner.
- A support administrator enters a distinct support session using their own identity. The system must not share merchant credentials or silently impersonate a merchant user.
- The merchant UI displays an obvious active-support banner and active/recent support sessions.
- During an authorised support session, a support administrator may view and manage the catalogue and other explicitly granted support areas.
- Support access never permits deletion of transaction, order, payment, audit, message-delivery, or billing-ledger records.
- Every support read of sensitive areas and every support mutation is recorded with support actor, merchant, grant, reason, timestamp, request/trace ID, and before/after safe diff where applicable.
- Support sessions expire after 15 minutes of inactivity and terminate immediately on grant revocation, relevant role change, or account suspension.

## 4. Merchant application

The merchant application is a responsive Progressive Web App (PWA), installable from a supported browser. The primary navigation is limited to:

- **Today**: work requiring attention.
- **Orders**: active, completed, cancelled, and searchable orders.
- **Catalogue**: products, categories, availability, and simple options.
- **Settings**: business, delivery, payments, staff, notifications, and timezone.

Native iOS and Android applications are not required for the MVP.

### 4.1 Onboarding

The application must guide an owner through:

1. Business name and contact details.
2. Currency and IANA timezone, defaulting from location but requiring confirmation.
3. Pickup address and availability.
4. Delivery postcodes/zones, fees, minimum order, and optional free-delivery threshold.
5. PayID, bank transfer, cash-on-delivery, and cash-on-pickup settings.
6. First catalogue item.
7. Test order and test notification.

The merchant can save and resume onboarding.

### 4.2 Catalogue

A merchant must be able to add a basic product in under one minute from a phone:

1. Take or upload a photo.
2. Enter product name.
3. Enter price.
4. Tap **Add product**.

Optional fields include description, category, simple variants/options, maximum order quantity, stock quantity, and delivery restrictions.

Required catalogue capabilities:

- Add, edit, duplicate, archive, and restore a product.
- Mark a product available, sold out, or hidden.
- Reorder products and categories.
- Preview the customer representation.
- Share a product/order link where the channel supports links.
- Preserve prices on historical order items when catalogue prices change.

CSV import, supplier management, and advanced inventory forecasting are deferred.

### 4.3 Today view

The opening screen groups orders into:

- New or awaiting merchant review.
- Awaiting payment verification.
- Preparing.
- Ready for pickup or delivery.
- Out for delivery.
- Overdue.
- Recently completed.

Each order card displays one primary next action.

### 4.4 Manual order entry

The merchant can create an order received by phone or an unsupported/unclear message:

- Find or create customer by phone number.
- Confirm customer name.
- Select pickup or enter/confirm delivery address.
- Validate delivery eligibility.
- Select products and quantities.
- Select payment method.
- Confirm totals and create the order.
- Send confirmation or tracking details through an available channel.

## 5. Customer ordering

### 5.1 Supported sources

The product must support a common order model for:

- WhatsApp.
- Messenger.
- SMS.
- Email.
- Phone/manual entry.
- Future public web catalogue.

Integrations are delivered in stages. Manual entry and simulated inbound orders are built first, WhatsApp is the first live conversational integration, and Messenger/SMS/email ingestion are added behind the same channel-adapter contract before general MVP release if provider approval permits.

### 5.2 Customer identity

- Every order requires a valid, normalised phone number.
- WhatsApp and SMS sender numbers can be captured automatically.
- Messenger, email, manual, and future web orders must collect a phone number.
- OTP verification is required for untrusted web flows and may be required for Messenger/email according to abuse risk.
- WhatsApp/SMS orders do not need a second OTP merely to repeat verification already supplied by the channel.
- Customer identity is scoped to a merchant; the platform must not create a cross-merchant customer profile visible to merchants.
- Possession of a tracking link alone cannot authorise a sensitive change such as address, phone, cancellation after preparation, or payment assertion; require a channel-bound confirmation or OTP according to risk.

### 5.3 Address and deliverability

- Pickup customers can select a configured pickup location and skip delivery eligibility.
- Delivery customers must provide a full address before order confirmation.
- A postcode may be used for an initial eligibility check, but it is not a final delivery address.
- Saved addresses can be offered to repeat customers and must be reconfirmed.
- An address outside the supported area offers pickup or merchant review; it must not silently confirm delivery.

### 5.4 Confirmation

Before commitment, the customer must receive a structured summary containing products, quantities, item totals, delivery/COD fees, total, delivery or pickup details, and selected payment method.

The customer can confirm, request a change, cancel, or request human assistance. Secure tokenised web pages may be used without creating an account. Tokens must be high entropy, hashed at rest, expiring, revocable, rate limited, excluded from logs/referrers, and rotated after suspected disclosure.

## 6. Delivery configuration

Postcode-based zones are the default MVP mechanism. A merchant can configure:

- Included postcodes/suburbs.
- Delivery fee.
- Minimum order.
- Free-delivery threshold.
- Optional COD fee.
- Available delivery days and time windows.
- Estimated preparation/delivery text.
- Pickup locations.
- Manual exception approval.

Radius/distance calculation and live courier tracking are deferred unless required by pilot merchants.

## 7. Customer-to-merchant payments

Supported MVP methods:

- PayID.
- Bank transfer.
- Cash on delivery.
- Cash on pickup.

The merchant controls which methods are enabled and supplies their own instructions. Each order receives a unique payment reference.

PieShop must not state that a bank transfer or PayID payment has been received merely because the customer selected **Paid**. The state remains `payment_submitted` until the merchant verifies funds and marks it `paid`. Payment-receipt/evidence uploads are excluded from the MVP to reduce malware, fraud, and personal-data exposure.

Stripe and Stripe Connect are not required for the MVP. A later merchant-owned card-payment integration must keep customer funds flowing directly to the merchant.

## 8. Tracking and notifications

Every confirmed order receives a secure tracking token/link. The tracking view shows order number, sanitised delivery/pickup detail, item summary, payment state, fulfilment state, estimate, and timeline. It must not expose sensitive data if forwarded.

Merchant notifications:

- New order.
- Customer change request.
- Payment submitted for verification.
- Approaching/overdue promise time.
- Notification delivery failure.

Customer notifications:

- Order received, confirmed, rejected, or cancelled.
- Payment submitted and payment verified.
- Preparing, ready, dispatched, delivered, or ready for pickup.

PWA push is the primary merchant alert with an in-app notification centre and email fallback. Optional escalation through SMS/WhatsApp can be configured later. Notification failure must never prevent an order from being persisted.

## 9. Basic reporting and platform billing

Merchant reporting includes order count, completed/cancelled orders, recorded revenue, cash due, popular products, source channel, and average fulfilment time. Reports are operational and not formal accounting reports.

Platform administration tracks:

- Merchant status and onboarding progress.
- Completed orders in a billing period.
- Subscription/fulfilment plan.
- Calculated invoice amount.
- External invoice number, issued date, due date, and paid status.

The platform does not collect its own fees automatically in the MVP. The operator sends invoices separately.

The initial commercial model to validate is A$1 per completed order capped at A$39 per month, or an equivalent A$39 monthly subscription. Only delivered/collected orders count; drafts, rejected orders, cancellations, and failed payments do not.

## 10. Administration

The internal platform area can create merchant accounts, send/revoke owner invitations, activate/suspend/reactivate/archive merchant accounts, view onboarding state and billing metadata, inspect integration health, manage support-administrator accounts, and review/revoke support grants in an emergency.

It cannot display merchant catalogue, customer, order, message, address, payment, or transaction content unless the current administrator has a valid merchant-granted support session covering that area.

Support mode must show a persistent banner naming the merchant, support administrator, grant expiry, and exit action. Changing merchant payment instructions, owners, exports, or security settings is excluded from ordinary support scope and requires merchant-owner action.

### 10.1 Transaction immutability

- No UI, API, administrator, support administrator, merchant owner, or staff role may hard-delete an order, order item snapshot, payment record, order-state event, billable completion event, invoice record, or audit event.
- Mistakes are corrected with an append-only adjustment, cancellation, void, refund record, or superseding event that preserves the original history.
- Catalogue records referenced by transactions are archived rather than deleted.
- Data-retention/privacy erasure anonymises permitted personal fields while preserving the minimum non-personal transaction and audit history required for integrity and lawful retention.

## 11. Accessibility and usability

- Target WCAG 2.2 AA for core flows.
- Minimum touch target of 44 by 44 CSS pixels.
- Keyboard-operable desktop UI.
- Clear labels; do not communicate state by colour alone.
- Plain-language errors with a support/reference ID.
- Destructive actions require centralised confirmation UI.
- Core merchant actions should remain usable on a typical small phone screen.

## 11.1 Privacy transparency and customer rights

- Present a clear collection notice before or at collection of phone/address data, including purposes, merchant/platform responsibilities, communication providers, overseas processing where relevant, retention, access/correction, complaints, and contact details.
- Collect only information necessary for ordering, delivery, payment-status recording, support, security, and lawful administration.
- Provide a documented merchant-assisted process for customer access, correction, opt-out, and deletion/de-identification requests.
- Maintain field-level retention rules and verify deletion/de-identification across live data, Storage, exports, logs, archives, providers, and backups where applicable.
- Do not reuse customer/order data for cross-merchant profiling, unrelated analytics, model training, or marketing without a separate documented lawful basis and explicit product decision.

## 12. MVP exclusions

- Native mobile applications.
- Public browseable storefront/catalogue.
- Platform-held customer funds or payment splitting.
- Automatic PayID/bank reconciliation.
- Unsupervised AI order commitment.
- Live driver GPS tracking.
- Advanced inventory, purchasing, or suppliers.
- Tax filing or accounting guarantees.
- Marketing campaigns and customer profiling across merchants.
- Multiple currencies within one business.

## 13. Product-level acceptance criteria

The MVP is acceptable when a pilot merchant can:

1. Complete onboarding and install the PWA.
2. Add and publish a product on a phone.
3. Configure a delivery postcode and payment instructions.
4. Receive a simulated and WhatsApp order, or enter a phone order manually.
5. Identify the customer by phone and validate the address.
6. Send a complete order summary and receive confirmation.
7. Record payment submitted and merchant-verified payment distinctly.
8. Progress the order to delivered/collected.
9. Notify the customer and display the tracking timeline.
10. Produce an accurate completed-order usage report for merchant invoicing.
11. Allow the platform owner to provision a merchant without gaining access to its catalogue or transactions.
12. Allow a merchant owner to grant and revoke a clearly visible, audited support session.
13. Prevent every role from hard-deleting transaction and audit history.
