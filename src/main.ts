import "@quasar/extras/roboto-font/roboto-font.css"
import "quasar/src/css/index.sass"
import "./app.css"

import { Dark, Dialog, Notify, Quasar } from "quasar"
import iconSet from "quasar/icon-set/svg-mdi-v7"
import { createApp } from "vue"

import App from "./App.vue"
import router from "./router"
import { unlockAudio } from "./shared/feedback"

// audio needs a user gesture first, resume also after iOS suspended it
document.addEventListener("pointerdown", unlockAudio)
document.addEventListener("keydown", unlockAudio)
// iOS Safari ignores user-scalable=no and touch-action for pinch zoom
document.addEventListener("gesturestart", (e) => e.preventDefault())

createApp(App)
  .use(router)
  .use(Quasar, { plugins: { Dark, Dialog, Notify }, iconSet, config: { dark: "auto" } })
  .mount("#app")
