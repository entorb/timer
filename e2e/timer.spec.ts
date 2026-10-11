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

test("Stopwatch: start, lap, persists", async ({ page }) => {
  await page.clock.install()
  await page.goto("./stopwatch")
  await page.getByRole("button", { name: "Start Athlete 1" }).click()
  await page.clock.fastForward(300)
  await page.getByRole("button", { name: "Lap Athlete 1" }).click()
  await page.getByRole("button", { name: "Lap Athlete 1" }).click()
  const laps = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem("timer_sw_data") ?? "[]")[0]?.laps.length)
  await expect.poll(laps).toBe(2)
  await page.getByRole("button", { name: "Delete lap 1 of Athlete 1" }).click()
  await expect.poll(laps).toBe(1)
  await page.getByRole("button", { name: "Hide laps Athlete 1" }).click()
  await expect(page.getByRole("button", { name: "Delete lap 1 of Athlete 1" })).toHaveCount(0)
  await page.locator("#btn-start-all").click()
  await expect(page.getByRole("button", { name: "Lap Athlete 2" })).toBeVisible()
  await page.locator("#btn-stop-all").click()
  const total = page.locator(".current").first()
  await expect(total).toHaveText(/^\d+:\d\d$/)
  await page.locator("#btn-tenths").click()
  await expect(total).toHaveText(/^\d+:\d\d\.\d$/)
  await expect(page.getByRole("button", { name: "Start Athlete 1" })).toBeVisible()
})

test("Pomodoro: start and pause", async ({ page }) => {
  await page.goto("./pomodoro")
  await expect(page.locator("#pomo-time")).toHaveText("25:00")
  await page.locator("#btn-pomo-toggle").click()
  await expect(page.locator("#pomo-time")).toHaveText("24:59", { timeout: 3000 })
  await page.getByRole("button", { name: "Pause" }).click()
  await expect(page.getByRole("button", { name: "Start" })).toBeVisible()
})

test("ETA is default, select navigates", async ({ page }) => {
  await page.goto("./")
  await expect(page).toHaveURL(/\/timer\/eta$/)
  const select = page.locator("#select-feature")
  for (const [name, path] of [
    ["Stopwatch", "stopwatch"],
    ["Pomodoro", "pomodoro"],
    ["Multi-Timer", "multitimer"],
  ]) {
    await select.click()
    await page.locator(".q-menu").getByText(name).click()
    await expect(page).toHaveURL(new RegExp(`/timer/${path}$`))
    await expect(select).toContainText(name)
  }
})
