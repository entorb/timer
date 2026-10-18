import { computed, onScopeDispose, ref, toRaw, watch } from "vue"

import { dueInBackground, playSound, SOUNDS, useBackgroundSounds } from "@/shared/feedback"
import { statsWrite } from "@/shared/stats"
import type { Unit } from "@/shared/time"
import { useWakeLock } from "@/shared/useWakeLock"

import {
  clearName,
  createTimer,
  loadRecent,
  loadTimers,
  parseTimeInput,
  parseTimerLabel,
  progress,
  resetTimer,
  saveRecent,
  saveTimers,
  type Timer,
  timerLabel,
} from "./timers"

export function useMultiTimer() {
  const timers = ref<Timer[]>(loadTimers())
  const recent = ref<string[]>(loadRecent())
  const now = ref(Date.now())
  // timers that already rang (or were already over when the page was opened)
  const finished = new WeakSet<Timer>(timers.value.filter((t) => t.dateEnd.getTime() <= now.value))

  // sorted by end, with progress per timer (computed once per tick)
  const sorted = computed(() =>
    [...timers.value]
      .sort((a, b) => a.dateEnd.getTime() - b.dateEnd.getTime())
      .map((timer) => ({ timer, ...progress(timer, now.value) })),
  )

  watch(timers, (value) => saveTimers(value), { deep: true })
  watch(recent, (value) => saveRecent(value), { deep: true })
  useWakeLock(computed(() => sorted.value.some((s) => s.remaining > 0)))
  useBackgroundSounds(() =>
    timers.value.map((timer) => ({ ts: timer.dateEnd.getTime(), sound: SOUNDS.bell })),
  )

  function tick() {
    if (timers.value.length === 0) return
    now.value = Date.now()
    for (const timer of toRaw(timers.value)) {
      if (timer.dateEnd.getTime() <= now.value && !finished.has(timer)) {
        finished.add(timer)
        if (!dueInBackground(timer.dateEnd.getTime())) playSound()
      }
    }
  }
  const interval = globalThis.setInterval(tick, 1000)
  onScopeDispose(() => globalThis.clearInterval(interval))

  function add(name: string, time: number, unit: Unit) {
    timers.value.push(createTimer(name, time, unit))
    now.value = Date.now()
    statsWrite("tmr-mt")
  }

  // returns false if time input is invalid
  function addFromInput(rawName: string, rawTime: string): boolean {
    const parsed = parseTimeInput(rawTime)
    if (parsed == null) return false
    const name = clearName(rawName) || "Timer"
    add(name, parsed.time, parsed.unit)
    const label = timerLabel(name, parsed.time, parsed.unit)
    if (!recent.value.includes(label)) {
      recent.value = [...recent.value, label].sort((a, b) => a.localeCompare(b))
    }
    return true
  }

  function addFromRecent(label: string) {
    const { name, time, unit } = parseTimerLabel(label)
    add(name, time, unit)
  }

  function reset(timer: Timer) {
    resetTimer(timer, Date.now())
    finished.delete(toRaw(timer))
    now.value = Date.now()
  }

  function remove(timer: Timer) {
    timers.value = timers.value.filter((t) => t !== timer)
  }

  return { timers, sorted, recent, addFromInput, addFromRecent, reset, remove }
}
