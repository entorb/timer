<script setup lang="ts">
import { mdiClose, mdiPlus, mdiRestart } from "@quasar/extras/mdi-v7"
import { ref, useTemplateRef } from "vue"
import DeleteAllButton from "@/shared/DeleteAllButton.vue"
import { lang, t } from "@/shared/i18n"
import StatsLine from "@/shared/StatsLine.vue"
import { formatDateTime, secondsToString } from "@/shared/time"
import { ORIGIN } from "./timers"

import { useMultiTimer } from "./useMultiTimer"

const { timers, sorted, recent, addFromInput, addFromRecent, reset, remove } = useMultiTimer()

const inputName = ref("")
const inputTime = ref("")
const timeField = useTemplateRef<{ focus: () => void }>("timeField")

function submit() {
  if (addFromInput(inputName.value, inputTime.value)) inputName.value = ""
  inputTime.value = ""
}


function resetAll() {
  for (const timer of timers.value) reset(timer)
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
        @keydown.enter.prevent="timeField?.focus()"
      />
      <q-input
        ref="timeField"
        v-model="inputTime"
        for="input-time"
        class="col-4"
        :label="t('Time', 'Zeit')"
        inputmode="decimal"
        outlined
        dense
        autocomplete="off"
        @blur="submit"
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
    <p
      v-if="lang === 'de'"
      class="text-caption text-grey-7 q-my-none text-center"
    >
      Zeit in Minuten. Einheit <code>s</code>, <code>m</code>, <code>h</code> oder <code>d</code>
      anhängen: <code>90s</code>, <code>1.5h</code>, <code>2d</code>. Oder <code>1:30</code> für 1
      min 30 s.
    </p>
    <p
      v-else
      class="text-caption text-grey-7 q-my-none text-center"
    >
      Time in minutes. Add a unit <code>s</code>, <code>m</code>, <code>h</code> or <code>d</code>:
      <code>90s</code>, <code>1.5h</code>, <code>2d</code>. Or <code>1:30</code> for 1 min 30 s.
    </p>

    <div
      v-if="recent.length > 0"
      class="row justify-center"
    >
      <q-chip
        v-for="label in recent"
        :key="label"
        clickable
        removable
        outline
        color="primary"
        :remove-aria-label="t(`Remove ${label}`, `${label} entfernen`)"
        @click="addFromRecent(label)"
        @remove="recent = recent.filter((l) => l !== label)"
      >
        {{ label }}
      </q-chip>
    </div>

    <div
      v-if="timers.length > 0"
      class="row q-gutter-sm justify-center"
    >
      <q-btn
        id="btn-resetAll"
        type="button"
        flat
        round
        :icon="mdiRestart"
        :aria-label="t('Reset all timers', 'Alle Timer zurücksetzen')"
        @click="resetAll"
      />
      <DeleteAllButton
        :label="t('Delete all timers', 'Alle Timer löschen')"
        @confirmed="timers = []"
      />
    </div>

    <q-list
      v-if="timers.length > 0"
      bordered
      separator
      class="rounded-borders"
    >
      <q-item
        v-for="({ timer, remaining, percent }, index) in sorted"
        :key="index"
      >
        <q-item-section>
          <q-item-label class="row justify-between">
            <span class="text-weight-medium">{{ timer.name }}</span>
            <span class="text-grey-7">{{ formatDateTime(timer.dateEnd) }}</span>
          </q-item-label>
          <q-linear-progress
            :value="percent"
            instant-feedback
            size="28px"
            :color="percent >= 1 ? 'positive' : 'amber'"
            class="q-mt-xs rounded-borders"
          >
            <div class="absolute-full flex flex-center text-subtitle1 text-weight-bold text-black">
              {{ secondsToString(remaining) }}
            </div>
          </q-linear-progress>
        </q-item-section>
        <q-item-section side>
          <div class="row no-wrap">
            <q-btn
              type="button"
              flat
              round
              :icon="mdiRestart"
              :aria-label="t('Reset timer', 'Timer zurücksetzen')"
              @click="reset(timer)"
            />
            <q-btn
              :id="`btn-del-row-${index}`"
              type="button"
              flat
              round
              :icon="mdiClose"
              :aria-label="t('Delete timer', 'Timer löschen')"
              @click="remove(timer)"
            />
          </div>
        </q-item-section>
      </q-item>
    </q-list>

    <StatsLine
      :origin="ORIGIN"
    />
  </q-page>
</template>
