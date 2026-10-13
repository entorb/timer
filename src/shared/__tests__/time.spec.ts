import { describe, expect, it } from "vitest"

import { lang } from "../i18n"
import {
  formatClock,
  formatDateTime,
  pad,
  parseClock,
  parseDecimal,
  secondsToString,
  UNIT_SECONDS,
} from "../time"

describe("parseDecimal", () => {
  it("parses dot and comma", () => {
    expect(parseDecimal("1.5")).toBe(1.5)
    expect(parseDecimal(" 1,5 ")).toBe(1.5)
    expect(parseDecimal("-2")).toBe(-2)
  })

  it("rejects empty and non-numeric", () => {
    expect(parseDecimal("")).toBeUndefined()
    expect(parseDecimal("  ")).toBeUndefined()
    expect(parseDecimal("abc")).toBeUndefined()
    expect(parseDecimal("Infinity")).toBeUndefined()
  })
})

describe("secondsToString", () => {
  it.each([
    [0, "0s"],
    [59, "59s"],
    [60, "1m 0s"],
    [14 * 60 + 59, "14m 59s"],
    [15 * 60 + 30, "15m"], // >= 15 min drops seconds
    [3600, "1h 0m"],
    [3600 + 90, "1h 1m"],
    [86_400, "1d 0h 0m"],
    [86_400 + 3600 + 120, "1d 1h 2m"],
    [1.6, "2s"],
  ])("%s -> %s", (input, expected) => {
    expect(secondsToString(input)).toBe(expected)
  })
})

describe("formatClock", () => {
  it("formats m:ss and h:mm:ss", () => {
    expect(formatClock(0)).toBe("0:00")
    expect(formatClock(3000)).toBe("0:03")
    expect(formatClock(123_000)).toBe("2:03")
    expect(formatClock(3_723_000)).toBe("1:02:03")
  })

  it("adds tenths, floored", () => {
    expect(formatClock(123_450, true)).toBe("2:03.4")
    expect(formatClock(999, true)).toBe("0:00.9")
  })

  it("clamps negative to zero", () => {
    expect(formatClock(-500, true)).toBe("0:00.0")
  })
})

describe("parseClock", () => {
  it("parses plain seconds, m:ss, h:mm:ss", () => {
    expect(parseClock("3.5")).toBe(3500)
    expect(parseClock("2:03")).toBe(123_000)
    expect(parseClock("1:02:03.4")).toBe(3_723_400)
    expect(parseClock("0:03,5")).toBe(3500)
  })

  it("rejects invalid", () => {
    expect(parseClock("")).toBeUndefined()
    expect(parseClock("a:b")).toBeUndefined()
    expect(parseClock("-1:00")).toBeUndefined()
    expect(parseClock("1:2:3:4")).toBeUndefined()
  })

  it("roundtrips formatClock", () => {
    for (const ms of [0, 3000, 123_400, 3_723_400]) {
      expect(parseClock(formatClock(ms, true))).toBe(ms)
    }
  })
})

describe("formatDateTime", () => {
  const d = new Date(2025, 9, 17, 14, 34, 56) // local time

  it("German format in both languages", () => {
    for (const l of ["en", "de"] as const) {
      lang.value = l
      expect(formatDateTime(d)).toBe("14:34:56")
      expect(formatDateTime(d, true)).toBe("17.10., 14:34")
    }
  })
})

describe("constants", () => {
  it("pad + UNIT_SECONDS", () => {
    expect(pad(5)).toBe("05")
    expect(pad(12)).toBe("12")
    expect(UNIT_SECONDS.day).toBe(24 * UNIT_SECONDS.hour)
  })
})
