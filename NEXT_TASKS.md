# Next Tasks

## Current Priority

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

- After deploying access control and completing first-time access setup, add a lightweight pilot offer page before setup/template generation.
- After the pilot offer page, add guided setup plus rule-based template generation if the user resumes productization work.
- Continue traveler source cleanup only as a focused task that preserves the stable `person_a` to `person_d` IDs and existing business table behavior.
- Decide whether to replace placeholder city dates, hotels, and restaurant shortlists with safe real summaries.
- Consider improving packing status controls after real phone review if the four traveler selectors feel heavy on small screens.
- Consider deeper visual polish only after the user identifies specific mobile usability issues.
