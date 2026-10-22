import { readJson } from "@/shared/storage"
import type { Unit } from "@/shared/time"

import type { DataRowRedType } from "./types"

export interface EtaSettings {
  unitSpeed: Unit
  weightedReg: boolean
}

export interface EtaSet {
  id: string
  name: string
  target: number
  data: DataRowRedType[]
  settings: EtaSettings
}

// as stored in localStorage: dates are strings, fields may be missing
export interface StoredSet {
  id?: string
  name?: string
  target?: number
  data?: Array<{ date: string; items: number }>
  settings?: Partial<EtaSettings>
}

export const DEFAULT_SETTINGS: EtaSettings = { unitSpeed: "min", weightedReg: false }

export const newSet = (name: string): EtaSet => ({
  id: crypto.randomUUID(),
  name,
  target: 0,
  data: [],
  settings: { ...DEFAULT_SETTINGS },
})

export const reviveSets = (raw: StoredSet[]): EtaSet[] =>
  raw.map((s, i) => ({
    ...newSet(s.name ?? `ETA ${i + 1}`),
    ...(s.id == null ? {} : { id: s.id }),
    target: s.target ?? 0,
    data: (s.data ?? []).map(({ date, items }) => ({ date: new Date(date), items })),
    settings: { ...DEFAULT_SETTINGS, ...s.settings },
  }))

export const ORIGIN = "tmr-eta"
export const KEY_SETS = "tmr-eta-sets"

export const loadSets = (): EtaSet[] => reviveSets(readJson<StoredSet[]>(KEY_SETS, []))
