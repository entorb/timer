import { computed, ref, watch } from "vue"
import { statsWrite } from "@/shared/stats"
import { readJson, writeJson } from "@/shared/storage"
import type { Unit } from "@/shared/time"

import { helperCalcSpeedFromPreviousRow } from "./helper"
import type { DataRowRedType, DataRowType } from "./types"

const KEY_DATA = "tmr-eta-data"
const KEY_TARGET = "tmr-eta-target"
const KEY_SETTINGS = "tmr-eta-settings"
const DAY_IN_MS = 86_400 * 1000
const DEFAULT_SETTINGS = { unitSpeed: "min" as Unit, weightedReg: false }

const loadData = (): DataRowRedType[] =>
  readJson<Array<{ date: string; items: number }>>(KEY_DATA, []).map(({ date, items }) => ({
    date: new Date(date),
    items,
  }))

export function useEtaData() {
  const target = ref<number>(readJson(KEY_TARGET, 0))
  const data = ref(loadData())
  const settings = ref({ ...DEFAULT_SETTINGS, ...readJson(KEY_SETTINGS, {}) })

  watch(target, (value) => writeJson(KEY_TARGET, value), { immediate: true })
  watch(data, (value) => writeJson(KEY_DATA, value), { deep: true })
  watch(settings, (value) => writeJson(KEY_SETTINGS, value), { deep: true })

  // speed is derived from the previous row
  const rows = computed<DataRowType[]>(() =>
    data.value.map((row, i) => {
      const prev = data.value[i - 1]
      return { ...row, speed: prev == null ? 0 : helperCalcSpeedFromPreviousRow(row, prev) }
    }),
  )
  const current = computed(() => data.value.at(-1)?.items ?? Number.NaN)
  const hasData = computed(() => data.value.length > 0)
  const hasMultipleRows = computed(() => data.value.length >= 2)
  const showDays = computed(() => {
    const first = data.value[0]?.date.getTime() ?? 0
    const last = data.value.at(-1)?.date.getTime() ?? 0
    return last - first >= DAY_IN_MS
  })

  function addRow(row: DataRowRedType) {
    data.value.push(row)
    if (data.value.length === 3) statsWrite("tmr-eta")
  }

  function updateRow(index: number, row: DataRowRedType) {
    if (data.value[index] == null) return
    data.value[index] = row
    data.value.sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  function deleteRow(index: number) {
    // guard: negative index would splice from the end
    if (index >= 0) data.value.splice(index, 1)
  }

  function deleteAll() {
    data.value = []
    target.value = 0
    settings.value = { ...DEFAULT_SETTINGS }
  }

  function incrementByOne() {
    const lastItems = data.value.at(-1)?.items ?? 0
    if (target.value === 0 && lastItems <= 0) return

    const items = target.value === 0 ? lastItems - 1 : lastItems + 1
    addRow({ date: new Date(), items })
  }

  return {
    target,
    data,
    rows,
    settings,
    current,
    hasData,
    hasMultipleRows,
    showDays,
    addRow,
    updateRow,
    deleteRow,
    deleteAll,
    incrementByOne,
  }
}
