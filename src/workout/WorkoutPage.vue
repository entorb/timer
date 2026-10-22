<script setup lang="ts">
import { mdiCog, mdiPause, mdiPlay, mdiRestart, mdiSkipNext, mdiSkipPrevious } from "@quasar/extras/mdi-v7"
import { computed, ref, watch, watchEffect } from "vue"
import { t } from "@/shared/i18n"
import ListSelect from "@/shared/ListSelect.vue"
import ProgressRing from "@/shared/ProgressRing.vue"
import StatsLine from "@/shared/StatsLine.vue"
import { formatClock } from "@/shared/time"
import { PHASES, useWorkout } from "./useWorkout"
import type { Phase } from "./workout"
import { ORIGIN } from "./workout"

const { workouts, selectedId, workout, running, pos, total, elapsedMs, toggle, reset, skip, add, remove } =
  useWorkout()

const atStart = computed(() => !running.value && elapsedMs.value === 0)

// prepare + rest drain full -> empty, work fills up
const drains = (phase: Phase) => phase === "prepare" || phase === "rest"
// while running the ring targets the end of the next second, so the 1s linear animation lands exactly on the next tick
const progress = computed(() => {
  const { remainingMs, progress: p } = pos.value
  if (!running.value || remainingMs === 0) return p
  // segment duration = remainingMs / (1 - p)
  return Math.min(1, p + (1000 * (1 - p)) / remainingMs)
})
const toRing = (p: number) => (drains(pos.value.phase) ? 1 - p : p)
const target = computed(() => toRing(progress.value))

// animate along the phase direction (one tick, linear = smooth); on reset / skip / segment switch
// jump to the actual (unshifted) value, e.g. full, then animate towards the lookahead target after paint
const ringValue = ref(0)
const animationSpeed = ref(1000)
watch(
  () => [pos.value.phase, pos.value.rep, target.value] as const,
  ([phase, rep, value], [oldPhase, oldRep, old]) => {
    const backwards = drains(phase) ? value > old : value < old
    if (phase === oldPhase && rep === oldRep && !backwards) {
      animationSpeed.value = 1000
      ringValue.value = value
      return
    }
    animationSpeed.value = 0
    ringValue.value = toRing(pos.value.progress)
    /* c8 ignore next 6 */
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        animationSpeed.value = 1000
        ringValue.value = target.value
      }),
    )
  },
)
watchEffect(() => {
  if (!running.value) ringValue.value = target.value
})

// round up, so it shows 0:20 at start and 0:00 only at the very end
const display = computed(() => formatClock(Math.ceil(pos.value.remainingMs / 1000) * 1000))
const totalLeft = computed(() => formatClock(Math.ceil((total.value - elapsedMs.value) / 1000) * 1000))

const fields = computed(
  () =>
    [
      { key: "prepare", label: t("Prepare (s)", "Vorbereitung (s)") },
      { key: "work", label: t("Work (s)", "Arbeit (s)") },
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
      v-if="running"
      id="wo-title"
      class="text-h6 text-weight-bold"
    >
      {{ workout.name }}
    </div>
    <ListSelect
      v-else
      v-model="selectedId"
      :items="workouts"
      :label="t('Workout', 'Workout')"
      style="max-width: 400px"
      @add="add"
      @remove="remove"
      @rename="workout.name = $event"
    />

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
        <div class="column items-center">
          <span
            id="wo-round"
            class="text-h6"
          >{{ pos.rep }}/{{ workout.reps }}</span>
          <span
            id="wo-time"
            class="wo-time"
          >{{ display }}</span>
          <span
            id="wo-total"
            class="text-grey-7 text-h6"
          >{{ totalLeft }}</span>
        </div>
      </ProgressRing>
      <q-btn
        v-if="!running && !atStart && pos.phase !== 'done'"
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
      :default-opened="atStart"
      :icon="mdiCog"
      :label="t('Settings', 'Einstellungen')"
      class="full-width"
      style="max-width: 400px"
    >
      <div class="q-pa-sm q-gutter-y-sm">
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
      :origin="ORIGIN"
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
