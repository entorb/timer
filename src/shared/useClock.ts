import {
  getCurrentInstance,
  type MaybeRefOrGetter,
  onActivated,
  onDeactivated,
  onScopeDispose,
  ref,
  toValue,
} from "vue"

import { roundTs } from "./time"

interface ClockOptions {
  ms?: MaybeRefOrGetter<number> // tick + resolution of `now`, sub-second only for stopwatch tenths
  active?: MaybeRefOrGetter<boolean> // false: no update, no re-render (e.g. paused)
  onTick?: (prev: number) => void // after `now` is updated
}

// shared tick: `now` timestamp rounded to `ms`, display + per-tick logic (sounds) of the composables
// aligned to the `ms` grid (just after each full second): no skipped / doubled seconds on jitter
export function useClock({ ms = 1000, active = true, onTick }: ClockOptions = {}) {
  const now = ref(roundTs(Date.now(), toValue(ms)))
  // KeepAlive keeps hidden pages rendering: pause display-only clocks there, onTick ones keep ringing
  let shown = true
  /* c8 ignore next 7 */
  if (onTick == null && getCurrentInstance() != null) {
    onActivated(() => {
      shown = true
      now.value = roundTs(Date.now(), toValue(ms))
    })
    onDeactivated(() => (shown = false))
  }
  let timeout: ReturnType<typeof setTimeout> | undefined
  function schedule() {
    const step = toValue(ms)
    timeout = globalThis.setTimeout(
      () => {
        if (shown && toValue(active)) {
          const prev = now.value
          now.value = roundTs(Date.now(), step)
          onTick?.(prev)
        }
        schedule()
      },
      step - (Date.now() % step) + 10,
    )
  }
  schedule()
  onScopeDispose(() => globalThis.clearTimeout(timeout))
  return now
}
