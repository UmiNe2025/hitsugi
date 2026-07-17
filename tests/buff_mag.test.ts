import { describe, expect, it } from 'vitest'
import { buffMagFromPower, startBattle, performAction, currentActor, floorFracFromAtk } from '../src/core/battle'
import { Rng } from '../src/core/rng'
import type { BattleState, Combatant } from '../src/core/types'

// M33 ⑬: バフ効果量のpower反映(旧: 固定×1.25/÷1.2でpower無視・大防御48==守り30)と、
// 再付与のmax上書き(青天井の積み重ねexploit封じ = devil HIGH-2)を固定する。
function ally(key: string, skills: string[]): Combatant {
  return {
    key, isAlly: true, name: key, element: 'fire',
    hp: 220, maxHp: 220, mp: 99, maxMp: 99,
    atk: 60, def: 60, matk: 45, mdef: 48, agi: key === 'A' ? 40 : 20, luk: 14,
    skills, row: 'front', guard: false, buffs: {}, chainCount: 0, dmgFloorFrac: floorFracFromAtk(60),
  }
}
function enemy(key: string): Combatant {
  return {
    key, isAlly: false, name: key, element: 'moon',
    hp: 9999, maxHp: 9999, mp: 0, maxMp: 0,
    atk: 1, def: 40, matk: 1, mdef: 40, agi: 1, luk: 1,
    skills: [], row: 'front', guard: false, buffs: {}, chainCount: 0, dmgFloorFrac: floorFracFromAtk(1),
  }
}
// 指定keyの手番まで他者を素手で進めてから action を撃つ(敵atk=1で無害・敵hp9999で戦闘は終わらない)。
function actUntil(st: BattleState, key: string, action: Parameters<typeof performAction>[2], rng: Rng): BattleState {
  let guard = 0
  while (guard++ < 60) {
    const actor = currentActor(st)
    if (!actor || st.phase === 'won' || st.phase === 'lost') break
    const foe = st.enemies.find((e) => e.hp > 0)
    if (actor.key === key) return performAction(st, key, action, rng).state
    st = performAction(st, actor.key, { type: 'attack', targetKey: foe?.key }, rng).state
  }
  return st
}
const defMagOf = (st: BattleState) => st.allies.find((a) => a.key === 'A')!.buffs.defMag

describe('buffMagFromPower — power反映と単調性(M33 ⑬)', () => {
  it('powerに単調増加し、大防御(48)>守り(30)、min/maxでclampする', () => {
    expect(buffMagFromPower(30)).toBeLessThan(buffMagFromPower(48)) // 守り < 大防御(旧は同一だった)
    expect(buffMagFromPower(48)).toBeLessThan(buffMagFromPower(72))
    expect(buffMagFromPower(5)).toBe(0.14) // 下限clamp
    expect(buffMagFromPower(9999)).toBe(0.33) // 上限clamp
  })
})

describe('バフの重ね掛け — max上書きで青天井にならない(M33 ⑬ exploit封じ)', () => {
  it('同じバフを2回掛けても効果量は倍にならない(max上書き=非加算)', () => {
    let st = startBattle([ally('A', ['himamori']), ally('B', ['homura_giri'])], [enemy('E')])
    const rng = new Rng(3)
    st = actUntil(st, 'A', { type: 'skill', skillId: 'himamori' }, rng)
    const mag1 = defMagOf(st)!
    st = actUntil(st, 'A', { type: 'skill', skillId: 'himamori' }, rng) // 次のAの手番で再付与
    const mag2 = defMagOf(st)!
    expect(mag1).toBeCloseTo(buffMagFromPower(30), 5)
    expect(mag2, '2回掛けても効果量は同じ(0.28へ加算されない)').toBeCloseTo(mag1, 5)
  })

  it('強いバフ後に弱いバフを掛けても効果量は下がらない(max上書き)', () => {
    // Aは大防御(gs_earth3=48)と守り(himamori=30)を持つ。強→弱の順で掛ける。
    let st = startBattle([ally('A', ['gs_earth3', 'himamori']), ally('B', ['homura_giri'])], [enemy('E')])
    const rng = new Rng(5)
    st = actUntil(st, 'A', { type: 'skill', skillId: 'gs_earth3' }, rng) // 強(0.216)
    const strong = defMagOf(st)!
    st = actUntil(st, 'A', { type: 'skill', skillId: 'himamori' }, rng) // 弱(0.14)を後掛け
    const after = defMagOf(st)!
    expect(strong, '大防御は守りより強い').toBeCloseTo(buffMagFromPower(48), 5)
    expect(after, '弱いバフの後掛けで既存の強い効果は下がらない').toBeCloseTo(strong, 5)
  })
})
