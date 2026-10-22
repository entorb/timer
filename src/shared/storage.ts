import * as Sentry from "@sentry/vue"

// localStorage can throw (private mode, quota) or hold corrupt JSON: fall back / skip, report to Sentry
export function readJson<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key)
    return stored == null ? fallback : JSON.parse(stored)
  } catch (e) {
    Sentry.captureException(e)
    return fallback
  }
}

// null removes the key
export function writeJson(key: string, value: unknown) {
  try {
    if (value == null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    Sentry.captureException(e) // not persisted
  }
}

const KEY_SETTINGS = "tmr-settings"

export interface Settings {
  dark?: boolean
  lang?: "en" | "de"
}

// dark + lang share one key
export const readSettings = () => readJson<Settings>(KEY_SETTINGS, {})
export const updateSettings = (patch: Settings) =>
  writeJson(KEY_SETTINGS, { ...readSettings(), ...patch })
