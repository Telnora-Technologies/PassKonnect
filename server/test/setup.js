// Runs before any test file's imports resolve — must set these before
// src/lib/auth.js (which reads JWT_SECRET at module-load time) or any
// route module is ever imported by a test.
process.env.JWT_SECRET ||= "test-secret-key-do-not-use-in-production";
process.env.FRONTEND_URL ||= "http://localhost:5173";
process.env.NODE_ENV ||= "test";
