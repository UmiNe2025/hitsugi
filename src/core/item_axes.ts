// M22 P0-2: 装備の5軸(部位/品質/希少度/入手由来/継承)の導出規則 — 単一情報源。
// 正典: docs/GDD_v3.md §8.8。表示専用の分類であり、戦闘計算・入手率・価格には影響しない。
// 品質/希少度はItemへ格納せず描画時に導出する(旧セーブの品も同じ規則で分類される)。
import type { Item, ItemSlot, ItemSource, Stats } from './types'
import { itemBaseById } from './data/items'

// ---- 部位(字印) ----
export const SLOT_MARKS: Record<ItemSlot, string> = { weapon: '武', armor: '防', charm: '飾' }

// ---- 品質 — 物の格。ItemBaseのshopTier帯から導出(shopTierそのものは見せない) ----
export type QualityKey = 'q0' | 'q1' | 'q2' | 'q3' | 'q4'
const QUALITY_STEPS: { max: number; key: QualityKey; name: string }[] = [
  { max: 2, key: 'q0', name: '粗末' },
  { max: 5, key: 'q1', name: '良品' },
  { max: 9, key: 'q2', name: '名品' },
  { max: 12, key: 'q3', name: '秘宝' },
  { max: Infinity, key: 'q4', name: '神器' },
]

export function qualityOf(baseId: string): { key: QualityKey; name: string } | null {
  let tier: number
  try {
    tier = itemBaseById(baseId).shopTier
  } catch {
    return null // 不明なbaseId(将来のデータ削除など)は分類しない
  }
  const step = QUALITY_STEPS.find((s) => tier <= s.max)!
  return { key: step.key, name: step.name }
}

// ---- 希少度 — 世に出回る数。品質(tier)とは独立に、産地と継承で駆動する ----
// 基礎位: 見世=並 / 夜藪の拾得=稀 / 主・宿敵=逸 / 神授=伝。
// 形見(legacyOf)で一段、代重ね(generation>=3)でさらに一段深まる(上限=伝)。
export type RarityKey = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
export const RARITY_LABELS: Record<RarityKey, string> = {
  common: '並', uncommon: '稀', rare: '逸', epic: '秘', legendary: '伝',
}
const RARITY_STEPS: { key: RarityKey; name: string }[] = (
  ['common', 'uncommon', 'rare', 'epic', 'legendary'] as RarityKey[]
).map((key) => ({ key, name: RARITY_LABELS[key] }))
const SOURCE_RANK: Record<ItemSource, number> = { shop: 0, chest: 1, boss: 2, divine: 4 }

export const SOURCE_LABELS: Record<ItemSource, string> = {
  shop: '見世で購うた品',
  chest: '夜藪で拾うた品',
  boss: '主を鎮めて得た品',
  divine: '神より授かった品',
}
export const UNKNOWN_SOURCE_LABEL = '古くから家にある品'

export function rarityOf(it: Pick<Item, 'source' | 'generation' | 'legacyOf'>): { key: RarityKey; name: string } {
  let r = SOURCE_RANK[it.source ?? 'shop'] // 由来の記録がない旧品は並から数える
  if (it.legacyOf) r += 1
  if (it.generation >= 3) r += 1
  return RARITY_STEPS[Math.min(RARITY_STEPS.length - 1, r)]
}

export function sourceLabelOf(it: Pick<Item, 'source'>): string {
  return it.source ? SOURCE_LABELS[it.source] : UNKNOWN_SOURCE_LABEL
}

// ---- 装備差分 — 攻/防と六能力(statBonus)を軸別に返す。単一スカラーで優劣を決めない ----
type Comparable = { atk?: number; def?: number; statBonus?: Partial<Stats> }

export interface ItemDiff {
  dAtk: number
  dDef: number
  dStats: Partial<Record<keyof Stats, number>>
  same: boolean // 全軸差なし
  strictlyBetter: boolean // 全軸で下がらず、少なくとも一軸で上がる(薦)
}

export function diffItems(cur: Comparable | undefined, next: Comparable): ItemDiff {
  const dAtk = (next.atk ?? 0) - (cur?.atk ?? 0)
  const dDef = (next.def ?? 0) - (cur?.def ?? 0)
  const keys = new Set<keyof Stats>([
    ...(Object.keys(next.statBonus ?? {}) as (keyof Stats)[]),
    ...(Object.keys(cur?.statBonus ?? {}) as (keyof Stats)[]),
  ])
  const dStats: Partial<Record<keyof Stats, number>> = {}
  for (const k of keys) {
    const d = (next.statBonus?.[k] ?? 0) - (cur?.statBonus?.[k] ?? 0)
    if (d !== 0) dStats[k] = d
  }
  const statVals = Object.values(dStats) as number[]
  const same = dAtk === 0 && dDef === 0 && statVals.length === 0
  const strictlyBetter = !same && dAtk >= 0 && dDef >= 0 && statVals.every((v) => v >= 0)
  return { dAtk, dDef, dStats, same, strictlyBetter }
}
