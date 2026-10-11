<script setup lang="ts">
import { mdiClose, mdiRestart } from "@quasar/extras/mdi-v7"
import { ref, useTemplateRef } from "vue"
import { lang, t } from "@/shared/i18n"
import StatsLine from "@/shared/StatsLine.vue"
import { formatDateTime, secondsToString } from "@/shared/time"

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
      class="row q-col-gutter-sm items-start"
      @submit.prevent="submit"
    >
      <q-input
        v-model="inputName"
        for="input-name"
        class="col-12 col-sm-5"
        label="Name"
        outlined
        autocomplete="off"
        @keydown.enter.prevent="timeField?.focus()"
      />
      <q-input
        ref="timeField"
        v-model="inputTime"
        for="input-time"
        class="col-8 col-sm-5"
        :label="t('Time', 'Zeit')"
        inputmode="decimal"
        outlined
        autocomplete="off"
        @blur="submit"
      />
      <div class="col-4 col-sm-2">
        <q-btn
          type="submit"
          color="primary"
          :label="t('Add', 'Hinzufügen')"
          class="full-width"
          style="height: 56px"
        />
      </div>
    </form>
    <p
      v-if="lang === 'de'"
      class="text-caption text-grey-7 q-my-none"
    >
      Zeit in Minuten. Einheit <code>s</code>, <code>m</code>, <code>h</code> oder <code>d</code>
      anhängen: <code>90s</code>, <code>1.5h</code>, <code>2d</code>. Oder <code>1:30</code> für 1
      min 30 s.
    </p>
    <p
      v-else
      class="text-caption text-grey-7 q-my-none"
    >
      Time in minutes. Add a unit <code>s</code>, <code>m</code>, <code>h</code> or <code>d</code>:
      <code>90s</code>, <code>1.5h</code>, <code>2d</code>. Or <code>1:30</code> for 1 min 30 s.
    </p>

    <div v-if="recent.length > 0">
      <q-chip
        v-for="label in recent"
        :key="label"
        clickable
        removable
        color="blue-1"
        text-color="blue-10"
        :remove-aria-label="t(`Remove ${label}`, `${label} entfernen`)"
        @click="addFromRecent(label)"
        @remove="recent = recent.filter((l) => l !== label)"
      >
        {{ label }}
      </q-chip>
    </div>

    <q-list
      v-if="timers.length > 0"
      bordered
      separator
      class="rounded-borders"
    >
      <q-item>
        <q-item-section class="text-weight-bold">
          Timers
        </q-item-section>
        <q-item-section side>
          <div class="row no-wrap">
            <q-btn
              id="btn-resetAll"
              type="button"
              flat
              round
              :icon="mdiRestart"
              :aria-label="t('Reset all timers', 'Alle Timer zurücksetzen')"
              @click="resetAll"
            />
            <q-btn
              id="btn-deleteAll"
              type="button"
              flat
              round
              :icon="mdiClose"
              :aria-label="t('Delete all timers', 'Alle Timer löschen')"
              @click="timers = []"
            />
          </div>
        </q-item-section>
      </q-item>
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
      origin="eta-mt"
      :what="t('timers', 'Timer')"
    />
  </q-page>
</template>
