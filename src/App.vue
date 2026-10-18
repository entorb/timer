<script setup lang="ts">
import { mdiHome, mdiInformationOutline, mdiShareVariant, mdiThemeLightDark } from "@quasar/extras/mdi-v7"
import { copyToClipboard, useQuasar } from "quasar"
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

/* c8 ignore next 10 */
async function shareApp() {
  const url = location.origin + import.meta.env.BASE_URL
  if (navigator.share != null) {
    await navigator.share({ title: "TIMER", url }).catch(() => undefined)
    return
  }
  await copyToClipboard(url)
  $q.notify({ message: t("Link copied", "Link kopiert"), timeout: 1500 })
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
              v-close-popup
              clickable
              to="/"
              exact
              active-class="text-primary"
            >
              <q-item-section avatar>
                <q-icon :name="mdiHome" />
              </q-item-section>
              <q-item-section>{{ t("Home", "Start") }}</q-item-section>
            </q-item>
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
          <span class="text-primary">Timer Apps - Info</span>
        </q-card-section>
        <q-card-section class="q-pt-none">
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
              Nutzungsstatistiken erfasst. Für das (optionale) Wetter wird der freigegebene Standort gerundet
              (~10 km) an
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noopener noreferrer"
              >Open-Meteo.com</a>
              gesendet, von dort stammen die Wetterdaten.
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
              on the server. For the (optional) weather, the shared location is sent rounded (~10 km) to
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noopener noreferrer"
              >Open-Meteo.com</a>, which provides the weather data.
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
            type="button"
            flat
            :icon="mdiShareVariant"
            :label="t('Share app', 'App teilen')"
            @click="shareApp"
          />
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
