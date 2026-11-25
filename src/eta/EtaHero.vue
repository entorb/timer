<script setup lang="ts">
import { computed } from "vue"
import { t } from "@/shared/i18n.ts"
import ProgressRing from "@/shared/ProgressRing.vue"

import { formatDateTime, secondsToString, UNIT_SECONDS } from "@/shared/time.ts"

import { type SpeedUnit, speedUnitLabel } from "./helper.ts"
import { iconEta, iconSave, iconSpeed, iconTimeLastInput, iconTimeRunning } from "./icons.ts"
import { type EtaEstimate, type EtaStats, progress } from "./stats.ts"
import TooltipSpeed from "./TooltipSpeed.vue"

interface Props {
  stats: EtaStats
  est: EtaEstimate
  unitSpeed: SpeedUnit
  showDays: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  setUnit: [unit: SpeedUnit]
}>()

const units: SpeedUnit[] = ["sec", "min", "hour", "day", "minPerItem"]

const measured = computed(() => progress(props.stats.itemsDone, props.stats.itemsTotal))
const pctMeasured = computed(() => Math.round(100 * measured.value))
const pctEstimated = computed(() => Math.round(100 * props.est.percent) - pctMeasured.value)

function etaToString(): string {
  return formatDateTime(
    new Date(props.stats.etaMs),
    props.showDays || props.est.secToEta >= UNIT_SECONDS.day,
  )
}
</script>

<template>
  <div class="column items-center q-gutter-y-sm">
    <!-- estimated progress (amber) behind measured progress (green) -->
    <ProgressRing
      :value="measured"
      color="positive"
      :under="est.percent"
      under-color="amber"
      :label="t('Measured progress', 'Gemessener Fortschritt')"
      :under-label="t('Estimated progress', 'Geschätzter Fortschritt')"
    >
      <div class="column items-center q-gutter-y-sm">
        <q-icon
          v-if="est.reached"
          :name="iconSave"
          color="positive"
          size="96px"
          :aria-label="t('Target reached', 'Ziel erreicht')"
        />
        <template v-else-if="stats.etaMs > 0">
          <span
            class="text-h6"
          >
            <q-icon
              :name="iconEta"
              aria-label="ETA"
            />
            {{ etaToString() }}
          </span>
          <span
            id="eta-remaining"
            class="eta-big"
          >{{ secondsToString(est.secToEta) }}</span>
        </template>
        <span class="text-h6">
          <span class="text-positive">{{ pctMeasured }} %</span>
          <span
            v-if="pctEstimated > 0"
            class="text-amber-8"
          > + {{ pctEstimated }} %</span>
        </span>
      </div>
    </ProgressRing>

    <div class="row justify-center items-center q-gutter-xs">
      <q-btn-dropdown
        v-if="stats.ips !== 0"
        id="btn-unit"
        flat
        dense
        no-caps
        :icon="iconSpeed"
        :aria-label="t('Speed unit', 'Einheit Geschwindigkeit')"
      >
        <template #label>
          <span class="q-ml-sm">
            <TooltipSpeed
              :ips="stats.ips"
              :unit="unitSpeed"
            />{{ speedUnitLabel(unitSpeed) }}
          </span>
        </template>
        <q-list dense>
          <q-item
            v-for="unit in units"
            :key="unit"
            v-close-popup
            clickable
            :active="unit === unitSpeed"
            @click="emit('setUnit', unit)"
          >
            <q-item-section>{{ speedUnitLabel(unit) }}</q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
      <q-chip
        :icon="iconTimeRunning"
        :aria-label="t('Elapsed', 'Vergangen')"
      >
        {{ secondsToString(est.secSinceFirst) }}
      </q-chip>
      <q-chip
        :icon="iconTimeLastInput"
        :aria-label="t('Since last input', 'Seit letzter Eingabe')"
      >
        {{ secondsToString(est.secSinceLast) }}
      </q-chip>
    </div>
  </div>
</template>

<style scoped>
.eta-big {
  font-size: 2.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
</style>
