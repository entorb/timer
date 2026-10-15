import { expect, test } from "@playwright/test"

test("Workout: prepare, work, add persists", async ({ page }) => {
  await page.clock.install()
  await page.goto("./workout")
  await expect(page.locator("#wo-time")).toHaveText("0:05")
  await page.locator("#btn-wo-toggle").click()
  await page.clock.fastForward(6000)
  await expect(page.locator("#wo-phase")).toHaveText("Work")
  await page.getByRole("button", { name: "Pause" }).click()
  await page.getByRole("button", { name: "Add workout" }).click()
  const count = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem("tmr-wo-workouts") ?? "[]").length)
  await expect.poll(count).toBe(2)
})
