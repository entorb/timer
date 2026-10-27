import { computed, ref, watch } from "vue"

import { dueInBackground, playSound, SOUNDS, useBackgroundSounds } from "@/shared/feedback"
import { t } from "@/shared/i18n"
import { statsWrite } from "@/shared/stats"
import { writeJson } from "@/shared/storage"
import { nowSec } from "@/shared/time"
import { useClock } from "@/shared/useClock"
import { useWakeLock } from "@/shared/useWakeLock"

import * as pomo from "./pomodoro"

export const PHASES = computed<Record<pomo.Phase, { label: string; color: string }>>(() => ({
  focus: { label: t("Focus", "Fokus"), color: "negative" },
  short: { label: t("Short break", "Kurze Pause"), color: "positive" },
  long: { label: t("Long break", "Lange Pause"), color: "primary" },
}))

export function usePomodoro() {
  const settings = ref(pomo.loadSettings())
  const state = ref(pomo.loadState(settings.value))
  const now = useClock({ active: () => running.value, onTick: catchUp })

  const running = computed(() => pomo.isRunning(state.value))
  const canReset = computed(() => !running.value && !pomo.isInitial(state.value, settings.value))
  const remainingMs = computed(() => pomo.remaining(state.value, now.value))
  const progress = computed(
    () => 1 - remainingMs.value / pomo.phaseMs(settings.value, state.value.phase),
  )

  watch(state, (value) => writeJson(pomo.KEY_STATE, value), { deep: true })
  watch(
    settings,
    (value) => {
      writeJson(pomo.KEY_SETTINGS, value)
      // new durations apply to the current phase too, as long as it is not running
      if (!running.value) state.value.remainingMs = pomo.phaseMs(value, state.value.phase)
    },
    { deep: true },
  )
  useWakeLock(running)
  useBackgroundSounds(() =>
    pomo.nextEnds(state.value, settings.value, 20).map((ts) => ({ ts, sound: SOUNDS.bell })),
  )

  // paused (clock inactive): remaining does not depend on now, skip the re-render
  function catchUp() {
    if (!running.value) return
    const { state: newState, ended } = pomo.catchUp(state.value, settings.value, now.value)
    if (ended) {
      state.value = newState
      // end of the latest ended phase = start of the current one
      const due = (newState.endTs ?? now.value) - pomo.phaseMs(settings.value, newState.phase)
      if (!dueInBackground(due)) playSound()
    }
  }
  catchUp()

  function toggle() {
    now.value = nowSec()
    if (running.value) {
      state.value = pomo.pause(state.value, now.value)
    } else {
      state.value = pomo.start(state.value, now.value)
      void statsWrite(pomo.ORIGIN)
    }
  }

  function skip() {
    now.value = nowSec()
    state.value = pomo.next(state.value, settings.value, running.value ? now.value : undefined)
  }

  function reset() {
    state.value = pomo.initialState(settings.value)
  }

  return { settings, state, running, canReset, remainingMs, progress, toggle, skip, reset }
}
