import { readJson, writeJson } from "./storage"

export interface StatsDataType {
  accesscounts: number
  accesscounts7: number
  firstaccess: string // 2023-11-03
}

const STATS_URL = "https://entorb.net/web-stats-json.php"

const runningOnProd = () => globalThis.location.hostname === "entorb.net"

export async function statsRead(origin: string): Promise<StatsDataType | undefined> {
  if (!runningOnProd()) return undefined
  try {
    const response = await fetch(`${STATS_URL}?origin=${origin}&action=read`)
    return response.ok ? await response.json() : undefined
  } catch {
    return undefined
  }
}

const KEY_PENDING = "tmr-stats-pending"

const loadPending = () => readJson<Record<string, number>>(KEY_PENDING, {})

async function send(origin: string): Promise<boolean> {
  // offline: skip fetch, so mobile OS does not prompt for wifi
  if (!navigator.onLine) return false
  try {
    return (await fetch(`${STATS_URL}?origin=${origin}&action=write`)).ok
  } catch {
    return false
  }
}

// send cached writes one by one, stop at first failure (still offline)
export async function statsFlush() {
  if (!runningOnProd()) return
  const pending = loadPending()
  for (const [origin, count] of Object.entries(pending)) {
    for (let i = 0; i < count; i++) {
      if (!(await send(origin))) return writeJson(KEY_PENDING, pending)
      pending[origin] = count - i - 1
      if (pending[origin] === 0) delete pending[origin]
    }
  }
  writeJson(KEY_PENDING, Object.keys(pending).length > 0 ? pending : null)
}

// skip stats writes outside production to prevent dev/E2E from spoiling stats
// failed (offline) writes are cached in localStorage, sent by statsFlush at next app start
export async function statsWrite(origin: string) {
  if (!runningOnProd()) return
  if (await send(origin)) return statsFlush()
  const pending = loadPending()
  pending[origin] = (pending[origin] ?? 0) + 1
  writeJson(KEY_PENDING, pending)
}
