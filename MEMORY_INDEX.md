# Memory Index

## Project Status

- The project is a private, mobile-first Italy trip dashboard for 4 travellers in October 2026.
- The user will gradually provide real trip information to replace placeholder data.
- The dashboard's purpose is to keep all 4 travellers synchronized before and during the trip, with fast phone-friendly access to key travel information.
- Phase 1 pages are complete: Dashboard, Itinerary, Bookings, Budget, Emergency.
- Phase 2 placeholder pages are complete: Map, Food, Attractions, Documents, More.
- Packing List is now a shared MySQL/API CRUD page with per-traveler required/packed/not-needed statuses.
- English/Simplified Chinese switching was explored, but the user decided to postpone bilingual work until the website is closer to fully formed.
- Food, Attractions, and Map now include Google Maps jump-out search panels for live nearby recommendations without using a Places API key.
- Shared reminders, bookings, itinerary, and packing now use local Next API + MySQL prototype paths with CRUD and filtering.
- Budget now uses the shared expense ledger for its page UI and supports miscellaneous expense CRUD; Itinerary and Booking linked expense UI have been added.
- Dashboard budget overview now reads the unified expense ledger through `/api/expenses` instead of static `tripData.ts` expenses.
- The shared expense ledger now supports EUR, SGD, and MYR.

## Highest Priority Task

- Wait for the user's next requested improvement to the trip website.

## Key Known Issue

- Real traveller and booking information has not been fully entered yet.
- Some Phase 2 pages still use placeholder data only.
- Shared reminders/bookings are verified locally, but there is still no password protection. Revisit security before storing real private trip details.

## Important Architecture Note

- Most trip pages still use static data, but reminders, bookings, itinerary, and packing now use local Next API + MySQL prototype paths.
- Budget renders the unified expense ledger client with summary cards, settlement suggestions, filters, expense cards, and miscellaneous expense CRUD.
- Budget filters apply only to the visible expense list; summary cards and settlement suggestions intentionally stay based on the full ledger.
- Dashboard budget widgets show full-ledger totals, outstanding/settled amounts, top settlement suggestions, and recent expenses with local loading/error handling.
- Budget and Dashboard summarize EUR, SGD, and MYR separately; the app does not perform exchange-rate conversion.
- Itinerary cards can display, add, edit, and delete linked ledger expenses where `sourceType = itinerary` and `sourceId` is the itinerary item id.
- Booking rows/cards can display, add, edit, and delete linked ledger expenses where `sourceType = booking` and `sourceId` is the booking item id.
- Expense ledger uses stable traveler IDs (`person_a`, `person_b`, `person_c`, `person_d`) for payer and split values; display names should remain presentation-only.
- Itinerary `cost_amount` and booking `amount` are reference fields only unless the user explicitly creates linked ledger expenses from them.
- Desktop navigation shows all main pages; mobile bottom navigation includes Dashboard, Itinerary, Bookings, Budget, Emergency, and More.
- Do not require every new website change to be bilingual yet; revisit full English/Simplified Chinese switching after the site structure and content are mostly finalized.
- When asking the user to review a completed website change, provide both the computer URL and a phone URL.
- Each completed website change handoff must include verified desktop and phone LAN URLs, current port, desktop page HTTP status, phone LAN page HTTP status, and related API status; note that phone access requires the same Wi-Fi or hotspot when applicable.
- Live food/place discovery currently uses Google Maps URLs only; ratings, reviews, opening hours, and reservation details are viewed in Google Maps, not rendered inside the website.
- Google Maps search panels use mobile-safe anchor links first, with browser geolocation only as an enhancement.
