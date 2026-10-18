import "@quasar/extras/roboto-font/roboto-font.css"
import "quasar/src/css/index.sass"
import "./app.css"

import { registerSW } from "virtual:pwa-register"
import { Dark, Dialog, Notify, Quasar } from "quasar"
import iconSet from "quasar/icon-set/svg-mdi-v7"
import { createApp } from "vue"

import App from "./App.vue"
import router from "./router"
import { onVisibilityChange, unlockAudio } from "./shared/feedback"

// audio needs a user gesture first, resume also after iOS suspended it
document.addEventListener("pointerdown", unlockAudio)
document.addEventListener("keydown", unlockAudio)
// hidden: schedule upcoming sounds on the audio clock, timers get throttled
document.addEventListener("visibilitychange", onVisibilityChange)
// iOS Safari ignores user-scalable=no and touch-action for pinch zoom
document.addEventListener("gesturestart", (e) => e.preventDefault())

// autoUpdate: new SW activates + drops old precache -> reload so lazy chunks match.
// Installed PWA resumes without navigation, so browser never checks for updates: do it on resume.
/* c8 ignore next 10 */
registerSW({
  immediate: true,
  onRegisteredSW: (_url, reg) => {
    document.addEventListener(
      "visibilitychange",
      () => document.visibilityState === "visible" && reg?.update(),
    )
  },
})

createApp(App)
  .use(router)
  .use(Quasar, { plugins: { Dark, Dialog, Notify }, iconSet, config: { dark: "auto" } })
  .mount("#app")
