import { describe, expect, it } from 'vitest'
import type { TileKind } from '../src/dungeon/types'
import { usedKey, isReusableGuardTile, findBossTiles, sealBossKeys } from '../src/dungeon/usedTiles'

// M33: engine.ts(PixiJS依存)から切り出した使用済みキー/ボス床の純関数を固定する。
// M29(討伐後ボス床の空発火)/M30(空キャンバス)のHIGH修正はテスト0だった — ここで回帰を封じる。
describe('usedTiles — 使用済みキー/ボス床の純関数(M33)', () => {
  it('usedKey は floor:x:y 書式で階層とマスを一意化する', () => {
    expect(usedKey(0, 3, 5)).toBe('0:3:5')
    expect(usedKey(2, 0, 0)).toBe('2:0:0')
    // 階層が違えば同座標でも別キー(階層をまたいだ誤既読を防ぐ)
    expect(usedKey(0, 3, 5)).not.toBe(usedKey(1, 3, 5))
  })

  it('isReusableGuardTile は宝箱/野営/祠/石碑/ボスのみtrue、通路・階段・入口はfalse', () => {
    for (const k of ['chest', 'camp', 'shrine', 'monument', 'boss'] as TileKind[]) {
      expect(isReusableGuardTile(k), k).toBe(true)
    }
    for (const k of ['wall', 'floor', 'grass', 'stairs', 'entrance', 'water'] as TileKind[]) {
      expect(isReusableGuardTile(k), k).toBe(false)
    }
  })

  it('findBossTiles は塊状のボス床を全マス返す(玄冬の複数マス塊など)', () => {
    const F: TileKind = 'floor'
    const B: TileKind = 'boss'
    const grid: TileKind[][] = [
      [F, B, B, F],
      [F, B, B, F],
      [F, F, F, B],
    ]
    const tiles = findBossTiles(grid)
    expect(tiles).toHaveLength(5)
    expect(tiles).toContainEqual({ x: 1, y: 0 })
    expect(tiles).toContainEqual({ x: 2, y: 1 })
    expect(tiles).toContainEqual({ x: 3, y: 2 })
  })

  it('sealBossKeys は全ボス床の usedKey を返す(討伐後の空発火封じ=M29修正の核)', () => {
    const F: TileKind = 'floor'
    const B: TileKind = 'boss'
    const grid: TileKind[][] = [[F, B], [B, F]]
    expect(new Set(sealBossKeys(grid, 3))).toEqual(new Set(['3:1:0', '3:0:1']))
    // ボス床が無ければ空(封じるものが無い)
    expect(sealBossKeys([[F, F]], 0)).toEqual([])
  })
})
