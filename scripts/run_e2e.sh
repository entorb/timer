#!/bin/sh
set -e
cd "$(dirname "$0")/.."

# Playwright starts the dev server via webServer in playwright.config.ts
pnpm exec playwright test
