import { computed, type MaybeRefOrGetter, onScopeDispose, ref, toValue } from "vue"

import { playSound } from "@/shared/feedback"

import { calcStats, estimate } from "./stats"
import type { DataRowRedType } from "./types"

export function useEtaStats(
  data: MaybeRefOrGetter<DataRowRedType[]>,
  target: MaybeRefOrGetter<number>,
  weighted: MaybeRefOrGetter<boolean>,
) {
  const now = ref(Date.now())

  const stats = computed(() => calcStats(toValue(data), toValue(target), toValue(weighted)))
  const est = computed(() => (stats.value == null ? null : estimate(stats.value, now.value)))

  // ring only when the ETA passes while watching, not when opening an old, finished one
  function tick() {
    if (stats.value == null) return
    const wasReached = est.value?.reached ?? true
    now.value = Date.now()
    if (!wasReached && est.value?.reached) playSound()
  }
  const interval = globalThis.setInterval(tick, 1000)
  onScopeDispose(() => globalThis.clearInterval(interval))

  return { stats, est }
}
