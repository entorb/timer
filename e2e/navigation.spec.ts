import { expect, test } from "@playwright/test"

test("Home is default, lists all apps, select navigates", async ({ page }) => {
  await page.goto("./")
  await expect(page).toHaveURL(/\/timer\/$/)
  await expect(page.locator("[id^=home-] .q-item__label:first-child")).toHaveText([
    "Workout",
    "ETA",
    "Multi-Timer",
    "Anticipation",
    "Stopwatch",
    "Pomodoro",
    "Meeting Meter",
  ])
  await page.locator("#home-eta").click()
  await expect(page).toHaveURL(/\/timer\/eta$/)

  const select = page.locator("#select-feature")
  for (const [name, path] of [
    ["Stopwatch", "stopwatch"],
    ["Pomodoro", "pomodoro"],
    ["Multi-Timer", "multitimer"],
    ["Anticipation", "anticipation"],
    ["Workout", "workout"],
    ["Meeting Meter", "meeting"],
    ["Home", ""],
  ]) {
    await select.click()
    await page.locator(".q-menu").getByText(name).click()
    await expect(page).toHaveURL(new RegExp(`/timer/${path}$`))
    await expect(select).toContainText(name === "Home" ? "Timer" : name)
  }
})
