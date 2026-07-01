# Next Tasks

## Current Priority

- Work from fresh user-identified issues only. The recent production Today/Plan destination image mismatch and starter setup mobile UI follow-up are already addressed.
- Current branch is `master`. Latest local commits before this docs sync were `01d3af9 Fix route stop destination images` and `d5ec73f Polish starter workspace setup UI`; the working tree was clean before the docs update.
- Keep the current access, API, database schema, setup generation payloads, payment scope, and user-entered data behavior unchanged unless the user explicitly asks for a functional change.
- Production is live at `https://italy-trip-2026-cyan.vercel.app` and remains private-link gated. Share only private trip links/tokens outside the repo.
- Do not run `/api/setup-generation` or the Settings starter generation flow against production `active-trip` unless the user explicitly approves replacing existing production workspace content.
- If a local review link is needed, first re-check the active LAN IP, port, page HTTP status, `/api/health`, and `/api/access/status`. Local `?trip=` review links are time-specific and must not be written into repo files.
- Stay on free-tier infrastructure. If production shared-data APIs show database unavailable or DNS failures, first check whether the Aiven Free MySQL service has powered off before changing Vercel env vars.

## Data Safety

- Treat the private trip link as a convenience boundary, not high-security storage.
- Follow `REAL_DATA_ENTRY_GUIDE.md` and `REAL_DATA_CHECKLIST.md` before entering real itinerary, booking, budget, packing, document, or emergency information.
- Do not store real passport numbers, identity documents, payment card details, insurance certificates, full booking confirmations, private document files, passcodes, or private trip links in the repo.
- Use safe summaries, placeholders, and non-sensitive references for private booking details unless the user explicitly asks for a protected handling approach.

## Suggested Next Feature

- Handle only fresh production or local review issues reported by the user.
- Replace placeholder city dates, hotels, bookings, restaurants, and budget notes with safe real summaries when the user provides approved details.
- Review the sanitized local `/pilot` branch only if explicitly resumed; do not deploy, push, or add real contact/payment details unless requested.
- Consider a small route-map/SOS smoke script for supported city fixtures if destination visual regressions recur.
- Later product quality can add editable persisted budget categories, an editable emergency-card model, or deeper per-destination content tuning after review-driven fixes are done.
- Continue traveler source cleanup only as a focused task that preserves stable traveler IDs such as `person_a` through `person_d` and existing business-table behavior.
