import { type Countdown, remaining } from "@/anticipation/anticipation"
import type { EtaSet } from "@/eta/sets"
import { calcStats } from "@/eta/stats"
import type { MeetingState } from "@/meeting/meeting"
import type { Timer } from "@/multitimer/timers"
import * as pomo from "@/pomodoro/pomodoro"
import * as sw from "@/stopwatch/stopwatch"
import * as wo from "@/workout/workout"

// one running timer of a sub-app, label undefined = app name
export interface Running {
  path: string
  label?: string
  ms: number // remaining (endTs set) or elapsed
  endTs?: number
  days?: number // anticipation: calendar days
  phase?: string // workout / pomodoro phase
  lapMs?: number // stopwatch: current lap
}

// persisted states of all sub-apps, as read from localStorage
export interface Sources {
  events: Countdown[]
  workout?: wo.Workout
  workoutState?: wo.WorkoutState
  etaSets: EtaSet[]
  timers: Timer[]
  athletes: sw.Athlete[]
  meeting?: MeetingState
  pomoSettings: pomo.PomoSettings
  pomoState?: pomo.PomoState
}

const countdown = (path: string, endTs: number, now: number, label?: string): Running => ({
  path,
  label,
  ms: endTs - now,
  endTs,
})

function workoutItems(
  w: wo.Workout | undefined,
  st: wo.WorkoutState | undefined,
  now: number,
  since: number,
) {
  if (w == null || st?.startTs == null) return []
  const endTs = st.startTs + wo.totalMs(w)
  const { phase } = wo.position(w, now - st.startTs)
  return endTs > since ? [{ ...countdown("/workout", endTs, now, w.name), phase }] : []
}

function pomoItems(s: pomo.PomoSettings, st: pomo.PomoState | undefined, now: number) {
  if (st?.endTs == null) return []
  const { endTs, phase } = pomo.catchUp(st, s, now).state
  return endTs == null ? [] : [{ ...countdown("/pomodoro", endTs, now), phase }]
}

// order = tabs in router.ts; anticipation: past events count up
// countdowns running at `since` stay listed after their end (at 0), dropped only on next read
export function runningItems(src: Sources, now: number, since = now): Running[] {
  const events = src.events.map((ev) => {
    const { seconds, days, past } = remaining(ev, now)
    const item = { path: "/anticipation", label: ev.name, ms: seconds * 1000, days }
    return past ? item : { ...item, endTs: ev.date.getTime() }
  })
  const etas = src.etaSets.flatMap((set) => {
    const etaMs = calcStats(set.data, set.target, set.settings.weightedReg)?.etaMs ?? 0
    return etaMs > since ? [countdown("/eta", etaMs, now, set.name)] : []
  })
  const timers = src.timers
    .filter((tm) => tm.dateEnd.getTime() > since)
    .map((tm) => countdown("/multitimer", tm.dateEnd.getTime(), now, tm.name))
  const athletes = src.athletes.filter(sw.isRunning).map((a) => ({
    path: "/stopwatch",
    label: a.name,
    ms: sw.elapsed(a, now),
    lapMs: sw.lapStats(a, now).current,
  }))
  const meeting =
    src.meeting != null && sw.isRunning(src.meeting.timer)
      ? [{ path: "/meeting", ms: sw.elapsed(src.meeting.timer, now) }]
      : []
  return [
    ...events,
    ...workoutItems(src.workout, src.workoutState, now, since),
    ...etas,
    ...timers,
    ...athletes,
    ...meeting,
    ...pomoItems(src.pomoSettings, src.pomoState, now),
  ]
}
