import { computed, ref, watch } from "vue"
import { readJson, writeJson } from "@/shared/storage"

const KEY_GEO = "tmr-geo"

export interface Coords {
  lat: number
  lon: number
}

// sun and moon use Erlangen until the user shares a position (no forecast for it)
const DEFAULT_COORDS: Coords = { lat: 49.6, lon: 11.0 }

// position on demand (permission prompt), persisted so next visit needs no prompt
export function useGeo() {
  const coords = ref(readJson<Coords | null>(KEY_GEO, null))
  const failed = ref(false)
  watch(coords, (v) => writeJson(KEY_GEO, v))

  // coords in use: own position, else default
  const place = computed(() => coords.value ?? DEFAULT_COORDS)

  /* c8 ignore start */
  function locate() {
    if (!("geolocation" in navigator)) {
      failed.value = true
      return
    }
    navigator.geolocation.getCurrentPosition(
      // coarse is enough: 0.1° (~11 km) shifts sunrise < 1 min; store no precise location
      (p) => {
        const round = (v: number) => Math.round(v * 10) / 10
        coords.value = { lat: round(p.coords.latitude), lon: round(p.coords.longitude) }
        failed.value = false
      },
      () => {
        failed.value = true
      },
      // no GPS: network/wifi position, cached up to 1 day
      { enableHighAccuracy: false, maximumAge: 86_400_000 },
    )
  }
  /* c8 ignore stop */

  function clear() {
    coords.value = null
    failed.value = false
  }

  return { coords, place, failed, locate, clear }
}
