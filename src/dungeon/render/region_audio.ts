import type { AmbienceKind } from '../../core/audio'
import { regionExperienceOf } from '../../core/data/region_experience'

export interface RegionAudioContract {
  ambience: Exclude<AmbienceKind, 'none'>
  soundCueId: string
  navigationCueId: string
  dangerCueId: string
  // AudioEngine currently exposes biome ambience and generic semantic SE only.
  // Exact regional one-shots remain visual-only rather than misusing UI sounds.
  oneShotConsumption: 'declared-visual-only'
}

const AMBIENCE_BY_BIOME: Record<string, Exclude<AmbienceKind, 'none'>> = {
  'wetland-border': 'forest',
  'stone-prayer-road': 'zaka',
  'timber-city-remains': 'tani',
  'bone-star-frontier': 'miyama',
}

export function resolveRegionAudioContract(regionId: string): RegionAudioContract | null {
  const profile = regionExperienceOf(regionId)
  if (!profile) return null
  return {
    ambience: AMBIENCE_BY_BIOME[profile.macroBiome],
    soundCueId: profile.soundCue.id,
    navigationCueId: profile.navigationCue.id,
    dangerCueId: profile.danger.cueId,
    oneShotConsumption: 'declared-visual-only',
  }
}
