# Product Vision: Trip Command Center

## Final Product Shape

The long-term product is a mobile-first, ready-to-use, per-trip paid Group Trip Command Center.

It is not just a private Italy trip page. Italy Trip 2026 is the first reference workspace and prototype for a repeatable product pattern.

## Product Promise

Pay once. Pick your destination, travelers, and trip style. Get a mobile-ready private trip workspace with editable packing lists, document checklists, booking checklists, budget categories, reminders, itinerary shell, and emergency info.

The paid output should never feel like an empty dashboard. After setup, the planner should receive a prepopulated workspace that is ready to edit and share with the group.

## First ICP

The first target customer is a Singapore or Malaysia outbound small-group trip planner.

Chinese-speaking planners can be the first audience.

The first version should focus on:

- 2-8 travelers
- 3-10 day trips as the common first use case
- China, Japan, or Korea trips
- Single-city or multi-city trips
- Multi-booking or admin-heavy trips
- One planner responsible for organizing details and sharing one link with the group

Travelers are users, but the planner is the buyer.

## First Version Product Model

The first version should use guided setup plus rule-based prefilled workspace generation.

It should not be AI-generated, manually customized, or a blank travel planning tool.

Setup should stay short:

1. Trip basics: trip name, dates, destination template, cities or route
2. Travelers: traveler count and traveler names
3. Workspace options: main currency, optional additional currencies, trip style, luggage mode, transport mode, accommodation mode, expense splitting on or off

Generation logic:

```text
Base template
+ destination template
+ season template
+ traveler count template
+ trip style template
+ transport template
+ accommodation template
= prepopulated trip workspace
```

First destination template coverage:

- China city general
- China multi-city
- Japan general
- Korea general
- Generic international trip fallback

Future expansion:

- Europe
- Taiwan
- Thailand
- City-specific China templates, such as Shanghai, Beijing, Guangzhou-Shenzhen, and Chengdu-Chongqing
- City-specific Japan templates, such as Tokyo, Osaka-Kyoto, Hokkaido, and Fukuoka
- City-specific Korea templates, such as Seoul, Busan, and Jeju

## Generated Workspace Scope

The generated workspace should include useful editable content in these modules:

- Packing
- Documents to prepare / check
- Booking checklist
- Reminders
- Itinerary shell
- Emergency card

Money should generate budget categories and an empty ledger. It should not generate fake amounts.

Traveler responsibility placeholders should be embedded through owner or assigned traveler fields in Bookings, Documents, Reminders, and Packing. A separate responsibility module is not part of the first version.

Destination-specific prefilled examples should focus on practical travel execution tasks, not legal advice.

China examples:

- Payment setup reminder
- Local transport / train reminder
- Hotel confirmation checklist
- Attraction booking checklist
- Roaming / eSIM / connectivity reminder
- Map / translation / offline info reminder

Japan examples:

- IC card / transport reminder
- Rail / intercity transport placeholder
- Hotel confirmation checklist
- Attraction / restaurant booking checklist
- Pocket WiFi / eSIM reminder

Korea examples:

- Transport card reminder
- eSIM / roaming reminder
- Hotel confirmation checklist
- Attraction / beauty / restaurant booking checklist
- Map / translation / offline info reminder

## Mobile-First Shape

The official primary experience is mobile web.

The final mobile navigation should move toward:

```text
Today | Plan | Bookings | Money | More
```

Current mapping:

- Dashboard -> Today
- Itinerary -> Plan
- Budget -> Money
- Bookings -> Bookings
- More -> More

Do not rush a disruptive route or UI refactor. Migrate gradually.

Desktop should remain usable as a light fallback. It may later show a QR code and the message:

```text
This trip workspace is designed for mobile. For the best experience, open this link on your phone.
```

Setup and planner administration can remain desktop-friendly, but the travel-day experience is mobile-first.

## Access Model

The first version should not require every traveler to create an account.

Use:

- Private unguessable trip link
- Planner-set edit passcode
- Viewer mode by default
- Editor mode after entering the edit passcode
- One-time owner recovery link or token shown when the workspace is created

The edit passcode must be stored only as a salted hash, never as plaintext.

Viewer mode may update low-risk checklist/status fields after selecting a traveler identity, such as packing status, document prepared status, and reminder done status.

Editor mode is required for core data changes, such as bookings, amounts, itinerary items, document links, traveler settings, and workspace options.

Do not build full login, traveler accounts, co-planner roles, or fine-grained permissions in the first version.

## Security Expectation

The private trip link is designed for convenience, not high-security storage.

Users should treat the workspace as a lightweight travel coordination tool, not a secure vault.

The workspace should not store sensitive personal documents, passport scans, payment details, private passcodes, or confidential identity information.

Viewer mode should only allow low-risk status updates after selecting a traveler identity. Core trip data changes require editor mode.

## Commercial Model

The long-term business model is per-trip one-time payment, not subscription-first.

Early validation price:

- SGD 4.90 per trip workspace
- Early access / pilot price only
- Not a permanent standard price

Future regular pricing can be validated later, likely around SGD 9-19 per workspace depending on template quality, access control, safety, and user feedback.

The current stage should use Free Demo / Manual Pilot. Do not implement payment, checkout, billing, or subscription infrastructure yet.

Suggested pilot refund rule:

```text
7-day refund if workspace setup fails, has technical issues, or is not useful enough for the planner.
```

Pilot refunds can be handled manually.

## Workspace Lifecycle

A workspace should be active until the trip end date plus 60 days.

After that, it can become archived/read-only.

The product should not promise permanent storage. Pilot implementation may keep data manually for now, but the product promise should stay limited.

Planners should be able to request manual workspace deletion during the pilot. Self-delete UI can come later.

## Data Safety Boundaries

This product is not a secure document vault.

Documents should be metadata/checklist only:

- Document name
- Owner
- Status
- Due date
- Expiry date
- Safe notes
- Official source link
- User-provided cloud link placeholder

Do not upload, host, or store:

- Passport scans
- Passport numbers
- Payment card details
- Insurance certificate files
- Full confirmation PDFs
- Private passcodes
- Sensitive identity documents

Document-related content should use safe wording:

- Documents to prepare
- Documents to check
- Check official sources

Do not claim specific visa or entry requirements. Do not imply that the system can automatically determine whether a traveler needs a visa.

Bookings may support optional user-entered fields such as provider, confirmation number, owner, status, amount, currency, cloud link, and notes. Do not build email import, PDF upload, or confirmation parsing in the first version.

Sensitive forms should include short contextual safety hints near the field, not only in documentation.

## Core Modules

### Today

The default mobile landing page. It should answer in a few seconds:

- What is next?
- Where do we go?
- What booking do we need?
- What needs attention?
- Who owes what?
- Where is emergency info?

### Plan

Execution-focused itinerary and route. Do not focus on AI itinerary generation.

### Bookings

Central place for confirmations, providers, owners, statuses, optional links, and related expenses.

### Money

Trip-specific shared expense ledger with settlement suggestions.

Do not try to replace Splitwise. Do not build payment collection, recurring expenses, complex debt accounting, or forced exchange-rate conversion in the first version.

### Packing

Editable prepopulated packing checklist with traveler-level status.

### Documents

Safe document preparation/checklist module, not document storage.

### Emergency

Editable, screenshot-friendly, offline-friendly emergency card placeholders.

Do not build real-time rescue, medical advice, official safety advice, or legal judgment features.

### Settings

Trip settings, travelers, currencies, share link, edit access, and workspace options.

## Language Strategy

Keep the system UI bilingual foundation for English and Simplified Chinese.

Template content can be English-first in the first version.

Never automatically translate user-entered trip content.

## Analytics

The first version may collect lightweight, non-sensitive product analytics to validate usage.

Allowed examples:

- Workspace created
- Setup completed
- Link opened
- Today viewed
- Booking viewed
- Money viewed
- Packing item status changed
- Document status changed

Do not log private content fields, notes, booking confirmations, document links, medical notes, traveler private notes, or expense details.

Pilot analytics can start with server logs and manual feedback. Third-party analytics is not required for the first version.

## Demo Strategy

A public demo/sample workspace is useful, but it must be sanitized.

Do not expose real Italy Trip data as a public demo once real details are entered.

Use a separate safe demo workspace, such as Demo China City Trip, Demo Japan Trip, or Demo Korea Trip, with fake travelers and safe placeholder data.

## What Not To Build Yet

Do not build these in the first version:

- Full login/account system
- Payment/checkout integration
- Subscription billing
- SaaS multi-trip dashboard
- Public marketplace
- AI itinerary generator
- Hotel or flight search
- Native iOS or Android app
- Sensitive document upload/storage
- Full desktop-first experience
- Full export/PDF/backup/Google Sheets sync
- Realtime collaboration or presence
- Full audit log/change history

Future product validation can reopen these decisions.

## First Pilot Success Criteria

The first pilot should not be judged by feature count. It should be judged by real planner behavior.

Target pilot signals:

- 3-5 real planners try it
- Planner can complete setup in 10 minutes
- Planner is willing to share the link into the group chat
- At least two travelers open the workspace
- The group uses at least three modules before or during the trip
- Planner says it is easier than Google Sheets plus group chat
- Planner says they would pay SGD 4.90 now, and potentially SGD 9-19 for a stronger version later

## Current Italy Trip Implementation Conflicts

The current implementation already has useful foundations: Dashboard, Itinerary, Bookings, Budget, Packing, Documents, Settings, MySQL-backed shared data, i18n foundation, and mobile navigation.

Known gaps against this product vision:

- The project is still a single trip instance, not a repeatable workspace product.
- Some business tables still assume the single active trip and do not have trip_id/workspace_id.
- The live site is currently URL-accessible and editable without the future edit passcode boundary.
- There is no guided setup wizard.
- There is no rule-based template generation system.
- There is no workspace lifecycle/archive model.
- There is no pilot offer page.

Near-term development should avoid making the single-trip assumption worse. New or substantially changed data structures should start moving toward workspace_id/trip_id compatibility, while avoiding a full multi-trip SaaS dashboard for now.

## Suggested Next Product Decision Before Coding

Before building new features, choose the first implementation slice:

1. Access control first: private link, edit passcode, viewer/editor mode
2. Setup/template first: guided setup and rule-based prefilled workspace
3. Pilot offer first: lightweight public offer page and manual onboarding path

Recommended order:

1. Access control first
2. Product vision/pilot offer page
3. Setup/template generation

This reduces privacy risk before any real trip data or pilot users are invited.
