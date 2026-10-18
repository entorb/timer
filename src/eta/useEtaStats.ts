import { computed, type MaybeRefOrGetter, onScopeDispose, ref, toValue } from "vue"

import { dueInBackground, playSound, SOUNDS, useBackgroundSounds } from "@/shared/feedback"
import { useWakeLock } from "@/shared/useWakeLock"

import type { EtaSet } from "./sets"
import { calcStats, estimate, etaPassed } from "./stats"

const setStats = (s: EtaSet) => calcStats(s.data, s.target, s.settings.weightedReg)

// stats of the selected set, wake lock + bell for all sets
export function useEtaStats(sets: MaybeRefOrGetter<EtaSet[]>, selected: MaybeRefOrGetter<EtaSet>) {
  const now = ref(Date.now())

  const all = computed(() => toValue(sets).map(setStats))
  const stats = computed(() => setStats(toValue(selected)))
  const est = computed(() => (stats.value == null ? null : estimate(stats.value, now.value)))

  useWakeLock(computed(() => all.value.some((s) => s != null && !estimate(s, now.value).reached)))
  useBackgroundSounds(() =>
    all.value.flatMap((s) =>
      s != null && s.itemsDone < s.itemsTotal && s.etaMs > now.value
        ? [{ ts: s.etaMs, sound: SOUNDS.bell }]
        : [],
    ),
  )

  // ring only when an ETA passes while watching, not when opening an old, finished one
  function tick() {
    const prev = now.value
    now.value = Date.now()
    const passed = all.value.some(
      (s) => s != null && etaPassed(s, prev, now.value) && !dueInBackground(s.etaMs),
    )
    if (passed) playSound()
  }
  const interval = globalThis.setInterval(tick, 1000)
  onScopeDispose(() => globalThis.clearInterval(interval))

  return { stats, est }
}
