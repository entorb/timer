import { computed, ref, watch } from "vue"
import { t } from "@/shared/i18n"
import { pickById } from "@/shared/list"
import { statsWrite } from "@/shared/stats"
import { readJson, writeJson } from "@/shared/storage"
import { DAY_MS, roundTs } from "@/shared/time"

import { helperCalcSpeedFromPreviousRow } from "./helper"
import { DEFAULT_SETTINGS, type EtaSet, KEY_SETS, loadSets, newSet, ORIGIN } from "./sets"
import type { DataRowRedType, DataRowType } from "./types"

const KEY_SELECTED = "tmr-eta-selected"

const setName = (n: number) => `${t("ETA", "ETA")} ${n}`

const loadOrNew = (): EtaSet[] => {
  const stored = loadSets()
  return stored.length > 0 ? stored : [newSet(setName(1))]
}

export function useEtaData() {
  const sets = ref(loadOrNew())
  const selectedId = ref(readJson(KEY_SELECTED, ""))

  watch(sets, (value) => writeJson(KEY_SETS, value), { deep: true, immediate: true })
  watch(selectedId, (value) => writeJson(KEY_SELECTED, value))

  const set = computed(() => pickById(sets.value, selectedId.value) ?? newSet(setName(1)))
  const data = computed(() => set.value.data)
  const settings = computed(() => set.value.settings)
  const target = computed({
    get: () => set.value.target,
    set: (value) => {
      set.value.target = value
    },
  })

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
    return last - first >= DAY_MS
  })

  // whole seconds; same second as the last row replaces it (zero time delta = no speed)
  function addRow(row: DataRowRedType) {
    const date = new Date(roundTs(row.date.getTime()))
    if (data.value.at(-1)?.date.getTime() === date.getTime()) data.value.pop()
    data.value.push({ ...row, date })
    if (data.value.length === 3) statsWrite(ORIGIN)
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

  // resets the current set, keeps its name
  function deleteAll() {
    set.value.data = []
    set.value.target = 0
    set.value.settings = { ...DEFAULT_SETTINGS }
  }

  function incrementByOne() {
    const lastItems = data.value.at(-1)?.items ?? 0
    if (target.value === 0 && lastItems <= 0) return

    const items = target.value === 0 ? lastItems - 1 : lastItems + 1
    addRow({ date: new Date(), items })
  }

  function add() {
    const s = newSet(setName(sets.value.length + 1))
    sets.value.push(s)
    selectedId.value = s.id
  }

  function remove() {
    if (sets.value.length <= 1) return
    sets.value = sets.value.filter((s) => s.id !== set.value.id)
    selectedId.value = sets.value[0]?.id ?? ""
  }

  return {
    sets,
    selectedId,
    set,
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
    add,
    remove,
  }
}
