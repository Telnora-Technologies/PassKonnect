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
  },
});
