<script setup lang="ts">
import {
  mdiCircle,
  mdiCog,
  mdiPause,
  mdiPlay,
  mdiRestart,
  mdiSkipNext,
} from "@quasar/extras/mdi-v7"
import { computed } from "vue"
import { t } from "@/shared/i18n"
import StatsLine from "@/shared/StatsLine.vue"
import { formatClock } from "@/shared/time"

import { cycleRound, DEFAULT_SETTINGS } from "./pomodoro"
import { PHASES, usePomodoro } from "./usePomodoro"

const { settings, state, running, canReset, remainingMs, progress, toggle, skip, reset } =
  usePomodoro()

// round up, so it shows 25:00 at start and 0:00 only at the very end
const display = computed(() => formatClock(Math.ceil(remainingMs.value / 1000) * 1000))

const fields = computed(
  () =>
    [
      { key: "focus", label: t("Focus (min)", "Fokus (min)") },
      { key: "short", label: t("Short break (min)", "Kurze Pause (min)") },
      { key: "long", label: t("Long break (min)", "Lange Pause (min)") },
      { key: "rounds", label: t("Rounds until long break", "Runden bis zur langen Pause") },
    ] as const,
)

function setField(key: (typeof fields.value)[number]["key"], value: string | number | null) {
  const n = Number(value)
  if (Number.isFinite(n) && n > 0) settings.value[key] = key === "rounds" ? Math.round(n) : n
}
</script>

<template>
  <q-page
    padding
    class="column items-center page-gap"
  >
    <div class="text-h6">
      {{ PHASES[state.phase].label }}
    </div>

    <q-circular-progress
      :value="progress"
      :min="0"
      :max="1"
      size="260px"
      :thickness="0.12"
      :color="PHASES[state.phase].color"
      track-color="grey-3"
      show-value
      class="q-my-md"
    >
      <span
        id="pomo-time"
        class="pomo-time"
      >{{ display }}</span>
    </q-circular-progress>

    <div
      class="row q-gutter-xs"
      :aria-label="t(
        `Round ${cycleRound(state, settings)} of ${settings.rounds}`,
        `Runde ${cycleRound(state, settings)} von ${settings.rounds}`,
      )"
    >
      <q-icon
        v-for="i in settings.rounds"
        :key="i"
        :name="mdiCircle"
        size="14px"
        :color="i <= cycleRound(state, settings) ? 'negative' : 'grey-4'"
      />
    </div>

    <div class="pomo-controls row q-col-gutter-sm no-wrap">
      <div class="col">
        <q-btn
          id="btn-pomo-toggle"
          type="button"
          unelevated
          no-caps
          size="lg"
          class="full-width"
          :color="PHASES[state.phase].color"
          :icon="running ? mdiPause : mdiPlay"
          :label="running ? t('Pause', 'Pause') : t('Start', 'Start')"
          @click="toggle"
        />
      </div>
      <div class="col-auto">
        <q-btn
          type="button"
          outline
          size="lg"
          :color="PHASES[state.phase].color"
          :icon="mdiSkipNext"
          :aria-label="t('Skip to next phase', 'Zur nächsten Phase springen')"
          @click="skip"
        />
      </div>
      <div
        v-if="canReset"
        class="col-auto"
      >
        <q-btn
          type="button"
          outline
          size="lg"
          color="negative"
          :icon="mdiRestart"
          :aria-label="t('Reset', 'Zurücksetzen')"
          @click="reset"
        />
      </div>
    </div>

    <q-expansion-item
      :icon="mdiCog"
      :label="t('Settings', 'Einstellungen')"
      class="full-width"
      style="max-width: 400px"
    >
      <div class="q-pa-sm q-gutter-y-sm">
        <q-input
          v-for="f in fields"
          :key="f.key"
          :model-value="settings[f.key]"
          :label="f.label"
          type="number"
          min="1"
          dense
          outlined
          @update:model-value="setField(f.key, $event)"
        />
        <q-btn
          type="button"
          flat
          :label="t('Defaults', 'Standardwerte')"
          @click="settings = { ...DEFAULT_SETTINGS }"
        />
      </div>
    </q-expansion-item>

    <StatsLine origin="tmr-pomo" />
  </q-page>
</template>

<style scoped>
.pomo-controls {
  width: 100%;
  max-width: 400px;
}
.pomo-time {
  font-size: 3.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
</style>
