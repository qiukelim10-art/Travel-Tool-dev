# Next Tasks

## Current Priority

- Current product priority is the free invite-based pilot pivot: update `/pilot` first, then design operator-only creation for independent trip workspaces.
- Current branch is `master`. Latest local commits before this docs sync were `01d3af9 Fix route stop destination images` and `d5ec73f Polish starter workspace setup UI`; the working tree was clean before the docs update.
- Keep the current access, API, database schema, setup generation payloads, and user-entered data behavior unchanged unless the user explicitly asks for a functional change.
- Production is live at `https://italy-trip-2026-cyan.vercel.app` and remains private-link gated. Share only private trip links/tokens outside the repo.
- Do not run `/api/setup-generation` or the Settings starter generation flow against production `active-trip` unless the user explicitly approves replacing existing production workspace content.
- Do not use production `active-trip` as a demo or pilot workspace for outside users. New pilot users need independent workspaces before setup generation is applied.
- Do not add payment, checkout, billing, refund, manual payment, or paid-pilot copy for the next pilot slice.
- If a local review link is needed, first re-check the active LAN IP, port, page HTTP status, `/api/health`, and `/api/access/status`. Local `?trip=` review links are time-specific and must not be written into repo files.
- Stay on free-tier infrastructure. If production shared-data APIs show database unavailable or DNS failures, first check whether the Aiven Free MySQL service has powered off before changing Vercel env vars.

## Data Safety

- Treat the private trip link as a convenience boundary, not high-security storage.
- Follow `REAL_DATA_ENTRY_GUIDE.md` and `REAL_DATA_CHECKLIST.md` before entering real itinerary, booking, budget, packing, document, or emergency information.
- Do not store real passport numbers, identity documents, payment card details, insurance certificates, full booking confirmations, private document files, passcodes, or private trip links in the repo.
- Use safe summaries, placeholders, and non-sensitive references for private booking details unless the user explicitly asks for a protected handling approach.

## Suggested Next Feature

- Update `/pilot` into a free early-access request page.
  - CTA: request a free workspace by email, with WhatsApp optional.
  - Say manual review/manual reply, not instant creation.
  - Remove old paid pilot, SGD pricing, payment, checkout, refund, and manual-payment language.
  - No form submission, backend write, database change, setup generation, clickable demo workspace, or production deploy without review.
  - Explain fit criteria: 2-8 people, 3-14 days, one planner, private-link group sharing, no sensitive documents.
  - Explain service boundary: workspace setup/organization only, not travel planning, booking, visa, insurance, legal, or payment advice.
- After `/pilot`, design the operator-only creation path for independent trip workspaces so new users no longer open the current Italy `active-trip`.
- Replace placeholder city dates, hotels, bookings, restaurants, and budget notes with safe real summaries when the user provides approved details.
- Consider a small route-map/SOS smoke script for supported city fixtures if destination visual regressions recur.
- Later product quality can add editable persisted budget categories, an editable emergency-card model, or deeper per-destination content tuning after review-driven fixes are done.
- Continue traveler source cleanup only as a focused task that preserves stable traveler IDs such as `person_a` through `person_d` and existing business-table behavior.
