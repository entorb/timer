import { describe, expect, it } from "vitest"
import { calculateXAndY, helperLinReg } from "../helperLinReg"

describe("calculateXAndY", () => {
  it("converts Date to Timestamp and subtracts the first timestamp", () => {
    const data = [
      { date: new Date("2023-01-01 01:01:01"), items: 10 },
      { date: new Date("2023-01-01 01:01:02"), items: 20 },
      { date: new Date("2023-01-01 01:01:03"), items: 30 },
      { date: new Date("2023-01-01 01:01:04"), items: 44 },
    ]

    const result = calculateXAndY(data)

    expect(result.seconds).toEqual([0, 1, 2, 3])
    expect(result.items).toEqual([10, 20, 30, 44])
  })
})

describe("helperLinReg", () => {
  it("calculates the slope and intercept bad data of only 1 row", () => {
    const data = [{ date: new Date("2023-01-01 01:01:01"), items: 10 }]

    const result = helperLinReg(data, false)

    expect(result.slope).toBe(0)
    expect(result.intercept).toBe(0)
  })

  it("calculates the slope and intercept poor data of only 2 rows", () => {
    const data = [
      { date: new Date("2023-01-01 01:01:01"), items: 10 },
      { date: new Date("2023-01-01 01:01:02"), items: 40 },
    ]

    const result = helperLinReg(data, false)

    expect(result.slope).toBe(30)
    expect(result.intercept).toBe(10)
  })

  it("calculates the slope and intercept for data without weighting", () => {
    const data = [
      { date: new Date("2023-01-01 01:01:01"), items: 10 },
      { date: new Date("2023-01-01 01:01:02"), items: 20 },
      { date: new Date("2023-01-01 01:01:03"), items: 30 },
      { date: new Date("2023-01-01 01:01:04"), items: 44 },
    ]

    const result = helperLinReg(data, false)

    expect(result.slope).toBe(11.2)
    expect(result.intercept).toBeCloseTo(9.2, 1)
  })

  it("calculates the slope and intercept for weighted data", () => {
    const data = [
      { date: new Date("2023-01-01 01:01:01"), items: 10 },
      { date: new Date("2023-01-01 01:01:02"), items: 20 },
      { date: new Date("2023-01-01 01:01:03"), items: 30 },
      { date: new Date("2023-01-01 01:01:04"), items: 44 },
    ]

    const result = helperLinReg(data, true)

    expect(result.slope).toBe(11.6)
    expect(result.intercept).toBeCloseTo(8.4, 1)
  })

  it("handles data with only 2 points", () => {
    const data = [
      { date: new Date("2023-10-17T00:00:00Z"), items: 1 },
      { date: new Date("2023-10-17T00:00:00Z"), items: 2 },
    ]

    const result = helperLinReg(data)

    expect(result.slope).toBe(0)
    expect(result.intercept).toBe(0)
  })
})
