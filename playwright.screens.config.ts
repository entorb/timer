// screenshots of all sub-apps, run via scripts/run_screens.sh [en|de]

import { defineConfig, devices } from "@playwright/test"

import base from "./playwright.config"

export default defineConfig({
  ...base,
  testMatch: "screens.ts",
  reporter: "list",
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"] } }],
})
