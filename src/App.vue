<script setup lang="ts">
import { mdiInformationOutline, mdiThemeLightDark } from "@quasar/extras/mdi-v7"
import { useQuasar } from "quasar"
import { computed, ref } from "vue"
import { useRoute } from "vue-router"

import { tabs } from "./router"
import { lang, t, toggleLang } from "./shared/i18n"
import { readSettings, updateSettings } from "./shared/storage"

const $q = useQuasar()
const route = useRoute()
const showInfo = ref(false)
const currentTab = computed(() => tabs.find((tab) => tab.path === route.path))

// undefined: keep "auto"
const storedDark = readSettings().dark
if (storedDark != null) $q.dark.set(storedDark)

function toggleDark() {
  $q.dark.toggle()
  updateSettings({ dark: $q.dark.isActive })
}

const installSteps = computed(() => [
  {
    platform: "Android, Windows",
    how: t("Chrome or Edge -> Install", "Chrome oder Edge -> Installieren"),
  },
  {
    platform: "iOS",
    how: t("Safari -> Share -> Add to Home Screen", "Safari -> Teilen -> Zum Home-Bildschirm"),
  },
  {
    platform: "MacOS",
    how: t("Safari -> File -> Add to Dock", "Safari -> Ablage -> Zum Dock hinzufügen"),
  },
])
</script>

<template>
  <q-layout view="hHh lpR fff">
    <q-header elevated>
      <q-toolbar>
        <q-btn-dropdown
          id="select-feature"
          flat
          no-caps
          :label="currentTab == null ? 'Timer' : t(currentTab.name, currentTab.nameDe)"
          class="text-h6 q-mr-auto"
          :aria-label="t('Select feature', 'Funktion wählen')"
        >
          <q-list>
            <q-item
              v-for="tab in tabs"
              :key="tab.path"
              v-close-popup
              clickable
              :to="tab.path"
              active-class="text-primary"
            >
              <q-item-section avatar>
                <q-icon :name="tab.icon" />
              </q-item-section>
              <q-item-section>{{ t(tab.name, tab.nameDe) }}</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
        <q-btn
          id="btn-lang"
          type="button"
          flat
          round
          :label="lang === 'de' ? 'DE' : 'EN'"
          :aria-label="t('Switch to German', 'Auf Englisch umschalten')"
          @click="toggleLang"
        />
        <q-btn
          type="button"
          flat
          round
          :icon="mdiThemeLightDark"
          :aria-label="t('Toggle dark mode', 'Dunkelmodus umschalten')"
          @click="toggleDark"
        />
        <q-btn
          type="button"
          flat
          round
          :icon="mdiInformationOutline"
          :aria-label="t('Info', 'Info')"
          @click="showInfo = true"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <!-- keep pages alive, so timers keep running and ringing on other tabs -->
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </q-page-container>

    <q-dialog
      v-model="showInfo"
      :maximized="$q.screen.lt.sm"
    >
      <q-card style="max-width: 600px">
        <q-card-section class="text-h6">
          <span class="text-primary">T</span>I<span class="text-primary">M</span>ER
        </q-card-section>
        <q-card-section class="q-pt-none">
          <ul
            v-if="lang === 'de'"
            class="q-pl-md"
          >
            <li>
              <b>ETA</b>: von Zeit zu Zeit den aktuellen Wert (erledigt / verbleibend) eingeben, die
              Restzeit wird per (gewichteter) linearer Regression berechnet. Ziel = 0: Countdown,
              Ziel > 0: hochzählen.
            </li>
            <li><b>Multi-Timer</b>: mehrere benannte Countdowns gleichzeitig, mit Alarm.</li>
            <li><b>Stoppuhr</b>: Rundenzeiten für mehrere Läufer, gemeinsamer oder einzelner Start.</li>
            <li><b>Pomodoro</b>: 25 min Fokus, 5 min Pause, 15 min lange Pause nach 4 Runden.</li>
            <li><b>Meeting-Meter</b>: Taximeter für Meetings: Kosten und Personenstunden.</li>
          </ul>
          <ul
            v-else
            class="q-pl-md"
          >
            <li>
              <b>ETA</b>: enter the current value (items / to go) from time to time, the remaining
              time is derived via (weighted) linear regression. Target = 0: count-down, target > 0:
              count-up.
            </li>
            <li><b>Multi-Timer</b>: several named countdowns at once, with alarm.</li>
            <li><b>Stopwatch</b>: lap times for multiple athletes, common or individual start.</li>
            <li><b>Pomodoro</b>: 25 min focus, 5 min break, 15 min long break after 4 rounds.</li>
            <li><b>Meeting Meter</b>: taximeter for meetings: cost and people hours.</li>
          </ul>
          <div class="text-subtitle1">
            {{ t("Install as app", "Als App installieren") }}
          </div>
          <ul class="q-pl-md">
            <li
              v-for="step in installSteps"
              :key="step.platform"
            >
              <b>{{ step.platform }}</b>: {{ step.how }}
            </li>
          </ul>
          <template v-if="lang === 'de'">
            <p>
              Deine Daten werden nur auf deinem Gerät gespeichert. Auf dem Server werden nur anonyme
              Nutzungsstatistiken erfasst.
            </p>
            <p>
              Diese App ist kostenlos, werbefrei und
              <a
                href="https://github.com/entorb/timer"
                target="_blank"
                rel="noopener noreferrer"
              >OpenSource</a>. Wenn sie dir gefällt, teile sie
              gerne.
              <a
                href="https://entorb.net/contact.php?origin=timer"
                target="_blank"
                rel="noopener noreferrer"
              >Feedback</a>
              ist sehr willkommen.
            </p>
          </template>
          <template v-else>
            <p>
              Your data is stored only on your device. Only anonymous usage statistics are gathered
              on the server.
            </p>
            <p>
              This app is free (as of free-beer), ad-free and
              <a
                href="https://github.com/entorb/timer"
                target="_blank"
                rel="noopener noreferrer"
              >OpenSource</a>. If you like it, please
              share it.
              <a
                href="https://entorb.net/contact.php?origin=timer"
                target="_blank"
                rel="noopener noreferrer"
              >Feedback</a>
              is highly appreciated.
            </p>
          </template>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            v-close-popup
            type="button"
            flat
            :label="t('Close', 'Schließen')"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>
