import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGame } from '../src/core/store'
import { Rng } from '../src/core/rng'
import { enemyById } from '../src/core/data/enemies'

const storage = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, String(value)),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    key: (index: number) => [...storage.keys()][index] ?? null,
    get length() { return storage.size },
  },
})

function enterDungeonBattle(): void {
  const state = useGame.getState()
  const founder = state.data!.family[0]
  state.departDungeon('yoi_forest', [founder.id])
  useGame.setState({ rng: new Rng(4601) })
  useGame.getState().dungeonEncounter(false, false)
  expect(useGame.getState().battleRewardSettlement?.status).toBe('planned')
}

function enterLegacyBattle(regionId = 'yoi_forest', enemyId = 'chochin_kui', type: 'battle' | 'boss' = 'battle'): string {
  const state = useGame.getState()
  const founder = state.data!.family[0]
  state.depart(regionId, [founder.id])
  const data = useGame.getState().data!
  const nodeId = Object.keys(data.expedition!.nodes)[0]
  useGame.setState({
    data: {
      ...data,
      flags: { ...data.flags, reveal_shiori_name: true },
      expedition: {
        ...data.expedition!,
        nodes: {
          ...data.expedition!.nodes,
          [nodeId]: { ...data.expedition!.nodes[nodeId], type, enemyIds: [enemyId] },
        },
      },
    },
  })
  useGame.getState().chooseNode(nodeId)
  expect(useGame.getState().battleRewardSettlement?.status).toBe('planned')
  return nodeId
}

function rewardSnapshot() {
  const state = useGame.getState()
  return {
    data: state.data,
    dungeonRun: state.dungeonRun,
    battle: state.battle,
    battleSequence: state.battleSequence,
    settlement: state.battleRewardSettlement,
    rngState: state.rng.state(),
  }
}

function expectTransitionRewardZero(): void {
  const settlement = useGame.getState().battleRewardSettlement!
  expect(settlement.plan.carried).toEqual({ hoto: 0, ketsu: 0 })
  expect(settlement.plan.immediate).toEqual({ partyXp: 0 })
  expect(settlement.plan.familiarCandidates).toEqual([])
  if (settlement.result) {
    expect(settlement.result.carried).toEqual({ hoto: 0, ketsu: 0, items: [] })
    expect(settlement.result.immediate.partyXp).toBe(0)
    expect(settlement.result.growth).toEqual([])
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
  storage.clear()
  useGame.getState().newGame(false)
})

describe('M46 battle reward settlement', () => {
  it('settles a victory once, remains on battle, then continues once', () => {
    enterDungeonBattle()
    const entered = useGame.getState()
    const plan = entered.battleRewardSettlement!.plan
    const beforeLoot = entered.dungeonRun!.loot
    const founderId = entered.data!.family[0].id

    useGame.setState({ battle: { ...entered.battle!, phase: 'won' } })
    useGame.getState().settleBattleVictory()

    const settled = useGame.getState()
    expect(settled.screen.id).toBe('battle')
    expect(settled.battle?.phase).toBe('won')
    expect(settled.battleRewardSettlement?.status).toBe('settled')
    expect(settled.battleRewardSettlement?.result?.settlementId).toBe(plan.settlementId)
    expect(settled.dungeonRun!.loot.hoto - beforeLoot.hoto).toBe(plan.carried.hoto)
    expect(settled.dungeonRun!.loot.ketsu - beforeLoot.ketsu).toBe(plan.carried.ketsu)
    expect(settled.battleRewardSettlement?.result?.growth.map((growth) => growth.charId)).toContain(founderId)

    const once = {
      loot: settled.dungeonRun!.loot,
      family: settled.data!.family,
      familiars: settled.data!.familiars,
      result: settled.battleRewardSettlement!.result,
    }
    settled.settleBattleVictory()
    const twice = useGame.getState()
    expect(twice.dungeonRun!.loot).toEqual(once.loot)
    expect(twice.data!.family).toEqual(once.family)
    expect(twice.data!.familiars).toEqual(once.familiars)
    expect(twice.battleRewardSettlement!.result).toEqual(once.result)

    twice.continueAfterBattle()
    const continued = useGame.getState()
    expect(continued.screen.id).toBe('dungeon')
    expect(continued.battle).toBeNull()
    expect(continued.battleRewardSettlement?.status).toBe('continued')

    continued.continueAfterBattle()
    expect(useGame.getState().dungeonRun!.loot).toEqual(once.loot)
  })

  it('keeps finishBattle as an idempotent settle-and-continue wrapper', () => {
    enterDungeonBattle()
    const entered = useGame.getState()
    useGame.setState({ battle: { ...entered.battle!, phase: 'won' } })

    useGame.getState().finishBattle()
    const once = useGame.getState()
    const loot = once.dungeonRun!.loot
    expect(once.battle).toBeNull()
    expect(once.battleRewardSettlement?.status).toBe('continued')

    once.finishBattle()
    expect(useGame.getState().dungeonRun!.loot).toEqual(loot)
  })

  it('does not consume XP, familiar RNG, or any reward twice when settle races', () => {
    enterDungeonBattle()
    const entered = useGame.getState()
    const candidates = entered.battleRewardSettlement!.plan.familiarCandidates
    expect(candidates.length).toBeGreaterThan(0)
    const chance = vi.spyOn(entered.rng, 'chance').mockReturnValue(true)
    useGame.setState({ battle: { ...entered.battle!, phase: 'won' } })

    useGame.getState().settleBattleVictory()
    const once = rewardSnapshot()
    const growth = once.settlement!.result!.growth
    expect(growth.length).toBeGreaterThan(0)
    expect(growth[0].afterLevel > growth[0].beforeLevel || growth[0].afterExp > growth[0].beforeExp).toBe(true)
    expect(once.settlement!.result!.immediate.familiars).toHaveLength(candidates.length)
    expect(chance).toHaveBeenCalledTimes(candidates.length)

    useGame.getState().settleBattleVictory()
    expect(rewardSnapshot()).toEqual(once)
    expect(chance).toHaveBeenCalledTimes(candidates.length)
  })

  it('uses one plan for a legacy expedition node through settle and continue', () => {
    const nodeId = enterLegacyBattle()
    const entered = useGame.getState()
    const plan = entered.battleRewardSettlement!.plan
    const beforeLoot = entered.data!.expedition!.loot
    const beforeProgress = entered.data!.family.map(({ id, level, exp }) => ({ id, level, exp }))
    const expected = enemyById('chochin_kui')
    expect(plan.carried).toMatchObject({ hoto: expected.hoto, ketsu: expected.ketsu })

    useGame.setState({ battle: { ...entered.battle!, phase: 'won' } })
    useGame.getState().settleBattleVictory()
    const settled = useGame.getState()
    expect(settled.screen.id).toBe('battle')
    expect(settled.data!.expedition!.loot.hoto - beforeLoot.hoto).toBe(plan.carried.hoto)
    expect(settled.data!.expedition!.loot.ketsu - beforeLoot.ketsu).toBe(plan.carried.ketsu)
    expect(settled.battleRewardSettlement!.result!.immediate.partyXp).toBe(plan.immediate.partyXp)
    expect(settled.data!.family.map(({ id, level, exp }) => ({ id, level, exp }))).not.toEqual(beforeProgress)

    settled.continueAfterBattle()
    const continued = useGame.getState()
    expect(continued.screen.id).toBe('expedition')
    expect(continued.battle).toBeNull()
    expect(continued.data!.expedition!.nodes[nodeId].cleared).toBe(true)
    expect(continued.battleRewardSettlement?.status).toBe('continued')
  })

  it.each(['dungeon', 'legacy'] as const)('replaces zero-reward settlements across Gentou, Shiori, and finale on the %s route', (route) => {
    if (route === 'dungeon') {
      const state = useGame.getState()
      state.departDungeon('akashi_miyama', [state.data!.family[0].id])
      useGame.getState().dungeonEncounter(true, false)
    } else {
      enterLegacyBattle('akashi_miyama', 'boss_gentou', 'boss')
    }

    const gentou = useGame.getState()
    expect(gentou.battle?.enemies.map((enemy) => enemy.enemyId)).toContain('boss_gentou')
    expect(gentou.battleRewardSettlement?.plan.nextPhase).toBe('shiori_duel')
    expectTransitionRewardZero()
    const gentouId = gentou.battleRewardSettlement!.plan.settlementId
    const gentouSequence = gentou.battleSequence

    useGame.setState({ battle: { ...gentou.battle!, phase: 'won' } })
    useGame.getState().settleBattleVictory()
    expectTransitionRewardZero()
    useGame.getState().continueAfterBattle()

    const shiori = useGame.getState()
    expect(shiori.battle?.enemies.map((enemy) => enemy.enemyId)).toContain('boss_shiori')
    expect(shiori.battleRewardSettlement?.status).toBe('planned')
    expect(shiori.battleRewardSettlement?.plan.nextPhase).toBe('finale')
    expect(shiori.battleRewardSettlement?.plan.settlementId).not.toBe(gentouId)
    expect(shiori.battleSequence).toBe(gentouSequence + 1)
    expectTransitionRewardZero()
    const beforeFinale = {
      fame: shiori.data!.fame,
      family: shiori.data!.family.map(({ id, kills, deeds }) => ({ id, kills, deeds })),
    }

    useGame.setState({ battle: { ...shiori.battle!, phase: 'won' } })
    useGame.getState().settleBattleVictory()
    expectTransitionRewardZero()
    useGame.getState().continueAfterBattle()

    const finale = useGame.getState()
    expect(finale.screen.id).toBe('finale')
    expect(finale.battle).toBeNull()
    expect(finale.battleRewardSettlement?.status).toBe('continued')
    expect({
      fame: finale.data!.fame,
      family: finale.data!.family.map(({ id, kills, deeds }) => ({ id, kills, deeds })),
    }).toEqual(beforeFinale)
  })
})
