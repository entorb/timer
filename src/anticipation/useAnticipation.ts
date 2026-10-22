import { computed, onScopeDispose, ref, watch } from "vue"

import { clearName } from "@/multitimer/timers"
import { statsWrite } from "@/shared/stats"

import { type Countdown, loadEvents, parseTime, remaining, saveEvents } from "./anticipation"

export function useAnticipation() {
  const events = ref<Countdown[]>(loadEvents())
  const now = ref(Date.now())

  const sorted = computed(() =>
    [...events.value]
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((event) => ({ event, ...remaining(event, now.value) })),
  )

  watch(events, (value) => saveEvents(value), { deep: true })

  const interval = globalThis.setInterval(() => {
    now.value = Date.now()
  }, 1000)
  onScopeDispose(() => globalThis.clearInterval(interval))

  // rawDate "2026-12-24", rawTime see parseTime; returns false if invalid
  function add(rawName: string, rawDate: string, rawTime: string): boolean {
    const time = parseTime(rawTime)
    const date = new Date(`${rawDate}T00:00`)
    if (time == null || Number.isNaN(date.getTime())) return false
    date.setHours(time.hour, time.minute)
    events.value.push({ name: clearName(rawName) || "Event", date })
    now.value = Date.now()
    statsWrite("tmr-ant")
    return true
  }

  function remove(event: Countdown) {
    events.value = events.value.filter((e) => e !== event)
  }

  return { events, sorted, add, remove }
}
