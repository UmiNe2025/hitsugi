// M22 P0-2: 装備5軸の導出規則(core/item_axes)の回帰テスト
// 焦点: (1)品質と希少度が独立の軸であること (2)charm比較が「同等」に潰れないこと
//       (3)source無しの旧セーブItemが全導出関数を壊さないこと
import { describe, expect, it } from 'vitest'
import type { Item } from '../src/core/types'
import { ITEM_BASES, makeItem, inheritItem, reforgeItem } from '../src/core/data/items'
import { diffItems, qualityOf, rarityOf, sourceLabelOf, UNKNOWN_SOURCE_LABEL } from '../src/core/item_axes'

const baseOfTier = (tier: number) => {
  const b = ITEM_BASES.find((x) => x.shopTier === tier)
  if (!b) throw new Error(`no base with shopTier ${tier}`)
  return b
}

// 旧セーブのItem(source無し・JSON往復済み想定)
const legacyItem = (over: Partial<Item> = {}): Item =>
  JSON.parse(
    JSON.stringify({
      id: 'item_legacy',
      baseId: 'w_kodachi',
      name: '小太刀',
      slot: 'weapon',
      atk: 8,
      generation: 0,
      ...over,
    }),
  )

describe('品質(qualityOf) — shopTier帯からの導出', () => {
  it('帯: 0-2粗末 / 3-5良品 / 6-9名品 / 10-12秘宝 / 13-14神器', () => {
    expect(qualityOf(baseOfTier(0).baseId)?.name).toBe('粗末')
    expect(qualityOf(baseOfTier(4).baseId)?.name).toBe('良品')
    expect(qualityOf(baseOfTier(7).baseId)?.name).toBe('名品')
    expect(qualityOf(baseOfTier(11).baseId)?.name).toBe('秘宝')
    expect(qualityOf(baseOfTier(14).baseId)?.name).toBe('神器')
  })
  it('不明なbaseIdはnull(クラッシュしない)', () => {
    expect(qualityOf('no_such_base')).toBeNull()
  })
})

describe('希少度(rarityOf) — 産地+継承駆動で品質から独立', () => {
  it('由来の基礎位: 無記録/店=並, 夜藪=稀, 主=逸, 稀相=秘, 神授=伝', () => {
    expect(rarityOf({ generation: 0 }).name).toBe('並')
    expect(rarityOf({ generation: 0, source: 'shop' }).name).toBe('並')
    expect(rarityOf({ generation: 0, source: 'chest' }).name).toBe('稀')
    expect(rarityOf({ generation: 0, source: 'boss' }).name).toBe('逸')
    expect(rarityOf({ generation: 0, source: 'rare' }).name).toBe('秘')
    expect(rarityOf({ generation: 0, source: 'divine' }).name).toBe('伝')
  })
  it('稀相遺物は討伐した魔性の来歴を表示する', () => {
    const it: Item = { ...makeItem('w_kodachi', 'rare'), rareOrigin: '稀相・灯冠の古強者' }
    expect(sourceLabelOf(it)).toBe('稀相の魔性が遺した品 — 稀相・灯冠の古強者')
  })
  it('形見(legacyOf)で一段、代重ね(gen>=3)でさらに一段。上限=伝', () => {
    expect(rarityOf({ generation: 0, source: 'shop', legacyOf: '祖母' }).name).toBe('稀')
    expect(rarityOf({ generation: 3, source: 'shop', legacyOf: '祖母' }).name).toBe('逸')
    expect(rarityOf({ generation: 5, source: 'divine', legacyOf: '祖母' }).name).toBe('伝')
  })
  it('独立性: 低tier×高希少度(粗末の主討伐品=逸)', () => {
    const b = baseOfTier(0)
    const it = makeItem(b.baseId, 'boss')
    expect(qualityOf(it.baseId)?.name).toBe('粗末')
    expect(rarityOf(it).name).toBe('逸')
  })
  it('独立性: 高tier×低希少度(神器の店売り=並)', () => {
    const b = baseOfTier(14)
    const it = makeItem(b.baseId, 'shop')
    expect(qualityOf(it.baseId)?.name).toBe('神器')
    expect(rarityOf(it).name).toBe('並')
  })
})

describe('装備差分(diffItems) — 軸別・スカラー合算禁止', () => {
  it('charm同士: statBonusが異なれば「同等」にならない(M22の主バグ)', () => {
    const cur = { statBonus: { luk: 8 } }
    const next = { statBonus: { str: 8, dex: 8 } }
    const d = diffItems(cur, next)
    expect(d.same).toBe(false)
    expect(d.dStats).toEqual({ str: 8, dex: 8, luk: -8 })
    expect(d.dAtk).toBe(0)
    expect(d.dDef).toBe(0)
  })
  it('完全同値のみ同等', () => {
    const d = diffItems({ atk: 5, statBonus: { luk: 3 } }, { atk: 5, statBonus: { luk: 3 } })
    expect(d.same).toBe(true)
  })
  it('薦(strictlyBetter)はパレート優越のみ: 攻+3防-1は薦でない', () => {
    expect(diffItems({ atk: 5, def: 3 }, { atk: 8, def: 2 }).strictlyBetter).toBe(false)
    expect(diffItems({ atk: 5 }, { atk: 8 }).strictlyBetter).toBe(true)
    expect(diffItems({ statBonus: { luk: 3 } }, { statBonus: { luk: 5 } }).strictlyBetter).toBe(true)
  })
  it('現装備なし(素手)との比較も軸別に立つ', () => {
    const d = diffItems(undefined, { atk: 8, statBonus: { agi: 2 } })
    expect(d.dAtk).toBe(8)
    expect(d.dStats).toEqual({ agi: 2 })
    expect(d.strictlyBetter).toBe(true)
  })
})

describe('旧セーブ互換 — source無しItemが全経路で壊れない', () => {
  it('旧Itemで品質/希少度/由来表示/差分が導出できる', () => {
    const it = legacyItem()
    expect(qualityOf(it.baseId)?.name).toBe('粗末')
    expect(rarityOf(it).name).toBe('並')
    expect(sourceLabelOf(it)).toBe(UNKNOWN_SOURCE_LABEL)
    expect(diffItems(it, it).same).toBe(true)
  })
  it('旧Itemの打ち直し・継承でsourceは増えず、来歴の意味が変わらない', () => {
    const re = reforgeItem(legacyItem())
    expect(re.source).toBeUndefined()
    expect(rarityOf(re).name).toBe('並') // gen1では昇位しない
    const inh = inheritItem(legacyItem(), '祖母', 0)
    expect(inh.legacyOf).toBe('祖母')
    expect(rarityOf(inh).name).toBe('稀') // 形見で一段
  })
  it('新規入手はsourceを持ち、継承を経ても保持される', () => {
    const it = makeItem('w_kodachi', 'boss')
    expect(it.source).toBe('boss')
    const inh = inheritItem(it, '父', 0)
    expect(inh.source).toBe('boss')
  })
})
