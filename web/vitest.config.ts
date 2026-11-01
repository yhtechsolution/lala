/**
 * Vitest configuration for React tests in a simulated browser. The React plugin
 * transforms JSX, setupFiles installs mocks, include selects tests, and the @ alias
 * mirrors application imports. This is independent of the production Vite preset.
 */
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
