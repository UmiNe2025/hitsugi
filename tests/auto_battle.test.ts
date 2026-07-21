import { beforeEach, describe, expect, it, vi } from 'vitest'
import { chooseAutoAction } from '../src/core/auto_battle'
import { performAction } from '../src/core/battle'
import type { BattleState, Combatant } from '../src/core/types'
import { Rng } from '../src/core/rng'
import {
  DEFAULT_AUTO_POLICY_SETTINGS,
  getAutoBattleDefault,
  getAutoPolicySettings,
  setAutoBattleDefault,
  setAutoPolicySettings,
} from '../src/core/settings'

class MemStorage implements Storage {
  private data = new Map<string, string>()
  get length() { return this.data.size }
  clear() { this.data.clear() }
  getItem(key: string) { return this.data.get(key) ?? null }
  key(index: number) { return [...this.data.keys()][index] ?? null }
  removeItem(key: string) { this.data.delete(key) }
  setItem(key: string, value: string) { this.data.set(key, value) }
}

function unit(overrides: Partial<Combatant> = {}): Combatant {
  return {
    key: 'ally_a', isAlly: true, name: '灯', element: 'fire', hp: 100, maxHp: 100,
    mp: 20, maxMp: 20, atk: 50, def: 20, matk: 45, mdef: 20, agi: 20, luk: 10,
    skills: [], row: 'front', guard: false, buffs: {}, chainCount: 0,
    ...overrides,
  }
}

function state(actor: Combatant, allies: Combatant[] = [actor], enemies?: Combatant[]): BattleState {
  const foes = enemies ?? [unit({ key: 'enemy_a', isAlly: false, name: '魔性', element: 'wind', hp: 100, maxHp: 100 })]
  return {
    allies,
    enemies: foes,
    turn: 1,
    order: [actor.key, ...foes.map((foe) => foe.key)],
    orderIndex: 0,
    log: [],
    phase: 'input',
    chain: 0,
  }
}

describe('auto policy settings', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemStorage())
  })

  it('has four opt-in stops disabled and does not change the existing auto default', () => {
    setAutoBattleDefault(true)
    expect(getAutoPolicySettings()).toEqual(DEFAULT_AUTO_POLICY_SETTINGS)
    expect(Object.values(getAutoPolicySettings().stops)).toEqual([false, false, false, false])
    expect(getAutoBattleDefault()).toBe(true)

    setAutoPolicySettings({
      version: 1,
      policy: 'allOut',
      stops: { hpDanger: true, newDiscovery: false, rareEnemy: true, boss: false },
    })
    expect(getAutoPolicySettings()).toMatchObject({ policy: 'allOut', stops: { hpDanger: true, rareEnemy: true } })
    expect(getAutoBattleDefault()).toBe(true)
  })

  it('falls back safely for malformed, incomplete, or future-version storage', () => {
    for (const raw of ['{', '{}', '{"version":2,"policy":"allOut","stops":{}}', '{"version":1,"policy":"bad","stops":{}}']) {
      localStorage.setItem('hitsugi_auto_policy', raw)
      expect(getAutoPolicySettings()).toEqual(DEFAULT_AUTO_POLICY_SETTINGS)
    }
  })
})

describe('chooseAutoAction', () => {
  it('economy never spends MP or inventory, even during a critical HP state', () => {
    const actor = unit({ hp: 20, skills: ['koyashi', 'enbu'] })
    const battle = state(actor)
    const choice = chooseAutoAction({
      battle,
      actor,
      policy: 'economy',
      consumables: [{ id: 'araigusa', count: 2 }],
    })
    expect(choice.category).toBe('attack')
    expect(choice.action).toEqual({ type: 'attack', targetKey: 'enemy_a' })
  })

  it('steady uses an affordable healing skill before a stocked item and targets the worst living ally', () => {
    const actor = unit({ skills: ['koyashi'] })
    const wounded = unit({ key: 'ally_b', name: '傷ついた灯', hp: 10, maxHp: 100 })
    const battle = state(actor, [actor, wounded])
    const choice = chooseAutoAction({ battle, actor, policy: 'steady', consumables: [{ id: 'bankin_kou', count: 1 }] })
    expect(choice.category).toBe('critical-heal-skill')
    expect(choice.action).toEqual({ type: 'skill', skillId: 'koyashi', targetKey: wounded.key })

    const executed = performAction(battle, actor.key, choice.action, new Rng(7))
    expect(executed.state.allies.find((ally) => ally.key === wounded.key)!.hp).toBeGreaterThan(wounded.hp)
    expect(executed.entries.some((entry) => entry.text.includes('灯力が足りない'))).toBe(false)
  })

  it('steady falls back to a real stocked HP item when healing skills are unaffordable', () => {
    const actor = unit({ mp: 0, skills: ['koyashi'] })
    const wounded = unit({ key: 'ally_b', hp: 20, maxHp: 100 })
    const battle = state(actor, [actor, wounded])
    const choice = chooseAutoAction({
      battle,
      actor,
      policy: 'steady',
      consumables: [{ id: 'araigusa', count: 0 }, { id: 'neri_kou', count: 1 }],
    })
    expect(choice.category).toBe('critical-heal-item')
    expect(choice.action).toEqual({ type: 'item', itemId: 'neri_kou', targetKey: wounded.key })
  })

  it('steady prefers a weak-point skill and never targets a defeated combatant', () => {
    const actor = unit({ skills: ['homura_giri', 'mikagami'] })
    const dead = unit({ key: 'enemy_dead', isAlly: false, hp: 0, element: 'wind' })
    const live = unit({ key: 'enemy_live', isAlly: false, hp: 80, element: 'wind' })
    const battle = state(actor, [actor], [dead, live])
    const choice = chooseAutoAction({ battle, actor, policy: 'steady' })
    expect(choice.category).toBe('weakness-skill')
    expect(choice.action).toEqual({ type: 'skill', skillId: 'homura_giri', targetKey: live.key })
  })

  it('allOut prioritizes an executable multi-target skill and respects discounted actual MP cost', () => {
    const actor = unit({ mp: 5, mpDiscount: 0.5, skills: ['enbu', 'g_hokushin', 'homura_giri'] })
    const foes = [
      unit({ key: 'enemy_a', isAlly: false, hp: 100, element: 'wind' }),
      unit({ key: 'enemy_b', isAlly: false, hp: 100, element: 'water' }),
    ]
    const battle = state(actor, [actor], foes)
    const choice = chooseAutoAction({ battle, actor, policy: 'allOut' })
    expect(choice.category).toBe('area-skill')
    expect(choice.action).toEqual({ type: 'skill', skillId: 'enbu', targetKey: undefined })

    const executed = performAction(battle, actor.key, choice.action, new Rng(11))
    expect(executed.entries.some((entry) => entry.text.includes('灯力が足りない'))).toBe(false)
    expect(executed.state.enemies.every((foe, index) => foe.hp < foes[index].hp)).toBe(true)
  })
})
