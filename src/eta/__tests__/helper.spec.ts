import { describe, expect, it } from "vitest"
import { lang } from "@/shared/i18n"
import {
  formatDateTime,
  secondsToString as helperSecondsToString,
  parseDecimal,
} from "@/shared/time"
import {
  helperCalcSpeedFromPreviousRow,
  helperDateToIsoString,
  helperValueToString,
} from "../helper"

describe("formatDateTime", () => {
  it("time without showing days", () => {
    lang.value = "de"
    const datetime = new Date("2023-10-17T12:34:56Z")
    expect(formatDateTime(datetime, false)).toBe("14:34:56")
    lang.value = "en"
    expect(formatDateTime(datetime, false)).toBe("14:34:56")
  })

  it("date with showing days", () => {
    lang.value = "de"
    const datetime = new Date("2023-10-17T12:34:56Z")
    expect(formatDateTime(datetime, true)).toBe("17.10., 14:34")
    lang.value = "en"
    expect(formatDateTime(datetime, true)).toBe("17.10., 14:34")
  })
})

describe("helperDateToIsoString", () => {
  it("summer time", () => {
    const datetime = new Date("2023-06-17T12:34:56Z")
    const formattedDate = helperDateToIsoString(datetime)
    expect(formattedDate).toBe("2023-06-17T14:34:56")
  })
  it("winter time", () => {
    const datetime = new Date("2023-12-17T12:34:56Z")
    const formattedDate = helperDateToIsoString(datetime)
    expect(formattedDate).toBe("2023-12-17T13:34:56")
  })
})

describe("helperSecondsToString", () => {
  it.each([
    [">1day", 100_000, "1d 3h"],
    [">1h", 4000, "1h 6m"],
    [">15min", 1000, "16m"],
    [">1min", 100, "1m 40s"],
    ["<=1min", 59, "59s"],
  ])("%s", (_, totalSeconds, expected) => {
    expect(helperSecondsToString(totalSeconds)).toBe(expected)
  })
})

describe("parseDecimal", () => {
  it.each([
    ["123", 123],
    ["123.1", 123.1],
    [" 123,1 ", 123.1],
    ["abc", undefined],
    ["a123", undefined],
    ["123a", undefined],
    ["", undefined],
    ["Infinity", undefined],
  ])("%s", (input, expected) => {
    expect(parseDecimal(input)).toBe(expected)
  })
})

describe("helperValueToString", () => {
  it("various values", () => {
    expect(helperValueToString(1)).toBe("1.00")
    expect(helperValueToString(100)).toBe("100")
    expect(helperValueToString(10_000)).toBe("10000")
    expect(helperValueToString(0.1)).toBe("0.100")
    expect(helperValueToString(0.123)).toBe("0.123")
  })
})

describe("helperCalcSpeedFromPreviousRow", () => {
  it("120 in 1min", () => {
    const prevRow = { date: new Date("2023-01-01 01:01:01"), items: 10 }
    const row = { date: new Date("2023-01-01 01:02:01"), items: 130 }
    expect(helperCalcSpeedFromPreviousRow(row, prevRow)).toBe(2.0)
  })
})

describe("helperClearName", () => {
  it("120 in 1min", () => {
    const prevRow = { date: new Date("2023-01-01 01:01:01"), items: 10 }
    const row = { date: new Date("2023-01-01 01:02:01"), items: 130 }
    expect(helperCalcSpeedFromPreviousRow(row, prevRow)).toBe(2.0)
  })
})
