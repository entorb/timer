import { expect, test } from "@playwright/test"

test("Pomodoro: start and pause", async ({ page }) => {
  await page.goto("./pomodoro")
  await expect(page.locator("#pomo-time")).toHaveText("25:00")
  await page.locator("#btn-pomo-toggle").click()
  await expect(page.locator("#pomo-time")).toHaveText("24:59", { timeout: 3000 })
  await page.getByRole("button", { name: "Pause" }).click()
  await expect(page.getByRole("button", { name: "Start" })).toBeVisible()
})
