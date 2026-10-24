import { readJson } from "@/shared/storage"
import { formatClock } from "@/shared/time"

export type Phase = "prepare" | "work" | "rest" | "done"
export type Cue = "beep" | "go" | "tick" | "gong" | "cheers"

export interface Workout {
  id: string
  name: string
  work: number // seconds
  rest: number
  reps: number
}

export interface WorkoutState {
  startTs?: number // set while running: virtual start of elapsed 0
  elapsedMs: number // used while paused
}

export interface Segment {
  phase: Phase
  rep: number // 1-based, 0 for prepare
  start: number // ms from workout start
  duration: number
}

const PREPARE_S = 5

export const DEFAULT_WORKOUT: Workout = {
  id: "default",
  name: "60/3x4",
  work: 60,
  rest: 3,
  reps: 4,
}

export const autoName = (w: Omit<Workout, "id" | "name">) => `${w.work}/${w.rest}x${w.reps}`

export const ORIGIN = "tmr-wo"
export const KEY_WORKOUTS = "tmr-wo-workouts"
export const KEY_SELECTED = "tmr-wo-selected"
export const KEY_STATE = "tmr-wo-state"

// TODO: remove after 25.10.2026
// migration: drop old `prepare` field and old Tabata default
export const loadWorkouts = () =>
  readJson<Array<Workout & { prepare?: number }>>(KEY_WORKOUTS, [])
    .filter((w) => w.id !== "tabata")
    .map(({ prepare: _, ...w }) => w)
export const loadSelectedId = () => readJson(KEY_SELECTED, DEFAULT_WORKOUT.id)
export const loadState = () => readJson<WorkoutState>(KEY_STATE, { elapsedMs: 0 })

// prepare, then work/rest per rep, no rest after the last rep
export function segments(w: Workout): Segment[] {
  const list: Segment[] = []
  let start = 0
  const push = (phase: Phase, rep: number, seconds: number) => {
    if (seconds <= 0) return
    list.push({ phase, rep, start, duration: seconds * 1000 })
    start += seconds * 1000
  }
  push("prepare", 0, PREPARE_S)
  for (let rep = 1; rep <= w.reps; rep++) {
    push("work", rep, w.work)
    if (rep < w.reps) push("rest", rep, w.rest)
  }
  return list
}

export const totalMs = (w: Workout) => (PREPARE_S + w.reps * w.work + (w.reps - 1) * w.rest) * 1000

export const isRunning = (st: WorkoutState) => st.startTs != null

export const elapsed = (st: WorkoutState, now: number) =>
  st.startTs == null ? st.elapsedMs : now - st.startTs

export const start = (st: WorkoutState, now: number): WorkoutState =>
  isRunning(st) ? st : { startTs: now - st.elapsedMs, elapsedMs: st.elapsedMs }

export const pause = (st: WorkoutState, now: number): WorkoutState => ({
  elapsedMs: elapsed(st, now),
})

export function position(w: Workout, elapsedMs: number) {
  const seg = segments(w).find((s) => elapsedMs < s.start + s.duration)
  if (seg == null) {
    return { phase: "done" as Phase, rep: w.reps, remainingMs: 0, duration: 0, progress: 1 }
  }
  const remainingMs = seg.start + seg.duration - elapsedMs
  return {
    phase: seg.phase,
    rep: seg.rep,
    remainingMs,
    duration: seg.duration,
    progress: 1 - remainingMs / seg.duration,
  }
}

// short phases stay in seconds ("20"), longer ones use m:ss ("2:05")
export function formatPhaseTime(remainingMs: number, durationMs: number): string {
  const seconds = Math.ceil(remainingMs / 1000)
  return durationMs < 100_000 ? `${seconds}` : formatClock(seconds * 1000)
}

// most recently started first
export function touchWorkout(workouts: Workout[], id: string): Workout[] {
  const index = workouts.findIndex((w) => w.id === id)
  const used = workouts[index]
  return used == null || index === 0
    ? workouts
    : [used, ...workouts.slice(0, index), ...workouts.slice(index + 1)]
}

// all cues of the workout with their time, sorted
function cueTimes(w: Workout): Array<{ at: number; cue: Cue }> {
  const list: Array<{ at: number; cue: Cue }> = []
  for (const s of segments(w)) {
    const end = s.start + s.duration
    // prepare: silent, user just pressed start
    if (s.phase === "prepare") continue
    for (const before of [3000, 2000, 1000]) {
      if (end - before > s.start) list.push({ at: end - before, cue: "beep" })
    }
    if (s.phase === "work") {
      list.push(
        { at: s.start, cue: "go" },
        { at: s.start + s.duration / 2, cue: "tick" },
        { at: end, cue: s.rep === w.reps ? "cheers" : "gong" },
      )
    }
  }
  return list.sort((a, b) => a.at - b.at)
}

// cues due in (fromMs, toMs]
export const cuesBetween = (w: Workout, fromMs: number, toMs: number) =>
  cueTimes(w).filter((c) => c.at > fromMs && c.at <= toMs)

// elapsed ms to jump to: dir 1 = next segment start (or end), dir -1 = current segment start,
// previous one if within the first second (like a media player)
export function skipTarget(w: Workout, elapsedMs: number, dir: 1 | -1): number {
  const starts = segments(w).map((s) => s.start)
  if (dir === 1) return starts.find((s) => s > elapsedMs) ?? totalMs(w)
  const before = starts.filter((s) => s <= elapsedMs - 1000)
  return before.at(-1) ?? 0
}
