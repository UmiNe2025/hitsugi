import type { Character, EnemyTier, StatKey, Stats } from './types'

const STAT_KEYS: readonly StatKey[] = ['str', 'vit', 'dex', 'agi', 'mnd', 'luk']
export const BATTLE_XP_PER_TIER = 5

function finitePotential(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(120, Math.max(0, value))
    : 0
}

function potentialsOf(character: Pick<Character, 'potential'>): number[] {
  return STAT_KEYS.map((key) => finitePotential(character.potential?.[key]))
}

/** 六資質の全体平均と上位二資質を合わせた、保存しない資質評価。 */
export function aptitudeScore(character: Pick<Character, 'potential'>): number {
  const values = potentialsOf(character)
  const meanAll = values.reduce((sum, value) => sum + value, 0) / values.length
  const top2 = [...values].sort((a, b) => b - a).slice(0, 2)
  const meanTop2 = (top2[0] + top2[1]) / 2
  return Math.round(meanAll * 0.6 + meanTop2 * 0.4)
}

/** 資質評価から導くlevel上限。上限自体はsaveへ重複保存しない。 */
export function levelCap(character: Pick<Character, 'potential'>): number {
  const score = aptitudeScore(character)
  if (score >= 90) return 12
  if (score >= 75) return 11
  if (score >= 60) return 10
  if (score >= 45) return 9
  return 8
}

/** 能力ごとの一level当たり熟達率。 */
export function growthRate(character: Pick<Character, 'potential'>, stat: StatKey): number {
  return 0.8 + 0.7 * (finitePotential(character.potential?.[stat]) / 120)
}

/** 現levelで既に得ている、遺伝しない熟達bonus。 */
export function growthBonus(character: Pick<Character, 'potential' | 'level'>, stat: StatKey): number {
  const level = Number.isFinite(character.level) ? Math.max(1, Math.floor(character.level)) : 1
  return Math.round((level - 1) * growthRate(character, stat))
}

/** 現在の資質上限までに得られる能力別の総熟達量。 */
export function growthCapacity(character: Pick<Character, 'potential'>, stat: StatKey): number {
  return Math.round((levelCap(character) - 1) * growthRate(character, stat))
}

export function xpToNext(level: number): number {
  const normalizedLevel = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1
  return 10 + 4 * normalizedLevel
}

export interface BattleXpContext {
  enemies?: readonly Pick<{ tier: EnemyTier }, 'tier'>[]
  enemyTiers?: readonly EnemyTier[]
  boss?: boolean
  rare?: boolean
  nemesis?: boolean
}

/** 経済補正から独立した、一戦分の確定経験値。 */
export function battleXp(context: BattleXpContext): number {
  const tiers = context.enemyTiers ?? context.enemies?.map((enemy) => enemy.tier) ?? []
  const base = tiers.reduce((sum, tier) => sum + finitePotential(tier) * BATTLE_XP_PER_TIER, 0)
  return Math.round(base)
    + (context.boss ? 20 : 0)
    + (context.rare ? 8 : 0)
    + (context.nemesis ? 8 : 0)
}

type ProgressionCharacter = Pick<Character, 'potential' | 'level' | 'exp' | 'kills' | 'expeditions'>

function normalizeProgression(character: ProgressionCharacter, initialExp: number): { level: number; exp: number } {
  const cap = levelCap(character)
  let level = Number.isFinite(character.level) ? Math.max(1, Math.floor(character.level)) : 1
  let exp = Number.isFinite(initialExp) ? Math.max(0, Math.floor(initialExp)) : 0

  level = Math.min(level, cap)
  while (level < cap && exp >= xpToNext(level)) {
    exp -= xpToNext(level)
    level += 1
  }
  if (level >= cap) exp = 0
  return { level, exp }
}

/** 一戦で複数level上昇を許し、cap到達時の余剰は保持しない。 */
export function grantBattleXp<T extends Character>(character: T, amount: number): T {
  const gained = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0
  const progression = normalizeProgression(character, character.exp + gained)
  return { ...character, ...progression }
}

/**
 * 旧人物はlevel/expの片方でも欠ければ、戦歴から両方を再構築する。
 * 現行人物はovercapと閾値超過の有限整数を同じ規則で正規化する。
 */
export function migrateCharacterProgression<T extends Character>(character: T): T {
  const missingProgression = character.level === undefined || character.exp === undefined
  const legacyXp = (Number.isFinite(character.kills) ? Math.max(0, Math.floor(character.kills)) : 0) * 3
    + (Number.isFinite(character.expeditions) ? Math.max(0, Math.floor(character.expeditions)) : 0) * 4
  const base = missingProgression
    ? { ...character, level: 1, exp: legacyXp }
    : character
  const progression = normalizeProgression(base, base.exp)
  return { ...character, ...progression }
}

/** 能力再計算側が同じ順序を使うための内部正典。 */
export function effectivePotential(character: Pick<Character, 'potential' | 'level'>): Stats {
  return Object.fromEntries(STAT_KEYS.map((key) => [
    key,
    finitePotential(character.potential?.[key]) + growthBonus(character, key),
  ])) as unknown as Stats
}
