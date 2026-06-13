# Next Tasks

## Current Priority

- Use `REAL_DATA_ENTRY_GUIDE.md` and `REAL_DATA_CHECKLIST.md` to manually replace safe placeholder data with non-sensitive real trip summaries.
- Keep real private data out of the repo unless the user later asks to add protection first.
- Review MYR support in Budget, Itinerary linked expenses, Booking linked expenses, and Dashboard ledger widgets on computer and phone.
- Next likely Budget step: final review and commit MYR expense ledger support after user validation.
- Review the shared reminders and bookings CRUD/filter UI on computer and phone when the user is ready.
- Review the shared itinerary CRUD UI on computer and phone, especially long notes and card readability.
- Review the shared packing CRUD UI on computer and phone using the active worktree configuration.
- Review the Dashboard SOS quick-access panel on a real phone, including tap target comfort and bottom-nav clearance.
- Add real trip details into `src/data/tripData.ts` only when the user provides safe, non-sensitive information.
- Keep the mobile browsing experience clear, practical, and easy for all 4 travellers.
- Postpone full English/Simplified Chinese switching until the website is closer to fully formed.
- When a website change is ready for review, give both the computer URL and phone URL.

## Data Safety

- Follow `REAL_DATA_ENTRY_GUIDE.md` before entering real itinerary, booking, budget, packing, document, food, attraction, or emergency data.
- Do not store real passport numbers, identity documents, payment card details, insurance certificates, or booking confirmation files in the repo.
- Use safe summaries, placeholders, or non-sensitive references for private booking details unless the user explicitly asks for a different handling approach.

## Suggested Next Feature

- Review Budget filters, settlement suggestions, and misc expense form ergonomics on a real phone.
- Review Booking linked expenses without counting booking `amount` twice.
- Decide whether to add simple shared-password protection before using the shared reminders/bookings UI for real trip details.
- Consider shared-password protection before entering real detailed itinerary notes, hotel addresses, private booking references, or sensitive location context.
- Consider improving the mobile layout of long booking forms if it feels heavy during review.
- Consider improving packing status controls after real phone review if the four traveler selectors feel heavy on small screens.
- Keep Google Maps jump-out search as the current restaurant/place discovery solution unless the user later requests in-page ratings and reviews through Google Places API.
- Decide whether to replace placeholder city dates, hotels, and restaurant shortlists with safe real summaries.
- Consider simple shared-password protection before adding real hotel addresses, phone numbers, private document links, or other sensitive shared notes.
