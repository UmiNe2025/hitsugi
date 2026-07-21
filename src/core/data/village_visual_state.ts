import type { GameData } from '../types'

export type VillageLifeState = 'normal' | 'bloodline-crisis'

export type VillageReturnTraceKind =
  | 'road-dust'
  | 'wounded-return'
  | 'victory-ash'
  | 'scarred-victory'

export interface VillageFreshReturnTrace {
  id: string
  kind: VillageReturnTraceKind
  regionId: string
  partyCount: number
  injuredCount: number
  bossDown: boolean
}

export interface VillageVisualState {
  lifeState: VillageLifeState
  crisisReason: 'line-alone' | 'head-critical' | 'line-alone-and-head-critical' | null
  freshReturn: VillageFreshReturnTrace | null
}

export type VillageVisualStateInput = Pick<
  GameData,
  'seasonIndex' | 'family' | 'pendingBirths' | 'narrative'
>

/**
 * AR1の郷差分を既存saveだけから解決する純粋関数。
 * dungeonReturnは帰還月を記録してからadvanceSeasonするため、直後の1季だけを「新しい痕跡」とする。
 */
export function resolveVillageVisualState(data: VillageVisualStateInput): VillageVisualState {
  const alive = data.family.filter((character) => character.alive)
  const head = alive.find((character) => character.isHead) ?? alive[0]
  const lineAlone = alive.length <= 1 && data.pendingBirths.length === 0
  const headCritical = !!head && head.maxHp > 0 && head.hp / head.maxHp < 0.3

  const crisisReason = lineAlone && headCritical
    ? 'line-alone-and-head-critical'
    : lineAlone
      ? 'line-alone'
      : headCritical
        ? 'head-critical'
        : null

  const lastReturn = data.narrative?.lastReturn
  const freshReturn = lastReturn && lastReturn.season === data.seasonIndex - 1
    ? {
        id: lastReturn.id,
        kind: returnTraceKind(lastReturn.bossDown, lastReturn.injuredIds.length),
        regionId: lastReturn.regionId,
        partyCount: lastReturn.partyIds.length,
        injuredCount: lastReturn.injuredIds.length,
        bossDown: lastReturn.bossDown,
      }
    : null

  return {
    lifeState: crisisReason ? 'bloodline-crisis' : 'normal',
    crisisReason,
    freshReturn,
  }
}

function returnTraceKind(bossDown: boolean, injuredCount: number): VillageReturnTraceKind {
  if (bossDown && injuredCount > 0) return 'scarred-victory'
  if (bossDown) return 'victory-ash'
  if (injuredCount > 0) return 'wounded-return'
  return 'road-dust'
}
