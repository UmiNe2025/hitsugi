import { describe, expect, it } from 'vitest'
import { GODS, godById } from '../src/core/data/gods'
import { markJourneyMilestone } from '../src/core/journey_metrics'
import { Rng } from '../src/core/rng'
import {
  drawStarLottery, earnedStarLotteryDraws, isStarLotteryUnlocked, migrateStarLottery,
  remainingStarLotteryDraws, STAR_LOTTERY_RATES,
} from '../src/core/star_lottery'
import type { GameData } from '../src/core/types'

function data(patch: Partial<GameData> = {}): GameData {
  const base = {
    seasonIndex: 2, family: [{ id: 'h', hp: 10, equipment: {}, expeditions: 0 }], hoto: 0, ketsu: 0,
    inventory: [], godAffinity: {}, fame: 5000, regionsCleared: [], chronicle: [], pendingBirths: [],
    flags: {}, narrativeMode: false, seed: 1,
  } as unknown as GameData
  return markJourneyMilestone({ ...base, ...patch }, 'first_return', 1000)
}

describe('M43 星籤', () => {
  it('表示確率の単一sourceは合計100', () => {
    expect(Object.values(STAR_LOTTERY_RATES).reduce((sum, rate) => sum + rate, 0)).toBe(100)
  })

  it('初帰還まで施錠し、初回+武功50ごとに権利を得るが武功は消費しない', () => {
    const locked = { ...data(), journeyMetrics: undefined, regionsCleared: [] }
    expect(isStarLotteryUnlocked(locked)).toBe(false)
    expect(earnedStarLotteryDraws(locked)).toBe(0)
    const unlocked = data({ fame: 149 })
    expect(earnedStarLotteryDraws(unlocked)).toBe(3)
    const before = unlocked.fame
    const outcome = drawStarLottery(unlocked, 'one', new Rng(1))
    expect(outcome.data.fame).toBe(before)
    expect(remainingStarLotteryDraws(outcome.data)).toBe(2)
  })

  it('10回目は未所持、20回目は上つ星以上、50回目は極ツ星', () => {
    const missing = GODS[0]
    const tenth = data({ starLottery: { cards: GODS.filter((god) => god.id !== missing.id).map((god) => god.id), drawsUsed: 9, history: [] } })
    expect(drawStarLottery(tenth, 'ten', new Rng(10)).result?.newGodIds).toContain(missing.id)

    const twentieth = data({ starLottery: { cards: [], drawsUsed: 19, history: [] } })
    const r20 = drawStarLottery(twentieth, 'twenty', new Rng(20)).result!
    expect(godById(r20.godIds[0]).rank).toBeGreaterThanOrEqual(3)

    const fiftieth = data({ starLottery: { cards: [], drawsUsed: 49, history: [] } })
    const r50 = drawStarLottery(fiftieth, 'fifty', new Rng(50)).result!
    expect(godById(r50.godIds[0]).rank).toBe(4)
  })

  it('重複は縁+1、全所持でも安全、同一requestは二重消費しない', () => {
    const all = data({ starLottery: { cards: GODS.map((god) => god.id), drawsUsed: 0, history: [] } })
    const first = drawStarLottery(all, 'same', new Rng(7))
    expect(first.result?.duplicateGodIds).toHaveLength(1)
    expect(first.result?.affinityGained).toBe(1)
    const dup = first.result!.duplicateGodIds[0]
    expect(first.data.godAffinity[dup]).toBe(1)
    const again = drawStarLottery(first.data, 'same', new Rng(999))
    expect(again.data.starLottery?.drawsUsed).toBe(1)
    expect(again.result).toEqual(first.result)
  })

  it('旧saveは既存の縁を札へ移し、負数権利を0へ正規化する', () => {
    const god = GODS[0]
    const old = data({ godAffinity: { [god.id]: 2 }, starLottery: undefined })
    expect(migrateStarLottery(old).cards).toContain(god.id)
    const corrupt = data({ starLottery: { cards: [], drawsUsed: -8, history: [] } })
    expect(migrateStarLottery(corrupt).drawsUsed).toBe(0)
    expect(remainingStarLotteryDraws(corrupt)).toBeGreaterThanOrEqual(0)
  })
})
