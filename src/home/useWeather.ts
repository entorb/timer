import { onActivated, onDeactivated, onScopeDispose, type Ref, ref, watch } from "vue"
import { readJson, writeJson } from "@/shared/storage"
import type { Coords } from "./useGeo"
import { isStale, parseWeather, type Weather, weatherUrl } from "./weather"

const KEY_WEATHER = "tmr-weather"
const REFRESH_MS = 15 * 60_000

/* c8 ignore start */
async function load(c: Coords): Promise<Weather | undefined> {
  try {
    const response = await fetch(weatherUrl(c))
    return response.ok ? parseWeather(await response.json(), c, Date.now()) : undefined
  } catch {
    return undefined // offline: keep cached forecast
  }
}
/* c8 ignore stop */

// forecast only for the user's own location, dropped with it; cached, refetched on location change or after 1h
export function useWeather(coords: Ref<Coords | null>) {
  const weather = ref(readJson<Weather | null>(KEY_WEATHER, null))
  watch(weather, (v) => writeJson(KEY_WEATHER, v))

  function refresh() {
    const c = coords.value
    if (c == null) weather.value = null // location deleted: drop forecast
    if (c == null || !isStale(weather.value, c, Date.now())) return
    // location changed meanwhile: drop outdated response
    void load(c).then((w) => {
      if (w != null && coords.value === c) weather.value = w
    })
  }

  watch(coords, refresh, { immediate: true })
  // page is kept alive in other tabs: poll only while home is shown
  let interval: ReturnType<typeof setInterval> | undefined
  const stop = () => globalThis.clearInterval(interval)
  onActivated(() => {
    refresh()
    interval = globalThis.setInterval(refresh, REFRESH_MS)
  })
  onDeactivated(stop)
  onScopeDispose(stop)
  return weather
}
