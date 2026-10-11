<script setup lang="ts">
import { computed } from "vue"

import { t } from "@/shared/i18n"

import { UNIT_SECONDS, type Unit } from "@/shared/time"

import { helperValueToString, unitLabel } from "./helper"

interface Props {
  ips: number
  unit?: Unit
}

const props = withDefaults(defineProps<Props>(), {
  unit: "min",
})

const ipsInUnit = (unit: Unit): string =>
  helperValueToString(Math.abs(props.ips * UNIT_SECONDS[unit]))

function minPerItem(ips: number): string {
  return helperValueToString(Math.abs(1 / (60 * ips)))
}

const speedInUnit = computed(() => ipsInUnit(props.unit))
</script>

<template>
  {{ speedInUnit }}
  <q-tooltip>
    {{ ipsInUnit('sec') }} / {{ unitLabel('sec') }}<br />
    {{ ipsInUnit('min') }} / {{ unitLabel('min') }}<br />
    {{ minPerItem(props.ips) }} {{ unitLabel('min') }}/{{ t('item', 'Wert') }}<br />
    {{ ipsInUnit('hour') }} / {{ unitLabel('hour') }}<br />
    {{ ipsInUnit('day') }} / {{ unitLabel('day') }}
  </q-tooltip>
</template>
