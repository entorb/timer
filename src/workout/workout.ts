export type Phase = "prepare" | "work" | "rest" | "done"
export type Cue = "beep" | "go" | "tick" | "gong" | "cheers"

export interface Workout {
  id: string
  name: string
  prepare: number // seconds
  work: number
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

export const DEFAULT_WORKOUT: Workout = {
  id: "tabata",
  name: "Tabata",
  prepare: 5,
  work: 20,
  rest: 10,
  reps: 8,
}

// prepare, then work/rest per rep, no rest after the last rep
export function segments(w: Workout): Segment[] {
  const list: Segment[] = []
  let start = 0
  const push = (phase: Phase, rep: number, seconds: number) => {
    if (seconds <= 0) return
    list.push({ phase, rep, start, duration: seconds * 1000 })
    start += seconds * 1000
  }
  push("prepare", 0, w.prepare)
  for (let rep = 1; rep <= w.reps; rep++) {
    push("work", rep, w.work)
    if (rep < w.reps) push("rest", rep, w.rest)
  }
  return list
}

export const totalMs = (w: Workout) => (w.prepare + w.reps * w.work + (w.reps - 1) * w.rest) * 1000

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
  if (seg == null) return { phase: "done" as Phase, rep: w.reps, remainingMs: 0, progress: 1 }
  const remainingMs = seg.start + seg.duration - elapsedMs
  return { phase: seg.phase, rep: seg.rep, remainingMs, progress: 1 - remainingMs / seg.duration }
}

// all cues of the workout with their time, sorted
function cueTimes(w: Workout): Array<{ at: number; cue: Cue }> {
  const list: Array<{ at: number; cue: Cue }> = []
  for (const s of segments(w)) {
    const end = s.start + s.duration
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
export const cuesBetween = (w: Workout, fromMs: number, toMs: number): Cue[] =>
  cueTimes(w)
    .filter((c) => c.at > fromMs && c.at <= toMs)
    .map((c) => c.cue)

// elapsed ms to jump to: dir 1 = next segment start (or end), dir -1 = current segment start,
// previous one if within the first second (like a media player)
export function skipTarget(w: Workout, elapsedMs: number, dir: 1 | -1): number {
  const starts = segments(w).map((s) => s.start)
  if (dir === 1) return starts.find((s) => s > elapsedMs) ?? totalMs(w)
  const before = starts.filter((s) => s <= elapsedMs - 1000)
  return before.at(-1) ?? 0
}
