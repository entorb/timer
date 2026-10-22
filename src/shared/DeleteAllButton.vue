<script setup lang="ts">
import { mdiClose } from "@quasar/extras/mdi-v7"
import { confirmDialog } from "./confirm"
import { t } from "./i18n"

// round "x" button, confirms before emitting `confirmed`
defineProps<{ label: string }>()
const emit = defineEmits<{ confirmed: [] }>()
</script>

<template>
  <q-btn
    id="btn-deleteAll"
    type="button"
    flat
    round
    color="negative"
    :icon="mdiClose"
    :aria-label="label"
    @click="confirmDialog(t('Delete all?', 'Alle löschen?'), () => emit('confirmed'))"
  />
</template>
