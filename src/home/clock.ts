// 24h day clock: 0:00 top, 12:00 bottom, clockwise; hour 1 = 15deg

export interface Point {
  x: number
  y: number
}

// fractional local hour: 06:30:00 -> 6.5
export const hourOf = (date: Date): number =>
  date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600

// SVG coords (y down) of `hour` on circle with radius `r`
export function polar(hour: number, r: number): Point {
  const a = (hour * Math.PI) / 12
  return { x: r * Math.sin(a), y: -r * Math.cos(a) }
}

// noon between sunrise and sunset, midnight opposite
// sunset < sunrise: day crosses local midnight (location far from device time zone) -> sunset next day
export function dayMarks(sunrise = 6, sunsetIn = 18) {
  const sunset = sunsetIn < sunrise ? sunsetIn + 24 : sunsetIn
  const noon = (sunrise + sunset) / 2
  return { midnight: noon - 12, sunrise, noon, sunset }
}

// [fraction of segment, color], first half of day; mirrored at noon
const NIGHT_STOPS: Array<[number, string]> = [
  [0, "#000000"],
  [0.75, "#262626"],
]
const DAY_STOPS: Array<[number, string]> = [
  [0, "#737373"],
  [0.35, "#a3a3a3"],
  [0.7, "#e5e5e5"],
  [1, "#ffffff"],
]

// CSS conic gradient midnight black -> noon white; starts at midnight, stops as hours after midnight
export function ringGradient(sunrise = 6, sunset = 18): string {
  const m = dayMarks(sunrise, sunset)
  const lerp = (a: number, b: number, f: number) => a + (b - a) * f - m.midnight
  const half: Array<[number, string]> = [
    ...NIGHT_STOPS.map(([f, c]): [number, string] => [lerp(m.midnight, m.sunrise, f), c]),
    ...DAY_STOPS.map(([f, c]): [number, string] => [lerp(m.sunrise, m.noon, f), c]),
  ]
  const stops = [...half, ...[...half].reverse().map(([h, c]): [number, string] => [24 - h, c])]
  const list = stops.map(([h, c]) => `${c} ${h * 15}deg`).join(", ")
  return `conic-gradient(from ${m.midnight * 15}deg, ${list})`
}

// "18.10.": always German format, like formatDateTime
export const formatDay = (date: Date): string =>
  date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })
