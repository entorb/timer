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

// skip stats writes outside production to prevent dev/E2E from spoiling stats
export function statsWrite(origin: string) {
  if (!runningOnProd()) return
  fetch(`${STATS_URL}?origin=${origin}&action=write`).catch(() => undefined)
}
