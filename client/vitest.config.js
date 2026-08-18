import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.js"],
    globals: true,
    // userEvent.type() across several fields in one test genuinely takes
    // longer than the 5s default, especially on a loaded CI runner.
    testTimeout: 20000,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: [
        "test/**",
        "**/*.test.jsx",
        "src/main.jsx",
        "dist/**",
        "*.config.js",
      ],
      // Reflects current reality (Dashboard/NewBusiness/BusinessDetail/
      // AdminQueue are covered; Login/Signup/Landing/Directory/PublicProfile,
      // the shared components, and AuthContext still need tests) — a floor
      // to hold, not a claim that this is sufficient long-term.
      thresholds: {
        statements: 40,
        branches: 65,
        lines: 40,
      },
    },
  },
});
