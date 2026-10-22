import { calculateWeightedLinearRegression } from "@/eta/helperLinReg"
import { readJson } from "@/shared/storage"

export const ORIGIN = "tmr-sw"
export const KEY_DATA = "tmr-sw-data"

export const loadAthletes = (fallback: Athlete[] = []) => readJson(KEY_DATA, fallback)

export interface Athlete {
  id: number
  name: string
  start?: number // timestamp ms, undefined = not started
  stop?: number // timestamp ms, set while stopped/paused
  laps: number[] // absolute timestamps of the lap marks
}

export const isRunning = (a: Athlete) => a.start != null && a.stop == null

export const elapsed = (a: Athlete, now: number) =>
  a.start == null ? 0 : (a.stop ?? now) - a.start

export function lapTimes(a: Athlete): number[] {
  if (a.start == null) return []
  const marks = [a.start, ...a.laps]
  return a.laps.map((t, i) => t - (marks[i] ?? t))
}

export function lapStats(a: Athlete, now: number) {
  const times = lapTimes(a)
  const lastMark = a.laps.at(-1) ?? a.start
  return {
    count: times.length,
    current: lastMark == null ? 0 : (a.stop ?? now) - lastMark,
    last: times.at(-1),
    best: times.length > 0 ? Math.min(...times) : undefined,
  }
}

// forecast of the next lap: weighted lin. reg. of lap time over lap number (latest laps weigh most)
// returns predicted lap time and time until it is due (negative = overdue)
export function nextLapForecast(a: Athlete, now: number) {
  const times = lapTimes(a)
  const lastMark = a.laps.at(-1)
  if (!isRunning(a) || lastMark == null) return undefined
  const last = times.at(-1) ?? 0
  let lapTime = last
  if (times.length >= 2) {
    const { slope, intercept } = calculateWeightedLinearRegression(
      times.map((_, i) => i),
      times,
    )
    lapTime = intercept + slope * times.length
  }
  // a steep trend could predict nonsense, fall back to last lap
  if (!Number.isFinite(lapTime) || lapTime <= 0) lapTime = last
  return { lapTime, dueIn: lastMark + lapTime - now }
}

// start fresh, or resume after stop by shifting all marks by the pause duration
export function start(a: Athlete, now: number) {
  if (a.start == null) {
    a.start = now
    a.laps = []
  } else if (a.stop != null) {
    const pause = now - a.stop
    a.start += pause
    a.laps = a.laps.map((t) => t + pause)
    a.stop = undefined
  }
}

export function stop(a: Athlete, now: number) {
  if (isRunning(a)) a.stop = now
}

export function lap(a: Athlete, now: number) {
  if (isRunning(a)) a.laps.push(now)
}

// set duration of lap `index`: moves only its mark, other splits stay, the next lap time follows
// rejected (false) if not positive or if the mark would reach the next mark (last: pass `now`)
export function setLapTime(a: Athlete, index: number, ms: number, now: number): boolean {
  const prev = index === 0 ? a.start : a.laps[index - 1]
  const next = a.laps[index + 1]
  if (prev == null || a.laps[index] == null || Number.isNaN(ms) || ms <= 0) return false
  const mark = prev + ms
  if (next != null ? mark >= next : mark > (a.stop ?? now)) return false
  a.laps[index] = mark
  return true
}

export function reset(a: Athlete) {
  a.start = undefined
  a.stop = undefined
  a.laps = []
}

export function toCsv(athletes: Athlete[], format: (ms: number) => string): string {
  const rows = ["name;lap;lap time;split"]
  for (const a of athletes) {
    let split = 0
    lapTimes(a).forEach((t, i) => {
      split += t
      rows.push(`${a.name};${i + 1};${format(t)};${format(split)}`)
    })
  }
  return rows.join("\n")
}
