import { computed, ref, watch } from "vue"

import { clearName } from "@/multitimer/timers"
import { t } from "@/shared/i18n"
import { statsWrite } from "@/shared/stats"
import { nowSec } from "@/shared/time"
import { useClock } from "@/shared/useClock"

import {
  type Countdown,
  finalCountdown,
  loadEvents,
  ORIGIN,
  parseTime,
  remaining,
  saveEvents,
} from "./anticipation"

// "12 days", "today", "3 days ago", last 24h as clock
export function topLabel(seconds: number, days: number, past: boolean): string {
  const clock = past ? undefined : finalCountdown(seconds)
  if (clock != null) return clock
  if (days === 0) return t("today", "heute")
  const one = days === 1
  const en = one ? "day" : "days"
  const pastDe = one ? "Tag" : "Tagen"
  const de = one ? "Tag" : "Tage"
  return past
    ? t(`${days} ${en} ago`, `vor ${days} ${pastDe}`)
    : t(`${days} ${en}`, `${days} ${de}`)
}

export function useAnticipation() {
  const events = ref<Countdown[]>(loadEvents())
  const now = useClock()

  const sorted = computed(() =>
    [...events.value]
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((event) => ({ event, ...remaining(event, now.value) })),
  )

  watch(events, (value) => saveEvents(value), { deep: true })

  // rawDate "2026-12-24", rawTime see parseTime; replaces `edited` if given; returns false if invalid
  function add(rawName: string, rawDate: string, rawTime: string, edited?: Countdown): boolean {
    const time = parseTime(rawTime)
    const date = new Date(`${rawDate}T00:00`)
    if (time == null || Number.isNaN(date.getTime())) return false
    date.setHours(time.hour, time.minute)
    const event = { name: clearName(rawName) || "Event", date }
    const i = edited == null ? -1 : events.value.indexOf(edited)
    if (i < 0) events.value.push(event)
    else events.value[i] = event
    now.value = nowSec()
    void statsWrite(ORIGIN)
    return true
  }

  function remove(event: Countdown) {
    events.value = events.value.filter((e) => e !== event)
  }

  return { events, sorted, add, remove }
}
