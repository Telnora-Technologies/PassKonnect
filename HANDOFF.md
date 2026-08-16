# Handoff notes for whichever coding AI/tool picks this up next

This project was scaffolded by Claude (in a cloud sandbox with no npm
registry access), then a v1 pass added auth, real Postgres persistence, and
three new user-facing features (see below) — installed, run, and
browser-tested end-to-end against a live Neon database. A later pass added
account/data hygiene (delete, rate limiting, an audit log), a full visual
redesign, and Netlify deployment support (see "Deployment" below).

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
PDF — plus, as of v1, a way to get verified and discoverable by buyers.

## What's built (v1)

- `server/`: Node/Express API, Postgres (Prisma) persistence
  - **Auth** (`src/routes/auth.routes.js`) — email+password signup/login,
    JWT in an httpOnly cookie (`src/lib/auth.js`,
    `src/middleware/auth.js`). One `User` can own multiple `Business`
    profiles.
  - **Business profiles** (`src/routes/businesses.routes.js`) — create/list/
    fetch own businesses, generate the export-readiness checklist
    (`src/checklist.js`) + draft Certificate of Origin PDF
    (`src/certificate.js`, `pdfkit` + embedded QR code via `qrcode`),
    toggle public listing.
  - **Document verification** (`src/routes/documents.routes.js`,
    `src/routes/admin.routes.js`, `src/lib/verification.js`) — owners
    upload compliance documents (multer with in-memory storage, persisted
    via `src/lib/blobStorage.js` — see "Deployment" below); admins
    (`User.isAdmin`) review a queue and approve/reject; a business becomes
    `verified` once both `business_registration` and `tax_id` documents are
    approved.
  - **Delete + audit trail** — owners can delete a business (cascades to
    its certificates/documents and their blobs) or a not-yet-approved
    document. Deleting a business that was `verified` writes an
    `AuditLog` row first (who/when/what), viewable by admins at `/admin` —
    so the fact that verification happened is still on record even after
    the owner removes the profile.
  - **Rate limiting** (`src/lib/rateLimit.js`) — tighter limits on
    auth endpoints, generous limits on public directory/profile reads,
    moderate limits on business/document creation.
  - **Public profile + directory** (`src/routes/public.routes.js`) — no-auth
    `GET /api/public/businesses/:id` (works for any public business
    regardless of verification status, so a QR scan always resolves) and
    `GET /api/public/directory` (verified + public businesses only,
    filterable by country/category/search).
  - **QR codes** — every generated certificate PDF embeds a QR code (via
    `qrcode`) pointing at the business's public profile URL
    (`${FRONTEND_URL}/p/:id`), plus a verification-status line.
  - Storage: `prisma/schema.prisma` — `User`, `Business`, `Certificate`,
    `Document` models, Postgres-backed (this run used a free Neon project).
    `npx prisma migrate dev` to apply, `npm run seed` to create the admin
    account (`ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env`, defaults in
    `.env.example`).
- `client/`: React (Vite) + `react-router-dom`
  - `src/context/AuthContext.jsx` + `src/components/ProtectedRoute.jsx` /
    `AdminRoute.jsx` — auth state and route guarding.
  - `src/pages/`: `Landing`, `Login`, `Signup`, `Dashboard` (owner's
    businesses), `NewBusiness` (the original onboarding form),
    `BusinessDetail` (checklist/certificate generation, document upload,
    QR code via `qrcode.react`, public-listing toggle), `PublicProfile`
    (`/p/:id`), `Directory` (`/directory`), `AdminQueue` (`/admin`).
  - `src/styles.css` — extended the original green/gold design system with
    badges, tables, and a directory grid rather than introducing a second
    visual language.

## What's explicitly NOT built yet (roadmap, from the original concept note)

- AI-assisted tariff/HS-code classification
- Password reset / email verification (signup is currently trust-on-email,
  no confirmation step)
- Editing an existing business profile (delete + recreate is currently the
  only path)

## Deployment (Netlify)

The app deploys as a single Netlify site: the built React app is served as
static files, and the API runs as one Netlify Function wrapping the whole
Express app via `serverless-http`.

- **`netlify.toml`** (repo root) — build command builds `client/`, publishes
  `client/dist`; `/api/*` requests redirect to the function; a catch-all
  redirect sends everything else to `index.html` for client-side routing.
- **`server/netlify/functions/api.js`** — the function entrypoint. It lives
  *inside* `server/` (not a repo-root `netlify/` folder) specifically so
  normal Node module resolution walks up into `server/node_modules` and
  finds `express`, `@prisma/client`, `serverless-http`, etc. without a
  separate root `package.json`.
- **File storage**: `src/lib/blobStorage.js` is a small abstraction
  (`putBlob`/`getBlob`/`deleteBlob`) — on Netlify (`process.env.NETLIFY` is
  set automatically) it backs onto **Netlify Blobs**; locally it falls back
  to plain files under `server/blob-storage/` (gitignored), so
  `npm run dev` needs zero extra setup. This exists because serverless
  functions don't share a local disk between invocations — the old
  "write PDF to disk, read it back in a later request" pattern would break
  under Netlify's model.
- **Prisma**: `schema.prisma`'s `generator client` block sets
  `binaryTargets = ["native", "rhel-openssl-3.0.x"]` — local dev (Windows/
  Mac/Linux) uses `native`, Netlify Functions (Amazon Linux/Lambda) need
  the `rhel-openssl-3.0.x` engine binary. `netlify.toml`'s
  `[functions].included_files` explicitly includes the compiled `.node`
  engine binaries so Netlify's esbuild bundler doesn't drop them — this is
  the most common failure mode deploying Prisma to a serverless host, so
  check that first if the deployed API 500s on any DB query.
- **Required Netlify env vars** (site settings → Environment variables):
  `DATABASE_URL` (Neon connection string), `JWT_SECRET`, `ADMIN_EMAIL`,
  `ADMIN_PASSWORD`, `FRONTEND_URL` (the Netlify site's own URL, e.g.
  `https://<sitename>.netlify.app` — used for CORS and for the QR
  code/public-profile links embedded in generated certificates).
- Deploying from a connected GitHub repo (`Telnora-Technologies/PassKonnect`)
  is the expected flow — Netlify's dashboard: "Add new site" → "Import an
  existing project" → GitHub → pick the repo, it should auto-detect
  `netlify.toml`.

## Known operational note: Neon connection latency

This session's sandboxed network environment saw unusually slow (10-30s)
*first* connections to the Neon Postgres endpoint per process — not
failures, just slow TLS/connection setup, confirmed by testing with `pg`-
level diagnostics and a raw TCP/SSL handshake. `DATABASE_URL` in `.env` has
`connect_timeout=40&pool_timeout=40` appended to accommodate this; once
Prisma's connection pool is warm, subsequent queries were fast. If deploying
somewhere with normal network egress to Neon's AWS us-east-2 region, this
is likely a non-issue and those params can be left as a safety margin or
removed. If it recurs, check the Neon dashboard for project/compute status
before assuming it's a code bug — `server/src/index.js` has a
`process.on("unhandledRejection", ...)` safety net specifically so a
transient DB hiccup doesn't crash the whole server.

## Immediate first steps for whoever picks this up

1. `cd server && cp .env.example .env` and fill in a Postgres
   `DATABASE_URL` (a free Neon project's **pooled or direct** connection
   string both work; see the note above on `connect_timeout` if your
   network path to Neon is slow), `JWT_SECRET`, `FRONTEND_URL`.
2. `npm install && npx prisma migrate dev && npm run seed && npm run dev`.
3. `cd client && npm install && npm run dev` in a second terminal.
4. Sign up as an owner, create a business, upload two documents; log in as
   the seeded admin (`/admin`) and approve them; confirm the business
   flips to verified, appears in `/directory`, and its `/p/:id` page and
   generated certificate PDF (with QR code) all reflect that.
5. From there: pick up the roadmap items above based on how much time is
   left before September 4.

## Where the full context lives

The complete concept note (problem statement, solution walkthrough, MVP
scope, tech stack, differentiation, impact narrative) and the drafted
AfCFTA Digital Innovation Challenge application answers were written
separately in a working document during the planning conversation with
Claude — that document is not included in this repo, but ask Paul/Sophia
for it if background context is needed beyond what's in this file and the
main `README.md`.
