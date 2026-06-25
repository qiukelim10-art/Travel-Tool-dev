# Memory Index

## Project Status

- Long-term product direction is now documented in `PRODUCT_VISION.md`: Italy Trip 2026 is the first reference workspace/prototype for a mobile-first, ready-to-use, per-trip paid Group Trip Command Center.
- A polished public `/pilot` bilingual manual pilot sales page now exists locally on `codex/pilot-offer-page`; it is sanitized, Chinese-first on first visit, workspace-led rather than first-person service-led, framed around benefits for the whole trip group, and has not been deployed to production.
- First target customer is the Singapore/Malaysia outbound small-group trip planner organizing 2-8 person, 5-14 day Europe/Japan/Korea trips; travelers use the shared link, but the planner is the buyer.
- The project is a private, mobile-first Italy trip dashboard for 4 travellers in October 2026.
- `codex/public-vercel-deploy` has a zero-cost production deployment path on Vercel Hobby + Aiven Free MySQL; the live URL is `https://italy-trip-2026-cyan.vercel.app`.
- The user will gradually provide real trip information to replace placeholder data.
- The user has shared the live site link with the 4 travelers for collaborative editing.
- The dashboard's purpose is to keep all 4 travellers synchronized before and during the trip, with fast phone-friendly access to key travel information.
- Phase 1 core areas are complete: Dashboard, Itinerary, Bookings, Budget, and Dashboard-based Emergency quick access.
- More now links to Packing and Documents only; standalone Map, Food, and Attractions pages have been removed from navigation and redirect to `/more`.
- Packing List is now a shared MySQL/API CRUD page with per-traveler required/packed/not-needed statuses.
- English/Simplified Chinese switching exists for system UI labels, but full bilingual/content translation is not the current priority; user-entered trip content should remain untranslated.
- Google Maps links remain available inside travel content where already useful, but standalone Map/Food/Attractions pages are no longer maintained.
- Shared reminders, bookings, itinerary, and packing now use local Next API + MySQL prototype paths with CRUD and filtering.
- Budget now uses the shared expense ledger for its page UI and supports miscellaneous expense CRUD; Itinerary still has linked expense UI, while Booking amounts now auto-sync into Budget as single booking-source expenses.
- Documents is now a shared MySQL/API CRUD checklist with per-traveler statuses and optional protected folder links.
- Bookings, Itinerary, and Budget have a second mobile polish pass focused on collapsed sections and lighter first-screen page weight.
- Dashboard budget overview now reads the unified expense ledger through `/api/expenses` instead of static `tripData.ts` expenses.
- Dashboard information architecture has been simplified: homepage is now a compact overview with Next up, Needs attention, Quick actions, Money snapshot, folded reminders, and SOS quick access instead of page-level management detail.
- i18n foundation now uses global language state with `trip-dashboard-language`, default English, EN/Chinese toggle in Layout, and a UI-only dictionary; user-entered trip content should remain untranslated.
- Budget page system UI is now connected to the UI-only i18n foundation while keeping expense titles, notes, traveler names, currencies, and amounts untranslated.
- Bookings, Itinerary, Packing, and Documents system UI are now connected to the UI-only i18n foundation while keeping user-entered trip content untranslated.
- The shared expense ledger and trip settings currency selector now support EUR, SGD, MYR, USD, CNY, JPY, KRW, GBP, AUD, HKD, TWD, and THB.
- Real-data preparation docs now exist: `REAL_DATA_ENTRY_GUIDE.md` and `REAL_DATA_CHECKLIST.md`.
- A concise bilingual traveler-facing quick-start guide now exists at `USER_GUIDE.md` and `Italy Trip 2026 Quick User Guide.docx`.
- Phase 1 reusable trip dashboard foundation now exists on `codex/trip-settings-foundation`: active trip settings use `trips`, `trip_travelers`, and `trip_route_stops`; `/api/trip-settings` supports read/write for the single active trip, and `/settings` edits trip basics, currencies, timezone, notes, travelers, and route stops.
- Access-control foundation is now deployed to production: first-time private link setup, viewer/editor mode, planner edit passcode, one-time owner recovery token, server-side API guards, and viewer-safe Packing/Documents traveler status updates are active on `https://italy-trip-2026-cyan.vercel.app`.
- Guided Setup + Rule-Based Template Generation v1 now exists locally on `codex/setup-template-generation`: `/settings` has an editor-only generation entry, `/api/setup-generation` requires editor mode, and rule templates cover China city general, China multi-city, Japan general, Korea general, and Generic international.
- Guided setup generation is now the first-entry workspace gate, not a Dashboard section: when `setup_completed_at` is empty, the private workspace shows only template/style/transport/accommodation/luggage questions; after editor generation completes, the user enters the Dashboard. `/settings` keeps the same options for later regeneration.
- Guided Setup v1 now asks for route/cities, dates, traveler count/names, main/additional currencies, expense splitting, trip style, transport, accommodation, and luggage, then shows a preview summary before the destructive confirmation.
- Guided Setup v1 polish now uses unambiguous ISO date summaries, days/nights duration, explicit invalid date validation, user-facing replacement warning copy, disabled generate button until confirmation plus valid setup, and a backend `confirmReplaceStarterContent` guard.
- Japan general template quality sprint is merged to `master` and deployed: generated Japan starter workspaces are substantially richer across packing, documents, bookings, reminders, itinerary shell, budget-category planning, and emergency placeholders.
- All Templates Context-Aware Engine v1 is merged to `master` and deployed: setup generation derives route cities, route legs, overnight cities, day trip cities, duration, season, accommodation, luggage, transport, and currencies, then applies that context across China city, China multi-city, Japan, Korea, and Generic templates.
- The second-round Universal Travel Cockpit UI polish was committed on `codex/ui-skill-research` and merged into `master`; final build/lint, desktop/LAN page/API checks, and mobile no-horizontal-overflow QA passed before merge.
- Workspace boundary foundation is merged to `master` and deployed to production in `dpl_4XGZ3zk2jB839zLgicMBthR13oDu`: existing business tables now receive `trip_id`, active-trip CRUD/setup reset is scoped by `trip_id`, setup-generated internal business row IDs use UUIDs, five-template smoke confirmed `other-trip` sentinel rows are preserved, and user review confirmed Dashboard/Bookings/Budget/Packing/Documents/phone loading are fixed.
- `PRODUCT_LAUNCH_PLAN.md` now defines the roadmap from current deployed prototype to product launch; the immediate next priority is a UI design refresh before deeper product feature work.
- `UI_SHELL_TODAY_AUDIT.md` now captures the first UI redesign branch scope: Travel Journal skin, Cockpit interaction, Shell + Today first, shadcn as a phased target, and no business behavior changes in the first implementation slice.
- `codex/ui-shell-today-journal-cockpit` now has the corrected Shell + Today implementation pass aligned to the supplied mobile/desktop travel-journal cockpit references: app-like shell, serif trip masthead, clearer ticket/map Today card, compact access controls, floating mobile nav, route-preserving CTAs, local SVG `TripRouteMap` rendering for supported countries from current trip settings, and follow-up browser-comment fixes for title sizing, duplicate attention content, reminders styling, brand display, nav icons, 2560px width alignment, and 390px mobile overflow.
- The latest Shell + Today browser-comment pass refines the route map into a vintage postcard illustration: muted parchment card, real local SVG country assets for Japan/Korea/Italy, small circular destination dots, dashed route support, reusable `TripPostmark`, non-stretched SOS rail, and matching top-nav/access/content width.
- The destination-derived visual/SOS coverage now includes local static route-map silhouettes and emergency-contact data for Japan, Korea, China, United Kingdom, France, Italy, Switzerland, Spain, Austria, Czechia, and Hungary. This remains static/local data with no paid map API, no AI map generation, and graceful fallback for unsupported destinations.
- The route-stop-driven Today visual pass now supports multi-country SOS groups and corrected multi-country map dot positioning: a route such as London -> Barcelona -> Paris resolves to GB/ES/FR, shows route dots inside each country panel, and surfaces United Kingdom, Spain, and France emergency-number groups from the same route-derived country list.
- The Shell + Today UI refresh is committed and merged to `master`; local `master` now tracks GitHub `origin/main` at `https://github.com/qiukelim10-art/Travel-Tool-dev` after the initial push.

## Highest Priority Task

- Continue the UI refresh page-by-page: Itinerary, Bookings, Budget, and More/Prep, while keeping APIs, schemas, access control, setup generation, payment, and deployment unchanged unless explicitly requested.
- Review the production access-controlled controlled pilot after workspace-boundary deployment using the private link saved outside the repo at `C:\Users\qiuke\Documents\Italy Trip 2026 Controlled Pilot Access 2026-06-22.txt`.
- Pause deeper feature work while the UI design refresh is underway.
- Do not run setup generation against the current production `active-trip` without explicit destructive approval; current production private-link counts are reminders 11, bookings 14, itinerary 11, expenses 0, packing 16, and documents 11.
- Review the polished local `/pilot` bilingual manual pilot sales page; keep the page framed around the whole group's travel experience rather than planner-only pain. Do not deploy or push until the user explicitly asks.
- GitHub remote `origin` is configured to `qiukelim10-art/Travel-Tool-dev`; local `master` tracks remote `main`.
- Review `codex/setup-template-generation` locally with the first-entry setup gate only if that old branch is explicitly resumed; do not push or deploy until explicitly requested.
- Keep the approved access-control foundation on `master` after merge, but do not deploy production until the user asks for the final batch deployment.
- Before the future production deployment, apply the updated managed schema so `trip_access_controls` exists; after deploy, run first-time access setup, save the private link and one-time owner recovery token outside the app, and share the private link with travelers.
- The live site is stable for now; the user and travel group will enter safe real trip data through the UI.
- Keep `Italy Trip 2026 Quick User Guide.docx` as the traveler quick-start guide.
- Keep memory files focused on current active work; branch-specific review, commit, and merge tasks should only be reintroduced when the user explicitly resumes that branch.
- Decide whether to add simple shared-password protection before entering real private trip details.
- Manually replace safe placeholder data with non-sensitive real trip summaries using `REAL_DATA_ENTRY_GUIDE.md` and `REAL_DATA_CHECKLIST.md` when the user provides approved details.
- Keep sensitive documents, passport numbers, payment details, insurance files, and full booking confirmations out of the repo.

## Key Known Issue

- Aiven Free MySQL can automatically power off after inactivity. If production shared-data APIs return database unavailable or DNS lookup errors again, start the Aiven service first; Vercel environment variables only need changing if the Aiven Service URI changes.
- Real traveller and booking information has not been fully entered yet.
- Some trip content still uses placeholder data only.
- Shared reminders/bookings are verified locally, but there is still no password protection. Revisit security before storing real private trip details.
- The public Vercel deployment is intentionally URL-accessible: anyone with the live link can view and edit shared trip data. Do not enter sensitive real trip details before approving an access-control approach.
- Production access control is active after deployment `dpl_EPWzYqw25cJ3MJya5kHmUuxcTLx8`; unauthenticated workspace API reads now return 401 and private-link viewer reads return 200.
- Real passport numbers, payment card details, full confirmations, private document files, and personal contact details should still not be entered. Documents can store folder links, but real files must stay in permission-controlled cloud storage and passcodes must not be written in notes.
- On local review servers, a desktop `Unknown column 'trip_id' in 'where clause'` error can mean the long-running Next dev process kept an old initialized shared-data-store global after a schema-compatibility code change. The workspace-boundary branch now uses a compatibility version guard so startup reruns the additive migration.

## Important Architecture Note

- `/pilot` is the only current public route bypass in `AppShell`; private workspace pages continue to use `TripAccessProvider`, `TripAccessGate`, and `Layout`. Pilot sales copy stays local to `src/app/pilot/PilotOfferClient.tsx`, not in the private workspace i18n dictionary.
- Product direction is one paid workspace per trip, but the first implementation should not jump to a full multi-trip SaaS dashboard. When adding or substantially changing business data structures, avoid deepening the single active-trip assumption and prefer workspace_id/trip_id-compatible design.
- The private trip link is a convenience boundary, not high-security storage. Treat the workspace as lightweight coordination, not a secure vault, and keep sensitive personal documents, passport scans, payment details, private passcodes, and confidential identity information out of the product.
- First-version workspace generation should be guided setup plus rule-based templates for China city general, China multi-city, Japan, Korea, and Generic international trip fallback. Do not add AI dependency or paid API dependency for workspace generation.
- In the merged workspace-boundary branch, `/api/setup-generation` resets only `active-trip` scoped rows because reminders, bookings, itinerary, expenses, packing, and documents now have `trip_id`; keep the mutation editor-only and clearly confirmed in `/settings`, and still do not run it on production active-trip while existing production data should be preserved.
- Setup generation should never create `Person A/B/C/D` display names for new starter workspaces. User-provided traveler names are kept, and blanks become neutral `Traveler N` labels.
- Setup generation should default first-generation booking checklist `bookedBy` owners to the workspace generation owner, not rotate the work across travelers; users can change owners later in Bookings.
- Japan general template quality sprint keeps the expense ledger empty and represents Japan budget-category planning through setup summary/trip notes, because there is still no separate persisted budget-category table.
- Japan general emergency placeholders currently live in generated trip notes, document checklist, and reminders; there is still no separate editable emergency-card generation table.
- All Templates Context-Aware Engine v1 keeps setup generation rule-based and schema-light: derived context controls route legs, overnight accommodation, day trip return planning, season labels, and seasonal packing across all templates, while budget categories remain generated notes/summary labels and `expenses` stays empty.
- `useTripSettingsView` sends the private share token from URL/localStorage on `/api/trip-settings` so first-load private-link pages can initialize from current active trip settings even before the access provider fetch wrapper is ready.
- Pilot commercial model is SGD 4.90 early access per trip workspace through Free Demo / Manual Pilot first; do not build payment, checkout, billing, or subscription infrastructure yet.
- API routes should not return raw infrastructure errors to the UI. Database/DNS/connection failures should be logged server-side and returned as generic user-facing API errors.
- Deployment prep now supports hosted MySQL configuration with `MYSQL_SSL=true` and can skip runtime schema creation/seed on managed databases with `MYSQL_MANAGED_SCHEMA=true`; local development still defaults to automatic local schema setup.
- Vercel serverless functions require `mysql2/promise` to be statically imported so the dependency is bundled; avoid dynamic `eval("require")` for this runtime dependency.
- Zero-cost Vercel/Aiven preparation files now include `DEPLOYMENT_PREVIEW_GUIDE.md`, `database/managed-schema.sql`, `database/preview-seed.sql`, and `/api/health` for deployment smoke checks.
- Most trip pages still use static data, but reminders, bookings, itinerary, and packing now use local Next API + MySQL prototype paths.
- Active trip settings are separate from business data: `trips`, `trip_travelers`, and `trip_route_stops` seed `active-trip` only when `trips` is empty. On `master`, existing business tables also have `trip_id` and active-trip scoped CRUD, while the app still does not expose a multi-trip dashboard.
- Access control uses `trip_access_controls` keyed by `trip_id` for the current `active-trip`; no database-wide business-table `trip_id` migration has been done.
- With `MYSQL_MANAGED_SCHEMA=true`, production now runs safe additive compatibility checks for `setup_completed_at`, `trip_access_controls`, and expanded currency enums before serving shared data requests; this does not seed or reset workspace data.
- The workspace boundary branch extends safe compatibility checks to add/backfill/index `trip_id` on existing business tables; this still does not seed, reset, or create new business tables in managed-schema mode.
- `/api/trip-settings` returns and updates the active trip, travelers, and route stops. Dashboard and Layout consume it for trip name, date range, destination/route, traveler count, and brand display; trip name, destination, city names, traveler display names, and notes remain untranslated user/data content.
- Expenses, packing, and documents APIs now return active trip travelers with compatible `name/displayOrder` fields. New business forms use active travelers, while existing inactive traveler references remain visible for history.
- Documents uses `document_items` and `document_item_traveler_statuses` through local Next API + MySQL prototype paths; protected list responses intentionally hide `externalUrl`, passcode hash, and salt until `/api/documents/[id]/unlock` succeeds.
- Budget renders the unified expense ledger client with summary cards, settlement suggestions, filters, expense cards, and miscellaneous expense CRUD.
- Budget filters apply only to the visible expense list; summary cards and settlement suggestions intentionally stay based on the full ledger.
- Budget filters are collapsed by default in the mobile polish flow, and individual expense card paid/split/notes details are behind a per-card details toggle.
- Dashboard budget widgets show full-ledger totals, outstanding/settled amounts, top settlement suggestions, and recent expenses with local loading/error handling.
- Dashboard money snapshot intentionally stays compact; full expense ledger review and management should remain on `/budget`.
- Budget and Dashboard summarize supported currencies separately; the app does not perform exchange-rate conversion or use live FX APIs.
- Active trip `defaultCurrencies` now control the visible money workspace: Budget and Dashboard filter money display to those currencies, and Booking/Budget/Itinerary expense currency dropdowns only offer those currencies.
- Itinerary cards can display, add, edit, and delete linked ledger expenses where `sourceType = itinerary` and `sourceId` is the itinerary item id.
- Booking rows/cards no longer expose separate linked expense controls; a positive Booking `amount/currency` automatically creates or updates one `sourceType = booking` expense with paid-by, split traveler, and settled fields from the Booking form.
- Booking-to-Budget sync must stay on Booking create/update/delete only; `/api/bookings` and `/api/expenses` GET paths must remain read-only to avoid concurrent `expense_splits` duplicate-key and deadlock errors.
- Booking Add/Edit is collapsed by default on the page, and its form includes Budget split controls only when amount is filled. Itinerary linked expense sections still keep Add expense visible and move full expense lists/forms behind a details toggle.
- Budget and Itinerary linked expense mobile forms use scoped `mobile-safe-form` protection to reduce iPhone Safari input/date/select overflow risk; Booking uses the same mobile-safe form pattern for its main form and Budget split controls.
- Expense ledger uses stable traveler IDs (`person_a`, `person_b`, `person_c`, `person_d`) for payer and split values; display names should remain presentation-only.
- Itinerary `cost_amount` is not used for Budget; Booking `amount/currency` is the Booking-to-Budget entry point and auto-syncs a single booking-source ledger expense when amount is positive.
- Desktop navigation shows the main pages except Emergency; mobile bottom navigation includes Dashboard, Itinerary, Bookings, Budget, and More.
- Emergency access is now a small SOS quick-action panel on the Dashboard, and `/emergency` redirects back to `/`.
- Do not require every new website change to be bilingual yet; revisit full English/Simplified Chinese switching after the site structure and content are mostly finalized.
- i18n should translate system UI labels/buttons/status/category text only; do not automatically translate itinerary titles, booking descriptions, expense titles, document notes, reminder text, or traveller display names.
- Bookings, Itinerary, Packing, and Documents now follow that same UI-only i18n rule; linked expense titles/notes, item names, document folder URLs, city names, and traveler display names remain original data.
- When asking the user to review a completed website change, provide both the computer URL and a phone URL.
- Each completed website change handoff must include verified desktop and phone LAN URLs, current port, desktop page HTTP status, phone LAN page HTTP status, and related API status; note that phone access requires the same Wi-Fi or hotspot when applicable.
- Next dev LAN testing currently allows `172.20.10.4` and `192.168.0.9` in `next.config.mjs` `allowedDevOrigins`; update this list when the computer's LAN IP changes.
- Live place discovery should stay in the Google Maps app unless the user later asks for a real in-app feature.
- `src/data/tripData.ts` is explicitly marked as safe demo/placeholder seed data; replace only with non-sensitive real details.
- The first UI redesign implementation should keep existing routes, APIs, access behavior, setup generation behavior, and user-entered content rules unchanged. shadcn is a phased target, not a one-branch full-page migration.
- Destination visuals in the private workspace shell must be workspace-derived. Map/postmark labels, visual tone, and route marks should come from `trip.destination`, `routeCities`, and `routeLabel`, and user-entered destination/city text must not be auto-translated.
- Destination visual country detection should prioritize current route cities/route label over older `trip.destination` or trip title text, so route-only edits such as London/Manchester switch the map, postmark, and SOS country instead of sticking to the old workspace destination.
- The strongest source for Today destination visuals is now structured `/settings` route stops. City names are checked before the stop country field, so a route like Shanghai/Suzhou/Hangzhou still renders China even if stale country text remains; multi-country routes can render supported local SVG silhouettes together in the postcard map.
