import { describe, expect, it } from "vitest"
import { effectScope, nextTick } from "vue"

import { useMultiTimer } from "../useMultiTimer"

describe("useMultiTimer persistence", () => {
  it("restores recent chips and timers after remount", async () => {
    localStorage.clear()
    const scope = effectScope()
    const mt = scope.run(() => useMultiTimer())
    mt?.addFromInput("Tea", "5")
    await nextTick()
    scope.stop()
    expect(localStorage.getItem("eta_vue_mt_recent")).toBe('["Tea:5m"]')
    const again = effectScope().run(() => useMultiTimer())
    expect(again?.recent.value).toEqual(["Tea:5m"])
    expect(again?.timers.value).toHaveLength(1)
  })
})
