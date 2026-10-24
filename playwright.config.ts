import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const API_PORT = 8787;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
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
      timeout: 240_000,
      env: { NEXT_PUBLIC_API_BASE: `http://127.0.0.1:${API_PORT}` },
      reuseExistingServer: !process.env.CI,
    },
  ],
});
