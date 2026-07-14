// M25 §3.3: タイルの反復感の機械保証。
// 実ブラウザ検収の所見「床が同寸の灰色矩形、境界が同型の丸い茂みの反復に見え、
// 森ではなく生成タイルの試作感が勝つ」に対する回帰テスト。
import { describe, expect, it } from 'vitest'
import { bakeFloorColors } from '../src/dungeon/render/ground'
import { themeForBg } from '../src/dungeon/render/theme'
import type { TileKind } from '../src/dungeon/types'

const theme = themeForBg('forest')

function floorGrid(w: number, h: number): TileKind[][] {
  return Array.from({ length: h }, () => Array<TileKind>(w).fill('floor'))
}

describe('bakeFloorColors — 4×4窓で床色を完全反復させない(§3.3)', () => {
  it('36×22の全面床で、4×4窓に同色ペアが存在しない', () => {
    const grid = floorGrid(36, 22)
    const colors = bakeFloorColors(grid, theme, 7)
    const dupes: string[] = []
    for (let y = 0; y < 22; y++) {
      for (let x = 0; x < 36; x++) {
        const c = colors[y][x]
        if (c == null) continue
        for (let dy = -3; dy <= 3; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            if (dx === 0 && dy === 0) continue
            const o = colors[y + dy]?.[x + dx]
            if (o != null && o === c) dupes.push(`(${x},${y})=(${x + dx},${y + dy})`)
          }
        }
      }
    }
    expect(dupes.slice(0, 5)).toEqual([])
  })

  it('複数シードで安定して反復ゼロ(生成の運に依存しない)', () => {
    for (const seed of [1, 2, 3, 11, 42, 99, 512]) {
      const colors = bakeFloorColors(floorGrid(24, 16), theme, seed)
      let dupes = 0
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 24; x++) {
          const c = colors[y][x]
          if (c == null) continue
          for (let dy = -3; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
              if (dx === 0 && dy === 0) continue
              if (colors[y + dy]?.[x + dx] === c) dupes++
            }
          }
        }
      }
      expect(dupes, `seed=${seed}`).toBe(0)
    }
  })

  it('壁と水は色を持たない(床だけがベイク対象)', () => {
    const grid = floorGrid(6, 6)
    grid[2][2] = 'wall'
    grid[3][3] = 'water'
    const colors = bakeFloorColors(grid, theme, 5)
    expect(colors[2][2]).toBeNull()
    expect(colors[3][3]).toBeNull()
    expect(colors[0][0]).not.toBeNull()
  })

  it('同一シードで決定論的(再生成しても同じ絵になる)', () => {
    const a = bakeFloorColors(floorGrid(12, 8), theme, 33)
    const b = bakeFloorColors(floorGrid(12, 8), theme, 33)
    expect(a).toEqual(b)
  })
})
