// Lightweight JSON-file datastore for v0 — zero setup, no native binaries,
// runs anywhere Node runs. This keeps the MVP trivially easy to boot on any
// machine (important for a hackathon-timeline build).
//
// Swap-out path for production: this module exposes the same shape
// (getDb().data.businesses / .certificates, plus write()) that you'd get
// from a real ORM — replacing this file with a Prisma+Postgres-backed
// version later should not require touching index.js's route handlers,
// only this file.

import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import fs from "fs";
import path from "path";

const file = path.resolve(process.env.DB_FILE || "data/db.json");
const adapter = new JSONFile(file);
const defaultData = { businesses: [], certificates: [] };

let dbInstance;

export async function getDb() {
  if (dbInstance) return dbInstance;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  dbInstance = new Low(adapter, defaultData);
  await dbInstance.read();
  dbInstance.data ||= defaultData;
  return dbInstance;
}
