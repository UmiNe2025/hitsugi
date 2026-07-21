import type { CollectionV2, Item } from './types'
import {
  FOUNDING_ITEM_BASES,
  ITEM_COLLECTION_MANIFEST,
  ITEM_SERIES_MANIFEST,
  type ItemBase,
} from './data/items'

const SERIES_MASK = 0x7fff
const EQUIPMENT_SLOTS = ['weapon', 'armor', 'charm'] as const
const FOUNDING_IDS = new Set(FOUNDING_ITEM_BASES.map((item) => item.baseId))
const SERIES_BY_ID = new Map(ITEM_SERIES_MANIFEST.map((series) => [series.seriesId, series]))
const ITEM_CLASSIFICATION = new Map<string, ItemClassification>()

export type ItemClassification =
  | { kind: 'founding'; baseId: string }
  | { kind: 'series'; baseId: string; seriesId: string; tierIndex: number }

for (const baseId of ITEM_COLLECTION_MANIFEST.foundingBaseIds) {
  ITEM_CLASSIFICATION.set(baseId, { kind: 'founding', baseId })
}
for (const series of ITEM_COLLECTION_MANIFEST.series) {
  series.baseIds.forEach((baseId, tierIndex) => {
    ITEM_CLASSIFICATION.set(baseId, { kind: 'series', baseId, seriesId: series.seriesId, tierIndex })
  })
}

/** 全53系譜を0bitで持つruntime正規形。 */
export function emptyCollectionV2(): CollectionV2 {
  return {
    itemSeriesBits: Object.fromEntries(ITEM_SERIES_MANIFEST.map((series) => [series.seriesId, 0])),
    foundingItemIds: [],
  }
}

export function classifyItemBase(item: string | Pick<ItemBase, 'baseId'>): ItemClassification | null {
  const baseId = typeof item === 'string' ? item : item.baseId
  return ITEM_CLASSIFICATION.get(baseId) ?? null
}

/** 15段以外のbitや非整数を数えない。 */
export function popcount15(value: number): number {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) return 0
  let bits = value & SERIES_MASK
  let count = 0
  while (bits !== 0) {
    bits &= bits - 1
    count++
  }
  return count
}

function normalizeCollection(value: unknown): CollectionV2 {
  const normalized = emptyCollectionV2()
  if (!value || typeof value !== 'object') return normalized

  const record = value as Record<string, unknown>
  const bits = record.itemSeriesBits
  if (bits && typeof bits === 'object' && !Array.isArray(bits)) {
    for (const [seriesId, raw] of Object.entries(bits)) {
      if (!SERIES_BY_ID.has(seriesId)) continue
      if (!Number.isFinite(raw) || !Number.isInteger(raw) || (raw as number) < 0) continue
      normalized.itemSeriesBits[seriesId] = (raw as number) & SERIES_MASK
    }
  }

  const founding = record.foundingItemIds
  if (Array.isArray(founding)) {
    normalized.foundingItemIds = [...new Set(founding.filter(
      (baseId): baseId is string => typeof baseId === 'string' && FOUNDING_IDS.has(baseId),
    ))]
  }
  return normalized
}

type DiscoverableItem = string | Pick<Item, 'baseId'> | null | undefined

/** 既存記録へ、実在する品だけを和集合する。引数は変更しない。 */
export function discoverItems(
  collection: CollectionV2 | undefined,
  items: readonly DiscoverableItem[],
): CollectionV2 {
  const next = normalizeCollection(collection)
  const founding = new Set(next.foundingItemIds)

  for (const item of items) {
    const baseId = typeof item === 'string'
      ? item
      : item && typeof item === 'object' && typeof item.baseId === 'string'
        ? item.baseId
        : null
    if (!baseId) continue

    const classification = classifyItemBase(baseId)
    if (!classification) continue
    if (classification.kind === 'founding') founding.add(classification.baseId)
    else next.itemSeriesBits[classification.seriesId] |= 1 << classification.tierIndex
  }

  next.foundingItemIds = [...founding]
  return next
}

type MigrationSource = {
  collectionV2?: unknown
  inventory?: unknown
  family?: unknown
}

/**
 * 旧saveを発見記録へ移す。蔵と、生死を問わない全人物の装備をscanする。
 * 過去に所持していた可能性や最高段から下位段を推定しない。
 */
export function migrateCollectionV2(data: MigrationSource): CollectionV2 {
  const items: DiscoverableItem[] = []
  if (Array.isArray(data.inventory)) items.push(...data.inventory as DiscoverableItem[])

  if (Array.isArray(data.family)) {
    for (const member of data.family) {
      if (!member || typeof member !== 'object') continue
      const equipment = (member as Record<string, unknown>).equipment
      if (!equipment || typeof equipment !== 'object' || Array.isArray(equipment)) continue
      const slots = equipment as Record<string, unknown>
      items.push(...EQUIPMENT_SLOTS.map((slot) => slots[slot]) as DiscoverableItem[])
    }
  }

  return discoverItems(normalizeCollection(data.collectionV2), items)
}

export function isItemDiscovered(collection: CollectionV2 | undefined, baseId: string): boolean {
  const classification = classifyItemBase(baseId)
  if (!classification) return false
  const normalized = normalizeCollection(collection)
  return classification.kind === 'founding'
    ? normalized.foundingItemIds.includes(baseId)
    : (normalized.itemSeriesBits[classification.seriesId] & (1 << classification.tierIndex)) !== 0
}

export function seriesDiscoveredCount(collection: CollectionV2 | undefined, seriesId: string): number {
  if (!SERIES_BY_ID.has(seriesId)) return 0
  return popcount15(normalizeCollection(collection).itemSeriesBits[seriesId])
}

export function collectionDiscoveredCount(collection: CollectionV2 | undefined): number {
  const normalized = normalizeCollection(collection)
  return normalized.foundingItemIds.length
    + ITEM_SERIES_MANIFEST.reduce(
      (count, series) => count + popcount15(normalized.itemSeriesBits[series.seriesId]),
      0,
    )
}
