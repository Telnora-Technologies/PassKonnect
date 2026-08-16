import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { KNOWN_CATEGORIES } from "./checklist.js";
import authRoutes from "./routes/auth.routes.js";
import businessRoutes from "./routes/businesses.routes.js";
import certificateRoutes from "./routes/certificates.routes.js";
import documentRoutes from "./routes/documents.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import publicRoutes from "./routes/public.routes.js";
import { authLimiter, publicLimiter } from "./lib/rateLimit.js";

// Defense in depth: every route/middleware is wrapped with asyncHandler so
// rejections are forwarded to Express's error handler, but this catches
// anything that slips through (e.g. a transient Neon cold-start connection
// error) instead of letting Node terminate the whole process. Only relevant
// for the local long-running process — a serverless invocation doesn't
// share process state between requests anyway.
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

export const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "passkonnect-server" });
});

// Reference data the onboarding form can render (product categories)
app.get("/api/categories", (_req, res) => {
  res.json({ categories: KNOWN_CATEGORIES });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api", documentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicLimiter, publicRoutes);

// Multer / general error handler (keeps error responses JSON, not HTML stack traces)
app.use((err, _req, res, _next) => {
  if (err) {
    console.error(err);
    return res.status(err.status || 400).json({ error: err.message || "Something went wrong." });
  }
});
