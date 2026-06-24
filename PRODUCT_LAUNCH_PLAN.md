# Product Launch Plan

Last updated: 2026-06-24

## Purpose

This document defines the path from the current deployed Italy Trip 2026 prototype to a launchable Group Trip Command Center product.

The immediate decision is to pause deeper feature work and redesign the UI first. The UI pass should make the product feel like a clear, mobile-first trip command center before adding more product machinery.

## Current Baseline

The product is live in production:

- Production URL: `https://italy-trip-2026-cyan.vercel.app`
- Current deployment: `dpl_4XGZ3zk2jB839zLgicMBthR13oDu`
- Hosting: Vercel Hobby
- Database: Aiven Free MySQL
- Access model: private trip link, viewer mode, editor mode, edit passcode, owner recovery token
- Current workspace: single active trip, `active-trip`
- Business tables now have `trip_id` scoping
- Production protected workspace counts:
  - Reminders: 11
  - Bookings: 14
  - Itinerary: 11
  - Expenses: 0
  - Packing: 16
  - Documents: 11

Current push blocker:

- This local checkout has no configured git remote.
- Vercel deploy works because `.vercel/project.json` is linked.
- Git push requires adding a remote first.

## Product North Star

The final product is a mobile-first, ready-to-use, per-trip paid Group Trip Command Center.

The product promise:

Pay once, answer a short guided setup, and receive a private mobile workspace that is already useful for the trip group.

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
- 3-10 day trips first
- Japan, Korea, China, or generic international trip
- Planner buys; travelers use shared link

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
- Planner edit passcode
- Viewer mode for low-risk status updates
- Editor mode for core trip changes
- Rule-based templates, not AI
- Safe document checklist metadata only
- Empty expense ledger after generation, no fake amounts

## Immediate Pause Point

Feature work should pause here.

Next work should be UI design and product experience design.

Reason:

- The technical foundation is now good enough to support a real pilot.
- More backend work will not help if the product still feels like an internal prototype.
- The product needs a clearer first impression, stronger mobile hierarchy, and a more coherent command-center design system before inviting more pilot users.

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
   - Make language toggle and traveler identity controls easier to understand.
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
- Viewer/editor mode behavior is unchanged.
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
- On apply, create a snapshot summary of current active-trip counts and settings.
- Apply in one editor-only transaction.
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
- Apply requires editor mode.
- Apply requires explicit confirmation.
- Apply remains scoped to `active-trip`.
- Existing production workspace is not reset during testing.
- Five template smoke still passes.

## Phase 4: Controlled Pilot Workflow

### Goal

Support 3-5 real planner pilots without building full SaaS.

### Manual Pilot Flow

1. Planner sees public `/pilot`.
2. Planner contacts operator manually.
3. Operator creates a starter workspace using guided setup.
4. Operator verifies preview.
5. Operator applies generated workspace.
6. Operator sends private link to planner.
7. Planner edits workspace and shares it with travelers.
8. Operator collects feedback after setup and after trip usage.

### Product Requirements

- Keep one active trip in this app until multi-workspace creation is explicitly built.
- Do not expose real Italy Trip data as public demo.
- Use sanitized demo workspace content for sales/demo.
- Keep pilot payment manual.
- Keep refund/manual support manual.

### Pilot Success Signals

- Planner finishes setup in 10 minutes.
- Planner shares link into group chat.
- At least two travelers open workspace.
- Group uses at least three modules.
- Planner says it beats Google Sheets plus group chat.
- Planner would pay SGD 4.90 now.
- Planner can imagine paying SGD 9-19 for stronger quality.

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

## Phase 8: Commercial Readiness

### Goal

Validate willingness to pay before building payment infrastructure.

### Manual Commercial Model

- Free demo / manual pilot first
- SGD 4.90 early access per trip workspace
- 7-day refund if setup fails, technical issues block use, or planner finds it not useful
- Manual payment outside app if needed

Do not build:

- Stripe
- Checkout
- Subscription
- Billing dashboard
- Invoices

Only build payment after the pilot proves repeatable demand.

## Phase 9: Launch Readiness

### Launch Candidate Requirements

The product is ready for a small public launch when:

- UI refresh is complete.
- Setup preview/history is non-destructive.
- Production smoke is repeatable.
- Git remote and backup workflow are fixed.
- Public `/pilot` page is aligned with final product experience.
- At least 3 pilot planners complete setup.
- At least 2 pilots show real group usage.
- Safety boundaries are visible in Documents, Settings, and onboarding.
- No known mobile blocker remains.

## Recommended Sequence From Here

1. UI design refresh
   - Audit current UI.
   - Create design direction.
   - Redesign shell/navigation.
   - Redesign Today first.
   - Then Plan, Bookings, Money, Packing, Documents, Settings.

2. Production hardening
   - Configure git remote.
   - Add smoke script/runbook.
   - Add backup process.

3. Non-destructive setup preview/history
   - Store setup preview.
   - Add setup history.
   - Add safe apply flow.

4. Controlled pilot workflow
   - Use manual onboarding.
   - Use private links.
   - Collect feedback.

5. Template quality expansion
   - Improve destination-specific generated content based on pilot feedback.

6. Commercial validation
   - Manual SGD 4.90 pilot.
   - No payment integration until demand is clear.

7. Launch
   - Public pilot page.
   - Sanitized demo workspace.
   - Clear safety boundaries.
   - Repeatable deployment and recovery process.

## Next UI Design Task

The next task should be:

```text
Audit and redesign the private workspace UI shell and Today page.
```

Scope:

- No backend changes.
- No route rename yet.
- No payment.
- No new templates.
- No production deploy until desktop and mobile review passes.

Files likely involved:

- `src/components/Layout.tsx`
- `src/app/page.tsx`
- Dashboard client components if split from page
- `src/app/globals.css`
- `src/lib/i18n.ts`
- Shared UI styles/classes already used by Bookings, Budget, Packing, and Documents

Verification for that UI task:

- `npm run lint`
- `npm run build`
- Desktop review URL
- Phone LAN review URL
- Production deploy only after explicit approval

