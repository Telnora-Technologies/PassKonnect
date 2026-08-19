# PassKonnect

A digital trade-readiness identity for African MSMEs — built for the AfCFTA
Digital Innovation Challenge (2nd Edition).

A business owner fills a guided onboarding form, uploads compliance
documents for review, and gets back an export-readiness checklist plus a
draft AfCFTA Certificate of Origin PDF. Once an admin approves their
documents, the business is **verified** — discoverable in a public directory
and reachable via a QR-linked public profile page that buyers can scan
straight off the certificate.

Live at **[passkonnect.netlify.app](https://passkonnect.netlify.app)**.

## Project structure

```
PassKonnect/
├── server/     Node/Express API, Postgres (Prisma) persistence, PDF generation
└── client/     React (Vite) app — auth, dashboard, directory, admin review queue
```

## Prerequisites

- Node.js 18+ and npm (check with `node --version`)
- A Postgres database — either a free [Neon](https://neon.tech) project, or
  run one locally with Docker (no account needed, see below)

## 1. Run the server

```bash
cd server
cp .env.example .env
```

Fill in `.env`: at minimum `DATABASE_URL` (your Postgres connection string)
and `JWT_SECRET` (any long random string). The other vars have working
defaults for local dev — see the comments in `.env.example`.

**No Postgres account?** Run one locally instead — from the repo root:

```bash
docker compose up -d db
```

Then set `DATABASE_URL="postgresql://passkonnect:passkonnect@localhost:5432/passkonnect"`
in `server/.env` (matches `docker-compose.yml`'s credentials).

```bash
npm install
npx prisma migrate dev
npm run seed   # creates the admin account from ADMIN_EMAIL/ADMIN_PASSWORD
npm run dev
```

You should see:

```
PassKonnect server listening on http://localhost:4000
```

Sanity check while the server's running:

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

1. Sign up, then create a business profile.
2. Upload a business registration document and a TIN document (any PDF/JPG/PNG
   works locally — files are stored under `server/blob-storage/`, gitignored).
3. Log out, log back in as the seeded admin account, go to `/admin`, and
   approve both documents. The business flips to **verified**.
4. Check `/directory` and the business's public profile at `/p/:id`.
5. Back in the business detail page, pick a destination country to generate
   an export-readiness checklist and download a draft Certificate of Origin
   PDF — it embeds a QR code linking to the public profile.

## Tests

```bash
cd server && npm test     # vitest + supertest, Prisma mocked — no DB needed
cd client && npm test     # vitest + @testing-library/react
```

Both run in CI (`.github/workflows/ci.yml`) on every push and pull request,
alongside lint and (for the client) a production build.

## Deployment

Deploys to Netlify as a single site: the built React app is served as static
files, and the whole Express API runs as one Netlify Function
(`server/netlify/functions/api.js`, wrapped with `serverless-http`). See the
"Deployment (Netlify)" section in `HANDOFF.md` for the full configuration
notes, including the couple of serverless-specific gotchas (Prisma's native
binary, pdfkit's font files, Netlify Blobs credentials) that came up getting
it working.

## Roadmap

- AI-assisted tariff/HS-code classification
- Password reset / email verification
- Editing an existing business profile (delete + recreate is currently the
  only path)
