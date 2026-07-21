import type { BattleState, Combatant, ConsumableStack, Element, Skill } from './types'
import { ELEMENT_ADVANTAGE } from './types'
import type { BattleAction } from './battle'
import { consumableById } from './data/consumables'
import { skillById } from './data/skills'
import type { AutoBattlePolicy } from './settings'

export type AutoActionCategory =
  | 'critical-heal-skill'
  | 'critical-heal-item'
  | 'area-skill'
  | 'weakness-skill'
  | 'power-skill'
  | 'attack'
  | 'guard'

export interface AutoActionChoice {
  action: BattleAction
  reason: string
  category: AutoActionCategory
}

export interface AutoBattleContext {
  battle: BattleState
  actor: Combatant
  policy: AutoBattlePolicy
  consumables?: ConsumableStack[]
}

const CRITICAL_HP_RATIO = 0.35

function safeSkill(id: string): Skill | undefined {
  try {
    return skillById(id)
  } catch {
    return undefined
  }
}

function actualMpCost(actor: Combatant, skill: Skill): number {
  return Math.max(1, Math.ceil(skill.mpCost * (1 - (actor.mpDiscount ?? 0))))
}

function isWeak(element: Element | undefined, target: Combatant): boolean {
  return element !== undefined && ELEMENT_ADVANTAGE[element] === target.element
}

function singleTargetFor(battle: BattleState, foes: Combatant[], skill?: Skill): Combatant {
  if (skill?.element) {
    const weak = foes.find((foe) => isWeak(skill.element, foe))
    if (weak) return weak
  }
  const chained = battle.chainTarget ? foes.find((foe) => foe.key === battle.chainTarget) : undefined
  return chained ?? [...foes].sort((a, b) => a.hp - b.hp)[0]
}

function skillAction(battle: BattleState, foes: Combatant[], skill: Skill): BattleAction {
  return {
    type: 'skill',
    skillId: skill.id,
    targetKey: skill.target === 'enemy' ? singleTargetFor(battle, foes, skill).key : undefined,
  }
}

function regularAttack(battle: BattleState, foes: Combatant[]): AutoActionChoice {
  if (foes.length === 0) {
    return { action: { type: 'guard' }, reason: '攻める相手がいないため身を固める', category: 'guard' }
  }
  const target = singleTargetFor(battle, foes)
  return {
    action: { type: 'attack', targetKey: target.key },
    reason: battle.chainTarget === target.key ? '継足を保って通常攻撃する' : '灯力と道具を使わず攻撃する',
    category: 'attack',
  }
}

function criticalHealing(
  battle: BattleState,
  actor: Combatant,
  consumables: ConsumableStack[],
): AutoActionChoice | undefined {
  const living = battle.allies.filter((ally) => ally.hp > 0)
  const wounded = living
    .filter((ally) => ally.maxHp > 0 && ally.hp / ally.maxHp < CRITICAL_HP_RATIO)
    .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)
  if (wounded.length === 0) return undefined

  const heals = actor.skills
    .map(safeSkill)
    .filter((skill): skill is Skill => !!skill && skill.type === 'heal' && actualMpCost(actor, skill) <= actor.mp)
    .sort((a, b) => {
      const areaA = a.target === 'allies' && wounded.length > 1 ? 1 : 0
      const areaB = b.target === 'allies' && wounded.length > 1 ? 1 : 0
      return areaB - areaA || b.power - a.power || actualMpCost(actor, a) - actualMpCost(actor, b)
    })
  const heal = heals[0]
  if (heal) {
    return {
      action: {
        type: 'skill',
        skillId: heal.id,
        targetKey: heal.target === 'ally' ? wounded[0].key : heal.target === 'self' ? actor.key : undefined,
      },
      reason: `${wounded[0].name}の危機を${heal.name}で立て直す`,
      category: 'critical-heal-skill',
    }
  }

  const stocked = consumables
    .filter((stack) => Number.isFinite(stack.count) && stack.count > 0)
    .map((stack) => ({ stack, def: consumableById(stack.id) }))
    .filter((entry) => entry.def?.effect.stat === 'hp')
    .sort((a, b) => {
      const areaA = a.def!.effect.scope === 'party' && wounded.length > 1 ? 1 : 0
      const areaB = b.def!.effect.scope === 'party' && wounded.length > 1 ? 1 : 0
      return areaB - areaA || a.def!.effect.amount - b.def!.effect.amount
    })
  const item = stocked[0]?.def
  if (!item) return undefined
  return {
    action: {
      type: 'item',
      itemId: item.id,
      targetKey: item.effect.scope === 'one' ? wounded[0].key : undefined,
    },
    reason: `${wounded[0].name}の危機を${item.name}で立て直す`,
    category: 'critical-heal-item',
  }
}

/**
 * 乱数も状態変更も持たず、返したBattleActionはその時点の生存者・MP・在庫で実行できる。
 * economyは技/道具を決して使わず、steadyは生存、allOutは殲滅を優先する。
 */
export function chooseAutoAction(context: AutoBattleContext): AutoActionChoice {
  const { battle, actor, policy } = context
  const foes = battle.enemies.filter((enemy) => enemy.hp > 0)
  if (foes.length === 0 || actor.hp <= 0) return regularAttack(battle, foes)

  if (policy === 'economy') return regularAttack(battle, foes)

  if (policy === 'steady') {
    const healing = criticalHealing(battle, actor, context.consumables ?? [])
    if (healing) return healing

    const attacks = actor.skills
      .map(safeSkill)
      .filter((skill): skill is Skill => !!skill && skill.type === 'attack' && actualMpCost(actor, skill) <= actor.mp)
      .sort((a, b) => {
        const weakA = foes.some((foe) => isWeak(a.element, foe)) ? 1 : 0
        const weakB = foes.some((foe) => isWeak(b.element, foe)) ? 1 : 0
        return weakB - weakA || b.power - a.power || actualMpCost(actor, a) - actualMpCost(actor, b)
      })
    const skill = attacks[0]
    if (!skill) return regularAttack(battle, foes)
    const weak = foes.some((foe) => isWeak(skill.element, foe))
    return {
      action: skillAction(battle, foes, skill),
      reason: weak ? `${skill.name}で弱点を突く` : `使える攻撃技${skill.name}で押す`,
      category: weak ? 'weakness-skill' : 'power-skill',
    }
  }

  const attacks = actor.skills
    .map(safeSkill)
    .filter((skill): skill is Skill => !!skill && skill.type === 'attack' && actualMpCost(actor, skill) <= actor.mp)
    .sort((a, b) => {
      const areaA = a.target === 'enemies' && foes.length > 1 ? 1 : 0
      const areaB = b.target === 'enemies' && foes.length > 1 ? 1 : 0
      const weakA = foes.some((foe) => isWeak(a.element, foe)) ? 1 : 0
      const weakB = foes.some((foe) => isWeak(b.element, foe)) ? 1 : 0
      return areaB - areaA || weakB - weakA || b.power - a.power || actualMpCost(actor, b) - actualMpCost(actor, a)
    })
  const skill = attacks[0]
  if (!skill) return regularAttack(battle, foes)
  const area = skill.target === 'enemies' && foes.length > 1
  const weak = foes.some((foe) => isWeak(skill.element, foe))
  return {
    action: skillAction(battle, foes, skill),
    reason: area ? `${skill.name}で敵陣を一掃する` : weak ? `${skill.name}で弱点へ全力を注ぐ` : `${skill.name}の最大火力を注ぐ`,
    category: area ? 'area-skill' : weak ? 'weakness-skill' : 'power-skill',
  }
}
