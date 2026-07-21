import type { RegionVisualVersion } from '../feature_flags'

export type RegionGroundMaterial = 'wet-soil' | 'shallow-black-water'

export interface RegionStageContract {
  id: string
  schemaVersion: 1
  visualVersion: Extract<RegionVisualVersion, 'v2'>
  regionId: string
  floor: number
  name: string
  groundMaterials: readonly [RegionGroundMaterial, RegionGroundMaterial]
  palette: {
    night: number
    boundary: number
    wetSoil: number
    shallowWater: number
    inheritable: number
    livingFocus: number
    danger: number
  }
  landmark: {
    id: 'drowned-shrine'
    label: string
    assetId: string
    assetPath: string
  }
  foreground: {
    id: 'firefly-reeds'
    label: string
    assetId: string
    assetPath: string
  }
  ambientMotion: {
    id: 'reverse-embers-and-water-rings'
    weather: 'low-wet-mist'
    emberPool: number
    ringPool: number
    mistPool: number
  }
  soundCue: 'wet-footfall-and-water-ring'
  navigationCue: {
    id: 'flattened-grass-and-reflected-lamps'
    label: string
  }
  dangerCue: {
    id: 'reverse-ember-flow'
    label: string
    leadSeconds: readonly [3, 8]
  }
}

export const HOTARUBI_FLOOR_0_AR1: RegionStageContract = {
  id: 'ar1:hotarubi-no-kubochi:floor-0:hvr-1',
  schemaVersion: 1,
  visualVersion: 'v2',
  regionId: 'hotarubi_no_kubochi',
  floor: 0,
  name: '螢火の窪地・水没社',
  groundMaterials: ['wet-soil', 'shallow-black-water'],
  palette: {
    night: 0x101923,
    boundary: 0x0a1118,
    wetSoil: 0x273535,
    shallowWater: 0x0c2029,
    inheritable: 0xc9a86a,
    livingFocus: 0xe8a33d,
    danger: 0xc73e3a,
  },
  landmark: {
    id: 'drowned-shrine',
    label: '水没した祠',
    assetId: 'dungeon_hotarubi_landmark_drowned_shrine_firefly_reed',
    assetPath: 'img/visual-recovery/hotarubi/drowned-shrine-firefly-reed-hvr1-v1.webp',
  },
  foreground: {
    id: 'firefly-reeds',
    label: '蛍火の葦',
    assetId: 'dungeon_hotarubi_foreground_root_reed',
    assetPath: 'img/visual-recovery/hotarubi/foreground-root-reed-hvr1-v1.webp',
  },
  ambientMotion: {
    id: 'reverse-embers-and-water-rings',
    weather: 'low-wet-mist',
    emberPool: 10,
    ringPool: 3,
    mistPool: 2,
  },
  soundCue: 'wet-footfall-and-water-ring',
  navigationCue: {
    id: 'flattened-grass-and-reflected-lamps',
    label: '伏した草と灯の反射が帰路を示す',
  },
  dangerCue: {
    id: 'reverse-ember-flow',
    label: '橙の火の粉が流れに逆らう',
    leadSeconds: [3, 8],
  },
}

const REGION_STAGE_CONTRACTS: readonly RegionStageContract[] = [HOTARUBI_FLOOR_0_AR1]
const BY_ID = new Map(REGION_STAGE_CONTRACTS.map((contract) => [contract.id, contract]))

export interface RegionStageLookup {
  regionId: string
  floor: number
  visualVersion?: RegionVisualVersion
  stageContractId?: string
}

/** Strict resolver: v2 is intentionally limited to Hotarubi floor 0 in AR1. */
export function resolveRegionStageContract(lookup: RegionStageLookup): RegionStageContract | null {
  if (lookup.visualVersion !== 'v2') return null
  const resolved = REGION_STAGE_CONTRACTS.find(
    (contract) => contract.regionId === lookup.regionId && contract.floor === lookup.floor,
  ) ?? null
  if (!resolved) return null
  if (lookup.stageContractId && lookup.stageContractId !== resolved.id) return null
  return resolved
}

export function regionStageContractById(id: string | undefined): RegionStageContract | null {
  return id ? (BY_ID.get(id) ?? null) : null
}

export function captureRegionStageSession(
  regionId: string,
  visualVersion: RegionVisualVersion,
): { visualVersion: RegionVisualVersion; stageContractId?: string } {
  const contract = resolveRegionStageContract({ regionId, floor: 0, visualVersion })
  return { visualVersion, ...(contract ? { stageContractId: contract.id } : {}) }
}
