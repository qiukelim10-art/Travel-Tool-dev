# Zero-Cost Vercel + Aiven MySQL Preview Guide

This branch prepares the app for a zero-cost public preview deployment.

The intended setup is:

- Vercel Hobby plan for the Next.js app
- Aiven for MySQL free tier for shared editable data
- No whole-site password protection
- Existing per-document passcode protection only for protected external document links

Do not create PlanetScale resources for this zero-cost deployment. PlanetScale currently has no free database plan.

Anyone with the Preview URL can view and edit shared trip data. Keep real passport numbers, identity documents, payment card details, insurance files, full booking confirmations, and document passcodes out of the app and repo.

## Current Deployment Boundary

- Target branch: `codex/public-vercel-deploy`
- Target platform: Vercel Preview on the Hobby plan
- Target database: Aiven for MySQL free tier
- Package manager: npm
- Node.js: 24.x
- Site access: URL-based access only
- Data migration: not performed in this preparation step

## Cost Guardrails

- Use Vercel Hobby, not Pro.
- Use Aiven for MySQL free tier, not a paid service plan or trial-only paid resource.
- Do not add a payment method for this deployment unless the user explicitly changes the budget requirement.
- Keep the database under the free tier limits.
- If any provider asks for a paid upgrade, stop instead of continuing.

## Vercel Settings

Use the default Next.js framework preset.

Recommended project settings:

- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: leave as Vercel default for Next.js
- Node.js Version: `24.x`

Preview environment variables:

```env
MYSQL_HOST=<aiven-mysql-host>
MYSQL_PORT=<aiven-mysql-port>
MYSQL_DATABASE=<aiven-database>
MYSQL_USER=<aiven-user>
MYSQL_PASSWORD=<aiven-password>
MYSQL_SSL=true
MYSQL_SSL_CA=<aiven-ca-certificate-content>
MYSQL_MANAGED_SCHEMA=true
```

Do not add `.env.local` or real database credentials to git.

## Aiven MySQL Setup

1. Create an Aiven account without adding a payment method.
2. Create an Aiven for MySQL free tier service.
3. From the Aiven service overview, copy host, port, database name, user, and password.
4. Download the CA certificate and store its full text in the Vercel `MYSQL_SSL_CA` environment variable.
5. Apply the table schema from `database/managed-schema.sql`.
6. Apply the minimal safe starter records from `database/preview-seed.sql`.
7. Add the Aiven credentials to Vercel Preview environment variables.

`database/schema.sql` remains the local-development schema because it includes `CREATE DATABASE` and `USE`. `database/managed-schema.sql` is the safer file for a hosted database where the database already exists.

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
