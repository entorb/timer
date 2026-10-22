import { describe, expect, it } from "vitest"
import {
  calendarDays,
  finalCountdown,
  loadEvents,
  parseTime,
  remaining,
  saveEvents,
} from "../anticipation"

const DAY = 86_400_000

describe("remaining", () => {
  const event = { name: "Trip", date: new Date(10 * DAY) }

  it("counts calendar days, ignores time of day", () => {
    const ev = { name: "Trip", date: new Date(2026, 10, 3, 20, 0) }
    expect(remaining(ev, new Date(2026, 9, 22, 10, 0).getTime()).days).toBe(12)
    expect(remaining(ev, new Date(2026, 9, 22, 23, 0).getTime()).days).toBe(12)
    expect(remaining(ev, new Date(2026, 10, 3, 8, 0).getTime()).days).toBe(0)
  })

  it("counts past time", () => {
    expect(remaining(event, 11 * DAY)).toMatchObject({ seconds: 86_400, past: true })
  })
})

describe("persistence", () => {
  it("roundtrips dates", () => {
    const events = [{ name: "Trip", date: new Date(10 * DAY) }]
    saveEvents(events)
    expect(loadEvents()).toStrictEqual(events)
    saveEvents([])
    expect(loadEvents()).toStrictEqual([])
  })
})

describe("parseTime", () => {
  it.each([
    ["", 0, 0],
    ["14", 14, 0],
    ["14:30", 14, 30],
    ["9.5", 9, 5],
    ["2", 2, 0],
    ["2000", 20, 0],
    ["930", 9, 30],
    [" 7 ", 7, 0],
  ])("%s", (input, hour, minute) => {
    expect(parseTime(input)).toStrictEqual({ hour, minute })
  })

  it.each(["24", "12:60", "2460", "12345", "abc", "1:2:3"])("rejects '%s'", (input) => {
    expect(parseTime(input)).toBeUndefined()
  })
})

it("calendarDays across DST", () => {
  expect(calendarDays(new Date(2026, 9, 24, 23), new Date(2026, 9, 26, 1))).toBe(2)
})

describe("finalCountdown", () => {
  it.each([
    [86_400, undefined],
    [86_399, "23:59"],
    [3600, "01:00"],
    [3599, "59:59"],
    [65.7, "01:05"],
    [0, "00:00"],
  ])("%s -> %s", (seconds, expected) => {
    expect(finalCountdown(seconds)).toBe(expected)
  })
})
