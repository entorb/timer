<script setup lang="ts">
import {
  mdiAccountPlus,
  mdiChevronDown,
  mdiChevronUp,
  mdiClose,
  mdiContentCopy,
  mdiDecimalDecrease,
  mdiDecimalIncrease,
  mdiDelete,
  mdiDotsVertical,
  mdiPause,
  mdiPencil,
  mdiPlay,
  mdiRestart,
} from "@quasar/extras/mdi-v7"
import { useQuasar } from "quasar"
import { computed, ref } from "vue"
import { confirmDialog } from "@/shared/confirm"
import { t } from "@/shared/i18n"
import StatsLine from "@/shared/StatsLine.vue"
import { formatClock } from "@/shared/time"

import {
  type Athlete,
  elapsed,
  isRunning,
  lapStats,
  lapTimes,
  nextLapForecast,
  toCsv,
} from "./stopwatch"
import { useStopwatch } from "./useStopwatch"

const $q = useQuasar()
const sw = useStopwatch()
const { athletes, now, anyRunning, showTenths } = sw
const anyStarted = computed(() => athletes.value.some((a) => a.start != null))

// derived once per tick, the template reads each value several times
const tiles = computed(() => {
  // floor to the displayed digit, so countdown and lap time flip on the same tick
  const unit = showTenths.value ? 100 : 1000
  const q = (ms: number) => Math.floor(ms / unit) * unit
  return athletes.value.map((a) => {
    const stats = lapStats(a, now.value)
    const f = nextLapForecast(a, now.value)
    const times = lapTimes(a)
    return {
      a,
      stats,
      times,
      slowest: Math.max(...times),
      forecast: f && { dueIn: q(f.lapTime) - q(stats.current) },
    }
  })
})

// lap lists are expanded by default
const hideLaps = ref(new Set<number>())
const fmt = (ms: number | undefined) => (ms == null ? "–" : formatClock(ms, showTenths.value))

const editValue = (ms: number) => formatClock(ms, showTenths.value)

function toggleLaps(a: Athlete) {
  if (hideLaps.value.has(a.id)) hideLaps.value.delete(a.id)
  else hideLaps.value.add(a.id)
}

function confirmResetAll() {
  confirmDialog(
    t("Reset all?", "Alles zurücksetzen?"),
    sw.resetAll,
    t("All times and laps get lost.", "Alle Zeiten und Runden gehen verloren."),
  )
}

function editLap(a: Athlete, index: number, raw: string) {
  if (!sw.editLap(a, index, raw))
    $q.notify({ message: t("Invalid lap time", "Ungültige Rundenzeit"), type: "negative" })
}

async function copyCsv() {
  try {
    await navigator.clipboard.writeText(toCsv(athletes.value, (ms) => formatClock(ms, true)))
    $q.notify({ message: t("Laps copied as CSV", "Runden als CSV kopiert"), type: "positive" })
  } catch {
    $q.notify({ message: t("Copy failed", "Kopieren fehlgeschlagen"), type: "negative" })
  }
}
</script>

<template>
  <q-page
    padding
    class="column page-gap"
  >
    <div class="row q-gutter-sm justify-center">
      <q-btn
        id="btn-start-all"
        type="button"
        color="positive"
        :icon="mdiPlay"
        :label="t('Start all', 'Alle starten')"
        @click="sw.startAll"
      />
      <q-btn
        id="btn-stop-all"
        type="button"
        color="warning"
        :icon="mdiPause"
        :label="t('Stop all', 'Alle stoppen')"
        :disable="!anyRunning"
        @click="sw.stopAll"
      />
      <q-btn
        v-if="anyStarted"
        type="button"
        outline
        color="negative"
        :icon="mdiRestart"
        :aria-label="t('Reset all', 'Alle zurücksetzen')"
        @click="confirmResetAll"
      />
      <q-btn
        id="btn-add-athlete"
        type="button"
        flat
        round
        :icon="mdiAccountPlus"
        :aria-label="t('Add athlete', 'Läufer hinzufügen')"
        @click="sw.add"
      />
      <q-btn
        type="button"
        flat
        round
        :icon="mdiContentCopy"
        :aria-label="t('Copy laps as CSV', 'Runden als CSV kopieren')"
        @click="copyCsv"
      />
      <q-btn
        id="btn-tenths"
        type="button"
        flat
        round
        :icon="showTenths ? mdiDecimalDecrease : mdiDecimalIncrease"
        :aria-label="
          showTenths
            ? t('Hide tenths of seconds', 'Zehntelsekunden ausblenden')
            : t('Show tenths of seconds', 'Zehntelsekunden anzeigen')
        "
        :aria-pressed="showTenths"
        @click="showTenths = !showTenths"
      />
    </div>

    <p class="text-caption text-grey-7 q-my-none text-center">
      {{
        t(
          "Tap a tile to start, tap again to record a lap.",
          "Kachel antippen zum Starten, erneut antippen für eine Runde.",
        )
      }}
    </p>

    <div class="row q-col-gutter-sm">
      <div
        v-for="{ a, stats, times, slowest, forecast } in tiles"
        :key="a.id"
        class="col-6 col-sm-4 col-md-3"
      >
        <q-card
          bordered
          flat
          :class="isRunning(a) ? 'running' : ''"
        >
          <div class="row items-center no-wrap q-pl-sm">
            <div class="col ellipsis text-weight-bold cursor-pointer">
              {{ a.name }}
              <q-popup-edit
                v-slot="scope"
                v-model="a.name"
                auto-save
              >
                <!-- eslint-disable vuejs-accessibility/no-autofocus -- popup opened on purpose to edit -->
                <q-input
                  v-model="scope.value"
                  dense
                  autofocus
                  label="Name"
                  @keyup.enter="scope.set"
                />
                <!-- eslint-enable vuejs-accessibility/no-autofocus -->
              </q-popup-edit>
            </div>
            <q-btn
              type="button"
              flat
              round
              dense
              :icon="mdiDotsVertical"
              :aria-label="t(`Menu ${a.name}`, `Menü ${a.name}`)"
            >
              <q-menu auto-close>
                <q-list dense>
                  <q-item
                    v-if="isRunning(a)"
                    clickable
                    @click="sw.stop(a)"
                  >
                    <q-item-section avatar>
                      <q-icon :name="mdiPause" />
                    </q-item-section>
                    <q-item-section>{{ t("Stop", "Stopp") }}</q-item-section>
                  </q-item>
                  <q-item
                    v-else
                    clickable
                    @click="sw.start(a)"
                  >
                    <q-item-section avatar>
                      <q-icon :name="mdiPlay" />
                    </q-item-section>
                    <q-item-section>
                      {{ a.start == null ? t("Start", "Start") : t("Resume", "Fortsetzen") }}
                    </q-item-section>
                  </q-item>
                  <q-item
                    clickable
                    @click="sw.reset(a)"
                  >
                    <q-item-section avatar>
                      <q-icon :name="mdiRestart" />
                    </q-item-section>
                    <q-item-section>{{ t("Reset", "Zurücksetzen") }}</q-item-section>
                  </q-item>
                  <q-item
                    clickable
                    @click="sw.remove(a)"
                  >
                    <q-item-section avatar>
                      <q-icon :name="mdiDelete" />
                    </q-item-section>
                    <q-item-section>{{ t("Delete", "Löschen") }}</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>

          <button
            v-ripple
            type="button"
            class="lap-btn q-pa-sm relative-position"
            :aria-label="isRunning(a) ? t(`Lap ${a.name}`, `Runde ${a.name}`) : t(`Start ${a.name}`, `Start ${a.name}`)"
            @click="sw.tap(a)"
          >
            <span class="row justify-between">
              <span>{{ t("Lap", "Runde") }} {{ stats.count + (a.start == null ? 0 : 1) }}</span>
              <span>{{ t("total", "gesamt") }} {{ fmt(elapsed(a, now)) }}</span>
            </span>
            <span class="current">{{ fmt(stats.current) }}</span>
            <span class="row justify-between text-grey-7">
              <span>{{ t("last", "letzte") }} {{ fmt(stats.last) }}</span>
              <span
                v-if="forecast && forecast.dueIn >= 0"
                class="text-primary"
              >{{ t("in", "in") }} {{ fmt(forecast.dueIn) }}</span>
              <span
                v-else-if="forecast"
                class="text-negative"
              >+{{ fmt(-forecast.dueIn) }}</span>
              <span>{{ t("best", "beste") }} {{ fmt(stats.best) }}</span>
            </span>
          </button>

          <q-btn
            v-if="a.laps.length > 0"
            type="button"
            flat
            dense
            no-caps
            size="sm"
            class="full-width"
            :icon-right="hideLaps.has(a.id) ? mdiChevronDown : mdiChevronUp"
            :label="t(`${a.laps.length} laps`, `${a.laps.length} Runden`)"
            :aria-label="
              hideLaps.has(a.id)
                ? t(`Show laps ${a.name}`, `Runden ${a.name} anzeigen`)
                : t(`Hide laps ${a.name}`, `Runden ${a.name} ausblenden`)
            "
            @click="toggleLaps(a)"
          />
          <q-markup-table
            v-if="!hideLaps.has(a.id) && a.laps.length > 0"
            dense
            flat
            separator="horizontal"
          >
            <thead>
              <tr>
                <th scope="col">
                  #
                </th>
                <th scope="col">
                  {{ t("Lap", "Runde") }}
                </th>
                <th scope="col">
                  {{ t("Split", "Zwischenzeit") }}
                </th>
                <th
                  scope="col"
                  class="q-table--col-auto-width"
                >
                  <span class="sr-only">{{ t("Edit, delete", "Bearbeiten, löschen") }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(lap, i) in times"
                :key="i"
                class="lap-row"
                :class="lap === stats.best ? 'text-positive text-weight-bold' : ''"
                :style="{ '--bar': `${(100 * lap) / slowest}%` }"
              >
                <td class="text-center">
                  {{ i + 1 }}
                </td>
                <td class="text-center">
                  {{ fmt(lap) }}
                </td>
                <td class="text-center">
                  {{ fmt((a.laps[i] ?? 0) - (a.start ?? 0)) }}
                </td>
                <td class="q-pa-none q-table--col-auto-width">
                  <q-btn
                    type="button"
                    flat
                    round
                    dense
                    size="sm"
                    :icon="mdiPencil"
                    :aria-label="t(`Edit lap ${i + 1} of ${a.name}`, `Runde ${i + 1} von ${a.name} bearbeiten`)"
                  >
                    <q-popup-edit
                      v-slot="scope"
                      :model-value="editValue(lap)"
                      auto-save
                      @save="(v: string) => editLap(a, i, v)"
                    >
                      <!-- eslint-disable vuejs-accessibility/no-autofocus -- popup opened on purpose to edit -->
                      <q-input
                        v-model="scope.value"
                        dense
                        autofocus
                        :label="t('Lap time (m:ss)', 'Rundenzeit (m:ss)')"
                        @keyup.enter="scope.set"
                      />
                      <!-- eslint-enable vuejs-accessibility/no-autofocus -->
                    </q-popup-edit>
                  </q-btn>
                  <q-btn
                    type="button"
                    flat
                    round
                    dense
                    size="sm"
                    :icon="mdiClose"
                    :aria-label="t(`Delete lap ${i + 1} of ${a.name}`, `Runde ${i + 1} von ${a.name} löschen`)"
                    @click="sw.deleteLap(a, i)"
                  />
                </td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card>
      </div>
    </div>

    <StatsLine origin="tmr-sw" />
  </q-page>
</template>

<style scoped>
.running {
  border-color: var(--q-positive);
}
.lap-btn {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 110px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-variant-numeric: tabular-nums;
  text-align: left;
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
}
.lap-row {
  /* bar over the whole row width, relative to the slowest lap */
  --bar-color: color-mix(in srgb, currentcolor 40%, transparent);
  background: linear-gradient(to right, var(--bar-color) var(--bar), transparent var(--bar)) bottom /
    100% 4px no-repeat;
}
.current {
  /* shrink on narrow 2-column phones so h:mm:ss.t fits */
  font-size: clamp(1.5rem, 7vw, 2.2rem);
  font-weight: 700;
  text-align: center;
}
</style>
