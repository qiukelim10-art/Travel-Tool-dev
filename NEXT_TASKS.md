# Next Tasks

## Current Priority

- Review the uncommitted `codex/public-vercel-deploy` zero-cost deployment direction change before any deploy, data migration, or commit.
- For zero-cost deployment, follow `DEPLOYMENT_PREVIEW_GUIDE.md`: use Vercel Hobby, create an Aiven for MySQL free tier service, apply `database/managed-schema.sql`, apply `database/preview-seed.sql`, set Vercel Preview env vars, and use `MYSQL_MANAGED_SCHEMA=true`, `MYSQL_SSL=true`, and `MYSQL_SSL_CA`.
- Stop immediately if Vercel or Aiven asks for a paid plan or payment method.
- Confirm the active branch and current user request before resuming any old branch-specific work.
- Decide whether to add simple shared-password protection before entering real private trip details.
- Use `REAL_DATA_ENTRY_GUIDE.md` and `REAL_DATA_CHECKLIST.md` when replacing placeholder data with safe, non-sensitive real trip summaries.
- Keep real private data out of the repo unless the user explicitly asks for a protected handling approach first.
- Keep standalone Map, Food, and Attractions pages removed unless the user later asks for a real in-app feature beyond Google Maps app links.
- Keep the mobile browsing experience clear, practical, and easy for all 4 travellers.
- When a website change is ready for review, give both the computer URL and phone URL with verified page/API status.
- If phone loading appears again after changing Wi-Fi/hotspot, check whether the new LAN IP needs to be added to `next.config.mjs` `allowedDevOrigins`.

## Data Safety

- Follow `REAL_DATA_ENTRY_GUIDE.md` before entering real itinerary, booking, budget, packing, document, or emergency data.
- Do not store real passport numbers, identity documents, payment card details, insurance certificates, or booking confirmation files in the repo.
- Use safe summaries, placeholders, or non-sensitive references for private booking details unless the user explicitly asks for a different handling approach.

## Suggested Next Feature

- Add simple shared-password protection before using shared CRUD pages for real private trip details, if the user approves.
- Continue traveler source cleanup only as a focused task that preserves the stable `person_a` to `person_d` IDs and existing business table behavior.
- Decide whether to replace placeholder city dates, hotels, and restaurant shortlists with safe real summaries.
- Consider improving packing status controls after real phone review if the four traveler selectors feel heavy on small screens.
- Consider deeper visual polish only after the user identifies specific mobile usability issues.
