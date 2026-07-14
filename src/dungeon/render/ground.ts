// 地面の一括ベイク(品質刷新v3.1 M7a) — 全タイルを1つのGraphicsに焼き込む
// 旧: 1タイル=1 Graphics(450個) → 新: ground 1個+water 1個(描画コール激減)
// 壁セルには何も塗らない(地色のまま) — 「暗い地面の上に物が立つ」俺屍様式の土台。
import { Graphics } from 'pixi.js'
import { Rng } from '../../core/rng'
import type { TileKind } from '../types'
import type { DungeonTheme } from './theme'
import type { GroundKind } from '../../core/data/region_visuals'

export interface GroundResult {
  ground: Graphics
  water: Graphics | null
  waterPools: { x: number; y: number }[]
  grassCells: { x: number; y: number }[]
}

// 色に揺らぎを加える(RGB各成分を同じdeltaで上下 = 明度だけ動く)
function jitterColor(color: number, delta: number, rng: Rng): number {
  const d = Math.round((rng.next() * 2 - 1) * delta)
  const r = Math.max(0, Math.min(255, ((color >> 16) & 0xff) + d))
  const g = Math.max(0, Math.min(255, ((color >> 8) & 0xff) + d))
  const b = Math.max(0, Math.min(255, (color & 0xff) + d))
  return (r << 16) | (g << 8) | b
}

// M25 §3.3: チャンネル独立の揺らぎ。明度のみのjitterでは delta=8 でも 17通りしか作れず、
// 4×4=16セルの窓では鳩の巣原理で色の完全反復が必ず起きる(=「同寸の灰色矩形の反復」に見える原因)。
// チャンネル独立なら 17^3 通りとなり、反復を実質排除できる。振れ幅は同じなので色調は変えない。
function jitterColorRGB(color: number, delta: number, rng: Rng): number {
  const ch = (shift: number) => {
    const v = (color >> shift) & 0xff
    const d = Math.round((rng.next() * 2 - 1) * delta)
    return Math.max(0, Math.min(255, v + d))
  }
  return (ch(16) << 16) | (ch(8) << 8) | ch(0)
}

/** M25 §3.3「4×4タイル以内で同じ床矩形の色を完全反復させない」の機械保証。
 *  歩行セルの色を先にベイクし、4×4窓(Chebyshev距離3以内)に同色があれば振り直す。 */
export function bakeFloorColors(
  grid: TileKind[][],
  theme: DungeonTheme,
  seed: number,
): (number | null)[][] {
  const rng = new Rng(seed || 1)
  const h = grid.length
  const w = grid[0]?.length ?? 0
  const floorTone = lift(theme.groundBase, 38)
  const out: (number | null)[][] = Array.from({ length: h }, () => Array(w).fill(null))
  const clashes = (x: number, y: number, c: number): boolean => {
    for (let dy = -3; dy <= 0; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        if (dy === 0 && dx >= 0) continue // まだ未割当のセルは見ない
        const v = out[y + dy]?.[x + dx]
        if (v != null && v === c) return true
      }
    }
    return false
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const kind = grid[y][x]
      if (kind === 'wall' || kind === 'water') continue
      const base = kind === 'grass' ? theme.grass : floorTone
      let c = jitterColorRGB(base, theme.groundJitter, rng)
      for (let t = 0; t < 12 && clashes(x, y, c); t++) c = jitterColorRGB(base, theme.groundJitter, rng)
      out[y][x] = c
    }
  }
  return out
}

// M25 §3.3: 奥壁(歩行域に非隣接)の「森のシルエット」。
// 従来は地色のまま何も塗らず(ground.ts旧コメント「壁セルには何も塗らない」)、
// 実ブラウザ実測で画面の28.4%が「暗く・のっぺり」= 説明のない暗部になっていた。
// 正典は「闇は残すが、何もない純黒と、未踏の森のシルエットを区別する」と規定する。
// 明度は上げない(常夜を壊さない)。形だけを与えて「入れない密林」と読ませる。
function paintDeepWall(
  g: Graphics,
  cellX: number,
  cellY: number,
  tile: number,
  base: number,
  rng: Rng,
): void {
  // 樹冠 — 小さめの円を4〜6個「重ねて」葉叢にする。大きな単円は内部が平坦(16px窓に収まると
  // 分散0=死に空間判定)になるため、小円の重なりで葉のざわめきを作り、隙間の地色も埋める。
  // liftは+4〜+20に留める(闇のまま輪郭だけ立つ=常夜を壊さない)。
  const n = rng.int(4, 6)
  for (let i = 0; i < n; i++) {
    const cx = cellX + rng.int(-2, tile + 2)
    const cy = cellY + rng.int(-2, tile + 2)
    const r = tile * (0.13 + rng.next() * 0.17)
    g.circle(cx, cy, r).fill({ color: lift(base, 4 + rng.int(0, 16)), alpha: 0.4 + rng.next() * 0.36 })
  }
  // 微細な木漏れ・小枝の散り — どの16px窓にも高周波の分散を残し「のっぺり」を作らせない。
  const specks = rng.int(3, 5)
  for (let i = 0; i < specks; i++) {
    const sx = cellX + rng.int(2, tile - 2)
    const sy = cellY + rng.int(2, tile - 2)
    g.rect(sx, sy, 1, 1 + rng.int(0, 2)).fill({ color: lift(base, 12 + rng.int(0, 16)), alpha: 0.24 + rng.next() * 0.16 })
  }
  // 幹・立ち枝 — 時折の縦線が「森」を決定づける
  if (rng.chance(0.4)) {
    const tx = cellX + rng.int(5, Math.max(6, tile - 5))
    g.rect(tx, cellY + tile * 0.34, 1.8, tile * 0.66).fill({ color: lift(base, 16), alpha: 0.4 })
  }
}

function lift(color: number, amount: number): number {
  // M24 §4.7: 材質模様で「暗くする」負amountも使うため下限0もクランプする(従来は正専用で下限なし)。
  // 正amountの挙動(既存呼び出し)は不変 — 上限クランプのみだったところに下限を足しただけ。
  const r = Math.max(0, Math.min(255, ((color >> 16) & 0xff) + amount))
  const g = Math.max(0, Math.min(255, ((color >> 8) & 0xff) + amount))
  const b = Math.max(0, Math.min(255, (color & 0xff) + amount))
  return (r << 16) | (g << 8) | b
}

const SPECIAL_DISC: TileKind[] = ['chest', 'camp', 'shrine', 'stairs', 'entrance', 'boss', 'monument']

// M24 Phase D(§4.7): 地面材質固有の局所模様。既存の床明度(floorTone)は変えず、形状だけで
// 材質を伝える — 色を落とした静止画でも地域の違いが読めるようにする受入(§4.7末尾)の担保。
// 'soil'(既定)は何も足さない=現状維持。1セルにつき軽量な図形1〜数個(ベイク一回きりなのでコスト無視できる)。
function paintGroundKind(
  g: Graphics,
  cellX: number,
  cellY: number,
  tile: number,
  kind: GroundKind,
  base: number,
  rng: Rng,
): void {
  switch (kind) {
    case 'soil':
      break // 既定 — jitter+小石speckleのみ(現状維持)
    case 'moss': {
      // 苔: 柔らかい丸斑点を2〜3個
      const spots = rng.int(2, 3)
      for (let i = 0; i < spots; i++) {
        const sx = cellX + rng.int(4, tile - 6)
        const sy = cellY + rng.int(4, tile - 6)
        g.circle(sx, sy, 2 + rng.next() * 2.4).fill({ color: lift(base, -10), alpha: 0.14 + rng.next() * 0.1 })
      }
      break
    }
    case 'plank': {
      // 板: 横板の継ぎ目線(セル中央付近に1本、幅いっぱい)
      const ly = cellY + tile * (0.42 + rng.next() * 0.16)
      g.rect(cellX, ly, tile, 1).fill({ color: lift(base, -16), alpha: 0.32 })
      break
    }
    case 'stone': {
      // 石畳: 多角形の割れ線(2区間の折れ線)
      const x0 = cellX + rng.int(2, tile - 2)
      const xm = cellX + rng.int(2, tile - 2)
      const x1 = cellX + rng.int(2, tile - 2)
      g.moveTo(x0, cellY).lineTo(xm, cellY + tile * 0.5).lineTo(x1, cellY + tile)
        .stroke({ color: lift(base, -18), alpha: 0.26, width: 1 })
      break
    }
    case 'bone': {
      // 骨: 白い破片散り(細い短線を1〜2本)
      const shards = rng.int(1, 2)
      for (let i = 0; i < shards; i++) {
        const sx = cellX + rng.int(4, tile - 6)
        const sy = cellY + rng.int(4, tile - 6)
        const a = rng.next() * Math.PI
        g.moveTo(sx, sy).lineTo(sx + Math.cos(a) * 4.5, sy + Math.sin(a) * 4.5)
          .stroke({ color: lift(base, 60), alpha: 0.28 + rng.next() * 0.14, width: 1.3 })
      }
      break
    }
    case 'ash': {
      // 灰: 既存小石speckleよりさらに細かいドットを密に(3〜5個)
      const specks = rng.int(3, 5)
      for (let i = 0; i < specks; i++) {
        const sx = cellX + rng.int(2, tile - 3)
        const sy = cellY + rng.int(2, tile - 3)
        g.rect(sx, sy, 1, 1).fill({ color: lift(base, 34), alpha: 0.16 + rng.next() * 0.12 })
      }
      break
    }
    case 'water_film': {
      // 水膜: セル上部に薄い横長ハイライト帯
      const ly = cellY + tile * 0.22
      g.rect(cellX + 2, ly, tile - 4, 1.4).fill({ color: lift(base, 46), alpha: 0.15 })
      break
    }
  }
}

export function buildGround(
  grid: TileKind[][],
  tile: number,
  theme: DungeonTheme,
  seed: number,
  groundKind: GroundKind = 'soil', // M24 §4.7: 地面材質(未指定=既定soil→現状と完全一致)
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
  // M24 §4.2: 縁光を2px→3pxへ強め、床との境界をより明瞭にする(奥壁の暗さは不変)。
  const RIM_PX = 3
  const wallBody = lift(theme.groundBase, 9)
  const wallRim = lift(theme.groundBase, 52)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (grid[y][x] !== 'wall') continue
      const nb = [walkableAt(x, y - 1), walkableAt(x, y + 1), walkableAt(x - 1, y), walkableAt(x + 1, y)]
      if (!nb.some(Boolean)) {
        // 奥壁 — 明度は据え置き、森のシルエットだけを与える(M25 §3.3)
        paintDeepWall(ground, x * tile, y * tile, tile, theme.groundBase, rng)
        continue
      }
      ground.rect(x * tile, y * tile, tile, tile).fill(jitterColor(wallBody, theme.groundJitter, rng))
      // 床に面した辺へ縁光(上=nb[0]…の順で 上/下/左/右)
      if (nb[0]) ground.rect(x * tile, y * tile, tile, RIM_PX).fill({ color: wallRim, alpha: 0.5 })
      if (nb[1]) ground.rect(x * tile, y * tile + tile - RIM_PX, tile, RIM_PX).fill({ color: wallRim, alpha: 0.58 })
      if (nb[2]) ground.rect(x * tile, y * tile, RIM_PX, tile).fill({ color: wallRim, alpha: 0.46 })
      if (nb[3]) ground.rect(x * tile + tile - RIM_PX, y * tile, RIM_PX, tile).fill({ color: wallRim, alpha: 0.46 })
    }
  }

  // 2) 歩行セルのトーンジッタ+小石スペックル
  // M24 §4.2: 歩行床の明度を+24→+38(概ね+14)へ引き上げ、壁との明度差で境界を明瞭化する。
  // M25 §3.3: 床色は4×4窓で完全反復しないよう先にベイクする(「同寸の灰色矩形の反復」の解消)。
  const floorTone = lift(theme.groundBase, 38)
  const floorColors = bakeFloorColors(grid, theme, seed)
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
      ground.rect(x * tile, y * tile, tile, tile).fill(floorColors[y][x] ?? jitterColor(base, theme.groundJitter, rng))
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
      // M24 §4.7: 材質固有の形状差(草セルは草ストロークが主役なので対象外)
      if (kind !== 'grass') paintGroundKind(ground, x * tile, y * tile, tile, groundKind, base, rng)
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
