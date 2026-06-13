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
