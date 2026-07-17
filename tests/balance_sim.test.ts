// M28-B: 戦闘バランスのシミュレーション実測(devil規律=推測でなく数値・忠実harness)。
// 既存 battle 関数を headless で回す。player policy = 常時通常攻撃(=オート/最弱プレイ)。
// enemy = 実 enemyAction。narrative易化(敵atk/hp×0.78)を再現。指標に「瀕死率」を含む。
// ボス安全表(devil必須): 下限導入がボス戦を破綻(勝てない)させないことを確認する。
import { describe, expect, it } from 'vitest'
import { combatantFromEnemy, currentActor, enemyAction, floorFracFromAtk, performAction, startBattle } from '../src/core/battle'
import { skillById } from '../src/core/data/skills'
import { ENEMIES, enemyById } from '../src/core/data/enemies'
import { Rng } from '../src/core/rng'
import type { BattleAction, BattleState, Combatant, EnemyDef } from '../src/core/types'

type Row = 'front' | 'back'
function ally(name: string, atk: number, def: number, hp: number, agi: number, row: Row, mp = 45, skills: string[] = []): Combatant {
  return {
    key: name, isAlly: true, name, element: 'fire',
    hp, maxHp: hp, mp, maxMp: mp,
    atk, def, matk: Math.round(atk * 0.75), mdef: Math.round(def * 0.8), agi, luk: 14,
    skills, row, guard: false, buffs: {}, chainCount: 0, dmgFloorFrac: floorFracFromAtk(atk), // 実 combatantFromChar と同一
  }
}
// 代表party: 素手gen1(序盤) / 装備gen3(中盤) / 精鋭gen6(ボス到達時・devil worst def~120)
const earlyParty = (): Combatant[] => [ally('当主', 38, 23, 137, 34, 'front'), ally('二人目', 34, 20, 130, 30, 'front'), ally('三人目', 30, 18, 120, 28, 'back')]
// M33: 現実policy用に、精鋭PTへ「大防御(def48)/攻撃バフ/回復/攻撃技」を持たせる。
// attack固定policy(既存テスト)では skills は未使用なので、既存の「ボス安全表」結果には影響しない。
const bossParty = (): Combatant[] => [
  ally('当主', 72, 92, 210, 30, 'front', 90, ['gs_earth3', 'homura_giri']), // 大防御(power48) + 攻撃
  ally('二人目', 66, 78, 195, 28, 'front', 90, ['kien', 'homura_giri']),      // 攻撃バフ(power30) + 攻撃
  ally('三人目', 60, 70, 180, 26, 'back', 90, ['koyashi', 'homura_giri']),    // 回復(130) + 攻撃
  ally('四人目', 58, 66, 175, 32, 'back', 80, ['homura_giri']),
]

// M33: 現実的な味方policy — 「瀕死なら回復 / 未バフならバフ / それ以外は最強攻撃技 or 素手」。
// これで ⑬(バフ効果量のpower反映)が sim の勝敗・被HP・瀕死率へ反映される(旧attack固定では不可視)。
function smartAllyAction(st: BattleState, actor: Combatant): BattleAction {
  const foe = st.enemies.find((e) => e.hp > 0)
  if (!foe) return { type: 'attack' }
  const my = actor.skills.map((id) => skillById(id))
  // 1. 瀕死(<40%)の味方がいて回復技が撃てる
  const wounded = st.allies.filter((a) => a.hp > 0 && a.hp < a.maxHp * 0.4).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]
  const heal = my.find((s) => s.type === 'heal' && actor.mp >= s.mpCost)
  if (wounded && heal) return { type: 'skill', skillId: heal.id, targetKey: heal.target === 'ally' ? wounded.key : undefined }
  // 2. 自分が未バフでバフ技が撃てる(序盤に一度)
  const buff = my.find((s) => s.type === 'buff' && actor.mp >= s.mpCost)
  const buffed = buff && (buff.buffKind === 'def' ? actor.buffs.defMag : actor.buffs.atkMag)
  if (buff && !buffed) return { type: 'skill', skillId: buff.id }
  // 3. 最強の単体攻撃技 or 素手
  const atk = my.filter((s) => s.type === 'attack' && s.target === 'enemy' && actor.mp >= s.mpCost).sort((a, b) => b.power - a.power)[0]
  if (atk) return { type: 'skill', skillId: atk.id, targetKey: foe.key }
  return { type: 'attack', targetKey: foe.key }
}

const TIER1_BASE = ENEMIES.filter((e) => e.tier === 1 && !e.id.startsWith('boss_') && !/_[wo]$/.test(e.id))
// 探索用: hpMul/atkMul で敵の生存力・打点を試す(採用値は combatantFromEnemy へ焼く)
let HP_MUL = 1, ATK_MUL = 1
function eased(e: EnemyDef, ease: number): EnemyDef {
  return { ...e, atk: Math.round(e.atk * ease * ATK_MUL), hp: Math.round(e.hp * ease * HP_MUL) }
}

interface SimResult { won: boolean; rounds: number; allyHpLossPct: number; nearDeath: boolean }
function simBattle(party: Combatant[], enemies: Combatant[], rng: Rng, smart = false): SimResult {
  let st: BattleState = startBattle(party.map((c) => ({ ...c })), enemies.map((c) => ({ ...c })))
  const initHp = st.allies.reduce((s, a) => s + a.maxHp, 0)
  let nearDeath = false
  let guard = 0
  while ((st.phase === 'input' || st.phase === 'anim') && guard < 300) {
    const actor = currentActor(st)
    if (!actor) break
    if (actor.isAlly) {
      const foe = st.enemies.find((e) => e.hp > 0)
      if (!foe) break
      const action: BattleAction = smart ? smartAllyAction(st, actor) : { type: 'attack', targetKey: foe.key }
      st = performAction(st, actor.key, action, rng).state
    } else {
      st = performAction(st, actor.key, enemyAction(st, actor, rng), rng).state
    }
    if (st.allies.some((a) => a.hp > 0 && a.hp < a.maxHp * 0.3)) nearDeath = true
    guard++
  }
  const finalHp = st.allies.reduce((s, a) => s + a.hp, 0)
  return { won: st.phase === 'won' || st.phase === 'fled', rounds: guard, allyHpLossPct: ((initHp - finalHp) / initHp) * 100, nearDeath }
}

function agg(n: number, make: (rng: Rng) => { party: Combatant[]; enemies: Combatant[] }, smart = false) {
  let wins = 0, roundsSum = 0, lossSum = 0, near = 0
  for (let s = 1; s <= n; s++) {
    const setup = make(new Rng(s * 40503))
    const r = simBattle(setup.party, setup.enemies, new Rng(s * 2654435761), smart)
    if (r.won) wins++
    roundsSum += r.rounds; lossSum += r.allyHpLossPct; if (r.nearDeath) near++
  }
  return { winRate: wins / n, avgRounds: roundsSum / n, avgHpLossPct: lossSum / n, nearDeathRate: near / n }
}

const report = (label: string, a: ReturnType<typeof agg>) =>
  console.log(`[balance] ${label}: 勝率${(a.winRate * 100).toFixed(0)}% 行動${a.avgRounds.toFixed(1)} 被HP${a.avgHpLossPct.toFixed(1)}% 瀕死${(a.nearDeathRate * 100).toFixed(0)}%`)

const BOSSES: [string, EnemyDef][] = [
  ['苔ノ主(序ボス)', enemyById('boss_kokenushi')],
  ['骸星大熊(終盤)', enemyById('boss_hoshimukuro')],
  ['合成玄冬(atk85/hp2400)', { ...enemyById('boss_hoshimukuro'), id: 'boss_gentou_sim', name: '玄冬', hp: 2400, atk: 85, def: 40, agi: 26 }],
]

describe('M28-B 戦闘バランス実測(忠実harness)', () => {
  it('序盤tier1: 手応え導入(被HP有意)かつ勝てる', () => {
    HP_MUL = 1; ATK_MUL = 1 // enemyPowerはcombatantFromEnemyへ焼いたので harness側は素通し
    const results: Record<string, ReturnType<typeof agg>> = {}
    for (const ease of [1, 0.78]) {
      for (const n of [2, 3]) {
        const a = agg(400, (rng) => ({
          party: earlyParty(),
          enemies: Array.from({ length: n }, (_, i) => combatantFromEnemy(eased(rng.pick(TIER1_BASE), ease), i)),
        }))
        results[`${n}_${ease}`] = a
        report(`序盤 敵${n}体 ${ease === 1 ? '宿命' : '語り部'}`, a)
      }
    }
    // 受入: 宿命モードで「1-2撃勝ち・被弾1固定」を是正(旧値は被HP<2%・行動<6)。過剰化(全滅)もしない。
    expect(results['3_1'].winRate).toBe(1) // 序盤3体でも worst-play(オート)で必ず勝てる
    expect(results['3_1'].avgHpLossPct).toBeGreaterThan(5) // 手応え: 3体で被HP>5%(旧≈1%)
    expect(results['2_1'].avgHpLossPct).toBeGreaterThan(2) // 2体でも被弾する
    expect(results['3_1'].avgRounds).toBeGreaterThan(9) // 1-2撃で終わらない
    expect(results['2_1'].winRate).toBe(1)
  })

  it('ボス安全表: 下限導入が実ボスを破綻させない(devil必須)', () => {
    HP_MUL = 1; ATK_MUL = 1
    const win: Record<string, number> = {}
    for (const [name, boss] of BOSSES) {
      for (const ease of [1, 0.78]) {
        const a = agg(120, () => ({ party: bossParty(), enemies: [combatantFromEnemy(eased(boss, ease), 0)] }))
        win[`${name}_${ease}`] = a.winRate
        report(`ボス ${name} ${ease === 1 ? '宿命' : '語り部'}`, a)
      }
    }
    // 実ボス(苔ノ主/骸星大熊)は worst-play でも100%勝てる。合成玄冬(想定最強)も破綻(勝率<90%)させない。
    expect(win['苔ノ主(序ボス)_1']).toBe(1)
    expect(win['骸星大熊(終盤)_1']).toBe(1)
    expect(win['合成玄冬(atk85/hp2400)_1']).toBeGreaterThanOrEqual(0.9)
  })

  it('現実policy(バフ/回復を使う)でも終盤ボスは手応えを残す(M33 ⑬受入)', () => {
    HP_MUL = 1; ATK_MUL = 1
    const smart: Record<string, ReturnType<typeof agg>> = {}
    const dumb: Record<string, ReturnType<typeof agg>> = {}
    for (const [name, boss] of BOSSES) {
      smart[name] = agg(150, () => ({ party: bossParty(), enemies: [combatantFromEnemy(boss, 0)] }), true)
      dumb[name] = agg(150, () => ({ party: bossParty(), enemies: [combatantFromEnemy(boss, 0)] }), false)
      report(`ボス ${name} 現実policy`, smart[name])
      report(`ボス ${name} 素手policy `, dumb[name])
    }
    const g = smart['合成玄冬(atk85/hp2400)']
    // ① 現実policy(バフ/回復)なら玄冬に安定して勝てる — 戦術に意味がある。
    expect(g.winRate, '現実policyなら玄冬に勝てる').toBeGreaterThanOrEqual(0.9)
    // ② バフ/回復を使う方が素手より有利 = sim が確かにバフ効果(⑬)を見ている証跡(devil CRITICAL-1の解消)。
    expect(g.winRate, 'バフ/回復policyは素手より不利にならない').toBeGreaterThanOrEqual(dumb['合成玄冬(atk85/hp2400)'].winRate)
    // ③ ⑬でバフを power反映+強化しても、玄冬は無傷の作業ゲーにしない(被HPが有意に残る)。
    expect(g.avgHpLossPct, '玄冬は依然として削られる(作業ゲー化しない)').toBeGreaterThan(8)
  })
})
