import { t } from "@/shared/i18n.ts"
import { hhmm, isoDay, pad, UNIT_SECONDS, type Unit } from "@/shared/time.ts"

import type { DataRowRedType } from "./types.ts"

export const helperDateToIsoString = (date: Date): string =>
  `${isoDay(date)}T${hhmm(date)}:${pad(date.getSeconds())}`

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

// "minPerItem" = minutes per item (inverse of the speed)
export type SpeedUnit = Unit | "minPerItem"

export const speedUnitLabel = (unit: SpeedUnit): string =>
  unit === "minPerItem" ? `${unitLabel("min")}/${t("item", "Wert")}` : `/${unitLabel(unit)}`

// items per second -> value in unit; 0 speed gives NaN (no chart point)
export function speedInUnit(ips: number, unit: SpeedUnit): number {
  if (unit !== "minPerItem") return ips * UNIT_SECONDS[unit]
  return ips === 0 ? Number.NaN : 1 / (UNIT_SECONDS.min * ips)
}
