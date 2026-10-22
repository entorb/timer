import { readJson } from "@/shared/storage"
import { HOUR_MS, pad } from "@/shared/time"
// pause / resume / elapsed are the stopwatch ones: resume shifts `start` by the pause
import * as sw from "@/stopwatch/stopwatch"

export interface MeetingState {
  timer: sw.Athlete // laps unused
  pausedMs: number // total pause, display only: wall clock start = timer.start - pausedMs
  group1: number
  group2: number
}

export interface MeetingConfig {
  group1HourlyRate: number
  group2HourlyRate: number
  workingHoursPerDay: number
}

export const DEFAULT_CONFIG: MeetingConfig = {
  group1HourlyRate: 0,
  group2HourlyRate: 0,
  workingHoursPerDay: 8,
}

const MAX_PARTICIPANTS = 1000
const MINUTE_MS = 60_000
const SESSION_EXPIRY_MS = 24 * HOUR_MS

export const initialState = (): MeetingState => ({
  timer: { id: 1, name: "", laps: [] },
  pausedMs: 0,
  group1: 0,
  group2: 0,
})

export const ORIGIN = "tmr-mm"
export const KEY_STATE = "tmr-mm-state"
export const KEY_CONFIG = "tmr-mm-config"

export const loadState = (): MeetingState => ({ ...initialState(), ...readJson(KEY_STATE, {}) })
export const loadConfig = (): MeetingConfig => ({ ...DEFAULT_CONFIG, ...readJson(KEY_CONFIG, {}) })

export const clampCount = (n: number) => Math.min(MAX_PARTICIPANTS, Math.max(0, Math.round(n)))

export const isRunning = (st: MeetingState) => sw.isRunning(st.timer)

export const isStarted = (st: MeetingState) => st.timer.start != null

export const elapsed = (st: MeetingState, now: number) => sw.elapsed(st.timer, now)

// start of the meeting on the wall clock, pauses included
export const wallStart = (st: MeetingState) =>
  st.timer.start == null ? undefined : st.timer.start - st.pausedMs

export function start(st: MeetingState, now: number) {
  if (st.timer.stop != null) st.pausedMs += now - st.timer.stop
  sw.start(st.timer, now)
}

export const pause = (st: MeetingState, now: number) => sw.stop(st.timer, now)

// delete: keeps the participants
export function reset(st: MeetingState) {
  sw.reset(st.timer)
  st.pausedMs = 0
}

export const isExpired = (st: MeetingState, now: number) =>
  (wallStart(st) ?? now) < now - SESSION_EXPIRY_MS

// "14:30" (<input type="time">) -> timestamp today; false if invalid, in the future or after the end
export function setStartClock(st: MeetingState, hhmm: string, now: number): boolean {
  const [h, m] = hhmm.split(":").map(Number)
  if (h == null || m == null || Number.isNaN(h + m) || st.timer.start == null) return false
  const ts = new Date(now).setHours(h, m, 0, 0)
  const start = ts + st.pausedMs
  if (ts > now || start > (st.timer.stop ?? now)) return false
  st.timer.start = start
  return true
}

export function setPausedMinutes(st: MeetingState, minutes: number, now: number): boolean {
  const ms = Math.round(minutes * MINUTE_MS)
  if (st.timer.start == null || Number.isNaN(ms) || ms < 0) return false
  const start = st.timer.start + ms - st.pausedMs
  if (start > (st.timer.stop ?? now)) return false
  st.timer.start = start
  st.pausedMs = ms
  return true
}

export const clockOf = (ts: number) => {
  const d = new Date(ts)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function calc(st: MeetingState, cfg: MeetingConfig, now: number) {
  const ms = elapsed(st, now)
  const hours = ms / HOUR_MS
  const people = st.group1 + st.group2
  const peopleHours = hours * people
  const hourlyCost = st.group1 * cfg.group1HourlyRate + st.group2 * cfg.group2HourlyRate
  return {
    minutes: ms / MINUTE_MS,
    people,
    peopleHours,
    peopleDays: peopleHours / cfg.workingHoursPerDay,
    hourlyCost,
    totalCost: hours * hourlyCost,
  }
}

// colour of the cost tile: short and small = positive
export function efficiency(minutes: number, people: number): "positive" | "warning" | "negative" {
  if (minutes <= 30 && people <= 6) return "positive"
  if (minutes <= 60 && people <= 8) return "warning"
  return "negative"
}

export const eur = (amount: number) => `${Math.round(amount)} €`

// what the people hours could have been used for
export const activities = (peopleHours: number) => ({
  codeLines: Math.round(peopleHours * 50),
  emails: Math.round(peopleHours * 12),
  jogKm: Math.round(peopleHours * 10),
  drinks: Math.round((peopleHours * 60) / 7),
  movies: Math.round(peopleHours * 1.5),
})

// what the money could have been used for
export const purchases = (cost: number) => ({
  coffees: Math.round(cost / 2),
  pizzas: Math.round(cost / 15),
  tickets: Math.round(cost / 500),
  laptops: Math.round(cost / 1000),
})
