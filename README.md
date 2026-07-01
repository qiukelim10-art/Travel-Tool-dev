# Italy Trip 2026

Private, mobile-first trip workspace for a 4-person Italy trip in October 2026.

The project has evolved from a static travel dashboard into an access-gated shared workspace for itinerary planning, bookings, money tracking, packing, documents, reminders, trip settings, and starter workspace generation. The production alias is `https://italy-trip-2026-cyan.vercel.app`; workspace access is controlled by private trip links/tokens that must stay outside the repo.

## Current Status

- Main branch: `master`
- GitHub remote: `https://github.com/qiukelim10-art/Travel-Tool-dev.git`
- Stack: Next.js, React, TypeScript, MySQL, Tailwind CSS
- Production hosting: Vercel Hobby + Aiven Free MySQL
- Access model: private-link full editing for trusted travelers; unauthenticated workspace API requests should return 401
- Latest product decision: the next pilot direction is free early access with manual invite-based workspace creation, not paid pilot. Update `/pilot` first, then design operator-only creation for independent trip workspaces.

## Key Routes

- `/` - Today dashboard
- `/itinerary` - Plan / itinerary
- `/bookings` - booking checklist
- `/budget` - shared money ledger
- `/packing` - packing checklist
- `/documents` - document checklist and protected folder links
- `/settings` - trip settings and guided setup generation
- `/more` - secondary navigation
- `/pilot` - sanitized public pilot offer page

## Development

```bash
npm run lint
npm run build
npm run dev
```

`npm run lint` runs `tsc --noEmit`. There is currently no separate `test` script.

## Project Notes

- Read `AGENTS.md`, `MEMORY_INDEX.md`, and `NEXT_TASKS.md` before starting new work.
- Keep sensitive trip data out of the repo: no passport numbers, payment card details, full confirmations, private document files, passcodes, or private trip links.
- Use `REAL_DATA_ENTRY_GUIDE.md` and `REAL_DATA_CHECKLIST.md` when replacing placeholders with safe real trip summaries.
- Do not run production setup generation against the current `active-trip` unless the user explicitly approves the destructive replacement.
- Do not use production `active-trip` as an outside pilot/demo workspace. New pilot users need independent `trip_id`/token-bound workspaces before setup generation is applied.
- Do not add payment, checkout, billing, refund, manual-payment, or paid-pilot copy for the next pilot slice.
