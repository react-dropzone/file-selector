import {defineConfig} from "@playwright/test";

// Smoke-tests the docs site in real Chromium so a hydration crash (blank page) fails CI
// instead of shipping silently - the SSR'd HTML still returns 200, so a plain HTTP probe
// cannot see it. Kept separate from playwright.config.ts (the library's file-input and
// drag-and-drop e2e) because it needs its own web server and base URL.
//
// Modes:
//   - PR gate / local: build the docs (pretest:docs:e2e) and serve site/ via `vocs preview`.
//   - Scheduled prod monitor: set DOCS_BASE_URL to the live origin; no build/preview.
// The docs are served under the `/file-selector` basePath (a GitHub Pages project site), so
// the routes carry that prefix and DOCS_BASE_URL is just the origin.
const PORT = 4321;
const baseURL = process.env.DOCS_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e-docs",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  use: {
    baseURL,
    browserName: "chromium",
    headless: true
  },
  webServer: process.env.DOCS_BASE_URL
    ? undefined
    : {
        command: `PORT=${PORT} npm run docs:preview`,
        url: `http://localhost:${PORT}/file-selector/`,
        reuseExistingServer: !process.env.CI,
        timeout: 120000
      }
});
