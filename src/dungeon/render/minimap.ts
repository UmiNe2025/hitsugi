// ミニマップ(品質刷新v3.1 M7c) — 訪問した場所だけが霧から開く
// スクリーン層に置く小さなGraphics。再描画はdirty時のみ(1歩ごと)。
import { Container, Graphics } from 'pixi.js'
import type { TileKind } from '../types'
import { isWalkable } from '../types'

const CELL = 3.2
const PAD = 6

const SPECIAL_DOT: Partial<Record<TileKind, number>> = {
  chest: 0xc9a86a,
  camp: 0xff9d45,
  shrine: 0x9b7fc2,
  stairs: 0xefe6d4,
  entrance: 0x7fae8f,
  boss: 0xc73e3a,
  monument: 0x8d93a8,
}

export class Minimap {
  container = new Container()
  private back = new Graphics()
  private g = new Graphics()
  private grid: TileKind[][]
  private visited = new Set<string>()
  private dirty = true
  private px = 0
  private py = 0
  private w: number
  private h: number

  constructor(grid: TileKind[][]) {
    this.grid = grid
    this.h = grid.length
    this.w = grid[0]?.length ?? 0
    this.container.addChild(this.back, this.g)
    this.back
      .roundRect(-PAD, -PAD, this.w * CELL + PAD * 2, this.h * CELL + PAD * 2, 5)
      .fill({ color: 0x0b0f1e, alpha: 0.6 })
      .stroke({ color: 0xc9a86a, alpha: 0.35, width: 1 })
  }

  // 画面右上に配置(HTMLの上部HUDと重ならない高さ)
  reposition(screenW: number): void {
    this.container.x = screenW - this.w * CELL - PAD - 10
    this.container.y = 56
  }

  reveal(x: number, y: number): void {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && ny >= 0 && nx < this.w && ny < this.h) this.visited.add(`${nx}:${ny}`)
      }
    }
    this.px = x
    this.py = y
    this.dirty = true
  }

  // 眷属「宝目」(土, v3.1 M16-5): 開幕にフロア中の宝箱・石碑の在処だけを点で示す
  revealSpecials(): void {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const kind = this.grid[y]?.[x]
        if (kind === 'chest' || kind === 'monument') this.visited.add(`${x}:${y}`)
      }
    }
    this.dirty = true
  }

  update(timeMs: number): void {
    if (this.dirty) {
      this.dirty = false
      const g = this.g
      g.clear()
      for (const key of this.visited) {
        const [x, y] = key.split(':').map(Number)
        const kind = this.grid[y]?.[x]
        if (!kind || kind === 'wall') continue
        if (kind === 'water') {
          g.rect(x * CELL, y * CELL, CELL, CELL).fill({ color: 0x1a3050, alpha: 0.9 })
        } else if (isWalkable(kind)) {
          g.rect(x * CELL, y * CELL, CELL, CELL).fill({ color: 0x2a3552, alpha: 0.75 })
        }
        const dot = SPECIAL_DOT[kind]
        if (dot) g.circle(x * CELL + CELL / 2, y * CELL + CELL / 2, CELL * 0.62).fill(dot)
      }
      // 自機
      g.circle(this.px * CELL + CELL / 2, this.py * CELL + CELL / 2, CELL * 0.85).fill(0xffd23e)
    }
    this.container.alpha = 0.92 + Math.sin(timeMs / 600) * 0.08
  }
}
