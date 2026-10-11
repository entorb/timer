// localStorage can throw (private mode, quota) or hold corrupt JSON: fall back / skip silently
export function readJson<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key)
    return stored == null ? fallback : JSON.parse(stored)
  } catch {
    return fallback
  }
}

// null removes the key
export function writeJson(key: string, value: unknown) {
  try {
    if (value == null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // not persisted
  }
}
