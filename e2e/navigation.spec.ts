import { expect, test } from "@playwright/test"

test("ETA is default, select navigates", async ({ page }) => {
  await page.goto("./")
  await expect(page).toHaveURL(/\/timer\/eta$/)
  const select = page.locator("#select-feature")
  for (const [name, path] of [
    ["Stopwatch", "stopwatch"],
    ["Pomodoro", "pomodoro"],
    ["Multi-Timer", "multitimer"],
    ["Workout", "workout"],
    ["Meeting Meter", "meeting"],
  ]) {
    await select.click()
    await page.locator(".q-menu").getByText(name).click()
    await expect(page).toHaveURL(new RegExp(`/timer/${path}$`))
    await expect(select).toContainText(name)
  }
})
