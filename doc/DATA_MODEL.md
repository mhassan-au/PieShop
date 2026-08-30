# Initial Data Model

This is a logical model, not final migration SQL. Use UUID/UUIDv7-compatible identifiers and explicit foreign keys. Tenant-owned tables require `business_id`, indexes supporting tenant queries, and Row Level Security.

## 1. Identity and tenancy

### businesses

- `id`
- `name`
- `status`: onboarding, active, suspended, archived
- `currency_code`
- `timezone` (IANA identifier)
- `contact_phone_e164`
- `contact_email`
- `created_at`, `updated_at`

### business_memberships

- `id`, `business_id`, `user_id`
- `role`: owner or staff
- `status`
- `created_at`, `updated_at`

At least one active owner is required. Removing the last owner is prohibited. Platform roles are not business memberships and receive no implicit tenant-data access.

### merchant_invitations

- `id`, `business_id`, invited email/phone
- invited role (`merchant_owner` in the MVP)
- token hash, expiry, accepted/revoked timestamps
- creator platform-owner ID and audit metadata

Invitation tokens are single-use and never stored in plaintext.

### platform_role_assignments

- `id`, `user_id`
- role: `platform_owner` or `support_admin`
- status, created/disabled timestamps and actor

Platform-role records do not grant access to merchant-owned tables.

### support_access_grants

- `id`, `business_id`
- granted by merchant-owner user ID
- optional allowed support-admin ID or support-team scope
- allowed capability list, reason/ticket reference
- start, expiry, revoked timestamps and revoking actor
- approval assurance level and approved-at timestamp

### support_sessions

- `id`, `support_access_grant_id`, `business_id`, `support_admin_user_id`
- started, last activity, ended timestamps
- end reason, request/session correlation
- last authorisation check and session fingerprint hash

Support sessions preserve the real support actor. Expiry or grant revocation invalidates the session immediately.

## 2. Catalogue

### categories

- `id`, `business_id`, `name`, `sort_order`, `active`

### products

- `id`, `business_id`, optional `category_id`
- `name`, `description`
- `price_minor`, `currency_code`
- `availability`: available, sold_out, hidden, archived
- optional `stock_quantity`, `max_order_quantity`
- `sort_order`, `created_at`, `updated_at`

### product_images

- `id`, `business_id`, `product_id`, `storage_path`, `sort_order`, metadata

Products referenced by an order are archived, never hard-deleted.

### product_options / product_option_values

Simple option groups and price adjustments. Avoid a general-purpose configuration engine in the MVP.

## 3. Customers and addresses

### customers

- `id`, `business_id`
- encrypted, versioned name ciphertext
- encrypted, versioned normalised E.164 phone ciphertext (required)
- keyed phone blind index for exact merchant-scoped lookup
- optional encrypted email plus keyed email blind index; preferred channel
- status/blocked flag and encrypted merchant note
- consent/opt-out fields
- `created_at`, `updated_at`

Unique active phone identity is scoped by `(business_id, phone_lookup_hmac)`. The HMAC input includes the business identifier and canonical phone value, uses managed key material distinct from field-encryption keys, and is never used as a public identifier. Plaintext phone/email/name values exist only inside the authorised application operation that needs them.

### customer_addresses

- `id`, `business_id`, `customer_id`
- encrypted, versioned complete address payload
- minimum searchable routing derivatives such as postcode, country code, and derived delivery-zone ID where justified
- encrypted optional coordinates and delivery instructions
- validation status/source
- `last_used_at`, `created_at`, `updated_at`

Order delivery-address snapshots receive the same application-level encryption; copying an address into immutable history does not downgrade its classification.

## 4. Delivery

### delivery_zones

- `id`, `business_id`, `name`, `active`
- `fee_minor`, `minimum_order_minor`
- optional `free_delivery_threshold_minor`, `cod_fee_minor`
- estimated time text and scheduling settings

### delivery_zone_postcodes

- `id`, `business_id`, `delivery_zone_id`, `postcode`, optional suburb

### pickup_locations

- `id`, `business_id`, address, instructions, availability

## 5. Orders

### orders

- `id`, `business_id`, `order_number`
- `customer_id`, optional selected `customer_address_id`
- source channel and source conversation reference
- fulfilment method: delivery or pickup
- order state and payment state
- currency code
- subtotal, delivery fee, COD fee, adjustments, and total in minor units
- delivery-address snapshot and pickup-location snapshot
- customer note, merchant note
- promised/estimated timestamps
- `confirmed_at`, `completed_at`, `cancelled_at`
- `created_at`, `updated_at`, optimistic `version`

`order_number` is unique within a business. Derived totals are validated server-side.

### order_items

- `id`, `business_id`, `order_id`
- optional source `product_id`
- immutable name/option/price snapshots
- quantity, unit price, line total, currency

### order_state_events

- `id`, `business_id`, `order_id`
- previous/new state, actor type/ID, reason
- `occurred_at`

State history is append-only.

Orders, order items, and order-state events have no application-level hard-delete operation. Corrections create new events/adjustments while preserving original facts.

## 6. Payments

### merchant_payment_settings

- `business_id`
- enabled methods
- encrypted/protected PayID and bank instruction fields
- COD/pickup policy
- `updated_at`, `updated_by`

### payment_records

- `id`, `business_id`, `order_id`
- method, state, amount/currency
- unique customer-facing reference
- submitted/verified timestamps and actor
- refund/void note

Bank details are not copied into general logs. Orders may store the instruction version/reference required for support without duplicating secrets unnecessarily.

Payment records cannot be hard-deleted. Incorrect records are voided or superseded with actor-attributed history.

## 7. Messaging and notifications

### channel_connections

- `id`, `business_id`, provider, status
- encrypted provider references/credentials where applicable
- health and last successful event timestamps

### conversations

- `id`, `business_id`, `customer_id`, channel, provider conversation ID

### messages

- `id`, `business_id`, `conversation_id`
- direction, provider message ID, safe structured content/reference
- delivery status and timestamps

Raw message retention must be limited and documented. Attachments are fetched/validated server-side before use.

### notifications / notification_attempts

- event/message key, recipient/channel, payload version
- status, idempotency key, attempt count, provider ID
- timestamps and sanitised error code

## 8. Operations, audit, and billing

### audit_events

Append-only actor, action, target, before/after safe diffs, request/trace IDs, timestamp, and security classification.

Support activity additionally records the support grant/session and real support-admin actor. Audit records cannot be updated or deleted through application roles.

### application_logs / security_events

Structured operational records with explicit retention. These are not a substitute for audit history.

### log_archive_batches

Date range, category, object path, checksum, row count, export status, retention/deletion timestamps.

### privacy_requests

- `id`, `business_id`, customer/subject reference where known
- request type: access, correction, deletion, de-identification, opt-out
- identity-verification status, received/due/completed timestamps
- outcome, scope, safe notes, responsible actor

### retention_actions

- policy version, data category, affected record/object/provider scope
- action: delete, de-identify, put beyond use, retain by exception
- legal/business reason, actor/job, timestamp, verification evidence reference

### encryption_key_versions

Metadata only: purpose, version, status, activation/retirement timestamps, rotation job status. Cryptographic key material is never stored in application tables.

### billable_order_events

One immutable record when an order first reaches delivered/collected. Unique by order ID.

### merchant_billing_periods

- business, period start/end UTC
- plan/rate snapshot
- completed-order count and calculated amount
- external invoice number/status/dates

## 9. Cross-cutting constraints

- All timestamps are UTC.
- All money uses integer minor units and explicit currency.
- Soft-delete/archive business records that appear in history; do not cascade-delete completed orders.
- Deny `DELETE` for transactional and audit tables to all application roles; retention/anonymisation is a separate tightly controlled process.
- Foreign keys and check constraints enforce state and positive quantities.
- Personally identifiable information is minimised, masked in operational views, and never added casually to logs. Customer contact/location fields and their order snapshots use application-level versioned envelope encryption.
- Restricted configuration fields store versioned ciphertext and key-version metadata, not plaintext.
- Exact phone/email matching uses separately keyed HMAC blind indexes; ciphertext and blind indexes never reuse key material.
- Retention applies to derived copies, exports, archives, provider data, and backups—not only primary rows.
- Use database migrations; never edit production schema manually without a recorded migration and decision.
