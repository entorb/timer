export type Unit = "sec" | "min" | "hour" | "day"

export const UNIT_SECONDS: Record<Unit, number> = { sec: 1, min: 60, hour: 3600, day: 86_400 }

export const pad = (n: number) => n.toString().padStart(2, "0")

// "1,5" -> 1.5; undefined for empty or non-numeric input
export function parseDecimal(raw: string): number | undefined {
  const s = raw.trim().replace(",", ".")
  const n = Number(s)
  return s === "" || !Number.isFinite(n) ? undefined : n
}

// "14:34:56" or with days "17.10., 14:34": German format, 24h, in both languages
export function formatDateTime(date: Date, showDays = false): string {
  const options: Intl.DateTimeFormatOptions = showDays
    ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }
    : { hour: "2-digit", minute: "2-digit", second: "2-digit" }
  return date.toLocaleString("de-DE", options)
}

export function secondsToString(totalSeconds: number): string {
  const rounded = Math.round(totalSeconds)
  const days = Math.floor(rounded / 86_400)
  const hours = Math.floor((rounded % 86_400) / 3600)
  const minutes = Math.floor((rounded % 3600) / 60)
  const seconds = rounded % 60

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes >= 15) return `${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

// stopwatch style: "1:02:03.4", "2:03.4", "0:03" (tenths optional)
export function formatClock(ms: number, tenths = false): string {
  const t = Math.max(0, ms)
  const h = Math.floor(t / 3_600_000)
  const m = Math.floor((t % 3_600_000) / 60_000)
  const s = Math.floor((t % 60_000) / 1000)
  const clock = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
  return tenths ? `${clock}.${Math.floor((t % 1000) / 100)}` : clock
}

// inverse of formatClock: "1:02:03.4", "2:03", "3.5" (plain seconds) -> ms; undefined if invalid
export function parseClock(raw: string): number | undefined {
  const parts = raw.split(":").map(parseDecimal)
  let sec = 0
  for (const p of parts) {
    if (p == null || p < 0) return undefined
    sec = sec * 60 + p
  }
  return parts.length > 3 ? undefined : Math.round(sec * 1000)
}
