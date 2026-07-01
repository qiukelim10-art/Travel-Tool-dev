# Product Launch Plan

Last updated: 2026-07-01

## Purpose

This document defines the path from the current deployed Italy Trip 2026 prototype to a launchable Group Trip Command Center product.

The current product decision is to make the next pilot free, manually reviewed, and invite-based. The immediate product work should update the public `/pilot` page, then create a safe operator-only path for independent trip workspaces so new users do not land in the current Italy `active-trip`.

## Current Baseline

The product is live in production:

- Production URL: `https://italy-trip-2026-cyan.vercel.app`
- Current deployment: production is live on Vercel; check Vercel for the latest deployment id before release work
- Hosting: Vercel Hobby
- Database: Aiven Free MySQL
- Access model: private trip link/token with full editing for authorized users
- Current workspace: single active trip, `active-trip`
- Business tables now have `trip_id` scoping
- `/pilot` exists as the public route bypass, but its old paid/manual-pilot positioning must be updated before it is used for free early access.
- Setup generation still replaces starter workspace content for the target trip. Do not run it against production `active-trip` unless the user explicitly approves replacing existing Italy workspace content.

Current git status:

- `master` tracks GitHub `origin/main` at `https://github.com/qiukelim10-art/Travel-Tool-dev.git`.
- Release work should still verify branch, remote, build, lint, production status, and private-link behavior before push/deploy.

## Product North Star

The final product is a mobile-first, ready-to-use Group Trip Command Center that can create one private workspace per trip.

The product promise:

Request a free early-access workspace, answer a short guided setup through the operator flow, and receive a private mobile workspace that is already useful for the trip group.

It should not feel like an empty dashboard. The workspace should be prefilled with practical, editable trip execution content:

- Today view
- Plan / itinerary shell
- Bookings checklist
- Money categories and shared ledger
- Packing checklist
- Documents checklist
- Emergency card
- Reminders
- Settings and access controls

## First Customer

First target customer:

- Singapore / Malaysia outbound small-group trip planner
- 2-8 travelers
- 3-14 day trips first
- Japan, Korea, China, or generic international trip
- Planner requests the workspace; travelers use the shared private link

Chinese-speaking planners can be the first audience, but the product should keep the existing English / Simplified Chinese UI foundation.

## Non-Negotiable Product Boundaries

Do not build these yet:

- Full login or traveler accounts
- Payment/checkout integration
- Subscription billing
- SaaS multi-trip dashboard
- AI itinerary generator
- Hotel, flight, restaurant, or ticket search
- Sensitive document upload/storage
- Passport number or payment card storage
- Email import or PDF parsing
- Native app
- Full export/PDF/Google Sheets sync
- Realtime collaboration/presence

Keep using:

- Private unguessable trip link
- Full editing for anyone authorized through the private trip link/token
- Rule-based templates, not AI
- Safe document checklist metadata only
- Empty expense ledger after generation, no fake amounts

## Immediate Pause Point

Feature work should pause here.

Next work should be public pilot positioning and workspace-creation product design.

Reason:

- The private workspace UI is now substantially polished enough for free pilot discovery.
- The current public `/pilot` direction still carries old paid-pilot assumptions.
- The current public link still points users toward a single Italy `active-trip` unless an operator creates independent workspaces safely.
- Opening fully self-serve creation now would risk confusing users, replacing production data, or creating unsupported workspaces.

## Phase 1: UI Design Refresh

### Goal

Make the live product feel like a polished mobile-first trip workspace, not a collection of admin pages.

### Design Direction

Target feel:

- Calm, practical, travel-ready
- Mobile-first, but still usable on desktop
- Dense enough for repeated use
- Clear action hierarchy
- Warm enough to feel personal, not SaaS-cold
- Not a marketing landing page inside the private workspace

Avoid:

- Decorative travel brochure style
- Oversized hero sections on workspace pages
- Generic cards everywhere
- One-note beige/green palette
- Heavy gradients/orbs
- Text-heavy explanatory UI
- Mobile layouts that require horizontal scrolling

### Navigation Direction

Move gradually toward:

```text
Today | Plan | Bookings | Money | More
```

Current mapping:

- Dashboard -> Today
- Itinerary -> Plan
- Bookings -> Bookings
- Budget -> Money
- More -> More

Do not rename routes as the first UI task unless the route change is clearly worth it. Start with labels, page hierarchy, and layout.

### UI Work Packages

1. Design audit
   - Review current `/`, `/itinerary`, `/bookings`, `/budget`, `/packing`, `/documents`, `/settings`, and `/pilot`.
   - Capture desktop and 390px mobile screenshots.
   - List visual problems by severity.
   - Identify repeated UI patterns that should become shared classes/components.

2. Design system pass
   - Define typography scale.
   - Define spacing scale.
   - Define color tokens.
   - Define status badge styles.
   - Define compact section headers.
   - Define forms, tables, cards, empty states, error states, and loading states.
   - Keep the implementation close to current Tailwind/CSS setup.

3. Shell and navigation pass
   - Improve mobile top bar and bottom nav.
   - Make the private access toolbar less intrusive.
   - Make language toggle and private-link access state easier to understand.
   - Keep access behavior unchanged.

4. Today page redesign
   - Make Today answer:
     - What is next?
     - What needs attention?
     - What booking is still unresolved?
     - What money item matters?
     - What should travelers do today?
   - Use current APIs.
   - Do not add new backend tables.

5. Plan / itinerary redesign
   - Make day grouping and city context clearer.
   - Improve mobile scanning.
   - Preserve existing CRUD.
   - Keep Google Maps links as external links.

6. Bookings redesign
   - Make owner, status, date, amount, and action priority clearer.
   - Improve filter density.
   - Keep booking-to-budget behavior unchanged.

7. Money redesign
   - Make totals, outstanding amount, settlement suggestions, and ledger list easier to scan.
   - Avoid pretending to replace Splitwise.
   - Keep no exchange-rate conversion.

8. Packing and Documents redesign
   - Make traveler-level status controls easier on phone.
   - Keep Documents safe: checklist and links only, no document uploads.
   - Keep protected external URL behavior.

9. Settings and setup redesign
   - Make setup generation feel like a serious planner workflow.
   - Keep destructive setup confirmation obvious.
   - Do not run setup generation automatically.

10. Public `/pilot` review
   - Decide whether the current pilot page is good enough after the private workspace redesign.
   - Keep it public and sanitized.
   - Do not add payment or form submission yet.

### UI Acceptance Criteria

UI refresh is done only when:

- Desktop and 390px mobile screenshots pass visual review.
- No horizontal overflow on 390px mobile.
- All pages still have loading, error, empty, and button feedback states.
- Private link access still works.
- Private-link full-editing behavior is unchanged.
- English/Chinese UI switching still works.
- User-entered trip content is not auto-translated.
- `npm run lint` passes.
- `npm run build` passes.
- Production deploy smoke passes after release.

## Phase 2: Production Hardening

### Goal

Make the current production app safer to operate during pilot.

### Tasks

1. Configure git remote
   - Add a real remote repository.
   - Push `master`.
   - Document the remote URL in project notes only if it is not sensitive.

2. Add repeatable smoke script
   - Script health check.
   - Script private-link API reads.
   - Script item counts.
   - Avoid printing private tokens.

3. Add production runbook
   - Aiven asleep / database unavailable steps.
   - Vercel env var check steps.
   - Deployment verification checklist.
   - Rollback checklist.

4. Add minimal backups
   - Decide manual MySQL export cadence during pilot.
   - Keep backups outside repo.
   - Do not store private tokens in exports committed to git.

5. Error handling polish
   - Continue returning generic user-facing API errors.
   - Keep detailed database errors server-side only.
   - Improve retry guidance where useful.

### Acceptance Criteria

- Git push works.
- Production smoke can be repeated with one command or a short documented command sequence.
- A pilot operator can recover from Aiven sleep without reading old chat.

## Phase 3: Non-Destructive Setup Preview / History

### Goal

Make setup generation safe enough for real pilot use.

Current issue:

- Setup generation is useful, but applying it replaces current `active-trip` content.
- Even with `trip_id`, the current active workspace can still be overwritten by design.

Required product behavior:

- Planner can preview generated workspace content.
- Planner can review counts and examples.
- Planner must explicitly apply.
- Existing workspace must not be lost without a snapshot.

### Implementation Options

Preferred v1:

- Store setup run metadata and generated JSON preview.
- Do not create new business rows until apply.
- On apply, create a snapshot summary of the target trip counts and settings.
- Apply in one private-link-authorized transaction.
- Keep a simple setup history list in Settings.

Possible tables:

- `setup_runs`
  - `id`
  - `trip_id`
  - `status`
  - `template_id`
  - `input_json`
  - `preview_json`
  - `created_by`
  - `created_at`
  - `applied_at`

Do not build full rollback UI yet unless needed. A manual recovery note is enough for first pilot if snapshots are captured.

### Acceptance Criteria

- Preview does not mutate current workspace.
- Apply requires private-link authorization.
- Apply requires explicit confirmation.
- Apply remains scoped to the intended `trip_id`; for the current single-workspace app this is `active-trip` only with explicit approval.
- Existing production workspace is not reset during testing.
- Five template smoke still passes.

## Phase 4: Controlled Free Invite Workflow

### Goal

Support 3-5 real planner pilots without charging users and without building full public self-serve SaaS.

### Manual Pilot Flow

1. Planner sees public `/pilot`.
2. Planner contacts operator by email, with WhatsApp optional.
3. Operator reviews whether the trip fits the first-version scope.
4. Operator creates an independent starter workspace after the product has a safe operator-only creation path.
5. Operator verifies the workspace and private link.
6. Operator sends the private link to the planner.
7. Planner edits workspace and shares it with travelers.
8. Operator collects feedback after setup and after trip usage.

### Product Requirements

- Keep one active trip in this app until operator-only multi-workspace creation is explicitly built.
- Do not expose real Italy Trip data as public demo.
- Use sanitized screenshots and module explanation for the first `/pilot` revision.
- Do not add a clickable demo workspace in the first free pilot revision.
- Do not charge money, collect payment, mention refunds, or add checkout.
- Say clearly that workspace creation is manually reviewed and not instant.
- Do not run setup generation against production `active-trip` for pilot users.

### Pilot Success Signals

- Planner finishes setup in 10 minutes.
- Planner shares link into group chat.
- At least two travelers open workspace.
- Group uses at least three modules.
- Planner says it beats Google Sheets plus group chat.
- Planner would recommend it to another trip organizer.
- Planner requests another workspace or says they would use it for a future trip.

## Phase 5: Workspace Lifecycle

### Goal

Make the product promise operational.

### Tasks

- Add archive/read-only concept after trip end plus 60 days.
- Add manual deletion process for pilot.
- Add copy that explains storage is not permanent.
- Keep sensitive data out of product.

### Acceptance Criteria

- Workspace lifecycle rules are visible in operator docs.
- No permanent-storage promise in UI copy.
- No sensitive file upload appears.

## Phase 6: Template Quality Expansion

### Goal

Improve generated workspace quality after UI and safe preview are in place.

### Priority

1. Japan general refinement
2. Korea general refinement
3. China city general refinement
4. China multi-city refinement
5. Generic international fallback

Later:

- Tokyo / Osaka-Kyoto
- Seoul / Busan / Jeju
- Shanghai / Beijing / Guangzhou-Shenzhen
- Taiwan / Thailand
- Europe templates

### Rules

- Rule-based only.
- No legal visa claims.
- No fake amounts.
- No AI dependency.
- No paid external APIs.
- Keep expenses empty after generation.
- Keep budget categories as notes/summary until a real budget-category table exists.

## Phase 7: Product Analytics and Feedback

### Goal

Learn whether the product is useful without logging private content.

Allowed analytics:

- Workspace created
- Setup preview generated
- Setup applied
- Private link opened
- Today viewed
- Bookings viewed
- Money viewed
- Packing status changed
- Document status changed

Do not log:

- Notes
- Booking confirmations
- Document URLs
- Expense details
- Medical/private fields
- Passport/payment/identity data

Pilot v1 can use server logs and manual feedback before adding third-party analytics.

## Phase 8: Free Distribution Readiness

### Goal

Validate repeatable free usage and operational safety before reconsidering any monetization model.

### Free Early Access Model

- Free early access during the pilot.
- Manual invite review before workspace creation.
- Email required, WhatsApp optional.
- No public self-serve creation yet.
- No payment or refund handling.

Do not build:

- Stripe
- Checkout
- Subscription
- Billing dashboard
- Invoices

Only reconsider monetization after the pilot proves repeatable demand, reliable workspace creation, clear user value, and manageable support load.

## Phase 9: Launch Readiness

### Launch Candidate Requirements

The product is ready for a small public launch when:

- Public `/pilot` is aligned with free early access, manual review, contact channels, fit criteria, and safety boundaries.
- Operator-only workspace creation can create independent trip workspaces that do not reuse the current Italy `active-trip`.
- Setup generation can run only against the intended new workspace and cannot accidentally replace production `active-trip`.
- UI refresh is complete enough for public pilot users.
- Setup preview/apply behavior is safe enough for operator use.
- Production smoke is repeatable.
- Git remote and backup workflow are verified.
- At least 3 free pilot planners complete setup.
- At least 2 free pilots show real group usage.
- Safety boundaries are visible in Documents, Settings, and onboarding.
- No known mobile blocker remains.

## Recommended Sequence From Here

1. Docs-only decision sync
   - Record the free invite-based pivot.
   - Mark old paid pilot assumptions as superseded.
   - Keep production data and app code unchanged.

2. Free `/pilot` page update
   - Replace paid copy with free early access.
   - CTA: request a free workspace by email, with WhatsApp optional.
   - Say manual review and manual reply, not instant creation.
   - Explain first-version fit: 2-8 travelers, 3-14 days, one planner, group private link, no sensitive documents.
   - Explain service boundary: workspace setup/organization only, not booking, travel planning, visa, insurance, or legal advice.
   - Use sanitized screenshots/module explanation, not a clickable demo workspace.
   - No form, payment, checkout, refund, backend write, setup generation, or production deploy without review.

3. Operator-only workspace creation plan
   - Define how an operator creates a new `trip_id`, private token, trip settings, travelers, and starter workspace without touching `active-trip`.
   - Keep public self-serve creation out of scope.
   - Define recovery/deletion/support steps before inviting more planners.

4. Operator creation implementation
   - Build the smallest operator-only path that can create independent workspaces.
   - Verify API access, private links, setup generation scope, and no cross-trip data leakage.

5. Controlled free invite pilot
   - Invite 3-5 planners manually.
   - Collect feedback by email/WhatsApp after setup and after trip usage.

6. Template quality expansion
   - Improve destination-specific generated content based on pilot feedback.

7. Launch readiness
   - Public free early-access page.
   - Operator playbook.
   - Clear safety boundaries.
   - Repeatable deployment and recovery process.

## Next Product Task

The next task should be:

```text
Update /pilot to a free invite-based early access page.
```

Scope:

- No backend changes.
- No database/schema changes.
- No setup generation.
- No route rename.
- No payment.
- No checkout, refund, form submission, or billing copy.
- No clickable demo workspace.
- No production deploy until desktop and mobile review passes.

Files likely involved:

- `src/app/pilot/page.tsx`
- `src/app/pilot/PilotOfferClient.tsx`
- `src/app/globals.css`
- `public/pilot/*` only if sanitized screenshots need replacement

Verification for that product page task:

- `npm run lint`
- `npm run build`
- Desktop review URL
- Phone LAN review URL
- `/pilot` HTTP 200
- Unauthenticated private workspace API remains 401
- Production deploy only after explicit approval
