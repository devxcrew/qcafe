# Q Cafe Data Tables

This document defines the planned Q Cafe data scope. It contains 114 proposed tables. It is a planning reference. It does not create database tables, migrations, APIs, or user interfaces.

Source reviewed: `E:\codexsun\codexsun\apps\qcafe\agent\exec\qcafe-table.md`.

## Scope and conventions

The target covers outlet setup, menu, POS, takeaway, KOT, table booking, payment, stock, close, sync, and accounting export. Web and desktop clients are first. Mobile uses the same contracts later.

| Mark | Meaning |
| --- | --- |
| C | Counter core. Required for the first useful counter release. |
| G | Restaurant or growth. Add for the restaurant profile or when the capability is enabled. |
| I | Integration. Add only with an approved contract and business need. |

Every Q Cafe record has an immutable id and business_id. Add location_id where the record needs outlet scope. Mutable records use created_at, updated_at, and a concurrency version. Posted financial, stock, kitchen, and activity records are append-only. Correct them with linked reversal or adjustment records.

Tenant and location ownership must come from the authenticated server context. Clients cannot choose another business or location by changing a request field.

## Scope coverage

| Purpose | Tables | Coverage |
| --- | --- | --- |
| Set up a business and outlet | F01-F08 | Tenant reference, locations, settings, business dates, document sequences, channels, capabilities, and staff assignments. |
| Sell at a counter or online | M01-M15, O01-O09, B01-B10, B19, B22 | Menu, server-owned prices, channels, orders, modifiers, fulfillment, bills, tender allocation, receipts, vouchers, and refunds. |
| Prepare food and drinks | K01-K08 | Station routing, KOT tickets and lines, ticket history, preparation profiles, and batch consumption. |
| Book and serve tables | S01-S10 | Customers, reservations, table assignments, sessions, QR entry, and booking history. |
| Track stock and demand | I01-I16 | Recipes, ledger movements, reservations, daily planning, purchasing, counts, and waste. |
| Work online and offline | F09-F10, P07-P10 | Operational events, server change feed, device registry, cursors, conflict review, and idempotent sync commands. |
| Close a cashier shift and business day | B11-B15 | Cash custody, paid-in and paid-out movements, tender totals, counted cash, variance approval, and day close. |
| Reconcile provider payouts and export accounts | B16-B22, X05 | Provider settlement batches, payment matching, receipt tender links, marketplace settlement, and journals for an external ledger. |
| Print and deliver customer documents | P01-P06 | Routing, durable jobs, attempts, stored document references, and approved delivery records. |

The plan covers POS operations through daily close and accounting export. It does not make Q Cafe a general ledger or accounts-payable system. The external accounting system remains authoritative unless a separate approved scope assigns those functions to Q Cafe.

## Deployment profiles

| Profile | Required capabilities | Deferred capabilities |
| --- | --- | --- |
| Roadside counter | Menu, POS, takeaway, bills, payments, receipt printing, shift close, day close, and approved offline cash flow. | Booking, events, marketplace, lot tracking, and accounting journal export unless selected. |
| Cafe or restaurant | Counter profile plus tables, sessions, KOT, reservations, recipes, and daily planning. | Hotel folio, marketplace, and event quoting unless selected. |
| Bar | Restaurant profile plus age checks, measured stock, and tab rules. | Hotel and event workflows unless selected. |
| Hotel outlet | Restaurant profile plus a verified room or folio payment adapter. | Hotel ledger remains external unless its owner requests another scope. |
| Catering or function business | Restaurant profile plus leads, quotes, deposits, event planning, and follow-up. | Marketplace unless it is an active channel. |

## Delivery phases

| Phase | Scope | Exit condition |
| --- | --- | --- |
| 0. Contracts | Confirm identity, tenancy, tax, storage, sync, payment, printer, and accounting boundaries. | Owners, API contracts, legal rules, and offline limits are approved. |
| 1. Counter clients | Web and desktop POS, outlet setup, menu, counter and takeaway orders, cash settlement, receipts, and the approved offline subset. | One outlet can sell, print or issue an allowed receipt, sync queued work, and close its shift and business day. |
| 2. Restaurant operations | Tables, bookings, KOT, recipes, inventory, and daily plans. | A dine-in order can be booked, prepared, served, billed, and settled with recorded conflicts. |
| 3. Selected integrations | Payment payout matching, accounting export, marketplace, hotel folio, and delivery adapters as selected. | Each selected adapter passes retry, reconciliation, security, and support review. |
| 4. Mobile clients | Mobile POS and service workflows using the existing APIs and sync model. | Mobile clients pass the same permission, duplicate retry, conflict, and recovery checks. |

## Web, desktop, and mobile clients

| Client | Delivery | Data boundary | Offline behavior |
| --- | --- | --- | --- |
| Web POS | First release | Calls the same versioned Q Cafe API as every other client. It never connects to the database directly. | Uses a scoped local cache and command queue. The server validates and applies queued commands after reconnect. |
| Desktop POS | First release | Uses the same API, identity contract, modules, and sync protocol as Web POS. Select the desktop runtime before implementation. | Uses an encrypted local store and durable command queue. It does not own a second business database. |
| Mobile POS and service app | Later phase | Uses the same API and data model. Add mobile-specific device capabilities only when required. | Reuses the command, cursor, and conflict contracts. Do not create mobile copies of business tables. |

Web and desktop clients must support online operation and an approved offline subset. Keep local data scoped to the app, business, location, user, and device. Clear it when identity or scope changes. Never cache provider secrets or full payment credentials.

## Offline and online sync rules

1. Give each client command a globally unique operation id. Store its result so retries cannot create a second order, KOT, payment, or stock movement.
2. Include the entity version observed by the client. Reject or queue conflicting edits for owner review. Never resolve financial or stock conflicts with last-write-wins.
3. Publish committed changes through an ordered server change feed. A device cursor advances only after the client stores the changes and acknowledges them.
4. Keep the server authoritative for identity, permissions, prices, tax, document numbers, stock, payment status, and confirmed reservations.
5. During an outage, allow only explicitly approved commands based on a valid cached capability snapshot. Mark new work pending until the server accepts it.
6. Do not claim card, UPI, provider, tax invoice, or confirmed booking support offline unless the approved provider and legal contracts allow it.
7. Use a provisional client reference offline. Issue the official document number after server acceptance unless an approved legal sequence supports offline numbering.
8. Close the business day only after devices reach the close watermark or a manager records and approves each unresolved device exception.

The first offline subset is cached menu and settings, local counter or takeaway orders, cash tenders, KOT commands, and a local print queue. Sync records to the server after reconnect. Keep reservations pending and do not treat offline stock as authoritative.

Keep the price and settings versions used for an offline order. If the server finds an expired snapshot or a changed price, follow an approved review policy. Never change a confirmed customer total without a recorded adjustment.

IndexedDB or an encrypted desktop store is client-side infrastructure. It is not another set of Q Cafe server tables. The server sync tables record accepted operations, changes, acknowledgements, and conflicts only.

## Settlement boundary

1. Close each cash shift from expected tender totals, counted cash, paid-in or paid-out movements, and an approved variance.
2. Close the business day from accepted orders, bills, refunds, taxes, discounts, tender totals, open shifts, and the device sync watermark.
3. Match gateway and marketplace settlement statements to captured payments, refunds, fees, and net deposits. Record unmatched items for review.
4. Export balanced, idempotent journals through the approved accounting adapter. Keep the external ledger as the accounting source of truth.
5. Keep supplier payables, bank reconciliation, statutory filings, and general ledger maintenance outside Q Cafe unless an approved contract adds them.

## Foundation, Location, User, and Logs

| Table | Fields | Why it is needed |
| --- | --- | --- |
| F01 — `qcafe_businesses` (Core) | `id`, `platform_tenant_id`, legal name, tax profile ref, timezone, currency | Restaurant business boundary. A tenant can operate one or more businesses. |
| F02 — `qcafe_locations` (Core) | `business_id`, code, name, address, timezone, service status | Outlet, kitchen, and stock boundary. Supports branches without copying menu data. |
| F03 — `qcafe_location_settings` (Core) | `location_id`, settings version, effective dates, service options, bill rules, tax profile ref, day-close rule | Keeps outlet configuration versioned so offline clients can identify stale rules. |
| F04 — `qcafe_business_days` (Core) | `location_id`, business date, opened at, closed at, status, close watermark | Makes late-night trading and sync-aware day close explicit. |
| F05 — `qcafe_number_sequences` (Core) | `location_id`, document kind, prefix, next value, sequence version | Produces server-issued document numbers with transactional concurrency control. |
| F06 — `qcafe_service_channels` (Core) | `location_id`, code, kind, enabled | Dine-in, takeaway, delivery, QR, event, and marketplace entry points. |
| F07 — `qcafe_location_capabilities` (Growth) | `location_id`, capability key, enabled from, configuration ref | Enables booking, alcohol, events, marketplace, or remote printing deliberately. |
| F08 — `qcafe_location_staff_assignments` (Core) | `location_id`, `platform_user_id`, operational role, active dates | Assigns a platform user to an outlet role. It does not replace platform permissions. |
| F09 — `qcafe_activity_events` (Core) | event type, actor ref, subject type and id, correlation id, payload ref, occurred at | Append-only operational history for order, payment, stock, kitchen, and device events. |
| F10 — `qcafe_data_change_log` (Core) | sequence, entity type and id, entity version, change kind, safe payload ref, recorded at, origin device ref | Ordered server change feed for clients. Domain tables remain the source of truth. |

Example: a cashier opens an order. `qcafe_activity_events` records `order.opened`, while the order table remains the current state.

## Item Master, Prices, Images, and Availability

| Table | Fields | Why it is needed |
| --- | --- | --- |
| M01 — `qcafe_menu_categories` (Core) | parent id, name, display order, active | Groups food, beverages, packages, and services. |
| M02 — `qcafe_menu_items` (Core) | SKU, name, item type, category id, tax class ref, active | Saleable master item. Item type distinguishes food, beverage, service, and packaged item. |
| M03 — `qcafe_menu_variants` (Core) | item id, code, name, quantity basis, active | Small, regular, large, bottle, and other sellable variants. |
| M04 — `qcafe_price_books` (Core) | location scope, channel scope, currency, effective dates, status | Holds a normal price list and controlled alternatives. |
| M05 — `qcafe_menu_prices` (Core) | price book id, item or variant id, amount, tax inclusion, effective dates | Server-owned price history. |
| M06 — `qcafe_special_campaigns` (Growth) | name, scope, schedule, priority, status | Festival, happy hour, special menu, or function pricing campaign. |
| M07 — `qcafe_special_prices` (Growth) | campaign id, item or variant id, amount or rule, limit | Campaign-specific price with explicit limits. |
| M08 — `qcafe_modifier_groups` (Growth) | name, min and max selections, active | Add-ons such as milk choice, spice level, or toppings. |
| M09 — `qcafe_modifier_options` (Growth) | group id, name, price adjustment, stock item ref | Selectable modifier values. |
| M10 — `qcafe_item_modifier_groups` (Growth) | item or variant id, group id, display order | Connects menu items to permitted modifiers. |
| M11 — `qcafe_media_assets` (Core) | storage object ref, checksum, mime type, width, height, status | Image metadata only. The image binary remains in Platform Storage. |
| M12 — `qcafe_menu_item_media` (Core) | item or variant id, media asset id, usage, display order | Shows menu, QR-order, and delivery images without duplicate files. |
| M13 — `qcafe_item_availability` (Growth) | item or variant id, location id, channel id, date range, status, reason | Stops an item for one outlet, channel, or time window. |
| M14 — `qcafe_allergen_tags` (Growth) | code, name, severity | Allergen master. |
| M15 — `qcafe_item_allergens` (Growth) | item or variant id, allergen tag id, note | Required when menu safety information is published. |

Example: a Diwali sweets campaign uses `qcafe_special_campaigns` and `qcafe_special_prices`. It does not overwrite the normal menu price.

## Seating, Booking, Customer, and QR Entry

| Table | Fields | Why it is needed |
| --- | --- | --- |
| S01 — `qcafe_dining_areas` (Growth) | location id, name, kind, display order, active | Dining room, terrace, bar, or private room. |
| S02 — `qcafe_dining_tables` (Growth) | area id, code, capacity, position label, active | Physical table master. |
| S03 — `qcafe_table_sessions` (Growth) | table id, status, opened at, closed at, primary order id | Current occupancy window. Never use a browser-only table state. |
| S04 — `qcafe_table_session_tables` (Growth) | session id, table id | Supports a combined table session. |
| S05 — `qcafe_customers` (Growth) | name, phone, email, consent flags, external reference | Customer record for booking, receipt delivery, loyalty, and event follow-up. |
| S06 — `qcafe_reservations` (Growth) | customer id, location id, arrival time, party size, status, source, notes, idempotency ref | Booking lifecycle from requested to seated, cancelled, or no-show. Confirm table availability on the server. |
| S07 — `qcafe_reservation_tables` (Growth) | reservation id, table id, assigned at | Planned table assignment. |
| S08 — `qcafe_reservation_events` (Growth) | reservation id, event type, actor ref, note, occurred at | Booking audit and follow-up history. |
| S09 — `qcafe_table_qr_tokens` (Growth) | location id, table id, token hash, version, active dates, revoked at | Rotatable QR entry token. A scan never exposes an internal table id directly. |
| S10 — `qcafe_scanner_profiles` (Integration) | device ref, location id, scan purpose, accepted formats, active | Configures QR or barcode scanners for a specific device and purpose. |

Example: a guest scans a table QR code. The public token resolves to a valid table session or starts the permitted QR ordering flow.

## POS, Takeaway, Parcels, and Delivery

| Table | Fields | Why it is needed |
| --- | --- | --- |
| O01 — `qcafe_orders` (Core) | server number, location id, channel id, customer id, table session id, status, opened by, totals snapshot | One server-owned sale record for counter, web, QR, takeaway, dine-in, and approved partner orders. |
| O02 — `qcafe_order_lines` (Core) | order id, item snapshot, variant snapshot, quantity, unit price, tax snapshot, line status | Immutable sale snapshot after confirmation. |
| O03 — `qcafe_order_line_modifiers` (Growth) | order line id, option snapshot, quantity, price adjustment | Preserves the modifier chosen at sale time. |
| O04 — `qcafe_order_events` (Core) | order id, event type, actor ref, reason, occurred at | Order history including hold, cancel, reopen, and handoff. |
| O05 — `qcafe_fulfillment_jobs` (Core) | order id, kind, status, promised at, ready at, handover at, handler ref | Tracks dine-in service, counter collection, parcel handover, or delivery dispatch. |
| O06 — `qcafe_takeaway_details` (Core) | fulfillment job id, collection name, contact ref, pickup code, pickup window | Collects parcel-specific details without duplicating the order. |
| O07 — `qcafe_delivery_details` (Growth) | fulfillment job id, address ref, delivery partner ref, dispatch state, tracking ref | Own delivery or a verified third-party delivery adapter. |
| O08 — `qcafe_order_adjustments` (Growth) | order id, kind, amount, reason, approval actor ref | Discounts, service recovery, and rounding need explicit approval history. |
| O09 — `qcafe_order_notes` (Growth) | order id or line id, note kind, content, visibility | Guest, kitchen, and internal notes with separate visibility. |

Example: a counter parcel creates one order, one takeaway fulfillment job, kitchen tickets if required, then one bill and payment trail.

## Kitchen Order Tickets and Preparation

| Table | Fields | Why it is needed |
| --- | --- | --- |
| K01 — `qcafe_kitchen_stations` (Growth) | location id, code, name, active | Bar, hot kitchen, bakery, or packing station. |
| K02 — `qcafe_item_station_routes` (Growth) | item or variant id, station id, priority, active | Routes each preparation item to the right station. |
| K03 — `qcafe_kitchen_tickets` (Growth) | number, order id, station id, status, fired at, ready at | Durable KOT header. One order can produce tickets for several stations. |
| K04 — `qcafe_kitchen_ticket_lines` (Growth) | ticket id, order line id, quantity, status, preparation note | Kitchen-specific line state. |
| K05 — `qcafe_kitchen_ticket_events` (Growth) | ticket or line id, event type, actor or device ref, occurred at | Fire, accept, prepare, ready, recall, and void events. |
| K06 — `qcafe_preparation_profiles` (Growth) | item or variant id, lead time, hold time, batch rule | Supports promised-ready estimates and production planning. |
| K07 — `qcafe_production_batches` (Growth) | location id, planned item id, quantity, status, started at, completed at | Daily batch production for regular demand and specials. |
| K08 — `qcafe_production_batch_consumption` (Growth) | batch id, stock item id, planned quantity, actual quantity | Links production to inventory consumption. |

Example: coffee routes to Bar and a sandwich routes to Hot Kitchen. Both tickets can become ready independently before parcel handover.

## Inventory, Reservations, and Daily Planning

| Table | Fields | Why it is needed |
| --- | --- | --- |
| I01 — `qcafe_stock_units` (Core) | code, name, precision, conversion basis | Gram, kilogram, millilitre, piece, bottle, and pack units. |
| I02 — `qcafe_stock_items` (Core) | SKU, name, stock unit id, reorder level, valuation rule, active | Raw material, resale item, packaging, or consumable master. |
| I03 — `qcafe_recipes` (Growth) | menu item or variant id, yield quantity, active dates, version | Standard recipe or bill of materials. |
| I04 — `qcafe_recipe_components` (Growth) | recipe id, stock item id, quantity, loss allowance | Expected ingredient consumption per sale or batch. |
| I05 — `qcafe_stock_lots` (Growth) | stock item id, location id, received date, expiry date, quantity, cost | Lot and expiry tracking where needed. |
| I06 — `qcafe_stock_movements` (Core) | stock item id, location id, lot id, movement kind, quantity, unit cost, source ref, posted at | Single stock ledger for receive, reserve, consume, count, waste, and transfer. |
| I07 — `qcafe_stock_reservations` (Growth) | stock item id, location id, demand source kind and id, quantity, status, expires at | Holds stock for an event, special, confirmed order, or daily plan before use. |
| I08 — `qcafe_daily_plans` (Growth) | location id, business date, status, planner ref, approved by | Daily operational plan. |
| I09 — `qcafe_daily_plan_lines` (Growth) | plan id, demand type, item or recipe id, forecast quantity, planned quantity, source ref | Regular POS forecast, special campaign, booking, and event demand in one plan. |
| I10 — `qcafe_purchase_orders` (Growth) | supplier ref, location id, status, expected date, total | Supplier order workflow. |
| I11 — `qcafe_purchase_order_lines` (Growth) | purchase order id, stock item id, quantity, price, received quantity | Expected purchase quantities. |
| I12 — `qcafe_goods_receipts` (Growth) | purchase order id, location id, received at, receiver ref, status | Records actual delivery from a supplier. |
| I13 — `qcafe_goods_receipt_lines` (Growth) | receipt id, stock item id, lot id, received quantity, accepted quantity, unit cost | Posts accepted stock into the ledger. |
| I14 — `qcafe_stock_counts` (Growth) | location id, status, counted at, approver ref | Stock count session. |
| I15 — `qcafe_stock_count_lines` (Growth) | count id, stock item id, expected quantity, actual quantity, variance reason | Count variance becomes an approved stock movement. |
| I16 — `qcafe_waste_events` (Growth) | stock item or production batch ref, quantity, reason, approval ref | Spoilage, breakage, and kitchen waste. |

Example: a wedding event reserves 20 kg of ingredients. The daily plan sees that reservation before it plans regular counter production.

## Billing, Payments, Vouchers, Accounts, and Settlement

| Table | Fields | Why it is needed |
| --- | --- | --- |
| B01 — `qcafe_bills` (Core) | number, order id, status, currency, subtotal, discount, tax, payable, amount due, tax snapshot, issued at | Customer charge document with immutable prices and tax used for the sale. |
| B02 — `qcafe_bill_lines` (Core) | bill id, order line ref, description snapshot, quantity, tax and amount snapshots | Preserves bill content even if menu data changes. |
| B03 — `qcafe_bill_taxes` (Core) | bill id, tax code ref, rate snapshot, taxable amount, tax amount, rounding rule | Reproduces the tax calculation shown on the bill and receipt. |
| B04 — `qcafe_payment_methods` (Core) | location scope, code, kind, active, configuration ref | Cash, card, UPI, bank transfer, room charge, marketplace collection. |
| B05 — `qcafe_payments` (Core) | location id, method id, purpose, currency, amount, status, provider reference, received at | Records captured money independently of a bill so advances can exist before billing. |
| B06 — `qcafe_payment_tender_details` (Core) | payment id, tender kind, masked reference, approval code, received amount, change amount | Payment-specific details without unsafe card storage. |
| B07 — `qcafe_receipts` (Core) | number, bill id, status, issued at, rendered document ref | Immutable customer receipt for a bill or partial payment. Create before print or delivery. |
| B08 — `qcafe_vouchers` (Growth) | number, kind, customer id, event booking id, source payment id, status, value, issued at, expires at | Records an advance or credit with typed owner links and its source payment. |
| B09 — `qcafe_voucher_applications` (Growth) | voucher id, bill id, applied amount, applied at | Applies an advance or credit to a later bill with a real bill reference. |
| B10 — `qcafe_refunds` (Growth) | original payment id, refund payment id, reason, approver ref, status | Controlled reversal path. Never edit a posted payment. |
| B11 — `qcafe_cash_drawers` (Core) | location id, code, active | Counter cash drawer master. |
| B12 — `qcafe_cash_shifts` (Core) | drawer id, business day id, cashier ref, opening float, status, opened at, closed at | Cash custody window. |
| B13 — `qcafe_cash_movements` (Core) | cash shift id, kind, amount, reason, actor ref, approved by | Cash in, cash out, float adjustment, and safe drop. |
| B14 — `qcafe_shift_settlements` (Core) | cash shift id, expected totals by tender, counted totals, variance, variance reason, approved by, status | Cashier handover and auditable variance resolution. |
| B15 — `qcafe_day_closes` (Core) | business day id, status, sales, refunds, discounts, taxes, tender totals, close watermark, closed by, closed at | Outlet daily close reconciled to accepted online and offline work. |
| B16 — `qcafe_accounting_accounts` (Integration) | code, name, account type, external ledger ref, active | Chart-of-account mapping only when Q Cafe posts to an approved accounting process. |
| B17 — `qcafe_accounting_journals` (Integration) | number, source document ref, status, posted at, external reference | Accounting export or posting header. |
| B18 — `qcafe_accounting_journal_lines` (Integration) | journal id, account id, debit, credit, currency, tax ref | Balanced double-entry lines when required by the external accounting contract. |
| B19 — `qcafe_payment_allocations` (Core) | payment id, bill id or voucher id, allocated amount, currency, allocated at | Links captured payments to bills or advance vouchers. Require exactly one target per allocation. |
| B20 — `qcafe_payment_settlement_batches` (Integration) | provider ref, external batch ref, period, currency, gross, fees, refunds, net, status | Records gateway payout statements for comparison with Q Cafe payment records. |
| B21 — `qcafe_payment_settlement_lines` (Integration) | batch id, payment id or refund id, external transaction ref, gross, fee, net, match status | Matches each provider statement line to a payment or refund. Require exactly one target. |
| B22 — `qcafe_receipt_payments` (Core) | receipt id, payment allocation id, amount shown | Shows which tender allocations appear on a receipt, including split and partial payments. |

Example: an event customer pays an advance. Q Cafe records a payment with purpose `advance`, issues a voucher, and later applies it to the event bill.

## Festival, Function, and Follow-up Workflow

| Table | Fields | Why it is needed |
| --- | --- | --- |
| E01 — `qcafe_event_leads` (Growth) | customer id, source, occasion type, event date, guest count, status, owner ref | First enquiry for a festival package, catering, or function. |
| E02 — `qcafe_event_followups` (Growth) | lead id, scheduled at, outcome, note, owner ref, completed at | Explicit follow-up queue. |
| E03 — `qcafe_event_bookings` (Growth) | lead id, location id, status, event schedule, guest count, customer ref | Confirmed event commitment. |
| E04 — `qcafe_event_requirements` (Growth) | event booking id, category, details, responsible ref, status | Dietary needs, seating, equipment, venue, and decoration requirements. |
| E05 — `qcafe_event_quotes` (Growth) | booking id, number, status, currency, valid until, total | Commercial proposal before confirmed order. |
| E06 — `qcafe_event_quote_lines` (Growth) | quote id, item or service ref, description snapshot, quantity, amount | Food package, rental, service, and custom items. |
| E07 — `qcafe_event_orders` (Growth) | event booking id, order id, role | Links a confirmed event to one or more operational orders. |
| E08 — `qcafe_event_schedule_items` (Growth) | event booking id, starts at, ends at, activity, owner ref, status | Preparation, delivery, service, and collection timeline. |
| E09 — `qcafe_event_tasks` (Growth) | event booking id, task, due at, owner ref, status | Accountable work checklist. |

Example: a festival enquiry becomes a lead, then a follow-up, quote, confirmed booking, advance voucher, production plan, orders, and final settlement.

## Marketplace Orders

| Table | Fields | Why it is needed |
| --- | --- | --- |
| X01 — `qcafe_marketplace_connections` (Integration) | location id, provider, external store ref, status, configuration ref | Swiggy, Zomato, or another supported marketplace connection. |
| X02 — `qcafe_marketplace_menu_mappings` (Integration) | connection id, menu item or variant id, external item ref, status | Maps Q Cafe menu records to partner records. |
| X03 — `qcafe_marketplace_orders` (Integration) | connection id, external order ref, order id, external status, received at | Idempotent partner order intake linked to the normal order. |
| X04 — `qcafe_marketplace_events` (Integration) | marketplace order id, event type, payload reference, received at, processed at | Stores verified webhook processing history. |
| X05 — `qcafe_marketplace_settlements` (Integration) | connection id, external settlement ref, period, gross, fees, net, status | Reconciles marketplace collections. |
## Printers, Documents, Delivery, Devices, and Sync

| Table | Fields | Why it is needed |
| --- | --- | --- |
| P01 — `qcafe_printer_profiles` (Core) | location id, name, transport, device ref, printer name or address, capabilities, active | Printer configuration. Transport is `windows_service`, `web_gateway`, `bluetooth`, `network`, or `browser`. |
| P02 — `qcafe_printer_routes` (Core) | location id, document kind, station or channel scope, printer profile id, copies, priority | Routes receipt, voucher, KOT, token, and report jobs to the correct printer. |
| P03 — `qcafe_print_jobs` (Core) | document kind and ref, route id, render mode, transport, status, requested at, correlation id | Durable print request. Render mode is `preview` or `direct`. |
| P04 — `qcafe_print_attempts` (Core) | print job id, attempt number, device ref, request ref, response code, error, started and completed at | Records every send, retry, acknowledgement, failure, and operator action. |
| P05 — `qcafe_document_files` (Core) | document kind and ref, storage object ref, checksum, format, rendered at | Immutable PDF or print-ready document reference. |
| P06 — `qcafe_document_deliveries` (Growth) | document file id, channel, recipient reference, consent ref, status, provider ref, delivered at | Email PDF, WhatsApp share, or another approved customer delivery channel. |
| P07 — `qcafe_device_profiles` (Core) | platform device ref, location id, client kind, app version, mode, status, last seen at | Registers web, desktop, and later mobile clients under Platform Identity. |
| P08 — `qcafe_sync_cursors` (Core) | device profile id, stream name, last sequence, acknowledged at | Tracks ordered change-feed progress per device. |
| P09 — `qcafe_sync_conflicts` (Core) | device profile id, operation id, entity type and id, base and server versions, reason, status, resolution ref | Makes conflicting offline edits visible and reviewable. |
| P10 — `qcafe_sync_operations` (Core) | operation id, device profile id, command type, payload hash, base version, received at, result ref, status | Deduplicates retried client commands and records accepted or rejected sync results. |

## Coverage review

| Area | Coverage | Review result |
| --- | --- | --- |
| Setup and outlet operations | Business, location, settings, business day, sequence, channel, capability, staff, drawer, and device records. | Covered. Keep identity, permissions, and device trust in Platform Identity. |
| POS and takeaway | One order model uses service channels and fulfillment jobs for counter, dine-in, takeaway, QR, and approved online sources. | Covered. Do not make separate sales tables per channel or client. |
| KOT and preparation | Station routing, tickets, ticket lines, events, production, and stock consumption. | Covered for the restaurant profile. |
| Booking | Customer, reservation, table assignment, table session, QR token, and reservation history. | Covered for basic booking and seating. Waitlists and deposits need product requirements before adding tables. |
| Web and desktop | Both use the same server modules, API, identity scope, and sync contracts. | Covered in the target plan. The desktop runtime and local-store technology remain a decision gate. |
| Mobile later | Reuses existing APIs, operation IDs, cursors, and conflict handling. | Covered without duplicating business tables. Add mobile-specific data only for a proven need. |
| Offline and online sync | Change feed, per-device cursors, idempotent operations, conflict queue, and offline rules. | Covered at the data-contract level. Validate the protocol and recovery behavior before release. |
| Cashier and business-day close | Shift counts, cash movements, variance approvals, tender totals, and sync-aware day close. | Covered for Q Cafe operational settlement. |
| Provider and accounting settlement | Payment payout matching and accounting journal export. | Covered through adapters. A general ledger, bank reconciliation, supplier payables, and statutory filings remain outside this scope. |

## Data ownership and integrity rules

- Use a unique server id for each record. Keep business_id on every Q Cafe record and location_id where outlet scope applies.
- Enforce business and location ownership in server services and foreign-key constraints. Do not trust client-supplied tenant scope.
- Treat text such as “item or variant”, “source kind and id”, and “document kind and ref” as logical choices. Implement typed foreign keys, XOR checks, or owned link tables. Do not use unchecked polymorphic references for core money or stock links.
- Keep order, KOT, reservation, activity, and sync events distinct by purpose. Domain event tables record valid state changes. F09 records operational activity. F10 feeds committed changes to clients. Platform owns security audit and generic delivery outbox contracts.
- Use one currency and a declared precision per monetary value. Store calculation snapshots on bills and order lines. Define tax-inclusive pricing, rounding, discounts, and refund rules before schema implementation.
- Allow more than one bill per order only when split-bill behavior is enabled. Define how bill lines allocate order quantities and how payments apply to each bill.
- Keep stock reservations as availability holds. Post stock movements only when stock is received, consumed, transferred, counted, or written off. Do not subtract the same reservation twice.
- Make posted bills, payments, receipts, journal exports, stock movements, and device activity immutable. Use linked reversals and adjustments for corrections.
- Require unique constraints for business codes, location document numbers, active sequence scopes, external provider references, operation ids, device cursors, and settlement lines.

## State rules to define before implementation

| Subject | Required clarification |
| --- | --- |
| Order | Add explicit hold, cancel, reopen, and adjustment transitions. State which transitions need approval and whether a KOT already sent can be recalled. |
| Payment | Keep the capture separate from allocation. Link each allocation to exactly one bill or advance voucher. Refunds reference the original payment and create a new reversal record. |
| Voucher | State which voucher kinds hold money, discount a sale, or record a refund. Prevent duplicate or over-allocation. |
| Booking | Confirm reservations against current server capacity. Offline requests stay pending until the server confirms them. |
| KOT | Make ticket firing idempotent. Record station acceptance, recall, void, re-fire, and who performed each action. |
| Stock | Reserve availability without posting movement. Post consumption once and link it to its source order, batch, count, or waste record. |
| Shift and day close | Reconcile each tender, unresolved offline device, open order, refund, and variance. Require a reason and authorized approver for exceptions. |
| Sync conflict | Use base and server versions. Resolve through the owning module and record the decision. Never silently overwrite money or stock. |

## Decision gates

1. Confirm tax jurisdiction, invoice rules, offline numbering, retention, and receipt requirements with the responsible business and legal owners.
2. Confirm Platform Identity contracts for user, role, tenant, location, and device scope.
3. Confirm online payment, refund, gateway payout, printer, storage, and accounting adapter contracts.
4. Select the desktop runtime and approve encrypted local storage, backup, revocation, and update behavior.
5. Decide whether the accounting boundary includes supplier payables or bank reconciliation. Add Q Cafe tables only if an owner approves that scope.
6. Test reconnect, duplicate command retry, partial sync, conflict resolution, device replacement, and forced day close before production use.

## Delivery boundary

Build the tables only in their owning Q Cafe modules after these gates close. Deliver web and desktop clients against the same API and schema. Add mobile later against those contracts. Enable restaurant, growth, and integration tables by deployment profile so a counter outlet does not need the full restaurant stack.
