import { computed, onScopeDispose, ref, watch } from "vue"

import { vibrateShort } from "@/shared/feedback"
import { t } from "@/shared/i18n"
import { statsWrite } from "@/shared/stats"
import { readJson, writeJson } from "@/shared/storage"
import { parseClock } from "@/shared/time"
import { useWakeLock } from "@/shared/useWakeLock"

import * as sw from "./stopwatch"

const KEY_DATA = "tmr-sw-data"
const KEY_TENTHS = "tmr-sw-tenths"

const newAthlete = (id: number): sw.Athlete => ({
  id,
  name: `${t("Athlete", "Läufer")} ${id}`,
  laps: [],
})

export function useStopwatch() {
  const athletes = ref(readJson(KEY_DATA, [1, 2].map(newAthlete)))
  const now = ref(Date.now())
  const showTenths = ref(readJson(KEY_TENTHS, false))
  const anyRunning = computed(() => athletes.value.some(sw.isRunning))

  watch(showTenths, (value) => writeJson(KEY_TENTHS, value))
  watch(athletes, (value) => writeJson(KEY_DATA, value), { deep: true })
  useWakeLock(anyRunning)

  // display refresh only, times are always derived from timestamps
  const interval = globalThis.setInterval(() => {
    if (anyRunning.value) now.value = Date.now()
  }, 100)
  onScopeDispose(() => globalThis.clearInterval(interval))

  function act(fn: (a: sw.Athlete, t: number) => void, list = athletes.value) {
    now.value = Date.now()
    for (const a of list) fn(a, now.value)
  }

  // tap on idle tile starts, on running tile records a lap
  function tap(a: sw.Athlete) {
    if (sw.isRunning(a)) act(sw.lap, [a])
    else act(sw.start, [a])
    vibrateShort()
  }

  function startAll() {
    act(sw.start)
    statsWrite("tmr-sw")
  }

  function add() {
    const id = Math.max(0, ...athletes.value.map((a) => a.id)) + 1
    athletes.value.push(newAthlete(id))
  }

  return {
    athletes,
    now,
    showTenths,
    anyRunning,
    tap,
    startAll,
    stopAll: () => act(sw.stop),
    resetAll: () => act(sw.reset),
    start: (a: sw.Athlete) => act(sw.start, [a]),
    stop: (a: sw.Athlete) => act(sw.stop, [a]),
    reset: (a: sw.Athlete) => act(sw.reset, [a]),
    // removing a lap mark merges that lap into the next one
    deleteLap: (a: sw.Athlete, index: number) => a.laps.splice(index, 1),
    // raw = clock text typed by the user (m:ss); false if invalid
    editLap: (a: sw.Athlete, index: number, raw: string) => {
      const ms = parseClock(raw)
      return ms != null && sw.setLapTime(a, index, ms, now.value)
    },
    add,
    remove: (a: sw.Athlete) => {
      athletes.value = athletes.value.filter((x) => x !== a)
    },
  }
}
