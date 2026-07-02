// ダンジョンフロア生成(GDD_v3 §4) — シード付きASCII迷路ジェネレータ
// 使い方: node scripts/gen_floor.mjs --seed 42 [--chests 2] [--camps 1] [--shrines 1] [--boss] [--grass 0.10]
// 出力: src/dungeon/maps.ts にそのまま貼れる string[] (26列×17行)
// タイル: # 壁 / . 床 / , 下草 / < 入口 / > 階段 / C 宝箱 / F 焚火 / S 祠 / B 主(3x2)
// 同じseedは常に同じフロアを出す(再現性)。生成後の手調整を前提とする。

const W = 26
const H = 17

// ---- 引数 ----
const args = process.argv.slice(2)
const num = (name, def) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? Number(args[i + 1]) : def
}
const flag = (name) => args.includes(`--${name}`)
const SEED = num('seed', 1)
const CHESTS = num('chests', 2)
const CAMPS = num('camps', 1)
const SHRINES = num('shrines', 1)
const BOSS = flag('boss')
const GRASS = num('grass', 0.1)

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
const rnd = mulberry32(SEED)
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ---- 迷路生成(再帰的バックトラッカー) ----
// セルは奇数座標 (x∈{1,3..23}, y∈{1,3..15})。間の壁を崩して通路にする。
const grid = Array.from({ length: H }, () => Array(W).fill('#'))
const CX = [...Array(12)].map((_, i) => 1 + i * 2) // 1..23
const CY = [...Array(8)].map((_, i) => 1 + i * 2) // 1..15

const inCell = (x, y) => CX.includes(x) && CY.includes(y)
const stack = []
const start = [pick(CX), pick(CY)]
grid[start[1]][start[0]] = '.'
stack.push(start)
while (stack.length > 0) {
  const [x, y] = stack[stack.length - 1]
  const nexts = shuffle([
    [x + 2, y], [x - 2, y], [x, y + 2], [x, y - 2],
  ]).filter(([nx, ny]) => inCell(nx, ny) && grid[ny][nx] === '#')
  if (nexts.length === 0) {
    stack.pop()
    continue
  }
  const [nx, ny] = nexts[0]
  grid[ny][nx] = '.'
  grid[(y + ny) / 2][(x + nx) / 2] = '.'
  stack.push([nx, ny])
}

// ループを少し作る(袋小路だらけを緩和): 内壁の一部を確率で崩す
for (const y of CY) {
  for (const x of CX) {
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      const wx = x + dx, wy = y + dy
      const ox = x + dx * 2, oy = y + dy * 2
      if (inCell(ox, oy) && grid[wy]?.[wx] === '#' && rnd() < 0.12) grid[wy][wx] = '.'
    }
  }
}

// ---- BFS距離(入口配置と最深部の特定) ----
function bfs(sx, sy) {
  const dist = Array.from({ length: H }, () => Array(W).fill(-1))
  const q = [[sx, sy]]
  dist[sy][sx] = 0
  while (q.length > 0) {
    const [x, y] = q.shift()
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy
      if (grid[ny]?.[nx] === '.' && dist[ny][nx] === -1) {
        dist[ny][nx] = dist[y][x] + 1
        q.push([nx, ny])
      }
    }
  }
  return dist
}

// 入口: 左上に最も近い床
const floors = []
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y][x] === '.') floors.push([x, y])
const entrance = floors.reduce((best, p) => (p[0] + p[1] < best[0] + best[1] ? p : best))
const dist = bfs(entrance[0], entrance[1])

// 最深点
const far = floors.reduce((best, p) => (dist[p[1]][p[0]] > dist[best[1]][best[0]] ? p : best))

grid[entrance[1]][entrance[0]] = '<'

if (BOSS) {
  // 最深部付近に 3x2 の主の間を掘る(範囲内に収める)
  const bx = Math.min(Math.max(far[0] - 1, 1), W - 4)
  const by = Math.min(Math.max(far[1] - 1, 1), H - 3)
  for (let y = by; y < by + 2; y++) {
    for (let x = bx; x < bx + 3; x++) grid[y][x] = 'B'
  }
  // 主の間の周囲1マスを床にして到達可能を保証
  for (let y = by - 1; y <= by + 2; y++) {
    for (let x = bx - 1; x <= bx + 3; x++) {
      if (y > 0 && y < H - 1 && x > 0 && x < W - 1 && grid[y][x] === '#') grid[y][x] = '.'
    }
  }
} else {
  grid[far[1]][far[0]] = '>'
}

// 袋小路(隣接床が1つ)を宝箱・祠の置き場に
const deadEnds = shuffle(
  floors.filter(([x, y]) => {
    if (grid[y][x] !== '.') return false
    const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => {
      const c = grid[y + dy]?.[x + dx]
      return c && c !== '#'
    }).length
    return n === 1
  }),
)
let di = 0
for (let i = 0; i < CHESTS && di < deadEnds.length; i++, di++) {
  const [x, y] = deadEnds[di]
  grid[y][x] = 'C'
}
for (let i = 0; i < SHRINES && di < deadEnds.length; i++, di++) {
  const [x, y] = deadEnds[di]
  grid[y][x] = 'S'
}
// 焚火: 中間距離帯の床
const maxD = dist[far[1]][far[0]]
const midFloors = shuffle(floors.filter(([x, y]) => grid[y][x] === '.' && dist[y][x] > maxD * 0.35 && dist[y][x] < maxD * 0.65))
for (let i = 0; i < CAMPS && i < midFloors.length; i++) {
  const [x, y] = midFloors[i]
  grid[y][x] = 'F'
}

// 下草(装飾・歩行可)
for (const [x, y] of floors) {
  if (grid[y][x] === '.' && rnd() < GRASS) grid[y][x] = ','
}

// ---- 出力 ----
const rows = grid.map((r) => r.join(''))
console.log(`// seed=${SEED} chests=${CHESTS} camps=${CAMPS} shrines=${SHRINES}${BOSS ? ' boss' : ''}`)
console.log('[')
for (const r of rows) console.log(`  '${r}',`)
console.log(']')
