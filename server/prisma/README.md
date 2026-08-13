# Future upgrade path: Postgres + Prisma

`schema.prisma` in this folder is a **reference model**, not currently wired up.

The v0 server (see `../src/db.js`) uses a simple JSON-file store (`lowdb`) so the
project runs anywhere with zero database setup — important for building and
demoing fast on a tight timeline.

When you're ready to move to a real production database:

1. Run `npm install prisma @prisma/client` in `server/`.
2. Change the `datasource` provider in `schema.prisma` from `sqlite` to `postgresql`.
3. Set `DATABASE_URL` in `.env` to your Postgres connection string.
4. Run `npx prisma migrate dev`.
5. Replace `src/db.js`'s functions with Prisma Client calls — the route handlers
   in `src/index.js` were written to keep that swap small (they only touch
   `db.data.businesses` / `db.data.certificates` and `db.write()`).

This isn't urgent for a pilot/demo — the JSON store is genuinely fine until
you have real concurrent users.
