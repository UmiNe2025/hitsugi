import { describe, expect, it } from 'vitest'
import type { Character, GameData, NarrativeProgress } from '../src/core/types'
import { resolveVillageVisualState } from '../src/core/data/village_visual_state'

function character(over: Partial<Character> = {}): Character {
  return {
    id: 'head', name: '灯', alive: true, isHead: true, hp: 10, maxHp: 10,
    equipment: {}, deeds: [],
    ...over,
  } as Character
}

function input(over: Partial<GameData> = {}): Pick<GameData, 'seasonIndex' | 'family' | 'pendingBirths' | 'narrative'> {
  return {
    seasonIndex: 8,
    family: [character(), character({ id: 'heir', name: '継', isHead: false })],
    pendingBirths: [],
    narrative: undefined,
    ...over,
  }
}

function narrative(lastReturn: NarrativeProgress['lastReturn']): NarrativeProgress {
  return { lastReturn } as NarrativeProgress
}

describe('AR1 郷visual state', () => {
  it('後継がいる健常な一族はnormalになる', () => {
    expect(resolveVillageVisualState(input())).toMatchObject({
      lifeState: 'normal', crisisReason: null, freshReturn: null,
    })
  })

  it('存命一人・懐妊なし、または当主HP30%未満を血脈危機にする', () => {
    expect(resolveVillageVisualState(input({ family: [character()] }))).toMatchObject({
      lifeState: 'bloodline-crisis', crisisReason: 'line-alone',
    })
    expect(resolveVillageVisualState(input({
      family: [character({ hp: 2, maxHp: 10 }), character({ id: 'heir', isHead: false })],
    }))).toMatchObject({
      lifeState: 'bloodline-crisis', crisisReason: 'head-critical',
    })
    expect(resolveVillageVisualState(input({
      family: [character()],
      pendingBirths: [{ godId: 'g', parentId: 'head', dueSeason: 9 }],
    }))).toMatchObject({ lifeState: 'normal', crisisReason: null })
  })

  it('lastReturnは帰還後advanceSeasonされた直後だけfresh traceになり、戦果と負傷を分類する', () => {
    const base = {
      id: 'return-7', season: 7, regionId: 'r1', partyIds: ['head', 'heir'],
      injuredIds: ['heir'], bossDown: true,
    }
    expect(resolveVillageVisualState(input({ narrative: narrative(base) })).freshReturn).toEqual({
      id: 'return-7', kind: 'scarred-victory', regionId: 'r1', partyCount: 2,
      injuredCount: 1, bossDown: true,
    })
    expect(resolveVillageVisualState(input({
      narrative: narrative({ ...base, season: 6 }),
    })).freshReturn).toBeNull()
    expect(resolveVillageVisualState(input({
      narrative: narrative({ ...base, season: 8 }),
    })).freshReturn).toBeNull()
  })

  it('resolverは入力を変更しない', () => {
    const source = input({
      narrative: narrative({
        id: 'return-7', season: 7, regionId: 'r1', partyIds: ['head'],
        injuredIds: [], bossDown: false,
      }),
    })
    const before = structuredClone(source)
    expect(resolveVillageVisualState(source).freshReturn?.kind).toBe('road-dust')
    expect(source).toEqual(before)
  })
})
