<script setup lang="ts">
import { computed } from "vue"
import { topLabel } from "@/anticipation/useAnticipation"
import { PHASES as POMO_PHASES } from "@/pomodoro/usePomodoro"
import { tabs } from "@/router"
import { t } from "@/shared/i18n"
import { formatClock, formatDateTime } from "@/shared/time"
import { PHASES as WO_PHASES } from "@/workout/useWorkout"
import DayClock from "./DayClock.vue"
import type { Running } from "./running"
import { useClock } from "./useClock"
import { useRunning } from "./useRunning"

// one tick for clock and running list
const now = useClock()
const running = useRunning(now)

// countdowns round up (like their pages): 0:00 only at the very end
const duration = (r: Running) => formatClock(r.endTs == null ? r.ms : Math.ceil(r.ms / 1000) * 1000)

function phaseLabel(path: string, phase?: string): string {
  const phases: Record<string, { label: string }> =
    path === "/pomodoro" ? POMO_PHASES.value : WO_PHASES.value
  return phase == null ? "" : (phases[phase]?.label ?? "")
}
const items = computed(() =>
  running.value.map((r) => {
    const tab = tabs.find((tb) => tb.path === r.path)
    return {
      ...r,
      icon: tab?.icon,
      title: r.label ?? (tab == null ? "" : t(tab.name, tab.nameDe)),
      phase: phaseLabel(r.path, r.phase),
      lap: r.lapMs == null ? "" : formatClock(r.lapMs),
      time:
        r.days == null ? duration(r) : topLabel(r.ms / 1000, r.days, r.endTs == null),
      end: r.endTs == null || r.days != null ? "" : formatDateTime(new Date(r.endTs), r.ms >= 86_400_000),
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
