import { describe, expect, it } from "vitest"

import {
  cuesBetween,
  DEFAULT_WORKOUT,
  elapsed,
  formatPhaseTime,
  pause,
  position,
  segments,
  skipTarget,
  start,
  totalMs,
  touchWorkout,
} from "../workout"

const w = DEFAULT_WORKOUT
const S = 1000
const cues = (...args: Parameters<typeof cuesBetween>) => cuesBetween(...args).map((c) => c.cue)

describe("workout", () => {
  it("segments: prepare, work/rest, no trailing rest", () => {
    const segs = segments(w)
    expect(segs).toHaveLength(1 + 8 + 7)
    expect(segs.at(-1)).toMatchObject({ phase: "work", rep: 8 })
    expect(totalMs(w)).toBe(235 * S)
    const last = segs.at(-1)
    expect((last?.start ?? 0) + (last?.duration ?? 0)).toBe(totalMs(w))
  })

  it("position at boundaries", () => {
    expect(position(w, 0)).toMatchObject({ phase: "prepare", remainingMs: 5 * S, duration: 5 * S })
    expect(position(w, 5 * S)).toMatchObject({ phase: "work", rep: 1, remainingMs: 20 * S })
    expect(position(w, 25 * S)).toMatchObject({ phase: "rest", rep: 1, remainingMs: 10 * S })
    expect(position(w, 35 * S)).toMatchObject({ phase: "work", rep: 2 })
    expect(position(w, 235 * S)).toMatchObject({ phase: "done", remainingMs: 0, duration: 0 })
  })

  it("formats short phases as seconds, long phases as m:ss", () => {
    expect(formatPhaseTime(5 * S, 5 * S)).toBe("5")
    expect(formatPhaseTime(99 * S, 99 * S)).toBe("99")
    expect(formatPhaseTime(99 * S, 100 * S)).toBe("1:39")
    expect(formatPhaseTime(125 * S, 300 * S)).toBe("2:05")
    expect(formatPhaseTime(0, 20 * S)).toBe("0")
    expect(formatPhaseTime(0, 0)).toBe("0")
  })

  it("moves the most recently used workout first", () => {
    const workouts = [w, { ...w, id: "b" }, { ...w, id: "c" }]
    expect(touchWorkout(workouts, "c").map((wo) => wo.id)).toEqual(["c", "tabata", "b"])
    expect(touchWorkout(workouts, "tabata")).toBe(workouts)
    expect(touchWorkout(workouts, "missing")).toBe(workouts)
  })

  it("pause and resume keeps elapsed", () => {
    let st = start({ elapsedMs: 0 }, 100 * S)
    expect(elapsed(st, 110 * S)).toBe(10 * S)
    st = pause(st, 110 * S)
    expect(elapsed(st, 999 * S)).toBe(10 * S)
    st = start(st, 200 * S)
    expect(elapsed(st, 201 * S)).toBe(11 * S)
  })

  it("cues: silent prepare, go, tick, countdown, gong, cheers", () => {
    expect(cues(w, -1, 5 * S)).toEqual(["go"])
    expect(cues(w, 5 * S, 15 * S)).toEqual(["tick"])
    expect(cues(w, 15 * S, 25 * S)).toEqual(["beep", "beep", "beep", "gong"])
    expect(cues(w, 230 * S, 235 * S)).toEqual(["beep", "beep", "beep", "cheers"])
  })

  it("no prepare: go right at start", () => {
    expect(cues({ ...w, prepare: 0 }, -1, 0)).toEqual(["go"])
  })

  it("skip: next segment start, back to current or previous start", () => {
    expect(skipTarget(w, 0, 1)).toBe(5 * S)
    expect(skipTarget(w, 10 * S, 1)).toBe(25 * S)
    expect(skipTarget(w, 230 * S, 1)).toBe(235 * S)
    expect(skipTarget(w, 235 * S, 1)).toBe(235 * S)
    expect(skipTarget(w, 10 * S, -1)).toBe(5 * S)
    expect(skipTarget(w, 5.5 * S, -1)).toBe(0)
    expect(skipTarget(w, 0, -1)).toBe(0)
    expect(skipTarget(w, 235 * S, -1)).toBe(215 * S)
  })
})
