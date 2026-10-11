<script setup lang="ts">
import type { QInput } from "quasar"
import { nextTick, ref, useTemplateRef, watch } from "vue"

import { t } from "@/shared/i18n"
import { parseDecimal } from "@/shared/time"

import { iconTarget } from "./icons"

interface Props {
  target?: number
  collapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  target: 0,
})

const emit = defineEmits<{
  setTarget: [target: number]
}>()

const inputTarget = ref("")
watch(
  () => props.target,
  (value) => {
    inputTarget.value = String(value)
  },
  { immediate: true },
)
const editing = ref(false)
const inputRef = useTemplateRef<QInput>("inputRef")

async function startEditing() {
  inputTarget.value = props.target.toString()
  editing.value = true
  await nextTick()
  inputRef.value?.focus()
}

function selectAll(e: Event) {
  ;(e.target as HTMLInputElement).select()
}

// moving focus blurs this input, which commits the target
function focusItems() {
  const items = document.getElementById("input-items")
  if (items == null) enterTarget()
  else items.focus()
}

function enterTarget() {
  editing.value = false
  const targetNew = parseDecimal(inputTarget.value)
  if (targetNew == null || targetNew < 0) {
    inputTarget.value = ""
    return
  }
  if (targetNew !== props.target) {
    emit("setTarget", targetNew)
  }
}
</script>

<template>
  <q-chip
    v-if="collapsed && !editing"
    id="btn-edit-target"
    clickable
    outline
    size="lg"
    :icon="iconTarget"
    :aria-label="t('Edit target', 'Ziel bearbeiten')"
    @click="startEditing"
  >
    {{ target }}
  </q-chip>
  <q-input
    v-else
    ref="inputRef"
    v-model="inputTarget"
    for="input-target"
    placeholder="0"
    :label="t('Target', 'Ziel')"
    stack-label
    type="text"
    inputmode="decimal"
    enterkeyhint="done"
    autocomplete="off"
    input-class="text-h6"
    outlined
    @focus="selectAll"
    @blur="enterTarget"
    @keyup.enter="focusItems"
  >
    <template #prepend>
      <q-icon :name="iconTarget" />
    </template>
  </q-input>
</template>
