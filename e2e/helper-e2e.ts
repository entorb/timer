import type { Page } from "@playwright/test"

export const getEtaLocalStorageDataFirstLastRowItems = (page: Page) =>
  page.evaluate(() => {
    const data: { items: number }[] = JSON.parse(localStorage.getItem("eta_vue_data") ?? "[]")
    return { first: data[0]?.items, last: data.at(-1)?.items }
  })

export const getEtaLocalStorageTarget = (page: Page) =>
  page.evaluate(() => localStorage.getItem("eta_vue_target"))
