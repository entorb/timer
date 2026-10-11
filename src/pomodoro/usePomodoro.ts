import { computed, onScopeDispose, ref, watch } from "vue"

import { playSound } from "@/shared/feedback"
import { statsWrite } from "@/shared/stats"
import { readJson, writeJson } from "@/shared/storage"
import { useWakeLock } from "@/shared/useWakeLock"

import * as pomo from "./pomodoro"

const KEY_SETTINGS = "timer_pomo_settings"
const KEY_STATE = "timer_pomo_state"

export function usePomodoro() {
  const settings = ref({ ...pomo.DEFAULT_SETTINGS, ...readJson(KEY_SETTINGS, {}) })
  const state = ref({ ...pomo.initialState(settings.value), ...readJson(KEY_STATE, {}) })
  const now = ref(Date.now())

  const running = computed(() => pomo.isRunning(state.value))
  const remainingMs = computed(() => pomo.remaining(state.value, now.value))
  const progress = computed(
    () => 1 - remainingMs.value / pomo.phaseMs(settings.value, state.value.phase),
  )

  watch(state, (value) => writeJson(KEY_STATE, value), { deep: true })
  watch(
    settings,
    (value) => {
      writeJson(KEY_SETTINGS, value)
      // new durations apply to the current phase too, as long as it is not running
      if (!running.value) state.value.remainingMs = pomo.phaseMs(value, state.value.phase)
    },
    { deep: true },
  )
  useWakeLock(running)

  // paused: remaining does not depend on now, skip the re-render
  function tick() {
    if (!running.value) return
    now.value = Date.now()
    const { state: newState, ended } = pomo.catchUp(state.value, settings.value, now.value)
    if (ended) {
      state.value = newState
      playSound()
    }
  }
  tick()
  const interval = globalThis.setInterval(tick, 250)
  onScopeDispose(() => globalThis.clearInterval(interval))

  function toggle() {
    now.value = Date.now()
    if (running.value) {
      state.value = pomo.pause(state.value, now.value)
    } else {
      state.value = pomo.start(state.value, now.value)
      statsWrite("timer-pomo")
    }
  }

  function skip() {
    now.value = Date.now()
    state.value = pomo.next(state.value, settings.value, running.value ? now.value : undefined)
  }

  function reset() {
    state.value = pomo.initialState(settings.value)
  }

  return { settings, state, running, remainingMs, progress, toggle, skip, reset }
}
