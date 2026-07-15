import { describe, expect, it } from 'vitest'
import { REGIONS } from '../src/core/data/regions'
import { DUNGEONS, dungeonByRegion } from '../src/dungeon/maps'

const WALKABLE = new Set(['.', ',', '<', '>', 'C', 'F', 'S', 'B', 'M'])

function count(ascii: string[], char: string): number {
  return ascii.reduce((sum, row) => sum + [...row].filter((c) => c === char).length, 0)
}

function allSpecialsReachable(ascii: string[]): boolean {
  const h = ascii.length
  const w = ascii[0]?.length ?? 0
  let start: [number, number] | null = null
  const targets: [number, number][] = []
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = ascii[y][x]
    if (c === '<') start = [x, y]
    if ('>CFSBM'.includes(c)) targets.push([x, y])
  }
  if (!start) return false
  const seen = new Set([start.join(',')])
  const queue = [start]
  while (queue.length > 0) {
    const [x, y] = queue.shift()!
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx
      const ny = y + dy
      const key = `${nx},${ny}`
      if (seen.has(key) || !WALKABLE.has(ascii[ny]?.[nx] ?? '#')) continue
      seen.add(key)
      queue.push([nx, ny])
    }
  }
  return targets.every(([x, y]) => seen.has(`${x},${y}`))
}

describe('歩行ダンジョン網羅 — M27', () => {
  it('非塔39地域が全て歩行可能で、静的171層を持つ', () => {
    const staticRegions = REGIONS.filter((r) => r.id !== 'tokoyo_tou')
    expect(DUNGEONS).toHaveLength(39)
    expect(DUNGEONS.reduce((sum, d) => sum + d.floors.length, 0)).toBe(171)
    expect(new Set(DUNGEONS.map((d) => d.regionId))).toEqual(new Set(staticRegions.map((r) => r.id)))
    for (const region of staticRegions) expect(dungeonByRegion(region.id), region.id).toBeDefined()
  })

  it('171層は同一レイアウトを使い回さない', () => {
    const signatures = DUNGEONS.flatMap((dungeon) => dungeon.floors.map((floor) => floor.ascii.join('\n')))
    expect(new Set(signatures).size).toBe(171)
  })

  it('常夜百層は別枠100層、10層ごとに主階を持つ', () => {
    const tower = dungeonByRegion('tokoyo_tou')!
    expect(tower.floors).toHaveLength(100)
    tower.floors.forEach((floor, index) => {
      expect(count(floor.ascii, 'B') > 0, `B${index + 1}`).toBe((index + 1) % 10 === 0)
    })
  })
})

describe('生成済み171層の個数・到達ゲート', () => {
  for (const dungeon of DUNGEONS) {
    it(`${dungeon.regionId}: 全階の特殊床が宣言個数どおりで到達可能`, () => {
      let monuments = 0
      dungeon.floors.forEach((floor, index) => {
        const boss = index === dungeon.floors.length - 1
        expect(floor.ascii.length, `B${index + 1}: height`).toBe(22)
        expect(new Set(floor.ascii.map((row) => row.length)), `B${index + 1}: row width`).toEqual(new Set([36]))
        expect(count(floor.ascii, '<'), `B${index + 1}: entrance`).toBe(1)
        expect(count(floor.ascii, 'C'), `B${index + 1}: chest`).toBe(boss ? 1 : 2)
        expect(count(floor.ascii, 'F'), `B${index + 1}: camp`).toBe(boss ? 0 : 1)
        expect(count(floor.ascii, 'S'), `B${index + 1}: shrine`).toBe(boss ? 0 : 1)
        expect(count(floor.ascii, 'M'), `B${index + 1}: monument`).toBe(boss ? 0 : 1)
        expect(count(floor.ascii, '>'), `B${index + 1}: stairs`).toBe(boss ? 0 : 1)
        expect(count(floor.ascii, 'B'), `B${index + 1}: boss footprint`).toBe(boss ? 6 : 0)
        expect(allSpecialsReachable(floor.ascii), `B${index + 1}: unreachable special`).toBe(true)
        monuments += count(floor.ascii, 'M')
      })
      expect(monuments, '地域の縁起を恒久的に取得可能').toBeGreaterThanOrEqual(1)
    })
  }
})
