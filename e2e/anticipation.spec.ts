import { expect, test } from "@playwright/test"

test("Anticipation: add, delete", async ({ page }) => {
  await page.goto("./anticipation")
  await page.locator("#input-name").fill("Trip")
  await page.locator("#input-date").fill("2099-12-24")
  await page.locator("#input-time").fill("14")
  await page.locator("#input-time").press("Enter")
  await expect(page.getByText("Trip")).toBeVisible()
  await expect(page.getByText(/\d+ days$/)).toBeVisible()
  await expect(page.getByText("24.12., 14:00")).toBeVisible()
  const stored = await page.evaluate(() => localStorage.getItem("tmr-ant-data"))
  expect(JSON.parse(stored ?? "[]")).toHaveLength(1)
  await page.locator("#btn-del-row-0").click()
  await page.getByRole("button", { name: "OK" }).click()
  await expect(page.locator("#btn-del-row-0")).toHaveCount(0)
})
