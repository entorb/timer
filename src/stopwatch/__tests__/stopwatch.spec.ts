import { describe, expect, it } from "vitest"

import { formatClock, parseClock } from "@/shared/time"

import {
  type Athlete,
  elapsed,
  isRunning,
  lap,
  lapStats,
  lapTimes,
  nextLapForecast,
  reset,
  setLapTime,
  start,
  stop,
  toCsv,
} from "../stopwatch"

const athlete = (): Athlete => ({ id: 1, name: "A", laps: [] })

describe("stopwatch", () => {
  it("records laps, last and best", () => {
    const a = athlete()
    start(a, 1000)
    lap(a, 31_000) // 30s
    lap(a, 56_000) // 25s
    lap(a, 84_000) // 28s
    expect(lapTimes(a)).toEqual([30_000, 25_000, 28_000])
    expect(lapStats(a, 90_000)).toEqual({ count: 3, current: 6000, last: 28_000, best: 25_000 })
    expect(elapsed(a, 90_000)).toBe(89_000)
  })

  it("ignores laps when not running", () => {
    const a = athlete()
    lap(a, 5000)
    expect(a.laps).toEqual([])
    start(a, 0)
    stop(a, 10_000)
    lap(a, 12_000)
    expect(a.laps).toEqual([])
    expect(elapsed(a, 99_000)).toBe(10_000)
  })

  it("resume after stop shifts by pause, keeping lap times", () => {
    const a = athlete()
    start(a, 0)
    lap(a, 10_000)
    stop(a, 15_000)
    start(a, 115_000) // 100s pause
    expect(isRunning(a)).toBe(true)
    expect(elapsed(a, 120_000)).toBe(20_000)
    expect(lapTimes(a)).toEqual([10_000])
    lap(a, 125_000)
    expect(lapTimes(a)).toEqual([10_000, 15_000])
  })

  it("common start: same start time for all, starting a running athlete is a no-op", () => {
    const list = [athlete(), { ...athlete(), id: 2 }]
    for (const a of list) start(a, 500)
    for (const a of list) start(a, 900)
    expect(list.map((a) => a.start)).toEqual([500, 500])
  })

  it("undo last lap and reset", () => {
    const a = athlete()
    start(a, 0)
    lap(a, 1000)
    lap(a, 3000)
    a.laps.pop()
    expect(lapTimes(a)).toEqual([1000])
    reset(a)
    expect(a).toEqual(athlete())
  })

  it("csv export", () => {
    const a = athlete()
    start(a, 0)
    lap(a, 61_000)
    lap(a, 125_500)
    expect(toCsv([a], (ms) => formatClock(ms, true))).toBe(
      "name;lap;lap time;split\nA;1;1:01.0;1:01.0\nA;2;1:04.5;2:05.5",
    )
  })
})

describe("nextLapForecast", () => {
  const withLaps = (laps: number[]): Athlete => ({ ...athlete(), start: 0, laps })

  it("needs a running athlete with at least one lap", () => {
    expect(nextLapForecast(athlete(), 0)).toBeUndefined()
    expect(nextLapForecast(withLaps([]), 5000)).toBeUndefined()
    expect(nextLapForecast({ ...withLaps([10_000]), stop: 12_000 }, 12_000)).toBeUndefined()
  })

  it("one lap: same time again", () => {
    expect(nextLapForecast(withLaps([10_000]), 14_000)).toEqual({ lapTime: 10_000, dueIn: 6000 })
  })

  it("follows a linear trend", () => {
    // laps 10, 12, 14 s -> 16 s
    const f = nextLapForecast(withLaps([10_000, 22_000, 36_000]), 40_000)
    expect(f?.lapTime).toBeCloseTo(16_000)
    expect(f?.dueIn).toBeCloseTo(12_000)
  })

  it("weights latest laps most", () => {
    // laps 20, 10, 10, 10 s: weighted fit gives 7 s, unweighted would give 5 s
    const f = nextLapForecast(withLaps([20_000, 30_000, 40_000, 50_000]), 50_000)
    expect(f?.lapTime).toBeCloseTo(7000)
  })

  it("overdue gives negative dueIn", () => {
    expect(nextLapForecast(withLaps([10_000]), 25_000)?.dueIn).toBe(-5000)
  })
})

describe("formatClock", () => {
  it.each([
    [0, false, "0:00"],
    [3400, true, "0:03.4"],
    [125_999, true, "2:05.9"],
    [3_723_000, false, "1:02:03"],
    [-5, false, "0:00"],
  ])("%d", (ms, tenths, expected) => {
    expect(formatClock(ms, tenths)).toBe(expected)
  })
})

describe("setLapTime", () => {
  const withLaps = (): Athlete => ({ id: 1, name: "A", start: 0, laps: [10_000, 25_000, 30_000] })

  it("changes only own split, next lap time follows", () => {
    const a = withLaps()
    expect(setLapTime(a, 1, 12_000, 60_000)).toBe(true)
    expect(a.laps).toEqual([10_000, 22_000, 30_000])
    expect(lapTimes(a)).toEqual([10_000, 12_000, 8000])
  })

  it("rejects invalid or too long lap time", () => {
    const a = withLaps()
    expect(setLapTime(a, 1, 0, 60_000)).toBe(false)
    expect(setLapTime(a, 5, 1000, 60_000)).toBe(false)
    expect(setLapTime(a, 0, 25_000, 60_000)).toBe(false) // reaches next mark
    expect(setLapTime(a, 2, 51_000, 60_000)).toBe(false) // beyond now
    expect(a.laps).toEqual([10_000, 25_000, 30_000])
  })
})

describe("parseClock", () => {
  it("is the inverse of formatClock", () => {
    for (const ms of [0, 3000, 62_400, 3_723_400])
      expect(parseClock(formatClock(ms, true))).toBe(ms)
  })

  it("accepts plain seconds and comma, rejects garbage", () => {
    expect(parseClock("12,5")).toBe(12_500)
    expect(parseClock("1:30")).toBe(90_000)
    expect(parseClock("")).toBeUndefined()
    expect(parseClock("a:10")).toBeUndefined()
    expect(parseClock("-5")).toBeUndefined()
    expect(parseClock("1:2:3:4")).toBeUndefined()
  })
})
