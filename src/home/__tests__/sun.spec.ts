import { describe, expect, it } from "vitest"

import { sunTimes } from "../sun"

// minutes between result and expected UTC time
const diffMin = (actual: Date | undefined, iso: string) =>
  Math.abs((actual?.getTime() ?? 0) - Date.parse(iso)) / 60_000

describe("sunTimes", () => {
  it("Berlin midsummer", () => {
    const s = sunTimes(new Date("2026-06-21T12:00:00Z"), 52.52, 13.405)
    expect(diffMin(s?.sunrise, "2026-06-21T02:43:00Z")).toBeLessThan(3)
    expect(diffMin(s?.sunset, "2026-06-21T19:33:00Z")).toBeLessThan(3)
  })

  it("equator at equinox: ~12h day", () => {
    const s = sunTimes(new Date("2026-03-20T12:00:00Z"), 0, 0)
    expect(diffMin(s?.sunrise, "2026-03-20T06:05:00Z")).toBeLessThan(3)
    expect(diffMin(s?.sunset, "2026-03-20T18:12:00Z")).toBeLessThan(3)
  })

  it("polar night: undefined", () => {
    expect(sunTimes(new Date("2026-12-21T12:00:00Z"), 69.65, 18.96)).toBeUndefined()
  })
})
