// M23指示7 V2: 地域別ビジュアルプロファイル(region_visuals)の機械ゲート回帰テスト
// 焦点: (1)40地域の過不足0 (2)暗色帯/光り物輝度の色制約 (3)moteCount範囲
//       (4)署名12地域のみlandmarkを持つこと (5)同一bg系統内の識別性 (6)regionVisualOfの安全性
import { describe, expect, it } from 'vitest'
import { REGIONS } from '../src/core/data/regions'
import {
  REGION_IDENTITIES, REGION_VISUALS, regionIdentityOf, regionVisualOf,
  type GroundKind, type LandmarkKind, type ParticleKind,
} from '../src/core/data/region_visuals'
import { themeForBg } from '../src/dungeon/render/theme'
import { resolveRegionVisual } from '../src/dungeon/render/region_theme'

const GROUND_CHANNEL_MAX = 0x33
const MID_CHANNEL_MAX = 0x66
const GLOW_LUMINANCE_MIN = 96
const MOTE_COUNT_MIN = 6
const MOTE_COUNT_MAX = 40
const FAMILY_DISTANCE_MIN = 24
const DEFAULT_MOTE = 0xffe79e

// 署名12地域 → 対応landmark種(型コメントと同一の対応表)
const EXPECTED_LANDMARKS: Record<string, LandmarkKind> = {
  hotarubi_no_kubochi: 'sunken_lantern',
  nemurijizou_no_michi: 'jizo_row',
  kuchinawa_no_hotoke: 'great_shimenawa',
  usugiri_no_watashiba: 'ghost_pier',
  hisui_no_sawa: 'jade_pillar',
  nakiotoko_no_hara: 'weeping_stones',
  sabigatana_no_haka: 'sword_grove',
  yumemaboroshi_no_yakata: 'nested_fusuma',
  maboroshi_no_sandou: 'endless_torii',
  nakiryuu_no_mine: 'dragon_spine',
  todome_no_kaidan: 'counted_steps',
  gentou_no_zenya: 'empty_banquet',
}

function channels(color: number): [number, number, number] {
  return [(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff]
}

function channelMax(color: number): number {
  return Math.max(...channels(color))
}

function rgbDistance(a: number, b: number): number {
  const [ar, ag, ab] = channels(a)
  const [br, bg, bb] = channels(b)
  return Math.abs(ar - br) + Math.abs(ag - bg) + Math.abs(ab - bb)
}

function luminance(color: number): number {
  const [r, g, b] = channels(color)
  return 0.299 * r + 0.587 * g + 0.114 * b
}

describe('REGION_VISUALS — 40地域の過不足0', () => {
  it('REGIONSの全idがREGION_VISUALSに存在し、余剰キーもない', () => {
    const regionIds = REGIONS.map((r) => r.id)
    const visualIds = Object.keys(REGION_VISUALS)
    const missing = regionIds.filter((id) => !visualIds.includes(id))
    const extra = visualIds.filter((id) => !regionIds.includes(id))
    expect(missing).toEqual([])
    expect(extra).toEqual([])
    expect(visualIds.length).toBe(40)
  })
})

describe('REGION_VISUALS — 色制約(暗色帯を破らない/光り物は暗すぎない)', () => {
  for (const region of REGIONS) {
    const profile = REGION_VISUALS[region.id]
    it(`${region.id}: ground/stain/grass/waterDeepが暗色帯を超えない`, () => {
      if (profile.ground !== undefined) {
        expect(channelMax(profile.ground)).toBeLessThanOrEqual(GROUND_CHANNEL_MAX)
      }
      for (const key of ['stain', 'grass', 'waterDeep'] as const) {
        const v = profile[key]
        if (v !== undefined) {
          expect(channelMax(v)).toBeLessThanOrEqual(MID_CHANNEL_MAX)
        }
      }
    })
    it(`${region.id}: waterGlint/lantern/moteの輝度が96以上`, () => {
      for (const key of ['waterGlint', 'lantern', 'mote'] as const) {
        const v = profile[key]
        if (v !== undefined) {
          expect(luminance(v)).toBeGreaterThanOrEqual(GLOW_LUMINANCE_MIN)
        }
      }
    })
  }
})

describe('REGION_VISUALS — moteCountは6〜40の整数', () => {
  for (const region of REGIONS) {
    const profile = REGION_VISUALS[region.id]
    it(`${region.id}`, () => {
      if (profile.moteCount !== undefined) {
        expect(Number.isInteger(profile.moteCount)).toBe(true)
        expect(profile.moteCount).toBeGreaterThanOrEqual(MOTE_COUNT_MIN)
        expect(profile.moteCount).toBeLessThanOrEqual(MOTE_COUNT_MAX)
      }
    })
  }
})

describe('REGION_VISUALS — landmarkは署名12地域のみ、対応種も正しい', () => {
  it('署名12地域は指定どおりのlandmarkを持つ', () => {
    for (const [regionId, kind] of Object.entries(EXPECTED_LANDMARKS)) {
      expect(REGION_VISUALS[regionId]?.landmark).toBe(kind)
    }
  })
  it('署名12地域以外はlandmarkキーを持たない', () => {
    for (const region of REGIONS) {
      if (region.id in EXPECTED_LANDMARKS) continue
      expect(REGION_VISUALS[region.id].landmark).toBeUndefined()
    }
  })
})

describe('REGION_VISUALS — 同一bg系統内の識別性(ground/grass/moteのいずれかがRGB距離≥24)', () => {
  const familyOf = (regionId: string) => themeForBg(REGIONS.find((r) => r.id === regionId)!.bg).family

  const families = new Map<string, string[]>()
  for (const region of REGIONS) {
    const fam = familyOf(region.id)
    families.set(fam, [...(families.get(fam) ?? []), region.id])
  }

  for (const [fam, ids] of families) {
    it(`${fam}系統: 全${ids.length}地域が互いに識別可能`, () => {
      const failures: string[] = []
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = REGION_VISUALS[ids[i]]
          const b = REGION_VISUALS[ids[j]]
          const dGround = rgbDistance(a.ground ?? 0, b.ground ?? 0)
          const dGrass = rgbDistance(a.grass ?? 0, b.grass ?? 0)
          const dMote = rgbDistance(a.mote ?? DEFAULT_MOTE, b.mote ?? DEFAULT_MOTE)
          const best = Math.max(dGround, dGrass, dMote)
          if (best < FAMILY_DISTANCE_MIN) {
            failures.push(`${ids[i]} vs ${ids[j]}: max(${dGround},${dGrass},${dMote})=${best}`)
          }
        }
      }
      expect(failures).toEqual([])
    })
  }
})

// M24 Phase D(§4.7): 地面材質(groundKind)/空気粒子(particleKind)の機械ゲート。
// 色差だけで終わらせず、静止画でも形状(材質パターン/粒子の動き方)で地域を見分けられることを担保する。
const ALL_GROUND_KINDS: GroundKind[] = ['soil', 'moss', 'plank', 'stone', 'bone', 'ash', 'water_film']
const ALL_PARTICLE_KINDS: ParticleKind[] = ['firefly', 'rain', 'ash', 'fog', 'pollen', 'stardust']

describe('REGION_VISUALS — groundKind/particleKindの機械ゲート(M24 §4.7)', () => {
  it('40地域全てにgroundKind/particleKindが割当済み(既知の値のみ)', () => {
    for (const region of REGIONS) {
      const profile = REGION_VISUALS[region.id]
      expect(profile.groundKind, `${region.id}.groundKind`).toBeDefined()
      expect(profile.particleKind, `${region.id}.particleKind`).toBeDefined()
      expect(ALL_GROUND_KINDS, `${region.id}.groundKind=${profile.groundKind}`).toContain(profile.groundKind)
      expect(ALL_PARTICLE_KINDS, `${region.id}.particleKind=${profile.particleKind}`).toContain(profile.particleKind)
    }
  })

  it('GroundKind/ParticleKindは7種/6種全てが最低1地域で使われている(enum網羅)', () => {
    const usedGround = new Set(REGIONS.map((r) => REGION_VISUALS[r.id].groundKind))
    const usedParticle = new Set(REGIONS.map((r) => REGION_VISUALS[r.id].particleKind))
    for (const k of ALL_GROUND_KINDS) expect(usedGround.has(k), `groundKind未使用: ${k}`).toBe(true)
    for (const k of ALL_PARTICLE_KINDS) expect(usedParticle.has(k), `particleKind未使用: ${k}`).toBe(true)
  })

  const familyOf = (regionId: string) => themeForBg(REGIONS.find((r) => r.id === regionId)!.bg).family
  const families = new Map<string, string[]>()
  for (const region of REGIONS) {
    const fam = familyOf(region.id)
    families.set(fam, [...(families.get(fam) ?? []), region.id])
  }

  for (const [fam, ids] of families) {
    it(`${fam}系統: 色(ground/grass/mote)+材質+粒子の複合キーが全ペアで異なる`, () => {
      const keys = ids.map((id) => {
        const p = REGION_VISUALS[id]
        return [p.ground ?? 0, p.grass ?? 0, p.mote ?? DEFAULT_MOTE, p.groundKind, p.particleKind].join('|')
      })
      const dupes = keys.filter((k, i) => keys.indexOf(k) !== i)
      expect(dupes, `${fam}系統で複合キーが重複`).toEqual([])
    })

    // 受入(§4.7末尾): 同一bg系統内で色を落とした静止画でも区別できる形状差を最低1つ持つこと。
    // groundKind/particleKindのいずれかが系統内で2種以上に分かれていれば、その2地域は
    // 色情報なしで(材質パターンor粒子の動き方だけで)区別できる = 受入を機械的に担保する。
    it(`${fam}系統: groundKind/particleKindが系統内で全部同一にならない(形状差の分散)`, () => {
      const groundKinds = new Set(ids.map((id) => REGION_VISUALS[id].groundKind))
      const particleKinds = new Set(ids.map((id) => REGION_VISUALS[id].particleKind))
      expect(groundKinds.size, `${fam}系統: groundKindが全部同一`).toBeGreaterThanOrEqual(2)
      expect(particleKinds.size, `${fam}系統: particleKindが全部同一`).toBeGreaterThanOrEqual(2)
    })
  }
})

describe('regionVisualOf', () => {
  it('既知idは非null', () => {
    expect(regionVisualOf('yoi_forest')).not.toBeNull()
  })
  it('未知idはnull', () => {
    expect(regionVisualOf('no_such_region')).toBeNull()
  })
})

describe('REGION_IDENTITIES — 全40地域の景観文法(M27)', () => {
  it('REGIONSと過不足なく一致し、地相名・入場文が重複しない', () => {
    const regionIds = REGIONS.map((r) => r.id)
    expect(Object.keys(REGION_IDENTITIES).sort()).toEqual([...regionIds].sort())
    expect(new Set(Object.values(REGION_IDENTITIES).map((x) => x.motif)).size).toBe(40)
    expect(new Set(Object.values(REGION_IDENTITIES).map((x) => x.entryLine)).size).toBe(40)
  })

  it('同じ背景系統でもプロップ構成の複合キーが重複しない', () => {
    const familyKeys = new Map<string, string[]>()
    for (const region of REGIONS) {
      const identity = REGION_IDENTITIES[region.id]
      const key = [identity.wallProps.join(','), identity.runProp, identity.bigProp, identity.gauntletProp].join('|')
      const family = themeForBg(region.bg).family
      familyKeys.set(family, [...(familyKeys.get(family) ?? []), key])
    }
    for (const [family, keys] of familyKeys) {
      expect(new Set(keys).size, `${family}系統でプロップ構成が重複`).toBe(keys.length)
    }
  })

  it('解決後themeへ4軸すべて適用し、基盤themeの配列を汚染しない', () => {
    for (const region of REGIONS) {
      const base = themeForBg(region.bg)
      const before = [...base.wallProps]
      const resolved = resolveRegionVisual(base, region.id, 'norm', false).theme
      const identity = REGION_IDENTITIES[region.id]
      expect(resolved.wallProps).toEqual(identity.wallProps)
      expect(resolved.runProp).toBe(identity.runProp)
      expect(resolved.bigProp).toBe(identity.bigProp)
      expect(resolved.gauntletProp).toBe(identity.gauntletProp)
      expect(base.wallProps).toEqual(before)
    }
  })

  it('未知地域はnull', () => {
    expect(regionIdentityOf('no_such_region')).toBeNull()
  })
})
