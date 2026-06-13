# Memory Index

## Project Status

- The project is a private, mobile-first Italy trip dashboard for 4 travellers in October 2026.
- The user will gradually provide real trip information to replace placeholder data.
- The dashboard's purpose is to keep all 4 travellers synchronized before and during the trip, with fast phone-friendly access to key travel information.
- Phase 1 core areas are complete: Dashboard, Itinerary, Bookings, Budget, and Dashboard-based Emergency quick access.
- More now links to Packing and Documents only; standalone Map, Food, and Attractions pages have been removed from navigation and redirect to `/more`.
- Packing List is now a shared MySQL/API CRUD page with per-traveler required/packed/not-needed statuses.
- English/Simplified Chinese switching was explored, but the user decided to postpone bilingual work until the website is closer to fully formed.
- Google Maps links remain available inside travel content where already useful, but standalone Map/Food/Attractions pages are no longer maintained.
- Shared reminders, bookings, itinerary, and packing now use local Next API + MySQL prototype paths with CRUD and filtering.
- Budget now uses the shared expense ledger for its page UI and supports miscellaneous expense CRUD; Itinerary and Booking linked expense UI have been added.
- Documents is now a shared MySQL/API CRUD checklist with per-traveler statuses and optional protected folder links.
- Bookings, Itinerary, and Budget have a second mobile polish pass focused on collapsed sections and lighter first-screen page weight.
- Dashboard budget overview now reads the unified expense ledger through `/api/expenses` instead of static `tripData.ts` expenses.
- Dashboard information architecture has been simplified: homepage is now a compact overview with Next up, Needs attention, Quick actions, Money snapshot, folded reminders, and SOS quick access instead of page-level management detail.
- i18n foundation now uses global language state with `trip-dashboard-language`, default English, EN/Chinese toggle in Layout, and a UI-only dictionary; user-entered trip content should remain untranslated.
- The shared expense ledger now supports EUR, SGD, and MYR.
- Real-data preparation docs now exist: `REAL_DATA_ENTRY_GUIDE.md` and `REAL_DATA_CHECKLIST.md`.

## Highest Priority Task

- Review the new shared Documents checklist and protected folder unlock flow on desktop and a real phone.
- Review the simplified Dashboard on desktop and a real phone before committing `codex/dashboard-simplify`.
- Review the i18n foundation branch on desktop and a real phone before expanding translation coverage to full pages.
- Manually replace safe placeholder data with non-sensitive real trip summaries using `REAL_DATA_ENTRY_GUIDE.md` and `REAL_DATA_CHECKLIST.md`.

## Key Known Issue

- Real traveller and booking information has not been fully entered yet.
- Some trip content still uses placeholder data only.
- Shared reminders/bookings are verified locally, but there is still no password protection. Revisit security before storing real private trip details.
- Real passport numbers, payment card details, full confirmations, private document files, and personal contact details should still not be entered. Documents can store folder links, but real files must stay in permission-controlled cloud storage and passcodes must not be written in notes.

## Important Architecture Note

- Most trip pages still use static data, but reminders, bookings, itinerary, and packing now use local Next API + MySQL prototype paths.
- Documents uses `document_items` and `document_item_traveler_statuses` through local Next API + MySQL prototype paths; protected list responses intentionally hide `externalUrl`, passcode hash, and salt until `/api/documents/[id]/unlock` succeeds.
- Budget renders the unified expense ledger client with summary cards, settlement suggestions, filters, expense cards, and miscellaneous expense CRUD.
- Budget filters apply only to the visible expense list; summary cards and settlement suggestions intentionally stay based on the full ledger.
- Budget filters are collapsed by default in the mobile polish flow, and individual expense card paid/split/notes details are behind a per-card details toggle.
- Dashboard budget widgets show full-ledger totals, outstanding/settled amounts, top settlement suggestions, and recent expenses with local loading/error handling.
- Dashboard money snapshot intentionally stays compact; full expense ledger review and management should remain on `/budget`.
- Budget and Dashboard summarize EUR, SGD, and MYR separately; the app does not perform exchange-rate conversion.
- Itinerary cards can display, add, edit, and delete linked ledger expenses where `sourceType = itinerary` and `sourceId` is the itinerary item id.
- Booking rows/cards can display, add, edit, and delete linked ledger expenses where `sourceType = booking` and `sourceId` is the booking item id.
- Booking Add/Edit is collapsed by default on the page, while Booking and Itinerary linked expense sections keep Add expense visible and move full expense lists/forms behind a details toggle.
- Bookings, Budget, and Itinerary linked expense mobile forms use scoped `mobile-safe-form` protection to reduce iPhone Safari input/date/select overflow risk.
- Expense ledger uses stable traveler IDs (`person_a`, `person_b`, `person_c`, `person_d`) for payer and split values; display names should remain presentation-only.
- Itinerary `cost_amount` and booking `amount` are reference fields only unless the user explicitly creates linked ledger expenses from them.
- Desktop navigation shows the main pages except Emergency; mobile bottom navigation includes Dashboard, Itinerary, Bookings, Budget, and More.
- Emergency access is now a small SOS quick-action panel on the Dashboard, and `/emergency` redirects back to `/`.
- Do not require every new website change to be bilingual yet; revisit full English/Simplified Chinese switching after the site structure and content are mostly finalized.
- i18n should translate system UI labels/buttons/status/category text only; do not automatically translate itinerary titles, booking descriptions, expense titles, document notes, reminder text, or traveller display names.
- When asking the user to review a completed website change, provide both the computer URL and a phone URL.
- Each completed website change handoff must include verified desktop and phone LAN URLs, current port, desktop page HTTP status, phone LAN page HTTP status, and related API status; note that phone access requires the same Wi-Fi or hotspot when applicable.
- Next dev LAN testing currently allows `172.20.10.4` and `192.168.0.9` in `next.config.mjs` `allowedDevOrigins`; update this list when the computer's LAN IP changes.
- Live place discovery should stay in the Google Maps app unless the user later asks for a real in-app feature.
- `src/data/tripData.ts` is explicitly marked as safe demo/placeholder seed data; replace only with non-sensitive real details.
