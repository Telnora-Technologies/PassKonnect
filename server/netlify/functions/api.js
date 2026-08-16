// Netlify Functions entrypoint. Lives under server/netlify/functions (not
// repo-root netlify/functions) specifically so normal Node module
// resolution walks up into server/node_modules and finds serverless-http,
// @prisma/client, express, etc. without needing a separate root
// package.json just for this one file.
import serverless from "serverless-http";
import { app } from "../../src/app.js";

export const handler = serverless(app);
