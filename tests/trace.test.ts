// M23(指示7 V3): 痕跡→ボス開示と地域テーマ変調の回帰テスト
// 焦点: (1)見切りが全ダンジョン地域で物理的に到達可能(devil指摘の7地域含む)
//       (2)石碑<3の地域はクランプで全開になる (3)幕/鎮の変調が単調に働く
import { describe, expect, it } from 'vitest'
import { DUNGEONS, dungeonByRegion } from '../src/dungeon/maps'
import { REGIONS, regionById } from '../src/core/data/regions'
import { maxTraceOf, traceIntelOf, bossDangerHint, bossMikiriLine } from '../src/core/trace'
import { themeForBg } from '../src/dungeon/render/theme'
import { resolveRegionVisual } from '../src/dungeon/render/region_theme'

const dungeonRegionIds = DUNGEONS.map((d) => d.regionId)

describe('痕跡の物理到達性(maxTraceOf)', () => {
  it('全ダンジョン地域で石碑が1つ以上ある(観察系が完全に死ぬ地域はない)', () => {
    for (const id of dungeonRegionIds) {
      expect(maxTraceOf(id), id).toBeGreaterThan(0)
    }
  })
  it('ダンジョン未実装地域は0(開示は物見櫓のみに委ねる)', () => {
    const legacy = REGIONS.find((r) => !dungeonByRegion(r.id))
    expect(legacy).toBeDefined()
    expect(maxTraceOf(legacy!.id)).toBe(0)
  })
})

describe('開示ゲートのクランプ(devil反映: 固定3を廃止)', () => {
  it('全ダンジョン地域で、石碑を全て読めば見切りに到達できる', () => {
    for (const id of dungeonRegionIds) {
      const max = Math.min(3, maxTraceOf(id))
      const intel = traceIntelOf({ loreFrags: { [id]: max } }, id)
      expect(intel.mikiri, id).toBe(true)
    }
  })
  it('石碑1の地域(烏の里)は1つで全開', () => {
    expect(maxTraceOf('karasu_no_sato')).toBe(1)
    const intel = traceIntelOf({ loreFrags: { karasu_no_sato: 1 } }, 'karasu_no_sato')
    expect(intel.attr && intel.danger && intel.mikiri).toBe(true)
  })
  it('石碑2の地域(宵の森)は1つで属性のみ・2つで全開', () => {
    expect(maxTraceOf('yoi_forest')).toBe(2)
    const one = traceIntelOf({ loreFrags: { yoi_forest: 1 } }, 'yoi_forest')
    expect(one.attr).toBe(true)
    expect(one.mikiri).toBe(false)
    const two = traceIntelOf({ loreFrags: { yoi_forest: 2 } }, 'yoi_forest')
    expect(two.danger && two.mikiri).toBe(true)
  })
  it('石碑3以上の地域は従来通り1/2/3段', () => {
    const rich = dungeonRegionIds.find((id) => maxTraceOf(id) >= 3)!
    const l2 = traceIntelOf({ loreFrags: { [rich]: 2 } }, rich)
    expect(l2.attr && l2.danger).toBe(true)
    expect(l2.mikiri).toBe(false)
    expect(traceIntelOf({ loreFrags: { [rich]: 3 } }, rich).mikiri).toBe(true)
  })
  it('観察0・loreFrags未定義(旧セーブ)でも壊れない', () => {
    const intel = traceIntelOf({}, 'yoi_forest')
    expect(intel.level).toBe(0)
    expect(intel.mikiri).toBe(false)
  })
})

describe('開示文の生成', () => {
  it('主のいる全ダンジョン地域で見立て・見切り文が生成できる', () => {
    for (const id of dungeonRegionIds) {
      const region = regionById(id)
      if (!region.bossId) continue
      expect(bossDangerHint(region.bossId), id).toBeTruthy()
      expect(bossMikiriLine(region.bossId), id).toMatch(/見切った/)
    }
  })
  it('未知のボスidはnull(クラッシュしない)', () => {
    expect(bossDangerHint('no_such_boss')).toBeNull()
    expect(bossMikiriLine(undefined)).toBeNull()
  })
})

describe('地域テーマ変調(resolveRegionVisual)', () => {
  const base = themeForBg('bg_forest.png')
  it('プロファイルの色がthemeへ乗る(蛍火の窪地)', () => {
    const rv = resolveRegionVisual(base, 'hotarubi_no_kubochi', 'norm', false)
    expect(rv.theme.groundBase).not.toBe(base.groundBase)
    expect(rv.landmark).toBe('sunken_lantern')
    expect(rv.mote).not.toBe(0xffe79e)
  })
  it('プロファイル未定義のregionIdでも基盤テーマで成立する', () => {
    const rv = resolveRegionVisual(base, 'no_such_region', 'norm', false)
    expect(rv.theme.groundBase).toBe(base.groundBase)
    expect(rv.landmark).toBeNull()
  })
  it('畏(dread)は光粒を減らし帳を濃くする', () => {
    const norm = resolveRegionVisual(base, 'hotarubi_no_kubochi', 'norm', false)
    const dread = resolveRegionVisual(base, 'hotarubi_no_kubochi', 'dread', false)
    expect(dread.moteCount).toBeLessThan(norm.moteCount)
    expect(dread.theme.veilAlpha).toBeGreaterThanOrEqual(norm.theme.veilAlpha)
  })
  it('鎮(cleared)は帳が薄れ光粒が郷の灯色になる', () => {
    const norm = resolveRegionVisual(base, 'hotarubi_no_kubochi', 'norm', false)
    const calm = resolveRegionVisual(base, 'hotarubi_no_kubochi', 'norm', true)
    expect(calm.theme.veilAlpha).toBeLessThan(norm.theme.veilAlpha)
    expect(calm.mote).toBe(0xd9c26a)
    expect(calm.moteCount).toBeLessThanOrEqual(norm.moteCount)
  })
})
