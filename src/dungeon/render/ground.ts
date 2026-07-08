// 地面の一括ベイク(品質刷新v3.1 M7a) — 全タイルを1つのGraphicsに焼き込む
// 旧: 1タイル=1 Graphics(450個) → 新: ground 1個+water 1個(描画コール激減)
// 壁セルには何も塗らない(地色のまま) — 「暗い地面の上に物が立つ」俺屍様式の土台。
import { Graphics } from 'pixi.js'
import { Rng } from '../../core/rng'
import type { TileKind } from '../types'
import type { DungeonTheme } from './theme'

export interface GroundResult {
  ground: Graphics
  water: Graphics | null
  waterPools: { x: number; y: number }[]
  grassCells: { x: number; y: number }[]
}

// 色に揺らぎを加える(RGB各成分をdeltaの範囲で上下)
function jitterColor(color: number, delta: number, rng: Rng): number {
  const d = Math.round((rng.next() * 2 - 1) * delta)
  const r = Math.max(0, Math.min(255, ((color >> 16) & 0xff) + d))
  const g = Math.max(0, Math.min(255, ((color >> 8) & 0xff) + d))
  const b = Math.max(0, Math.min(255, (color & 0xff) + d))
  return (r << 16) | (g << 8) | b
}

function lift(color: number, amount: number): number {
  const r = Math.min(255, ((color >> 16) & 0xff) + amount)
  const g = Math.min(255, ((color >> 8) & 0xff) + amount)
  const b = Math.min(255, (color & 0xff) + amount)
  return (r << 16) | (g << 8) | b
}

const SPECIAL_DISC: TileKind[] = ['chest', 'camp', 'shrine', 'stairs', 'entrance', 'boss', 'monument']

export function buildGround(
  grid: TileKind[][],
  tile: number,
  theme: DungeonTheme,
  seed: number,
): GroundResult {
  const rng = new Rng(seed || 1)
  const h = grid.length
  const w = grid[0]?.length ?? 0
  const ground = new Graphics()
  const waterPools: { x: number; y: number }[] = []
  const grassCells: { x: number; y: number }[] = []

  // 1) 全面を地色で(奥の壁は闇に沈む)
  ground.rect(0, 0, w * tile, h * tile).fill(theme.groundBase)

  const walkableAt = (x: number, y: number) => {
    const k = grid[y]?.[x]
    return k !== undefined && k !== 'wall' && k !== 'water'
  }

  // 1.5) 壁の立体化 — 歩行域に接する壁セルだけ薄く起こし、境界に縁光(墨絵の輪郭)。
  // 奥(非隣接)の壁は闇のまま = 部屋の形が読めるのに空間の底は見えない、の両立。
  const wallBody = lift(theme.groundBase, 9)
  const wallRim = lift(theme.groundBase, 44)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (grid[y][x] !== 'wall') continue
      const nb = [walkableAt(x, y - 1), walkableAt(x, y + 1), walkableAt(x - 1, y), walkableAt(x + 1, y)]
      if (!nb.some(Boolean)) continue
      ground.rect(x * tile, y * tile, tile, tile).fill(jitterColor(wallBody, theme.groundJitter, rng))
      // 床に面した辺へ縁光(上=nb[0]…の順で 上/下/左/右)
      if (nb[0]) ground.rect(x * tile, y * tile, tile, 2).fill({ color: wallRim, alpha: 0.42 })
      if (nb[1]) ground.rect(x * tile, y * tile + tile - 2, tile, 2).fill({ color: wallRim, alpha: 0.5 })
      if (nb[2]) ground.rect(x * tile, y * tile, 2, tile).fill({ color: wallRim, alpha: 0.38 })
      if (nb[3]) ground.rect(x * tile + tile - 2, y * tile, 2, tile).fill({ color: wallRim, alpha: 0.38 })
    }
  }

  // 2) 歩行セルのトーンジッタ+小石スペックル
  const floorTone = lift(theme.groundBase, 24)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const kind = grid[y][x]
      if (kind === 'wall') continue
      if (kind === 'water') {
        ground.rect(x * tile, y * tile, tile, tile).fill(theme.waterDeep)
        waterPools.push({ x, y })
        continue
      }
      const base = kind === 'grass' ? theme.grass : floorTone
      ground.rect(x * tile, y * tile, tile, tile).fill(jitterColor(base, theme.groundJitter, rng))
      // 目地 — セル下端に極薄の陰。ベイク一回きりなので描画コストは増えない
      ground.rect(x * tile, y * tile + tile - 1, tile, 1).fill({ color: theme.groundBase, alpha: 0.28 })
      if (kind === 'grass') grassCells.push({ x, y })
      // 小石・土の斑(矩形=頂点4つで軽い)
      const speckles = rng.int(0, 2)
      for (let i = 0; i < speckles; i++) {
        const sx = x * tile + rng.int(3, tile - 6)
        const sy = y * tile + rng.int(3, tile - 6)
        const s = rng.int(2, 4)
        const up = rng.chance(0.5)
        ground
          .rect(sx, sy, s, s)
          .fill({ color: up ? lift(base, 18) : theme.groundBase, alpha: 0.1 + rng.next() * 0.1 })
      }
    }
  }

  // 3) 大きな染み(少数の楕円)
  const stains = rng.int(6, 10)
  for (let i = 0; i < stains; i++) {
    const cx = rng.int(2, w - 3) * tile
    const cy = rng.int(2, h - 3) * tile
    ground
      .ellipse(cx, cy, tile * (1.2 + rng.next() * 2.2), tile * (0.8 + rng.next() * 1.4))
      .fill({ color: theme.stain, alpha: 0.05 + rng.next() * 0.04 })
  }

  // 4) 下草セルへ短いストロークを焼く(揺れる房はdecal層で別途)
  for (const { x, y } of grassCells) {
    const blades = rng.int(2, 4)
    for (let i = 0; i < blades; i++) {
      const bx = x * tile + rng.int(4, tile - 8)
      const by = y * tile + rng.int(6, tile - 6)
      ground.rect(bx, by - 5, 2, 5).fill({ color: lift(theme.grass, 22), alpha: 0.5 })
    }
  }

  // 5) 特殊タイルの足元に淡い座布団(標識スプライトはmid層)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (SPECIAL_DISC.includes(grid[y][x])) {
        ground
          .circle(x * tile + tile / 2, y * tile + tile / 2, tile * 0.42)
          .fill({ color: lift(theme.groundBase, 26), alpha: 0.35 })
      }
    }
  }

  // 6) 水面ハイライト層(tickで8Hz再描画)
  let water: Graphics | null = null
  if (waterPools.length > 0) {
    water = new Graphics()
    updateWater(water, waterPools, tile, theme, 0)
  }

  return { ground, water, waterPools, grassCells }
}

// 水面のさざ波 — 少セルなので毎回引き直しても安い
export function updateWater(
  g: Graphics,
  pools: { x: number; y: number }[],
  tile: number,
  theme: DungeonTheme,
  timeMs: number,
): void {
  g.clear()
  const t = timeMs / 1000
  for (let i = 0; i < pools.length; i++) {
    const { x, y } = pools[i]
    const phase = (i * 1.7) % Math.PI
    const a = 0.18 + 0.12 * Math.sin(t * 1.6 + phase)
    const r = tile * (0.22 + 0.08 * Math.sin(t * 1.1 + phase * 2))
    g.ellipse(x * tile + tile / 2, y * tile + tile / 2, r * 1.6, r * 0.7)
      .stroke({ color: theme.waterGlint, alpha: a, width: 1.5 })
    if (i % 2 === 0) {
      g.ellipse(x * tile + tile * 0.35, y * tile + tile * 0.3, r * 0.8, r * 0.35)
        .stroke({ color: theme.waterGlint, alpha: a * 0.6, width: 1 })
    }
  }
}
