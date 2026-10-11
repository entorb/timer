<script setup lang="ts">
import { ref } from "vue"

import { t } from "@/shared/i18n"
import { parseDecimal } from "@/shared/time"

import { colorItems } from "./colors"
import { iconItems, iconSave } from "./icons"
import type { DataRowRedType } from "./types"

interface Props {
  currentItems: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  addRow: [row: DataRowRedType]
}>()

const inputItems = ref("")

function enterItems() {
  const items = parseDecimal(inputItems.value)
  if (items == null) return
  emit("addRow", { date: new Date(), items })
  inputItems.value = ""
}
</script>

<template>
  <q-input
    v-model="inputItems"
    for="input-items"
    :placeholder="Number.isNaN(props.currentItems) ? undefined : String(props.currentItems)"
    :label="t('Current value', 'Aktueller Wert')"
    stack-label
    type="text"
    inputmode="decimal"
    enterkeyhint="done"
    autocomplete="off"
    input-class="text-h6"
    outlined
    @blur="enterItems"
    @keyup.enter="enterItems"
  >
    <template #prepend>
      <q-icon
        :name="iconItems"
        :style="{ color: colorItems }"
      />
    </template>
    <template #append>
      <q-btn
        type="button"
        flat
        round
        dense
        :icon="iconSave"
        :aria-label="t('Save value', 'Wert speichern')"
        @click="enterItems"
      />
    </template>
  </q-input>
</template>
