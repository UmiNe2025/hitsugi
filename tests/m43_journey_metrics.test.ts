import { beforeEach, describe, expect, it, vi } from 'vitest'
import { currentActor } from '../src/core/battle'
import { REGIONS } from '../src/core/data/regions'
import { skillById } from '../src/core/data/skills'
import { ageOf } from '../src/core/inheritance'
import { exportJourneyMetrics, journeyQaSummary, markJourneyMilestone, summarizeCampaignRuns } from '../src/core/journey_metrics'
import { Rng } from '../src/core/rng'
import { useGame } from '../src/core/store'
import type { BattleAction, BattleState, Character } from '../src/core/types'

class MemStorage {
  data = new Map<string, string>()
  getItem(key: string) { return this.data.get(key) ?? null }
  setItem(key: string, value: string) { this.data.set(key, value) }
  removeItem(key: string) { this.data.delete(key) }
  clear() { this.data.clear() }
}
const mem = new MemStorage()
vi.stubGlobal('localStorage', mem)

function qaAction(battle: BattleState): BattleAction {
  const actor = currentActor(battle)
  if (!actor?.isAlly) throw new Error('store should return input on an ally turn')
  const foe = battle.enemies.find((enemy) => enemy.hp > 0)
  if (!foe) return { type: 'attack' }
  const skills = actor.skills.map((id) => skillById(id))
  const wounded = battle.allies
    .filter((ally) => ally.hp > 0 && ally.hp < ally.maxHp * 0.4)
    .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]
  const heal = skills.find((skill) => skill.type === 'heal' && actor.mp >= skill.mpCost)
  if (wounded && heal) {
    return { type: 'skill', skillId: heal.id, targetKey: heal.target === 'ally' ? wounded.key : undefined }
  }
  const buff = skills.find((skill) => skill.type === 'buff' && actor.mp >= skill.mpCost)
  const alreadyBuffed = buff && (buff.buffKind === 'def' ? actor.buffs.defMag : actor.buffs.atkMag)
  if (buff && !alreadyBuffed) return { type: 'skill', skillId: buff.id }
  const attack = skills
    .filter((skill) => skill.type === 'attack' && skill.target === 'enemy' && actor.mp >= skill.mpCost)
    .sort((a, b) => b.power - a.power)[0]
  return attack
    ? { type: 'skill', skillId: attack.id, targetKey: foe.key }
    : { type: 'attack', targetKey: foe.key }
}

/** 実storeの公開commandだけで現在の戦闘を最後まで進める。 */
function resolveStoreBattle(): 'won' | 'lost' | 'fled' {
  for (let guard = 0; guard < 500; guard += 1) {
    const battle = useGame.getState().battle
    if (!battle) throw new Error('battle disappeared before resolution')
    if (battle.phase === 'won' || battle.phase === 'lost' || battle.phase === 'fled') return battle.phase
    useGame.getState().battleCommand(qaAction(battle))
  }
  throw new Error('battle command guard exceeded')
}

function adults(family: readonly Character[], season: number): Character[] {
  return family.filter((char) => char.alive && ageOf(char, season) >= 6)
}

function assignAvailableRites() {
  const data = useGame.getState().data!
  for (const char of adults(data.family, data.seasonIndex)) {
    if (!char.tomoshigata) useGame.getState().assignTomoshigata(char.id, 'homura')
  }
}

function settleNarrative() {
  for (let guard = 0; guard < 30 && useGame.getState().pendingScenes.length > 0; guard += 1) {
    useGame.getState().skipCurrentScene()
  }
}

function safeParty(): string[] {
  const data = useGame.getState().data!
  const ready = adults(data.family, data.seasonIndex).sort((a, b) => a.bornSeason - b.bornSeason)
  // 全滅規則を実際に通しても血脈検証が続けられるよう、成人が複数なら最年少を郷へ残す。
  const field = ready.length > 1 ? ready.slice(0, -1) : ready
  return field.slice(0, 4).map((char) => char.id)
}

function restUntilReady(maxMonths = 8): number {
  const started = useGame.getState().data!.seasonIndex
  for (let i = 0; i < maxMonths; i += 1) {
    const data = useGame.getState().data!
    if (data.flags.extinct) break
    const ready = adults(data.family, data.seasonIndex)
    if (ready.length > 0 && ready.every((char) => char.hp === char.maxHp)) break
    useGame.getState().doRest()
    settleNarrative()
    assignAvailableRites()
  }
  return useGame.getState().data!.seasonIndex - started
}

function tryKeepLineage() {
  const data = useGame.getState().data!
  if (data.flags.extinct || data.pendingBirths.length > 0 || data.hoto < 100) return
  const youngest = [...data.family].filter((char) => char.alive).sort((a, b) => b.bornSeason - a.bornSeason)[0]
  if (youngest && ageOf(youngest, data.seasonIndex) < 8) return
  const parent = adults(data.family, data.seasonIndex)
    .filter((char) => ageOf(char, data.seasonIndex) <= 17)
    .sort((a, b) => b.bornSeason - a.bornSeason)[0]
  if (parent) {
    useGame.getState().doPact(parent.id, 'ishiusu')
    settleNarrative()
  }
}

function runEncounter(regionId: string, boss: boolean, partyOverride?: string[]) {
  assignAvailableRites()
  const party = partyOverride ?? safeParty()
  if (party.length === 0) return null
  useGame.getState().departDungeon(regionId, party)
  useGame.getState().chooseBoon(null)
  useGame.getState().dungeonEncounter(boss)
  if (!useGame.getState().battle) throw new Error(`encounter did not start: ${regionId}`)
  const result = resolveStoreBattle()
  useGame.getState().finishBattle()

  // 玄冬勝利時は汐里との二段戦になる。同じ公開commandで最後まで解く。
  if (useGame.getState().battle) {
    const second = resolveStoreBattle()
    useGame.getState().finishBattle()
    if (second !== 'won') return second
  }
  if (result === 'won' && useGame.getState().dungeonRun) useGame.getState().dungeonReturn()
  return result
}

/**
 * 新規saveから初ボス、寿命死・継承を経て最終地域まで実際の戦闘処理を通すQA policy。
 * 勝敗や戦利品は一切代入せず、storeの探索・戦闘・帰還結果だけを集計する。
 */
function simulateCampaign(seed: number) {
  const random = vi.spyOn(Math, 'random').mockReturnValue((((seed * 2654435761) >>> 0) + 1) / 0x1_0000_0000)
  const now = vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000 + seed)
  try {
    useGame.getState().newGame(true)
  } finally {
    random.mockRestore()
    now.mockRestore()
  }
  useGame.setState({ rng: new Rng(seed) })
  const founder = useGame.getState().data!.family[0]
  useGame.getState().doPact(founder.id, 'ishiusu')
  while (useGame.getState().data!.seasonIndex < 7) {
    useGame.getState().doRest()
    settleNarrative()
  }
  assignAvailableRites()

  // 宵の森の雑兵を実戦闘で討ち、初ボス前の奉燈と帰還導線を作る。
  for (let i = 0; i < 3 && !useGame.getState().data!.flags.extinct; i += 1) {
    runEncounter('yoi_forest', false)
    settleNarrative()
    restUntilReady(2)
  }

  // 宵の森は専用bossIdを持たないが、実storeでは首無し行灯を主代わりとして強化する。
  // 常夜百層を除く39地域すべてをcampaign対象にする。
  const campaignRegions = REGIONS.filter((region) => region.id !== 'tokoyo_tou')
  const campaignRoute = [...campaignRegions].sort((a, b) => a.unlockFame - b.unlockFame)
  const defeatRecoveryMonths: number[] = []
  let reachedFirstBoss = false
  let reachedEndgame = false
  for (let index = 0; index < campaignRoute.length; index += 1) {
    const region = campaignRoute[index]
    if (useGame.getState().data!.flags.extinct) break
    tryKeepLineage()
    assignAvailableRites()
    const party = safeParty()
    if (party.length === 0) {
      useGame.getState().doRest()
      settleNarrative()
      continue
    }
    let before = useGame.getState().data!
    if (before.fame < region.unlockFame) {
      throw new Error(`illegal campaign route: ${region.id} needs fame ${region.unlockFame}, has ${before.fame}`)
    }
    if (region.id === 'akashi_miyama' && !before.flags.reveal_shiori_name) {
      if (!before.flags.ch4) throw new Error('illegal final route: chapter 4 is not unlocked')
      // UIの第四章完読/要約と同じ公開actionで頂への物語前提を閉じる。
      useGame.getState().revealShioriName(true)
      before = useGame.getState().data!
      if (!before.flags.reveal_shiori_name) throw new Error('illegal final route: Shiori name is not revealed')
    }

    // 正規解禁後の最終戦は一人で初挑戦し、敗北→回復→全隊再挑戦を実測する。
    if (region.id === 'akashi_miyama') {
      const probe = runEncounter(region.id, true, party.slice(0, 1))
      reachedEndgame = probe !== null
      if (probe === 'lost') {
        defeatRecoveryMonths.push(restUntilReady())
        tryKeepLineage()
        assignAvailableRites()
      }
      if (useGame.getState().data!.regionsCleared.includes(region.id)) continue
    }

    let result: ReturnType<typeof runEncounter> = null
    for (let attempt = 0; attempt < 3; attempt += 1) {
      result = runEncounter(region.id, true)
      settleNarrative()
      if (index === 0) reachedFirstBoss = result !== null
      if (region.id === 'akashi_miyama') reachedEndgame = result !== null
      if (result !== 'lost') {
        restUntilReady(1)
        break
      }
      defeatRecoveryMonths.push(restUntilReady())
      tryKeepLineage()
      assignAvailableRites()
      if (useGame.getState().data!.flags.extinct) break
    }
  }

  // 少なくとも初代の寿命を越え、実storeの死・継承を観測する。
  while (useGame.getState().data!.seasonIndex < 26 && !useGame.getState().data!.flags.extinct) {
    tryKeepLineage()
    useGame.getState().doRest()
    assignAvailableRites()
  }
  const end = useGame.getState().data!
  const clearedBosses = campaignRegions.filter((region) => end.regionsCleared.includes(region.id)).length
  return {
    seed,
    reachedFirstBoss,
    reachedEndgame,
    clearedAllBossRegions: clearedBosses === campaignRegions.length,
    bossRegionsCleared: clearedBosses,
    bossRegionsTotal: campaignRegions.length,
    extinct: !!end.flags.extinct,
    generation: Math.max(...end.family.map((char) => char.gen)),
    hoto: end.hoto,
    ketsu: end.ketsu,
    defeatRecoveryMonths,
    seasons: end.seasonIndex,
    inherited: !!end.journeyMetrics?.milestones.first_inherit,
    clearedBosses,
  }
}

describe('M43 save-local journey metrics', () => {
  beforeEach(() => mem.clear())

  it('one-shotで二重計上せず、QA exportに氏名や自由文を含めない', () => {
    useGame.getState().newGame(true)
    const base = useGame.getState().data!
    const once = markJourneyMilestone(base, 'pact', 2000)
    const twice = markJourneyMilestone(once, 'pact', 9000)
    expect(twice.journeyMetrics?.milestones.pact).toEqual(once.journeyMetrics?.milestones.pact)
    const exported = exportJourneyMetrics({ ...twice, chronicle: [{ season: 0, kind: 'event', text: '秘密の自由文' }] })
    expect(exported).not.toContain('燈吾')
    expect(exported).not.toContain('秘密の自由文')
    expect(journeyQaSummary(twice).reached).toBeGreaterThanOrEqual(2)
  })

  it('実storeを使う100 seed campaignで初ボス・終盤・継承・通貨分位・敗北復帰を再現できる', () => {
    const results = Array.from({ length: 100 }, (_, index) => simulateCampaign(index + 1))
    const runs = results.map(({ inherited: _inherited, clearedBosses: _clearedBosses, ...run }) => run)
    const summary = summarizeCampaignRuns(runs)
    expect(summary.runs).toBe(100)
    expect(summary.firstBossRate).toBe(1)
    expect(summary.endgameReachRate).toBe(1)
    expect(summary.allBossRegionsRate).toBeGreaterThanOrEqual(0.01)
    expect(summary.allBossRegionsRate).toBeLessThanOrEqual(0.1)
    expect(summary.averageBossRegionCompletionRate).toBeGreaterThan(0.85)
    expect(summary.averageBossRegionCompletionRate).toBeLessThanOrEqual(0.95)
    expect(summary.averageGeneration).toBeGreaterThanOrEqual(2)
    expect(summary.currency.hoto.p10).toBeLessThanOrEqual(summary.currency.hoto.p50)
    expect(summary.currency.hoto.p50).toBeLessThanOrEqual(summary.currency.hoto.p90)
    expect(summary.currency.ketsu.p10).toBeLessThanOrEqual(summary.currency.ketsu.p50)
    expect(summary.currency.ketsu.p50).toBeLessThanOrEqual(summary.currency.ketsu.p90)
    expect(summary.defeatRecoveryRate).toBeGreaterThan(0)
    expect(summary.defeatRecoveryMonths.p90).toBeLessThanOrEqual(2)
    expect(results.every((run) => run.inherited)).toBe(true)
    expect(results.some((run) => run.clearedBosses > 0)).toBe(true)

    // 同じseedは勝敗・世代・通貨・復帰月まで完全一致する。
    expect(simulateCampaign(37)).toEqual(results[36])
  }, 60_000)
})
