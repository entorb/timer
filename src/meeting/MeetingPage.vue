<script setup lang="ts">
import {
  mdiAccountTie,
  mdiAccountWrench,
  mdiCheckCircleOutline,
  mdiClockOutline,
  mdiCog,
  mdiCurrencyEur,
  mdiPause,
  mdiPlay,
  mdiRestart,
} from "@quasar/extras/mdi-v7"
import { computed } from "vue"
import { t } from "@/shared/i18n"
import StatsLine from "@/shared/StatsLine.vue"
import { formatClock, parseDecimal } from "@/shared/time"

import { activities, clampCount, efficiency, eur, isStarted, purchases } from "./meeting"
import { useMeeting } from "./useMeeting"

const m = useMeeting()
const { state, config, running, calcs } = m

const started = computed(() => isStarted(state.value))
const elapsedMs = computed(() => calcs.value.minutes * 60_000)
const color = computed(() => efficiency(calcs.value.minutes, calcs.value.people))
const alternatives = computed(() => activities(calcs.value.peopleHours))
const shopping = computed(() => purchases(calcs.value.totalCost))
const clock = computed(() => formatClock(elapsedMs.value))

const activityList = computed(() => [
  { n: alternatives.value.codeLines, label: t("lines of code written", "Zeilen Code geschrieben") },
  { n: alternatives.value.emails, label: t("emails answered", "E-Mails beantwortet") },
  { n: alternatives.value.jogKm, label: t("km jogging", "km gejoggt") },
  { n: alternatives.value.drinks, label: t("drinks consumed", "Getränke getrunken") },
  { n: alternatives.value.movies, label: t("movies watched", "Filme geschaut") },
])

const purchaseList = computed(() => [
  { n: shopping.value.coffees, label: t("coffees", "Kaffee") },
  { n: shopping.value.pizzas, label: t("pizzas", "Pizzen") },
  { n: shopping.value.tickets, label: t("conference tickets", "Konferenztickets") },
  { n: shopping.value.laptops, label: t("laptops", "Laptops") },
])

const groups = computed(
  () =>
    [
      { key: "group1", label: t("Senior", "Senior"), icon: mdiAccountTie },
      { key: "group2", label: t("Junior", "Junior"), icon: mdiAccountWrench },
    ] as const,
)

const rates = computed(
  () =>
    [
      {
        key: "group1HourlyRate",
        label: t("Hourly rate senior (€)", "Stundensatz Senior (€)"),
        icon: mdiAccountTie,
      },
      {
        key: "group2HourlyRate",
        label: t("Hourly rate junior (€)", "Stundensatz Junior (€)"),
        icon: mdiAccountWrench,
      },
    ] as const,
)

type InputValue = string | number | null

function setCount(key: "group1" | "group2", value: InputValue) {
  const n = parseDecimal(String(value ?? ""))
  state.value[key] = n == null ? 0 : clampCount(n)
}

function setRate(key: (typeof rates.value)[number]["key"], value: InputValue) {
  const n = parseDecimal(String(value ?? ""))
  config.value[key] = n == null || n < 0 ? 0 : n
}

function setWorkingHours(value: InputValue) {
  const n = parseDecimal(String(value ?? ""))
  if (n != null && n >= 4 && n <= 12) config.value.workingHoursPerDay = n
}

function setPaused(value: InputValue) {
  const n = parseDecimal(String(value ?? ""))
  if (n != null) m.setPausedMinutes(n)
}

function setStart(value: InputValue) {
  m.setStartClock(String(value ?? ""))
}
</script>

<template>
  <q-page
    padding
    class="column items-center page-gap"
  >
    <div
      id="mtg-time"
      class="mtg-time"
    >
      {{ clock }}
    </div>

    <div class="mtg-card row q-col-gutter-sm no-wrap">
      <div class="col">
        <q-btn
          id="btn-mtg-toggle"
          type="button"
          unelevated
          no-caps
          size="lg"
          class="full-width"
          :color="running ? 'warning' : 'positive'"
          :icon="running ? mdiPause : mdiPlay"
          :label="running ? t('Pause', 'Pause') : started ? t('Resume', 'Fortsetzen') : t('Start', 'Start')"
          @click="m.toggle"
        />
      </div>
      <div
        v-if="started && !running"
        class="col-auto"
      >
        <q-btn
          id="btn-mtg-reset"
          type="button"
          outline
          size="lg"
          color="negative"
          :icon="mdiRestart"
          :aria-label="t('Stop and reset', 'Stoppen und zurücksetzen')"
          @click="m.reset"
        />
      </div>
    </div>

    <div
      v-if="started"
      class="mtg-card row q-col-gutter-sm"
    >
      <div class="col-6">
        <q-input
          for="input-mtg-start"
          :model-value="m.startClock.value"
          :label="t('Start time', 'Startzeit')"
          type="time"
          dense
          outlined
          @update:model-value="setStart"
        />
      </div>
      <div class="col-6">
        <q-input
          for="input-mtg-pause"
          :model-value="Math.round(state.pausedMs / 60_000)"
          :label="t('Pause (min)', 'Pause (min)')"
          type="number"
          min="0"
          dense
          outlined
          @update:model-value="setPaused"
        />
      </div>
    </div>

    <div class="mtg-card row q-col-gutter-sm">
      <div
        v-for="g in groups"
        :key="g.key"
        class="col-6"
      >
        <q-input
          :for="`input-mtg-${g.key}`"
          :model-value="state[g.key]"
          :label="g.label"
          type="number"
          min="0"
          max="1000"
          outlined
          @update:model-value="setCount(g.key, $event)"
        >
          <template #prepend>
            <q-icon :name="g.icon" />
          </template>
        </q-input>
      </div>
    </div>

    <div class="mtg-card row q-col-gutter-sm">
      <div class="col-6">
        <q-card
          flat
          bordered
          class="text-center q-pa-md full-height"
        >
          <div class="text-caption">
            {{ t("People hours", "Personenstunden") }}
          </div>
          <div
            id="mtg-people"
            class="text-h5 text-weight-bold"
          >
            {{ calcs.peopleHours.toFixed(1) }} h
          </div>
          <div id="mtg-people-days">
            {{ calcs.peopleDays.toFixed(1) }} {{ t("days", "Tage") }}
          </div>
        </q-card>
      </div>
      <div class="col-6">
        <q-card
          flat
          class="text-center text-white q-pa-md full-height"
          :class="`bg-${color}`"
        >
          <div class="text-caption">
            {{
              calcs.hourlyCost > 0
                ? t(`${calcs.people} participants`, `${calcs.people} Teilnehmer`)
                : t("Participants (set rates below)", "Teilnehmer (Sätze unten setzen)")
            }}
          </div>
          <div
            id="mtg-cost"
            class="text-h5 text-weight-bold"
          >
            {{ calcs.hourlyCost > 0 ? eur(calcs.totalCost) : calcs.people }}
          </div>
          <div
            v-if="calcs.hourlyCost > 0"
            id="mtg-rate"
          >
            {{ eur(calcs.hourlyCost) }}/h
          </div>
        </q-card>
      </div>
    </div>

    <q-card
      v-if="calcs.peopleHours > 0"
      flat
      bordered
      class="mtg-card q-pa-md"
    >
      <div class="text-subtitle1">
        {{ t("What could have been done instead?", "Was hätte man stattdessen tun können?") }}
      </div>
      <div class="row q-col-gutter-md">
        <q-list
          dense
          class="col-12"
          :class="{ 'col-sm-6': calcs.totalCost > 0 }"
        >
          <q-item
            v-for="i in activityList"
            :key="i.label"
          >
            <q-item-section avatar>
              <q-icon :name="mdiCheckCircleOutline" />
            </q-item-section>
            <q-item-section>
              <span><b>{{ i.n }}</b> {{ i.label }}</span>
            </q-item-section>
          </q-item>
        </q-list>
        <q-list
          v-if="calcs.totalCost > 0"
          dense
          class="col-12 col-sm-6"
        >
          <q-item
            v-for="i in purchaseList"
            :key="i.label"
          >
            <q-item-section avatar>
              <q-icon :name="mdiCurrencyEur" />
            </q-item-section>
            <q-item-section>
              <span><b>{{ i.n }}</b> {{ i.label }}</span>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-card>

    <q-expansion-item
      :icon="mdiCog"
      :label="t('Settings', 'Einstellungen')"
      class="mtg-card"
    >
      <div class="q-pa-sm q-gutter-y-sm">
        <q-input
          v-for="r in rates"
          :key="r.key"
          :model-value="config[r.key]"
          :label="r.label"
          type="number"
          min="0"
          dense
          outlined
          @update:model-value="setRate(r.key, $event)"
        >
          <template #prepend>
            <q-icon :name="r.icon" />
          </template>
        </q-input>
        <q-input
          :model-value="config.workingHoursPerDay"
          :label="t('Working hours per day (4-12)', 'Arbeitsstunden pro Tag (4-12)')"
          type="number"
          min="4"
          max="12"
          dense
          outlined
          @update:model-value="setWorkingHours"
        >
          <template #prepend>
            <q-icon :name="mdiClockOutline" />
          </template>
        </q-input>
      </div>
    </q-expansion-item>

    <StatsLine
      origin="tmr-mm"
    />
  </q-page>
</template>

<style scoped>
.mtg-card {
  width: 100%;
  max-width: 480px;
}
.mtg-time {
  font-size: clamp(3.5rem, 18vw, 6rem);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
</style>
