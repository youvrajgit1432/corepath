import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "journey-*.spec.ts",
  fullyParallel: false,
  retries: 1,
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 5"],
      },
    },
  ],
});
