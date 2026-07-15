import { describe, expect, it } from 'vitest'
import { Rng } from '../src/core/rng'
import { REGIONS, regionById } from '../src/core/data/regions'
import { enemyById } from '../src/core/data/enemies'
import { itemBaseById } from '../src/core/data/items'
import { rarityOf, sourceLabelOf } from '../src/core/item_axes'
import {
  GOLDEN_SHADE_RATE, RARE_SHADE_RATE, SPECIAL_SHADE_RATE,
  classifySpecialEncounter, createRareEncounter, rareMarkForRegion,
  rareVictoryFlag, rareVictoryLog, specialShadeUsedKey,
} from '../src/core/rare_encounters'

describe('特殊影の経済契約 — 通常82% / 金13% / 稀相5%', () => {
  it('金+稀相の総率18%と通貨倍率対象を維持する', () => {
    expect(GOLDEN_SHADE_RATE).toBeCloseTo(0.13, 8)
    expect(RARE_SHADE_RATE).toBeCloseTo(0.05, 8)
    expect(SPECIAL_SHADE_RATE).toBeCloseTo(0.18, 8)
  })

  it('固定seed 100,000floorで分布が許容帯に収まる', () => {
    const rng = new Rng(0x27a11ce)
    const n = 100_000
    let golden = 0
    let rare = 0
    for (let i = 0; i < n; i++) {
      if (rng.next() >= SPECIAL_SHADE_RATE) continue
      if (classifySpecialEncounter(rng) === 'rare') rare++
      else golden++
    }
    expect(rare / n).toBeGreaterThan(0.047)
    expect(rare / n).toBeLessThan(0.053)
    expect(golden / n).toBeGreaterThan(0.126)
    expect(golden / n).toBeLessThan(0.134)
    expect((rare + golden) / n).toBeGreaterThan(0.176)
    expect((rare + golden) / n).toBeLessThan(0.184)
  })
})

describe('稀相の魔性 — 全地域の生成契約', () => {
  it('40地域すべてで同tierの強化敵と確定遺物を生成できる', () => {
    const seenMarks = new Set<string>()
    for (let i = 0; i < REGIONS.length; i++) {
      const region = REGIONS[i]
      const roll = createRareEncounter(region.id, new Rng(7000 + i))
      const base = enemyById(roll.encounter.enemyId)
      const dropBase = itemBaseById(roll.encounter.drop.baseId)
      seenMarks.add(roll.encounter.markId)

      expect(base.tier, region.id).toBe(regionById(region.id).tier)
      expect(roll.enemy.id).toBe(base.id)
      expect(roll.enemy.name).toContain('稀相・')
      expect(roll.enemy.hp).toBeGreaterThan(base.hp)
      expect(roll.enemy.atk).toBeGreaterThan(base.atk)
      expect(roll.enemy.def).toBeGreaterThanOrEqual(base.def)
      expect(roll.encounter.drop.source).toBe('rare')
      expect(roll.encounter.drop.rareOrigin).toBe(roll.encounter.enemyName)
      expect(dropBase.shopTier).toBeGreaterThanOrEqual(1)
      expect(dropBase.shopTier).toBeLessThanOrEqual(14)
      expect(rarityOf(roll.encounter.drop).name).toBe('秘')
      expect(sourceLabelOf(roll.encounter.drop)).toContain(roll.encounter.enemyName)
    }
    expect(seenMarks.size).toBe(6)
  })

  it('地相の粒子種から稀相印を安定して解決する', () => {
    expect(rareMarkForRegion('hotarubi_no_kubochi').title).toBe('灯冠')
    expect(rareMarkForRegion('nakiotoko_no_hara').title).toBe('逆雨')
    expect(rareMarkForRegion('gentou_no_zenya').title).toBe('星滴')
  })

  it('floor消費キー・初討伐旗・報酬ログが衝突しない', () => {
    const roll = createRareEncounter('yoi_forest', new Rng(1)).encounter
    expect(specialShadeUsedKey(0)).toBe('shade-special:0')
    expect(specialShadeUsedKey(1)).not.toBe(specialShadeUsedKey(0))
    expect(rareVictoryFlag(roll.markId)).toBe(`rareDefeat_${roll.markId}`)
    expect(rareVictoryLog(roll)).toContain(roll.drop.name)
    expect(rareVictoryLog(roll)).toContain('帰還するまで')
  })
})
