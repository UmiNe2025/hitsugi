// 敵影(シンボルエンカウント)の妖怪シルエット(品質刷新v3.1 M7c)
// 種族4種(獣/火魂/鬼/浮遊)を地域tierの主属性2種から決定論選出。
// 追跡テレグラフ(眼のフレア+「!」)と金の変種(M15-5の土台)を備える。
import { Container, Sprite } from 'pixi.js'
import type { Graphics, Texture } from 'pixi.js'
import { ENEMIES } from '../../core/data/enemies'
import { getReduceMotion } from '../../core/settings'
import { ELEMENT_COLORS } from './theme'
import type { TextureRegistry } from './textures'

export type ShadeSpecies = 'beast' | 'wisp' | 'oni' | 'float'

const SPECIES_BY_ELEMENT: Record<string, ShadeSpecies> = {
  fire: 'wisp',
  moon: 'float',
  star: 'float',
  water: 'float',
  wind: 'beast',
  earth: 'oni',
}

// tierの敵から最頻属性2種を決定論で取り出し、種族と色に写像する
export function shadeArchetypes(tier: number): { species: ShadeSpecies; accent: number }[] {
  const pool = ENEMIES.filter((e) => e.tier === tier)
  const counts = new Map<string, number>()
  for (const e of pool) counts.set(e.element, (counts.get(e.element) ?? 0) + 1)
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2)
  if (top.length === 0) top.push(['moon', 1])
  if (top.length === 1) top.push(top[0])
  return top.map(([el]) => ({
    species: SPECIES_BY_ELEMENT[el] ?? 'beast',
    accent: ELEMENT_COLORS[el] ?? 0xff9d45,
  }))
}

// M24 §4.4: fillColorを外出し — 黒本体(既定)だけでなく、縁レイヤーを同形状×属性色で焼くために使う。
function drawSpecies(g: Graphics, species: ShadeSpecies, tier: number, fillColor = 0x05070d): void {
  const s = 1 + (tier - 1) * 0.12 // tierで一回り大きく
  const B = fillColor
  switch (species) {
    case 'beast': {
      g.ellipse(0, -8 * s, 12 * s, 8.5 * s).fill(B)
      g.ellipse(-9 * s, -13 * s, 4 * s, 5 * s).fill(B) // 頭
      g.moveTo(-12 * s, -16 * s).lineTo(-9.5 * s, -22 * s).lineTo(-7 * s, -16.5 * s).closePath().fill(B) // 耳
      g.moveTo(-7 * s, -17 * s).lineTo(-5 * s, -21 * s).lineTo(-3.5 * s, -16 * s).closePath().fill(B)
      g.moveTo(11 * s, -9 * s).quadraticCurveTo(19 * s, -14 * s, 16 * s, -4 * s).stroke({ color: B, width: 3 * s }) // 尾
      break
    }
    case 'wisp': {
      g.moveTo(0, -26 * s).quadraticCurveTo(9 * s, -18 * s, 7 * s, -8 * s)
        .quadraticCurveTo(5 * s, -1 * s, 0, 0)
        .quadraticCurveTo(-5 * s, -1 * s, -7 * s, -8 * s)
        .quadraticCurveTo(-9 * s, -18 * s, 0, -26 * s).fill(B)
      g.moveTo(6 * s, -20 * s).quadraticCurveTo(12 * s, -24 * s, 10 * s, -15 * s).closePath().fill({ color: B, alpha: 0.85 })
      g.moveTo(-6 * s, -22 * s).quadraticCurveTo(-11 * s, -26 * s, -9 * s, -16 * s).closePath().fill({ color: B, alpha: 0.85 })
      break
    }
    case 'oni': {
      g.ellipse(0, -9 * s, 11 * s, 10 * s).fill(B)
      g.rect(-8 * s, -4 * s, 16 * s, 4 * s).fill(B)
      g.moveTo(-6 * s, -17 * s).lineTo(-4 * s, -23 * s).lineTo(-2 * s, -17.5 * s).closePath().fill(B) // 角
      g.moveTo(2 * s, -17.5 * s).lineTo(4 * s, -23 * s).lineTo(6 * s, -17 * s).closePath().fill(B)
      break
    }
    case 'float': {
      g.circle(0, -14 * s, 9 * s).fill(B)
      g.moveTo(7 * s, -10 * s).quadraticCurveTo(15 * s, -6 * s, 11 * s, 0)
        .quadraticCurveTo(8 * s, -4 * s, 5 * s, -6 * s).closePath().fill({ color: B, alpha: 0.9 })
      g.moveTo(-7 * s, -11 * s).quadraticCurveTo(-13 * s, -5 * s, -9 * s, -1 * s)
        .quadraticCurveTo(-7 * s, -5 * s, -4 * s, -7 * s).closePath().fill({ color: B, alpha: 0.8 })
      break
    }
  }
}

export interface ShadeVisual {
  node: Container
  species: ShadeSpecies
  golden: boolean
  setAlert: (alert: boolean) => void
  bob: (timeMs: number, phase: number) => void
}

export function createShadeVisual(
  registry: TextureRegistry,
  tile: number,
  tier: number,
  archetype: { species: ShadeSpecies; accent: number },
  golden: boolean,
): ShadeVisual {
  const { species, accent } = archetype
  const node = new Container()

  // 接地影(浮遊種はなし)
  if (species !== 'float') {
    const sh = new Sprite(registry.make('shadow', (g) => g.ellipse(0, 0, 13, 5).fill({ color: 0x000000, alpha: 0.4 })))
    sh.anchor.set(0.5)
    sh.position.set(tile / 2, tile * 0.85)
    node.addChild(sh)
  }

  // M24 §4.4: 属性色は全面塗り(旧: 加算オーラの塗り潰し)をやめ、「縁・足元・目」だけに絞る。
  // 縁は本体と同じ輪郭を一回り大きく属性色で焼き、上に黒本体を重ねることで縁だけ覗かせる(俺屍式の墨絵輪郭と同文法)。
  const rimColor = golden ? 0xc9a86a : accent
  const rimTex = registry.make(`shade:${species}:${tier}:rim:${rimColor.toString(16)}`, (g) => {
    drawSpecies(g, species, tier, rimColor)
  })
  // 金個体だけ縁を二重化(外側の淡い縁+内側の濃い縁)して、色だけに頼らない形状差を出す(§4.4)。
  if (golden) {
    const rimOuter = new Sprite(rimTex)
    rimOuter.anchor.set(0.5, 1)
    rimOuter.position.set(tile / 2, tile * 0.86)
    rimOuter.scale.set(1.34, 1.28)
    rimOuter.alpha = 0.45
    node.addChild(rimOuter)
  }
  const rim = new Sprite(rimTex)
  rim.anchor.set(0.5, 1)
  rim.position.set(tile / 2, tile * 0.86)
  rim.scale.set(1.16, 1.12)
  rim.alpha = golden ? 0.95 : 0.8
  node.addChild(rim)

  // 警戒時のみ点す足元波紋(傷朱)。通常時は非表示 — 属性色の縁だけが常時の識別手段。
  const rippleTex = registry.make('shade:ripple', (g) => {
    g.ellipse(0, 0, 11, 4.4).stroke({ color: 0xc73e3a, alpha: 0.9, width: 1.6 })
  })
  const ripple = new Sprite(rippleTex)
  ripple.anchor.set(0.5)
  ripple.position.set(tile / 2, tile * 0.92)
  ripple.visible = false
  node.addChild(ripple)

  // 本体シルエット(黒) — 縁の上に重ねて「輪郭だけ色付き」の見た目を作る
  const bodyTex: Texture = registry.make(`shade:${species}:${tier}`, (g) => {
    drawSpecies(g, species, tier)
  })
  const body = new Sprite(bodyTex)
  body.anchor.set(0.5, 1)
  body.position.set(tile / 2, tile * 0.86)
  node.addChild(body)

  // 金個体の粒子(§4.4: 色だけでなく形状/粒子でも区別) — 本体まわりに纏う小さな金粒
  const grains: { sp: Sprite; bx: number; by: number; ph: number }[] = []
  if (golden) {
    const grainTex = registry.make('shade:grain', (g) => {
      g.circle(0, 0, 1.6).fill({ color: 0xffe1a0, alpha: 0.95 })
    })
    const grainOffsets: [number, number, number][] = [[-9, -6, 0], [8, -10, 2.1], [3, 4, 4.2]]
    for (const [bx, by, ph] of grainOffsets) {
      const gr = new Sprite(grainTex)
      gr.anchor.set(0.5)
      gr.blendMode = 'add'
      gr.position.set(tile / 2 + bx, tile * 0.62 + by)
      node.addChild(gr)
      grains.push({ sp: gr, bx, by, ph })
    }
  }

  // 眼(tier3以上は第三の眼)
  const eyeTex = registry.make(`eye:${(golden ? 0xffe8b0 : accent).toString(16)}`, (g) => {
    g.circle(0, 0, 2).fill(golden ? 0xffe8b0 : accent)
  })
  const eyes: Sprite[] = []
  const eyeY = species === 'float' ? tile * 0.42 : species === 'wisp' ? tile * 0.4 : tile * 0.52
  const eyeXs = tier >= 3 ? [-4.5, 0, 4.5] : [-3.6, 3.6]
  for (const ex of eyeXs) {
    const e = new Sprite(eyeTex)
    e.anchor.set(0.5)
    e.position.set(tile / 2 + ex, ex === 0 ? eyeY - 4 : eyeY)
    eyes.push(e)
    node.addChild(e)
  }

  // 「!」テレグラフ(通常は非表示)
  const exTex = registry.make('exclaim', (g) => {
    g.roundRect(-1.6, -14, 3.2, 9, 1.5).fill(0xffd23e)
    g.circle(0, -2, 1.8).fill(0xffd23e)
  })
  const exclaim = new Sprite(exTex)
  exclaim.anchor.set(0.5, 1)
  exclaim.position.set(tile / 2, -2)
  exclaim.visible = false
  node.addChild(exclaim)

  let alertNow = false
  let exclaimT = 0
  let rippleT = 0

  return {
    node,
    species,
    golden,
    setAlert(alert: boolean) {
      if (alert === alertNow) return
      alertNow = alert
      const tint = alert ? 0xff4a3a : 0xffffff
      for (const e of eyes) {
        e.tint = golden ? 0xffe8b0 : tint
        e.scale.set(alert ? 1.8 : 1)
      }
      // M24 §4.4: 警戒時だけ傷朱の足元波紋を点す(通常時の識別は縁1pxのみ)
      ripple.visible = alert
      rippleT = 0
      exclaim.visible = alert
      exclaimT = 0
    },
    bob(timeMs: number, phase: number) {
      const amp = species === 'float' ? 4 : 2.2
      node.pivot.y = Math.sin(timeMs / 450 + phase) * amp
      if (exclaim.visible) {
        exclaimT += 1
        const k = Math.min(1, exclaimT / 8)
        exclaim.scale.set(0.4 + 0.6 * k)
        exclaim.alpha = k < 1 ? k : 0.85 + Math.sin(timeMs / 200) * 0.15
      }
      if (ripple.visible) {
        const rm = getReduceMotion()
        rippleT += 1
        if (rm) {
          // reduced-motion: 波紋を静的な一定形で表示(拡大アニメを止める)
          ripple.scale.set(1)
          ripple.alpha = 0.75
        } else {
          const k = (rippleT % 40) / 40
          ripple.scale.set(0.8 + k * 0.9)
          ripple.alpha = 0.85 * (1 - k)
        }
      }
      if (grains.length > 0) {
        const rm = getReduceMotion()
        for (const gd of grains) {
          const jx = rm ? 0 : Math.sin(timeMs / 520 + gd.ph) * 2.2
          const jy = rm ? 0 : Math.cos(timeMs / 430 + gd.ph) * 2.2
          gd.sp.position.set(tile / 2 + gd.bx + jx, tile * 0.62 + gd.by + jy)
        }
      }
      // 瞬き(数秒ごとにすっと閉じる)
      const blink = Math.sin(timeMs / 1700 + phase * 3)
      const closed = blink > 0.97
      for (const e of eyes) e.scale.y = closed ? 0.2 : e.scale.x
    },
  }
}
