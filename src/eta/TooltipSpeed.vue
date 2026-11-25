<script setup lang="ts">
import { computed } from "vue"

import { t } from "@/shared/i18n.ts"

import type { Unit } from "@/shared/time.ts"

import { helperValueToString, type SpeedUnit, speedInUnit as speedValue, unitLabel } from "./helper.ts"

interface Props {
  ips: number
  unit?: SpeedUnit
}

const props = withDefaults(defineProps<Props>(), {
  unit: "min",
})

const ipsInUnit = (unit: Unit): string => helperValueToString(Math.abs(speedValue(props.ips, unit)))

const minPerItem = (): string => helperValueToString(Math.abs(speedValue(props.ips, "minPerItem")))

const speedInUnit = computed(() => helperValueToString(Math.abs(speedValue(props.ips, props.unit))))
</script>

<template>
  {{ speedInUnit }}
  <q-tooltip>
    {{ ipsInUnit('sec') }} / {{ unitLabel('sec') }}<br />
    {{ ipsInUnit('min') }} / {{ unitLabel('min') }}<br />
    {{ minPerItem() }} {{ unitLabel('min') }}/{{ t('item', 'Wert') }}<br />
    {{ ipsInUnit('hour') }} / {{ unitLabel('hour') }}<br />
    {{ ipsInUnit('day') }} / {{ unitLabel('day') }}
  </q-tooltip>
</template>
