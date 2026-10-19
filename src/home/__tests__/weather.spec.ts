import { mdiWeatherLightning, mdiWeatherNight, mdiWeatherSunny } from "@quasar/extras/mdi-v7"
import { describe, expect, it } from "vitest"

import {
  currentWeather,
  isStale,
  parseWeather,
  tempColor,
  tempGradient,
  tempLabels,
  todayHours,
  type Weather,
  weatherIcon,
  weatherUrl,
} from "../weather"

const C = { lat: 52.5, lon: 13.4 }
const HOUR_MS = 3_600_000
// 48 hourly values from local midnight, code = hours since start
const start = new Date(2026, 9, 18).getTime()
const time = Array.from({ length: 48 }, (_, i) => (start + i * HOUR_MS) / 1000)
const W: Weather = {
  ...C,
  fetchedAt: start,
  time,
  code: time.map((_, i) => i),
  temp: time.map((_, i) => i / 2),
}

describe("weather", () => {
  it("weatherUrl: coords + unixtime", () => {
    expect(weatherUrl(C)).toMatch(/latitude=52\.5&longitude=13\.4&.*timeformat=unixtime/)
  })

  it("parseWeather: picks hourly arrays, rejects bad shape", () => {
    const json = { hourly: { time: [1, 2], weather_code: [3, null], temperature_2m: [9.5, 8] } }
    expect(parseWeather(json, C, 42)).toEqual({
      ...C,
      fetchedAt: 42,
      time: [1, 2],
      code: [3, null],
      temp: [9.5, 8],
    })
    expect(parseWeather(null, C, 0)).toBeUndefined()
    expect(
      parseWeather({ hourly: { time: [1], weather_code: [], temperature_2m: [1] } }, C, 0),
    ).toBeUndefined()
    expect(
      parseWeather({ hourly: { time: ["x"], weather_code: [1], temperature_2m: [1] } }, C, 0),
    ).toBeUndefined()
  })

  it("isStale: missing, other coords, older than 1h", () => {
    expect(isStale(null, C, start)).toBe(true)
    expect(isStale(W, C, start + HOUR_MS - 1)).toBe(false)
    expect(isStale(W, C, start + HOUR_MS)).toBe(true)
    expect(isStale(W, { ...C, lon: 13.5 }, start)).toBe(true)
  })

  it("currentWeather: values of current hour", () => {
    expect(currentWeather(W, start + 5.5 * HOUR_MS)).toEqual({ code: 5, temp: 2.5 })
    expect(currentWeather(W, start - HOUR_MS)).toBeUndefined()
  })

  it("todayHours: today's local hours only, nulls skipped", () => {
    const today = todayHours(W, start + 13.5 * HOUR_MS)
    expect(today).toHaveLength(24)
    expect(today[5]).toEqual({ hour: 5, code: 5, temp: 2.5 })
    expect(todayHours(W, start + 25 * HOUR_MS)[1]).toEqual({ hour: 1, code: 25, temp: 12.5 })
    expect(todayHours({ ...W, temp: W.temp.map(() => null) }, start)).toEqual([])
  })

  it("tempColor: coldest blue .. warmest red, clamped", () => {
    expect(tempColor(0, 0, 20)).toBe("hsl(240 90% 68%)")
    expect(tempColor(10, 0, 20)).toBe("hsl(120 90% 68%)")
    expect(tempColor(20, 0, 20)).toBe("hsl(0 90% 68%)")
    expect(tempColor(-5, 0, 20)).toBe(tempColor(0, 0, 20))
  })

  it("tempColor: flat day stays centered, small range still spreads", () => {
    expect(tempColor(10, 10, 10)).toBe("hsl(120 90% 68%)")
    expect(tempColor(12, 10, 14)).not.toBe(tempColor(10, 10, 14))
  })

  it("tempGradient: hour stops relative to day range, first color closes at 360deg", () => {
    const g = tempGradient(todayHours(W, start))
    expect(g).toMatch(/^conic-gradient\(hsl\(240 90% 68%\) 0deg, /)
    expect(g).toMatch(/hsl\(0 90% 68%\) 345deg, hsl\(240 90% 68%\) 360deg\)$/)
    expect(tempGradient([])).toBeUndefined()
  })

  it("tempLabels: even hours, past only if < 1h old", () => {
    const hours = todayHours(W, start)
    expect(tempLabels(hours, 14.4).map((h) => h.hour)).toEqual([14, 16, 18, 20, 22])
    expect(tempLabels(hours, 15).map((h) => h.hour)).toEqual([16, 18, 20, 22])
    expect(tempLabels(hours, 0.5)).toHaveLength(12)
  })

  it("weatherIcon: day/night for clear, 95+ thunderstorm", () => {
    expect(weatherIcon(0, true)).toBe(mdiWeatherSunny)
    expect(weatherIcon(0, false)).toBe(mdiWeatherNight)
    expect(weatherIcon(61, false)).toBe(weatherIcon(80, true))
    expect(weatherIcon(61, true)).not.toBe(weatherIcon(3, true))
    expect(weatherIcon(65, true)).not.toBe(weatherIcon(61, true))
    expect(weatherIcon(95, true)).toBe(mdiWeatherLightning)
  })
})
