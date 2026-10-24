import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const API_PORT = 8787;

/** Every flow runs at the four supported breakpoints. */
const viewports = [
  { name: "mobile-360", use: { ...devices["Pixel 7"], viewport: { width: 360, height: 780 } } },
  { name: "tablet-768", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } } },
  { name: "laptop-1024", use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 768 } } },
  { name: "desktop-1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
];

export default defineConfig({
  testDir: "e2e",
  // The mock API is stateful and reset per test, so run serially.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  expect: { timeout: 10_000 },
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: viewports,
  webServer: [
    {
      command: "node e2e/mock-api.mjs",
      port: API_PORT,
      env: { MOCK_API_PORT: String(API_PORT) },
      reuseExistingServer: !process.env.CI,
    },
    {
      // NEXT_PUBLIC_* is inlined at build time, so build against the mock API.
      command: `pnpm build && pnpm start -p ${PORT}`,
      port: PORT,
      timeout: 300_000,
      env: { NEXT_PUBLIC_API_BASE: `http://127.0.0.1:${API_PORT}` },
      reuseExistingServer: !process.env.CI,
    },
  ],
});
