# Progress

## 2026-06-13

- Added Budget to the mobile bottom navigation so phone users can reach the unified ledger directly while reviewing itinerary linked expenses.
- Added itinerary linked expenses using the shared expense ledger without changing the expense API schema or adding tables.
- Itinerary cards now load and display ledger expenses where `sourceType = itinerary` and `sourceId` matches the itinerary item id, with inline add/edit/delete for those linked expenses.
- Confirmed itinerary `costAmount` remains only an estimated/reference field; it can prefill the linked expense form but is not automatically counted in Budget.
- Verified `npm.cmd run build`, `npm.cmd run lint`, `/itinerary`, `/budget`, `/packing`, temporary itinerary CRUD, temporary linked expense create/update/delete cleanup, and Budget ledger summary delta.
- Connected the Budget page to the shared expense ledger and added miscellaneous expense CRUD without changing Dashboard, Itinerary, Booking, or linked-expense UI.
- Added a mobile-first Budget ledger client with loading, error, retry, empty state, summary cards, settlement suggestions, filters, expense cards, and inline add/edit form.
- Verified `npm.cmd run build`, `npm.cmd run lint`, `/budget`, `/api/expenses`, Dashboard, Itinerary, and Packing HTTP 200 responses, plus temporary miscellaneous expense create/update/delete cleanup and settlement summary delta.
- Added the shared expense ledger foundation without changing page UI: `expenses` and `expense_splits` tables, shared expense types, MySQL store CRUD, `/api/expenses` routes, and ledger summary calculation.
- Seeded existing static placeholder budget expenses into the ledger only when `expenses` is empty, converting display names like `Person A` to stable traveler IDs like `person_a`.
- Confirmed itinerary `cost_amount` and booking `amount` remain reference fields only and are not automatically converted into ledger expenses.
- Verified `npm.cmd run build`, `npm.cmd run lint`, `/api/expenses` create/update/delete cleanup, and `/api/itinerary`, `/api/bookings`, `/api/packing` HTTP 200 JSON responses on the active dev server.

## 2026-06-12

- Fixed mobile Safari behavior for Google Maps search panels by making simple searches native links and keeping geolocation as an enhancement.
- Verified TypeScript check, production build, HTTP 200 responses for Food/Attractions/Map, and generated Google Maps fallback links.
- Re-verified the completed Google Maps search fix with `pnpm lint`, `pnpm build`, local HTTP 200, LAN HTTP 200, and confirmed the user is currently satisfied with this feature.
- Completed local verification for the shared reminders and bookings prototype.
- Confirmed `mysql2` is installed and `.env.local` is present without recording any secret values.
- Verified `npm.cmd run lint` and `npm.cmd run build` both pass.
- Verified local runtime access for Dashboard and Bookings, plus `GET /api/reminders` and `GET /api/bookings`.
- Verified temporary reminder and booking CRUD flows: create, patch, and delete all succeeded, and temporary verification data was removed.
- User is currently satisfied with shared reminders/bookings and will request follow-up changes later.
- Converted Itinerary from static-only display to shared MySQL/API CRUD while keeping the existing placeholder itinerary as seed data.
- Added `itinerary_items` auto-create/seed support, `/api/itinerary` CRUD routes, city filtering, page-inline add/edit form, card display, safe lightweight Markdown-style rendering, and Google Maps search links.
- Verified `npm.cmd run lint`, `npm.cmd run build`, `/itinerary` HTTP 200, `GET /api/itinerary`, and temporary itinerary create/update/delete on a short-lived local dev server.
- Added the handoff rule that completed website changes must include verified desktop and phone LAN URLs, current port, page HTTP statuses, and related API status.
- Fixed the mobile itinerary dev-server loading issue by allowing the LAN host in Next dev config and adding itinerary API timeout/error retry handling.
- Verified the mobile itinerary fix on port 3100: desktop `/itinerary` 200, phone LAN `/itinerary` 200, `/api/itinerary` returned JSON, and mobile-width add/edit/delete smoke data was created and removed.
- Fixed itinerary `travel_date` off-by-one handling by returning MySQL DATE values as local `YYYY-MM-DD` strings, added date filtering, and verified same-day multiple-item sorting plus mobile add/edit/delete cleanup.
- Fixed mobile itinerary Add/Edit form overflow by constraining form grids, field wrappers, and controls to the card width; verified 320px and 390px mobile viewports plus Add/Edit/Delete cleanup.
- Added an itinerary-form scoped iOS control sizing fix for date/time/select fields after real phone testing still showed native control overflow; build, lint, LAN page/API, Add/Edit/Delete, and filter smoke checks passed.
- Converted Packing List from static checklist to shared MySQL/API CRUD with per-traveler required/packed/not-needed statuses.
- Added configurable placeholder travelers, packing auto-create/seed tables, `/api/packing` CRUD routes, category/priority/status filters, summary cards, page-inline add/edit form, mobile-first item cards, and delete confirmation.
- Verified `npm.cmd run lint` and `npm.cmd run build` both pass. After copying `.env.local` into this worktree without printing secrets, verified `/packing` and `/api/packing` on port 3104, then verified full temporary packing CRUD on port 3105: seed data loaded, create/update/delete succeeded, and temporary data was removed.
- Fixed desktop `/packing` dev loading/hydration issue by allowing local desktop dev origins and adding packing fetch timeout, response validation, error display, and retry handling. Verified desktop/LAN `/packing`, desktop/LAN `/api/packing`, temporary packing CRUD cleanup, `npm.cmd run build`, and `npm.cmd run lint`.

## 2026-06-11

- Completed Phase 2 placeholder pages: Map, Food, Attractions, Packing List, Documents, and More.
- Extended `src/data/tripData.ts` with Phase 2 static data types and safe placeholder data.
- Updated navigation so desktop shows all main pages and mobile uses a compact More entry.
- Verified TypeScript check, production build, and HTTP 200 responses for all new Phase 2 pages.
- Added site-wide English/Simplified Chinese switching with browser-language default, `localStorage` persistence after manual toggle, translated navigation, page copy, filters, status badges, and current static trip data displays.
- Verified the bilingual change with TypeScript check, production build, and local HTTP 200 on the home page.
- Added Google Maps jump-out search panels to Food, Attractions, and Map for nearby live searches without a Google Places API key.
- Verification for this change was attempted, but TypeScript/build commands were blocked by current approval usage limits and pnpm junction read permissions inside the sandbox.
- Added initial shared reminders and bookings implementation: MySQL schema, server API routes, Dashboard reminder CRUD/filter UI, and Bookings CRUD/filter UI. Live dependency/API verification is still blocked until `mysql2` can be installed locally.
