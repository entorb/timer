<script setup lang="ts">
import { computed } from "vue"
import { t } from "@/shared/i18n"

import { formatDateTime, secondsToString, type Unit } from "@/shared/time"

import { unitLabel } from "./helper"
import { iconEta, iconSave, iconSpeed, iconTimeLastInput, iconTimeRunning } from "./icons"
import { type EtaEstimate, type EtaStats, progress } from "./stats"
import TooltipSpeed from "./TooltipSpeed.vue"

interface Props {
  stats: EtaStats
  est: EtaEstimate
  unitSpeed: Unit
  showDays: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  setUnit: [unit: Unit]
}>()

const units: Unit[] = ["sec", "min", "hour", "day"]

const measured = computed(() => progress(props.stats.itemsDone, props.stats.itemsTotal))
const pctMeasured = computed(() => Math.round(100 * measured.value))
const pctEstimated = computed(() => Math.round(100 * props.est.percent) - pctMeasured.value)

function etaToString(): string {
  return formatDateTime(
    new Date(props.stats.etaMs),
    props.showDays || props.est.secToEta >= 86_400,
  )
}
</script>

<template>
  <div class="column items-center q-gutter-y-sm">
    <!-- estimated progress (amber) behind measured progress (green) -->
    <div class="eta-ring">
      <q-circular-progress
        :value="est.percent"
        :min="0"
        :max="1"
        size="240px"
        :thickness="0.1"
        color="amber"
        track-color="grey-3"
        :aria-label="t('Estimated progress', 'Geschätzter Fortschritt')"
      />
      <q-circular-progress
        :value="measured"
        :min="0"
        :max="1"
        size="240px"
        :thickness="0.1"
        color="positive"
        track-color="transparent"
        show-value
        class="absolute-full"
        :aria-label="t('Measured progress', 'Gemessener Fortschritt')"
      >
        <div class="column items-center">
          <q-icon
            v-if="est.reached"
            :name="iconSave"
            color="positive"
            size="96px"
            :aria-label="t('Target reached', 'Ziel erreicht')"
          />
          <template v-else-if="stats.etaMs > 0">
            <span
              class="text-subtitle1"
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
          <span class="text-subtitle1">
            <span class="text-positive">{{ pctMeasured }} %</span>
            <span
              v-if="pctEstimated > 0"
              class="text-amber-8"
            > + {{ pctEstimated }} %</span>
          </span>
        </div>
      </q-circular-progress>
    </div>

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
          <TooltipSpeed
            :ips="stats.ips"
            :unit="unitSpeed"
          />/{{ unitLabel(unitSpeed) }}
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
            <q-item-section>/{{ unitLabel(unit) }}</q-item-section>
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
.eta-ring {
  position: relative;
}
.eta-big {
  font-size: 2.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
</style>
