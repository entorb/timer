import { Lang } from "quasar"
import langDe from "quasar/lang/de-DE"
import langEn from "quasar/lang/en-US"
import { ref, watchEffect } from "vue"

export type LangType = "en" | "de"

const KEY_LANG = "timer_lang"

function initialLang(): LangType {
  try {
    const stored = localStorage.getItem(KEY_LANG)
    if (stored === "en" || stored === "de") return stored
  } catch {
    // fall through to browser language
  }
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
  try {
    localStorage.setItem(KEY_LANG, lang.value)
  } catch {
    // not persisted
  }
}

// inline translation: reactive when called in templates / computed
export const t = (en: string, de: string): string => (lang.value === "de" ? de : en)
