import rateLimit from "express-rate-limit";

const jsonHandler = (_req, res) => {
  res.status(429).json({ error: "Too many requests. Please try again shortly." });
};

// Signup/login: tight, per-IP, to slow down credential stuffing and spam signups.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});

// Public directory/profile reads: generous, just enough to blunt scraping.
export const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});

// Business/document creation: moderate, to stop automated spam of the platform.
export const writeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});
