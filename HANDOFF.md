# Handoff notes for whichever coding AI/tool picks this up next

This project was scaffolded by Claude (in a cloud sandbox with no npm
registry access — code was written and syntax-checked with `node --check`,
but **never actually installed or run**). It's now being handed to a
code-capable AI running with real network access to finish the job: install
dependencies, boot both services, fix whatever breaks, and keep building.

## What this is

**PassKonnect** — a digital trade-readiness identity platform for African
MSMEs, built for the AfCFTA Digital Innovation Challenge (2nd Edition,
deadline September 4, 2026). Built by Telnora Technologies (Paul Anyebe +
Sophia Idioko, Abuja, Nigeria).

The core idea: most African MSMEs are legally eligible for AfCFTA's
preferential tariffs but can't access them in practice, because they don't
know how to prove their goods qualify as "originating" in Africa, can't
establish credibility with unfamiliar buyers in other countries, and face
scattered export paperwork with no single starting point. PassKonnect gives
a business owner a guided onboarding flow that turns plain-language answers
into an export-readiness checklist and a draft AfCFTA Certificate of Origin
PDF.

## What's built (v0 — "thin slice", deliberately scoped tight)

- `server/`: Node/Express API
  - `POST /api/businesses` — create a business trade-readiness profile
  - `GET /api/businesses/:id` — fetch a profile + its certificates
  - `POST /api/businesses/:id/certificates` — generate a rule-based
    export-readiness checklist (`src/checklist.js`) + a draft AfCFTA
    Certificate of Origin PDF (`src/certificate.js`, uses `pdfkit`)
  - `GET /api/certificates/:id/pdf` — download the generated PDF
  - Storage: `src/db.js` — a JSON-file store via `lowdb`, chosen deliberately
    so the project runs with zero database setup. `prisma/schema.prisma` is
    a **reference-only** model for the future Postgres upgrade (see
    `server/prisma/README.md`) — not wired up yet.
- `client/`: React (Vite) — a 3-step onboarding wizard (`src/App.jsx`) that
  calls the API above: build profile → pick destination country → see
  checklist + download PDF.

## What's explicitly NOT built yet (roadmap, from the original concept note)

- Public, shareable, QR-verified PassKonnect profile pages
- Searchable directory of verified MSMEs (buyer-side discovery)
- Admin/verification layer for uploaded compliance documents
- AI-assisted tariff/HS-code classification
- Real Postgres persistence (currently JSON-file, see above)
- Auth/accounts (currently no login — anyone with the business ID can
  view/generate certificates for it; fine for a demo, not for real users)

## Immediate first steps for whoever picks this up

1. `cd server && cp .env.example .env && npm install && npm run dev` —
   this has never been run. Expect and fix whatever the first real
   `npm install` surfaces.
2. `cd client && npm install && npm run dev` in a second terminal.
3. Walk through the onboarding flow end-to-end in the browser and confirm
   the PDF actually downloads and looks right.
4. From there: harden error handling, add basic auth if this is going to be
   demoed with real data, and pick up the roadmap items above based on how
   much time is left before September 4.

## Where the full context lives

The complete concept note (problem statement, solution walkthrough, MVP
scope, tech stack, differentiation, impact narrative) and the drafted
AfCFTA Digital Innovation Challenge application answers were written
separately in a working document during the planning conversation with
Claude — that document is not included in this repo, but ask Paul/Sophia
for it if background context is needed beyond what's in this file and the
main `README.md`.
