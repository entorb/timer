import { readJson, writeJson } from "@/shared/storage"
import { parseDecimal, UNIT_SECONDS, type Unit } from "@/shared/time"

export interface Timer {
  name: string
  dateStart: Date
  dateEnd: Date
}

// storage keys are kept from the Vue version, so existing user data stays readable
const KEY_DATA = "eta_vue_mt_data"
const KEY_RECENT = "eta_vue_mt_recent"

const SUFFIX_UNIT: Record<string, Unit> = { s: "sec", m: "min", h: "hour", d: "day" }

export const clearName = (name: string): string => name.replace(/[/|\\:"'{}[\]()]+/g, "").trim()

// "20" = 20min, "10s", "1,5h", "2d", "1:30" = 1min 30s (unit suffix applies to the mm part)
export function parseTimeInput(raw: string): { time: number; unit: Unit } | undefined {
  let input = raw.trim()
  const suffixUnit = SUFFIX_UNIT[input.slice(-1)]
  if (suffixUnit != null) input = input.slice(0, -1)

  const clock = /^(\d+):(\d{2})$/.exec(input)
  const time = clock ? Number(clock[1]) + Number(clock[2]) / 60 : parseDecimal(input)
  return time != null && time > 0 ? { time, unit: suffixUnit ?? "min" } : undefined
}

export function createTimer(name: string, time: number, unit: Unit, now = Date.now()): Timer {
  return {
    name,
    dateStart: new Date(now),
    dateEnd: new Date(now + time * 1000 * UNIT_SECONDS[unit]),
  }
}

export function resetTimer(timer: Timer, now: number) {
  const duration = timer.dateEnd.getTime() - timer.dateStart.getTime()
  timer.dateStart = new Date(now)
  timer.dateEnd = new Date(now + duration)
}

export function progress(timer: Timer, now: number): { remaining: number; percent: number } {
  const start = timer.dateStart.getTime()
  const end = timer.dateEnd.getTime()
  if (now >= end) return { remaining: 0, percent: 1 }
  return { remaining: (end - now) / 1000, percent: (now - start) / (end - start) }
}

// recent timers are stored as "name:123h"
export const timerLabel = (name: string, time: number, unit: Unit): string =>
  `${clearName(name)}:${time}${unit.charAt(0)}`

export function parseTimerLabel(label: string): { name: string; time: number; unit: Unit } {
  const [name = "", time = "0"] = label.slice(0, -1).split(":")
  return {
    name,
    time: Number.parseFloat(time),
    unit: SUFFIX_UNIT[label.slice(-1)] ?? "min",
  }
}

export function loadTimers(): Timer[] {
  const stored = readJson<Array<{ name: string; dateStart: string; dateEnd: string }>>(KEY_DATA, [])
  return stored.map(({ name, dateStart, dateEnd }) => ({
    name,
    dateStart: new Date(dateStart),
    dateEnd: new Date(dateEnd),
  }))
}

export const saveTimers = (timers: Timer[]) =>
  writeJson(KEY_DATA, timers.length === 0 ? null : timers)

export const loadRecent = (): string[] => readJson<string[]>(KEY_RECENT, [])

export const saveRecent = (labels: string[]) => writeJson(KEY_RECENT, labels)
