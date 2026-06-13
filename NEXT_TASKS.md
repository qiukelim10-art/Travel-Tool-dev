# Next Tasks

## Current Priority

- Review the new shared Documents checklist on desktop and a real phone, especially protected folder unlock, Add/Edit form comfort, and card spacing.
- Use `REAL_DATA_ENTRY_GUIDE.md` and `REAL_DATA_CHECKLIST.md` to manually replace safe placeholder data with non-sensitive real trip summaries.
- Keep real private data out of the repo unless the user later asks to add protection first.
- Review MYR support in Budget, Itinerary linked expenses, Booking linked expenses, and Dashboard ledger widgets on computer and phone.
- Next likely Budget step: final review and commit MYR expense ledger support after user validation.
- Review the second Phase 2 mobile polish pass on a real phone: collapsed Booking Add/Edit, compact Booking/Itinerary linked expense summaries, collapsed Budget filters, and lighter Budget expense cards.
- Review the shared reminders and bookings CRUD/filter UI on computer and phone when the user is ready.
- Review the shared itinerary CRUD UI on computer and phone, especially long notes and card readability.
- Review the shared packing CRUD UI on computer and phone using the active worktree configuration.
- Review the shared documents CRUD/unlock UI on computer and phone using the active worktree configuration.
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

- After reviewing Documents, decide whether the current per-folder access code is enough for private folder links or whether a later whole-site protection layer is needed before entering more sensitive trip context.
- Review Budget filters, settlement suggestions, lighter expense cards, and misc expense form ergonomics on a real phone.
- Review Booking linked expenses without counting booking `amount` twice.
- Decide whether to add simple shared-password protection before using shared CRUD pages for real private trip details.
- Consider shared-password protection before entering real detailed itinerary notes, hotel addresses, private booking references, or sensitive location context.
- Consider deeper visual polish only after the collapsed mobile flow is reviewed; keep the current pass focused on page weight and tap safety.
- Consider improving packing status controls after real phone review if the four traveler selectors feel heavy on small screens.
- Keep Google Maps jump-out search as the current restaurant/place discovery solution unless the user later requests in-page ratings and reviews through Google Places API.
- Decide whether to replace placeholder city dates, hotels, and restaurant shortlists with safe real summaries.
- Consider simple shared-password protection before adding real hotel addresses, phone numbers, or other sensitive shared notes beyond the protected Documents folder links.
