import { describe, expect, it } from "vitest"

import { moonPath, moonPhase } from "../moon"

describe("moon", () => {
  it("moonPhase: known full and new moon, within ~0.5 day", () => {
    expect(moonPhase(new Date("2026-01-03T10:03:00Z"))).toBeCloseTo(0.5, 1)
    const p = moonPhase(new Date("2026-01-18T19:52:00Z"))
    expect(Math.min(p, 1 - p)).toBeLessThan(0.02)
  })

  it("moonPath: waxing lit right, waning lit left, full = circle", () => {
    expect(moonPath(0.1, 7)).toMatch(/^M 0 -7 A 7 7 0 0 1 0 7 A [\d.]+ 7 0 0 0 0 -7 Z$/)
    expect(moonPath(0.9, 7)).toMatch(/^M 0 -7 A 7 7 0 0 0 0 7 A [\d.]+ 7 0 0 1 0 -7 Z$/)
    expect(moonPath(0.5, 7)).toBe("M 0 -7 A 7 7 0 0 1 0 7 A 7 7 0 0 1 0 -7 Z")
  })
})
