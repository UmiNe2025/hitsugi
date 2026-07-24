import { describe, expect, it } from 'vitest'
import {
  createBattleRewardPlan,
  type BattleRewardContext,
  type BattleRewardEnemy,
} from '../src/core/battle_rewards'
import type { Item } from '../src/core/types'

function enemy(
  id: string,
  tier: BattleRewardEnemy['tier'],
  hoto = 2,
  ketsu = 1,
): BattleRewardEnemy {
  return { id, name: `敵-${id}`, tier, hoto, ketsu }
}

const rareDrop: Item = {
  id: 'rare-drop-1',
  baseId: 'katana_1',
  name: '白金の遺物',
  slot: 'weapon',
  generation: 0,
  source: 'rare',
}

describe('M46 createBattleRewardPlan', () => {
  it('現行順の経済倍率を積み、通貨だけを最後に一度丸める', () => {
    const plan = createBattleRewardPlan({
      settlementId: 'dungeon:12',
      enemies: [enemy('a', 2)],
      frantic: true,
      motto: 'shobai',
      golden: true,
      boons: ['fukuun'],
      activeFamiliarElement: 'star',
    })

    expect(plan.settlementId).toBe('dungeon:12')
    expect(plan.modifiers).toEqual([
      { id: 'frantic', label: '熱狂の赤い火', multiplier: 1.5 },
      { id: 'motto_shobai', label: '商売の家訓', multiplier: 1.08 },
      { id: 'golden', label: '金の敵影', multiplier: 2.5 },
      { id: 'boon_fukuun', label: '福運の加護', multiplier: 1.3 },
      { id: 'familiar_star', label: '眷属の福', multiplier: 1.1 },
    ])
    expect(plan.carried).toEqual({ hoto: 12, ketsu: 6 })
    expect(plan.immediate.partyXp).toBe(10)
  })

  it('XPはtier合計とboss/rare/nemesis加算だけで、確定副報酬を分離する', () => {
    const plan = createBattleRewardPlan({
      settlementId: 'nemesis:3',
      enemies: [enemy('a', 2, 10, 2), enemy('b', 4, 20, 3)],
      boss: true,
      rare: true,
      nemesis: true,
      golden: true,
      frantic: true,
      rareDrop,
      fame: 45,
      loreCompletionHoto: 40,
    })

    expect(plan.immediate).toEqual({
      partyXp: 66,
      fame: 45,
      memorialKind: 'nemesis_weapon',
      loreCompletionHoto: 40,
    })
    expect(plan.carried.rareDrop).toBe(rareDrop)
    expect(plan.carried.hoto).toBe(Math.round(30 * 1.5 * 2.5))
    expect(plan.familiarCandidates).toEqual([])
  })

  it('眷属候補を未所持・tier 4以下に絞り、敵出現順で一意化する', () => {
    const plan = createBattleRewardPlan({
      settlementId: 'legacy:node-7',
      enemies: [
        enemy('first', 2),
        enemy('owned', 3),
        enemy('first', 2),
        enemy('boss-tier', 5),
        enemy('last', 4),
      ],
      ownedFamiliarEnemyIds: ['owned'],
    })

    expect(plan.familiarCandidates).toEqual([
      { enemyId: 'first', enemyName: '敵-first', probability: 0.04 },
      { enemyId: 'last', enemyName: '敵-last', probability: 0.04 },
    ])
  })

  it.each([
    ['boss', { boss: true }],
    ['nemesis', { nemesis: true }],
    ['rare', { rare: true }],
  ] as const)('%s戦では眷属候補を作らない', (_label, special) => {
    const plan = createBattleRewardPlan({
      settlementId: `special:${_label}`,
      enemies: [enemy('candidate', 1)],
      ...special,
    })

    expect(plan.familiarCandidates).toEqual([])
  })

  it.each([
    ['shiori_duel', 'gentou'],
    ['finale', 'shiori'],
  ] as const)('%sへの二段遷移は通常報酬を一切予告しない', (nextPhase, enemyId) => {
    const plan = createBattleRewardPlan({
      settlementId: `final:${enemyId}`,
      enemies: [enemy(enemyId, 5, 999, 99)],
      boss: true,
      golden: true,
      rare: true,
      nemesis: true,
      rareDrop,
      fame: 60,
      loreCompletionHoto: 40,
      nextPhase,
    })

    expect(plan).toEqual({
      settlementId: `final:${enemyId}`,
      carried: { hoto: 0, ketsu: 0 },
      immediate: { partyXp: 0 },
      modifiers: [],
      familiarCandidates: [],
      nextPhase,
    })
  })

  it('同じ共通contextから副作用なしに同じplanを生成する', () => {
    const context: BattleRewardContext = {
      settlementId: 'shared:42',
      enemies: [enemy('a', 1), enemy('b', 3)],
      ownedFamiliarEnemyIds: [],
      boons: ['fukuun'],
    }
    const snapshot = structuredClone(context)

    expect(createBattleRewardPlan(context)).toEqual(createBattleRewardPlan(context))
    expect(context).toEqual(snapshot)
  })
})
