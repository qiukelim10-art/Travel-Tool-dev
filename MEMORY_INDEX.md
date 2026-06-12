# Memory Index

## Project Status

- The project is a private, mobile-first Italy trip dashboard for 4 travellers in October 2026.
- The user will gradually provide real trip information to replace placeholder data.
- The dashboard's purpose is to keep all 4 travellers synchronized before and during the trip, with fast phone-friendly access to key travel information.
- Phase 1 pages are complete: Dashboard, Itinerary, Bookings, Budget, Emergency.
- Phase 2 placeholder pages are complete: Map, Food, Attractions, Packing List, Documents, More.
- English/Simplified Chinese switching was explored, but the user decided to postpone bilingual work until the website is closer to fully formed.
- Food, Attractions, and Map now include Google Maps jump-out search panels for live nearby recommendations without using a Places API key.
- Shared reminders, bookings, and itinerary now have a verified local Next API + MySQL prototype with CRUD and filtering.

## Highest Priority Task

- Wait for the user's next requested improvement to the trip website.

## Key Known Issue

- Real traveller and booking information has not been fully entered yet.
- Phase 2 pages use placeholder data only.
- Shared reminders/bookings are verified locally, but there is still no password protection. Revisit security before storing real private trip details.

## Important Architecture Note

- Most trip pages still use static data, but reminders, bookings, and itinerary now use a verified local Next API + MySQL prototype path.
- Desktop navigation shows all main pages; mobile navigation keeps core links and uses `/more` for secondary tools.
- Do not require every new website change to be bilingual yet; revisit full English/Simplified Chinese switching after the site structure and content are mostly finalized.
- When asking the user to review a completed website change, provide both the computer URL and a phone URL.
- Each completed website change handoff must include verified desktop and phone LAN URLs, current port, desktop page HTTP status, phone LAN page HTTP status, and related API status; note that phone access requires the same Wi-Fi or hotspot when applicable.
- Live food/place discovery currently uses Google Maps URLs only; ratings, reviews, opening hours, and reservation details are viewed in Google Maps, not rendered inside the website.
- Google Maps search panels use mobile-safe anchor links first, with browser geolocation only as an enhancement.
