import { beforeEach, describe, expect, it, vi } from 'vitest'
import { exportSaveString, importSaveString, loadGame } from '../src/core/save'
import type { GameData } from '../src/core/types'

class MemStorage {
  data = new Map<string, string>()
  getItem(key: string) { return this.data.get(key) ?? null }
  setItem(key: string, value: string) { this.data.set(key, value) }
  removeItem(key: string) { this.data.delete(key) }
  clear() { this.data.clear() }
}
const mem = new MemStorage()
vi.stubGlobal('localStorage', mem)

function valid(seasonIndex: number): GameData {
  return {
    seasonIndex, hoto: 100, ketsu: 2, fame: 0,
    family: [{ id: 'head', name: '灯', gen: 1, sex: 'm', bornSeason: -9, potential: { str: 1, vit: 1, dex: 1, agi: 1, mnd: 1, luk: 1 }, stats: { str: 1, vit: 1, dex: 1, agi: 1, mnd: 1, luk: 1 }, hp: 10, maxHp: 10, mp: 1, maxMp: 1, element: 'fire', personalityId: 'brave', skills: [], equipment: {}, godParentId: 'kagaribi', isHead: true, alive: true, kills: 0, expeditions: 0, deeds: [], fatigue: 0 }],
    inventory: [], godAffinity: {}, regionsCleared: [], chronicle: [], pendingBirths: [], flags: {}, narrativeMode: false, seed: 1,
  }
}

describe('M43 recoverable export', () => {
  beforeEach(() => mem.clear())

  const exportImportEqual = (expectedSeason: number) => {
    const json = exportSaveString()
    expect(json).not.toBeNull()
    mem.clear()
    expect(importSaveString(json!)).toBe(true)
    const loaded = loadGame()!
    expect(loaded.seasonIndex).toBe(expectedSeason)
    expect(loaded.family[0].id).toBe('head')
    expect(loaded.journeyMetrics).toBeDefined()
    expect(loaded.starLottery).toBeDefined()
  }

  it('破損main+正常BAKはBAKのmigration済み候補を書き出す', () => {
    mem.setItem('hitsugi_save_v4', '{broken')
    mem.setItem('hitsugi_save_v4_bak', JSON.stringify({ ...valid(7), saveSeq: 3, lastPlayedAt: 10 }))
    exportImportEqual(7)
  })

  it('BAKのみでも書き出せる', () => {
    mem.setItem('hitsugi_save_v4_bak', JSON.stringify({ ...valid(8), saveSeq: 2, lastPlayedAt: 10 }))
    exportImportEqual(8)
  })

  it('旧版のみでも正式migration後に書き出せる', () => {
    mem.setItem('hitsugi_save_v3', JSON.stringify(valid(9)))
    exportImportEqual(9)
  })
})
