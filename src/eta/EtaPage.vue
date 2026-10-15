<script setup lang="ts">
import { defineAsyncComponent, ref } from "vue"
import { confirmDialog } from "@/shared/confirm"
import { lang, t } from "@/shared/i18n"
import StatsLine from "@/shared/StatsLine.vue"

import DataTable from "./DataTable.vue"
import EtaHero from "./EtaHero.vue"
import InputItems from "./InputItems.vue"
import InputTarget from "./InputTarget.vue"
import { iconChart, iconClose, iconHistory, iconInfo, iconWeight } from "./icons"
import { useEtaData } from "./useEtaData"
import { useEtaStats } from "./useEtaStats"

const EtaChart = defineAsyncComponent(() => import("./EtaChart.vue"))

const {
  target,
  data,
  rows,
  settings,
  current,
  hasData,
  hasMultipleRows,
  showDays,
  addRow,
  updateRow,
  deleteRow,
  deleteAll,
  incrementByOne,
} = useEtaData()

const { stats, est } = useEtaStats(data, target, () => settings.value.weightedReg)

// mount chart only when open, echarts needs a visible element
const chartOpen = ref(true)

function confirmDeleteAll() {
  confirmDialog(t("Reset all?", "Alles zurücksetzen?"), deleteAll)
}
</script>

<template>
  <q-page
    padding
    class="column items-center page-gap"
  >
    <h1
      v-if="!hasData"
      id="eta-title"
      class="text-h5 text-center q-my-none"
    >
      {{ t("ETA - Estimated Time of Arrival", "ETA - Estimated Time of Arrival (Restzeitschätzung)") }}
    </h1>
    <div class="eta-col row items-center no-wrap">
      <InputTarget
        :target="target"
        :collapsed="hasData"
        :class="hasData ? 'col-auto q-mr-auto' : 'col'"
        @set-target="target = $event"
      />
      <q-btn
        v-if="hasData"
        id="btn-del-all"
        type="button"
        flat
        round
        color="negative"
        :icon="iconClose"
        :aria-label="t('Reset all data', 'Alle Daten zurücksetzen')"
        @click="confirmDeleteAll"
      />
    </div>

    <q-banner
      v-if="!hasMultipleRows"
      id="eta-intro"
      class="bg-blue-1 text-blue-10 eta-col"
      rounded
    >
      <template #avatar>
        <q-icon
          :name="iconInfo"
          color="primary"
        />
      </template>
      <template v-if="!hasData && lang === 'de'">
        <div class="text-subtitle1 text-weight-medium">
          Wie lange noch?
        </div>
        <ol class="q-pl-md q-my-xs">
          <li>Setze ein <b>Ziel</b>, oder lass 0 zum Herunterzählen</li>
          <li>Gib deinen <b>aktuellen Wert</b> ein</li>
          <li>Gib ihn erneut ein, sobald er sich ändert</li>
        </ol>
        <div class="text-caption">
          ETA erscheint nach dem zweiten Wert.
        </div>
      </template>
      <template v-else-if="!hasData">
        <div class="text-subtitle1 text-weight-medium">
          How much longer?
        </div>
        <ol class="q-pl-md q-my-xs">
          <li>Set a <b>target</b>, or leave 0 to count down</li>
          <li>Enter your <b>current value</b></li>
          <li>Enter it again whenever it changes</li>
        </ol>
        <div class="text-caption">
          ETA appears after the second value.
        </div>
      </template>
      <template v-else>
        {{
          t(
            "Enter the next value when it changes, ETA appears after the second value.",
            "Gib den nächsten Wert ein, sobald er sich ändert, ETA erscheint nach dem zweiten Wert.",
          )
        }}
      </template>
    </q-banner>

    <EtaHero
      v-if="stats != null && est != null"
      :stats="stats"
      :est="est"
      :unit-speed="settings.unitSpeed"
      :show-days="showDays"
      @set-unit="settings.unitSpeed = $event"
    />

    <div class="eta-col column q-gutter-y-sm">
      <InputItems
        :current-items="current"
        @add-row="addRow"
      />
      <q-btn
        v-if="hasData"
        id="btn-plus-1"
        type="button"
        unelevated
        color="primary"
        size="lg"
        style="min-height: 56px"
        :label="target === 0 ? '−1' : '+1'"
        :aria-label="target === 0 ? t('Subtract one', 'Eins abziehen') : t('Add one', 'Eins addieren')"
        @click="incrementByOne"
      />
    </div>

    <q-list
      v-if="hasData"
      bordered
      class="eta-col rounded-borders"
    >
      <q-expansion-item
        id="exp-history"
        default-opened
      >
        <template #header>
          <q-item-section avatar>
            <q-icon :name="iconHistory" />
          </q-item-section>
          <q-item-section>
            {{ t("History", "Verlauf") }}
          </q-item-section>
          <q-item-section side>
            <div class="row no-wrap">
              <q-btn
                id="btn-weighted"
                type="button"
                flat
                round
                dense
                :color="settings.weightedReg ? 'primary' : 'grey-5'"
                :icon="iconWeight"
                :aria-label="t('Toggle weighted regression', 'Gewichtete Regression umschalten')"
                @click.stop="settings.weightedReg = !settings.weightedReg"
              >
                <q-tooltip>{{ t("Weighted Lin. Regression", "Gewichtete lin. Regression") }}</q-tooltip>
              </q-btn>
            </div>
          </q-item-section>
        </template>
        <DataTable
          :data="rows"
          :show-days="showDays"
          :unit-speed="settings.unitSpeed"
          @delete-row="deleteRow"
          @update-row="updateRow"
        />
      </q-expansion-item>
      <q-expansion-item
        v-if="hasMultipleRows"
        id="exp-chart"
        v-model="chartOpen"
        :icon="iconChart"
        :label="t('Chart', 'Diagramm')"
      >
        <EtaChart
          v-if="chartOpen"
          :data="rows"
          :unit-speed="settings.unitSpeed"
          :target="target"
          :ips="stats?.ips ?? 0"
        />
      </q-expansion-item>
    </q-list>

    <StatsLine
      origin="tmr-eta"
    />
  </q-page>
</template>

<style scoped>
.eta-col {
  width: 100%;
  max-width: 480px;
}
</style>
