import { describe, expect, it } from "vitest"
import { calcStats, estimate } from "../stats"

const t0 = new Date("2023-01-01T00:00:00Z").getTime()
const row = (sec: number, items: number) => ({ date: new Date(t0 + sec * 1000), items })

describe("calcStats", () => {
  it("needs 2 rows", () => {
    expect(calcStats([row(0, 1)], 10, false)).toBeNull()
  })

  it("count-up: 1 item/sec, 10 to go after 10 sec", () => {
    const s = calcStats([row(0, 0), row(10, 10)], 20, false)
    expect(s?.etaMs).toBe(t0 + 20_000)
  })

  it("count-down: 100 -> 50 in 50 sec", () => {
    const s = calcStats([row(0, 100), row(50, 50)], 0, false)
    expect(s?.rate).toBe(1)
    expect(s?.etaMs).toBe(t0 + 100_000)
  })

  it("moving away from target: no ETA", () => {
    expect(calcStats([row(0, 10), row(10, 5)], 20, false)?.etaMs).toBe(0)
  })
})

describe("estimate", () => {
  const s = calcStats([row(0, 0), row(10, 10)], 20, false)
  if (s == null) throw new Error("no stats")

  it("halfway between last input and ETA", () => {
    const e = estimate(s, t0 + 15_000)
    expect(e.percent).toBe(0.75)
    expect(e.secToEta).toBe(5)
    expect(e.secSinceLast).toBe(5)
    expect(e.reached).toBe(false)
  })

  it("stops at ETA", () => {
    const e = estimate(s, t0 + 99_000)
    expect(e.percent).toBe(1)
    expect(e.secToEta).toBe(0)
    expect(e.secSinceFirst).toBe(20)
    expect(e.reached).toBe(true)
  })
})
