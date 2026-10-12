import { describe, expect, it } from "vitest"

import {
  catchUp,
  cycleRound,
  DEFAULT_SETTINGS,
  initialState,
  isInitial,
  next,
  type Phase,
  pause,
  remaining,
  start,
} from "../pomodoro"

const s = DEFAULT_SETTINGS
const MIN = 60_000

describe("pomodoro", () => {
  it("phase sequence with long break after 4 focus rounds", () => {
    let st = initialState(s)
    const phases: Phase[] = [st.phase]
    for (let i = 0; i < 9; i++) {
      st = next(st, s)
      phases.push(st.phase)
    }
    expect(phases).toEqual([
      "focus",
      "short",
      "focus",
      "short",
      "focus",
      "short",
      "focus",
      "long",
      "focus",
      "short",
    ])
    expect(st.round).toBe(5)
    expect(cycleRound(st, s)).toBe(1)
  })

  it("pause and resume keeps remaining time", () => {
    let st = start(initialState(s), 0)
    expect(remaining(st, 10 * MIN)).toBe(15 * MIN)
    st = pause(st, 10 * MIN)
    expect(remaining(st, 99 * MIN)).toBe(15 * MIN)
    st = start(st, 100 * MIN)
    expect(st.endTs).toBe(115 * MIN)
  })

  it("catch up after background: phases chain on their end timestamps", () => {
    const st = start(initialState(s), 0)
    // focus ends at 25, short break at 30 -> in focus round 2 at 31 min
    const { state, ended } = catchUp(st, s, 31 * MIN)
    expect(ended).toBe(true)
    expect(state).toMatchObject({ phase: "focus", round: 2, endTs: 55 * MIN })
    expect(catchUp(state, s, 32 * MIN).ended).toBe(false)
  })

  it("skip while paused does not start", () => {
    const st = next(initialState(s), s)
    expect(st).toEqual({ phase: "short", round: 1, remainingMs: 5 * MIN, endTs: undefined })
  })

  it("isInitial: only a fresh, not running state", () => {
    const st = initialState(s)
    expect(isInitial(st, s)).toBe(true)
    expect(isInitial(start(st, 0), s)).toBe(false)
    expect(isInitial(next(st, s), s)).toBe(false)
  })
})
