// ダンジョンフロア生成 v2(品質刷新v3.1 M7b) — 広間型・シード付きジェネレータ
// 俺屍様式: 大小の広間+2〜3マス幅の連絡路+ランドマーク。1マス幅迷路のv1を全面置換。
//
// 使い方(CLI):
//   node scripts/gen_floor.mjs --seed 7 [--boss] [--water] [--chests 2] [--camps 1] [--shrines 1] [--monuments 1]
//   node scripts/gen_floor.mjs --stress 500        # 500シードを検証に通し失敗率を報告
// ライブラリ: import { generateFloor } from './gen_floor.mjs' (gen_all_maps.mjs が使用)
//
// タイル: # 壁 / . 床 / , 下草 / < 入口 / > 階段 / C 宝箱 / F 焚火 / S 祠 / B 主(3x2) / ~ 水 / M 石碑
// 検証(生成器内蔵・不合格は決定論的リシード≤40):
//   全特殊タイル到達可 / 孤立床は壁化 / 開放率34〜55% / 入口→目標の最短距離 ≥ max(18, 0.5*最遠) / 行長=W

const W_DEF = 36
const H_DEF = 22

// ---- シード付き乱数(mulberry32) ----
function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const WALKABLE = new Set(['.', ',', '<', '>', 'C', 'F', 'S', 'B', 'M'])

export function generateFloor(opts) {
  const {
    seed = 1,
    w = W_DEF,
    h = H_DEF,
    chests = 2,
    camps = 1,
    shrines = 1,
    monuments = 1,
    boss = false,
    water = false,
  } = opts
  let curSeed = seed >>> 0
  for (let attempt = 0; attempt < 40; attempt++) {
    const out = tryGenerate({ seed: curSeed, w, h, chests, camps, shrines, monuments, boss, water })
    if (out) return { ascii: out, seed: curSeed }
    curSeed = (Math.imul(curSeed, 31) + 7) >>> 0
  }
  throw new Error(`gen_floor: seed ${seed} から40回のリシードでも検証を通らなかった`)
}

function tryGenerate({ seed, w, h, chests, camps, shrines, monuments, boss, water }) {
  const rnd = mulberry32(seed)
  const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1))
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)]

  const grid = Array.from({ length: h }, () => Array(w).fill('#'))
  const inBounds = (x, y) => x >= 1 && x <= w - 2 && y >= 1 && y <= h - 2

  // ---- 1. 部屋配置(棄却サンプリング) ----
  const roomTarget = boss ? int(4, 6) : int(6, 9)
  const rooms = [] // {x,y,rw,rh,cx,cy,arena?}
  const overlaps = (r) =>
    rooms.some((o) => r.x - 1 < o.x + o.rw + 1 && r.x + r.rw + 1 > o.x - 1 && r.y - 1 < o.y + o.rh + 1 && r.y + r.rh + 1 > o.y - 1)

  // 入口辺を先に決め、ボス床ではアリーナを反対側に確保
  const edge = pick(['n', 's', 'e', 'w'])
  if (boss) {
    const aw = 12, ah = 8
    const ax = edge === 'w' ? w - 2 - aw : edge === 'e' ? 2 : Math.floor((w - aw) / 2) + int(-3, 3)
    const ay = edge === 'n' ? h - 2 - ah : edge === 's' ? 2 : Math.floor((h - ah) / 2) + int(-2, 2)
    const arena = { x: Math.max(1, Math.min(w - 1 - aw, ax)), y: Math.max(1, Math.min(h - 1 - ah, ay)), rw: aw, rh: ah, arena: true }
    arena.cx = arena.x + aw / 2
    arena.cy = arena.y + ah / 2
    rooms.push(arena)
  }
  for (let tries = 0; tries < 400 && rooms.length < roomTarget + (boss ? 1 : 0); tries++) {
    const rw = int(5, 11)
    const rh = int(4, 8)
    const r = { x: int(1, w - 1 - rw), y: int(1, h - 1 - rh), rw, rh }
    if (overlaps(r)) continue
    r.cx = r.x + rw / 2
    r.cy = r.y + rh / 2
    rooms.push(r)
  }
  const normalRooms = rooms.filter((r) => !r.arena)
  if (normalRooms.length < 3) return null

  // ---- 2. 有機化彫り込み(超楕円+ジッタ) ----
  for (const r of rooms) {
    const rx = r.rw / 2, ry = r.rh / 2
    for (let y = r.y; y < r.y + r.rh; y++) {
      for (let x = r.x; x < r.x + r.rw; x++) {
        if (!inBounds(x, y)) continue
        const dx = (x + 0.5 - (r.x + rx)) / rx
        const dy = (y + 0.5 - (r.y + ry)) / ry
        const v = Math.pow(Math.abs(dx), 2.4) + Math.pow(Math.abs(dy), 2.4)
        if (v <= 1 + (rnd() * 0.3 - 0.15)) grid[y][x] = '.'
      }
    }
  }

  // ---- 3. 接続(Prim MST + ループ辺、通路2幅 / ボス参道3幅) ----
  const dist2 = (a, b) => Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy)
  const carve = (x, y) => {
    if (inBounds(x, y) && grid[y][x] === '#') grid[y][x] = '.'
  }
  const corridorCells = []
  const carveL = (a, b, width) => {
    const x0 = Math.round(a.cx), y0 = Math.round(a.cy)
    const x1 = Math.round(b.cx), y1 = Math.round(b.cy)
    const horizFirst = rnd() < 0.5
    const seg = []
    if (horizFirst) {
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) seg.push([x, y0, 'h'])
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) seg.push([x1, y, 'v'])
    } else {
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) seg.push([x0, y, 'v'])
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) seg.push([x, y1, 'h'])
    }
    for (const [x, y, dir] of seg) {
      for (let k = 0; k < width; k++) {
        if (dir === 'h') carve(x, y + k)
        else carve(x + k, y)
      }
      corridorCells.push([x, y])
    }
  }
  // MST(アリーナ除外)
  const inTree = [normalRooms[0]]
  const rest = normalRooms.slice(1)
  while (rest.length > 0) {
    let best = null
    for (const t of inTree) {
      for (const r of rest) {
        const d = dist2(t, r)
        if (!best || d < best.d) best = { t, r, d }
      }
    }
    carveL(best.t, best.r, 2)
    inTree.push(best.r)
    rest.splice(rest.indexOf(best.r), 1)
  }
  // ループ辺(非MSTの短い辺を追加)
  const extra = Math.ceil(normalRooms.length / 3)
  const pairs = []
  for (let i = 0; i < normalRooms.length; i++)
    for (let j = i + 1; j < normalRooms.length; j++) pairs.push([normalRooms[i], normalRooms[j]])
  pairs.sort((p, q) => dist2(p[0], p[1]) - dist2(q[0], q[1]))
  for (const [a, b] of pairs.slice(0, extra)) carveL(a, b, 2)
  // ボス参道: 最寄り部屋からアリーナへ直線的3幅
  if (boss) {
    const arena = rooms.find((r) => r.arena)
    let near = normalRooms[0]
    for (const r of normalRooms) if (dist2(r, arena) < dist2(near, arena)) near = r
    carveL(near, arena, 3)
  }

  // ---- 4. 膨張+平滑(add-onlyで接続性単調) ----
  for (const [x, y] of corridorCells) {
    if (rnd() < 0.3) {
      const [dx, dy] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]])
      carve(x + dx, y + dy)
    }
  }
  const nb8 = (x, y, ch) => {
    let n = 0
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue
        if ((grid[y + dy]?.[x + dx] ?? '#') === ch) n++
      }
    return n
  }
  const toFloor = []
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++)
      if (grid[y][x] === '#' && nb8(x, y, '.') >= 5) toFloor.push([x, y])
  for (const [x, y] of toFloor) grid[y][x] = '.'

  // ---- 5. 外周を壁で固定 ----
  for (let x = 0; x < w; x++) { grid[0][x] = '#'; grid[h - 1][x] = '#' }
  for (let y = 0; y < h; y++) { grid[y][0] = '#'; grid[y][w - 1] = '#' }

  // ---- 6. BFSで役割配置 ----
  const bfs = (sx, sy, blockWater) => {
    const dist = Array.from({ length: h }, () => Array(w).fill(-1))
    if (grid[sy]?.[sx] === undefined) return dist
    const q = [[sx, sy]]
    dist[sy][sx] = 0
    while (q.length > 0) {
      const [x, y] = q.shift()
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy
        const c = grid[ny]?.[nx]
        if (c === undefined || dist[ny][nx] !== -1) continue
        if (c === '#' || (blockWater && c === '~')) continue
        dist[ny][nx] = dist[y][x] + 1
        q.push([nx, ny])
      }
    }
    return dist
  }
  const floorsInRoom = (r) => {
    const cells = []
    for (let y = r.y; y < r.y + r.rh; y++)
      for (let x = r.x; x < r.x + r.rw; x++)
        if (grid[y]?.[x] === '.') cells.push([x, y])
    return cells
  }

  // 入口: 選んだ辺に最も近い部屋の、辺に最も近い床
  const edgeDist = (x, y) => (edge === 'n' ? y : edge === 's' ? h - 1 - y : edge === 'w' ? x : w - 1 - x)
  let entRoom = normalRooms[0]
  for (const r of normalRooms) {
    if (edgeDist(Math.round(r.cx), Math.round(r.cy)) < edgeDist(Math.round(entRoom.cx), Math.round(entRoom.cy))) entRoom = r
  }
  const entCells = floorsInRoom(entRoom)
  if (entCells.length === 0) return null
  entCells.sort((a, b) => edgeDist(a[0], a[1]) - edgeDist(b[0], b[1]))
  const [ex, ey] = entCells[0]
  grid[ey][ex] = '<'

  const dist = bfs(ex, ey, true)
  let maxD = 0
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (dist[y][x] > maxD) maxD = dist[y][x]

  // 目標: ボス=アリーナ焦点にB 3x2 / 通常=最奥部屋の最深床に >
  let goalPos = null
  if (boss) {
    const arena = rooms.find((r) => r.arena)
    const bx = Math.round(arena.cx) - 1
    const by = Math.round(arena.cy) - 2
    for (let y = by - 1; y <= by + 2; y++)
      for (let x = bx - 1; x <= bx + 3; x++) if (inBounds(x, y)) grid[y][x] = '.'
    for (let y = by; y < by + 2; y++)
      for (let x = bx; x < bx + 3; x++) grid[y][x] = 'B'
    goalPos = [bx, by + 1]
  } else {
    let goalRoom = null
    for (const r of normalRooms) {
      if (r === entRoom) continue
      const cells = floorsInRoom(r)
      if (cells.length === 0) continue
      const mean = cells.reduce((s, [x, y]) => s + Math.max(0, dist[y][x]), 0) / cells.length
      if (!goalRoom || mean > goalRoom.mean) goalRoom = { r, mean }
    }
    if (!goalRoom) return null
    const cells = floorsInRoom(goalRoom.r).filter(([x, y]) => dist[y][x] > 0)
    if (cells.length === 0) return null
    cells.sort((a, b) => dist[b[1]][b[0]] - dist[a[1]][a[0]])
    const [gx, gy] = cells[0]
    grid[gy][gx] = '>'
    goalPos = [gx, gy]
  }

  // 焚火: 中間距離の部屋の中心に3x3の空き地
  const midRooms = normalRooms.filter((r) => r !== entRoom)
  midRooms.sort((a, b) => {
    const da = Math.abs((dist[Math.round(a.cy)]?.[Math.round(a.cx)] ?? 0) - maxD * 0.5)
    const db = Math.abs((dist[Math.round(b.cy)]?.[Math.round(b.cx)] ?? 0) - maxD * 0.5)
    return da - db
  })
  let placedCamps = 0
  for (const r of midRooms) {
    if (placedCamps >= camps) break
    const cx = Math.round(r.cx), cy = Math.round(r.cy)
    if (!inBounds(cx, cy)) continue
    for (let y = cy - 1; y <= cy + 1; y++)
      for (let x = cx - 1; x <= cx + 1; x++) if (inBounds(x, y) && grid[y][x] === '#') grid[y][x] = '.'
    grid[cy][cx] = 'F'
    placedCamps++
  }

  // 祠: 最小の部屋の壁際 / 石碑: 別の部屋の壁際(残数に応じて)
  const bySize = normalRooms
    .filter((r) => r !== entRoom)
    .map((r) => ({ r, cells: floorsInRoom(r) }))
    .filter((e) => e.cells.length > 0)
    .sort((a, b) => a.cells.length - b.cells.length)
  const placeAlcove = (mark, avoid) => {
    for (const { cells } of bySize) {
      const cand = cells
        .filter(([x, y]) => grid[y][x] === '.' && !avoid.some(([ax, ay]) => Math.abs(ax - x) + Math.abs(ay - y) < 4))
        .sort((a, b) => nb8(b[0], b[1], '#') - nb8(a[0], a[1], '#'))
      if (cand.length > 0) {
        const [x, y] = cand[0]
        grid[y][x] = mark
        return [x, y]
      }
    }
    return null
  }
  const placedSpecials = [[ex, ey], goalPos]
  for (let i = 0; i < shrines; i++) {
    const p = placeAlcove('S', placedSpecials)
    if (p) placedSpecials.push(p)
  }
  for (let i = 0; i < monuments; i++) {
    const p = placeAlcove('M', placedSpecials)
    if (p) placedSpecials.push(p)
  }

  // 宝箱: 壁に寄った床を遠い順に、部屋ごとに1つまで
  const chestCand = []
  for (const r of normalRooms) {
    const cells = floorsInRoom(r)
      .filter(([x, y]) => grid[y][x] === '.' && nb8(x, y, '#') >= 4 && dist[y][x] > 4)
      .sort((a, b) => dist[b[1]][b[0]] - dist[a[1]][a[0]])
    if (cells.length > 0) chestCand.push(cells[0])
  }
  chestCand.sort((a, b) => dist[b[1]][b[0]] - dist[a[1]][a[0]])
  for (const [x, y] of chestCand.slice(0, chests)) grid[y][x] = 'C'

  // ---- 7. 水域(指定時のみ、到達性を再検証しつつ) ----
  if (water) {
    const blobs = int(1, 2)
    for (let b = 0; b < blobs; b++) {
      const bigRooms = normalRooms.filter((r) => floorsInRoom(r).length >= 30)
      if (bigRooms.length === 0) break
      const r = pick(bigRooms)
      const cells = floorsInRoom(r).filter(([x, y]) => grid[y][x] === '.')
      if (cells.length === 0) continue
      const start = pick(cells)
      const blob = [start]
      const target = int(3, 8)
      while (blob.length < target) {
        const [bx, by] = pick(blob)
        const [dx, dy] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]])
        const nx = bx + dx, ny = by + dy
        if (inBounds(nx, ny) && grid[ny][nx] === '.' && !blob.some(([qx, qy]) => qx === nx && qy === ny)) blob.push([nx, ny])
        else if (rnd() < 0.3) break
      }
      const backup = blob.map(([x, y]) => grid[y][x])
      for (const [x, y] of blob) grid[y][x] = '~'
      if (!specialsReachable(grid, w, h, bfs)) {
        blob.forEach(([x, y], i) => { grid[y][x] = backup[i] })
      }
    }
  }

  // ---- 8. 下草(群生) ----
  const floorCells = []
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (grid[y][x] === '.') floorCells.push([x, y])
  const grassTarget = Math.round(floorCells.length * (0.08 + rnd() * 0.06))
  let grass = 0
  const clumps = int(4, 7)
  for (let c = 0; c < clumps && grass < grassTarget; c++) {
    let [gx, gy] = pick(floorCells)
    let p = 1
    while (rnd() < p && grass < grassTarget) {
      if (grid[gy]?.[gx] === '.') { grid[gy][gx] = ','; grass++ }
      const [dx, dy] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]])
      gx += dx; gy += dy
      p *= 0.86
    }
  }

  // ---- 9. 検証 ----
  const d2 = bfs(ex, ey, true)
  // 孤立ポケットの壁化
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++)
      if ((grid[y][x] === '.' || grid[y][x] === ',') && d2[y][x] === -1) grid[y][x] = '#'
  if (!specialsReachable(grid, w, h, bfs)) return null
  let walk = 0
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (WALKABLE.has(grid[y][x])) walk++
  const ratio = walk / (w * h)
  if (ratio < 0.32 || ratio > 0.58) return null
  let max2 = 0
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d2[y][x] > max2) max2 = d2[y][x]
  const gd = d2[goalPos[1]][goalPos[0]]
  if (gd < Math.max(18, 0.5 * max2)) return null

  const rows = grid.map((r) => r.join(''))
  if (rows.some((r) => r.length !== w)) return null
  return rows
}

function specialsReachable(grid, w, h, bfs) {
  let ex = -1, ey = -1
  const specials = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = grid[y][x]
      if (c === '<') { ex = x; ey = y }
      else if (c === '>' || c === 'C' || c === 'F' || c === 'S' || c === 'B' || c === 'M') specials.push([x, y])
    }
  }
  if (ex < 0) return false
  const d = bfs(ex, ey, true)
  return specials.every(([x, y]) => d[y][x] >= 0)
}

// ---- CLI ----
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())
if (isMain) {
  const args = process.argv.slice(2)
  const num = (name, def) => {
    const i = args.indexOf(`--${name}`)
    return i >= 0 ? Number(args[i + 1]) : def
  }
  const flag = (name) => args.includes(`--${name}`)

  const stress = num('stress', 0)
  if (stress > 0) {
    let reseeds = 0
    let fails = 0
    for (let s = 1; s <= stress; s++) {
      try {
        const boss = s % 4 === 0
        const water = s % 5 === 0
        const r = generateFloor({ seed: s, boss, water, chests: 2, camps: 1, shrines: 1, monuments: 1 })
        if (r.seed !== (s >>> 0)) reseeds++
      } catch {
        fails++
      }
    }
    console.log(`stress ${stress}: 失敗 ${fails} / リシード発生 ${reseeds}`)
    process.exit(fails > 0 ? 1 : 0)
  }

  const { ascii, seed } = generateFloor({
    seed: num('seed', 1),
    w: num('w', W_DEF),
    h: num('h', H_DEF),
    chests: num('chests', 2),
    camps: num('camps', 1),
    shrines: num('shrines', 1),
    monuments: num('monuments', 1),
    boss: flag('boss'),
    water: flag('water'),
  })
  console.log(`// seed=${seed}${flag('boss') ? ' boss' : ''}${flag('water') ? ' water' : ''}`)
  console.log('[')
  for (const r of ascii) console.log(`  '${r}',`)
  console.log(']')
}
