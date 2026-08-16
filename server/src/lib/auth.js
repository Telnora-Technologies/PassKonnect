import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = "30d";

export function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export function signToken(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export const AUTH_COOKIE = "pk_token";

export function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };
}

// res.clearCookie() must be called with the same attributes used to set the
// cookie EXCEPT maxAge/expires — passing those is deprecated in Express 4
// and will be ignored in 5.
export function clearAuthCookieOptions() {
  const { maxAge: _maxAge, ...rest } = authCookieOptions();
  return rest;
}
