import { describe, expect, it } from 'vitest'
import {
  classifyItemBase,
  collectionDiscoveredCount,
  discoverItems,
  emptyCollectionV2,
  isItemDiscovered,
  migrateCollectionV2,
  popcount15,
  seriesDiscoveredCount,
} from '../src/core/collection'
import {
  FOUNDING_ITEM_BASES,
  ITEM_BASES,
  ITEM_COLLECTION_MANIFEST,
  ITEM_SERIES_MANIFEST,
} from '../src/core/data/items'

describe('item collection manifest', () => {
  it('covers the 810 item bases as founding 15 plus 53 series of 15 without duplicates', () => {
    expect(FOUNDING_ITEM_BASES).toHaveLength(15)
    expect(ITEM_SERIES_MANIFEST).toHaveLength(53)
    expect(ITEM_SERIES_MANIFEST.every((series) => series.items.length === 15)).toBe(true)
    expect(ITEM_SERIES_MANIFEST.every((series) => series.baseIds.length === 15)).toBe(true)

    const ids = [
      ...ITEM_COLLECTION_MANIFEST.foundingBaseIds,
      ...ITEM_COLLECTION_MANIFEST.series.flatMap((series) => series.baseIds),
    ]
    expect(ids).toHaveLength(810)
    expect(new Set(ids).size).toBe(810)
    expect(new Set(ITEM_BASES.map((item) => item.baseId))).toEqual(new Set(ids))
    expect(ITEM_COLLECTION_MANIFEST.foundingItems).toBe(FOUNDING_ITEM_BASES)
    expect(classifyItemBase(FOUNDING_ITEM_BASES[0])).toEqual({
      kind: 'founding',
      baseId: FOUNDING_ITEM_BASES[0].baseId,
    })
    expect(classifyItemBase(ITEM_SERIES_MANIFEST[0].items[14])).toMatchObject({
      kind: 'series',
      seriesId: ITEM_SERIES_MANIFEST[0].seriesId,
      tierIndex: 14,
    })
  })
})

describe('collection discovery', () => {
  const series = ITEM_SERIES_MANIFEST[0]

  it('keeps sparse tier bits exact and never infers lower tiers', () => {
    const collection = discoverItems(emptyCollectionV2(), [series.items[2], series.items[14]])

    expect(seriesDiscoveredCount(collection, series.seriesId)).toBe(2)
    expect(isItemDiscovered(collection, series.baseIds[2])).toBe(true)
    expect(isItemDiscovered(collection, series.baseIds[14])).toBe(true)
    expect(isItemDiscovered(collection, series.baseIds[0])).toBe(false)
    expect(isItemDiscovered(collection, series.baseIds[13])).toBe(false)
    expect(collectionDiscoveredCount(collection)).toBe(2)
    expect(popcount15(collection.itemSeriesBits[series.seriesId])).toBe(2)
  })

  it('discovers founding items once and ignores unknown items', () => {
    const founding = FOUNDING_ITEM_BASES[0].baseId
    const collection = discoverItems(undefined, [founding, founding, 'unknown_base'])

    expect(collection.foundingItemIds).toEqual([founding])
    expect(collectionDiscoveredCount(collection)).toBe(1)
    expect(isItemDiscovered(collection, 'unknown_base')).toBe(false)
  })
})

describe('collection migration', () => {
  it('merges valid old bits with inventory and every family member equipment, including the dead', () => {
    const [first, second, third] = ITEM_SERIES_MANIFEST
    const founding = FOUNDING_ITEM_BASES[1].baseId
    const old = emptyCollectionV2()
    old.itemSeriesBits[first.seriesId] = 1 << 12
    old.foundingItemIds = [founding]

    const source = {
      collectionV2: old,
      inventory: [{ baseId: first.baseIds[3] }, null, { noBaseId: true }, { baseId: 'unknown' }],
      family: [
        { alive: true, equipment: { weapon: { baseId: second.baseIds[5] } } },
        { alive: false, equipment: {
          armor: { baseId: third.baseIds[9] },
          charm: { baseId: FOUNDING_ITEM_BASES[4].baseId },
        } },
        null,
        { alive: false, equipment: 'malformed' },
      ],
    }

    const migrated = migrateCollectionV2(source)
    expect(isItemDiscovered(migrated, first.baseIds[12])).toBe(true)
    expect(isItemDiscovered(migrated, first.baseIds[3])).toBe(true)
    expect(isItemDiscovered(migrated, second.baseIds[5])).toBe(true)
    expect(isItemDiscovered(migrated, third.baseIds[9])).toBe(true)
    expect(isItemDiscovered(migrated, founding)).toBe(true)
    expect(isItemDiscovered(migrated, FOUNDING_ITEM_BASES[4].baseId)).toBe(true)
    expect(collectionDiscoveredCount(migrated)).toBe(6)
  })

  it('ignores malformed/unknown persisted values, masks out-of-range bits, and is idempotent', () => {
    const series = ITEM_SERIES_MANIFEST[4]
    const malformed = {
      collectionV2: {
        itemSeriesBits: {
          [series.seriesId]: (1 << 1) | (1 << 20),
          [ITEM_SERIES_MANIFEST[5].seriesId]: Number.NaN,
          missing_series: 7,
        },
        foundingItemIds: [FOUNDING_ITEM_BASES[2].baseId, 'unknown', 42],
      },
      inventory: [{ baseId: series.baseIds[11] }],
      family: [],
    }

    const once = migrateCollectionV2(malformed)
    const twice = migrateCollectionV2({ ...malformed, collectionV2: once })

    expect(once).toEqual(twice)
    expect(seriesDiscoveredCount(once, series.seriesId)).toBe(2)
    expect(isItemDiscovered(once, series.baseIds[1])).toBe(true)
    expect(isItemDiscovered(once, series.baseIds[11])).toBe(true)
    expect(once.foundingItemIds).toEqual([FOUNDING_ITEM_BASES[2].baseId])
    expect(Object.keys(once.itemSeriesBits)).toHaveLength(53)
  })
})
