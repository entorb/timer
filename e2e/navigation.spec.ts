import { expect, test as it } from "@playwright/test"

it("Home is default, lists all apps, select navigates", async ({ page }) => {
  await page.goto("./")
  await expect(page).toHaveURL(/\/timer\/$/u)
  await expect(page.locator("[id^=home-] .q-item__label:first-child")).toHaveText([
    "Anticipation",
    "Workout",
    "ETA",
    "Multi-Timer",
    "Stopwatch",
    "Meeting Meter",
    "Pomodoro",
  ])
  await page.locator("#home-eta").click()
  await expect(page).toHaveURL(/\/timer\/eta$/u)

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
