# Decisions

## 2026-06-11

- Keep Phase 2 static-data only with no new dependencies, backend, login, file upload, or cloud sync.
- Keep phone navigation compact by grouping secondary pages under `/more`.
- Use placeholder private links for Documents and avoid storing real sensitive files or identifiers in the repo.
- Use Google Maps URL search for the first live recommendation feature, not Google Places API, so no API key, backend, or billing setup is required.
- For shared reminders and bookings, use a local Next API + MySQL prototype first, with no password protection yet. Revisit shared-password protection before storing real private trip details.

## 2026-06-12

- Google Maps search panels should prefer native anchor links for mobile reliability. Browser geolocation is only an enhancement because iPhone Safari may block async popups and mobile geolocation requires a secure context.

## 2026-06-13

- For Phase 3 Documents, protect individual folder links with per-item access codes only; do not add whole-site password protection yet.
- Store Documents access codes as salted SHA-256 hashes using Node crypto, never as plaintext, and keep real document files in permission-controlled cloud storage outside the repo.

## 2026-06-14

- For public preview deployment, prioritize zero-cost services only: Vercel Hobby for hosting and Aiven for MySQL free tier for shared editable data. Do not create PlanetScale resources unless the user later accepts paid database costs.
- Keep the Vercel deployment URL-accessible without whole-site password protection for now; only existing Documents external links keep per-link passcode protection. Revisit access control before entering sensitive real trip data.
- Use a static `mysql2/promise` import in server data access code because Vercel/Next serverless bundling cannot reliably trace the previous dynamic `eval("require")` loader.

## 2026-06-18

- Treat Italy Trip 2026 as the first reference workspace/prototype for a mobile-first, ready-to-use, per-trip paid Group Trip Command Center, not only as a one-off private trip page.
- First ICP: Singapore/Malaysia outbound small-group trip planners organizing 2-8 person, 5-14 day Europe/Japan/Korea trips; the planner is the buyer and travelers are link users.
- First product version should use guided setup plus rule-based templates, not AI generation or manual custom service.
- First access model should be private unguessable trip link, viewer mode by default, edit passcode for editor mode, and a one-time owner recovery link/token; no full login or traveler accounts yet. Viewer mode can only make low-risk status updates after selecting a traveler identity.
- Pilot commercial model should be SGD 4.90 early access per trip workspace, handled through Free Demo / Manual Pilot first; do not build payment or checkout yet.
- Workspace lifecycle should be active until trip end date plus 60 days, then archived/read-only; do not promise permanent storage.
- The private trip link is for convenience, not high-security storage. Documents and sensitive fields must stay metadata/checklist only with contextual safety hints; do not upload or store passport scans, passport numbers, payment card details, insurance certificates, full confirmation PDFs, private passcodes, or confidential identity information.

## 2026-06-19

- Implement access control as an app-level private link boundary plus server-side API guards, not full login or traveler accounts.
- Store private link tokens, edit passcodes, owner recovery tokens, and editor session tokens only as salted hashes in `trip_access_controls`.
- Keep the current single active trip behavior, but key access-control data by `trip_id` so it does not deepen the single-trip assumption.
- Viewer mode can update only the selected traveler's Packing/Documents status through dedicated status endpoints; core trip data changes still require editor mode.
- Do not add setup wizard, template generation, payment, checkout, multi-trip SaaS dashboard, AI, or database-wide business table migrations in this slice.

## 2026-06-21

- Implement setup generation as rule-based templates only; do not add AI, paid APIs, payment, checkout, full login, or a multi-trip SaaS dashboard in v1.
- Make `/api/setup-generation` editor-only via `requireTripEditor`; viewer/private-link-only users cannot run generation.
- Because current business tables are still single-active-trip tables without `trip_id`, setup generation resets the active starter workspace tables in one server transaction instead of adding a partial multi-trip schema.
- Generated booking checklist items must not include amounts, so Booking-to-Budget auto-sync does not create fake expenses and the shared expense ledger stays empty after generation.
- Keep currency expansion as a fixed supported-currency list for settings, bookings, budget, and setup generation; do not add exchange-rate conversion or live FX APIs in this slice.
- Treat active trip `defaultCurrencies` as the visible/input currency scope for the workspace money UI; existing non-default-currency records are not deleted, but they are hidden from Budget/Dashboard money display and no longer offered in new/edit currency dropdowns.
- Keep the setup generation UI reusable, but treat first workspace entry as a gate instead of a Dashboard section: if active trip `setup_completed_at` is empty, `/` shows only setup questions; successful editor generation stamps `setup_completed_at` and then opens the Dashboard. `/settings` keeps the same generation options for later changes, and the mutation remains editor-only.
- Guided Setup v1 should collect enough starter information before generation to avoid generic demo data: route/cities, dates, traveler count/names, currencies, expense splitting, style, transport, accommodation, and luggage.
- Blank traveler names should be filled with neutral `Traveler N` labels, not legacy `Person A/B/C/D` display labels.
- Destructive setup generation must require both editor mode and an explicit confirmation flag in the API body; disabling the frontend button alone is not enough.

## 2026-06-22

- Keep All Templates Context-Aware Engine v1 rule-based and local: shared derived context may drive route legs, overnight accommodation, day trip return planning, season labels, and seasonal packing, but it must not call external AI, weather, train, price, visa, or booking APIs.
- Keep setup generation schema-light for this slice: budget categories stay in setup summary/trip notes, emergency placeholders stay in notes/documents/reminders, booking amounts stay empty, and the `expenses` ledger remains empty after generation.
- Treat overnight cities and day trip cities as planner-supplied hints. Overnight cities can create accommodation planning; day trip cities should create return-transport planning and must not create accommodation items.
- First-generation booking checklist owners should default to the workspace generation owner, not a rotated traveler assignment. Users can change individual booking owners later in the Bookings page.
- In production with `MYSQL_MANAGED_SCHEMA=true`, allow safe additive compatibility checks during shared data store initialization for `trips.setup_completed_at`, `trip_access_controls`, and supported currency enum expansion. This is not general runtime schema creation: it must not seed data, reset data, or create new business tables.
- Do not run setup generation against the current production `active-trip` during controlled pilot review unless the user explicitly approves replacing existing production workspace data. Even after the workspace-boundary branch, setup generation still replaces active-trip starter content by design.
- Add `trip_id` to existing business tables as a workspace-boundary foundation before supporting multiple real pilot workspaces. The app remains a single active-trip product for now, but CRUD and setup-generation reset must be scoped to `active-trip` so future workspace rows are not accidentally read, changed, or deleted.
- In managed-schema mode, compatibility may safely add/backfill/index `trip_id` on existing business tables, but it still must not seed rows, reset rows, create unrelated business tables, or run setup generation automatically.
- Keep existing business row primary keys globally unique for this slice and use UUIDs for newly setup-generated business rows to reduce future cross-workspace ID collision risk; do not introduce a full multi-trip dashboard or composite-key redesign yet.

## 2026-06-24

- Use Travel Journal skin plus Cockpit interaction for the next private workspace UI direction: warm and personal visually, but still compact, task-led, and mobile-first.
- Scope the first UI implementation slice to Shell + Today only. Audit all private pages for consistency, but do not redesign every page in one branch.
- Treat shadcn as a phased target component direction. If introduced, start with Shell + Today primitives and do not let component migration change routes, APIs, access control, setup generation, or business data behavior.
