import type { Page } from "@playwright/test"

// selected ETA set, first one if none selected yet
const etaSet = (page: Page) =>
  page.evaluate(() => {
    const sets: { id: string; target: number; data: { items: number }[] }[] = JSON.parse(
      localStorage.getItem("tmr-eta-sets") ?? "[]",
    )
    const id = JSON.parse(localStorage.getItem("tmr-eta-selected") ?? '""')
    return sets.find((s) => s.id === id) ?? sets[0]
  })

export const getEtaLocalStorageDataFirstLastRowItems = async (page: Page) => {
  const data = (await etaSet(page))?.data ?? []
  return { first: data[0]?.items, last: data.at(-1)?.items }
}

export const getEtaLocalStorageTarget = async (page: Page) => String((await etaSet(page))?.target)
