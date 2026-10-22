<script setup lang="ts">
import { computed } from "vue"
import { topLabel } from "@/anticipation/useAnticipation"
import { PHASES as POMO_PHASES } from "@/pomodoro/usePomodoro"
import { tabs } from "@/router"
import { t } from "@/shared/i18n"
import { DAY_MS, formatClock, formatDateTime } from "@/shared/time"
import { useClock } from "@/shared/useClock"
import { PHASES as WO_PHASES } from "@/workout/useWorkout"
import DayClock from "./DayClock.vue"
import type { Running } from "./running"
import { useRunning } from "./useRunning"

// one tick for clock and running list
const now = useClock()
const running = useRunning(now)

// countdowns round up (like their pages): 0:00 only at the very end
const ceilClock = (ms: number) => formatClock(Math.ceil(ms / 1000) * 1000)
const duration = (r: Running) => (r.endTs == null ? formatClock(r.ms) : ceilClock(r.ms))
const timeLabel = (r: Running) => {
  if (r.stageMs != null) return ceilClock(r.stageMs)
  return r.days == null ? duration(r) : topLabel(r.ms / 1000, r.days, r.endTs == null)
}
// workout: stage left on top, workout left below
const endLabel = (r: Running) =>
  r.stageMs != null ? duration(r) : r.endTs == null || r.days != null ? "" : formatDateTime(new Date(r.endTs), r.ms >= DAY_MS)

const PHASES: Record<string, typeof POMO_PHASES | typeof WO_PHASES> = {
  "/pomodoro": POMO_PHASES,
  "/workout": WO_PHASES,
}
const phaseLabel = (path: string, phase?: string): string =>
  phase == null ? "" : ((PHASES[path]?.value as Record<string, { label: string }>)?.[phase]?.label ?? "")
const items = computed(() =>
  running.value.map((r) => {
    const tab = tabs.find((tb) => tb.path === r.path)
    return {
      ...r,
      icon: tab?.icon,
      title: r.label ?? (tab == null ? "" : t(tab.name, tab.nameDe)),
      phase: phaseLabel(r.path, r.phase),
      lap: r.lapMs == null ? "" : formatClock(r.lapMs),
      time: timeLabel(r),
      end: endLabel(r),
    }
  }),
)
</script>

<template>
  <q-page
    padding
    class="column items-center page-gap"
  >
    <h1 class="text-h5 text-center q-my-none">
      {{ t("Timer Apps", "Timer Apps") }}
    </h1>
    <DayClock :now="now" />
    <q-list
      v-if="items.length > 0"
      id="home-running"
      bordered
      separator
      dense
      class="full-width rounded-borders"
      style="max-width: 600px"
    >
      <q-item
        v-for="(item, i) in items"
        :key="i"
        clickable
        :to="item.path"
      >
        <q-item-section avatar>
          <q-icon
            :name="item.icon"
            color="primary"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ item.title }}</q-item-label>
          <q-item-label
            v-if="item.phase"
            caption
          >
            {{ item.phase }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-item-label
            v-if="item.lap"
            caption
          >
            {{ item.lap }}
          </q-item-label>
          <q-item-label>{{ item.time }}</q-item-label>
          <q-item-label
            v-if="item.end"
            caption
          >
            {{ item.end }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
    <q-list
      bordered
      separator
      class="full-width rounded-borders"
      style="max-width: 600px"
    >
      <q-item
        v-for="tab in tabs"
        :id="`home-${tab.path.slice(1)}`"
        :key="tab.path"
        clickable
        :to="tab.path"
      >
        <q-item-section avatar>
          <q-icon
            :name="tab.icon"
            color="primary"
            size="md"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-subtitle1">
            {{ t(tab.name, tab.nameDe) }}
          </q-item-label>
          <q-item-label caption>
            {{ t(tab.desc, tab.descDe) }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>
