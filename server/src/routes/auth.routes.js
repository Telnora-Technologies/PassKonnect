import { Router } from "express";
import { prisma } from "../prisma.js";
import {
  AUTH_COOKIE,
  authCookieOptions,
  clearAuthCookieOptions,
  hashPassword,
  signToken,
  verifyPassword,
} from "../lib/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";

const router = Router();

function publicUser(user) {
  return { id: user.id, email: user.email, isAdmin: user.isAdmin };
}

router.post("/signup", asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email: normalizedEmail, passwordHash },
  });

  const token = signToken(user);
  res.cookie(AUTH_COOKIE, token, authCookieOptions());
  res.status(201).json({ user: publicUser(user) });
}));

router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = signToken(user);
  res.cookie(AUTH_COOKIE, token, authCookieOptions());
  res.json({ user: publicUser(user) });
}));

router.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE, clearAuthCookieOptions());
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
