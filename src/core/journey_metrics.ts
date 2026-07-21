import type { GameData, JourneyMetrics, JourneyMilestoneId } from './types'

export const JOURNEY_MILESTONES: readonly JourneyMilestoneId[] = [
  'new_game', 'pact', 'birth', 'first_depart', 'first_return',
  'safe_exit', 'first_death', 'first_inherit', 'next_month',
] as const

function finiteNonNegative(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback
}

/**
 * 旧saveをsave-local計測へ冪等移行する。氏名・自由文・端末識別子は一切収集しない。
 * 既に起きたと断定できる出来事だけelapsed=0で補う。
 */
export function migrateJourneyMetrics(data: GameData, now = Date.now()): JourneyMetrics {
  const startedAtMs = finiteNonNegative(data.journeyMetrics?.startedAtMs, now)
  const source = data.journeyMetrics?.milestones ?? {}
  const milestones: JourneyMetrics['milestones'] = {}
  for (const id of JOURNEY_MILESTONES) {
    const item = source[id]
    if (!item) continue
    milestones[id] = {
      id,
      atSeason: Math.floor(finiteNonNegative(item.atSeason, data.seasonIndex)),
      elapsedMs: Math.floor(finiteNonNegative(item.elapsedMs)),
    }
  }

  const inferred: Partial<Record<JourneyMilestoneId, boolean>> = {
    new_game: true,
    pact: data.chronicle.some((entry) => entry.kind === 'pact'),
    birth: data.family.length > 1 || data.chronicle.some((entry) => entry.kind === 'birth'),
    first_depart: data.family.some((char) => char.expeditions > 0) || (data.regionsVisited?.length ?? 0) > 0,
    first_return: !!data.narrative?.lastReturn || (data.regionsCleared?.length ?? 0) > 0,
    first_death: data.family.some((char) => !char.alive),
    first_inherit: data.family.some((char) => char.gen > 1 && char.isHead) || !!data.lastSuccession,
    next_month: data.seasonIndex > 0,
  }
  for (const id of JOURNEY_MILESTONES) {
    if (!milestones[id] && inferred[id]) milestones[id] = { id, atSeason: data.seasonIndex, elapsedMs: 0 }
  }
  return { startedAtMs, milestones }
}

/** 同じmilestoneは二度変更しない。save-localのみで、送信処理を持たない。 */
export function markJourneyMilestone(data: GameData, id: JourneyMilestoneId, now = Date.now()): GameData {
  const current = migrateJourneyMetrics(data, now)
  if (current.milestones[id]) {
    return data.journeyMetrics === current ? data : { ...data, journeyMetrics: current }
  }
  return {
    ...data,
    journeyMetrics: {
      ...current,
      milestones: {
        ...current.milestones,
        [id]: {
          id,
          atSeason: Math.max(0, Math.floor(data.seasonIndex)),
          elapsedMs: Math.max(0, Math.floor(now - current.startedAtMs)),
        },
      },
    },
  }
}

export interface JourneyQaSummary {
  reached: number
  total: number
  next?: JourneyMilestoneId
  elapsedToFirstReturnMs?: number
  elapsedToFirstInheritMs?: number
}

export function journeyQaSummary(data: GameData): JourneyQaSummary {
  const metrics = migrateJourneyMetrics(data, data.journeyMetrics?.startedAtMs ?? 0)
  const reached = JOURNEY_MILESTONES.filter((id) => !!metrics.milestones[id]).length
  return {
    reached,
    total: JOURNEY_MILESTONES.length,
    next: JOURNEY_MILESTONES.find((id) => !metrics.milestones[id]),
    elapsedToFirstReturnMs: metrics.milestones.first_return?.elapsedMs,
    elapsedToFirstInheritMs: metrics.milestones.first_inherit?.elapsedMs,
  }
}

/** QA向け。固定キーと数値のみで、氏名・自由文・端末IDは含まない。 */
export function exportJourneyMetrics(data: GameData): string {
  const metrics = migrateJourneyMetrics(data, data.journeyMetrics?.startedAtMs ?? 0)
  return JSON.stringify({ schema: 1, seasonIndex: data.seasonIndex, milestones: metrics.milestones }, null, 2)
}

export interface CampaignRunResult {
  seed: number
  reachedFirstBoss: boolean
  reachedEndgame: boolean
  clearedAllBossRegions: boolean
  bossRegionsCleared: number
  bossRegionsTotal: number
  extinct: boolean
  generation: number
  hoto: number
  ketsu: number
  defeatRecoveryMonths: number[]
  seasons: number
}

export interface CampaignPercentiles {
  p10: number
  p50: number
  p90: number
}

function percentile(values: readonly number[], ratio: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.max(0, Math.ceil(sorted.length * ratio) - 1)
  return sorted[Math.min(index, sorted.length - 1)]
}

function percentiles(values: readonly number[]): CampaignPercentiles {
  return {
    p10: percentile(values, 0.1),
    p50: percentile(values, 0.5),
    p90: percentile(values, 0.9),
  }
}

export function summarizeCampaignRuns(runs: readonly CampaignRunResult[]) {
  const count = runs.length
  const sum = (pick: (run: CampaignRunResult) => number) => runs.reduce((total, run) => total + pick(run), 0)
  const recoveryMonths = runs.flatMap((run) => run.defeatRecoveryMonths)
  return {
    runs: count,
    firstBossRate: count ? sum((run) => Number(run.reachedFirstBoss)) / count : 0,
    endgameReachRate: count ? sum((run) => Number(run.reachedEndgame)) / count : 0,
    allBossRegionsRate: count ? sum((run) => Number(run.clearedAllBossRegions)) / count : 0,
    averageBossRegionCompletionRate: count
      ? sum((run) => run.bossRegionsTotal > 0 ? run.bossRegionsCleared / run.bossRegionsTotal : 0) / count
      : 0,
    extinctionRate: count ? sum((run) => Number(run.extinct)) / count : 0,
    averageGeneration: count ? sum((run) => run.generation) / count : 0,
    averageHoto: count ? sum((run) => run.hoto) / count : 0,
    averageKetsu: count ? sum((run) => run.ketsu) / count : 0,
    currency: {
      hoto: percentiles(runs.map((run) => run.hoto)),
      ketsu: percentiles(runs.map((run) => run.ketsu)),
    },
    defeatRecoveryRate: count ? sum((run) => Number(run.defeatRecoveryMonths.length > 0)) / count : 0,
    defeatRecoveryMonths: percentiles(recoveryMonths),
    averageSeasons: count ? sum((run) => run.seasons) / count : 0,
  }
}
