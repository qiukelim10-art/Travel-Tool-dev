# Next Tasks

## Current Priority

- Review the local Guided Setup + Rule-Based Template Generation v1 branch `codex/setup-template-generation`; do not push or deploy until explicitly requested.
- If the generation slice is accepted, decide whether to commit/merge it before expanding templates or changing schema.
- During local review, confirm whether the first-entry setup gate should remain strictly required until editor generation succeeds, or whether a planner-only "continue without generating" escape hatch is needed later.
- During Guided Setup review, check whether the new starter questions are enough for real pilot users: route/cities, dates, traveler names, currencies, expense splitting, style, transport, accommodation, and luggage.
- Review the Guided Setup polish on phone and desktop: ISO date summaries, days/nights duration, invalid date messaging, disabled generate button before confirmation, and destination country/region label.
- Review the polished local `/pilot` bilingual manual pilot sales page on `codex/pilot-offer-page`; the current copy should be workspace-led, useful to the whole trip group, and avoid first-person service framing. Do not deploy production or push until the user explicitly asks.
- The access-control foundation has been reviewed and approved locally; keep it on `master` after merge, but do not deploy production until the user asks for the final batch deployment.
- Before the future production deployment with `MYSQL_MANAGED_SCHEMA=true`, apply the updated managed schema so `trip_access_controls` exists.
- After deployment, the planner should run first-time access setup, store the private trip link and one-time owner recovery token outside the app, and share only the private trip link with travelers.
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
- If phone loading appears again after changing Wi-Fi/hotspot, check whether the new LAN IP needs to be added to `next.config.mjs` `allowedDevOrigins`.

## Data Safety

- Treat the private trip link as a convenience boundary, not high-security storage.
- Follow `REAL_DATA_ENTRY_GUIDE.md` before entering real itinerary, booking, budget, packing, document, or emergency data.
- Do not store real passport numbers, identity documents, payment card details, insurance certificates, or booking confirmation files in the repo.
- Use safe summaries, placeholders, or non-sensitive references for private booking details unless the user explicitly asks for a different handling approach.

## Suggested Next Feature

- After setup generation review, decide whether v2 should add Europe general, budget category scaffolding, or `trip_id`/workspace-compatible business tables before pilot users use generated workspaces.
- If Guided Setup v1 is accepted, consider adding a non-destructive preview-only mode or setup-history note before adding more templates.
- Later mobile bug batch can focus on setup form density and native date input ergonomics if real phone review finds them awkward; no major mobile layout refactor was done in this polish task.
- After local review and approval of the pilot sales page, decide whether to add real manual contact details for prospects or keep it local until the next product slice.
- After deploying access control and completing first-time access setup, keep `/pilot` as the sanitized public offer page before exposing any real trip workspace.
- Continue traveler source cleanup only as a focused task that preserves the stable `person_a` to `person_d` IDs and existing business table behavior.
- Decide whether to replace placeholder city dates, hotels, and restaurant shortlists with safe real summaries.
- Consider improving packing status controls after real phone review if the four traveler selectors feel heavy on small screens.
- Consider deeper visual polish only after the user identifies specific mobile usability issues.
