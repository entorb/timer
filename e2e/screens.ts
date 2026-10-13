// not a test: exports screenshots of every sub-app, see scripts/run_screens.sh

import { expect, type Page, test } from "@playwright/test"

const LANG = process.env.SCREEN_LANG ?? "en"
const OUT = `tmp/screens/${LANG}`
const MINUTE = 60_000

const tr = (en: string, de: string) => (LANG === "de" ? de : en)

// native inputs (time) follow browser locale
test.use({ locale: tr("en-US", "de-DE") })

const shot = (page: Page, name: string) =>
  page.screenshot({
    path: `${OUT}/${name}.png`,
    fullPage: true,
    animations: "disabled",
    // click ripples linger with fake clock
    style: ".q-ripple { display: none }",
  })

const enter = async (page: Page, selector: string, value: string) => {
  await page.locator(selector).fill(value)
  await page.locator(selector).press("Enter")
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((lang) => localStorage.setItem("timer_lang", lang), LANG)
  await page.clock.install({ time: new Date("2026-01-05T09:00:00") })
})

test("eta", async ({ page }) => {
  await page.goto("./eta")
  await expect(page.locator("#input-target")).toBeVisible()
  await shot(page, "eta-01-initial")

  await enter(page, "#input-target", "100")
  await expect(page.locator("#input-items")).toBeFocused()

  await enter(page, "#input-items", "10")
  await expect(page.locator("#btn-plus-1")).toBeVisible()
  await shot(page, "eta-02-first-value")

  for (const items of ["18", "25", "31", "40"]) {
    await page.clock.fastForward(10 * MINUTE)
    await enter(page, "#input-items", items)
  }
  await expect(page.locator("#btn-del-row-4")).toBeVisible()
  // chart open by default
  await expect(page.locator("#exp-chart canvas")).toBeVisible()
  await shot(page, "eta-03-multiple-values")
})

test("multitimer", async ({ page }) => {
  await page.goto("./multitimer")
  await expect(page.locator("#input-name")).toBeVisible()
  await shot(page, "multitimer-01-initial")

  await page.locator("#input-name").fill("Tea")
  await enter(page, "#input-time", "3")
  await expect(page.locator("#btn-del-row-0")).toBeVisible()
  await shot(page, "multitimer-02-one-timer")

  await page.locator("#input-name").fill("Pasta")
  await enter(page, "#input-time", "10")
  await page.locator("#input-name").fill("Oven")
  await enter(page, "#input-time", "25")
  await page.clock.fastForward(2 * MINUTE)
  await expect(page.locator("#btn-del-row-2")).toBeVisible()
  await shot(page, "multitimer-03-multiple-timers")
})

test("stopwatch", async ({ page }) => {
  await page.goto("./stopwatch")
  await expect(page.locator("#btn-start-all")).toBeVisible()
  await shot(page, "stopwatch-01-initial")

  await page.locator("#btn-start-all").click()
  const lap = page.getByRole("button", { name: /^(Lap|Runde) / }).first()
  for (const ms of [62_000, 58_000, 65_000]) {
    await page.clock.fastForward(ms)
    await lap.click()
  }
  await page.clock.fastForward(20_000)
  await shot(page, "stopwatch-02-running-laps")

  await page.locator("#btn-stop-all").click()
  await expect(page.locator("#btn-start-all")).toBeVisible()
  await shot(page, "stopwatch-03-stopped")
})

test("pomodoro", async ({ page }) => {
  await page.goto("./pomodoro")
  await expect(page.locator("#pomo-time")).toHaveText("25:00")
  await shot(page, "pomodoro-01-initial")

  await page.locator("#btn-pomo-toggle").click()
  await page.clock.fastForward(7 * MINUTE)
  await expect(page.locator("#pomo-time")).toHaveText("18:00")
  await shot(page, "pomodoro-02-running")
})

test("workout", async ({ page }) => {
  await page.goto("./workout")
  await expect(page.locator("#wo-time")).toHaveText("0:05")
  await shot(page, "workout-01-prepare")

  await page.locator("#btn-wo-toggle").click()
  await page.clock.fastForward(8000)
  await expect(page.locator("#wo-phase")).toHaveText(tr("Work", "Arbeiten"))
  await shot(page, "workout-02-work")

  await page.locator("#btn-wo-toggle").click()
  await shot(page, "workout-03-work-pause")
  await page.locator("#btn-wo-toggle").click()

  // 5s prepare + 20s work → rest
  await page.clock.fastForward(22_000)
  await expect(page.locator("#wo-phase")).toHaveText(tr("Rest", "Pause"))
  await shot(page, "workout-04-rest")

  await page.clock.fastForward(60 * MINUTE)
  await expect(page.locator("#wo-phase")).toHaveText(tr("Done", "Fertig"))
  await shot(page, "workout-05-finish")
})

test("meeting", async ({ page }) => {
  await page.goto("./meeting")
  await expect(page.locator("#btn-mtg-toggle")).toBeVisible()
  await shot(page, "meeting-01-initial")

  await page.locator("#input-mtg-group1").fill("3")
  await page.getByText(tr("Settings", "Einstellungen")).click()
  await page.getByLabel(tr("Hourly rate senior", "Stundensatz Senior")).fill("80")
  await shot(page, "meeting-02-settings")

  await page.locator("#btn-mtg-toggle").click()
  await page.clock.fastForward(45 * MINUTE)
  await expect(page.locator("#mtg-cost")).toContainText("180")
  await shot(page, "meeting-03-running")
})
