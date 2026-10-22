import { DAY_MS } from "@/shared/time"

// moon phase from mean synodic month
// ponytail: mean cycle ignores orbit eccentricity, phase off by up to ~0.5 day; upgrade = Meeus lunar phase terms

const SYNODIC_DAYS = 29.530588853
// reference new moon 2000-01-06 18:14 UTC
const NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14)

// 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter
export function moonPhase(date: Date): number {
  const cycles = (date.getTime() - NEW_MOON_MS) / DAY_MS / SYNODIC_DAYS
  return cycles - Math.floor(cycles)
}

// SVG path (radius r, center 0 0) of lit part, waxing lit on the right (northern hemisphere view):
// outer semicircle + terminator half ellipse
export function moonPath(phase: number, r: number): string {
  const q = phase <= 0.5 ? phase : 1 - phase
  const rx = r * Math.abs(Math.cos(2 * Math.PI * q))
  const sweep = q < 0.25 ? 0 : 1
  const side = phase <= 0.5 ? 1 : 0
  return `M 0 ${-r} A ${r} ${r} 0 0 ${side} 0 ${r} A ${rx} ${r} 0 0 ${sweep ^ (1 - side)} 0 ${-r} Z`
}
