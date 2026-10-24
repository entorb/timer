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
  `${API}?latitude=${c.lat}&longitude=${c.lon}&hourly=temperature_2m,weather_code&forecast_days=2&timezone=auto&timeformat=unixtime`

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

// next 24 local hours with data, sorted by ring hour: today from 2h ago (not before 0:00), earlier hours show tomorrow
export function ringHours(w: Weather, now: number): Hour[] {
  const day = new Date(now)
  day.setHours(0, 0, 0, 0)
  const start = Math.max(day.getTime(), Math.floor(now / HOUR_MS) * HOUR_MS - 2 * HOUR_MS)
  return w.time
    .flatMap((t, i) => {
      const ms = t * 1000
      const code = w.code[i]
      const temp = w.temp[i]
      const skip = ms < start || ms >= start + DAY_MS || code == null || temp == null
      return skip ? [] : [{ hour: new Date(ms).getHours(), code, temp }]
    })
    .sort((x, y) => x.hour - y.hour)
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

// even hours like the ring numbers
export const tempLabels = (hours: Hour[]): Hour[] => hours.filter((h) => h.hour % 2 === 0)

const SUN = "#facc15"
const SUN_PALE = "#fde68a"
const DRIZZLE = "#93c5fd"
const RAIN = "#3b82f6"
const HEAVY_RAIN = "#1d4ed8"
const FREEZING = "#818cf8"
const SNOW = "#bae6fd"

// [max code, day icon, night icon, color (sun colors day only)]
const ICONS: Array<[number, string, string | undefined, string?]> = [
  [0, mdiWeatherSunny, mdiWeatherNight, SUN],
  [2, mdiWeatherPartlyCloudy, mdiWeatherNightPartlyCloudy, SUN_PALE],
  [3, mdiWeatherCloudy, undefined],
  [48, mdiWeatherFog, undefined],
  [57, mdiWeatherPartlyRainy, undefined, DRIZZLE],
  [63, mdiWeatherRainy, undefined, RAIN],
  [65, mdiWeatherPouring, undefined, HEAVY_RAIN],
  [67, mdiWeatherSnowyRainy, undefined, FREEZING],
  [77, mdiWeatherSnowy, undefined, SNOW],
  [80, mdiWeatherRainy, undefined, DRIZZLE],
  [81, mdiWeatherRainy, undefined, RAIN],
  [82, mdiWeatherPouring, undefined, HEAVY_RAIN],
  [86, mdiWeatherSnowy, undefined, SNOW],
  [95, mdiWeatherLightning, undefined, "#f97316"],
  [99, mdiWeatherLightning, undefined, "#dc2626"],
]

// mdi path (24x24) + fill (undefined = currentColor) for WMO code
export function weatherIcon(code: number, day: boolean): { d: string; fill?: string } {
  const [max, dayIcon, night, fill] = ICONS.find(([m]) => code <= m) ?? ICONS.at(-1) ?? []
  if (dayIcon == null) return { d: mdiWeatherLightning }
  if (day || night == null) return { d: dayIcon, fill }
  return { d: night, fill: max != null && max <= 2 ? undefined : fill }
}
