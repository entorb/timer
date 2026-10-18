import { expect, type Page, test } from "@playwright/test"

import { getEtaLocalStorageDataFirstLastRowItems, getEtaLocalStorageTarget } from "./helper-e2e"

const enter = async (page: Page, selector: string, value: string) => {
  await page.locator(selector).fill(value)
  await page.locator(selector).press("Enter")
}

const expectFirstLast = (page: Page, first: number, last: number) =>
  expect.poll(() => getEtaLocalStorageDataFirstLastRowItems(page)).toEqual({ first, last })

test.beforeEach(async ({ page }) => {
  await page.clock.install()
  await page.goto("./eta")
})

test("Up", async ({ page }) => {
  await enter(page, "#input-target", "20")
  await expect.poll(() => getEtaLocalStorageTarget(page)).toBe("20")
  await expect(page.locator("#input-items")).toBeFocused()

  await enter(page, "#input-items", "1")
  // 1

  await enter(page, "#input-items", "12")
  await expectFirstLast(page, 1, 12)
  // 1,12

  await page.locator("#btn-plus-1").click()
  await expectFirstLast(page, 1, 12 + 1)
  // 1,12,13

  await page.locator("#btn-del-row-0").click()
  await expectFirstLast(page, 12, 13)
  // 12,13

  await page.locator("#btn-edit-target").click()
  await enter(page, "#input-target", "30")
  await expect.poll(() => getEtaLocalStorageTarget(page)).toBe("30")
  await expect(page.locator("#btn-edit-target")).toContainText("30")
})

test("Down", async ({ page }) => {
  await enter(page, "#input-target", "0")
  // stored into local storage only after entering of items

  await enter(page, "#input-items", "99")
  await enter(page, "#input-items", "66")
  await expect.poll(() => getEtaLocalStorageTarget(page)).toBe("0")
  await expectFirstLast(page, 99, 66)

  await page.locator("#btn-plus-1").click()
  await expectFirstLast(page, 99, 66 - 1)

  await page.locator("#btn-del-row-2").click()
  await expectFirstLast(page, 99, 66)

  await page.locator("#btn-unit").click()
  await page.locator(".q-menu").getByText("/day").click()
  await expect(page.locator("#btn-unit")).toContainText("/day")

  await page.locator("#btn-del-all").click()
  await page.getByRole("button", { name: "OK" }).click()
  await expect(page.locator("#btn-plus-1")).toBeHidden()
})

test("Edit Dialog", async ({ page }) => {
  await enter(page, "#input-target", "100")

  // fast-forward ensures distinct timestamps per row
  await enter(page, "#input-items", "1")
  await page.clock.fastForward(1000)
  // 1

  await page.locator("#btn-plus-1").click()
  await page.clock.fastForward(1000)
  // 1,2

  await enter(page, "#input-items", "4")
  await page.clock.fastForward(1000)
  // 1,2,4

  await page.locator("#btn-edit-row-0").click()
  await expect(page.locator("#edit-items")).toHaveValue("1")
  await enter(page, "#edit-items", "0")
  // 0,2,4

  await page.locator("#btn-edit-row-2").click()
  await expect(page.locator("#edit-items")).toHaveValue("4")
  await enter(page, "#edit-items", "5")
  // 0,2,5

  await expectFirstLast(page, 0, 5)
})

test("Decimal input", async ({ page }) => {
  await enter(page, "#input-target", "12,1")
  await expect.poll(() => getEtaLocalStorageTarget(page)).toBe("12.1")

  await enter(page, "#input-items", "0.1")
  await enter(page, "#input-items", "0,2")
  await expectFirstLast(page, 0.1, 0.2)
})

test("Multiple sets", async ({ page }) => {
  await enter(page, "#input-target", "10")
  await expect.poll(() => getEtaLocalStorageTarget(page)).toBe("10")
  await enter(page, "#input-items", "1")
  await enter(page, "#input-items", "2")
  await expectFirstLast(page, 1, 2)

  await page.getByRole("button", { name: "Add data set" }).click()
  await expect(page.locator("#btn-plus-1")).toBeHidden()
  await enter(page, "#input-target", "0")
  await enter(page, "#input-items", "50")
  await enter(page, "#input-items", "40")
  await expectFirstLast(page, 50, 40)

  await page.getByRole("combobox", { name: "Data set" }).click()
  await page.getByRole("option", { name: "ETA 1" }).click()
  await expectFirstLast(page, 1, 2)
  await expect(page.locator("#btn-edit-target")).toContainText("10")

  await page.getByRole("button", { name: "Delete: Data set" }).click()
  await page.getByRole("button", { name: "OK" }).click()
  await expectFirstLast(page, 50, 40)
  // back to a single set: select hidden
  await expect(page.getByRole("combobox", { name: "Data set" })).toBeHidden()
})
