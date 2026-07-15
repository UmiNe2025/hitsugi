// M27: 既存の金影(全floorの18%)を「金影13% + 稀相5%」へ分ける。
// 特殊影の総率と通貨2.5倍は変えず、稀相だけが帰還まで失い得る遺物を確定で残す。
import type { Element, EnemyDef, Item, ItemSlot } from './types'
import type { Rng } from './rng'
import { ENEMIES } from './data/enemies'
import { ITEM_BASES, makeItem } from './data/items'
import { REGIONS, regionById } from './data/regions'
import { regionVisualOf, type ParticleKind } from './data/region_visuals'

export const SPECIAL_SHADE_RATE = 0.18
export const RARE_SHADE_RATE = 0.05
export const GOLDEN_SHADE_RATE = SPECIAL_SHADE_RATE - RARE_SHADE_RATE
export const RARE_WITHIN_SPECIAL_RATE = RARE_SHADE_RATE / SPECIAL_SHADE_RATE

export type SpecialEncounterKind = 'golden' | 'rare'

export interface RareEncounter {
  markId: string
  markTitle: string
  regionId: string
  enemyId: string
  enemyName: string
  drop: Item
}

export interface RareEncounterRoll {
  enemy: EnemyDef
  encounter: RareEncounter
}

interface RareMark {
  id: string
  title: string
  element: Element
  relicSuffix: string
  slots: ItemSlot[]
  intro: string
}

const MARKS: Record<ParticleKind, RareMark> = {
  firefly: {
    id: 'toukan', title: '灯冠', element: 'fire', relicSuffix: '蛍環', slots: ['charm', 'weapon'],
    intro: '群れる灯が一つの冠を結び、古強者の影へ降りた。',
  },
  rain: {
    id: 'sakaame', title: '逆雨', element: 'water', relicSuffix: '逆潮', slots: ['charm', 'armor'],
    intro: '雨粒が地から空へ逆巻き、その中心で魔性が輪郭を得る。',
  },
  ash: {
    id: 'haibara', title: '灰祓', element: 'earth', relicSuffix: '灰祓', slots: ['weapon', 'armor'],
    intro: '静かな灰が影だけを避け、祓えぬ古傷を露わにした。',
  },
  fog: {
    id: 'kirigakure', title: '霧隠', element: 'moon', relicSuffix: '霧隠', slots: ['charm', 'armor'],
    intro: '霧が一度だけ割れ、夜に隠されていた古い影が現れる。',
  },
  pollen: {
    id: 'hanamatsuri', title: '花葬', element: 'wind', relicSuffix: '花葬', slots: ['charm', 'weapon'],
    intro: '漂う胞子が葬列のように揃い、魔性の周囲を巡り始める。',
  },
  stardust: {
    id: 'hoshishizuku', title: '星滴', element: 'star', relicSuffix: '星滴', slots: ['weapon', 'charm'],
    intro: '消えかけた星屑が一体へ集まり、白金の脈を灯した。',
  },
}

export function classifySpecialEncounter(rng: Pick<Rng, 'next'>): SpecialEncounterKind {
  return rng.next() < RARE_WITHIN_SPECIAL_RATE ? 'rare' : 'golden'
}

export function specialShadeUsedKey(floor: number): string {
  return `shade-special:${floor}`
}

export function rareMarkForRegion(regionId: string): RareMark {
  const particle = regionVisualOf(regionId)?.particleKind ?? 'firefly'
  return MARKS[particle]
}

function rewardTier(regionId: string): number {
  const index = Math.max(0, REGIONS.findIndex((r) => r.id === regionId))
  // 最初の地でも店より一段上、終盤は最上位。常夜百層は最上位へ丸める。
  return Math.min(14, 1 + Math.floor(index * 14 / Math.max(1, REGIONS.length - 1)))
}

export function createRareEncounter(regionId: string, rng: Pick<Rng, 'next' | 'pick'>): RareEncounterRoll {
  const region = regionById(regionId)
  const mark = rareMarkForRegion(regionId)
  const tierPool = ENEMIES.filter((e) => e.tier === region.tier && !e.id.startsWith('boss_'))
  if (tierPool.length === 0) throw new Error(`rare encounter has no enemy pool: ${regionId}`)

  const sameElement = tierPool.filter((e) => e.element === mark.element)
  const elementalPool = sameElement.length > 0 ? sameElement : tierPool
  // 老成変異の専用絵を優先する。tier1など該当がない時は通常個体へ安全に退避。
  const oldPool = elementalPool.filter((e) => e.id.endsWith('_o'))
  const base = rng.pick(oldPool.length > 0 ? oldPool : elementalPool)
  const enemyName = `稀相・${mark.title}の${base.name}`
  const enemy: EnemyDef = {
    ...base,
    name: enemyName,
    hp: Math.round(base.hp * 1.55),
    atk: Math.round(base.atk * 1.25),
    def: Math.round(base.def * 1.2),
    agi: Math.round(base.agi * 1.08),
    desc: `${mark.intro}${base.desc}`,
  }

  const tier = rewardTier(regionId)
  const preferred = ITEM_BASES.filter((item) => item.shopTier === tier && mark.slots.includes(item.slot))
  const fallback = ITEM_BASES.filter((item) => item.shopTier === tier)
  const rewardBase = rng.pick(preferred.length > 0 ? preferred : fallback)
  const raw = makeItem(rewardBase.baseId, 'rare')
  const drop: Item = {
    ...raw,
    name: `${raw.name}・${mark.relicSuffix}`,
    rareOrigin: enemyName,
  }

  return {
    enemy,
    encounter: {
      markId: mark.id,
      markTitle: mark.title,
      regionId,
      enemyId: base.id,
      enemyName,
      drop,
    },
  }
}

export function rareVictoryFlag(markId: string): string {
  return `rareDefeat_${markId}`
}

export function rareVictoryLog(encounter: RareEncounter): string {
  return `【稀相遺物】${encounter.drop.name}を得た。帰還するまで蔵には収まらない。`
}
