import { describe, expect, it } from 'vitest'
import {
  villageFacilityAt, villageIsBlockedTile, villageTileAt,
} from '../src/village/engine'
import {
  buildVillageFacadesV2,
  defaultVillageFacadeAssets,
  resolveVillageSceneCoverage,
  villageFacadeAssetUrls,
  VILLAGE_FACADE_IDS,
  VILLAGE_FACADE_PRESENTATION,
  VILLAGE_FACADE_STATE_CUES,
  VILLAGE_V2_FACADE_ANCHORS,
} from '../src/village/render/facades'
import { VILLAGE_FOREGROUND_OCCLUDERS } from '../src/village/render/foreground'
import { VILLAGE_V2_GROUND_MARKER } from '../src/village/render/ground'
import {
  defaultVillageEnvironmentAsset,
  VILLAGE_RASTER_ENVIRONMENT_MARKER,
} from '../src/village/render/environment'

describe('AR1R-A 郷complete-frame contract', () => {
  it('V2 ground hookは一続きのmaterial patchを宣言し、格子目地を名乗らない', () => {
    expect(VILLAGE_V2_GROUND_MARKER).toBe('continuous-dirt-stone-wet')
    expect(VILLAGE_V2_GROUND_MARKER).not.toMatch(/checker|grid|cell|seam/i)
  })

  it('V2の通常表示は家・灯籠・池を一枚のラスター環境画へ統一する', () => {
    expect(VILLAGE_RASTER_ENVIRONMENT_MARKER).toBe('raster-painted-village')
    expect(defaultVillageEnvironmentAsset('/hitsugi/')).toBe(
      '/hitsugi/img/visual-recovery/village/village-lantern-hub-map-v2.webp',
    )
  })

  it('鍛冶Kと大燈籠Lの座標・focus・collisionはV1正典のまま', () => {
    const forge = VILLAGE_V2_FACADE_ANCHORS.forge
    const lantern = VILLAGE_V2_FACADE_ANCHORS.greatLantern
    expect(villageTileAt(forge.x, forge.y)).toBe('K')
    expect(villageFacilityAt(forge.x, forge.y)?.kind).toBe('forge')
    expect(villageIsBlockedTile(forge.x, forge.y)).toBe(true)
    expect(villageTileAt(lantern.x, lantern.y)).toBe('L')
    expect(villageFacilityAt(lantern.x, lantern.y)?.kind).toBe('lantern')
    expect(villageIsBlockedTile(lantern.x, lantern.y)).toBe(true)
    expect(villageIsBlockedTile(forge.entranceX, forge.entranceY)).toBe(false)
  })

  it('通常/危機とも5施設が同じ投影・接地・左上光のpresentationへ揃う', () => {
    expect(VILLAGE_FACADE_PRESENTATION).toEqual({
      projection: 'three-quarter-top-down',
      lightDirection: 'upper-left',
      contact: 'soft-ellipse-and-threshold',
      stateCueChannel: 'shape',
    })
    for (const state of ['normal', 'bloodline-crisis'] as const) {
      const facades = buildVillageFacadesV2(46, state)
      expect(facades.map((facade) => facade.id)).toEqual(VILLAGE_FACADE_IDS)
      expect(facades.every((facade) => facade.node.children.length >= 3)).toBe(true)
      for (const facade of facades) facade.node.destroy({ children: true })
    }
  })

  it('5施設の採用WebPをBASE_URL配下へ解決する', () => {
    const assets = defaultVillageFacadeAssets('/hitsugi/')
    expect(assets.forge?.normal).toBe('/hitsugi/img/visual-recovery/village/forge-facade-hvr1-v1.webp')
    expect(assets.forge?.['bloodline-crisis']).toBe(assets.forge?.normal)
    expect(assets.pact?.normal).toBe('/hitsugi/img/visual-recovery/village/star-shrine-hvr1-v1.webp')
    expect(assets.tofu?.normal).toBe('/hitsugi/img/visual-recovery/village/tofu-shop-hvr1-v1.webp')
    expect(assets.depart?.normal).toBe('/hitsugi/img/visual-recovery/village/departure-gate-hvr1-v1.webp')
    expect(assets.greatLantern?.normal).toBe('/hitsugi/img/visual-recovery/village/great-lantern-hvr1-v1.webp')
    expect(villageFacadeAssetUrls(assets, 'normal')).toHaveLength(5)
  })

  it('5点が解決したframe diagnosticsはplaceholder/mismatch=0になる', () => {
    const assets = defaultVillageFacadeAssets('/')
    const resolved = new Set(villageFacadeAssetUrls(assets, 'normal').map(({ url }) => url!))
    expect(resolveVillageSceneCoverage(assets, 'normal', resolved)).toEqual({
      total: 5, resolved: 5, placeholder: 0, mismatch: 0, ready: true,
    })
    resolved.delete(assets.tofu!.normal!)
    expect(resolveVillageSceneCoverage(assets, 'normal', resolved)).toMatchObject({
      resolved: 4, placeholder: 1, mismatch: 0, ready: false,
    })
  })

  it('normal/crisisは全5施設でtint以外のshape cueが異なる', () => {
    for (const id of VILLAGE_FACADE_IDS) {
      const normal = VILLAGE_FACADE_STATE_CUES[id].normal
      const crisis = VILLAGE_FACADE_STATE_CUES[id]['bloodline-crisis']
      expect(normal.length).toBeGreaterThan(0)
      expect(crisis.length).toBeGreaterThan(0)
      expect(crisis).not.toEqual(normal)
    }
  })

  it('K/L/S/T/Gの全施設tileは衝突・focus正典を保持する', () => {
    const anchors = [
      [3, 2, 'forge'], [10, 1, 'pact'], [18, 2, 'talk-tane'],
      [10, 9, 'depart'], [11, 5, 'lantern'],
    ] as const
    for (const [x, y, kind] of anchors) {
      expect(villageFacilityAt(x, y)?.kind).toBe(kind)
      expect(villageIsBlockedTile(x, y)).toBe(true)
    }
  })

  it('前景occluderは入口と操作reserveを避ける契約を持つ', () => {
    expect(VILLAGE_FOREGROUND_OCCLUDERS.length).toBeGreaterThan(0)
    expect(VILLAGE_FOREGROUND_OCCLUDERS.every((item) => item.entranceSafe && item.controlSafe)).toBe(true)
  })
})
