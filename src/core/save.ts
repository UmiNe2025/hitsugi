import type { GameData } from './types'

const KEY_V1 = 'hitsugi_save_v1' // 季節単位(1ターン=1季)時代のセーブ
const KEY = 'hitsugi_save_v3' // 月単位(1ターン=1月)

export function saveGame(data: GameData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    // 容量超過等 — ゲーム進行は止めない
  }
}

// v1(季節単位)→v3(月単位): 時間軸を3倍に換算
function migrateV1(d: GameData): GameData {
  return {
    ...d,
    seasonIndex: d.seasonIndex * 3,
    family: d.family.map((c) => ({
      ...c,
      bornSeason: c.bornSeason * 3,
      deathSeason: c.deathSeason !== undefined ? c.deathSeason * 3 : undefined,
    })),
    pendingBirths: d.pendingBirths.map((b) => ({ ...b, dueSeason: b.dueSeason * 3 })),
    chronicle: d.chronicle.map((e) => ({ ...e, season: e.season * 3 })),
    expedition: undefined,
  }
}

export function loadGame(): GameData | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as GameData
    const rawV1 = localStorage.getItem(KEY_V1)
    if (rawV1) {
      const migrated = migrateV1(JSON.parse(rawV1) as GameData)
      saveGame(migrated)
      localStorage.removeItem(KEY_V1)
      return migrated
    }
    return null
  } catch {
    return null
  }
}

export function hasSave(): boolean {
  return localStorage.getItem(KEY) !== null || localStorage.getItem(KEY_V1) !== null
}

export function clearSave(): void {
  localStorage.removeItem(KEY)
  localStorage.removeItem(KEY_V1)
}
