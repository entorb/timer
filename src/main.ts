import "@quasar/extras/roboto-font/roboto-font.css"
import "quasar/src/css/index.sass"
import "./app.css"

import { registerSW } from "virtual:pwa-register"
import * as Sentry from "@sentry/vue"
import { Dark, Dialog, Notify, Quasar } from "quasar"
import iconSet from "quasar/icon-set/svg-mdi-v7"
import { createApp } from "vue"
import App from "./App.vue"
import router from "./router"
import { onVisibilityChange, unlockAudio } from "./shared/feedback"
import { t } from "./shared/i18n"
import { statsFlush } from "./shared/stats"

// audio needs a user gesture first, resume also after iOS suspended it
document.addEventListener("pointerdown", unlockAudio)
document.addEventListener("keydown", unlockAudio)
// hidden: schedule upcoming sounds on the audio clock, timers get throttled
document.addEventListener("visibilitychange", onVisibilityChange)
// iOS Safari ignores user-scalable=no and touch-action for pinch zoom
document.addEventListener("gesturestart", (e) => e.preventDefault())

void statsFlush()

// Installed PWA resumes without navigation, so browser never checks for updates: do it on resume.
// New version: ask before reload, running timers would be lost.
/* c8 ignore next 20 */
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh: () =>
    Dialog.create({
      message: t("New version available. Reload?", "Neue Version verfügbar. Neu laden?"),
      cancel: true,
      persistent: true,
    }).onOk(() => updateSW(true)),
  onRegisteredSW: (_url, reg) => {
    document.addEventListener(
      "visibilitychange",
      () => document.visibilityState === "visible" && navigator.onLine && reg?.update(),
    )
  },
})

const app = createApp(App)

// offline: skip, a fetch would make mobile OS prompt for wifi; capture* calls are no-ops without init
if (navigator.onLine)
  Sentry.init({
    app,
    dsn: "https://94e85103ca60ae8be4e92e873b325a31@o4507139041525760.ingest.de.sentry.io/4512292162109520",
  })

app
  .use(router)
  .use(Quasar, { plugins: { Dark, Dialog, Notify }, iconSet, config: { dark: "auto" } })
  .mount("#app")
