# Next Tasks

## Current Priority

- Review the i18n foundation on desktop and a real phone: language toggle visibility, EN/Chinese persistence after refresh, Dashboard/Layout label switching, and unchanged user-entered content.
- Defer full page translations for Budget, Itinerary, Bookings, Packing, and Documents until the foundation is approved.
- Review the simplified Dashboard on desktop and a real phone: compact trip header, Next up card, Needs attention summary, Quick actions, Budget snapshot, folded reminders, and SOS access.
- If approved, commit the Dashboard simplification before starting reusable trip dashboard data-model or i18n work.
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
- Keep standalone Map, Food, and Attractions pages removed unless the user later asks for a real in-app feature beyond Google Maps app links.
- Add real trip details into `src/data/tripData.ts` only when the user provides safe, non-sensitive information.
- Keep the mobile browsing experience clear, practical, and easy for all 4 travellers.
- Postpone full English/Simplified Chinese switching until the website is closer to fully formed.
- When a website change is ready for review, give both the computer URL and phone URL.
- If phone loading appears again after changing Wi-Fi/hotspot, check whether the new LAN IP needs to be added to `next.config.mjs` `allowedDevOrigins`.

## Data Safety

- Follow `REAL_DATA_ENTRY_GUIDE.md` before entering real itinerary, booking, budget, packing, document, or emergency data.
- Do not store real passport numbers, identity documents, payment card details, insurance certificates, or booking confirmation files in the repo.
- Use safe summaries, placeholders, or non-sensitive references for private booking details unless the user explicitly asks for a different handling approach.

## Suggested Next Feature

- After i18n foundation approval, connect one page at a time to the UI-only dictionary without translating user-entered content.
- After Dashboard simplification is approved, plan reusable trip dashboard data-model work separately from UI redesign and bilingual switching.
- After reviewing Documents, decide whether the current per-folder access code is enough for private folder links or whether a later whole-site protection layer is needed before entering more sensitive trip context.
- Review Budget filters, settlement suggestions, lighter expense cards, and misc expense form ergonomics on a real phone.
- Review Booking linked expenses without counting booking `amount` twice.
- Decide whether to add simple shared-password protection before using shared CRUD pages for real private trip details.
- Consider shared-password protection before entering real detailed itinerary notes, hotel addresses, private booking references, or sensitive location context.
- Consider deeper visual polish only after the collapsed mobile flow is reviewed; keep the current pass focused on page weight and tap safety.
- Consider improving packing status controls after real phone review if the four traveler selectors feel heavy on small screens.
- Decide whether to replace placeholder city dates, hotels, and restaurant shortlists with safe real summaries.
- Consider simple shared-password protection before adding real hotel addresses, phone numbers, or other sensitive shared notes beyond the protected Documents folder links.
