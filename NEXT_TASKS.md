# Next Tasks

## Current Priority

- Latest local Today/Stitch browser review comments are addressed on the current uncommitted UI pass: Today is rebuilt from the supplied Stitch workspace zip, route-stop-driven destination and SOS data are connected to Trip Settings, the SOS panel opens near the top instead of under the bottom nav, Next Up reads itinerary, Needs Attention reads bookings, reminders support add/edit/check-hide, Money/Documents show compact summaries, Trip Members use Trip Settings travelers, and the floating FAB is removed. A full Today-card responsive QA pass now covers 320-1920px widths with no measured overflow, overlap, clipped text, or unreachable card content. Continue only from fresh user-identified review issues.
- Latest local browser review comments are addressed on the current UI fix pass: itinerary long detail text expands on click, Bookings no longer shows the default `Next:` hint, and Settings folded headers/route-stop alignment have been corrected. Continue only from fresh user-identified review issues.
- Current `codex/ui-fix` local UI usability pass has passed `npm run lint` and `npm run build`; a fresh local-only private `?trip=` link for port `3108` was regenerated on 2026-06-28 and shared in chat for review. Do not store that token in repo files. The older saved `C:\Users\qiuke\Documents\Italy Trip 2026 Controlled Pilot Access 2026-06-22.txt` token is stale for this local DB.
- Production UI hotfix for the deployed Travel Journal + Cockpit batch is complete: malformed legacy pseudo-icon CSS content caused the browser to stop parsing before the later page styles, making maps/cards/nav appear broken on the live workspace. Production CSSOM, private-link API checks, and desktop browser layout have been rechecked; next work should come from fresh user review only.
- Private-link full-editing access is committed, merged to `master`, pushed to GitHub `origin/main`, and deployed to production. Every private-link user should be able to edit workspace data without entering a separate edit passcode, while unauthenticated API requests should still return 401.
- The UI batch on `codex/ui-bookings-journal-cockpit` has been committed, merged into `master`, pushed to GitHub `origin/main`, and deployed to `https://italy-trip-2026-cyan.vercel.app`.
- The committed UI batch includes the review/reference assets under `Image Reference/` and `output/`, per the user's request to commit everything.
- Next active work should be based on fresh user review of the production UI rather than continuing to broaden this batch automatically.
- Keep this UI batch scoped to presentation and interaction polish. Do not change APIs, schemas, access control, setup generation, payment, or production data unless explicitly requested.
- The Shell + Today UI branch work is committed, merged to `master`, and pushed to GitHub `origin/main` at `qiukelim10-art/Travel-Tool-dev`.
- Keep destination visuals generated from current workspace settings. Maps, postmarks, route pins, and visual tone must derive from `trip.destination`, `routeCities`, and `routeLabel`; do not hardcode Italy, Japan, or any other destination into shared UI components.
- Pause deeper feature work while the UI design refresh is underway. The approved direction is Travel Journal skin plus Cockpit interaction.
- Review the production access-controlled workspace after deployment `dpl_4XGZ3zk2jB839zLgicMBthR13oDu` using the private link saved outside the repo at `C:\Users\qiuke\Documents\Italy Trip 2026 Controlled Pilot Access 2026-06-22.txt`.
- `codex/workspace-boundary-foundation` is merged to `master` and deployed to production. GitHub remote `origin` is now configured and local `master` tracks remote `main`.
- Production preflight and post-deploy smoke confirmed the managed-schema compatibility path is additive, and the protected production workspace currently has reminders 11, bookings 14, itinerary 11, expenses 0, packing 16, and documents 11.
- Do not run production setup generation against the current `active-trip` unless the user explicitly approves resetting the existing production workspace. The merged branch scopes reset by `trip_id`, but generation still replaces active-trip content.
- All Templates Context-Aware Engine v1 and the Japan general template quality sprint are now committed, merged to `master`, and deployed to production.
- During local review, confirm whether the first-entry setup gate should remain strictly required until private-link generation succeeds, or whether a "continue without generating" escape hatch is needed later.
- During Guided Setup review, check whether the new starter questions are enough for real pilot users: route/cities, dates, traveler names, currencies, expense splitting, style, transport, accommodation, and luggage.
- Review the Guided Setup polish on phone and desktop: ISO date summaries, days/nights duration, invalid date messaging, disabled generate button before confirmation, and destination country/region label.
- Review the polished local `/pilot` bilingual manual pilot sales page on `codex/pilot-offer-page`; the current copy should be workspace-led, useful to the whole trip group, and avoid first-person service framing. Do not deploy production or push until the user explicitly asks.
- The access-control model is now private-link full editing in production. Share only the private trip link with travelers; no normal edit passcode should be required.
- The website is stable for now; the user plans to enter safe real trip data directly through the live UI.
- The user has shared the live site link with the 4 travelers for collaborative editing.
- Keep `Italy Trip 2026 Quick User Guide.docx` available as the short traveler quick-start guide.
- The zero-cost production deployment is live at `https://italy-trip-2026-cyan.vercel.app` using Vercel Hobby + Aiven Free MySQL; keep using free-tier resources only.
- Stop immediately if Vercel or Aiven asks for a paid plan or payment method.
- If the live site shows database unavailable again, first check whether the Aiven free-tier MySQL service has automatically powered off and start it again from the Aiven console; update Vercel env vars only if the active Service URI changed.
- Confirm the active branch and current user request before resuming any old branch-specific work.
- Use `REAL_DATA_ENTRY_GUIDE.md` and `REAL_DATA_CHECKLIST.md` when replacing placeholder data with safe, non-sensitive real trip summaries.
- Keep real private data out of the repo unless the user explicitly asks for a protected handling approach first.
- Keep standalone Map, Food, and Attractions pages removed unless the user later asks for a real in-app feature beyond Google Maps app links.
- Keep the mobile browsing experience clear, practical, and easy for all 4 travellers.
- When a website change is ready for review, give both the computer URL and phone URL with verified page/API status.
- If phone loading appears again after changing Wi-Fi/hotspot, check whether the new LAN IP needs to be added to `next.config.mjs` `allowedDevOrigins`; current local review is `192.168.0.7` on port `3107`.

## Data Safety

- Treat the private trip link as a convenience boundary, not high-security storage.
- Follow `REAL_DATA_ENTRY_GUIDE.md` before entering real itinerary, booking, budget, packing, document, or emergency data.
- Do not store real passport numbers, identity documents, payment card details, insurance certificates, or booking confirmation files in the repo.
- Use safe summaries, placeholders, or non-sensitive references for private booking details unless the user explicitly asks for a different handling approach.

## Suggested Next Feature

- After the accepted Itinerary UI branch is committed and merged, start the Bookings page UI refresh using the same Travel Journal + Cockpit direction and preserve all booking CRUD, owner, amount, status, filter, i18n, and access-control behavior.
- If the route-stop-driven Today visuals are accepted, consider adding a small route-map smoke script for supported city fixtures so country detection, multi-country rendering, and SOS country selection can be regression-checked without manual browser setup.
- If the expanded map/SOS coverage is accepted, generate quick smoke workspaces or temporary settings for each supported country to visually confirm map scale, route dot placement, and emergency modal content on desktop and 390px mobile.
- If the user wants more supported countries later, add real local SVG assets and visual city coordinates behind `src/components/TripRouteMap.tsx` while keeping the same workspace-derived `countryCode`, `countryName`, and destination-coordinate data boundary.
- Keep `origin` pointed at `https://github.com/qiukelim10-art/Travel-Tool-dev.git` unless the user explicitly asks to move the project to a different remote.
- Later v2 product quality can add editable persisted budget categories, an editable emergency-card model, or deeper per-destination content tuning after workspace boundary risk is reduced.
- If Guided Setup v1 is accepted, consider adding a non-destructive preview-only mode or setup-history note before adding more templates.
- Later mobile bug batch can focus on setup form density and native date input ergonomics if real phone review finds them awkward; no major mobile layout refactor was done in this polish task.
- After local review and approval of the pilot sales page, decide whether to add real manual contact details for prospects or keep it local until the next product slice.
- After deploying access control and completing first-time access setup, keep `/pilot` as the sanitized public offer page before exposing any real trip workspace.
- Continue traveler source cleanup only as a focused task that preserves the stable `person_a` to `person_d` IDs and existing business table behavior.
- Decide whether to replace placeholder city dates, hotels, and restaurant shortlists with safe real summaries.
- Consider improving packing status controls after real phone review if the four traveler selectors feel heavy on small screens.
- Consider deeper visual polish only after the user identifies specific mobile usability issues.
