import { GODS } from './data/gods'
import { migrateJourneyMetrics } from './journey_metrics'
import { Rng } from './rng'
import type { GameData, God, GodRank, StarLotteryHistoryEntry, StarLotteryState } from './types'

export const STAR_LOTTERY_RATES: Readonly<Record<GodRank, number>> = {
  1: 60,
  2: 28,
  3: 10,
  4: 2,
}
export const STAR_LOTTERY_HISTORY_MAX = 50
export const STAR_LOTTERY_AFFINITY_RESCUE = 1

const GOD_IDS = new Set(GODS.map((god) => god.id))

function safeInt(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

export function migrateStarLottery(data: GameData): StarLotteryState {
  const source = data.starLottery
  const legacyCards = source
    ? source.cards
    : [...(data.codex?.gods ?? []), ...Object.keys(data.godAffinity ?? {}).filter((id) => (data.godAffinity?.[id] ?? 0) > 0)]
  const cards = [...new Set((Array.isArray(legacyCards) ? legacyCards : []).filter((id) => GOD_IDS.has(id)))]
  const history = (Array.isArray(source?.history) ? source.history : [])
    .filter((entry) => entry && typeof entry.requestId === 'string' && Number.isFinite(entry.drawNumber))
    .slice(0, STAR_LOTTERY_HISTORY_MAX)
    .map((entry) => ({
      ...entry,
      drawNumber: safeInt(entry.drawNumber),
      godIds: (Array.isArray(entry.godIds) ? entry.godIds : []).filter((id) => GOD_IDS.has(id)),
      newGodIds: (Array.isArray(entry.newGodIds) ? entry.newGodIds : []).filter((id) => GOD_IDS.has(id)),
      duplicateGodIds: (Array.isArray(entry.duplicateGodIds) ? entry.duplicateGodIds : []).filter((id) => GOD_IDS.has(id)),
      affinityGained: safeInt(entry.affinityGained),
      atSeason: safeInt(entry.atSeason),
    }))
  return {
    cards,
    drawsUsed: safeInt(source?.drawsUsed),
    history,
    lastRequestId: typeof source?.lastRequestId === 'string' ? source.lastRequestId : undefined,
  }
}

export function isStarLotteryUnlocked(data: GameData): boolean {
  return !!migrateJourneyMetrics(data, data.journeyMetrics?.startedAtMs ?? 0).milestones.first_return
}

/** 初帰還で1回、以後は累計武功50ごとに1回。武功自体は消費しない。 */
export function earnedStarLotteryDraws(data: GameData): number {
  if (!isStarLotteryUnlocked(data)) return 0
  return 1 + Math.floor(Math.max(0, data.fame) / 50)
}

export function remainingStarLotteryDraws(data: GameData): number {
  return Math.max(0, earnedStarLotteryDraws(data) - migrateStarLottery(data).drawsUsed)
}

function weightedRank(rng: Rng, floor: GodRank = 1): GodRank {
  const ranks = ([1, 2, 3, 4] as GodRank[]).filter((rank) => rank >= floor)
  const total = ranks.reduce((sum, rank) => sum + STAR_LOTTERY_RATES[rank], 0)
  let cursor = rng.next() * total
  for (const rank of ranks) {
    cursor -= STAR_LOTTERY_RATES[rank]
    if (cursor < 0) return rank
  }
  return ranks[ranks.length - 1]
}

function pickGod(rng: Rng, candidates: readonly God[]): God {
  return candidates[Math.min(candidates.length - 1, Math.floor(rng.next() * candidates.length))]
}

export interface StarLotteryDrawOutcome {
  data: GameData
  result: StarLotteryHistoryEntry | null
  reason?: 'locked' | 'no_draws' | 'invalid_request'
}

/**
 * requestIdで冪等な1回抽選。UIの二重clickやreload後の再送でも同一籤を重複消費しない。
 * 20/50天井と10回未所持保証が衝突する場合は、天井札に未所持の添え札を一枚付けて両方を守る。
 */
export function drawStarLottery(data: GameData, requestId: string, rng: Rng): StarLotteryDrawOutcome {
  const cleanRequestId = requestId.trim().slice(0, 80)
  if (!cleanRequestId) return { data, result: null, reason: 'invalid_request' }
  const state = migrateStarLottery(data)
  const previous = state.history.find((entry) => entry.requestId === cleanRequestId)
  if (previous) return { data, result: previous }
  if (!isStarLotteryUnlocked(data)) return { data, result: null, reason: 'locked' }
  if (remainingStarLotteryDraws({ ...data, starLottery: state }) <= 0) return { data, result: null, reason: 'no_draws' }

  const drawNumber = state.drawsUsed + 1
  const rankFloor: GodRank = drawNumber % 50 === 0 ? 4 : drawNumber % 20 === 0 ? 3 : 1
  const selectedRank = weightedRank(rng, rankFloor)
  const rankPool = GODS.filter((god) => god.rank === selectedRank)
  const fallbackPool = GODS.filter((god) => god.rank >= rankFloor)
  const primaryPool = rankPool.length ? rankPool : fallbackPool
  const owned = new Set(state.cards)
  const unseenEligible = primaryPool.filter((god) => !owned.has(god.id))
  const unseenAny = GODS.filter((god) => !owned.has(god.id))
  const guaranteeNew = drawNumber % 10 === 0 && unseenAny.length > 0

  const primary = pickGod(rng, guaranteeNew && unseenEligible.length ? unseenEligible : primaryPool)
  const godIds = [primary.id]
  // 天井階級に未所持が残っていなくても、10回保証を破らない。性能は増えず収集札だけを添える。
  if (guaranteeNew && owned.has(primary.id) && unseenAny.length > 0) godIds.push(pickGod(rng, unseenAny).id)

  const uniqueGodIds = [...new Set(godIds)]
  const newGodIds = uniqueGodIds.filter((id) => !owned.has(id))
  const duplicateGodIds = uniqueGodIds.filter((id) => owned.has(id))
  const affinityGained = duplicateGodIds.length * STAR_LOTTERY_AFFINITY_RESCUE
  const godAffinity = { ...(data.godAffinity ?? {}) }
  for (const id of duplicateGodIds) godAffinity[id] = (godAffinity[id] ?? 0) + STAR_LOTTERY_AFFINITY_RESCUE
  const result: StarLotteryHistoryEntry = {
    requestId: cleanRequestId,
    drawNumber,
    godIds: uniqueGodIds,
    newGodIds,
    duplicateGodIds,
    affinityGained,
    rankFloor: rankFloor > 1 ? rankFloor : undefined,
    atSeason: data.seasonIndex,
  }
  const nextState: StarLotteryState = {
    cards: [...new Set([...state.cards, ...newGodIds])],
    drawsUsed: drawNumber,
    history: [result, ...state.history].slice(0, STAR_LOTTERY_HISTORY_MAX),
    lastRequestId: cleanRequestId,
  }
  return {
    data: { ...data, godAffinity, starLottery: nextState, seed: rng.state() },
    result,
  }
}
