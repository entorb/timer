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
// order = dropdown + start page, desc = use cases on start page
export const tabs = [
  {
    path: "/workout",
    name: "Workout",
    nameDe: "Workout",
    icon: mdiDumbbell,
    desc: "Interval timer: prepare, work, rest, repeat. E.g. Tabata, HIIT, circuit training, stretching.",
    descDe:
      "Intervall-Timer: Vorbereiten, Arbeiten, Pause, Wiederholen. Z.B. Tabata, HIIT, Zirkeltraining, Dehnen.",
    component: () => import("./workout/WorkoutPage.vue"),
  },
  {
    path: "/eta",
    name: "ETA",
    nameDe: "ETA",
    icon: mdiChartTimelineVariant,
    desc: "Estimate when something finishes. E.g. waiting in a queue, homework, reading a book, long download or build.",
    descDe:
      "Schätzt, wann etwas fertig ist. Z.B. Warteschlange, Hausaufgaben, Buch lesen, langer Download oder Prozess.",
    component: () => import("./eta/EtaPage.vue"),
  },
  {
    path: "/multitimer",
    name: "Multi-Timer",
    nameDe: "Multi-Timer",
    icon: mdiTimerSand,
    desc: "Several named countdowns at once, with alarm. E.g. cooking (pasta, oven, tea), laundry, parking.",
    descDe:
      "Mehrere benannte Countdowns gleichzeitig, mit Alarm. Z.B. Kochen (Nudeln, Ofen, Tee), Wäsche, Parkuhr.",
    component: () => import("./multitimer/MultiTimerPage.vue"),
  },
  {
    path: "/stopwatch",
    name: "Stopwatch",
    nameDe: "Stoppuhr",
    icon: mdiAvTimer,
    desc: "Lap times for multiple athletes, common or individual start. E.g. running or swim training, races.",
    descDe:
      "Rundenzeiten für mehrere Läufer, gemeinsamer oder einzelner Start. Z.B. Lauf- oder Schwimmtraining, Wettrennen.",
    component: () => import("./stopwatch/StopwatchPage.vue"),
  },
  {
    path: "/pomodoro",
    name: "Pomodoro",
    nameDe: "Pomodoro",
    icon: mdiFoodApple,
    desc: "Focused work sprints with regular breaks: 25 min focus, 5 min break, 15 min break after 4 rounds (adjustable). E.g. studying, homework, writing, coding, beating procrastination.",
    descDe:
      "Konzentriert in Etappen arbeiten, mit regelmäßigen Pausen: 25 min Fokus, 5 min Pause, 15 min Pause nach 4 Runden (einstellbar). Z.B. Lernen, Hausaufgaben, Schreiben, Programmieren, gegen Aufschieben.",
    component: () => import("./pomodoro/PomodoroPage.vue"),
  },
  {
    path: "/meeting",
    name: "Meeting Meter",
    nameDe: "Meeting-Meter",
    icon: mdiAccountClock,
    desc: "Taximeter for meetings: live cost and people hours. E.g. make meeting cost visible, time calls.",
    descDe:
      "Taximeter für Meetings: Kosten und Personenstunden live. Z.B. Meeting-Kosten sichtbar machen, Telefonate stoppen.",
    component: () => import("./meeting/MeetingPage.vue"),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", component: () => import("./home/HomePage.vue") },
    ...tabs,
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
})

// stale page after deploy: old lazy chunk gone -> full load of target fetches new index
/* c8 ignore next 4 */
router.onError((err: Error, to) => {
  if (/dynamically imported module|module script failed/i.test(err.message))
    window.location.assign(router.resolve(to).href)
})

export default router
