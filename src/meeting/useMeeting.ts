import { computed, ref, watch } from "vue"

import { statsWrite } from "@/shared/stats"
import { writeJson } from "@/shared/storage"
import { hhmm, nowSec } from "@/shared/time"
import { useClock } from "@/shared/useClock"
import { useWakeLock } from "@/shared/useWakeLock"

import * as mtg from "./meeting"

export function useMeeting() {
  const state = ref(mtg.loadState())
  const config = ref(mtg.loadConfig())
  const now = useClock({ active: () => running.value })

  // a forgotten session from days ago is not a meeting
  if (mtg.isExpired(state.value, now.value)) mtg.reset(state.value)

  const running = computed(() => mtg.isRunning(state.value))
  const calcs = computed(() => mtg.calc(state.value, config.value, now.value))
  const startClock = computed(() => {
    const ts = mtg.wallStart(state.value)
    return ts == null ? "" : hhmm(new Date(ts))
  })

  watch(state, (value) => writeJson(mtg.KEY_STATE, value), { deep: true })
  watch(config, (value) => writeJson(mtg.KEY_CONFIG, value), { deep: true })
  useWakeLock(running)

  function toggle() {
    now.value = nowSec()
    if (running.value) {
      mtg.pause(state.value, now.value)
    } else {
      if (!mtg.isStarted(state.value)) statsWrite(mtg.ORIGIN)
      mtg.start(state.value, now.value)
    }
  }

  return {
    state,
    config,
    now,
    running,
    calcs,
    startClock,
    toggle,
    reset: () => mtg.reset(state.value),
    setStartClock: (hhmm: string) => mtg.setStartClock(state.value, hhmm, nowSec()),
    setPausedMinutes: (min: number) => mtg.setPausedMinutes(state.value, min, nowSec()),
  }
}
