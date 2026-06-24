# UI Shell + Today Audit

Last updated: 2026-06-24

## Current Implementation Status

The Shell + Today slice now has a corrected implementation pass that follows the supplied mobile and desktop reference direction more closely:

- App-like Travel Journal shell with serif trip masthead and warm paper surface.
- Today cockpit primary card with ticket/map/postmark visual.
- Desktop right rail for needs attention, money, prep, and SOS.
- Compact access controls that keep viewer/editor, private link, traveler identity, and recovery tools available without dominating the page.
- Floating mobile bottom navigation.
- Destination visuals still derive from `trip.destination`, `routeCities`, and `routeLabel`.
- Route behavior was smoke-tested for Today CTA, attention, money, prep, More, Settings, Packing, Documents, and mobile Bookings.
- The latest browser-comment pass tightened the primary title sizing, made the destination route-map/postmark card clearer, removed the unused QR-like detail, removed the duplicate lower Needs Attention card, restyled reminders for the cockpit surface, fixed brand/title truncation, changed nav icons to emoji labels, and restored 390px mobile no-overflow.

## Purpose

This document scopes the first UI redesign branch after `PRODUCT_LAUNCH_PLAN.md`.

The approved direction is:

- Visual direction: Travel Journal skin.
- Interaction model: Cockpit utility.
- First implementation slice: private workspace Shell + Today only.
- Destination visuals: maps, route marks, postmarks, and tone must derive from each workspace's destination/route settings, not from hardcoded Italy/Japan assets.
- Later direction: phased shadcn migration, not a one-branch full-page migration.

No business functionality, API contract, database schema, access-control behavior, setup generation behavior, payment flow, Stripe integration, or Supabase/Postgres work belongs in this slice.

## Source Reconnaissance

CodeGraph was used before planning the UI work. Relevant files and why they matter:

- `src/components/AppShell.tsx`: wraps private workspace pages in `TripAccessProvider`, `TripAccessGate`, and `Layout`; `/pilot` is the public bypass.
- `src/components/Layout.tsx`: owns desktop navigation, mobile top bar, mobile bottom navigation, language toggle, and placement of `TripAccessToolbar`.
- `src/lib/access.tsx`: owns private-link loading, viewer/editor state, traveler identity, private-link copy, and recovery/editor controls.
- `src/app/page.tsx`: current Dashboard/Today implementation, including trip cover, next plan, booking attention, money snapshot, reminders, and setup gate.
- `src/app/globals.css`: current travel visual system classes such as `travel-cover`, `travel-page-header`, `travel-panel`, `status-strip`, and mobile safe-form utilities.
- `src/lib/i18n.tsx`: UI-only language system; user-entered trip names, route labels, city names, traveler names, notes, and item titles must remain untranslated.

Likely affected pages in the first implementation slice:

- `/`
- all private workspace pages through shared shell/navigation/access toolbar

Pages audited for consistency but not intended for first-slice implementation:

- `/itinerary`
- `/bookings`
- `/budget`
- `/packing`
- `/documents`
- `/settings`

## Screenshot Evidence

Screenshots were captured with local Chrome against `http://localhost:3107` using the local private trip token from the existing dev log. The token is not recorded here.

Temporary screenshot directory:

```text
C:\Users\qiuke\AppData\Local\Temp\2026-06-24-ui-shell-today-audit
```

Captured routes:

- `/`
- `/itinerary`
- `/bookings`
- `/budget`
- `/packing`
- `/documents`
- `/settings`

Viewports:

- Desktop: 1440 x 1000
- Mobile: 390 x 844

Observed technical status:

- All audited routes returned HTTP 200.
- 390px mobile checks reported no horizontal overflow on all audited routes.
- Desktop Dashboard was re-captured after private access resolved; the first capture only caught the transient access loading state.
- No red API error blocks were visible in the audited screenshots.
- The only sampled console error was a non-business 404 resource load, likely favicon/static asset related.

## Audit Findings

### P1: Access toolbar dominates the mobile first screen

The viewer/editor toolbar is functionally important, but it currently consumes a large block at the top of every private page. On 390px mobile, users see mode, copy link, explanatory text, traveler identity, editor passcode, and recovery controls before the actual trip page content.

First-slice direction:

- Keep access behavior unchanged.
- Collapse low-frequency controls behind a compact access drawer or details block.
- Keep current mode and selected traveler visible.
- Keep editor entry reachable without pushing Today content far below the fold.

### P1: Product navigation language still reads like an admin dashboard

The product direction is a trip workspace, but desktop navigation still says `Dashboard`, `Itinerary`, and `Budget`. Mobile already uses shorter labels such as `Home`, `Plan`, `Book`, and `Money`, but the naming is not yet aligned with the launch plan.

First-slice direction:

- Keep existing routes.
- Prefer label-only movement toward `Today`, `Plan`, `Bookings`, `Money`, and `More`.
- Do not rename URLs in this slice.

### P1: Today does not yet lead with a clear daily command stack

The current Dashboard has useful modules, but the hierarchy is split across a large cover, a duplicated next-up card, needs attention, money, and reminders. On mobile, the user does not reach the actionable Today stack quickly enough.

First-slice direction:

- Make Today answer these in order:
  - what is next
  - what needs action
  - what each traveler may need to do
  - what money or document item is relevant now
- Remove or reduce duplicated next-up presentation.
- Preserve existing data sources and error/loading states.

### P2: Repeated page headers feel like separate admin modules

The current `travel-page-header` style gives consistency, but the repeated card treatment makes Bookings, Budget, Packing, Documents, and Settings feel like separate admin pages instead of one trip journal workspace.

First-slice direction:

- Do not redesign all pages yet.
- Define shell-level hierarchy and tokens that later pages can adopt.
- Use page headers less like marketing cards and more like compact section markers.

### P2: Tables and controls still set the desktop mental model

Bookings works, but the desktop view is still table-first, and on mobile the first fold is mostly toolbar, summary, editor, and filters before the list becomes useful.

First-slice direction:

- Do not change Bookings in this branch.
- In the Shell + Today design, avoid copying table-first density into the Today surface.
- Later Bookings work should prioritize cards, grouped attention, and owner/status scanning.

### P2: Current palette and texture are warm but close to one-note

The beige paper, moss green, stamp brown, route teal, and sky blue palette has a useful travel tone, but much of the UI sits on the same warm paper/card system. The result can feel soft rather than decisive.

First-slice direction:

- Keep the warm journal tone.
- Increase contrast between command items, passive context, warnings, and background.
- Use accent colors sparingly for status and navigation, not decoration.

## Concept Direction

### Travel Journal Skin

The workspace should feel like a practical trip notebook:

- compact route/date/traveler facts
- warm paper surface
- restrained stamp labels
- subtle route-line structure
- less generic SaaS chrome

Avoid:

- oversized hero sections
- travel brochure imagery
- decorative blobs or gradients
- slow editorial layouts
- visual weight that hides tasks

### Cockpit Interaction

The workspace should behave like a trip command surface:

- Today first
- next action visible
- unresolved items surfaced
- navigation stable and thumb-friendly
- editing controls available but not dominant
- loading, error, empty, and button feedback preserved

### First Shell Direction

Implement later in a focused code slice:

- Compact top shell with trip name plus route/date context.
- Mobile bottom nav remains stable and safe-area aware.
- Desktop nav can move label language toward product naming without route changes.
- Access controls move from a full-width form block toward a compact mode strip plus expandable controls.
- Language toggle remains visible but visually quieter.

### First Today Direction

Implement later in a focused code slice:

- Reduce the cover block.
- Turn Today into a stacked action surface:
  - next plan
  - needs attention
  - quick prep/status
  - money snapshot
  - reminders
  - SOS
- Keep existing API reads:
  - `/api/itinerary`
  - `/api/bookings`
  - `/api/expenses`
  - `/api/reminders`
  - `/api/trip-settings`
- Use destination-derived visual identity for any map, stamp, ticket, or route motif so a Japan workspace looks Japanese, a Korea workspace looks Korean, and a Generic workspace stays safely generic.
- Do not add new data models.

## shadcn Migration Guardrail

shadcn is the target component direction, but it should be phased.

For the next code slice:

- It is acceptable to initialize shadcn only if the implementation actually migrates Shell + Today primitives.
- Do not migrate all private pages in one branch.
- Start with primitives that reduce repeated styling:
  - Button
  - Card or surface wrapper
  - Badge
  - Input
  - Select
- Keep existing Tailwind tokens and app visual language mapped into shadcn-compatible CSS variables.
- Do not let shadcn adoption change behavior, data fetching, access control, or route structure.

## First Implementation Acceptance Criteria

The first code slice is complete only when:

- `npm run lint` passes.
- `npm run build` passes.
- Desktop `/` returns 200.
- 390px mobile `/` has no horizontal overflow.
- Private link access still resolves.
- Viewer/editor mode still behaves the same.
- English/Chinese toggle still works.
- User-entered trip content is not auto-translated.
- Destination-specific map/postmark visuals derive from `trip.destination`, `routeCities`, and `routeLabel`, with no hardcoded workspace destination.
- Today route maps now use real local SVG silhouette assets for Japan, Korea, and Italy plus normalized city visual coordinates; unsupported countries must show the postcard fallback instead of fake generated shapes.
- `/itinerary`, `/bookings`, `/budget`, `/packing`, `/documents`, and `/settings` still load.

## Next Slice

Recommended next implementation branch work:

```text
Implement the private workspace Shell + Today UI refresh using the Travel Journal skin and Cockpit interaction model, without changing business behavior.
```
