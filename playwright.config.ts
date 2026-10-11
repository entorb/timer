// https://playwright.dev/docs/test-configuration

import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: process.env.CI != null,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:5173/timer/",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm run dev",
    url: "http://localhost:5173/timer/",
    reuseExistingServer: !process.env.CI,
  },
})
