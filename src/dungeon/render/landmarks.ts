// M23(指示7 V2): 署名ランドマーク — 新12地域の「一語で見分く物」を手続き描画する。
// 正本: docs/VISUAL_RECOVERY_DUNGEON_PLAN.md §7.1。入口の近くに一度だけ置く大型プロップ。
// 静止した造形が主で、常時アニメはしない(演出予算は選択時の灯写しへ集中 — §3)。
import { Container, Graphics } from 'pixi.js'
import type { LandmarkKind } from '../../core/data/region_visuals'
import type { DungeonTheme } from './theme'

const INK = 0x090c16 // 影の墨色(propsのDARKと同系)

export function buildLandmark(kind: LandmarkKind, theme: DungeonTheme, tile: number): Container {
  const c = new Container()
  const g = new Graphics()
  c.addChild(g)
  const t = tile
  switch (kind) {
    case 'sunken_lantern': {
      // 水没した石灯籠 — 水面から頭だけ出す
      g.ellipse(0, 0, t * 1.1, t * 0.32).fill({ color: theme.waterDeep, alpha: 0.9 })
      g.rect(-t * 0.18, -t * 0.52, t * 0.36, t * 0.5).fill(0x2a3040)
      g.roundRect(-t * 0.3, -t * 0.86, t * 0.6, t * 0.4, 4).fill(0x39404f)
      g.roundRect(-t * 0.2, -t * 0.76, t * 0.4, t * 0.24, 3).fill({ color: 0xa8e07a, alpha: 0.8 })
      g.poly([-t * 0.4, -t * 0.86, 0, -t * 1.08, t * 0.4, -t * 0.86]).fill(INK)
      g.ellipse(0, 0, t * 0.62, t * 0.16).fill({ color: theme.waterGlint, alpha: 0.28 })
      break
    }
    case 'jizo_row': {
      // 首を伏せた地蔵列
      for (let i = 0; i < 4; i++) {
        const x = (i - 1.5) * t * 0.62
        g.roundRect(x - t * 0.14, -t * 0.52, t * 0.28, t * 0.52, 5).fill(0x353b48)
        g.circle(x + t * 0.05, -t * 0.5, t * 0.12).fill(0x3e4452) // 伏せた首
        g.roundRect(x - t * 0.16, -t * 0.3, t * 0.32, t * 0.14, 3).fill({ color: 0x7a3630, alpha: 0.85 }) // 前掛け
      }
      break
    }
    case 'great_shimenawa': {
      // 巨大な朽ち注連縄 — 二柱の間に垂れる
      g.rect(-t * 1.1, -t * 1.3, t * 0.2, t * 1.3).fill(0x241a14)
      g.rect(t * 0.9, -t * 1.3, t * 0.2, t * 1.3).fill(0x241a14)
      g.moveTo(-t * 1.0, -t * 1.1).quadraticCurveTo(0, -t * 0.55, t * 1.0, -t * 1.1)
        .stroke({ color: 0x8a7a52, width: t * 0.16, alpha: 0.95 })
      for (let i = -1; i <= 1; i++) {
        g.rect(i * t * 0.5 - 2, -t * (0.86 - Math.abs(i) * 0.13), 4, t * 0.3).fill({ color: 0xd8ceb0, alpha: 0.8 })
      }
      break
    }
    case 'ghost_pier': {
      // 岸のない桟橋 — 途中で途切れる板道
      g.ellipse(0, t * 0.1, t * 1.4, t * 0.4).fill({ color: theme.waterDeep, alpha: 0.9 })
      for (let i = 0; i < 4; i++) {
        const a = 1 - i * 0.22
        g.rect(-t * 0.45, -t * 0.1 - i * t * 0.3, t * 0.9, t * 0.22).fill({ color: 0x2c2218, alpha: a })
      }
      g.rect(-t * 0.5, t * 0.02, 5, t * 0.3).fill(0x241c12)
      g.rect(t * 0.42, t * 0.02, 5, t * 0.3).fill(0x241c12)
      break
    }
    case 'jade_pillar': {
      // 割れた翡翠柱
      g.poly([-t * 0.3, 0, -t * 0.36, -t * 1.15, t * 0.05, -t * 1.3, t * 0.2, -t * 0.4, t * 0.3, 0]).fill(0x1e5a44)
      g.poly([-t * 0.36, -t * 1.15, t * 0.05, -t * 1.3, -t * 0.02, -t * 0.9]).fill({ color: 0x6ad2a0, alpha: 0.55 })
      g.moveTo(-t * 0.1, -t * 1.1).lineTo(t * 0.06, -t * 0.5).stroke({ color: 0x9ef0c8, width: 2, alpha: 0.7 })
      g.poly([t * 0.36, 0, t * 0.5, -t * 0.34, t * 0.66, 0]).fill(0x1a4a38) // 折れた根本
      break
    }
    case 'weeping_stones': {
      // 泣き石の群れ — 濡れ筋のある丸石
      const spots: [number, number, number][] = [[-t * 0.7, 0, 0.34], [0, -t * 0.12, 0.46], [t * 0.72, 0, 0.3]]
      for (const [x, y, s] of spots) {
        g.ellipse(x, y, t * s, t * s * 0.82).fill(0x333a49)
        g.moveTo(x - t * s * 0.3, y - t * s * 0.5).quadraticCurveTo(x - t * s * 0.36, y, x - t * s * 0.28, y + t * s * 0.6)
          .stroke({ color: 0x8fa8c8, width: 2, alpha: 0.6 })
      }
      break
    }
    case 'sword_grove': {
      // 刀の森 — 突き立った古刀の群れ
      for (let i = 0; i < 5; i++) {
        const x = (i - 2) * t * 0.44 + (i % 2) * 6
        const h = t * (0.7 + (i % 3) * 0.22)
        const lean = (i - 2) * 0.06
        g.poly([x - 3, 0, x - 3 + lean * h, -h, x + 3 + lean * h, -h, x + 3, 0]).fill(0x4a4438)
        g.rect(x - 7, -h * 0.24, 14, 4).fill(0x33291c) // 鍔
        g.moveTo(x + lean * h, -h).lineTo(x + lean * h, -h * 0.3).stroke({ color: 0xd88858, width: 1.5, alpha: 0.6 }) // 錆
      }
      break
    }
    case 'nested_fusuma': {
      // 入れ子の襖 — 開いた襖の奥にまた襖
      for (let i = 0; i < 3; i++) {
        const s = 1 - i * 0.26
        const w = t * 1.2 * s
        const h = t * 1.05 * s
        g.rect(-w / 2, -h, w, h).fill({ color: i % 2 ? 0x241c30 : 0x1a1426, alpha: 1 })
          .stroke({ color: 0xc9a86a, width: 1.2, alpha: 0.5 - i * 0.12 })
        g.rect(-2, -h, 4, h).fill({ color: 0x0e0a16, alpha: 0.9 })
      }
      break
    }
    case 'endless_torii': {
      // 尽きない鳥居 — 奥へ縮んで連なる
      for (let i = 3; i >= 0; i--) {
        const s = 1 - i * 0.2
        const w = t * 1.3 * s
        const h = t * 1.25 * s
        const a = 1 - i * 0.18
        g.rect(-w / 2, -h, w * 0.12, h).fill({ color: 0x6a2f2a, alpha: a })
        g.rect(w / 2 - w * 0.12, -h, w * 0.12, h).fill({ color: 0x6a2f2a, alpha: a })
        g.rect(-w / 2 - 4 * s, -h - 5 * s, w + 8 * s, 7 * s).fill({ color: 0x7a3630, alpha: a })
      }
      break
    }
    case 'dragon_spine': {
      // 龍骨の稜線 — 弧を描く椎骨
      for (let i = 0; i < 6; i++) {
        const ang = Math.PI * (0.15 + i * 0.12)
        const x = -Math.cos(ang) * t * 1.3
        const y = -Math.sin(ang) * t * 1.05
        const s = t * (0.16 + Math.sin(i / 5 * Math.PI) * 0.1)
        g.poly([x - s, y, x, y - s * 1.7, x + s, y]).fill(0xd8d4c8)
        g.poly([x - s * 0.4, y, x, y - s * 0.9, x + s * 0.4, y]).fill(INK)
      }
      break
    }
    case 'counted_steps': {
      // 数の違う石段 — 数えるたび違う段
      for (let i = 0; i < 5; i++) {
        g.rect(-t * (0.8 - i * 0.1), -i * t * 0.24 - t * 0.2, t * (1.6 - i * 0.2), t * 0.2)
          .fill(i === 2 ? 0x4a4050 : 0x393642) // 一段だけ温かい色味
      }
      break
    }
    case 'empty_banquet': {
      // 無人の宴席 — 膳と徳利だけが並ぶ
      g.roundRect(-t * 1.1, -t * 0.3, t * 2.2, t * 0.34, 4).fill(0x2a2030)
      for (let i = 0; i < 4; i++) {
        const x = (i - 1.5) * t * 0.52
        g.roundRect(x - t * 0.14, -t * 0.42, t * 0.28, t * 0.1, 2).fill(0x6a2f2a) // 膳
        g.circle(x, -t * 0.5, t * 0.06).fill({ color: 0xffe8b8, alpha: 0.85 }) // 盃の光
      }
      g.roundRect(t * 0.86, -t * 0.62, t * 0.14, t * 0.3, 4).fill(0xd8ceb0) // 徳利
      break
    }
  }
  // 共通の接地影
  const shadow = new Graphics().ellipse(0, 4, t * 1.1, t * 0.22).fill({ color: 0x000000, alpha: 0.35 })
  c.addChildAt(shadow, 0)
  return c
}
