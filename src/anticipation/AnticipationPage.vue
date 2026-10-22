<script setup lang="ts">
import { mdiClose, mdiPlus } from "@quasar/extras/mdi-v7"
import { ref } from "vue"
import { confirmDialog } from "@/shared/confirm"
import DeleteAllButton from "@/shared/DeleteAllButton.vue"
import { t } from "@/shared/i18n"
import StatsLine from "@/shared/StatsLine.vue"
import { formatDateTime, isoDay, secondsToString } from "@/shared/time"

import { ORIGIN } from "./anticipation"
import { topLabel, useAnticipation } from "./useAnticipation"

const { events, sorted, add, remove } = useAnticipation()

const inputName = ref("")
const inputDate = ref(isoDay(new Date()))
const inputTime = ref("")

function submit() {
  if (add(inputName.value, inputDate.value, inputTime.value)) {
    inputName.value = ""
    inputDate.value = isoDay(new Date())
    inputTime.value = ""
  }
}

</script>

<template>
  <q-page
    padding
    class="column page-gap"
  >
    <form
      class="row q-col-gutter-sm items-center no-wrap"
      @submit.prevent="submit"
    >
      <q-input
        v-model="inputName"
        for="input-name"
        class="col"
        label="Name"
        outlined
        dense
        autocomplete="off"
      />
      <q-input
        v-model="inputDate"
        for="input-date"
        class="col-4"
        type="date"
        :label="t('Date', 'Datum')"
        stack-label
        outlined
        dense
      />
      <q-input
        v-model="inputTime"
        for="input-time"
        class="col-3"
        :label="t('Time', 'Uhrzeit')"
        placeholder="14:00"
        inputmode="decimal"
        autocomplete="off"
        outlined
        dense
      />
      <div class="col-auto">
        <q-btn
          type="submit"
          color="primary"
          unelevated
          :icon="mdiPlus"
          :aria-label="t('Add', 'Hinzufügen')"
        />
      </div>
    </form>

    <div
      v-if="events.length > 0"
      class="row justify-center"
    >
      <DeleteAllButton
        :label="t('Delete all events', 'Alle Ereignisse löschen')"
        @confirmed="events = []"
      />
    </div>

    <q-list
      v-if="events.length > 0"
      bordered
      separator
      class="rounded-borders"
    >
      <q-item
        v-for="({ event, seconds, days, past }, index) in sorted"
        :key="index"
      >
        <q-item-section>
          <q-item-label class="row justify-between text-h6">
            <span>{{ event.name }}</span>
            <span :class="{ 'text-positive': past }">{{ topLabel(seconds, days, past) }}</span>
          </q-item-label>
          <q-item-label class="row justify-between text-grey-7">
            <span>{{ formatDateTime(event.date, true) }}</span>
            <span>{{ secondsToString(seconds) }}</span>
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn
            :id="`btn-del-row-${index}`"
            type="button"
            flat
            round
            :icon="mdiClose"
            :aria-label="t('Delete event', 'Ereignis löschen')"
            @click="confirmDialog(t(`Delete ${event.name}?`, `${event.name} löschen?`), () => remove(event))"
          />
        </q-item-section>
      </q-item>
    </q-list>

    <StatsLine :origin="ORIGIN" />
  </q-page>
</template>
