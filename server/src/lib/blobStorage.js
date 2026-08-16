// Storage abstraction so route handlers don't care whether they're running
// locally (plain files on disk — zero setup for `npm run dev`) or on
// Netlify (serverless functions with no shared local disk between
// invocations — needs Netlify Blobs).
//
// `process.env.NETLIFY` is only set during Netlify's *build* step, not in
// the deployed function's own runtime — so it can't be used to detect
// "am I running as a Netlify function right now." Netlify Functions run on
// AWS Lambda, which always sets AWS_LAMBDA_FUNCTION_NAME in the actual
// invocation environment, so that's the reliable signal here.

import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

const isNetlify = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
const LOCAL_ROOT = path.resolve("blob-storage");

let netlifyStorePromise;
async function getNetlifyStore() {
  if (!netlifyStorePromise) {
    netlifyStorePromise = import("@netlify/blobs").then(({ getStore }) => getStore("passkonnect"));
  }
  return netlifyStorePromise;
}

function localPathFor(key) {
  return path.join(LOCAL_ROOT, key);
}

export async function putBlob(key, buffer, _contentType) {
  if (isNetlify) {
    const store = await getNetlifyStore();
    await store.set(key, buffer);
    return key;
  }

  const filePath = localPathFor(key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
  return key;
}

export async function getBlob(key) {
  if (isNetlify) {
    const store = await getNetlifyStore();
    const arrayBuffer = await store.get(key, { type: "arrayBuffer" });
    return arrayBuffer ? Buffer.from(arrayBuffer) : null;
  }

  const filePath = localPathFor(key);
  if (!fsSync.existsSync(filePath)) return null;
  return fs.readFile(filePath);
}

export async function deleteBlob(key) {
  if (isNetlify) {
    const store = await getNetlifyStore();
    await store.delete(key);
    return;
  }

  await fs.unlink(localPathFor(key)).catch(() => {});
}
