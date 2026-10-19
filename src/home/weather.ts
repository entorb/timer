// hourly forecast from Open-Meteo (free, no key, CORS), WMO weather codes
// https://open-meteo.com/en/docs
import {
  mdiWeatherCloudy,
  mdiWeatherFog,
  mdiWeatherLightning,
  mdiWeatherNight,
  mdiWeatherNightPartlyCloudy,
  mdiWeatherPartlyCloudy,
  mdiWeatherPartlyRainy,
  mdiWeatherPouring,
  mdiWeatherRainy,
  mdiWeatherSnowy,
  mdiWeatherSnowyRainy,
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

const MIN_SPAN = 8
const HUE_BLUE = 240

// hue over today's range: coldest blue .. warmest red; ranges under MIN_SPAN °C stay centered
export function tempColor(t: number, lo: number, hi: number) {
  const span = Math.max(hi - lo, MIN_SPAN)
  const p = Math.min(1, Math.max(0, (t - (lo + hi - span) / 2) / span))
  return `hsl(${Math.round(HUE_BLUE * (1 - p))} 90% 68%)`
}

// conic gradient, hour stops; closes with first color: no seam at midnight, 1 hour still valid
export function tempGradient(hours: Hour[]): string | undefined {
  const first = hours[0]
  if (first == null) return undefined
  const temps = hours.map((h) => h.temp)
  const [lo, hi] = [Math.min(...temps), Math.max(...temps)]
  const stops = hours.map((h) => `${tempColor(h.temp, lo, hi)} ${h.hour * 15}deg`)
  return `conic-gradient(${stops.join(", ")}, ${tempColor(first.temp, lo, hi)} 360deg)`
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
  [57, mdiWeatherPartlyRainy],
  [63, mdiWeatherRainy],
  [65, mdiWeatherPouring],
  [67, mdiWeatherSnowyRainy],
  [77, mdiWeatherSnowy],
  [80, mdiWeatherRainy],
  [82, mdiWeatherPouring],
  [86, mdiWeatherSnowy],
]

// mdi path (24x24) for WMO code; 95+ thunderstorm
export function weatherIcon(code: number, day: boolean): string {
  const row = ICONS.find(([max]) => code <= max)
  if (row == null) return mdiWeatherLightning
  return day ? row[1] : (row[2] ?? row[1])
}
