import { describe, expect, it } from 'vitest'
import {
  aptitudeScore,
  battleXp,
  grantBattleXp,
  growthBonus,
  growthCapacity,
  growthRate,
  levelCap,
  xpToNext,
} from '../src/core/character_progression'
import { AGE_CURVE, recalcStats } from '../src/core/inheritance'
import type { Character, Stats } from '../src/core/types'

const founderPotential: Stats = { str: 52, vit: 55, dex: 48, agi: 46, mnd: 42, luk: 45 }

function character(patch: Partial<Character> = {}): Character {
  return {
    id: 'c1', name: '燈吾', gen: 1, sex: 'm', bornSeason: 0,
    potential: founderPotential, level: 1, exp: 0, stats: founderPotential,
    hp: 100, maxHp: 100, mp: 40, maxMp: 40, element: 'fire', personalityId: 'brave',
    skills: [], equipment: {}, godParentId: 'kagaribi', isHead: true, alive: true,
    kills: 0, expeditions: 0, deeds: [], fatigue: 0,
    ...patch,
  }
}

describe('M46 character progression', () => {
  it('Lv1は現行potential×AGE_CURVEと完全一致する', () => {
    for (let age = 0; age < AGE_CURVE.length; age++) {
      const c = recalcStats(character(), age)
      for (const key of Object.keys(founderPotential) as (keyof Stats)[]) {
        expect(c.stats[key]).toBe(Math.max(1, Math.round(founderPotential[key] * AGE_CURVE[age])))
        expect(growthBonus(character(), key)).toBe(0)
      }
    }
  })

  it('初代の資質評価は50・上限9で、閾値を正確に区切る', () => {
    expect(aptitudeScore(character())).toBe(50)
    expect(levelCap(character())).toBe(9)
    for (const [potential, cap] of [[44, 8], [45, 9], [60, 10], [75, 11], [90, 12]] as const) {
      const uniform = { str: potential, vit: potential, dex: potential, agi: potential, mnd: potential, luk: potential }
      expect(levelCap(character({ potential: uniform }))).toBe(cap)
    }
  })

  it('高資質ほど成長率・上限が低下せず、level上昇で能力が低下しない', () => {
    const low = character({ potential: { ...founderPotential, str: 20 } })
    const high = character({ potential: { ...founderPotential, str: 100 } })
    expect(growthRate(high, 'str')).toBeGreaterThan(growthRate(low, 'str'))
    expect(growthCapacity(high, 'str')).toBeGreaterThan(growthCapacity(low, 'str'))
    let previous = recalcStats(character(), 16).stats
    for (let level = 2; level <= levelCap(character()); level++) {
      const current = recalcStats(character({ level }), 16).stats
      for (const key of Object.keys(current) as (keyof Stats)[]) expect(current[key]).toBeGreaterThanOrEqual(previous[key])
      previous = current
    }
  })

  it('一戦で複数level上昇でき、cap到達時は余剰expを0にする', () => {
    expect(xpToNext(1)).toBe(14)
    const raised = grantBattleXp(character(), xpToNext(1) + xpToNext(2) + 3)
    expect({ level: raised.level, exp: raised.exp }).toEqual({ level: 3, exp: 3 })
    const capped = grantBattleXp(character({ level: 8, exp: 0 }), 10_000)
    expect({ level: capped.level, exp: capped.exp }).toEqual({ level: 9, exp: 0 })
  })

  it('戦闘経験は敵tier合計とboss/rare/nemesisだけから決まる', () => {
    expect(battleXp({ enemyTiers: [1, 2, 4] })).toBe(35)
    expect(battleXp({ enemies: [{ tier: 5 }], boss: true, rare: true, nemesis: true })).toBe(61)
  })
})
