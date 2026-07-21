import { describe, expect, it } from 'vitest'
import { combatantFromEnemy, enemyAction, performAction, startBattle, type BattleAction } from '../src/core/battle'
import { chooseAutoAction } from '../src/core/auto_battle'
import {
  ENEMY_BEHAVIORS,
  baseBehaviorEnemyId,
  enemyBehaviorCue,
  enemyBehaviorFor,
  upcomingEnemyBehaviorCue,
} from '../src/core/enemy_behaviors'
import { enemyById } from '../src/core/data/enemies'
import { Rng } from '../src/core/rng'
import type { BattleState, Combatant } from '../src/core/types'

function ally(overrides: Partial<Combatant> = {}): Combatant {
  return {
    key: 'ally', isAlly: true, name: '灯', element: 'wind',
    hp: 160, maxHp: 160, mp: 40, maxMp: 40,
    atk: 36, def: 18, matk: 58, mdef: 16, agi: 40, luk: 10,
    skills: ['kazenagi', 'mikagami'], row: 'front', guard: false, buffs: {}, chainCount: 0,
    ...overrides,
  }
}

function battleFor(enemyId: string, turn = 1, member = ally()): BattleState {
  const enemy = combatantFromEnemy(enemyById(enemyId), 0)
  return {
    ...startBattle([member], [enemy]),
    turn,
    order: [member.key, enemy.key],
    orderIndex: 0,
  }
}

function legacyEnemyAction(st: BattleState, actor: Combatant, rng: Rng): BattleAction {
  if (st.morale && rng.chance(0.22)) return { type: 'flee' }
  const alive = st.allies.filter((candidate) => candidate.hp > 0)
  if (alive.length === 0) return { type: 'guard' }
  const front = alive.filter((candidate) => candidate.row === 'front')
  const pool = front.length > 0 && rng.chance(0.7) ? front : alive
  const target = rng.pick(pool)
  if (actor.skills.length > 0 && rng.chance(0.35)) {
    return { type: 'skill', skillId: rng.pick(actor.skills), targetKey: target.key }
  }
  return { type: 'attack', targetKey: target.key }
}

describe('M43 序盤敵の戦闘文法', () => {
  it('12基礎種へ止/受/崩を4種ずつ、2〜3手・固有予告・対処hint付きで定義する', () => {
    expect(ENEMY_BEHAVIORS).toHaveLength(12)
    expect(new Set(ENEMY_BEHAVIORS.map((behavior) => behavior.enemyId)).size).toBe(12)
    expect(ENEMY_BEHAVIORS.reduce<Record<string, number>>((counts, behavior) => {
      counts[behavior.counter] = (counts[behavior.counter] ?? 0) + 1
      return counts
    }, {})).toEqual({ stop: 4, receive: 4, break: 4 })

    for (const behavior of ENEMY_BEHAVIORS) {
      expect(behavior.steps.length).toBeGreaterThanOrEqual(2)
      expect(behavior.steps.length).toBeLessThanOrEqual(3)
      expect(behavior.hint.length).toBeGreaterThan(0)
      expect(behavior.steps.some((step) => step.danger === 'danger')).toBe(true)
      for (const step of behavior.steps) {
        expect(step.tell.length).toBeGreaterThan(0)
        expect(['atk', 'tech', 'aoe']).toContain(step.intent)
        expect(['前列ひとり', '一族ひとり', '一族全体']).toContain(step.target)
      }
      // 報酬・ドロップはmetadataへ持ち込まず、従来の敵定義だけを正とする。
      expect(Object.keys(behavior).sort()).toEqual(['counter', 'enemyId', 'hint', 'steps'])
    }
  })

  it('若・基礎・老で同じ文法を共有し、巡に応じて周期が決定論的に戻る', () => {
    for (const behavior of ENEMY_BEHAVIORS) {
      for (const suffix of ['_w', '', '_o']) {
        expect(baseBehaviorEnemyId(`${behavior.enemyId}${suffix}`)).toBe(behavior.enemyId)
        expect(enemyBehaviorFor(`${behavior.enemyId}${suffix}`)).toBe(behavior)
      }
      const enemy = combatantFromEnemy(enemyById(behavior.enemyId), 0)
      for (let turn = 1; turn <= behavior.steps.length * 2; turn++) {
        const cue = enemyBehaviorCue(enemy, turn)!
        const expected = behavior.steps[(turn - 1) % behavior.steps.length]
        expect(cue.step).toBe(expected)
        const st = { ...battleFor(behavior.enemyId, turn), enemies: [enemy] }
        const action = enemyAction(st, enemy, new Rng(887))
        expect(action.type).toBe(expected.action)
        expect(action.skillId).toBe(expected.skillId)
      }
    }
  })

  it('対象外の通常敵は従来の確率AIと乱数消費まで一致する', () => {
    // 技を持つ非対象種で、通常攻撃・技抽選の両方を通す。
    const st = battleFor('komoriuta_ningyou')
    const enemy = st.enemies[0]
    for (let seed = 1; seed <= 300; seed++) {
      const actualRng = new Rng(seed)
      const expectedRng = new Rng(seed)
      expect(enemyAction(st, enemy, actualRng)).toEqual(legacyEnemyAction(st, enemy, expectedRng))
      expect(actualRng.state()).toBe(expectedRng.state())
    }
  })

  it('今巡すでに動いた素早い敵は、同じ手を再掲せず次巡の兆しを出す', () => {
    const st = battleFor('chochin_kui', 1)
    const enemy = st.enemies[0]
    const afterEnemyTurn = { ...st, order: [enemy.key, st.allies[0].key], orderIndex: 1 }
    expect(enemyBehaviorCue(enemy, 1)!.step.tell).toBe('腹の灯を呑む')
    expect(upcomingEnemyBehaviorCue(afterEnemyTurn, enemy)!.step.tell).toBe('腹灯が弾ける')
  })

  it('受: 危険巡に防御すると全体強手の被害が明確に減る', () => {
    const plain = battleFor('kage_nezumi', 2)
    const guarded = { ...plain, allies: plain.allies.map((member) => ({ ...member, guard: true })) }
    const action = enemyAction(plain, plain.enemies[0], new Rng(91))
    expect(action).toMatchObject({ type: 'skill', skillId: 'e_hoshikui' })

    const unguardedAfter = performAction(plain, plain.enemies[0].key, action, new Rng(21)).state.allies[0]
    const guardedAfter = performAction(guarded, guarded.enemies[0].key, action, new Rng(21)).state.allies[0]
    const plainLoss = plain.allies[0].hp - unguardedAfter.hp
    const guardLoss = guarded.allies[0].hp - guardedAfter.hp
    expect(guardLoss).toBeLessThan(plainLoss)
    expect(guardLoss / plainLoss).toBeLessThan(0.7)
  })

  it('崩: 危険巡に弱点技を当てると構えが崩れ、同じ強手の被害が減る', () => {
    const base = battleFor('naki_ishi', 2)
    const weak = performAction(base, base.allies[0].key, {
      type: 'skill', skillId: 'kazenagi', targetKey: base.enemies[0].key,
    }, new Rng(7))
    const neutral = performAction(base, base.allies[0].key, {
      type: 'skill', skillId: 'mikagami', targetKey: base.enemies[0].key,
    }, new Rng(7))
    expect(weak.entries.some((entry) => entry.text.includes('構えを崩した'))).toBe(true)
    expect(neutral.entries.some((entry) => entry.text.includes('構えを崩した'))).toBe(false)

    const weakEnemy = weak.state.enemies[0]
    const neutralEnemy = neutral.state.enemies[0]
    const weakAction = enemyAction(weak.state, weakEnemy, new Rng(33))
    const neutralAction = enemyAction(neutral.state, neutralEnemy, new Rng(33))
    const weakAfter = performAction(weak.state, weakEnemy.key, weakAction, new Rng(19)).state.allies[0]
    const neutralAfter = performAction(neutral.state, neutralEnemy.key, neutralAction, new Rng(19)).state.allies[0]
    expect(weak.state.allies[0].hp - weakAfter.hp).toBeLessThan(neutral.state.allies[0].hp - neutralAfter.hp)
  })

  it('止: 危険巡に集中した弱点技なら、通常攻撃では残る敵を強手の前に止められる', () => {
    const base = battleFor('chochin_kui', 2)
    const tuned = { ...base, enemies: base.enemies.map((enemy) => ({ ...enemy, hp: 65, maxHp: 65 })) }
    const enemyKey = tuned.enemies[0].key
    const normal = performAction(tuned, tuned.allies[0].key, { type: 'attack', targetKey: enemyKey }, new Rng(5)).state
    const focused = performAction(tuned, tuned.allies[0].key, { type: 'skill', skillId: 'hoshiugachi', targetKey: enemyKey }, new Rng(5)).state
    expect(normal.enemies[0].hp).toBeGreaterThan(0)
    expect(focused.phase).toBe('won')
  })

  it('全オート方針が初見条件なしで兆しへ反応し、温存はMPを使わない', () => {
    const policies = ['economy', 'steady', 'allOut'] as const
    for (const policy of policies) {
      const receive = battleFor('kage_nezumi', 2)
      expect(chooseAutoAction({ battle: receive, actor: receive.allies[0], policy }).category).toBe('telegraph-guard')

      const stop = battleFor('chochin_kui', 2)
      const stopChoice = chooseAutoAction({ battle: stop, actor: stop.allies[0], policy })
      expect(stopChoice.category).toBe('telegraph-stop')
      expect(stopChoice.action.type).toBe(policy === 'economy' ? 'attack' : 'skill')

      const breaking = battleFor('naki_ishi', 2)
      const breakChoice = chooseAutoAction({ battle: breaking, actor: breaking.allies[0], policy })
      if (policy === 'economy') expect(breakChoice.action.type).toBe('attack')
      else expect(breakChoice).toMatchObject({ category: 'telegraph-break', action: { type: 'skill', skillId: 'kazenagi' } })
    }
  })
})
