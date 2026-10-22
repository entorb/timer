<script setup lang="ts">
// big ring with centered slot; optional `under` ring (e.g. estimate) drawn behind `value`
interface Props {
  value: number
  color: string
  under?: number
  underColor?: string
  animationSpeed?: number
  label?: string
  underLabel?: string
}

defineProps<Props>()
defineSlots<{ default?: () => unknown }>()
</script>

<template>
  <div class="relative-position">
    <q-circular-progress
      v-if="under != null"
      :value="under"
      :min="0"
      :max="1"
      size="min(80vw, 320px)"
      :thickness="0.2"
      :color="underColor"
      track-color="grey-3"
      :animation-speed="animationSpeed"
      :aria-label="underLabel"
    />
    <q-circular-progress
      :value="value"
      :min="0"
      :max="1"
      size="min(80vw, 320px)"
      :thickness="0.2"
      :color="color"
      :track-color="under != null ? 'transparent' : 'grey-3'"
      :animation-speed="animationSpeed"
      :aria-label="label"
      show-value
      :class="under != null ? 'absolute-full' : ''"
    >
      <slot />
    </q-circular-progress>
  </div>
</template>

<style scoped>
/* Quasar sets an inline `ease`; linear keeps steady motion between 1s ticks */
:deep(.q-circular-progress__circle) {
  transition-timing-function: linear !important;
}
</style>
