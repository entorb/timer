import { computed, ref, watch } from "vue"

import {
  dueInBackground,
  playSound,
  SOUNDS,
  type Sound,
  useBackgroundSounds,
} from "@/shared/feedback"
import { t } from "@/shared/i18n"
import { statsWrite } from "@/shared/stats"
import { writeJson } from "@/shared/storage"
import { nowSec } from "@/shared/time"
import { useClock } from "@/shared/useClock"
import { useWakeLock } from "@/shared/useWakeLock"

import * as wo from "./workout"

const CUE_SOUNDS: Record<wo.Cue, Sound> = {
  beep: SOUNDS.beep,
  go: SOUNDS.ding,
  tick: SOUNDS.tick,
  gong: SOUNDS.bell,
  cheers: SOUNDS.finish,
}

export const PHASES = computed<Record<wo.Phase, { label: string; color: string }>>(() => ({
  prepare: { label: t("Get ready", "Vorbereiten"), color: "amber" },
  work: { label: t("Work", "Ranklotzen"), color: "negative" },
  rest: { label: t("Rest", "Pause"), color: "positive" },
  done: { label: t("Done", "Feddich!"), color: "primary" },
}))

export function useWorkout() {
  const workouts = ref(wo.loadWorkouts())
  if (workouts.value.length === 0) workouts.value = [{ ...wo.DEFAULT_WORKOUT }]
  const selectedId = ref(wo.loadSelectedId())
  const state = ref(wo.loadState())
  const now = useClock({ active: () => running.value, onTick: playCues })

  // fallback: selected one was deleted
  const workout = computed(
    () =>
      workouts.value.find((w) => w.id === selectedId.value) ??
      workouts.value[0] ??
      wo.DEFAULT_WORKOUT,
  )
  const total = computed(() => wo.totalMs(workout.value))
  const running = computed(() => wo.isRunning(state.value))
  const elapsedMs = computed(() => Math.min(wo.elapsed(state.value, now.value), total.value))
  const pos = computed(() => wo.position(workout.value, elapsedMs.value))

  watch(workouts, (value) => writeJson(wo.KEY_WORKOUTS, value), { deep: true })
  watch(selectedId, (value) => {
    writeJson(wo.KEY_SELECTED, value)
    reset()
  })
  watch(state, (value) => writeJson(wo.KEY_STATE, value), { deep: true })
  useWakeLock(running)
  useBackgroundSounds(() => {
    const { startTs } = state.value
    if (startTs == null) return []
    return wo
      .cuesBetween(workout.value, elapsedMs.value, total.value)
      .map(({ at, cue }) => ({ ts: startTs + at, sound: CUE_SOUNDS[cue] }))
  })

  // elapsed at the previous tick, cues in between get played
  let last = elapsedMs.value
  function playCues() {
    if (!running.value) return
    const startTs = state.value.startTs ?? now.value
    const cues = wo.cuesBetween(workout.value, last, elapsedMs.value)
    // back from background: only the latest cue, no burst
    for (const { at, cue } of elapsedMs.value - last > 2000 ? cues.slice(-1) : cues) {
      if (!dueInBackground(startTs + at)) playSound(CUE_SOUNDS[cue], cue === "cheers")
    }
    last = elapsedMs.value
    if (elapsedMs.value >= total.value) state.value = { elapsedMs: total.value }
  }
  playCues()

  function toggle() {
    now.value = nowSec()
    if (running.value) {
      state.value = wo.pause(state.value, now.value)
      return
    }
    if (state.value.elapsedMs >= total.value) state.value = { elapsedMs: 0 }
    // -1: cues at 0 (go without prepare) are due too
    last = state.value.elapsedMs === 0 ? -1 : state.value.elapsedMs
    state.value = wo.start(state.value, now.value)
    statsWrite(wo.ORIGIN)
  }

  function reset() {
    state.value = { elapsedMs: 0 }
    now.value = nowSec()
  }

  // jump to next / previous segment start, keeps running
  function skip(dir: 1 | -1) {
    now.value = nowSec()
    const ms = wo.skipTarget(workout.value, elapsedMs.value, dir)
    last = ms
    state.value = running.value ? { startTs: now.value - ms, elapsedMs: ms } : { elapsedMs: ms }
  }

  // copy of the current one, as starting point
  function add() {
    const copy = {
      ...workout.value,
      id: crypto.randomUUID(),
      name: t("New workout", "Neues Workout"),
    }
    workouts.value.push(copy)
    selectedId.value = copy.id
  }

  function remove() {
    if (workouts.value.length <= 1) return
    workouts.value = workouts.value.filter((w) => w.id !== workout.value.id)
    selectedId.value = workouts.value[0]?.id ?? wo.DEFAULT_WORKOUT.id
  }

  return {
    workouts,
    selectedId,
    workout,
    running,
    pos,
    total,
    elapsedMs,
    toggle,
    reset,
    skip,
    add,
    remove,
  }
}
