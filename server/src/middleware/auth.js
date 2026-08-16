import { prisma } from "../prisma.js";
import { AUTH_COOKIE, verifyToken } from "../lib/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) return res.status(401).json({ error: "Not authenticated." });

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ error: "Not authenticated." });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) return res.status(401).json({ error: "Not authenticated." });
  req.user = user;
  next();
});

export const requireAdmin = [
  requireAuth,
  (req, res, next) => {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Admin access required." });
    next();
  },
];
