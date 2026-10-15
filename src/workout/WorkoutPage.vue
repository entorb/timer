<script setup lang="ts">
import { mdiCog, mdiDelete, mdiPause, mdiPlay, mdiPlus, mdiRestart, mdiSkipNext, mdiSkipPrevious } from "@quasar/extras/mdi-v7"
import { computed, ref, watch } from "vue"
import { t } from "@/shared/i18n"
import ProgressRing from "@/shared/ProgressRing.vue"
import StatsLine from "@/shared/StatsLine.vue"
import { formatClock } from "@/shared/time"

import { useWorkout } from "./useWorkout"
import type { Phase } from "./workout"

const { workouts, selectedId, workout, running, pos, total, elapsedMs, toggle, reset, skip, add, remove } =
  useWorkout()

const PHASES = computed<Record<Phase, { label: string; color: string }>>(() => ({
  prepare: { label: t("Get ready", "Vorbereiten"), color: "amber" },
  work: { label: t("Work", "Arbeiten"), color: "negative" },
  rest: { label: t("Rest", "Pause"), color: "positive" },
  done: { label: t("Done", "Fertig"), color: "primary" },
}))

const atStart = computed(() => !running.value && elapsedMs.value === 0)

// prepare + rest drain full -> empty, work fills up
const drains = (phase: Phase) => phase === "prepare" || phase === "rest"
const ringValue = computed(() => (drains(pos.value.phase) ? 1 - pos.value.progress : pos.value.progress))

// animate along the phase direction (Quasar default speed), jump instantly on reset / skip / segment switch
const animationSpeed = ref(600)
watch(
  () => [pos.value.phase, pos.value.rep, ringValue.value] as const,
  ([phase, rep, value], [oldPhase, oldRep, old]) => {
    const backwards = drains(phase) ? value > old : value < old
    animationSpeed.value = phase !== oldPhase || rep !== oldRep || backwards ? 0 : 600
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

    <div class="relative-position">
      <ProgressRing
        :value="ringValue"
        :color="PHASES[pos.phase].color"
        :animation-speed="animationSpeed"
      >
        <span
          id="wo-time"
          class="wo-time"
        >{{ display }}</span>
      </ProgressRing>
      <q-btn
        v-if="!running && !atStart"
        id="btn-wo-reset"
        type="button"
        outline
        round
        color="negative"
        :icon="mdiRestart"
        :aria-label="t('Reset', 'Zurücksetzen')"
        class="absolute-top-right"
        @click="reset"
      />
    </div>

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
        :icon="mdiSkipPrevious"
        :aria-label="t('Previous', 'Zurück')"
        @click="skip(-1)"
      />
      <q-btn
        id="btn-wo-toggle"
        type="button"
        round
        size="xl"
        :flat="!atStart && pos.phase !== 'done'"
        :color="!atStart && pos.phase !== 'done' ? undefined : PHASES.prepare.color"
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
      origin="tmr-wo"
    />
  </q-page>
</template>

<style scoped>
.wo-time {
  font-size: clamp(4rem, 18vw, 6.2rem);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
</style>
