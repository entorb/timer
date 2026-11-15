import { expect, test as it } from "@playwright/test"

it("Multi-Timer: add, recent, delete", async ({ page }) => {
  await page.goto("./multitimer")
  await page.locator("#input-name").fill("Tea")
  await page.locator("#input-time").fill("3")
  await page.locator("#input-time").press("Enter")
  await expect(page.getByText("Tea:3m")).toBeVisible()
  await expect(page.locator("#btn-del-row-0")).toBeVisible()
  const stored = await page.evaluate(() => localStorage.getItem("tmr-mt-data"))
  expect(JSON.parse(stored ?? "[]")).toHaveLength(1)
  await page.locator("#btn-del-row-0").click()
  await expect(page.locator("#btn-del-row-0")).toHaveCount(0)
})
