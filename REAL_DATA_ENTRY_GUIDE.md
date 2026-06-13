# Real Data Entry Guide

This guide defines what can be entered before the trip data becomes real. The site is still a private planning dashboard without password protection, so treat the repository as unsafe for sensitive personal data.

## Before Entering Real Data

- Back up or export the local MySQL database before entering a large amount of real trip data.
- Itinerary, Bookings, Packing, and Expenses are now shared CRUD data. Prefer entering real data through the page UI; changing `src/data/tripData.ts` seed data may not update rows that have already been seeded into the database.
- Do not commit screenshots, PDFs, receipt images, database exports, private files, or `.env.local`.
- Confirm the privacy risk with all travelers before changing display names to real names. Internal stable IDs should remain `person_a`, `person_b`, `person_c`, and `person_d`.
- Recheck public emergency, embassy, and map links from official sources before departure.

## Safe To Enter

- Public city names, dates, and broad daily plans.
- Public attraction names, museum names, train station names, airport names, and restaurant shortlists.
- Non-sensitive hotel summaries such as city, neighborhood, check-in date, and room count.
- Booking status, owner, rough cost estimate, and payment status.
- Expense records after confirming a payment, using traveler IDs or display names only.
- Packing items, quantities, categories, and per-traveler packing status.
- Google Maps search links or search queries for public places.
- Public emergency numbers, embassy public contact pages, and generic medical/pharmacy search links.

## Do Not Enter Yet

- Passport numbers, identity document numbers, birth dates, nationality details, or document scans.
- Payment card numbers, bank account details, insurance certificates, or full policy numbers.
- Full booking confirmation numbers, ticket barcodes, QR codes, or private booking files.
- Full hotel addresses or room details unless the site is protected later.
- Personal phone numbers, home addresses, private email addresses, or sensitive location notes.
- Private cloud links that expose documents without access control.
- Secrets, API keys, database credentials, or `.env.local` values.

## Itinerary Data

Use the Itinerary page or `src/data/tripData.ts` seed data only for safe planning information.

- Replace placeholder city notes with the real city sequence and safe daily summaries.
- Add travel dates, city names, start/end times, public locations, transport notes, meal notes, and rough cost estimates.
- Use `costAmount` as a reference estimate only. It does not count in Budget until a linked expense is created.
- Put `mapQuery` as a public search term such as `Colosseum Rome` or `Roma Termini`.
- Avoid private notes such as exact hotel room details, booking references, or personal document reminders.

## Bookings Data

Use Bookings for booking status tracking, not as a document vault.

- Add real booking title, category, date, rough location, booked-by person, status, and reference amount.
- Keep `amount` as a reference only. Create a linked expense only after confirming payment.
- Do not paste confirmation numbers, ticket numbers, passenger IDs, or full private booking URLs.
- Use notes for safe summaries such as "Refundable until date" or "Check baggage policy" without private identifiers.
- Use `confirmationLink` only for a safe placeholder or a properly access-controlled private folder link.

## Budget And Expenses Data

Budget uses the shared expense ledger.

- Enter a real expense only after payment is confirmed.
- Select the payer, currency, amount, split travelers, expense date, category, and settled status.
- Use linked expenses from Itinerary or Bookings when the cost belongs to a specific itinerary item or booking.
- Keep booking `amount` and itinerary `costAmount` as reference fields unless a linked expense is created.
- Do not store card details, bank transfer references, receipt images, or full invoice numbers.
- Use notes for safe context such as "museum tickets paid by Person A".

## Packing Data

Packing data can be real as long as it avoids identity documents and private numbers.

- Add item name, category, priority, quantity, notes, and each traveler's status.
- Use "Passport" as a checklist item, but do not add passport numbers or scans.
- Add medication categories only if they are safe for the group to see; avoid detailed private medical history.
- Use shared items for adapters, umbrellas, first-aid basics, printed backup itinerary, and offline maps.

## Documents Page

The Documents page is only for safe placeholders and access-controlled links.

- Do not store passport numbers, card numbers, complete confirmation numbers, QR codes, barcodes, or uploaded files.
- Do not paste direct public links to private files.
- Use short labels such as "Flight confirmation private link placeholder" until protection is added.
- Store real files in a private cloud folder shared only with the 4 travelers.
- If a private folder link is added later, confirm its permissions outside this repository.

## Emergency Contacts

Emergency quick access should stay low-risk until protection exists.

- Use public Italy emergency numbers and public consular or embassy contact pages.
- Use generic search links such as `hospital near me` or `pharmacy near me`.
- Do not add traveler personal phone numbers, hotel room details, insurance policy numbers, or bank card numbers.
- If a non-public contact is needed later, add only a safe summary unless password protection is added first.

## Google Maps Links And Search Queries

Prefer durable public searches over fragile private links.

- Use Google Maps search URLs such as `https://www.google.com/maps/search/Colosseum+Rome`.
- For itinerary `mapQuery`, use plain public text like `Milan Duomo rooftop`.
- For hotels, use broad neighborhood searches until the group decides whether exact addresses are safe.
- For food and attractions, link to search results or public place listings, not private saved-list URLs.
- Test links on a phone before the trip.

## Mobile Acceptance Checklist

- Open the Dashboard on a phone using the LAN URL.
- Confirm key trip dates, city route, next deadline, and emergency quick access are readable.
- Confirm Itinerary cards are readable without horizontal scrolling.
- Confirm Bookings list and forms fit the phone screen.
- Confirm Budget totals, filters, and expense cards are readable.
- Confirm Packing item controls are easy to tap.
- Confirm Documents warning is visible before any link list.
- Confirm More page links open Map, Food, Attractions, Packing, and Documents.
- Confirm Google Maps links open correctly on the phone.
- Confirm no sensitive real data is visible in page content, source data, logs, or the repository.
