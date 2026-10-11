import { computed, onScopeDispose, ref, watch } from "vue"

import { playSound, SOUNDS } from "@/shared/feedback"
import { t } from "@/shared/i18n"
import { statsWrite } from "@/shared/stats"
import { readJson, writeJson } from "@/shared/storage"
import { useWakeLock } from "@/shared/useWakeLock"

import * as wo from "./workout"

const KEY_WORKOUTS = "timer_wo_workouts"
const KEY_SELECTED = "timer_wo_selected"
const KEY_STATE = "timer_wo_state"

const CUE_SOUNDS: Record<wo.Cue, () => void> = {
  beep: SOUNDS.beep,
  go: SOUNDS.ding,
  tick: SOUNDS.tick,
  gong: SOUNDS.bell,
  cheers: () => playSound(SOUNDS.finish),
}

export function useWorkout() {
  const workouts = ref(readJson<wo.Workout[]>(KEY_WORKOUTS, []))
  if (workouts.value.length === 0) workouts.value = [{ ...wo.DEFAULT_WORKOUT }]
  const selectedId = ref(readJson(KEY_SELECTED, wo.DEFAULT_WORKOUT.id))
  const state = ref(readJson<wo.WorkoutState>(KEY_STATE, { elapsedMs: 0 }))
  const now = ref(Date.now())

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

  watch(workouts, (value) => writeJson(KEY_WORKOUTS, value), { deep: true })
  watch(selectedId, (value) => {
    writeJson(KEY_SELECTED, value)
    reset()
  })
  watch(state, (value) => writeJson(KEY_STATE, value), { deep: true })
  useWakeLock(running)

  // elapsed at the previous tick, cues in between get played
  let last = elapsedMs.value
  function tick() {
    if (!running.value) return
    now.value = Date.now()
    const cues = wo.cuesBetween(workout.value, last, elapsedMs.value)
    // back from background: only the latest cue, no burst
    for (const cue of elapsedMs.value - last > 2000 ? cues.slice(-1) : cues) CUE_SOUNDS[cue]()
    last = elapsedMs.value
    if (elapsedMs.value >= total.value) state.value = { elapsedMs: total.value }
  }
  tick()
  const interval = globalThis.setInterval(tick, 250)
  onScopeDispose(() => globalThis.clearInterval(interval))

  function toggle() {
    now.value = Date.now()
    if (running.value) {
      state.value = wo.pause(state.value, now.value)
      return
    }
    if (state.value.elapsedMs >= total.value) state.value = { elapsedMs: 0 }
    // -1: cues at 0 (go without prepare) are due too
    last = state.value.elapsedMs === 0 ? -1 : state.value.elapsedMs
    state.value = wo.start(state.value, now.value)
    statsWrite("timer-workout")
  }

  function reset() {
    state.value = { elapsedMs: 0 }
    now.value = Date.now()
  }

  // jump to next / previous segment start, keeps running
  function skip(dir: 1 | -1) {
    now.value = Date.now()
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
