import { describe, expect, it } from "vitest"

import { dayMarks, formatDay, hourOf, polar, ringGradient } from "../clock"

describe("clock", () => {
  it("hourOf: fractional local hour", () => {
    expect(hourOf(new Date(2026, 9, 18, 6, 30))).toBe(6.5)
    expect(hourOf(new Date(2026, 9, 18, 23, 59, 59))).toBeCloseTo(24, 3)
  })

  it("polar: 0 top, 6 right, 12 bottom, 18 left", () => {
    const round = (h: number) => {
      const p = polar(h, 10)
      return [Math.round(p.x) + 0, Math.round(p.y) + 0] // + 0: -0 -> 0
    }
    expect(round(0)).toEqual([0, -10])
    expect(round(6)).toEqual([10, 0])
    expect(round(12)).toEqual([0, 10])
    expect(round(18)).toEqual([-10, 0])
  })

  it("dayMarks: noon between sunrise and sunset", () => {
    expect(dayMarks()).toEqual({ midnight: 0, sunrise: 6, noon: 12, sunset: 18 })
    expect(dayMarks(7, 19)).toMatchObject({ midnight: 1, noon: 13 })
    // day crosses device midnight: noon at 1, not 13
    expect(dayMarks(19, 7)).toMatchObject({ midnight: 13, noon: 25, sunset: 31 })
  })

  it("ringGradient: night at midnight, yellow at noon, symmetric", () => {
    const g = ringGradient()
    expect(g).toMatch(/^conic-gradient\(from 0deg, #0b1437 0deg, /)
    expect(g).toContain("#60a5fa 90deg")
    expect(g).toContain("#fbbf24 180deg")
    expect(g).toContain("#60a5fa 270deg")
    expect(g).toMatch(/#0b1437 360deg\)$/)
    expect(ringGradient(7, 19)).toMatch(/^conic-gradient\(from 15deg, /)
  })

  it("formatDay: dd.mm.", () => {
    expect(formatDay(new Date(2026, 0, 5))).toBe("05.01.")
  })
})
