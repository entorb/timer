import { DAY_MS } from "@/shared/time"

// sunrise/sunset: NOAA sunrise equation (suncalc style), accuracy ~1 min
// https://en.wikipedia.org/wiki/Sunrise_equation

const RAD = Math.PI / 180
const J1970 = 2440588
const J2000 = 2451545
const J0 = 0.0009
const OBLIQUITY = 23.4397 * RAD
// sun center below horizon at rise/set: refraction + sun radius
const H0 = -0.833 * RAD

const toDays = (date: Date) => date.getTime() / DAY_MS - 0.5 + J1970 - J2000
const fromDays = (d: number) => new Date((d + J2000 + 0.5 - J1970) * DAY_MS)

export interface SunTimes {
  sunrise: Date
  sunset: Date
}

// `date`: any time of the wanted day, best local noon; lat/lon in degrees (east positive)
// ponytail: polar day/night returns undefined -> caller shows default ring; upgrade = full day/night gradient
export function sunTimes(date: Date, lat: number, lon: number): SunTimes | undefined {
  const lw = -lon * RAD
  const phi = lat * RAD
  const n = Math.round(toDays(date) - J0 - lw / (2 * Math.PI))
  const ds = J0 + lw / (2 * Math.PI) + n
  const m = (357.5291 + 0.98560028 * ds) * RAD
  const c = (1.9148 * Math.sin(m) + 0.02 * Math.sin(2 * m) + 0.0003 * Math.sin(3 * m)) * RAD
  const l = m + c + 102.9372 * RAD + Math.PI
  const noon = ds + 0.0053 * Math.sin(m) - 0.0069 * Math.sin(2 * l)
  const dec = Math.asin(Math.sin(OBLIQUITY) * Math.sin(l))
  const cosW = (Math.sin(H0) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec))
  if (Math.abs(cosW) > 1) return undefined
  const half = Math.acos(cosW) / (2 * Math.PI)
  return { sunrise: fromDays(noon - half), sunset: fromDays(noon + half) }
}
