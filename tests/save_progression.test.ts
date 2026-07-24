import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isValidSave, importSaveString, normalizeLoadedData } from '../src/core/save'
import { xpToNext } from '../src/core/character_progression'
import { recalcStats } from '../src/core/inheritance'
import type { Character, GameData, Stats } from '../src/core/types'

class MemStorage {
  data = new Map<string, string>()
  getItem(key: string) { return this.data.get(key) ?? null }
  setItem(key: string, value: string) { this.data.set(key, value) }
  removeItem(key: string) { this.data.delete(key) }
  clear() { this.data.clear() }
}

const mem = new MemStorage()
vi.stubGlobal('localStorage', mem)

const potential: Stats = { str: 52, vit: 55, dex: 48, agi: 46, mnd: 42, luk: 45 }

function character(patch: Partial<Character> = {}): Character {
  return {
    id: 'head', name: '燈吾', gen: 1, sex: 'm', bornSeason: -9, potential,
    level: 1, exp: 0, stats: potential, hp: 90, maxHp: 100, mp: 30, maxMp: 40,
    element: 'fire', personalityId: 'brave', skills: [], equipment: {}, godParentId: 'kagaribi',
    isHead: true, alive: true, kills: 0, expeditions: 0, deeds: [], fatigue: 0,
    ...patch,
  }
}

function data(member: Character = character()): GameData {
  return {
    seasonIndex: 0, family: [member], hoto: 0, ketsu: 0, inventory: [], godAffinity: {}, fame: 0,
    regionsCleared: [], chronicle: [], pendingBirths: [], flags: {}, narrativeMode: false, seed: 1,
  }
}

beforeEach(() => mem.clear())

describe('M46 progression save migration', () => {
  it('level/expの片方でも欠ければ戦歴から両方を冪等再構築する', () => {
    const legacy = data(character({ kills: 10, expeditions: 2 }))
    delete (legacy.family[0] as Partial<Character>).level
    legacy.family[0].exp = 999
    expect(isValidSave(legacy)).toBe(true)
    const once = normalizeLoadedData(legacy, 0)
    const twice = normalizeLoadedData(once, 0)
    expect({ level: once.family[0].level, exp: once.family[0].exp }).toEqual({ level: 3, exp: 6 })
    expect(twice).toEqual(once)
  })

  it('invalid数値を拒否し、overcapと閾値超過整数だけを正規化する', () => {
    for (const level of [Number.NaN, Number.POSITIVE_INFINITY, -1, 1.5]) {
      expect(isValidSave(data(character({ level })))).toBe(false)
    }
    for (const exp of [Number.NaN, Number.POSITIVE_INFINITY, -1, 1.5]) {
      expect(isValidSave(data(character({ exp })))).toBe(false)
    }
    const normalized = normalizeLoadedData(data(character({ level: 99, exp: 999 })), 0).family[0]
    expect({ level: normalized.level, exp: normalized.exp }).toEqual({ level: 9, exp: 0 })
    const threshold = normalizeLoadedData(data(character({ level: 1, exp: xpToNext(1) + xpToNext(2) + 2 })), 0).family[0]
    expect({ level: threshold.level, exp: threshold.exp }).toEqual({ level: 3, exp: 2 })
  })

  it('能力再計算はHP/MP比率をclampし、死亡者hp0を維持する', () => {
    const before = recalcStats(character(), 0)
    const dead = { ...before, alive: false, hp: 0, mp: 999, level: 1, exp: xpToNext(1) }
    const normalized = normalizeLoadedData(data(dead), 0).family[0]
    expect(normalized.hp).toBe(0)
    expect(normalized.mp).toBe(normalized.maxMp)
    expect(normalized.stats.str).toBeGreaterThanOrEqual(dead.stats.str)
    expect(recalcStats({ ...before, alive: true, hp: 0 }, 0).hp).toBe(1)
  })

  it('importは保存前にprogressionを正規化する', () => {
    expect(importSaveString(JSON.stringify(data(character({ level: 99, exp: 999 }))))).toBe(true)
    const stored = JSON.parse(mem.getItem('hitsugi_save_v4')!) as GameData
    expect({ level: stored.family[0].level, exp: stored.family[0].exp }).toEqual({ level: 9, exp: 0 })
  })

  it('既存の最小save fixtureを壊さずlevel/expだけ補う', () => {
    const minimal = {
      ...data(),
      family: [{ id: 'minimal', hp: 10, equipment: {} }],
    } as unknown as GameData
    expect(isValidSave(minimal)).toBe(true)
    expect(normalizeLoadedData(minimal, 0).family[0]).toMatchObject({ id: 'minimal', level: 1, exp: 0 })
  })
})
