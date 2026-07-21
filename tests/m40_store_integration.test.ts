import { beforeEach, describe, expect, it } from 'vitest'
import { useGame } from '../src/core/store'
import { ITEM_SERIES_MANIFEST, makeItem } from '../src/core/data/items'
import { ENEMIES } from '../src/core/data/enemies'
import { isItemDiscovered } from '../src/core/collection'

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

beforeEach(() => {
  storage.clear()
  useGame.getState().newGame(false)
})

describe('M40 store integration', () => {
  it('legacy expedition return records every carried item before the next screen reads the collection', () => {
    const state = useGame.getState()
    const founder = state.data!.family[0]
    state.depart('yoi_forest', [founder.id])
    const data = useGame.getState().data!
    const item = makeItem(ITEM_SERIES_MANIFEST[0].baseIds[14], 'chest')
    useGame.setState({
      data: {
        ...data,
        expedition: { ...data.expedition!, loot: { ...data.expedition!.loot, items: [item] } },
      },
    })

    useGame.getState().useReturnFire()
    const returned = useGame.getState().data!
    expect(returned.inventory.some((owned) => owned.id === item.id)).toBe(true)
    expect(isItemDiscovered(returned.collectionV2, item.baseId)).toBe(true)
  })

  it('walking dungeon return records carried items in the same runtime update', () => {
    const state = useGame.getState()
    const founder = state.data!.family[0]
    state.departDungeon('yoi_forest', [founder.id])
    const item = makeItem(ITEM_SERIES_MANIFEST[1].baseIds[11], 'chest')
    const run = useGame.getState().dungeonRun!
    useGame.setState({ dungeonRun: { ...run, loot: { ...run.loot, items: [item] } } })

    useGame.getState().dungeonReturn()
    const returned = useGame.getState().data!
    expect(returned.inventory.some((owned) => owned.id === item.id)).toBe(true)
    expect(isItemDiscovered(returned.collectionV2, item.baseId)).toBe(true)
  })

  it('legacy expedition records an encountered enemy once and does not call it new again', () => {
    const state = useGame.getState()
    const founder = state.data!.family[0]
    state.depart('yoi_forest', [founder.id])
    const firstData = useGame.getState().data!
    const nodeIds = Object.keys(firstData.expedition!.nodes)
    const enemyId = ENEMIES.find((enemy) => !enemy.id.startsWith('boss_'))!.id
    expect(nodeIds.length).toBeGreaterThanOrEqual(2)
    const firstId = nodeIds[0]
    useGame.setState({
      data: {
        ...firstData,
        codex: { enemies: [], gods: [] },
        expedition: {
          ...firstData.expedition!,
          nodes: {
            ...firstData.expedition!.nodes,
            [firstId]: { ...firstData.expedition!.nodes[firstId], type: 'battle', enemyIds: [enemyId] },
          },
        },
      },
    })

    useGame.getState().chooseNode(firstId)
    expect(useGame.getState().battleAutoContext?.firstEncounter).toBe(true)
    expect(useGame.getState().data!.codex?.enemies).toContain(enemyId)

    const secondId = nodeIds[1]
    const secondData = useGame.getState().data!
    useGame.setState({
      battle: null,
      screen: { id: 'expedition' },
      data: {
        ...secondData,
        expedition: {
          ...secondData.expedition!,
          nodes: {
            ...secondData.expedition!.nodes,
            [secondId]: { ...secondData.expedition!.nodes[secondId], type: 'battle', enemyIds: [enemyId] },
          },
        },
      },
    })
    useGame.getState().chooseNode(secondId)
    expect(useGame.getState().battleAutoContext?.firstEncounter).toBe(false)
  })
})
