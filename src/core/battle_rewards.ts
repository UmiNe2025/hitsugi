import type { Item } from './types'
import { battleXp } from './character_progression'

export const FAMILIAR_RECRUIT_PROBABILITY = 0.04 as const

export type BattleRewardEnemyTier = 1 | 2 | 3 | 4 | 5
export type BattleRewardNextPhase = 'shiori_duel' | 'finale'

export interface BattleRewardEnemy {
  id: string
  name: string
  tier: BattleRewardEnemyTier
  hoto: number
  ketsu: number
}

export interface BattleRewardModifier {
  id: string
  label: string
  multiplier?: number
}

export interface FamiliarCandidate {
  enemyId: string
  enemyName: string
  probability: typeof FAMILIAR_RECRUIT_PROBABILITY
}

export interface BattleRewardPlan {
  settlementId: string
  carried: {
    hoto: number
    ketsu: number
    rareDrop?: Item
  }
  immediate: {
    partyXp: number
    fame?: number
    memorialKind?: 'nemesis_weapon'
    loreCompletionHoto?: number
  }
  modifiers: BattleRewardModifier[]
  familiarCandidates: FamiliarCandidate[]
  nextPhase?: BattleRewardNextPhase
}

/**
 * Inputs shared by the walking dungeon and the legacy expedition path.
 * Encounter construction and settlement stay outside this pure calculation.
 */
export interface BattleRewardContext {
  settlementId: string
  enemies: readonly BattleRewardEnemy[]
  ownedFamiliarEnemyIds?: readonly string[]
  boss?: boolean
  rare?: boolean
  nemesis?: boolean
  golden?: boolean
  frantic?: boolean
  motto?: 'budan' | 'gakumon' | 'shinjin' | 'shobai'
  boons?: readonly string[]
  activeFamiliarElement?: string
  rareDrop?: Item
  fame?: number
  loreCompletionHoto?: number
  nextPhase?: BattleRewardNextPhase
}

const ECONOMIC_MODIFIERS: ReadonlyArray<{
  id: string
  label: string
  multiplier: number
  enabled: (context: BattleRewardContext) => boolean
}> = [
  {
    id: 'frantic',
    label: '熱狂の赤い火',
    multiplier: 1.5,
    enabled: (context) => context.frantic === true,
  },
  {
    id: 'motto_shobai',
    label: '商売の家訓',
    multiplier: 1.08,
    enabled: (context) => context.motto === 'shobai',
  },
  {
    id: 'golden',
    label: '金の敵影',
    multiplier: 2.5,
    enabled: (context) => context.golden === true,
  },
  {
    id: 'boon_fukuun',
    label: '福運の加護',
    multiplier: 1.3,
    enabled: (context) => context.boons?.includes('fukuun') === true,
  },
  {
    id: 'familiar_star',
    label: '眷属の福',
    multiplier: 1.1,
    enabled: (context) => context.activeFamiliarElement === 'star',
  },
]

function phaseTransitionPlan(context: BattleRewardContext): BattleRewardPlan {
  return {
    settlementId: context.settlementId,
    carried: { hoto: 0, ketsu: 0 },
    immediate: { partyXp: 0 },
    modifiers: [],
    familiarCandidates: [],
    nextPhase: context.nextPhase,
  }
}

export function createBattleRewardPlan(context: BattleRewardContext): BattleRewardPlan {
  // 玄冬→汐里 and 汐里→finale are transitions, not reward-bearing victories.
  if (context.nextPhase !== undefined) return phaseTransitionPlan(context)

  const modifiers = ECONOMIC_MODIFIERS
    .filter((modifier) => modifier.enabled(context))
    .map(({ id, label, multiplier }) => ({ id, label, multiplier }))
  const lootMultiplier = modifiers.reduce(
    (product, modifier) => product * (modifier.multiplier ?? 1),
    1,
  )

  const baseHoto = context.enemies.reduce((sum, enemy) => sum + enemy.hoto, 0)
  const baseKetsu = context.enemies.reduce((sum, enemy) => sum + enemy.ketsu, 0)
  const rare = context.rare === true || context.rareDrop !== undefined

  const carried: BattleRewardPlan['carried'] = {
    hoto: Math.round(baseHoto * lootMultiplier),
    ketsu: Math.round(baseKetsu * lootMultiplier),
    ...(context.rareDrop === undefined ? {} : { rareDrop: context.rareDrop }),
  }
  const immediate: BattleRewardPlan['immediate'] = {
    partyXp: battleXp({ enemies: context.enemies, boss: context.boss, rare, nemesis: context.nemesis }),
    ...(context.fame === undefined ? {} : { fame: context.fame }),
    ...(context.nemesis ? { memorialKind: 'nemesis_weapon' as const } : {}),
    ...(context.loreCompletionHoto === undefined
      ? {}
      : { loreCompletionHoto: context.loreCompletionHoto }),
  }

  const familiarCandidates: FamiliarCandidate[] = []
  if (!context.boss && !context.nemesis && !rare) {
    const owned = new Set(context.ownedFamiliarEnemyIds ?? [])
    const uniqueEnemies = new Map<string, BattleRewardEnemy>()
    for (const enemy of context.enemies) {
      if (enemy.tier < 5 && !owned.has(enemy.id) && !uniqueEnemies.has(enemy.id)) {
        uniqueEnemies.set(enemy.id, enemy)
      }
    }
    for (const enemy of uniqueEnemies.values()) {
      familiarCandidates.push({
        enemyId: enemy.id,
        enemyName: enemy.name,
        probability: FAMILIAR_RECRUIT_PROBABILITY,
      })
    }
  }

  return {
    settlementId: context.settlementId,
    carried,
    immediate,
    modifiers,
    familiarCandidates,
  }
}
