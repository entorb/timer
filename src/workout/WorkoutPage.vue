<script setup lang="ts">
import { mdiPause, mdiPlay, mdiRestart, mdiSkipNext, mdiSkipPrevious } from "@quasar/extras/mdi-v7"
import { computed, ref, watch, watchEffect } from "vue"
import { t } from "@/shared/i18n"
import ListSelect from "@/shared/ListSelect.vue"
import ProgressRing from "@/shared/ProgressRing.vue"
import StatsLine from "@/shared/StatsLine.vue"
import { formatClock } from "@/shared/time"
import { PHASES, useWorkout } from "./useWorkout"
import type { Phase } from "./workout"
import { autoName, formatPhaseTime, ORIGIN } from "./workout"

const { workouts, selectedId, workout, running, pos, total, elapsedMs, toggle, reset, skip, save, remove } =
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

// round up: a short phase starts at its full seconds and reaches 0 only at the very end
const display = computed(() => formatPhaseTime(pos.value.remainingMs, pos.value.duration))
const totalLeft = computed(() => formatClock(Math.ceil((total.value - elapsedMs.value) / 1000) * 1000))
// empty instead of hidden, so the count above and below keeps the timer centered
const round = computed(() =>
  pos.value.phase === "work" && pos.value.rep === workout.value.reps
    ? ""
    : `${pos.value.rep}/${workout.value.reps}`,
)

// create / edit dialog; editId null = create
const dialog = ref(false)
const editId = ref<string | undefined>()
const form = ref({ name: "", work: 0, rest: 0, reps: 0 })
const valid = computed(() => {
  const { work, rest, reps } = form.value
  return [work, rest, reps].every(Number.isInteger) && work > 0 && rest >= 0 && reps > 0
})

function openForm(id?: string) {
  const { name, work, rest, reps } = workout.value
  // auto name stays empty, so it follows changed numbers
  form.value = { name: id == null || name === autoName(workout.value) ? "" : name, work, rest, reps }
  editId.value = id
  dialog.value = true
}

function submit() {
  if (!valid.value) return
  save(form.value, editId.value)
  dialog.value = false
}
</script>

<template>
  <q-page
    padding
    class="column items-center page-gap wo-page"
  >
    <div
      v-if="running"
      id="wo-title"
      class="text-h6 text-weight-bold full-width"
      style="max-width: 400px"
    >
      {{ workout.name }}
    </div>
    <ListSelect
      v-else
      v-model="selectedId"
      :items="workouts"
      :label="t('Workout', 'Workout')"
      style="max-width: 400px"
      custom-edit
      @add="openForm()"
      @edit="openForm(workout.id)"
      @remove="remove"
    />

    <div
      id="wo-phase"
      class="text-h5 text-weight-bold"
      :class="`text-${PHASES[pos.phase].color}`"
    >
      {{ PHASES[pos.phase].label }}
    </div>

    <div class="relative-position wo-ring">
      <ProgressRing
        :value="ringValue"
        size="min(80vw, 320px, 100dvh - 100px)"
        :color="PHASES[pos.phase].color"
        :animation-speed="animationSpeed"
      >
        <div class="column items-center">
          <span
            id="wo-round"
            class="text-h5"
          >{{ round }}</span>
          <span
            id="wo-time"
            class="wo-time"
          >{{ display }}</span>
          <span
            v-if="pos.phase !== 'work' || pos.rep < workout.reps"
            id="wo-total"
            class="text-h5"
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

    <q-dialog v-model="dialog">
      <q-card style="width: 400px; max-width: 90vw">
        <q-form @submit="submit">
          <q-card-section>
            <div class="text-h6 text-weight-bold">
              {{ editId == null ? t("New workout", "Neues Workout") : t("Edit workout", "Workout bearbeiten") }}
            </div>
          </q-card-section>
          <q-card-section class="q-pt-none q-gutter-y-md">
            <q-input
              v-model.number="form.work"
              :label="t('Work (s)', 'Arbeit (s)')"
              type="number"
              inputmode="numeric"
              min="1"
              outlined
              input-class="text-h6"
            />
            <q-input
              v-model.number="form.rest"
              :label="t('Rest (s)', 'Pause (s)')"
              type="number"
              inputmode="numeric"
              min="0"
              outlined
              input-class="text-h6"
            />
            <q-input
              v-model.number="form.reps"
              :label="t('Repetitions', 'Wiederholungen')"
              type="number"
              inputmode="numeric"
              min="1"
              outlined
              input-class="text-h6"
            />
            <q-input
              v-model="form.name"
              :label="t('Name (optional)', 'Name (optional)')"
              :placeholder="autoName(form)"
              outlined
            />
          </q-card-section>
          <q-card-actions class="q-pa-md q-pt-none">
            <q-btn
              v-close-popup
              type="button"
              flat
              :label="t('Cancel', 'Abbrechen')"
              class="text-body1"
            />
            <q-space />
            <q-btn
              id="btn-wo-save"
              type="submit"
              color="primary"
              :disable="!valid"
              :label="t('Save', 'Speichern')"
              class="text-body1"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <StatsLine
      v-if="!running"
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

/* phone landscape: ring left, title / phase / controls right */
@media (orientation: landscape) and (max-height: 500px) {
  .wo-page {
    display: grid;
    grid-template-columns: auto minmax(0, 400px);
    justify-content: center;
    align-items: center;
    column-gap: 32px;
  }
  .wo-ring {
    grid-column: 1;
    grid-row: 1 / span 4;
  }
  .wo-time {
    font-size: clamp(3rem, 16dvh, 6.2rem);
  }
}
</style>
