import { describe, expect, it } from 'vitest'
import { REGIONS } from '../src/core/data/regions'
import {
  REGION_EXPERIENCES,
  regionExperienceOf,
  type ExperienceMacroBiome,
} from '../src/core/data/region_experience'
import { REGION_VISUALS } from '../src/core/data/region_visuals'
import { EXPERIENCE_BIOME_KITS, themeForBg } from '../src/dungeon/render/theme'
import { regionBundlePlan, regionBundleTransition } from '../src/dungeon/render/region_bundles'
import { resolveRegionVisual } from '../src/dungeon/render/region_theme'
import {
  buildRegionExperienceStage,
  resolveRegionPrimitiveRecipe,
} from '../src/dungeon/render/region_experience_layer'
import { resolveRegionAudioContract } from '../src/dungeon/render/region_audio'
import type { TileKind } from '../src/dungeon/types'

const EXPECTED_BIOME: Record<string, ExperienceMacroBiome> = {
  forest: 'wetland-border',
  zaka: 'stone-prayer-road',
  tani: 'timber-city-remains',
  miyama: 'bone-star-frontier',
}

const EXPECTED_COUNTS: Record<ExperienceMacroBiome, number> = {
  'wetland-border': 10,
  'stone-prayer-road': 10,
  'timber-city-remains': 11,
  'bone-star-frontier': 9,
}

const SIGNATURES = [
  'hotarubi_no_kubochi',
  'nemurijizou_no_michi',
  'kuchinawa_no_hotoke',
  'usugiri_no_watashiba',
  'hisui_no_sawa',
  'nakiotoko_no_hara',
  'sabigatana_no_haka',
  'yumemaboroshi_no_yakata',
  'maboroshi_no_sandou',
  'nakiryuu_no_mine',
  'todome_no_kaidan',
  'gentou_no_zenya',
] as const

function unique(values: string[], axis: string): void {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index)
  expect(duplicates, `${axis} must not contain duplicates`).toEqual([])
}

describe('VC4/VC6 region experience coverage', () => {
  it('covers exactly the 40 canonical regions', () => {
    expect(Object.keys(REGION_EXPERIENCES).sort()).toEqual(REGIONS.map((region) => region.id).sort())
    expect(Object.keys(REGION_EXPERIENCES)).toHaveLength(40)
  })

  it('maps the legacy four backgrounds to four named experience macro-biomes', () => {
    const counts = new Map<ExperienceMacroBiome, number>()
    for (const region of REGIONS) {
      const legacyFamily = themeForBg(region.bg).family
      const profile = REGION_EXPERIENCES[region.id]
      expect(profile.macroBiome, region.id).toBe(EXPECTED_BIOME[legacyFamily])
      expect(themeForBg(region.bg).experienceBiome, region.id).toBe(profile.macroBiome)
      counts.set(profile.macroBiome, (counts.get(profile.macroBiome) ?? 0) + 1)
    }
    expect(Object.fromEntries(counts)).toEqual(EXPECTED_COUNTS)
  })

  it('declares all required material, value, danger, motion, sound, and navigation fields', () => {
    for (const region of REGIONS) {
      const profile = REGION_EXPERIENCES[region.id]
      expect(profile.groundMaterials, `${region.id}.groundMaterials`).toHaveLength(2)
      expect(profile.groundMaterials.every(Boolean), `${region.id}.groundMaterials`).toBe(true)
      expect(profile.valueFamily, `${region.id}.valueFamily`).toBeTruthy()
      expect(profile.danger.cueId, `${region.id}.danger.cueId`).toBeTruthy()
      expect(profile.danger.shapeCue, `${region.id}.danger.shapeCue`).toBeTruthy()
      expect(profile.danger.leadSeconds[0], `${region.id}.danger.leadSeconds`).toBeGreaterThanOrEqual(2)
      expect(profile.danger.leadSeconds[1], `${region.id}.danger.leadSeconds`).toBeLessThanOrEqual(8)
      expect(profile.silhouette.profileId, `${region.id}.silhouette.profileId`).toBeTruthy()
      expect(profile.silhouette.boundary, `${region.id}.silhouette.boundary`).toBeTruthy()
      expect(profile.silhouette.rhythm, `${region.id}.silhouette.rhythm`).toBeTruthy()
      expect(profile.landmark.id, `${region.id}.landmark.id`).toBeTruthy()
      expect(profile.landmark.form, `${region.id}.landmark.form`).toBeTruthy()
      expect(profile.ambientMotion.id, `${region.id}.ambientMotion.id`).toBeTruthy()
      expect(profile.ambientMotion.maxInstances, `${region.id}.ambientMotion.maxInstances`).toBeLessThanOrEqual(40)
      expect(profile.soundCue.id, `${region.id}.soundCue.id`).toBeTruthy()
      expect(profile.soundCue.maxConcurrent, `${region.id}.soundCue.maxConcurrent`).toBe(1)
      expect(profile.soundCue.carryIntoBattle, `${region.id}.soundCue.carryIntoBattle`).toBe(true)
      expect(profile.navigationCue.id, `${region.id}.navigationCue.id`).toBeTruthy()
      expect(profile.navigationCue.rule, `${region.id}.navigationCue.rule`).toBeTruthy()
    }
  })
})

describe('VC6 no palette-only regions', () => {
  it('gives all 40 regions a unique exact two-material pair', () => {
    unique(REGIONS.map(({ id }) => REGION_EXPERIENCES[id].groundMaterials.join('|')), 'material axis')
  })

  it('gives all 40 regions a unique silhouette grammar', () => {
    unique(REGIONS.map(({ id }) => {
      const silhouette = REGION_EXPERIENCES[id].silhouette
      return [silhouette.profileId, silhouette.boundary, silhouette.rhythm].join('|')
    }), 'silhouette axis')
  })

  it('gives all 40 regions a unique landmark and navigation grammar', () => {
    unique(REGIONS.map(({ id }) => {
      const profile = REGION_EXPERIENCES[id]
      return [profile.landmark.id, profile.navigationCue.id, profile.navigationCue.rule].join('|')
    }), 'landmark/navigation axis')
  })

  it('contains no image path, URL, or external texture in the code-native contracts', () => {
    const serialized = JSON.stringify(REGION_EXPERIENCES)
    expect(serialized).not.toMatch(/(?:https?:\/\/|\/img\/|\.png\b|\.webp\b|\.jpe?g\b)/i)
  })
})

describe('VC4 twelve signature locations', () => {
  it('assigns the exact twelve signatures first with stable priorities 1..12', () => {
    const signatureEntries = Object.entries(REGION_EXPERIENCES)
      .filter(([, profile]) => profile.landmark.signatureKind !== undefined)
      .sort((a, b) => a[1].landmark.signaturePriority! - b[1].landmark.signaturePriority!)

    expect(signatureEntries.map(([id]) => id)).toEqual(SIGNATURES)
    expect(signatureEntries.map(([, profile]) => profile.landmark.signaturePriority)).toEqual(
      Array.from({ length: 12 }, (_, index) => index + 1),
    )
    for (const regionId of SIGNATURES) {
      expect(REGION_EXPERIENCES[regionId].landmark.signatureKind).toBe(REGION_VISUALS[regionId].landmark)
    }
  })
})

describe('VC4 renderer and bundle compatibility', () => {
  it('keeps the existing material/particle renderer contract in sync', () => {
    for (const region of REGIONS) {
      const experience = REGION_EXPERIENCES[region.id]
      expect(experience.render.groundKind, `${region.id}.groundKind`).toBe(REGION_VISUALS[region.id].groundKind)
      expect(experience.render.particleKind, `${region.id}.particleKind`).toBe(REGION_VISUALS[region.id].particleKind)

      const resolved = resolveRegionVisual(themeForBg(region.bg), region.id, 'norm', false)
      expect(resolved.experience, region.id).toBe(experience)
      expect(resolved.groundKind, region.id).toBe(experience.render.groundKind)
      expect(resolved.particleKind, region.id).toBe(experience.render.particleKind)
      expect(resolved.bundlePlan?.bundleId, region.id).toBe(EXPERIENCE_BIOME_KITS[experience.macroBiome].bundleId)
    }
  })

  it('declares zero-texture bounded bundles with region-exit release', () => {
    for (const region of REGIONS) {
      expect(regionBundlePlan(region.id)).toMatchObject({
        regionId: region.id,
        codeNativeOnly: true,
        textureUrls: [],
        maxTextureCount: 0,
        maxDecodedBytes: 0,
        releasePolicy: 'on-region-exit',
      })
    }
    expect(new Set(Object.values(EXPERIENCE_BIOME_KITS).map((kit) => kit.bundleId)).size).toBe(4)
    const roleBundleIds = Object.values(EXPERIENCE_BIOME_KITS).flatMap((kit) => Object.values(kit.roleBundleIds))
    expect(roleBundleIds).toHaveLength(16)
    expect(new Set(roleBundleIds).size).toBe(16)
  })

  it('does not churn a same-biome logical bundle and releases it across biomes', () => {
    expect(regionBundleTransition('yoi_forest', 'hotarubi_no_kubochi')).toEqual({
      activate: [], release: [], textureLoads: [], textureUnloads: [],
    })
    const crossBiome = regionBundleTransition('hotarubi_no_kubochi', 'chochin_zaka')
    expect(crossBiome?.activate).toEqual([
      'dungeon-prayer-terrain-code-v2',
      'dungeon-prayer-props-code-v2',
      'dungeon-prayer-foreground-code-v2',
    ])
    expect(crossBiome?.release).toEqual([
      'dungeon-wetland-terrain-code-v2',
      'dungeon-wetland-props-code-v2',
      'dungeon-wetland-foreground-code-v2',
    ])
    expect(crossBiome?.textureLoads).toEqual([])
    expect(crossBiome?.textureUnloads).toEqual([])
  })

  it('fails closed for unknown region ids', () => {
    expect(regionExperienceOf('no_such_region')).toBeNull()
    expect(regionBundlePlan('no_such_region')).toBeNull()
    expect(regionBundleTransition(null, 'no_such_region')).toBeNull()
  })
})

describe('VC6 code-native stage integration', () => {
  const grid: TileKind[][] = [
    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
    ['wall', 'entrance', 'floor', 'floor', 'wall', 'floor', 'wall'],
    ['wall', 'floor', 'wall', 'floor', 'floor', 'floor', 'wall'],
    ['wall', 'grass', 'grass', 'floor', 'wall', 'stairs', 'wall'],
    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ]

  it('derives a stable, structurally unique primitive recipe for all 40 regions', () => {
    const keys: string[] = []
    for (const region of REGIONS) {
      const profile = REGION_EXPERIENCES[region.id]
      const first = resolveRegionPrimitiveRecipe(profile)
      const second = resolveRegionPrimitiveRecipe(profile)
      expect(second, region.id).toEqual(first)
      expect(first.materialPattern, region.id).toBeGreaterThanOrEqual(0)
      expect(first.materialPattern, region.id).toBeLessThan(7)
      expect(first.ambientPool, region.id).toBeGreaterThanOrEqual(4)
      expect(first.ambientPool, region.id).toBeLessThanOrEqual(10)
      keys.push(first.structuralKey)
    }
    expect(new Set(keys).size).toBe(40)
  })

  it('keeps code-native drawing to bounded navigation/motion/telegraphs and leaves world art to raster', () => {
    for (const region of REGIONS) {
      const profile = REGION_EXPERIENCES[region.id]
      const stage = buildRegionExperienceStage(grid, 36, profile, themeForBg(region.bg), 417, true, 0xffd990)
      expect(stage.budget.textures, region.id).toBe(0)
      expect(stage.budget.staticGraphics, region.id).toBe(1)
      expect(stage.budget.landmarks, region.id).toBe(0)
      expect(stage.budget.navigationMarks, region.id).toBeGreaterThan(0)
      expect(stage.budget.navigationMarks, region.id).toBeLessThanOrEqual(7)
      expect(stage.budget.telegraphs, region.id).toBe(2)
      expect(stage.budget.ambient, region.id).toBeGreaterThanOrEqual(4)
      expect(stage.budget.ambient, region.id).toBeLessThanOrEqual(10)
      stage.setDangerTelegraph(72, 72, true, false)
      stage.update(240, false)
      stage.update(480, true)
      stage.ground.destroy({ children: true })
      stage.mid.destroy({ children: true })
      stage.effects.destroy({ children: true })
    }
  })

  it('resolves the existing safe ambience hook while keeping exact one-shots explicitly visual-only', () => {
    for (const region of REGIONS) {
      const audio = resolveRegionAudioContract(region.id)
      expect(audio?.soundCueId, region.id).toBe(REGION_EXPERIENCES[region.id].soundCue.id)
      expect(audio?.navigationCueId, region.id).toBe(REGION_EXPERIENCES[region.id].navigationCue.id)
      expect(audio?.dangerCueId, region.id).toBe(REGION_EXPERIENCES[region.id].danger.cueId)
      expect(audio?.oneShotConsumption, region.id).toBe('declared-visual-only')
    }
    expect(resolveRegionAudioContract('no_such_region')).toBeNull()
  })
})
