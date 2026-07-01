# Product Vision: Trip Command Center

## Final Product Shape

The long-term product is a mobile-first, ready-to-use Group Trip Command Center that can create one private workspace per trip.

It is not just a private Italy trip page. Italy Trip 2026 is the first reference workspace and prototype for a repeatable product pattern.

## Product Promise

Request a free early-access workspace. Share destination, travelers, and trip style. Get a mobile-ready private trip workspace with editable packing lists, document checklists, booking checklists, budget categories, reminders, itinerary shell, and emergency info.

The output should never feel like an empty dashboard. After setup, the planner should receive a prepopulated workspace that is ready to edit and share with the group.

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

Travelers are users, and the planner is the first contact/operator-facing user.

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
- Shared editing for anyone who opens the workspace through the private link or token

The private link is the workspace boundary. There is no separate viewer/editor mode and no normal edit passcode flow.

Anyone with the private link can edit core trip data, including bookings, amounts, itinerary items, document links, traveler settings, workspace options, and checklist/status fields.

Do not build full login, traveler accounts, co-planner roles, or fine-grained permissions in the first version.

## Security Expectation

The private trip link is designed for convenience, not high-security storage.

Users should treat the workspace as a lightweight travel coordination tool, not a secure vault.

The workspace should not store sensitive personal documents, passport scans, payment details, private passcodes, or confidential identity information.

Anyone with the private link can edit the workspace, so the link should only be shared with the trip group.

## Commercial Model

The current product direction is free early access, not paid pilot.

Do not promise permanent unlimited free service, but do not charge users in the next pilot slice.

Current pilot model:

- Free early-access workspace request
- Manual operator review before workspace creation
- Email as the required contact channel
- WhatsApp as an optional contact channel
- No in-app form in the first `/pilot` revision
- No payment, checkout, billing, subscription, invoice, refund, or manual payment flow

Future monetization can be revisited only after the product proves repeatable usage, workspace quality, operational safety, and clear demand. Possible future options can include paid templates, hosted workspace tiers, sponsorship, donation, or other models, but none of them are current implementation scope.

The current stage should use Free Early Access / Manual Invite Pilot. Do not implement payment, checkout, billing, refund, or subscription infrastructure.

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
- Planner would recommend it to another trip organizer or request another workspace for a future trip

## Current Italy Trip Implementation Conflicts

The current implementation already has useful foundations: Dashboard, Itinerary, Bookings, Budget, Packing, Documents, Settings, MySQL-backed shared data, i18n foundation, and mobile navigation.

Known gaps against this product vision:

- The project is still a single trip instance, not a repeatable workspace product.
- Business tables now have `trip_id` scoping, but the app still exposes only the current `active-trip` workspace.
- The live workspace uses private-link access, but it still has no per-user accounts, roles, or audit trail.
- There is no workspace lifecycle/archive model.
- There is no operator-only workflow yet for creating independent invite-based pilot workspaces.

Near-term development should avoid making the single-trip assumption worse. New or substantially changed data structures should start moving toward workspace_id/trip_id compatibility, while avoiding a full multi-trip SaaS dashboard for now.

## Suggested Next Product Decision Before Coding

The next implementation sequence is:

1. Free invite pilot page: update `/pilot` to explain free early access, fit criteria, service boundaries, manual review, email contact, and optional WhatsApp.
2. Operator workspace creation: design a manual creation path for independent trip workspaces so new users do not land in the current Italy `active-trip`.
3. Safe setup generation for new workspaces: allow setup generation only after a workspace has its own `trip_id` and private token, and do not run it against production `active-trip` by default.

Do not build public self-serve creation yet.

This keeps the free pilot useful while preventing accidental replacement of the existing Italy workspace.
