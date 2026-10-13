import {
  mdiAccountClock,
  mdiAvTimer,
  mdiChartTimelineVariant,
  mdiDumbbell,
  mdiFoodApple,
  mdiTimerSand,
} from "@quasar/extras/mdi-v7"
import { createRouter, createWebHistory } from "vue-router"

// lazy loading of pages to speed up initial loading
export const tabs = [
  {
    path: "/eta",
    name: "ETA",
    nameDe: "ETA",
    icon: mdiChartTimelineVariant,
    component: () => import("./eta/EtaPage.vue"),
  },
  {
    path: "/multitimer",
    name: "Multi-Timer",
    nameDe: "Multi-Timer",
    icon: mdiTimerSand,
    component: () => import("./multitimer/MultiTimerPage.vue"),
  },
  {
    path: "/stopwatch",
    name: "Stopwatch",
    nameDe: "Stoppuhr",
    icon: mdiAvTimer,
    component: () => import("./stopwatch/StopwatchPage.vue"),
  },
  {
    path: "/pomodoro",
    name: "Pomodoro",
    nameDe: "Pomodoro",
    icon: mdiFoodApple,
    component: () => import("./pomodoro/PomodoroPage.vue"),
  },
  {
    path: "/workout",
    name: "Workout",
    nameDe: "Workout",
    icon: mdiDumbbell,
    component: () => import("./workout/WorkoutPage.vue"),
  },
  {
    path: "/meeting",
    name: "Meeting Meter",
    nameDe: "Meeting-Meter",
    icon: mdiAccountClock,
    component: () => import("./meeting/MeetingPage.vue"),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...tabs, { path: "/:pathMatch(.*)*", redirect: "/eta" }],
})

// stale page after deploy: old lazy chunk gone -> full load of target fetches new index
/* c8 ignore next 4 */
router.onError((err: Error, to) => {
  if (/dynamically imported module|module script failed/i.test(err.message))
    window.location.assign(router.resolve(to).href)
})

export default router
