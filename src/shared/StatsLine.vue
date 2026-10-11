<script setup lang="ts">
import { onMounted, ref } from "vue"
import { t } from "./i18n"
import type { StatsDataType } from "./stats"
import { statsRead } from "./stats"


const props = defineProps<{ origin: string; what: string }>()

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
          `${stats.accesscounts7} ${what} in the last 7 days, ${stats.accesscounts} in total since ${stats.firstaccess}.`,
          `${stats.accesscounts7} ${what} in den letzten 7 Tagen, ${stats.accesscounts} insgesamt seit ${stats.firstaccess}.`,
        )
      }}
    </template>
  </div>
</template>
