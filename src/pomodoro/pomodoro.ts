export type Phase = "focus" | "short" | "long"

export interface PomoSettings {
  focus: number // minutes
  short: number
  long: number
  rounds: number // focus rounds until long break
}

export interface PomoState {
  phase: Phase
  round: number // 1-based count of focus rounds, keeps growing
  endTs?: number // set while running
  remainingMs: number // used while paused
}

export const DEFAULT_SETTINGS: PomoSettings = { focus: 25, short: 5, long: 15, rounds: 4 }

export const phaseMs = (s: PomoSettings, phase: Phase) => s[phase] * 60_000

export const initialState = (s: PomoSettings): PomoState => ({
  phase: "focus",
  round: 1,
  remainingMs: phaseMs(s, "focus"),
})

export const isRunning = (st: PomoState) => st.endTs != null

export const remaining = (st: PomoState, now: number) =>
  st.endTs == null ? st.remainingMs : Math.max(0, st.endTs - now)

// position within the current cycle, 1..rounds
export const cycleRound = (st: PomoState, s: PomoSettings) => ((st.round - 1) % s.rounds) + 1

export const start = (st: PomoState, now: number): PomoState =>
  isRunning(st) ? st : { ...st, endTs: now + st.remainingMs }

export const pause = (st: PomoState, now: number): PomoState => ({
  ...st,
  endTs: undefined,
  remainingMs: remaining(st, now),
})

// next phase; if running, it starts at startTs (end of previous phase)
export function next(st: PomoState, s: PomoSettings, startTs?: number): PomoState {
  let phase: Phase = "focus"
  let { round } = st
  if (st.phase === "focus") phase = cycleRound(st, s) === s.rounds ? "long" : "short"
  else round += 1
  const duration = phaseMs(s, phase)
  return {
    phase,
    round,
    remainingMs: duration,
    endTs: startTs == null ? undefined : startTs + duration,
  }
}

// advance over all phases that ended until now (e.g. app was in background)
// returns the new state and whether at least one phase ended
export function catchUp(st: PomoState, s: PomoSettings, now: number) {
  let state = st
  let ended = false
  while (state.endTs != null && state.endTs <= now) {
    state = next(state, s, state.endTs)
    ended = true
  }
  return { state, ended }
}
