import { computed, onScopeDispose, ref, watch } from "vue"

import { statsWrite } from "@/shared/stats"
import { readJson, writeJson } from "@/shared/storage"
import { useWakeLock } from "@/shared/useWakeLock"

import * as mtg from "./meeting"

const KEY_STATE = "tmr-mm-state"
const KEY_CONFIG = "tmr-mm-config"

export function useMeeting() {
  const state = ref<mtg.MeetingState>({ ...mtg.initialState(), ...readJson(KEY_STATE, {}) })
  const config = ref<mtg.MeetingConfig>({
    ...mtg.DEFAULT_CONFIG,
    ...readJson(KEY_CONFIG, {}),
  })
  const now = ref(Date.now())

  // a forgotten session from days ago is not a meeting
  if (mtg.isExpired(state.value, now.value)) mtg.reset(state.value)

  const running = computed(() => mtg.isRunning(state.value))
  const calcs = computed(() => mtg.calc(state.value, config.value, now.value))
  const startClock = computed(() => {
    const ts = mtg.wallStart(state.value)
    return ts == null ? "" : mtg.clockOf(ts)
  })

  watch(state, (value) => writeJson(KEY_STATE, value), { deep: true })
  watch(config, (value) => writeJson(KEY_CONFIG, value), { deep: true })
  useWakeLock(running)

  // display refresh only, times are always derived from timestamps
  const interval = globalThis.setInterval(() => {
    if (running.value) now.value = Date.now()
  }, 1000)
  onScopeDispose(() => globalThis.clearInterval(interval))

  function toggle() {
    now.value = Date.now()
    if (running.value) {
      mtg.pause(state.value, now.value)
    } else {
      if (!mtg.isStarted(state.value)) statsWrite("tmr-mm")
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
    setStartClock: (hhmm: string) => mtg.setStartClock(state.value, hhmm, Date.now()),
    setPausedMinutes: (min: number) => mtg.setPausedMinutes(state.value, min, Date.now()),
  }
}
