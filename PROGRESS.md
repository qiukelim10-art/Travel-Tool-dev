# Progress

## 2026-06-22

- Committed and merged All Templates Context-Aware Engine v1 into `master` as `f9aa6ef`, then added managed-schema production compatibility as `fb3c0b8`.
- Production readiness audit found Vercel Production env vars are present but sensitive values cannot be pulled locally for direct DB schema inspection; added safe managed-schema compatibility so production can add `trips.setup_completed_at`, create `trip_access_controls`, and expand currency enums without seeding or resetting workspace data.
- Deployed `master` to Vercel Production. Alias `https://italy-trip-2026-cyan.vercel.app` is live on deployment `dpl_EPWzYqw25cJ3MJya5kHmUuxcTLx8`.
- Ran first-time production access setup and saved the private trip link, edit passcode, and owner recovery token outside the repo at `C:\Users\qiuke\Documents\Italy Trip 2026 Controlled Pilot Access 2026-06-22.txt`.
- Verified production access control: `/api/health` returned 200, unauthenticated `/api/bookings` and `/api/trip-settings` returned 401, private-link viewer reads returned 200, viewer booking write returned 403, and editor mode created then deleted a temporary booking with no leftover smoke item.
- Did not run production setup generation for the controlled pilot because the protected production workspace still has 47 itinerary items and setup generation resets the active single-trip workspace tables while business tables do not yet have `trip_id`.
- User reviewed and accepted All Templates Context-Aware Engine v1 locally before the commit/merge/deploy sequence.
- Final local validation passed for the accepted setup-generation slice: `npm run lint`, `npm run build`, no `test` script present, CodeGraph status, desktop/LAN page checks, and five-template smoke generation against a temporary MySQL database.
- Final five-template smoke counts: Japan 14 bookings / 7 itinerary / 23 packing / 12 documents / 16 reminders / 12 budget categories; Korea 13 / 7 / 17 / 11 / 12 / 12; China city 11 / 5 / 18 / 11 / 12 / 12; China multi-city 15 / 8 / 18 / 11 / 12 / 12; Generic 12 / 7 / 16 / 11 / 12 / 10. All smoke cases kept `expenses` empty, generated no fake amounts, used no `Person A/B/C/D`, avoided legal visa claims, generated route legs and seasonal packing, and avoided accommodation for day trip cities.
- Continued on `codex/japan-template-quality-sprint-1` with All Templates Context-Aware Engine v1; no worktree, commit, push, or deploy was performed.
- Added shared setup-generation derived context for route cities, route legs, overnight cities, day trip cities, duration, travel month/season, accommodation label, luggage/transport inputs, and selected currencies.
- Extended setup generation input and preview so planners can enter overnight cities and day trip cities separately; day trip cities generate return-transport planning, not accommodation.
- Expanded China city, China multi-city, Japan general, Korea general, and Generic international templates to use route legs, overnight accommodation cities, day trip planning cities, and seasonal packing while keeping booking amounts and the expense ledger empty.
- Kept setup generation rule-based and safe: no external API, AI, visa checker, weather lookup, train lookup, DB migration, payment/login/SaaS, or broad UI redesign was added.
- Updated generated booking checklist ownership so first-generation starter bookings default to the workspace generation owner instead of rotating owners; users can still edit each booking owner later.
- Implemented Japan general template quality sprint locally on `codex/japan-template-quality-sprint-1`; no commit, push, or deploy was performed.
- Expanded Japan general starter generation so the smoke workspace creates 23 packing items, 11 document checklist items, 14 booking checklist items, 14 reminders, 7 itinerary shell days for a 2026-10-01 to 2026-10-07 Osaka -> Kyoto -> Nara route, 12 budget category planning labels, and an empty expense ledger.
- Kept Japan booking amounts and itinerary costs empty, defaulted first-generation booking owners to the workspace generation owner, and avoided `Person A/B/C/D` display names in generated Japan workspace content.
- Kept visa/entry wording as official-source checks only; no legal visa or entry eligibility claims were generated.
- Added Japan emergency-card placeholder content through generated trip notes, document checklist, and reminders because the current setup-generation model does not yet persist a separate editable emergency-card table.
- Updated setup-generation preview wording in English and Chinese so money generation is described as budget categories plus an empty expense ledger, not starter expense records.
- Verified `codegraph status .`, CodeGraph Japan setup-generation references, `npm run lint`, `npm run build`, API smoke generation against temporary database `italy_trip_2026_japan_smoke`, generated content quality checks, no fake amounts, no `Person A/B/C/D`, no legal visa claims, English/Chinese UI smoke, and 390px mobile no-horizontal-overflow smoke.

## 2026-06-21

- Implemented Guided Setup + Rule-Based Template Generation v1 on `codex/setup-template-generation`.
- Added an editor-only setup generation panel in `/settings` that uses the current trip basics, active travelers, route stops, currencies, and selected workspace options as input.
- Added rule-based starter templates for China city general, China multi-city, Japan general, Korea general, and Generic international.
- Added `/api/setup-generation` with `requireTripEditor`; viewer/private-link-only requests return 403 and editor requests generate the starter workspace.
- Generation writes safe starter content for active trip settings, route stops, travelers, reminders, booking checklist, itinerary shell, packing, and documents; booking checklist items do not generate amounts, and the shared expense ledger is reset empty.
- Kept `/pilot` public through the existing `AppShell` public route bypass and kept private workspace routes access-gated.
- Kept payment, checkout, AI, full login, multi-trip SaaS, push, and deployment out of scope.
- Verified `codegraph status .`, CodeGraph setup generation references, `npm run lint`, `npm run build`, desktop/LAN `/pilot` HTTP 200, desktop/LAN unauthenticated `/api/trip-settings` HTTP 401, viewer `/api/setup-generation` HTTP 403, editor `/api/setup-generation` HTTP 200, and desktop/LAN `/settings` plus `/api/trip-settings` HTTP 200 using a temporary local private link.
- Expanded shared currency support from EUR/SGD/MYR to EUR, SGD, MYR, USD, CNY, JPY, KRW, GBP, AUD, HKD, TWD, and THB across settings/forms, API validation, MySQL enums, setup generation, and schema files; still no exchange-rate conversion.
- Verified the expanded currency path with `npm run lint`, `npm run build`, `/settings` HTTP 200, `/api/trip-settings` HTTP 200, and a temporary JPY Booking create/delete through the editor session.
- Moved guided setup generation into a reusable panel used by a first-entry workspace gate and by `/settings`; when active trip `setup_completed_at` is empty, `/` shows only setup questions and hides Dashboard content until editor generation succeeds.
- Made active trip default currencies control the visible money workspace: Budget summaries/list/filter, Dashboard money snapshot, Booking currency dropdown, Budget add-expense dropdown, and Itinerary linked-expense dropdown now use only the selected default currencies.
- Verified the setup gate in the in-app browser: before generation, `/` shows only the template/style/transport/accommodation/luggage questions and no Dashboard cover; after editor generation, it switches to the Dashboard. The local review database was reset to `setup_completed_at = NULL` afterward so the gate remains visible for review.
- Expanded Guided Setup v1 from basic template choices to full starter intake: route/cities text, start/end dates with duration, traveler count and names, main currency, additional currencies, and expense-splitting preference.
- Added a generation preview summary before the destructive confirmation, covering settings, travelers, route stops, itinerary days, bookings, reminders, packing, documents, empty ledger, and split mode.
- Expanded setup options for trip style, transport, accommodation, and luggage while keeping generation rule-based and safe. Blank traveler names now become `Traveler 1`, `Traveler 2`, etc.; the generator no longer creates `Person A/B/C/D` display names.
- Verified the expanded Guided Setup v1 flow with `npm run lint`, `npm run build`, editor generation API 200, viewer generation API 403, unauthenticated `/api/trip-settings` 401, desktop and LAN page/API status checks, Chinese/English UI smoke checks, and 390px mobile no-horizontal-overflow QA.
- Polished Guided Setup v1 before the mobile bug batch: setup dates now show ISO `YYYY-MM-DD` summaries, duration shows days/nights, invalid date ranges show explicit validation, Destination is labeled as destination country/region, the generate button stays disabled until confirmation plus valid setup, and `/api/setup-generation` requires `confirmReplaceStarterContent`.
- Replaced the engineering-style `empty money ledger` copy with user-facing starter workspace replacement wording while keeping Chinese/English local copy in `SetupGenerationPanel`.
- Fixed first-load trip settings fetch for private-link users by letting `useTripSettingsView` send the share token header from the URL/localStorage, so the first-entry setup gate can initialize from current trip settings instead of fallback seed dates.
- Verified the polish with `npm run lint`, `npm run build`, API checks for missing confirmation 400, invalid date range 400, confirmed editor generation 200, viewer generation 403, same-day itinerary count 1, traveler fallback `Traveler 2`, desktop/LAN page checks, Chinese/English UI smoke, Japan/China/Korea currency defaults, and 390px no-horizontal-overflow smoke.
- Implemented the lightweight public `/pilot` manual pilot offer page on `codex/pilot-offer-page` with Chinese-first bilingual copy for the Group Trip Command Center early pilot.
- Refined `/pilot` into a prospect-facing bilingual sales/pilot page: Chinese and English render as separate modes, first visit defaults to Chinese, copy stays page-local, and the page uses a sanitized bitmap hero visual at `public/pilot/command-center-preview.png`.
- Adjusted `/pilot` sales copy away from a planner-only framing: the page now emphasizes that every trip participant can open the same link, see the latest trip version, and use the workspace on mobile.
- Revised `/pilot` again from first-person service copy to workspace-led copy: visible Chinese and English text no longer uses "I/me/my/we/our" or "我/我们", and the deliverables section now includes safe product screenshots for the Today and Money/Prep views.
- Kept CTA behavior manual and static: no form submission, real contact detail, checkout, billing, payment collection, setup wizard, template generation, database write, or AI feature.
- Kept the page sanitized: no real Italy trip details, traveler private information, private links, passcodes, tokens, payment collection, setup wizard, template generation, database writes, or AI features.
- Added a minimal `AppShell` public-route bypass for `/pilot` only; existing workspace routes still render through `TripAccessProvider`, `TripAccessGate`, and `Layout`.
- Updated `next.config.mjs` with the current LAN review IP `192.168.0.7` so phone review can load the local dev server on the same Wi-Fi or hotspot.
- Verified `codegraph status .`, CodeGraph references for `AppShell`, route layout, `/pilot`, access control, and `/api/trip-settings`, `npm run lint`, `npm run build`, desktop `/pilot` HTTP 200, LAN `/pilot` HTTP 200, unauthenticated `/api/trip-settings` HTTP 401 on desktop and LAN, and private `/` plus `/settings` still showing access-control text without pilot content.
- Production deployment and push remain intentionally out of scope.

## 2026-06-19

- Implemented the PRODUCT_VISION access-control phase 1 slice on `codex/access-control-foundation`: private unguessable trip link setup, viewer mode by default, planner edit passcode editor mode, and one-time owner recovery token generation/recovery.
- Added `trip_access_controls` with `trip_id` compatibility for the current `active-trip`; share token, edit passcode, owner recovery token, and editor session token are stored only as salted hashes.
- Added access APIs under `/api/access/*`, server-side viewer/editor/traveler identity guards, and protected existing shared data APIs so reads require the private link and core data writes require editor mode.
- Added viewer-safe traveler status updates for Packing and Documents via `/api/packing/[id]/status` and `/api/documents/[id]/status`; viewer mode must select a traveler identity before changing only that traveler's low-risk status.
- Updated the client shell with an access gate and toolbar for private token setup, traveler identity selection, editor passcode entry, recovery-token reset, and recovery-token rotation.
- Fixed the private-link copy button fallback: constrained browser shells now get a textarea copy fallback, and if clipboard copy is unavailable the toolbar shows the private link for manual selection.
- Kept setup wizard, template generation, payment/checkout, multi-trip SaaS dashboard, AI, and business-table `trip_id` migration out of scope.
- Verified `npm run lint`, `npm run build`, local access smoke checks, desktop/LAN page checks, health/access API checks, unauthenticated core API 401, viewer write 403, viewer status update 200, and editor temporary booking create/delete cleanup.
- User approved the access-control foundation after in-app browser review.
- Re-ran final verification after approval: `npm run lint`, `npm run build`, desktop `/` and `/settings` HTTP 200, LAN `/` and `/settings` HTTP 200, health API HTTP 200, unauthenticated access/core API HTTP 401 as expected, and in-app browser access toolbar/settings UI present.
- Prepared a temporary handoff document at `C:\Users\qiuke\AppData\Local\Temp\italy-trip-2026-access-control-handoff-2026-06-19.md` and generated the suggested commit message during review.
- User requested local commit and merge to `master`, while explicitly deferring production deployment until a later final batch deployment.

## 2026-06-18

- Created `PRODUCT_VISION.md` to align future development around a mobile-first, ready-to-use, per-trip paid Group Trip Command Center product direction.
- Locked first-version product boundaries: Singapore/Malaysia outbound small-group planner ICP, guided setup plus rule-based templates, Europe/Japan/Korea/Generic destination templates, private link plus edit passcode access model, SGD 4.90 early access pilot pricing, trip end plus 60-day lifecycle, metadata-only Documents safety, no AI dependency, no payment integration, and no full login/multi-trip SaaS dashboard yet.
- Added the Security Expectation boundary: the private trip link is for convenience rather than high-security storage, viewer mode can only make low-risk status updates after selecting a traveler identity, and core trip data changes require editor mode.
- Diagnosed and recovered the production shared-data outage: Aiven MySQL free-tier service `mysql-15be2720` had automatically powered off, causing DNS lookup failures and Vercel API 500/503 responses.
- Powered the Aiven MySQL service back on from Chrome; the service moved through `Rebuilding` to `Running`, DNS resolution recovered, and the live site APIs returned HTTP 200 again without changing Vercel environment variables.
- Verified the live site after recovery: `/`, `/bookings`, `/itinerary`, `/budget`, `/api/health`, `/api/bookings`, `/api/itinerary`, `/api/expenses`, and `/api/reminders` all returned HTTP 200.

## 2026-06-14

- Diagnosed a production database outage: the deployed Aiven MySQL hostname no longer resolves, causing Dashboard, Bookings, Itinerary, Budget, and reminders API calls to fail with database connection errors.
- Added shared API error sanitization so database/DNS/internal connection errors are logged server-side but no longer returned verbatim to the UI.
- User reviewed the Booking-to-Budget auto-sync change on desktop and phone and confirmed the feature is satisfactory.
- Re-ran final verification for the approved change: `npm run lint`, `npm run build`, desktop/LAN page and API HTTP 200 checks, and concurrent read checks all passed.
- Prepared a temporary handoff document for the next session and a suggested commit message; no commit has been made yet.
- Fixed the Booking-to-Budget auto-sync regression that caused duplicate `expense_splits` and MySQL deadlock errors on Dashboard, Bookings, Itinerary, and Budget: booking/expense GET paths are read-only again, and booking-source expense sync now runs only during Booking create/update/delete.
- Verified the regression fix with sequential `npm run lint`, `npm run build`, local/LAN page and API HTTP 200 checks, 30 concurrent API reads with all 200 responses, and a temporary Booking create/delete sync test that was cleaned up.
- Reworked Booking budget integration on `codex/compact-itinerary-cards`: Booking no longer exposes separate linked expense controls, and a positive booking `amount/currency` now automatically syncs one `sourceType=booking` expense for Budget summary, Dashboard money snapshot, and settlement suggestions.
- Added Booking form budget split controls for paid-by traveler, split travelers, and settled state; empty or zero booking amounts do not create Budget expenses.
- Added idempotent cleanup/sync for existing booking-source expenses so each booking keeps at most one automatic Budget expense and stale booking expenses are removed when booking amount is empty.
- Verified with `npm run build`, sequential `npm run lint`, local and LAN `/bookings`, `/budget`, `/api/bookings`, `/api/expenses` HTTP 200 checks, temporary booking amount sync create/update/clear/delete cleanup, and Chrome desktop/mobile no-horizontal-overflow QA.
- Checkpoint: the user has shared the live site link with the travel group for collaborative editing; no further UI work is planned unless issues are reported later.
- Added a concise bilingual Chinese/English traveler quick-start guide in both `USER_GUIDE.md` and `Italy Trip 2026 Quick User Guide.docx`, covering where to find information, basic add/edit/delete actions, linked expenses, document access codes, and sensitive information that must not be entered.
- Fixed two post-deploy UI data-source mismatches without changing the broader UI style: Dashboard booking attention now reads `/api/bookings` instead of static seed bookings, clears stale booking rows on request failure/timeout, and Itinerary city filter buttons are generated from current itinerary API items instead of a hardcoded city list.
- Fixed the matching Dashboard itinerary summary mismatch: both Dashboard Next up cards now read `/api/itinerary`, show loading/error/empty states, and no longer display static seed itinerary items when the itinerary page has no shared items.
- Verified the UI data-source fix with `npm run build`, sequential `npm run lint`, local `/`, `/itinerary`, `/api/bookings`, `/api/itinerary` HTTP 200 checks, LAN `192.168.0.2:3000` page/API HTTP 200 checks, and confirmed the live production `/api/bookings` and `/api/itinerary` currently return empty arrays.
- Completed the zero-cost production deployment path on `codex/public-vercel-deploy`: the app is live on Vercel Hobby at `https://italy-trip-2026-cyan.vercel.app` and uses an Aiven Free MySQL service for shared editable data.
- Applied the hosted schema and safe preview seed to Aiven MySQL, set the required Vercel Production environment variables without committing secrets, and kept whole-site password protection out of scope while preserving Documents per-link passcode protection.
- Fixed the Vercel serverless database runtime failure by replacing the dynamic `eval("require")` MySQL loader with a static `mysql2/promise` import so Next/Vercel can bundle the dependency.
- Verified production deployment with `npm run lint`, `npm run build`, Vercel production build, public HTTP 200 checks for `/`, `/api/health`, `/api/trip-settings`, `/api/reminders`, `/api/bookings`, `/api/itinerary`, `/api/expenses`, `/api/packing`, and `/api/documents`, plus a temporary reminder create/delete write test that was cleaned up.
- Prepared the `codex/public-vercel-deploy` branch for Vercel + hosted MySQL preview review without changing UI or app features: package scripts now use portable Next/TypeScript commands, npm is the intended package manager, stale pnpm lockfile was removed, and shared MySQL initialization can be disabled for managed schemas with `MYSQL_MANAGED_SCHEMA=true`.
- Added `MYSQL_SSL` support for hosted MySQL connections and made `.env.example` trackable while keeping real `.env.local` secrets ignored.
- Added `DEPLOYMENT_PREVIEW_GUIDE.md` and `database/preview-seed.sql` so a managed hosted MySQL preview database can be prepared without relying on runtime schema creation; the seed contains only safe placeholder active trip settings, travelers, and route stops.
- Added `database/managed-schema.sql` for hosted database setup and `/api/health` for deployment smoke checks without exposing database error details.
- Verified the deployment-prep changes with `npm.cmd run lint`, `npm.cmd run build`, and a temporary production server smoke check on port 3148 for `/`, `/api/health`, `/api/trip-settings`, `/api/reminders`, `/api/bookings`, `/api/itinerary`, `/api/expenses`, `/api/packing`, and `/api/documents`; all returned HTTP 200.
- Redirected the deployment plan away from PlanetScale after confirming the user requires zero cost: `DEPLOYMENT_PREVIEW_GUIDE.md` now targets Vercel Hobby + Aiven Free MySQL, and the MySQL connection config supports an optional `MYSQL_SSL_CA` value for hosted TLS verification.
- Completed the user-approved second-round Universal Travel Cockpit UI polish on `codex/ui-skill-research`: the Dashboard, Itinerary, Bookings, Budget, Documents, Packing, reminders, and shared navigation now use a denser mobile-first travel control-panel layout while preserving existing functionality.
- Committed the approved UI polish as `24beeab` and merged `codex/ui-skill-research` back into `master`.
- Final verification passed with `npm run build`, sequential `npm run lint`, desktop and phone LAN page/API HTTP 200 checks on port 3000, and Chrome 390px/360px/768px no-horizontal-overflow QA across the main pages.
- Increased mobile information density across the review surfaces: reminder, itinerary, booking, and budget item actions now sit closer to their primary information instead of taking separate full-width rows where possible.
- Reworked Packing item cards into compact checklist rows: traveler statuses now show as four small status cells per item, low-value default metadata is hidden from the list view, and the filter/add area is more compact so users can scan more items without excessive scrolling.
- Verified the dense UI pass with `npm run build`, sequential `npm run lint`, Chrome 390px QA for Dashboard/Itinerary/Bookings/Budget/Packing with no horizontal overflow, desktop/LAN page HTTP 200 checks, and reminders/bookings/expenses/itinerary/packing API HTTP 200 checks.
- Improved Budget and Itinerary form ergonomics after user review: the Budget miscellaneous expense form now opens above summaries/settlements, and the Itinerary add/edit form now has a bottom Close form/Cancel edit button so mobile users do not need to scroll back to the top to dismiss it.
- Verified the form ergonomics update with `npm run build`, sequential `npm run lint`, Chrome 390px Budget/Itinerary form QA, desktop/LAN `/budget` and `/itinerary` HTTP 200 checks, and `/api/expenses` plus `/api/itinerary` HTTP 200 checks.
- Cleaned up the mobile Dashboard after user review: moved the cover dashed border outward, increased cover padding, removed the redundant Quick Actions panel because bottom navigation already provides those entries, and disabled the Next dev indicator so the black bottom-left circle no longer appears during review.
- Verified the cleanup with `npm run build`, sequential `npm run lint`, Chrome 390px screenshot/DOM QA, desktop/LAN page HTTP 200 checks, and core API HTTP 200 checks.
- Restored local review access after the dev server had stopped and the active Wi-Fi LAN IP changed from `192.168.0.9` to `192.168.0.2`: added the new LAN IP to `next.config.mjs`, restarted Next dev on `0.0.0.0:3000`, and verified desktop/LAN pages plus core APIs return 200.
- Refined the mobile Dashboard trip cover after user review: Dates and Crew are now explicit Settings links, Route spans the mobile cover width and links to Plan with the full route visible, and Next up now includes a clear View itinerary button.
- Verified the Dashboard refinement with `npm run build`, sequential `npm run lint`, Chrome 390px mobile QA, and no horizontal overflow on the Dashboard.
- Fixed the latest second-pass UI review issues on `codex/ui-skill-research`: Dashboard quick-action initials were replaced with icons, the SOS panel now opens as a fixed mobile-safe overlay, and the large decorative circles were replaced with lighter route-line accents.
- Diagnosed and fixed the local `Too many connections` failure: stale Next dev/start processes were stopped, and the shared MySQL data store now keeps pools and initialization state on `globalThis` with an initialization promise guard to reduce dev hot-reload pool leaks and concurrent initialization spikes.
- Verified `npm run lint`, `npm run build`, desktop/LAN page and API HTTP 200 checks on port 3000, 60 parallel API requests with all 200 responses, and Browser QA for 390px, 360px, and 768px viewports with no horizontal overflow.
- Implemented the second UI polish pass on `codex/ui-skill-research` using a generic Universal Travel Cockpit direction: abstract route/map/stamp styling, Dashboard trip cover, page-specific timeline/confirmation/ledger/checklist/matrix surfaces, and mobile-first layout tuning.
- Preserved existing functionality, API endpoints, database schema, CRUD flows, filters, language switching, first-round safe-area/focus/live-region behavior, and current test data.
- Verified `npm run build`, sequential `npm run lint`, desktop/LAN page and API HTTP 200 checks on port 3000, and Browser QA for desktop, 390px, 360px, and 768px viewports with no horizontal overflow.

## 2026-06-13

- Fixed a React hydration text mismatch on `codex/fix-hydration-mismatch` without changing visible behavior: trip settings cache is now read after client mount instead of during the initial client render.
- Root cause: `useTripSettingsView` read `localStorage` in the `useState` initializer, so the client could render cached active trip text before hydration while the server rendered fallback text.
- The user reviewed and approved the hydration mismatch fix. Final verification passed with `npm.cmd run build`, `npm.cmd run lint`, desktop/LAN `/`, `/settings`, `/more`, `/api/trip-settings` on port 3135, 390px Settings no-horizontal-scroll, and no new React #418 logs for port 3135.
- Completed final bilingual polish for the Settings entry points on `codex/trip-settings-foundation`: desktop navigation, `/settings`, and the `/more` Trip Settings card now switch between English and Chinese.
- Kept trip/settings user-entered content untranslated; only system UI labels changed.
- Verified `npm.cmd run build`, sequential `npm.cmd run lint`, desktop `/`, `/settings`, `/more`, `/api/trip-settings`, and LAN `/`, `/settings`, `/more`, `/api/trip-settings` all return 200.
- Completed the editable Trip Settings milestone on `codex/trip-settings-foundation`: `/settings` now edits the single active trip basics, default currencies, timezone, notes, travelers, and route stops through `PUT /api/trip-settings`.
- Kept the single active trip boundary: no existing business tables received `trip_id`, no full multi-trip behavior was added, and existing booking/reminder historical name strings are not migrated.
- Made active trip travelers the shared traveler source for expenses, packing, and documents APIs while returning compatible `name/displayOrder` fields for existing clients.
- Added dynamic traveler behavior: existing travelers can be renamed/reordered/deactivated, new travelers get generated stable IDs, active display names must be unique, and new travelers receive default existing packing/document statuses.
- Updated Budget, Dashboard budget, Booking linked expenses, Itinerary linked expenses, Packing, Documents, and Dashboard reminders to use active settings travelers for new form choices while preserving historical inactive references where needed.
- Added a More page entry for Trip Settings without changing main navigation density.
- Verified `npm.cmd run build`, sequential `npm.cmd run lint`, `/api/trip-settings` GET/PUT including invalid payload rollback, desktop/LAN page and API smoke checks, EN/Chinese toggle preserving trip name/route text, 390px Dashboard/Settings no-horizontal-scroll checks, and temporary CRUD cleanup for reminders, bookings, itinerary, expenses, packing, and documents.
- Added Phase 1 Active Trip Settings Foundation without changing existing business tables: new `trips`, `trip_travelers`, and `trip_route_stops` tables are created by the shared MySQL store and `database/schema.sql`.
- Added active trip seed data only when `trips` is empty: `active-trip`, Italy Trip 2026, Italy, 2026-10-08 to 2026-10-18, EUR/SGD/MYR, Europe/Rome, Person A-D, and Rome/Florence/Venice/Milan route stops.
- Added read-only `/api/trip-settings` and shared trip settings types; Dashboard and Layout now read active trip settings for trip name, date range, destination/route, traveler count, and brand text, with `tripData.ts` fallback if the settings API fails.
- Kept existing CRUD/API behavior unchanged: no `trip_id` columns were added to reminders, bookings, itinerary, expenses, packing, or documents, and the expense ledger was not changed.
- Verified `npm.cmd run build`, `npm.cmd run lint`, `/api/trip-settings`, desktop and LAN Dashboard HTTP 200, specified page/API smoke checks, desktop EN/Chinese toggle preserving trip name/route text, 390px mobile no-horizontal-scroll, and temporary CRUD create/update/delete cleanup for reminders, bookings, itinerary, expenses, packing, and documents.
- Connected Bookings, Itinerary, Packing, and Documents system UI labels to the UI-only i18n foundation, including filters, forms, buttons, status/category/priority labels, loading/error/empty states, delete confirmations, linked expense labels, and protected document unlock labels.
- Kept user-entered content untranslated across the core pages: itinerary title/details/location/notes/map query, booking description/location/notes, expense title/notes, packing item name/notes, document title/notes/externalUrl, traveler display names, city names, and currency/amount values still render from original data.
- Verified `npm.cmd run build`, `npm.cmd run lint`, desktop/LAN page smoke checks for Bookings, Itinerary, Packing, Documents, Budget, and Dashboard, API JSON checks for bookings/itinerary/packing/documents/expenses, EN/Chinese page switching, mobile no-horizontal-scroll checks, and temporary CRUD cleanup for bookings, itinerary, packing, documents, protected document unlock, and booking/itinerary linked expenses.
- Connected the Budget page to the UI-only i18n foundation: Budget ledger headings, summary labels, filters, status/category/source labels, misc expense form labels, buttons, loading/error/empty states, settlement labels, and expense card labels now switch between English and Chinese.
- Kept Budget user-entered data untranslated: expense titles, expense notes, traveler display names, currency values, and amount values still render from the original data.
- Added the i18n foundation branch scope: `src/lib/i18n.tsx` now uses a UI-only dictionary with `trip-dashboard-language`, one-time migration from `italy-trip-language`, default English, and persisted EN/Chinese toggle state.
- Added language toggle access in the Layout desktop top nav and mobile top header, and connected Layout navigation plus Dashboard, SOS, Dashboard budget snapshot, and Dashboard reminders basic UI labels.
- Stopped using broad seed-data localization on Dashboard; itinerary titles, booking titles/descriptions, expense titles, reminder text, and traveller display names remain original user/data content.
- Completed Phase 1 Dashboard information architecture simplification: the homepage now uses a compact trip header, lighter Next up itinerary summary, compressed booking attention summary, compact budget snapshot, folded reminders management, and smaller Quick actions.
- Kept reminders CRUD on the Dashboard, but the add/edit form and full list controls are no longer expanded by default.
- Kept Budget full ledger details on `/budget`; the Dashboard now shows only outstanding by currency, small total-spent context, top settlement suggestions, and at most two recent expenses.
- Verified `npm.cmd run build`, `npm.cmd run lint`, desktop/LAN homepage smoke checks, requested page/API HTTP 200 checks, mobile-width no-horizontal-scroll check, SOS interaction, and reminder form expansion.
- Fixed the mobile LAN dev loading/hydration issue for shared widgets by adding the current Wi-Fi LAN IP `192.168.0.9` to `next.config.mjs` `allowedDevOrigins`, while preserving the older hotspot IP `172.20.10.4`.
- Confirmed the issue was not API/DB: desktop and LAN `/api/itinerary`, `/api/expenses`, `/api/reminders`, `/api/bookings`, `/api/documents`, and `/api/packing` all returned 200 JSON; the failing probe was the LAN dev resource origin check returning 403 before the config update.
- Removed standalone Map, Food, and Attractions page entries; `/map`, `/food`, and `/attractions` now redirect to `/more`.
- Removed the unused Google Maps search/directory components and standalone map/restaurant/attraction placeholder exports from `tripData.ts`; Itinerary, Bookings, and Emergency Google Maps links remain available where already used.
- Verified `npm.cmd run build`, `npm.cmd run lint`, desktop/LAN `/`, `/more`, `/itinerary`, `/bookings`, `/budget`, `/packing`, `/documents`, redirect checks for `/map`, `/food`, `/attractions`, and API JSON checks for `/api/itinerary`, `/api/bookings`, `/api/expenses`, `/api/packing`, and `/api/documents`.
- Completed Phase 3 Documents shared checklist: Documents now uses local Next API + MySQL CRUD with per-traveler required/saved/not-needed statuses and optional external folder links.
- Fixed the Documents Add/Edit responsive overflow bug by exempting checkbox/radio controls from `mobile-safe-form` full-width input styling and making the access-code row wrap safely inside the form card.
- Added protected folder links for Documents using Node crypto salted SHA-256 passcode hashes; plaintext passcodes are not stored, and protected `GET /api/documents` responses do not return `externalUrl`, hash, or salt.
- Added `/api/documents`, `/api/documents/[id]`, and `/api/documents/[id]/unlock`, plus `document_items` and `document_item_traveler_statuses` tables with cascade delete.
- Seeded existing safe `tripData.ts` document placeholders into `document_items` only when the table is empty, without adding real private links or files.
- Updated real-data safety docs to allow access-controlled folder links while keeping real PDFs, screenshots, QR codes, receipts, passport scans, full confirmations, card numbers, and passcodes out of the repo and notes.
- Verified `npm.cmd run build`, `npm.cmd run lint`, `/documents`, `/api/documents`, temporary document CRUD/unlock cleanup, LAN `/documents`, LAN `/api/documents`, and regression HTTP 200 checks for `/`, `/budget`, `/itinerary`, `/bookings`, and `/packing`.
- Completed the second Phase 2 mobile polish pass for Bookings, Itinerary, and Budget: Booking Add/Edit is now collapsed by default, Booking and Itinerary linked expense sections show compact summaries before details, Budget filters are collapsed by default, and Budget expense card details are tucked behind a per-card details toggle.
- Kept shared expense ledger behavior unchanged: linked expenses still use their existing `sourceType` and `sourceId`, Budget summary/settlement calculations still use the full ledger, and misc expense CRUD remains scoped to Budget.
- Completed the first Phase 2 mobile safety polish pass for Bookings, Itinerary, and Budget: Booking item delete now confirms before calling DELETE, Booking item action buttons have larger tap targets, and shared `mobile-safe-form` protection covers Booking main/linked expense forms, Budget misc expense form, and Itinerary linked expense form.
- Verified `npm.cmd run build`, `npm.cmd run lint`, desktop/LAN `/bookings`, `/budget`, `/itinerary`, `/api/expenses`, `/api/bookings`, and `/api/itinerary`; the user also confirmed the mobile phone review passed.
- Added real-data preparation docs before private trip details are entered: `REAL_DATA_ENTRY_GUIDE.md` and `REAL_DATA_CHECKLIST.md`.
- Marked `src/data/tripData.ts` seed data as safe demo/placeholder data without changing data structure or CRUD logic.
- Confirmed real passport numbers, payment card details, full confirmations, private document files, and personal contact details should still stay out of the repo unless protection is added later.
- Moved Emergency access from a standalone navigation entry to a small Dashboard SOS quick-access panel with public Italy emergency numbers only.
- `/emergency` now redirects to `/`; desktop and mobile navigation no longer show Emergency, and More has no Emergency entry.
- Verified `npm.cmd run build`, `npm.cmd run lint`, desktop/LAN `/`, `/emergency` redirect, and `/budget`, `/itinerary`, `/bookings`, `/packing` HTTP 200 smoke checks.
- Added MYR support across the shared expense ledger currency model, validation path, MySQL currency enums, money formatting, Budget/Itinerary/Bookings forms, and Dashboard ledger widgets without adding exchange-rate conversion.
- Added Dashboard budget widgets backed by `/api/expenses` and `summarizeExpenseLedger`, replacing the old static expense summary on the homepage while keeping the rest of Dashboard unchanged.
- Dashboard now shows ledger total/outstanding/settled/average outstanding per person by currency, top settlement suggestions, recent expenses, loading/error/retry, empty state, and a Budget link.
- Verified `npm.cmd run build`, `npm.cmd run lint`, desktop/LAN `/`, `/budget`, `/itinerary`, `/bookings`, `/api/expenses`, and temporary misc expense create/edit/delete cleanup with Dashboard ledger summary restore.
- Completed a Budget unified expense closeout review and made small clarity fixes: Budget source labels are now display-friendly, filters explicitly apply only to the expense list, and linked expense edit/delete guidance points to Itinerary or Bookings.
- Verified `npm.cmd run build`, `npm.cmd run lint`, desktop/LAN `/budget`, `/itinerary`, `/bookings`, `/api/expenses`, and full temporary misc/itinerary/booking expense create/edit/delete cleanup with Budget summary restore.
- Added booking linked expenses using the shared expense ledger without changing the expense API schema or adding tables.
- Booking rows/cards now load and display ledger expenses where `sourceType = booking` and `sourceId` matches the booking item id, with inline add/edit/delete for those linked expenses.
- Confirmed booking `amount` remains only an estimated/reference field; it can prefill the linked expense form but is not automatically counted in Budget.
- Verified `npm.cmd run build`, `npm.cmd run lint`, `/bookings`, `/budget`, `/api/bookings`, `/api/expenses`, temporary booking CRUD, temporary linked expense create/update/delete cleanup, and Budget ledger summary delta.
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
