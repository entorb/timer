import { expect, test } from "@playwright/test"

test("Meeting Meter: cost, pause, persists", async ({ page }) => {
  await page.clock.install()
  await page.goto("./meeting")
  await page.locator("#input-mtg-group1").fill("2")
  await page.getByText("Settings").click()
  await page.getByLabel("Hourly rate senior").fill("60")
  await page.locator("#btn-mtg-toggle").click()
  await page.clock.fastForward(3_600_000)
  await expect(page.locator("#mtg-cost")).toHaveText("120 €/h = 120 €")
  await page.locator("#btn-mtg-toggle").click()
  await expect(page.locator("#btn-mtg-reset")).toBeVisible()
  const stored = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem("timer_mtg_state") ?? "{}").group1)
  await expect.poll(stored).toBe(2)
})
