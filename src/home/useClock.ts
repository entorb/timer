import { onScopeDispose, ref } from "vue"

export function useClock() {
  const now = ref(new Date())
  // < 1s so displayed seconds never skip on interval jitter
  const interval = globalThis.setInterval(() => {
    now.value = new Date()
  }, 250)
  onScopeDispose(() => globalThis.clearInterval(interval))
  return now
}
