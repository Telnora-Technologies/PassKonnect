import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./test/setup.js"],
    testTimeout: 20000,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: [
        "test/**",
        "**/*.test.js",
        "prisma/**",
        "netlify/**",
        "eslint.config.js",
        "vitest.config.js",
        "src/prisma.js", // thin PrismaClient singleton, nothing to unit test
        "src/index.js", // one-line app.listen() call
      ],
      thresholds: {
        // Reflects where coverage actually landed after this round (auth,
        // admin, and public routes still need tests) — set to hold the
        // line here, not as an aspirational ceiling.
        statements: 65,
        branches: 65,
        lines: 65,
      },
    },
  },
});
