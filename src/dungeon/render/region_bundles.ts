import { regionExperienceOf } from '../../core/data/region_experience'
import { EXPERIENCE_BIOME_KITS } from './theme'

export interface RegionBundlePlan {
  regionId: string
  bundleId: string
  explorationBundleIds: readonly [terrain: string, props: string, foregroundWeather: string]
  battleBundleId: string
  codeNativeOnly: true
  textureUrls: readonly []
  maxTextureCount: 0
  maxDecodedBytes: 0
  releasePolicy: 'on-region-exit'
}

export interface RegionBundleTransition {
  activate: readonly string[]
  release: readonly string[]
  textureLoads: readonly []
  textureUnloads: readonly []
}

/**
 * A bounded, declarative bundle plan. VC4/VC6 uses Graphics primitives only,
 * therefore the load/unload lists are empty by construction. The logical
 * bundle id makes a later asset-backed kit replaceable without changing saves.
 */
export function regionBundlePlan(regionId: string): RegionBundlePlan | null {
  const profile = regionExperienceOf(regionId)
  if (!profile) return null
  const kit = EXPERIENCE_BIOME_KITS[profile.macroBiome]
  return {
    regionId,
    bundleId: kit.bundleId,
    explorationBundleIds: [
      kit.roleBundleIds.terrain,
      kit.roleBundleIds.props,
      kit.roleBundleIds.foregroundWeather,
    ],
    battleBundleId: kit.roleBundleIds.battleStage,
    codeNativeOnly: true,
    textureUrls: [],
    maxTextureCount: kit.maxTextureCount,
    maxDecodedBytes: kit.maxDecodedBytes,
    releasePolicy: kit.releasePolicy,
  }
}

export function regionBundleTransition(fromRegionId: string | null, toRegionId: string): RegionBundleTransition | null {
  const next = regionBundlePlan(toRegionId)
  if (!next) return null
  const previous = fromRegionId ? regionBundlePlan(fromRegionId) : null
  const changed = previous?.bundleId !== next.bundleId
  return {
    activate: changed ? [...next.explorationBundleIds] : [],
    release: changed && previous ? [...previous.explorationBundleIds] : [],
    textureLoads: [],
    textureUnloads: [],
  }
}
