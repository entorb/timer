import { expect, test } from "@playwright/test"

test("Multi-Timer: add, recent, delete", async ({ page }) => {
  await page.goto("./multitimer")
  await page.locator("#input-name").fill("Tea")
  await page.locator("#input-time").fill("3")
  await page.locator("#input-time").press("Enter")
  await expect(page.getByText("Tea:3m")).toBeVisible()
  await expect(page.locator("#btn-del-row-0")).toBeVisible()
  const stored = await page.evaluate(() => localStorage.getItem("eta_vue_mt_data"))
  expect(JSON.parse(stored ?? "[]")).toHaveLength(1)
  await page.locator("#btn-del-row-0").click()
  await expect(page.locator("#btn-del-row-0")).toHaveCount(0)
})
