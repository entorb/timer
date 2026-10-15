import { Lang } from "quasar"
import langDe from "quasar/lang/de-DE"
import langEn from "quasar/lang/en-US"
import { ref, watchEffect } from "vue"
import { readSettings, updateSettings } from "./storage"

export type LangType = "en" | "de"

function initialLang(): LangType {
  const stored = readSettings().lang
  if (stored === "en" || stored === "de") return stored
  return navigator.language.toLowerCase().startsWith("de") ? "de" : "en"
}

export const lang = ref<LangType>(initialLang())

watchEffect(() => {
  // cast: quasar lang pack types mismatch Lang.set signature (formatNumber)
  Lang.set((lang.value === "de" ? langDe : langEn) as Parameters<typeof Lang.set>[0])
  document.documentElement.lang = lang.value
})

export function toggleLang() {
  lang.value = lang.value === "de" ? "en" : "de"
  updateSettings({ lang: lang.value })
}

// inline translation: reactive when called in templates / computed
export const t = (en: string, de: string): string => (lang.value === "de" ? de : en)
