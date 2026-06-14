# Vercel + PlanetScale Preview Guide

This branch prepares the app for a Vercel Preview deployment backed by PlanetScale MySQL.

No whole-site password protection is planned for this preview. Anyone with the Preview URL can view and edit shared trip data. Keep real passport numbers, identity documents, payment card details, insurance files, full booking confirmations, and document passcodes out of the app and repo.

## Current Deployment Boundary

- Target branch: `codex/public-vercel-deploy`
- Target platform: Vercel Preview
- Target database: PlanetScale MySQL
- Package manager: npm
- Node.js: 24.x
- Site access: URL-based access only
- Documents access: keep existing per-document passcode protection for protected external links
- Data migration: not performed in this preparation step

## Vercel Settings

Use the default Next.js framework preset.

Recommended project settings:

- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: leave as Vercel default for Next.js
- Node.js Version: `24.x`

Preview environment variables:

```env
MYSQL_HOST=<planetscale-host>
MYSQL_PORT=3306
MYSQL_DATABASE=<planetscale-database>
MYSQL_USER=<planetscale-user>
MYSQL_PASSWORD=<planetscale-password>
MYSQL_SSL=true
MYSQL_MANAGED_SCHEMA=true
```

Do not add `.env.local` or real database credentials to git.

## PlanetScale Setup

1. Create the PlanetScale database and preview branch.
2. Enable foreign key constraints before applying this project's schema, because `database/schema.sql` uses foreign keys with cascade delete.
3. Create a password for the preview branch using a primary connection.
4. Apply the table schema from `database/managed-schema.sql`.
5. Apply the minimal safe starter records from `database/preview-seed.sql`.
6. Add the PlanetScale credentials to Vercel Preview environment variables.

If foreign key constraints are not enabled, do not apply the current schema yet. The alternative is a separate no-foreign-key schema pass, which should be handled as its own focused change.

`database/schema.sql` remains the local-development schema because it includes `CREATE DATABASE` and `USE`. `database/managed-schema.sql` is the safer file for a hosted database branch where the database already exists.

## Preview Smoke Checks

After Vercel creates a Preview URL, check:

- `GET /api/health`
- `GET /`
- `GET /api/trip-settings`
- `GET /api/reminders`
- `GET /api/bookings`
- `GET /api/itinerary`
- `GET /api/expenses`
- `GET /api/packing`
- `GET /api/documents`

Expected result: all endpoints return HTTP 200. Empty business tables are acceptable for preview as long as active trip settings and travelers exist.

## Safe Editing Rules

- Use placeholder or non-sensitive trip summaries until the travelers intentionally approve real data entry.
- Keep actual private files in permission-controlled cloud storage.
- Store only folder links in Documents when needed.
- Do not write document passcodes into notes, docs, README files, or logs.
