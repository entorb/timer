import { helperLinReg } from "./helperLinReg"
import type { DataRowRedType } from "./types"

export interface EtaStats {
  ips: number // slope of the lin. reg., items per sec
  rate: number // progress towards target per sec, > 0 if moving towards it
  itemsDone: number
  itemsTotal: number
  firstMs: number
  lastMs: number
  etaMs: number // 0 = unknown
}

export interface EtaEstimate {
  percent: number // 0..1
  secToEta: number
  secSinceFirst: number
  secSinceLast: number
  reached: boolean
}

// target 0 = count-down to 0, else count-up to target
export function calcStats(
  data: DataRowRedType[],
  target: number,
  weighted: boolean,
): EtaStats | null {
  const first = data[0]
  const last = data.at(-1)
  if (data.length < 2 || first == null || last == null) return null

  const countDown = target === 0
  const itemsTotal = countDown ? first.items : target
  const itemsDone = countDown ? first.items - last.items : last.items
  const { slope: ips } = helperLinReg(data, weighted)
  const rate = countDown ? -ips : ips
  const lastMs = last.date.getTime()
  const etaMs =
    rate > 0 && itemsDone < itemsTotal ? lastMs + ((itemsTotal - itemsDone) / rate) * 1000 : 0

  return { ips, rate, itemsDone, itemsTotal, firstMs: first.date.getTime(), lastMs, etaMs }
}

// share of target done, 0..1
export function progress(done: number, total: number): number {
  return total > 0 ? Math.min(1, Math.max(0, done / total)) : 0
}

export function estimate(s: EtaStats, now: number): EtaEstimate {
  // clocks stop once the ETA has passed
  const t = s.etaMs > 0 ? Math.min(now, s.etaMs) : now
  const done = s.itemsDone + (s.rate * (t - s.lastMs)) / 1000
  return {
    percent: progress(done, s.itemsTotal),
    secToEta: s.etaMs > 0 ? (s.etaMs - t) / 1000 : 0,
    secSinceFirst: (t - s.firstMs) / 1000,
    secSinceLast: (now - s.lastMs) / 1000,
    reached: s.itemsDone >= s.itemsTotal || (s.etaMs > 0 && now >= s.etaMs),
  }
}
