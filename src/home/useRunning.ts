import { computed, onActivated, type Ref, shallowRef } from "vue"
import { loadEvents } from "@/anticipation/anticipation"
import type { StoredSet } from "@/eta/sets"
import type { MeetingState } from "@/meeting/meeting"
import { loadTimers } from "@/multitimer/timers"
import * as pomo from "@/pomodoro/pomodoro"
import { readJson } from "@/shared/storage"
import type { Athlete } from "@/stopwatch/stopwatch"
import * as wo from "@/workout/workout"
import { runningItems, type Sources } from "./running"

// keys of the sub-apps, read only here (no sounds / wake lock of their composables)
function readSources(): Sources {
  const workouts = readJson<wo.Workout[]>("tmr-wo-workouts", [])
  const selected = readJson("tmr-wo-selected", wo.DEFAULT_WORKOUT.id)
  return {
    events: loadEvents(),
    workout: workouts.find((w) => w.id === selected) ?? workouts[0] ?? wo.DEFAULT_WORKOUT,
    workoutState: readJson<wo.WorkoutState | undefined>("tmr-wo-state", undefined),
    etaSets: readJson<StoredSet[]>("tmr-eta-sets", []),
    timers: loadTimers(),
    athletes: readJson<Athlete[]>("tmr-sw-data", []),
    meeting: readJson<MeetingState | undefined>("tmr-mm-state", undefined),
    pomoSettings: { ...pomo.DEFAULT_SETTINGS, ...readJson("tmr-pomo-settings", {}) },
    pomoState: readJson<pomo.PomoState | undefined>("tmr-pomo-state", undefined),
  }
}

// re-read on each visit (page is kept alive): picks up new timers, drops finished ones
export function useRunning(now: Ref<Date>) {
  const read = () => ({ sources: readSources(), since: Date.now() })
  const snap = shallowRef(read())
  /* c8 ignore next */
  onActivated(() => (snap.value = read()))
  return computed(() => runningItems(snap.value.sources, now.value.getTime(), snap.value.since))
}
