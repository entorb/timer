// hourly forecast from Open-Meteo (free, no key, CORS), WMO weather codes
// https://open-meteo.com/en/docs
import {
  mdiWeatherCloudy,
  mdiWeatherFog,
  mdiWeatherLightning,
  mdiWeatherNight,
  mdiWeatherNightPartlyCloudy,
  mdiWeatherPartlyCloudy,
  mdiWeatherRainy,
  mdiWeatherSnowy,
  mdiWeatherSunny,
} from "@quasar/extras/mdi-v7"
import { UNIT_SECONDS } from "@/shared/time"
import type { Coords } from "./useGeo"

const API = "https://api.open-meteo.com/v1/forecast"
const HOUR_MS = UNIT_SECONDS.hour * 1000
const DAY_MS = UNIT_SECONDS.day * 1000

// hourly arrays share index; time in unix seconds (GMT), values null when model has no data
export interface Weather extends Coords {
  fetchedAt: number
  time: number[]
  code: Array<number | null>
  temp: Array<number | null>
}

// unixtime: hours map to device-local time like the ring; timezone=auto: today = location's day
export const weatherUrl = (c: Coords) =>
  `${API}?latitude=${c.lat}&longitude=${c.lon}&hourly=temperature_2m,weather_code&forecast_days=1&timezone=auto&timeformat=unixtime`

interface Response {
  hourly?: { time?: unknown; weather_code?: unknown; temperature_2m?: unknown }
}

const isValues = (v: unknown, len: number): v is Array<number | null> =>
  Array.isArray(v) && v.length === len && v.every((x) => x === null || typeof x === "number")

// response from network: undefined on unexpected shape
export function parseWeather(json: unknown, c: Coords, now: number): Weather | undefined {
  const h = (json as Response | null)?.hourly
  const time = h?.time
  if (!Array.isArray(time) || !time.every((x) => typeof x === "number")) return undefined
  const code = h?.weather_code
  const temp = h?.temperature_2m
  if (!isValues(code, time.length) || !isValues(temp, time.length)) return undefined
  return { lat: c.lat, lon: c.lon, fetchedAt: now, time, code, temp }
}

export const isStale = (w: Weather | null, c: Coords, now: number) =>
  w?.lat !== c.lat || w.lon !== c.lon || now - w.fetchedAt >= HOUR_MS

// values of the hour containing `now`
export function currentWeather(w: Weather, now: number) {
  const i = w.time.indexOf(Math.floor(now / HOUR_MS) * UNIT_SECONDS.hour)
  const code = w.code[i]
  const temp = w.temp[i]
  return code == null || temp == null ? undefined : { code, temp }
}

export interface Hour {
  hour: number
  code: number
  temp: number
}

// today's local hours with data
export function todayHours(w: Weather, now: number): Hour[] {
  const day = new Date(now)
  day.setHours(0, 0, 0, 0)
  const start = day.getTime()
  return w.time.flatMap((t, i) => {
    const ms = t * 1000
    const code = w.code[i]
    const temp = w.temp[i]
    const skip = ms < start || ms >= start + DAY_MS || code == null || temp == null
    return skip ? [] : [{ hour: new Date(ms).getHours(), code, temp }]
  })
}

// pastel hue: -10° blue (240), 0° cyan, 10° green, 20° yellow, 30° red (0)
export const tempColor = (t: number) =>
  `hsl(${Math.min(240, Math.max(0, 240 - (t + 10) * 6))} 85% 78%)`

// conic gradient, hour stops; closes with first color: no seam at midnight, 1 hour still valid
export function tempGradient(hours: Hour[]): string | undefined {
  const first = hours[0]
  if (first == null) return undefined
  const stops = hours.map((h) => `${tempColor(h.temp)} ${h.hour * 15}deg`)
  return `conic-gradient(${stops.join(", ")}, ${tempColor(first.temp)} 360deg)`
}

// even hours like the ring numbers; past hours hidden unless < 1h old
export const tempLabels = (hours: Hour[], nowHour: number): Hour[] =>
  hours.filter((h) => h.hour % 2 === 0 && h.hour > nowHour - 1)

// [max code, day icon, night icon]
const ICONS: Array<[number, string, string?]> = [
  [0, mdiWeatherSunny, mdiWeatherNight],
  [2, mdiWeatherPartlyCloudy, mdiWeatherNightPartlyCloudy],
  [3, mdiWeatherCloudy],
  [48, mdiWeatherFog],
  [67, mdiWeatherRainy],
  [77, mdiWeatherSnowy],
  [82, mdiWeatherRainy],
  [86, mdiWeatherSnowy],
]

// mdi path (24x24) for WMO code; 95+ thunderstorm
export function weatherIcon(code: number, day: boolean): string {
  const row = ICONS.find(([max]) => code <= max)
  if (row == null) return mdiWeatherLightning
  return day ? row[1] : (row[2] ?? row[1])
}
