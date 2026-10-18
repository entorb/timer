import { describe, expect, it } from "vitest"
import { DEFAULT_SETTINGS, reviveSets } from "../sets"

describe("reviveSets", () => {
  it("revives dates, fills defaults", () => {
    const [s] = reviveSets([
      {
        id: "a",
        data: [{ date: "2023-01-01T00:00:00Z", items: 3 }],
        settings: { weightedReg: true },
      },
    ])
    expect(s?.id).toBe("a")
    expect(s?.name).toBe("ETA 1")
    expect(s?.target).toBe(0)
    expect(s?.data[0]?.date).toEqual(new Date("2023-01-01T00:00:00Z"))
    expect(s?.settings).toEqual({ ...DEFAULT_SETTINGS, weightedReg: true })
  })
})
