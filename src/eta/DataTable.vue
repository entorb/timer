<script setup lang="ts">
import { ref } from "vue"
import { t } from "@/shared/i18n"
import { formatDateTime, parseDecimal, type Unit } from "@/shared/time"

import { colorItems, colorSpeed } from "./colors"
import { helperDateToIsoString } from "./helper"
import { iconEdit, iconItems, iconSave, iconSpeed, iconTimeLastInput, iconTrash } from "./icons"
import TooltipSpeed from "./TooltipSpeed.vue"
import type { DataRowRedType, DataRowType } from "./types"

interface Props {
  data: DataRowType[]
  showDays: boolean
  unitSpeed: Unit
}

const props = defineProps<Props>()

const emit = defineEmits<{
  deleteRow: [index: number]
  updateRow: [index: number, row: DataRowRedType]
}>()

const showEditDialog = ref(false)
const dialogData = ref({
  id: 0,
  items: "0",
  localDateString: helperDateToIsoString(new Date()),
})

function openEditDialog(index: number): void {
  dialogData.value.id = index
  dialogData.value.items = String(props.data[index]?.items ?? "")
  dialogData.value.localDateString = helperDateToIsoString(props.data[index]?.date ?? new Date())
  showEditDialog.value = true
}

function save(): void {
  const date = new Date(dialogData.value.localDateString)
  const items = parseDecimal(String(dialogData.value.items))
  if (items == null || Number.isNaN(date.getTime())) return
  showEditDialog.value = false
  emit("updateRow", dialogData.value.id, { date, items })
}
</script>

<template>
  <q-markup-table
    dense
    flat
    bordered
    separator="horizontal"
  >
    <thead>
      <tr>
        <th scope="col">
          <q-icon
            :name="iconTimeLastInput"
            size="sm"
          />
        </th>
        <th scope="col">
          <q-icon
            :name="iconItems"
            size="sm"
          />
        </th>
        <th scope="col">
          <q-icon
            :name="iconSpeed"
            size="sm"
          />
        </th>
        <th scope="col">
          <span class="sr-only">{{ t("Actions", "Aktionen") }}</span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(item, index) in props.data"
        :key="index"
      >
        <td class="text-center">
          {{ formatDateTime(item.date, showDays) }}
        </td>
        <td
          class="text-center text-weight-bold"
          :style="{ color: colorItems }"
        >
          {{ item.items }}
        </td>
        <td
          class="text-center text-weight-bold"
          :style="{ color: colorSpeed }"
        >
          <span>
            <TooltipSpeed
              :ips="item.speed"
              :unit="unitSpeed"
            />
          </span>
        </td>
        <td class="text-center">
          <q-btn
            :id="`btn-edit-row-${index}`"
            type="button"
            flat
            round
            dense
            :icon="iconEdit"
            :aria-label="t('Edit row', 'Zeile bearbeiten')"
            @click="openEditDialog(index)"
          />
          <q-btn
            :id="`btn-del-row-${index}`"
            type="button"
            flat
            round
            dense
            :icon="iconTrash"
            :aria-label="t('Delete row', 'Zeile löschen')"
            @click="emit('deleteRow', index)"
          />
        </td>
      </tr>
    </tbody>
  </q-markup-table>

  <q-dialog v-model="showEditDialog">
    <q-card style="min-width: 300px">
      <q-card-section class="text-h6">
        {{ t("Edit", "Bearbeiten") }}
      </q-card-section>
      <q-card-section class="q-gutter-md">
        <!-- using browser datetime-local input, step="1" for display of seconds -->
        <q-input
          v-model="dialogData.localDateString"
          type="datetime-local"
          step="1"
          :label="t('Time', 'Zeit')"
          outlined
        />
        <q-input
          v-model="dialogData.items"
          for="edit-items"
          :label="t('Value', 'Wert')"
          type="text"
          inputmode="decimal"
          outlined
          @keyup.enter="save()"
        >
          <template #prepend>
            <q-icon
              :name="iconItems"
              :style="{ color: colorItems }"
            />
          </template>
        </q-input>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          type="button"
          flat
          :label="t('Cancel', 'Abbrechen')"
          @click="showEditDialog = false"
        />
        <q-btn
          id="btn-dialog-save"
          type="button"
          color="primary"
          :icon="iconSave"
          :label="t('Save', 'Speichern')"
          @click="save()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
