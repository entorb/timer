import { readJson, writeJson } from "@/shared/storage"
import { DAY_MS, pad } from "@/shared/time"

export interface Countdown {
  name: string
  date: Date
}

export const ORIGIN = "tmr-ant"
const KEY_DATA = "tmr-ant-data"

// "2" -> 2:00, "14" -> 14:00, "2000" / "20:00" / "20.00" -> 20:00, "930" -> 9:30, "" -> 0:00
// undefined if invalid
export function parseTime(raw: string): { hour: number; minute: number } | undefined {
  const input = raw.trim()
  if (input === "") return { hour: 0, minute: 0 }
  const match = /^(\d{1,2})(?:[:.](\d{1,2})|(\d{2}))?$/.exec(input)
  const hour = Number(match?.[1])
  const minute = Number(match?.[2] ?? match?.[3] ?? 0)
  return match != null && hour < 24 && minute < 60 ? { hour, minute } : undefined
}

// calendar days between local dates, ignoring time of day (round: DST days have 23/25h)
export const calendarDays = (from: Date, to: Date): number =>
  Math.round((new Date(to).setHours(0, 0, 0, 0) - new Date(from).setHours(0, 0, 0, 0)) / DAY_MS)

// seconds and days always >= 0, past = event date reached
export function remaining(
  event: Countdown,
  now: number,
): { seconds: number; days: number; past: boolean } {
  const diff = (event.date.getTime() - now) / 1000
  return {
    seconds: Math.abs(diff),
    days: Math.abs(calendarDays(new Date(now), event.date)),
    past: diff <= 0,
  }
}

// last 24h "HH:MM", last hour "MM:SS", else undefined
export function finalCountdown(seconds: number): string | undefined {
  const s = Math.floor(seconds)
  if (s >= 86_400) return undefined
  return s >= 3600
    ? `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}`
    : `${pad(Math.floor(s / 60))}:${pad(s % 60)}`
}

export const loadEvents = (): Countdown[] =>
  readJson<Array<{ name: string; date: string }>>(KEY_DATA, []).map(({ name, date }) => ({
    name,
    date: new Date(date),
  }))

export const saveEvents = (events: Countdown[]) =>
  writeJson(KEY_DATA, events.length === 0 ? null : events)
