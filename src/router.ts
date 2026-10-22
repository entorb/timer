import {
  mdiAccountClock,
  mdiAvTimer,
  mdiChartTimelineVariant,
  mdiDumbbell,
  mdiFoodApple,
  mdiPartyPopper,
  mdiTimerSand,
} from "@quasar/extras/mdi-v7"
import { createRouter, createWebHistory } from "vue-router"

// lazy loading of pages to speed up initial loading
// order = dropdown + start page, desc = use cases on start page
export const tabs = [
  {
    path: "/anticipation",
    name: "Anticipation",
    nameDe: "Vorfreude",
    icon: mdiPartyPopper,
    desc: "Count down to events: vacation, birthday, concert, Christmas, ...",
    descDe: "Countdown bis zu Ereignissen, Urlaub, Geburtstag, Konzert, Weihnachten...",
    component: () => import("./anticipation/AnticipationPage.vue"),
  },
  {
    path: "/workout",
    name: "Workout",
    nameDe: "Workout",
    icon: mdiDumbbell,
    desc: "Interval timer of work, rest, repeat: Tabata, HIIT, circuit training, stretching...",
    descDe:
      "Intervall-Timer von Sport, Pause, Wiederholen: Tabata, HIIT, Zirkeltraining, Dehnen...",
    component: () => import("./workout/WorkoutPage.vue"),
  },
  {
    path: "/eta",
    name: "ETA",
    nameDe: "ETA",
    icon: mdiChartTimelineVariant,
    desc: "Estimate when something finishes: waiting in a queue, homework, reading a book, processing...",
    descDe: "Schätzt, wann etwas fertig ist: Warteschlange, Hausaufgaben, Buch lesen, Prozess...",
    component: () => import("./eta/EtaPage.vue"),
  },
  {
    path: "/multitimer",
    name: "Multi-Timer",
    nameDe: "Multi-Timer",
    icon: mdiTimerSand,
    desc: "Several parallel countdowns: cooking, tea, laundry, parking...",
    descDe: "Mehrere parallele Countdowns: Kochen, Tee, Wäsche, Parkuhr...",
    component: () => import("./multitimer/MultiTimerPage.vue"),
  },
  {
    path: "/stopwatch",
    name: "Stopwatch",
    nameDe: "Stoppuhr",
    icon: mdiAvTimer,
    desc: "Lap times for multiple athletes: running, swimming, races...",
    descDe: "Rundenzeiten für mehrere Läufer: Laufen, Schwimmen, Rennen...",
    component: () => import("./stopwatch/StopwatchPage.vue"),
  },
  {
    path: "/meeting",
    name: "Meeting Meter",
    nameDe: "Meeting-Meter",
    icon: mdiAccountClock,
    desc: "Taximeter for meetings: cost and people hours",
    descDe: "Taximeter für Meetings: Kosten und Personenstunden",
    component: () => import("./meeting/MeetingPage.vue"),
  },
  {
    path: "/pomodoro",
    name: "Pomodoro",
    nameDe: "Pomodoro",
    icon: mdiFoodApple,
    desc: "Focused work sprints with regular breaks: studying, homework, writing, coding, beating procrastination...",
    descDe:
      "Konzentrieres Arbeiten in Etappen mit regelmäßigen Pausen: Lernen, Hausaufgaben, Schreiben, Programmieren...",
    component: () => import("./pomodoro/PomodoroPage.vue"),
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
