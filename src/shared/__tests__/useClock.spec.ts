import { afterEach, expect, it, vi } from "vitest"
import { effectScope, ref } from "vue"
import { useClock } from "../useClock"

afterEach(() => vi.useRealTimers())

it("ticks aligned to grid only while active, passes prev to onTick, stops on dispose", () => {
  vi.useFakeTimers({ now: 0 })
  const active = ref(false)
  const onTick = vi.fn()
  const scope = effectScope()
  const now = scope.run(() => useClock({ ms: 100, active, onTick }))
  vi.advanceTimersByTime(300)
  expect(now?.value).toBe(0)
  active.value = true
  vi.advanceTimersByTime(100) // tick at 310, aligned to the 100ms grid
  expect(now?.value).toBe(300)
  expect(onTick).toHaveBeenCalledWith(0)
  scope.stop()
  vi.advanceTimersByTime(200)
  expect(onTick).toHaveBeenCalledOnce()
})
