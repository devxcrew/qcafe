# Q Cafe MVP Data Tables

This plan defines a small first release for one cafe location. It is a reviewed target, not an implementation: it does not create tables, migrations, APIs, or screens.

## MVP goal

A single location can configure a menu, take counter and takeaway orders, send items to the kitchen (KOT), accept basic table bookings, take and refund payments, print receipts, operate through short network outages, sync safely, and close cashier shifts and the business day. Web and desktop are first clients. Mobile comes later on the same API and data model.

MVP deliberately excludes stock/inventory, loyalty, campaigns, QR ordering, delivery dispatch, marketplace channels, event/catering, hotel folios, supplier payables, bank reconciliation, and general-ledger maintenance. Those are not prerequisites for the core sale-to-close workflow.

## MVP boundaries

- One business and one location at first; preserve `business_id` and `location_id` scope so growth does not require a redesign.
- Platform owns user identity, authentication, tenancy, roles, and trusted device identity. Q Cafe stores references, not duplicate identity systems.
- The server owns confirmed prices, tax calculations, official numbers, payment state, bookings, and close results.
- Web and desktop use the same versioned API. Neither client connects directly to the database. Mobile later reuses these contracts.
- Offline mode is limited to cached menu/settings, pending counter/takeaway orders, cash tenders, KOT commands, and local receipt/production printing. Offline bookings remain requests until confirmed. No offline card/UPI, fiscal invoice, or authoritative stock movement.
- Client offline storage is IndexedDB or an encrypted desktop store, not another server database. Scope and clear it on user, business, location, or device change.
- Start with one bill per order and one currency per location. Split bills, split tender, tips, promotions, and complex tax regimes require explicit product/legal requirements.
- Day close waits for synced device work or a manager-approved exception. Never silently overwrite money or kitchen state during sync.

## Core MVP inventory

The initial plan has **30 tables**. The grouping is by owning capability; table names are stable proposals and can be adjusted to match the repository's module naming conventions before schema work.

### Setup and business day

| Table | Fields | Why it is needed |
| --- | --- | --- |
| `qcafe_businesses` | `id`, `platform_tenant_id`, legal name, timezone, currency, tax profile ref | Establishes the business boundary and the currency/time rules for calculations. |
| `qcafe_locations` | `id`, `business_id`, code, name, address, timezone, active | Defines the cafe outlet and keeps records ready for additional locations. |
| `qcafe_location_settings` | `location_id`, version, service options, receipt rules, tax profile ref, effective dates | Provides versioned settings for server validation and offline client cache checks. |
| `qcafe_business_days` | `location_id`, business date, opened/closed times, status, sync watermark, sales/refund/tax totals snapshot, expected tender totals, close actor and reason | Controls trading-day boundaries and preserves the reconciled financial summary at sync-aware day close. |
| `qcafe_number_sequences` | `location_id`, document kind, prefix, next value, version | Issues unique server-side order, KOT, bill, and receipt numbers safely. |

### Menu and price

| Table | Fields | Why it is needed |
| --- | --- | --- |
| `qcafe_menu_categories` | `business_id`, name, display order, active | Organizes the cafe menu for staff and client screens. |
| `qcafe_menu_items` | `business_id`, SKU, name, category id, tax class ref, default kitchen station ref, active | Defines items sold and their basic tax and kitchen destination. |
| `qcafe_menu_variants` | `item_id`, code, name, quantity basis, active | Represents sellable sizes such as regular/large where needed. |
| `qcafe_menu_prices` | `location_id`, item/variant ref, amount, tax inclusion, currency, effective dates | Keeps the active selling price server-owned and provides the version needed for offline review. |

### Orders and kitchen

| Table | Fields | Why it is needed |
| --- | --- | --- |
| `qcafe_orders` | `location_id`, order number, channel, status, takeaway details, guest count, opened by, totals snapshot, version | Holds one sale lifecycle for counter, takeaway, and dine-in without separate channel-specific order tables. |
| `qcafe_order_lines` | `order_id`, item/variant snapshot, quantity, unit price, tax snapshot, kitchen note, status | Preserves exactly what was ordered and priced even if the menu later changes. |
| `qcafe_order_events` | `order_id`, event kind, actor/device ref, reason, occurred at | Records important transitions such as submit, cancel, void, and handoff. |
| `qcafe_kitchen_stations` | `location_id`, code, name, active | Defines the small set of kitchen/bar destinations. |
| `qcafe_kitchen_tickets` | `order_id`, station id, ticket number, status, fired/ready times, version | Gives kitchen staff a durable KOT state for each preparation station. |
| `qcafe_kitchen_ticket_lines` | `ticket_id`, order line id, quantity, status, preparation note | Tracks item-level accepted, preparing, and ready state. |

### Tables and basic booking

| Table | Fields | Why it is needed |
| --- | --- | --- |
| `qcafe_dining_areas` | `location_id`, name, display order, active | Groups tables into the cafe floor or dining areas. |
| `qcafe_dining_tables` | `area_id`, code, capacity, active, current service state, version | Defines bookable tables and their server-owned availability state. |
| `qcafe_reservations` | `location_id`, guest name/contact snapshot, arrival time, party size, status, source, notes, operation id | Manages a basic booking lifecycle while avoiding a separate CRM/customer master. |
| `qcafe_reservation_tables` | `reservation_id`, `table_id`, assigned at, released at | Assigns or moves a booking to one or more tables with conflict checks. |

### Bills, payments, and close

| Table | Fields | Why it is needed |
| --- | --- | --- |
| `qcafe_bills` | `order_id`, bill number, subtotal, tax/discount/rounding snapshots, total, status, issued at | Freezes the amount due and tax calculation for the order. |
| `qcafe_payments` | `bill_id`, method, amount, status, external reference, idempotency key, captured at | Records cash or online tender attempts and makes retries safe. MVP permits one payment per bill. |
| `qcafe_refunds` | `payment_id`, amount, reason, status, approver ref, external reference, idempotency key | Records controlled refunds linked to the original captured payment. |
| `qcafe_cash_shifts` | `location_id`, cashier ref, opened at, opening float, status, closed at | Defines cashier custody and shift boundaries. |
| `qcafe_cash_movements` | `shift_id`, kind, amount, reason, actor ref, occurred at | Records paid-in, paid-out, and cash corrections separately from sales. |
| `qcafe_shift_closes` | `shift_id`, expected tender totals, counted tender totals, variance, reason, approver ref, closed at | Reconciles each cashier shift and makes variance approval auditable. |

This supports operational settlement through cashier shift and cafe business-day close. Day close snapshots accepted sales, refunds, tax, and tender totals after shifts and sync exceptions are resolved. Provider payout matching and external accounting journal export are deferred adapters. Q Cafe is not the general ledger; full provider-to-bank and accounting settlement remain outside the MVP.

### Printing and sync

| Table | Fields | Why it is needed |
| --- | --- | --- |
| `qcafe_print_jobs` | `location_id`, document kind/ref, target device/printer ref, status, attempt count, last error, created at | Provides a retryable server record for receipt and KOT print requests. Local offline print queues stay on the device. |
| `qcafe_sync_operations` | operation id, device ref, command kind, payload hash, base version, result ref, status, received at | Makes command retries idempotent and gives every offline command a server result. |
| `qcafe_data_change_log` | sequence, entity type/id, version, change kind, safe payload, recorded at | Supplies the ordered change feed that clients pull after reconnect. |
| `qcafe_sync_cursors` | device ref, stream, last sequence, acknowledged at | Tracks which committed changes each device has stored. |
| `qcafe_sync_conflicts` | operation id, entity ref, base/server versions, reason, status, resolution ref | Makes concurrent edits visible for owner review; financial and kitchen changes are never last-write-wins. |

## MVP workflow coverage

| Workflow | Covered by | MVP limit |
| --- | --- | --- |
| Cafe setup | Businesses, locations, settings, business days, number sequences | One location initially; platform remains identity/tenancy authority. |
| Counter sale | Orders, order lines, bill, payment, print job | One bill and one payment per order. |
| Takeaway | Order channel and takeaway details, KOT, payment, print job | Customer pickup only; delivery dispatch deferred. |
| KOT | Station, ticket, ticket lines, order events | Basic fire/accept/prepare/ready/void transitions. Advanced routing and production planning deferred. |
| Booking and dine-in | Dining areas/tables, reservations, table assignments, dine-in order | Server-confirmed simple booking. No waitlist, QR booking, deposits, or table combinations in MVP. |
| Online and offline | Sync operation, change log, cursor, conflict plus local client queue | Only the approved offline subset above; server validates every submitted command. |
| Web and desktop | Same API and data model | Desktop runtime and encrypted local-store choice are pre-implementation decisions. |
| Mobile later | Same API, operation IDs, and sync contracts | No mobile-specific business tables unless a real requirement emerges. |
| Settlement | Payments/refunds, cash shift/movements/close, business-day close | Operational cash/tender reconciliation only; external ledger and provider payout matching deferred. |

## Deferred scope (add only when the product needs it)

| Capability | Candidate tables/features | Why deferred |
| --- | --- | --- |
| Menu growth | Modifier groups/options, item availability schedules, promotions, media, allergens | Add when the launch menu, safety obligations, or pricing rules require them. |
| Restaurant expansion | Table sessions, combined tables, waitlist, reservation history, QR tokens, customer master | Basic booking works without persistent guest profiles or public QR entry. |
| Inventory | Stock units/items, recipes, stock ledger, lots, purchasing, counts, waste, reservations, production batches | Requires agreed costing and consumption policies; not required to take and settle a sale. |
| Payments and accounting | Split tenders/allocations, provider payout batches, settlement lines, journal exports | Add with selected payment and accounting provider contracts. Keep GL, payables, bank reconciliation, and statutory filings external. |
| External channels | Delivery details, marketplace orders/settlements, hotel folio, event leads/quotes | Each needs an active business case and a supported adapter. |
| Customer engagement | Loyalty, vouchers, document delivery, campaigns | Requires consent, retention, redemption, and provider requirements. |
| Operations | Advanced audit, printer routing/attempt history, staff assignment module, device registry/admin UX | Use shared platform/security facilities where available; add Q Cafe-owned records only for a specific operational gap. |

## Data and integrity rules

- Every Q Cafe business record has an immutable id and `business_id`; add `location_id` where the record is outlet-scoped. Enforce both in server logic and database constraints.
- Derive tenant, user, and trusted device scope from authenticated server context. Never accept client-supplied ownership as authority.
- Use typed foreign keys for money, booking, order, and kitchen relationships. Avoid unchecked polymorphic references on core records.
- Store prices, quantities, tax calculations, currency, rounding, and item descriptions as sale-time snapshots on order lines and bills.
- Posted bills, payments, refunds, shift closes, and business-day closes are immutable. Correct them with linked reversals or adjustments.
- Add unique constraints for scoped document numbers, operation ids, external payment references, and active table assignments.
- Validate each state transition and idempotency key on the server. Client-side validation improves usability but is not trusted.
- Keep the table owner module responsible for schema, validation, service, API, UI, and tests. Cross-module calls use public provider contracts.

## Decisions required before schema implementation

1. Confirm tax jurisdiction, invoice/receipt rules, rounding, refund rights, data retention, and whether fiscal documents can ever be issued offline.
2. Confirm Platform Identity contracts for user, tenant, location, and device references.
3. Select launch payment methods and define whether online payment is required at launch. Confirm refunds and duplicate callback handling.
4. Select desktop runtime and approve encrypted local storage, backup, revocation, and application updates.
5. Agree on reservation confirmation and table conflict rules, and whether booking must be online-only.
6. Define close behavior for disconnected devices, open orders, pending payments, and approved variance.
7. Confirm print protocol and target printers before selecting local versus server print delivery.

No database work should begin until these decisions and the Q Cafe module ownership map are recorded. Deferred capabilities should enter the plan only with an owner, user workflow, and acceptance condition.
