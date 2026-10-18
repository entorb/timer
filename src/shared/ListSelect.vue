<script setup lang="ts">
import { mdiDelete, mdiPencil, mdiPlus } from "@quasar/extras/mdi-v7"
import { computed } from "vue"
import { confirmDialog } from "@/shared/confirm"
import { t } from "@/shared/i18n"

// select one of several named items: switch, rename, add, delete
interface Props {
  items: Array<{ id: string; name: string }>
  label: string
  disable?: boolean
  dense?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{ add: []; remove: []; rename: [name: string] }>()
const selectedId = defineModel<string>({ required: true })
const options = computed(() => props.items.map((i) => ({ label: i.name, value: i.id })))
const name = computed(() => props.items.find((i) => i.id === selectedId.value)?.name ?? props.items[0]?.name ?? "")

function confirmRemove() {
  confirmDialog(t(`Delete "${name.value}"?`, `"${name.value}" löschen?`), () => emit("remove"))
}
</script>

<template>
  <div class="row no-wrap items-center full-width">
    <q-select
      v-model="selectedId"
      :options="options"
      emit-value
      map-options
      outlined
      :dense="dense"
      :disable="disable"
      :label="label"
      class="col"
    >
      <template #selected-item="{ opt }">
        <span :class="dense ? '' : 'text-h6 text-weight-bold'">{{ opt.label }}</span>
      </template>
    </q-select>
    <q-btn
      type="button"
      flat
      round
      :dense="dense"
      :icon="mdiPencil"
      :disable="disable"
      :aria-label="`${t('Rename', 'Umbenennen')}: ${label}`"
    >
      <q-popup-edit
        v-slot="scope"
        :model-value="name"
        auto-save
        @update:model-value="emit('rename', $event)"
      >
        <q-input
          v-model="scope.value"
          label="Name"
          dense
          @keyup.enter="scope.set"
        />
      </q-popup-edit>
    </q-btn>
    <q-btn
      type="button"
      flat
      round
      :dense="dense"
      :icon="mdiPlus"
      :disable="disable"
      :aria-label="`${t('Add', 'Hinzufügen')}: ${label}`"
      @click="emit('add')"
    />
    <q-btn
      type="button"
      flat
      round
      :dense="dense"
      :icon="mdiDelete"
      :disable="disable || items.length <= 1"
      :aria-label="`${t('Delete', 'Löschen')}: ${label}`"
      @click="confirmRemove"
    />
  </div>
</template>
