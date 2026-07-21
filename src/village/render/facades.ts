import { Assets, Container, Graphics, Sprite, type Texture } from 'pixi.js'
import type { VillageLifeState } from '../../core/data/village_visual_state'

export interface VillageFacadeAssetSet {
  forge?: Partial<Record<VillageLifeState, string>>
  pact?: Partial<Record<VillageLifeState, string>>
  tofu?: Partial<Record<VillageLifeState, string>>
  depart?: Partial<Record<VillageLifeState, string>>
  greatLantern?: Partial<Record<VillageLifeState, string>>
}

export const VILLAGE_FACADE_IDS = [
  'forge', 'pact', 'tofu', 'depart', 'great-lantern',
] as const

export type VillageFacadeId = typeof VILLAGE_FACADE_IDS[number]

export const VILLAGE_FACADE_PRESENTATION = {
  projection: 'three-quarter-top-down',
  lightDirection: 'upper-left',
  contact: 'soft-ellipse-and-threshold',
  stateCueChannel: 'shape',
} as const

export function defaultVillageFacadeAssets(baseUrl: string): VillageFacadeAssetSet {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const forge = `${base}img/visual-recovery/village/forge-facade-hvr1-v1.webp`
  const pact = `${base}img/visual-recovery/village/star-shrine-hvr1-v1.webp`
  const tofu = `${base}img/visual-recovery/village/tofu-shop-hvr1-v1.webp`
  const depart = `${base}img/visual-recovery/village/departure-gate-hvr1-v1.webp`
  const greatLantern = `${base}img/visual-recovery/village/great-lantern-hvr1-v1.webp`
  return {
    forge: { normal: forge, 'bloodline-crisis': forge },
    pact: { normal: pact, 'bloodline-crisis': pact },
    tofu: { normal: tofu, 'bloodline-crisis': tofu },
    depart: { normal: depart, 'bloodline-crisis': depart },
    greatLantern: { normal: greatLantern, 'bloodline-crisis': greatLantern },
  }
}

export function villageFacadeAssetUrls(
  assets: VillageFacadeAssetSet,
  lifeState: VillageLifeState,
): ReadonlyArray<{ id: VillageFacadeId; url?: string }> {
  const byId: Record<VillageFacadeId, Partial<Record<VillageLifeState, string>> | undefined> = {
    forge: assets.forge,
    pact: assets.pact,
    tofu: assets.tofu,
    depart: assets.depart,
    'great-lantern': assets.greatLantern,
  }
  return VILLAGE_FACADE_IDS.map((id) => ({ id, url: byId[id]?.[lifeState] }))
}

export interface VillageSceneCoverage {
  total: number
  resolved: number
  placeholder: number
  mismatch: number
  ready: boolean
}

/**
 * Runtime diagnostics for the one-frame closure contract. A loaded facade is not
 * considered mismatched merely because its source dimensions differ: every image
 * passes through the shared projection/contact/light presentation below.
 */
export function resolveVillageSceneCoverage(
  assets: VillageFacadeAssetSet,
  lifeState: VillageLifeState,
  resolvedUrls: ReadonlySet<string>,
): VillageSceneCoverage {
  const entries = villageFacadeAssetUrls(assets, lifeState)
  const resolved = entries.filter(({ url }) => !!url && resolvedUrls.has(url)).length
  const mismatch = VILLAGE_FACADE_PRESENTATION.projection === 'three-quarter-top-down'
    && VILLAGE_FACADE_PRESENTATION.lightDirection === 'upper-left'
    && VILLAGE_FACADE_PRESENTATION.contact === 'soft-ellipse-and-threshold'
    ? 0
    : entries.length
  const placeholder = entries.length - resolved
  return { total: entries.length, resolved, placeholder, mismatch, ready: placeholder === 0 && mismatch === 0 }
}

export interface VillageFacadeLight {
  tx: number
  ty: number
  color: number
  radius: number
  alpha: number
  period: number
  amplitude: number
}

export interface VillageFacadePlacement {
  id: VillageFacadeId
  node: Container
  tx: number
  ty: number
  depthTiles: number
  lights: VillageFacadeLight[]
}

export const VILLAGE_V2_FACADE_ANCHORS = {
  forge: { tile: 'K', x: 3, y: 2, entranceX: 4, entranceY: 4 },
  greatLantern: { tile: 'L', x: 11, y: 5 },
} as const

export function buildVillageFacadesV2(
  tile: number,
  lifeState: VillageLifeState,
  assets: VillageFacadeAssetSet = {},
): VillageFacadePlacement[] {
  const crisis = lifeState === 'bloodline-crisis'
  return [
    forgePlacement(tile, crisis, assets.forge?.[lifeState]),
    restrainedShrine(tile, crisis, assets.pact?.[lifeState]),
    restrainedTofu(tile, crisis, assets.tofu?.[lifeState]),
    restrainedGate(tile, crisis, assets.depart?.[lifeState]),
    lanternPlacement(tile, crisis, assets.greatLantern?.[lifeState]),
  ]
}

function forgePlacement(tile: number, crisis: boolean, assetUrl?: string): VillageFacadePlacement {
  const node = new Container()
  const fallback = new Graphics()
  node.addChild(facadeContact(tile, 1.05, 1.92, 1.28))

  // 石基壇、焦げた母屋、張り出した鍛冶場を別層の輪郭で読む。
  fallback.poly([-
    tile * 0.18, tile * 1.78,
    tile * 2.23, tile * 1.78,
    tile * 2.08, tile * 2.03,
    tile * 0.02, tile * 2.03,
  ]).fill(0x11121c)
  fallback.poly([
    -tile * 0.12, tile * 0.42,
    tile * 0.30, tile * 0.12,
    tile * 1.98, tile * 0.2,
    tile * 2.16, tile * 0.62,
    tile * 2.02, tile * 1.82,
    tile * 0.06, tile * 1.82,
  ]).fill(crisis ? 0x17131a : 0x211821).stroke({ color: 0x473849, width: 2.2, alpha: 0.78 })
  fallback.poly([
    -tile * 0.32, tile * 0.42,
    tile * 0.48, -tile * 0.24,
    tile * 1.46, -tile * 0.35,
    tile * 2.34, tile * 0.26,
    tile * 2.12, tile * 0.54,
    tile * 0.37, tile * 0.34,
  ]).fill(0x18131d).stroke({ color: 0x51404a, width: 2.4, alpha: 0.72 })
  // 炉の煙突と張り出し。
  fallback.poly([
    tile * 1.58, tile * 0.04,
    tile * 1.68, -tile * 0.82,
    tile * 1.95, -tile * 0.79,
    tile * 1.94, tile * 0.18,
  ]).fill(0x110f16)
  fallback.poly([
    -tile * 0.28, tile * 0.76,
    tile * 0.42, tile * 0.56,
    tile * 0.58, tile * 1.48,
    -tile * 0.18, tile * 1.62,
  ]).fill(0x291d20)
  // 南向き入口。危機時も形は消さず、戸板を半ば閉じる。
  fallback.poly([
    tile * 0.76, tile * 0.86,
    tile * 1.35, tile * 0.82,
    tile * 1.38, tile * 1.86,
    tile * 0.74, tile * 1.86,
  ]).fill(0x07080d).stroke({ color: 0x594638, width: 2, alpha: 0.8 })
  fallback.poly([
    tile * 0.83, tile * 0.94,
    tile * (crisis ? 1.22 : 0.96), tile * 0.91,
    tile * (crisis ? 1.24 : 0.98), tile * 1.72,
    tile * 0.82, tile * 1.75,
  ]).fill(0x2d211c)
  fallback.moveTo(tile * 0.03, tile * 1.82).lineTo(tile * 2.02, tile * 1.82)
    .stroke({ color: 0x6a5140, width: 3, alpha: 0.55 })
  // 鉄床と炉口を輪郭の識別点にする。
  fallback.poly([
    tile * 1.62, tile * 1.30,
    tile * 2.14, tile * 1.26,
    tile * 2.02, tile * 1.48,
    tile * 1.72, tile * 1.52,
  ]).fill(0x4d4650)
  fallback.poly([
    tile * 1.65, tile * 1.55,
    tile * 2.05, tile * 1.52,
    tile * 1.97, tile * 1.78,
    tile * 1.68, tile * 1.80,
  ]).fill(crisis ? 0x5d2d25 : 0xe06b2e)
  fallback.ellipse(tile * 0.26, tile * 0.78, tile * 0.18, tile * 0.13)
    .fill({ color: crisis ? 0x796141 : 0xe8a33d, alpha: crisis ? 0.34 : 0.78 })
  node.addChild(fallback)
  attachOptionalAsset(node, fallback, assetUrl, tile * 2.8, tile * 3.0, tile * 1.02, tile * 2.02, crisis)
  node.addChild(facadeStateCue('forge', tile, crisis))

  return {
    id: 'forge', node, tx: 3, ty: 2, depthTiles: 2.0,
    lights: [{
      tx: 4.65, ty: 3.55, color: 0xff9d45, radius: 18,
      alpha: crisis ? 0.07 : 0.13, period: 820, amplitude: crisis ? 0.012 : 0.026,
    }],
  }
}

function lanternPlacement(tile: number, crisis: boolean, assetUrl?: string): VillageFacadePlacement {
  const node = new Container()
  const fallback = new Graphics()
  const cx = tile * 0.5
  node.addChild(facadeContact(tile, 0.5, 1.0, 0.92))

  // 地面へ刻まれた四方位。灯芯そのものは縦長の古木と鉄枠で構成する。
  fallback.poly([
    cx, tile * 1.04,
    -tile * 0.62, tile * 0.72,
    cx, tile * 0.54,
    tile * 1.62, tile * 0.72,
  ]).fill({ color: 0x1a1824, alpha: 0.94 }).stroke({ color: 0x5c4b3b, width: 2, alpha: 0.5 })
  fallback.poly([
    cx, tile * 1.30,
    tile * 0.28, tile * 0.78,
    cx, tile * 0.60,
    tile * 0.73, tile * 0.78,
  ]).fill({ color: 0x2f2a33, alpha: 0.9 })
  fallback.poly([
    tile * 0.27, tile * 0.77,
    tile * 0.34, -tile * 0.74,
    tile * 0.66, -tile * 0.74,
    tile * 0.73, tile * 0.77,
  ]).fill(0x211d28).stroke({ color: 0x5a4b4f, width: 2.4 })
  fallback.poly([
    tile * 0.08, -tile * 0.74,
    cx, -tile * 1.18,
    tile * 0.94, -tile * 0.74,
    tile * 0.78, -tile * 0.55,
    tile * 0.22, -tile * 0.55,
  ]).fill(0x17131d).stroke({ color: 0x51424c, width: 2.2 })
  fallback.poly([
    tile * 0.21, -tile * 0.54,
    tile * 0.79, -tile * 0.54,
    tile * 0.72, tile * 0.15,
    tile * 0.28, tile * 0.15,
  ]).fill(0x332938)
  fallback.poly([
    tile * 0.29, -tile * 0.43,
    tile * 0.70, -tile * 0.43,
    tile * 0.65, tile * 0.02,
    tile * 0.34, tile * 0.02,
  ]).fill({ color: crisis ? 0xbf5a38 : 0xffc56d, alpha: crisis ? 0.62 : 0.96 })
  fallback.moveTo(cx, -tile * 0.42).lineTo(cx, tile * 0.03)
    .stroke({ color: 0x5f473c, width: 2, alpha: 0.65 })
  fallback.moveTo(tile * 0.31, -tile * 0.2).lineTo(tile * 0.67, -tile * 0.2)
    .stroke({ color: 0x5f473c, width: 2, alpha: 0.65 })
  // 危機時は一本だけ赤い結びを残す。通常時の朱は0。
  if (crisis) {
    fallback.moveTo(tile * 0.68, -tile * 0.05)
      .quadraticCurveTo(tile * 0.92, tile * 0.18, tile * 0.76, tile * 0.44)
      .stroke({ color: 0xc73e3a, width: 3, alpha: 0.72 })
  }
  node.addChild(fallback)
  attachOptionalAsset(node, fallback, assetUrl, tile * 2.7, tile * 3.1, tile * 0.5, tile * 1.0, crisis)
  node.addChild(facadeStateCue('great-lantern', tile, crisis))

  return {
    id: 'great-lantern', node, tx: 11, ty: 5, depthTiles: 1.1,
    lights: [{
      tx: 11.5, ty: 4.82, color: crisis ? 0xe0655c : 0xffc36a, radius: 32,
      alpha: crisis ? 0.09 : 0.16, period: 1050, amplitude: crisis ? 0.012 : 0.028,
    }],
  }
}

function restrainedShrine(tile: number, crisis: boolean, assetUrl?: string): VillageFacadePlacement {
  const node = new Container()
  const fallback = new Graphics()
  node.addChild(facadeContact(tile, 1, 0.94, 1.14))
  fallback.poly([
    tile * 0.10, tile * 0.92,
    tile * 0.18, -tile * 0.76,
    tile * 0.34, -tile * 0.76,
    tile * 0.38, tile * 0.92,
  ]).fill(0x251b24)
  fallback.poly([
    tile * 1.62, tile * 0.92,
    tile * 1.66, -tile * 0.76,
    tile * 1.82, -tile * 0.76,
    tile * 1.90, tile * 0.92,
  ]).fill(0x251b24)
  fallback.poly([-
    tile * 0.12, -tile * 0.82,
    tile, -tile * 1.03,
    tile * 2.12, -tile * 0.82,
    tile * 1.98, -tile * 0.62,
    tile * 0.02, -tile * 0.62,
  ]).fill(0x1a151f)
  fallback.moveTo(tile * 0.26, -tile * 0.5).quadraticCurveTo(tile, -tile * 0.24, tile * 1.74, -tile * 0.5)
    .stroke({ color: 0x7b6745, width: 2, alpha: crisis ? 0.3 : 0.52 })
  node.addChild(fallback)
  attachOptionalAsset(node, fallback, assetUrl, tile * 3.0, tile * 3.0, tile, tile * 0.98, crisis)
  node.addChild(facadeStateCue('pact', tile, crisis))
  return { id: 'pact', node, tx: 10, ty: 2.9, depthTiles: 1.9, lights: [] }
}

function restrainedTofu(tile: number, crisis: boolean, assetUrl?: string): VillageFacadePlacement {
  const node = new Container()
  const fallback = new Graphics()
  node.addChild(facadeContact(tile, 1, 1.93, 1.16))
  fallback.poly([
    0, tile * 0.38,
    tile * 0.42, tile * 0.12,
    tile * 1.72, tile * 0.18,
    tile * 2.0, tile * 0.48,
    tile * 1.9, tile * 1.96,
    tile * 0.08, tile * 1.96,
  ]).fill(0x171522)
  fallback.poly([-
    tile * 0.16, tile * 0.38,
    tile * 0.82, -tile * 0.36,
    tile * 2.18, tile * 0.32,
    tile * 1.94, tile * 0.56,
    tile * 0.12, tile * 0.53,
  ]).fill(0x211c2b)
  for (let i = 0; i < 3; i++) {
    fallback.poly([
      tile * (0.28 + i * 0.5), tile * 0.72,
      tile * (0.68 + i * 0.5), tile * 0.70,
      tile * (0.65 + i * 0.5), tile * 1.35,
      tile * (0.30 + i * 0.5), tile * 1.38,
    ]).fill({ color: 0x736b6d, alpha: crisis ? 0.32 : 0.58 })
  }
  node.addChild(fallback)
  attachOptionalAsset(node, fallback, assetUrl, tile * 2.9, tile * 3.0, tile, tile * 2.0, crisis)
  node.addChild(facadeStateCue('tofu', tile, crisis))
  return { id: 'tofu', node, tx: 17, ty: 2, depthTiles: 1.9, lights: [] }
}

function restrainedGate(tile: number, crisis: boolean, assetUrl?: string): VillageFacadePlacement {
  const node = new Container()
  const fallback = new Graphics()
  node.addChild(facadeContact(tile, 1, 0.94, 1.25))
  fallback.poly([
    0, tile,
    tile * 0.03, -tile * 1.08,
    tile * 0.26, -tile * 1.08,
    tile * 0.30, tile,
  ]).fill(0x211811)
  fallback.poly([
    tile * 1.70, tile,
    tile * 1.74, -tile * 1.08,
    tile * 1.97, -tile * 1.08,
    tile * 2, tile,
  ]).fill(0x211811)
  fallback.poly([-
    tile * 0.18, -tile * 1.12,
    tile, -tile * 1.38,
    tile * 2.18, -tile * 1.12,
    tile * 1.98, -tile * 0.93,
    tile * 0.02, -tile * 0.93,
  ]).fill(0x17130f)
  const lampAlpha = crisis ? 0.2 : 0.52
  fallback.ellipse(tile * 0.16, -tile * 0.46, tile * 0.08, tile * 0.11).fill({ color: 0xe8a33d, alpha: lampAlpha })
  fallback.ellipse(tile * 1.84, -tile * 0.46, tile * 0.08, tile * 0.11).fill({ color: 0xe8a33d, alpha: lampAlpha })
  node.addChild(fallback)
  attachOptionalAsset(node, fallback, assetUrl, tile * 3.4, tile * 3.2, tile, tile * 1.02, crisis)
  node.addChild(facadeStateCue('depart', tile, crisis))
  return { id: 'depart', node, tx: 10, ty: 9, depthTiles: 1.9, lights: [] }
}

export const VILLAGE_FACADE_STATE_CUES: Record<
  VillageFacadeId,
  Record<VillageLifeState, readonly string[]>
> = {
  forge: {
    normal: ['open-work-apron', 'lit-anvil'],
    'bloodline-crisis': ['barred-work-apron', 'cold-anvil'],
  },
  pact: {
    normal: ['three-offerings', 'whole-shimenawa'],
    'bloodline-crisis': ['one-offering', 'broken-shimenawa'],
  },
  tofu: {
    normal: ['parted-noren', 'steam-bucket'],
    'bloodline-crisis': ['tied-noren', 'upturned-bucket'],
  },
  depart: {
    normal: ['open-threshold', 'ready-cargo'],
    'bloodline-crisis': ['rope-barrier', 'grounded-cargo'],
  },
  'great-lantern': {
    normal: ['four-open-lights', 'clear-compass'],
    'bloodline-crisis': ['mourning-shroud', 'single-bound-light'],
  },
}

/** Shared short contact shadow plus a threshold edge; never an opaque display-stand oval. */
function facadeContact(tile: number, cx: number, cy: number, radius: number): Graphics {
  const contact = new Graphics()
  contact.ellipse(cx * tile + tile * 0.08, cy * tile + tile * 0.035, radius * tile * 0.86, radius * tile * 0.145)
    .fill({ color: 0x080910, alpha: 0.28 })
  contact.ellipse(cx * tile, cy * tile, radius * tile * 0.61, radius * tile * 0.075)
    .fill({ color: 0x08090e, alpha: 0.38 })
  contact.moveTo((cx - radius * 0.58) * tile, (cy - radius * 0.012) * tile)
    .quadraticCurveTo(cx * tile, (cy - radius * 0.075) * tile, (cx + radius * 0.38) * tile, (cy - radius * 0.04) * tile)
    .stroke({ color: 0x9b8055, width: 1.2, alpha: 0.22 })
  return contact
}

function facadeStateCue(id: VillageFacadeId, tile: number, crisis: boolean): Graphics {
  const cue = new Graphics()
  const danger = 0xc73e3a
  const cloth = 0x5e4a43
  switch (id) {
    case 'forge':
      if (crisis) {
        cue.rect(tile * 0.68, tile * 1.18, tile * 0.76, tile * 0.13).fill({ color: cloth, alpha: 0.94 })
        cue.rect(tile * 0.76, tile * 1.50, tile * 0.66, tile * 0.11).fill({ color: cloth, alpha: 0.9 })
        cue.moveTo(tile * 0.70, tile * 1.20).lineTo(tile * 1.40, tile * 1.58)
          .stroke({ color: danger, width: 2, alpha: 0.66 })
      } else {
        cue.poly([tile * 1.65, tile * 1.66, tile * 2.04, tile * 1.61, tile * 1.92, tile * 1.76, tile * 1.70, tile * 1.78])
          .fill({ color: 0xe8a33d, alpha: 0.42 })
      }
      break
    case 'pact':
      cue.moveTo(tile * 0.22, -tile * 0.48)
        .quadraticCurveTo(tile, crisis ? -tile * 0.12 : -tile * 0.28, tile * 1.78, -tile * 0.48)
        .stroke({ color: crisis ? danger : 0xc9a86a, width: crisis ? 3 : 2, alpha: 0.68 })
      for (let i = 0; i < (crisis ? 1 : 3); i++) {
        cue.ellipse(tile * (0.72 + i * 0.28), tile * 0.78, tile * 0.09, tile * 0.035)
          .fill({ color: crisis ? 0x69564c : 0xc9a86a, alpha: 0.72 })
      }
      if (crisis) cue.lineTo(tile * 1.15, -tile * 0.01).stroke({ color: danger, width: 2, alpha: 0.7 })
      break
    case 'tofu':
      if (crisis) {
        cue.poly([
          tile * 0.30, tile * 0.78, tile * 1.68, tile * 0.74,
          tile * 1.43, tile * 1.33, tile * 0.55, tile * 1.36,
        ]).fill({ color: 0x55484e, alpha: 0.92 })
        cue.circle(tile, tile * 1.02, tile * 0.09).fill({ color: danger, alpha: 0.72 })
        cue.ellipse(tile * 1.68, tile * 1.82, tile * 0.20, tile * 0.08)
          .stroke({ color: 0x6d615a, width: 3, alpha: 0.7 })
      } else {
        for (let i = 0; i < 3; i++) {
          cue.poly([
            tile * (0.28 + i * 0.5), tile * 0.75,
            tile * (0.68 + i * 0.5), tile * 0.73,
            tile * (0.62 + i * 0.5), tile * 1.36,
            tile * (0.32 + i * 0.5), tile * 1.38,
          ]).fill({ color: 0x918684, alpha: 0.38 })
        }
        cue.ellipse(tile * 1.66, tile * 1.82, tile * 0.18, tile * 0.07)
          .stroke({ color: 0xa69a8b, width: 2, alpha: 0.55 })
      }
      break
    case 'depart':
      if (crisis) {
        cue.moveTo(tile * 0.18, -tile * 0.20).lineTo(tile * 1.82, tile * 0.42)
          .stroke({ color: 0x725642, width: 7, alpha: 0.94 })
        cue.moveTo(tile * 1.82, -tile * 0.20).lineTo(tile * 0.18, tile * 0.42)
          .stroke({ color: 0x725642, width: 7, alpha: 0.94 })
        cue.circle(tile, tile * 0.10, tile * 0.09).fill({ color: danger, alpha: 0.74 })
      } else {
        cue.rect(tile * 1.52, tile * 0.55, tile * 0.38, tile * 0.25).fill({ color: 0x4b3828, alpha: 0.86 })
        cue.moveTo(tile * 0.35, tile * 0.95).lineTo(tile * 0.62, tile * 0.18)
          .stroke({ color: 0x786347, width: 2, alpha: 0.42 })
      }
      break
    case 'great-lantern':
      if (crisis) {
        cue.poly([
          tile * 0.20, -tile * 0.40, tile * 0.78, -tile * 0.36,
          tile * 0.68, tile * 0.48, tile * 0.34, tile * 0.54,
        ]).fill({ color: 0x3f303b, alpha: 0.78 })
        cue.moveTo(tile * 0.23, -tile * 0.26).lineTo(tile * 0.71, tile * 0.36)
          .stroke({ color: danger, width: 3, alpha: 0.7 })
      } else {
        for (const x of [0.24, 0.76]) {
          cue.circle(tile * x, -tile * 0.12, tile * 0.045).fill({ color: 0xffc56d, alpha: 0.72 })
          cue.circle(tile * x, tile * 0.16, tile * 0.035).fill({ color: 0xffc56d, alpha: 0.62 })
        }
      }
      break
  }
  return cue
}

function attachOptionalAsset(
  node: Container,
  fallback: Graphics,
  url: string | undefined,
  maxWidth: number,
  maxHeight: number,
  anchorX: number,
  anchorY: number,
  crisis: boolean,
): void {
  if (!url) return
  void Assets.load(url)
    .then((texture: Texture) => {
      if (node.destroyed) return
      const sprite = new Sprite(texture)
      const scale = Math.min(maxWidth / Math.max(1, sprite.width), maxHeight / Math.max(1, sprite.height))
      sprite.anchor.set(0.5, 1)
      sprite.scale.set(scale)
      sprite.position.set(anchorX, anchorY)
      if (crisis) {
        sprite.tint = 0xb6a8a6
        sprite.alpha = 0.9
      }
      // Keep the code-native state cue above the image and the contact below it.
      node.addChildAt(sprite, Math.max(1, node.children.length - 1))
      fallback.visible = false
    })
    .catch(() => {
      // 採用品が未配信・破損なら、同じcollision/入口を持つcode-native silhouetteを維持する。
    })
}
