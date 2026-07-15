import { beforeEach, describe, expect, it } from 'vitest'
import { useGame } from '../src/core/store'
import { Rng } from '../src/core/rng'
import { RARE_WITHIN_SPECIAL_RATE, specialShadeUsedKey } from '../src/core/rare_encounters'
import { regionIdentityOf } from '../src/core/data/region_visuals'

const storage = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, String(value)),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    key: (index: number) => [...storage.keys()][index] ?? null,
    get length() { return storage.size },
  },
})

function seedForRare(): number {
  for (let seed = 1; seed < 10_000; seed++) {
    if (new Rng(seed).next() < RARE_WITHIN_SPECIAL_RATE) return seed
  }
  throw new Error('rare seed not found')
}

function enterRareBattle(): void {
  const state = useGame.getState()
  const leader = state.data!.family[0]
  state.departDungeon('yoi_forest', [leader.id])
  useGame.setState({ rng: new Rng(seedForRare()) })
  useGame.getState().dungeonEncounter(false, true)
  expect(useGame.getState().rareEncounter).not.toBeNull()
}

beforeEach(() => {
  storage.clear()
  useGame.getState().newGame(false)
})

describe('稀相戦の状態遷移', () => {
  it('地域固有の地相説明を入場時の最新ログとして提示する', () => {
    const state = useGame.getState()
    const leader = state.data!.family[0]
    state.departDungeon('yoi_forest', [leader.id])

    expect(useGame.getState().dungeonRun!.log.at(-1))
      .toBe(regionIdentityOf('yoi_forest')!.entryLine)
  })

  it('勝利時だけ確定遺物をrun.lootへ一度積み、初討伐を記録する', () => {
    enterRareBattle()
    const before = useGame.getState()
    const rare = before.rareEncounter!
    expect(before.dungeonRun!.used).toContain(specialShadeUsedKey(0))

    useGame.setState({ battle: { ...before.battle!, phase: 'won' } })
    useGame.getState().finishBattle()

    const after = useGame.getState()
    expect(after.rareEncounter).toBeNull()
    expect(after.goldenBattle).toBe(false)
    expect(after.dungeonRun!.loot.items).toHaveLength(1)
    expect(after.dungeonRun!.loot.items[0]).toEqual(rare.drop)
    expect(after.dungeonRun!.log.at(-1)).toContain('帰還するまで')
    expect(after.data!.flags[`rareDefeat_${rare.markId}`]).toBe(1)
    expect(after.data!.chronicle.filter((e) => e.text.includes('初の稀相討伐'))).toHaveLength(1)

    // finishBattleの再呼出はbattle=nullで止まり、複製しない。
    after.finishBattle()
    expect(useGame.getState().dungeonRun!.loot.items).toHaveLength(1)

    // 帰還して初めて蔵(inventory)へ移り、産地情報も失わない。
    useGame.getState().dungeonReturn()
    const returned = useGame.getState()
    expect(returned.dungeonRun).toBeNull()
    expect(returned.data!.inventory).toHaveLength(1)
    expect(returned.data!.inventory[0]).toEqual(rare.drop)
  })

  it('逃走では遺物を得ず、同じfloorの特殊影だけは消費済みになる', () => {
    enterRareBattle()
    const battle = useGame.getState().battle!
    useGame.setState({ battle: { ...battle, phase: 'fled' } })
    useGame.getState().finishBattle()

    const after = useGame.getState()
    expect(after.rareEncounter).toBeNull()
    expect(after.dungeonRun!.loot.items).toHaveLength(0)
    expect(after.dungeonRun!.used).toContain(specialShadeUsedKey(0))

    // 再mount相当の重複通知が来ても通常戦へ降り、稀相/2.5倍を復活させない。
    after.dungeonEncounter(false, true)
    expect(useGame.getState().rareEncounter).toBeNull()
    expect(useGame.getState().goldenBattle).toBe(false)
  })

  it('全滅では未帰還の稀相遺物をinventoryへ迂回させない', () => {
    enterRareBattle()
    const battle = useGame.getState().battle!
    useGame.setState({ battle: { ...battle, phase: 'lost' } })
    useGame.getState().finishBattle()

    const after = useGame.getState()
    expect(after.rareEncounter).toBeNull()
    expect(after.dungeonRun).toBeNull()
    expect(after.data!.inventory).toHaveLength(0)
  })
})
