<script setup lang="ts">
import { onMounted, ref } from "vue"
import { t } from "./i18n"
import type { StatsDataType } from "./stats"
import { statsRead } from "./stats"


const props = defineProps<{ origin: string }>()

const stats = ref<StatsDataType>()

onMounted(async () => {
  stats.value = await statsRead(props.origin)
})
</script>

<template>
  <div class="text-center text-grey q-mt-lg">
    <template v-if="stats">
      {{
        t(
          `${stats.accesscounts7} last week, ${stats.accesscounts} in total`,
          `${stats.accesscounts7} letzte Woche, ${stats.accesscounts} insgesamt`,
        )
      }}
    </template>
  </div>
</template>
