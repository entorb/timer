<script setup lang="ts">
import { tabs } from "@/router"
import { t } from "@/shared/i18n"
import DayClock from "./DayClock.vue"
</script>

<template>
  <q-page
    padding
    class="column items-center page-gap"
  >
    <h1 class="text-h5 text-center q-my-none">
      {{ t("Timer Apps", "Timer Apps") }}
    </h1>
    <DayClock />
    <q-list
      bordered
      separator
      class="full-width rounded-borders"
      style="max-width: 600px"
    >
      <q-item
        v-for="tab in tabs"
        :id="`home-${tab.path.slice(1)}`"
        :key="tab.path"
        clickable
        :to="tab.path"
      >
        <q-item-section avatar>
          <q-icon
            :name="tab.icon"
            color="primary"
            size="md"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-subtitle1">
            {{ t(tab.name, tab.nameDe) }}
          </q-item-label>
          <q-item-label caption>
            {{ t(tab.desc, tab.descDe) }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>
