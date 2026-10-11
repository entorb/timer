import { t } from "@/shared/i18n"
import { pad, type Unit } from "@/shared/time"

import type { DataRowRedType } from "./types"

export const helperDateToIsoString = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`

// used at StatsTable and TooltipSpeed
export const helperValueToString = (value: number): string => {
  if (value < 100) {
    return value.toPrecision(3)
  }
  return value.toFixed(0)
}

export const helperCalcSpeedFromPreviousRow = (
  row: DataRowRedType,
  prevRow: DataRowRedType,
): number => {
  const deltaT = (row.date.getTime() - prevRow.date.getTime()) / 1000
  const deltaItems = row.items - prevRow.items
  return deltaItems / deltaT
}

const UNIT_DE: Record<Unit, string> = { sec: "Sek", min: "Min", hour: "Std", day: "Tag" }

export const unitLabel = (unit: Unit): string => t(unit, UNIT_DE[unit])
