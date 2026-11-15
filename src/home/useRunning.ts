import { computed, onActivated, type Ref, shallowRef } from "vue"
import { loadEvents } from "@/anticipation/anticipation.ts"
import { loadSets } from "@/eta/sets.ts"
import * as mtg from "@/meeting/meeting.ts"
import { loadTimers } from "@/multitimer/timers.ts"
import * as pomo from "@/pomodoro/pomodoro.ts"
import { pickById } from "@/shared/list.ts"
import { loadAthletes } from "@/stopwatch/stopwatch.ts"
import * as wo from "@/workout/workout.ts"
import { etaEnds, runningItems, type Sources } from "./running.ts"

// loaders of the sub-apps, not their composables (no sounds / wake lock)
function readSources(): Sources {
  const workouts = wo.loadWorkouts()
  const selected = wo.loadSelectedId()
  const pomoSettings = pomo.loadSettings()
  return {
    events: loadEvents(),
    workout: pickById(workouts, selected) ?? wo.DEFAULT_WORKOUT,
    workoutState: wo.loadState(),
    etas: etaEnds(loadSets()),
    timers: loadTimers(),
    athletes: loadAthletes(),
    meeting: mtg.loadState(),
    pomoSettings,
    pomoState: pomo.loadState(pomoSettings),
  }
}

// re-read on each visit (page is kept alive): picks up new timers, drops finished ones
export function useRunning(now: Ref<number>) {
  const read = () => ({ sources: readSources(), since: Date.now() })
  const snap = shallowRef(read())
  /* c8 ignore next */
  onActivated(() => {
    snap.value = read()
  })
  return computed(() => runningItems(snap.value.sources, now.value, snap.value.since))
}
