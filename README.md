# PassKonnect

A digital trade-readiness identity for African MSMEs — built for the AfCFTA
Digital Innovation Challenge (2nd Edition).

This is the **v0 thin slice**: a business owner fills a guided onboarding
form, picks a destination country, and gets back an export-readiness
checklist plus a draft AfCFTA Certificate of Origin PDF. Directory/search and
QR-verified public profiles (described in the concept note) are the next
slice, not built yet — this first version is deliberately scoped tight so
it's real and demoable fast.

## Project structure

```
PassKonnect/
├── server/     Node/Express API + PDF generation
└── client/     React (Vite) onboarding UI
```

## Prerequisites

- Node.js 18+ and npm (check with `node --version`)

## 1. Run the server

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

You should see:

```
PassKonnect server listening on http://localhost:4000
```

Data is stored in a local JSON file at `server/data/db.json` (created
automatically on first write) — no database installation needed for this
version. See `server/prisma/README.md` for the upgrade path to Postgres when
you're ready for production.

Quick sanity check while the server's running:

```bash
curl http://localhost:4000/api/health
# {"status":"ok","service":"passkonnect-server"}
```

## 2. Run the client

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the URL it prints (typically `http://localhost:5173`). The dev server
proxies `/api/*` requests to the backend on port 4000 (see
`client/vite.config.js`), so both need to be running.

## 3. Try the flow

1. Fill in the business profile form and continue.
2. Pick a destination country.
3. You'll get an export-readiness checklist and a button to download a draft
   Certificate of Origin PDF.

## A note on how this was built

This project was scaffolded with Claude's help based on the PassKonnect
concept note. Every file was written and reasoned through in that session,
but **the install and first boot have not been run or verified** — the
sandbox this was built in had no network access to npm's registry at the
time. Please treat the first `npm install` / `npm run dev` on your machine as
the real first test, and don't hesitate to come back with whatever error
output you get — that's normal for a freshly scaffolded project and
straightforward to fix once we can see the actual error.

## Roadmap (from the concept note, not yet built)

- Public, shareable, QR-verified profile pages
- Searchable directory of verified MSMEs
- Admin/verification layer for uploaded compliance documents
- Postgres + Prisma for production persistence (see `server/prisma/README.md`)
- AI-assisted tariff/HS-code classification
