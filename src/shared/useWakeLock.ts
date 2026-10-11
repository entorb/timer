import { onScopeDispose, type Ref, watch } from "vue"

// keeps the screen on while active (e.g. a stopwatch is running)
// the browser releases the lock when the page gets hidden, so re-request on visibility change
/* c8 ignore start */
export function useWakeLock(active: Ref<boolean>) {
  let lock: WakeLockSentinel | undefined

  function update() {
    if (!("wakeLock" in navigator)) return
    if (active.value && document.visibilityState === "visible") {
      if (lock == null || lock.released) {
        navigator.wakeLock
          .request("screen")
          .then((l) => {
            lock = l
          })
          .catch(() => undefined)
      }
    } else if (lock != null) {
      lock.release().catch(() => undefined)
      lock = undefined
    }
  }

  const onVisibility = () => update()
  document.addEventListener("visibilitychange", onVisibility)
  watch(active, onVisibility, { immediate: true })
  onScopeDispose(() => {
    document.removeEventListener("visibilitychange", onVisibility)
    void lock?.release().catch(() => undefined)
  })
}
/* c8 ignore stop */
