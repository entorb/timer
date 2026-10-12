import { describe, expect, it } from "vitest"

import {
  activities,
  calc,
  DEFAULT_CONFIG,
  efficiency,
  elapsed,
  initialState,
  isExpired,
  pause,
  reset,
  setPausedMinutes,
  setStartClock,
  start,
  wallStart,
} from "../meeting"

const MIN = 60_000
const HOUR = 60 * MIN
const cfg = { ...DEFAULT_CONFIG, group1HourlyRate: 50, group2HourlyRate: 30 }

describe("meeting", () => {
  it("cost and people hours", () => {
    const st = initialState()
    st.group1 = 2
    st.group2 = 3
    start(st, 0)
    const c = calc(st, cfg, 2 * HOUR)
    expect(c.hourlyCost).toBe(190)
    expect(c.totalCost).toBe(380)
    expect(c.peopleHours).toBe(10)
    expect(c.peopleDays).toBe(1.25)
  })

  it("pause is not counted, also after reload (only timestamps)", () => {
    const st = initialState()
    start(st, 0)
    pause(st, 10 * MIN)
    expect(elapsed(st, 99 * MIN)).toBe(10 * MIN)
    start(st, 30 * MIN)
    expect(st.pausedMs).toBe(20 * MIN)
    expect(elapsed(st, 40 * MIN)).toBe(20 * MIN)
    expect(wallStart(st)).toBe(0)
  })

  it("reset keeps participants", () => {
    const st = initialState()
    st.group1 = 4
    start(st, 0)
    reset(st)
    expect(st).toMatchObject({ group1: 4, pausedMs: 0, timer: { start: undefined } })
  })

  it("set pause minutes shortens elapsed, wall start stays", () => {
    const st = initialState()
    start(st, 0)
    expect(setPausedMinutes(st, 5, HOUR)).toBe(true)
    expect(elapsed(st, HOUR)).toBe(55 * MIN)
    expect(wallStart(st)).toBe(0)
    expect(setPausedMinutes(st, 120, HOUR)).toBe(false)
    expect(setPausedMinutes(st, -1, HOUR)).toBe(false)
  })

  it("set start clock: past ok, future rejected", () => {
    const now = new Date(2026, 0, 5, 12, 0).getTime()
    const st = initialState()
    start(st, now)
    expect(setStartClock(st, "11:30", now)).toBe(true)
    expect(elapsed(st, now)).toBe(30 * MIN)
    expect(setStartClock(st, "12:30", now)).toBe(false)
    expect(setStartClock(st, "", now)).toBe(false)
  })

  it("expires after 24 h", () => {
    const st = initialState()
    start(st, 0)
    expect(isExpired(st, 23 * HOUR)).toBe(false)
    expect(isExpired(st, 25 * HOUR)).toBe(true)
  })

  it("efficiency thresholds", () => {
    expect(efficiency(30, 6)).toBe("positive")
    expect(efficiency(31, 6)).toBe("warning")
    expect(efficiency(30, 9)).toBe("negative")
  })

  it("alternatives", () => {
    expect(activities(10).codeLines).toBe(500)
  })
})
