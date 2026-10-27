import { describe, expect, it } from "vitest"
import { reviveSets } from "@/eta/sets"
import { DEFAULT_SETTINGS } from "@/pomodoro/pomodoro"
import { DEFAULT_WORKOUT } from "@/workout/workout"
import { etaEnds, runningItems, type Sources } from "../running"

const NOW = 1_000_000_000
const empty: Sources = {
  events: [],
  etas: [],
  timers: [],
  athletes: [],
  pomoSettings: DEFAULT_SETTINGS,
}

describe("runningItems", () => {
  it("is empty without running timers", () => {
    expect(
      runningItems({ ...empty, workout: DEFAULT_WORKOUT, workoutState: { elapsedMs: 0 } }, NOW),
    ).toEqual([])
  })

  it("lists running timers of all apps in tab order", () => {
    const src: Sources = {
      ...empty,
      events: [
        { name: "Xmas", date: new Date(NOW + 5000) },
        { name: "Past", date: new Date(NOW - 3000) },
      ],
      workout: DEFAULT_WORKOUT,
      workoutState: { startTs: NOW - 1000, elapsedMs: 0 },
      etas: etaEnds(
        reviveSets([
          {
            name: "Queue",
            target: 0,
            data: [
              { date: new Date(NOW - 2000).toISOString(), items: 10 },
              { date: new Date(NOW - 1000).toISOString(), items: 9 },
            ],
          },
        ]),
      ),
      timers: [
        { name: "Tea", dateStart: new Date(NOW - 1000), dateEnd: new Date(NOW + 2000) },
        { name: "Done", dateStart: new Date(NOW - 2000), dateEnd: new Date(NOW - 1000) },
      ],
      athletes: [
        { id: 1, name: "A", start: NOW - 4000, laps: [NOW - 1000] },
        { id: 2, name: "B", start: NOW - 4000, stop: NOW - 1000, laps: [] },
      ],
      meeting: {
        timer: { id: 1, name: "", start: NOW - 6000, laps: [] },
        pausedMs: 0,
        group1: 0,
        group2: 0,
      },
      pomoState: { phase: "focus", round: 1, endTs: NOW + 7000, remainingMs: 0 },
    }
    expect(runningItems(src, NOW)).toEqual([
      { path: "/anticipation", label: "Xmas", ms: 5000, days: 0, endTs: NOW + 5000 },
      { path: "/anticipation", label: "Past", ms: 3000, days: 0 },
      {
        path: "/workout",
        label: "60/3x4",
        ms: 253_000,
        endTs: NOW + 253_000,
        phase: "prepare",
        stageMs: 4000,
      },
      { path: "/eta", label: "Queue", ms: 8000, endTs: NOW + 8000 },
      { path: "/multitimer", label: "Tea", ms: 2000, endTs: NOW + 2000 },
      { path: "/stopwatch", label: "A", ms: 4000, lapMs: 1000 },
      { path: "/meeting", ms: 6000 },
      { path: "/pomodoro", label: undefined, ms: 7000, endTs: NOW + 7000, phase: "focus" },
    ])
  })

  it("advances pomodoro over ended phases", () => {
    const pomoState = { phase: "focus" as const, round: 1, endTs: NOW - 1000, remainingMs: 0 }
    expect(runningItems({ ...empty, pomoState }, NOW)[0]?.ms).toBe(5 * 60_000 - 1000)
  })

  it("keeps countdowns that ended after `since`", () => {
    const timers = [{ name: "Tea", dateStart: new Date(NOW - 2000), dateEnd: new Date(NOW + 1000) }]
    expect(runningItems({ ...empty, timers }, NOW + 5000, NOW)[0]?.ms).toBe(-4000)
    expect(runningItems({ ...empty, timers }, NOW + 5000)).toEqual([])
  })
})
