<script setup lang="ts">
import { mdiCog, mdiDelete, mdiPause, mdiPlay, mdiPlus, mdiRestart, mdiSkipNext, mdiSkipPrevious } from "@quasar/extras/mdi-v7"
import { computed, ref, watch } from "vue"
import { t } from "@/shared/i18n"
import StatsLine from "@/shared/StatsLine.vue"
import { formatClock } from "@/shared/time"

import { useWorkout } from "./useWorkout"
import type { Phase } from "./workout"

const { workouts, selectedId, workout, running, pos, total, elapsedMs, toggle, reset, skip, add, remove } =
  useWorkout()

const PHASES = computed<Record<Phase, { label: string; color: string }>>(() => ({
  prepare: { label: t("Get ready", "Bereitmachen"), color: "amber" },
  work: { label: t("Work", "Belastung"), color: "negative" },
  rest: { label: t("Rest", "Pause"), color: "positive" },
  done: { label: t("Done", "Fertig"), color: "primary" },
}))

// animate forward progress (Quasar default speed), jump back instantly on reset / segment switch
const animationSpeed = ref(600)
watch(
  () => pos.value.progress,
  (value, old) => {
    animationSpeed.value = value < old ? 0 : 600
  },
)

const options = computed(() => workouts.value.map((w) => ({ label: w.name, value: w.id })))

// round up, so it shows 0:20 at start and 0:00 only at the very end
const display = computed(() => formatClock(Math.ceil(pos.value.remainingMs / 1000) * 1000))
const totalLeft = computed(() => formatClock(Math.ceil((total.value - elapsedMs.value) / 1000) * 1000))

const fields = computed(
  () =>
    [
      { key: "prepare", label: t("Prepare (s)", "Vorbereitung (s)") },
      { key: "work", label: t("Work (s)", "Belastung (s)") },
      { key: "rest", label: t("Rest (s)", "Pause (s)") },
      { key: "reps", label: t("Repetitions", "Wiederholungen") },
    ] as const,
)

function setField(key: (typeof fields.value)[number]["key"], value: string | number | null) {
  const n = Math.round(Number(value))
  if (Number.isFinite(n) && (n > 0 || (key !== "reps" && n === 0))) workout.value[key] = n
}
</script>

<template>
  <q-page
    padding
    class="column items-center page-gap"
  >
    <div
      class="row no-wrap items-center full-width"
      style="max-width: 400px"
    >
      <q-select
        v-model="selectedId"
        :options="options"
        emit-value
        map-options
        outlined
        dense
        :disable="running"
        :label="t('Workout', 'Workout')"
        class="col"
      />
      <q-btn
        type="button"
        flat
        round
        :icon="mdiPlus"
        :disable="running"
        :aria-label="t('Add workout', 'Workout hinzufügen')"
        @click="add"
      />
      <q-btn
        type="button"
        flat
        round
        :icon="mdiDelete"
        :disable="running || workouts.length <= 1"
        :aria-label="t('Delete workout', 'Workout löschen')"
        @click="remove"
      />
    </div>

    <div
      id="wo-phase"
      class="text-h5 text-weight-bold"
      :class="`text-${PHASES[pos.phase].color}`"
    >
      {{ PHASES[pos.phase].label }}
    </div>

    <q-circular-progress
      :value="pos.progress"
      :min="0"
      :max="1"
      size="min(80vw, 320px)"
      :thickness="0.1"
      :color="PHASES[pos.phase].color"
      track-color="grey-3"
      :animation-speed="animationSpeed"
      show-value
    >
      <span
        id="wo-time"
        class="wo-time"
      >{{ display }}</span>
    </q-circular-progress>

    <div class="text-h6">
      {{ t("Round", "Runde") }} {{ pos.rep }} / {{ workout.reps }}
      <span class="text-grey-7 text-body1">· {{ t("Total left", "Gesamt übrig") }} {{ totalLeft }}</span>
    </div>

    <div class="row q-gutter-lg items-center">
      <q-btn
        type="button"
        flat
        round
        size="lg"
        :icon="mdiRestart"
        :aria-label="t('Reset', 'Zurücksetzen')"
        @click="reset"
      />
      <q-btn
        type="button"
        flat
        round
        size="lg"
        :icon="mdiSkipPrevious"
        :aria-label="t('Previous', 'Zurück')"
        @click="skip(-1)"
      />
      <q-btn
        id="btn-wo-toggle"
        type="button"
        round
        size="xl"
        :color="PHASES[pos.phase].color"
        :icon="running ? mdiPause : mdiPlay"
        :aria-label="running ? t('Pause', 'Pause') : t('Start', 'Start')"
        @click="toggle"
      />
      <q-btn
        type="button"
        flat
        round
        size="lg"
        :icon="mdiSkipNext"
        :disable="pos.phase === 'done'"
        :aria-label="t('Next', 'Weiter')"
        @click="skip(1)"
      />
    </div>

    <q-expansion-item
      v-if="!running"
      :icon="mdiCog"
      :label="t('Settings', 'Einstellungen')"
      class="full-width"
      style="max-width: 400px"
    >
      <div class="q-pa-sm q-gutter-y-sm">
        <q-input
          v-model="workout.name"
          label="Name"
          dense
          outlined
        />
        <div class="row q-col-gutter-sm">
          <q-input
            v-for="f in fields"
            :key="f.key"
            :model-value="workout[f.key]"
            :label="f.label"
            type="number"
            inputmode="numeric"
            min="0"
            dense
            outlined
            class="col-6"
            @update:model-value="setField(f.key, $event)"
          />
        </div>
      </div>
    </q-expansion-item>

    <StatsLine
      origin="timer-workout"
      :what="t('workouts', 'Workouts')"
    />
  </q-page>
</template>

<style scoped>
.wo-time {
  font-size: clamp(4rem, 20vw, 7rem);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
</style>
