// M24/M25: レスポンシブカメラの純粋計算テスト。
// 最重要(M24): cameraTarget と holeHalfResPos の整合 —「主人公の実スクリーン位置 = erase穴中央」が
// 全zoom・クランプ有無に関わらず成立すること(照明穴が主人公からズレる破壊を機械的に封じる)。
// 最重要(M25): クランプ後、安全領域にマップ外の露出が1pxも無いこと(暗部41.2%の根因)。
import { describe, expect, it } from 'vitest'
import {
  CAM_MIN_ZOOM, CAM_MAX_ZOOM,
  computeZoom, visibleTilesX, visibleTilesY,
  cameraTarget, clampCamera, offMapRatio, safeRect,
  holeHalfResPos, lookAheadOffset, screenToTile,
} from '../src/dungeon/camera'

const TILE = 36
// scripts/gen_floor.mjs の標準フロア寸法
const MAP_W = 36
const MAP_H = 22

// M26 §19 の必須viewport 5種
const VIEWPORTS: [string, number, number][] = [
  ['1440×900', 1440, 900],
  ['1280×720', 1280, 720],
  ['768×1024', 768, 1024],
  ['390×844', 390, 844],
  ['360×800', 360, 800],
]

const zoomOf = (vw: number, vh: number) => computeZoom(vw, vh, TILE, MAP_W, MAP_H)

/** 実装と同じ順序: cameraTarget(look-ahead込み) → clamp */
function camAt(vw: number, vh: number, px: number, py: number, laX = 0, laY = 0) {
  const zoom = zoomOf(vw, vh)
  const t = cameraTarget(px * TILE + TILE / 2, py * TILE + TILE / 2, vw, vh, zoom, laX, laY)
  return { zoom, cam: clampCamera(t, vw, vh, zoom, TILE, MAP_W, MAP_H) }
}

describe('computeZoom — レスポンシブ倍率', () => {
  it('PC 1280×720で横22〜26タイルに収まる', () => {
    const tx = visibleTilesX(1280, TILE, zoomOf(1280, 720))
    expect(tx).toBeGreaterThanOrEqual(22)
    expect(tx).toBeLessThanOrEqual(26)
  })
  it('PC 1440×900で横22〜26タイルに収まる', () => {
    const tx = visibleTilesX(1440, TILE, zoomOf(1440, 900))
    expect(tx).toBeGreaterThanOrEqual(22)
    expect(tx).toBeLessThanOrEqual(26)
  })
  it('モバイル 390×844で横10〜12タイルに収まる', () => {
    const tx = visibleTilesX(390, TILE, zoomOf(390, 844))
    expect(tx).toBeGreaterThanOrEqual(10)
    expect(tx).toBeLessThanOrEqual(12)
  })
  it('モバイル 360×800で横10〜12タイルに収まる', () => {
    const tx = visibleTilesX(360, TILE, zoomOf(360, 800))
    expect(tx).toBeGreaterThanOrEqual(10)
    expect(tx).toBeLessThanOrEqual(12)
  })
  it('zoomは[0.85, 1.6]にclampされる', () => {
    expect(zoomOf(100, 100)).toBe(CAM_MIN_ZOOM)
    expect(zoomOf(9999, 9999)).toBe(CAM_MAX_ZOOM)
  })
  it('主人公表示高(TILE*1.6*zoom)がPCで48px以上', () => {
    expect(TILE * 1.6 * zoomOf(1280, 720)).toBeGreaterThanOrEqual(48)
  })
  it('縦タイル数がPC 720で13〜17の目安に収まる', () => {
    const ty = visibleTilesY(720, TILE, zoomOf(1280, 720))
    expect(ty).toBeGreaterThanOrEqual(13)
    expect(ty).toBeLessThanOrEqual(17)
  })

  // devil S2-A(実証): 旧computeZoomはviewWしか見ず、768×1024で zoom 0.889 →
  // マップ高704px < ビューポート1024px となり、clampでは1pxも減らせない黒帯が31%生じた。
  it('768×1024でマップ高が安全領域の高さ以上になる(高さ項の回帰テスト)', () => {
    const z = zoomOf(768, 1024)
    const r = safeRect(768, 1024)
    expect(MAP_H * TILE * z).toBeGreaterThanOrEqual(r.h)
  })
  it('全viewportでマップが安全領域を両軸とも覆える倍率になる', () => {
    for (const [name, vw, vh] of VIEWPORTS) {
      const z = zoomOf(vw, vh)
      const r = safeRect(vw, vh)
      expect(MAP_W * TILE * z, `${name} 横`).toBeGreaterThanOrEqual(r.w)
      expect(MAP_H * TILE * z, `${name} 縦`).toBeGreaterThanOrEqual(r.h)
    }
  })
})

describe('clampCamera — マップ境界クランプ(M25 §3.1 / 暗部41.2%の根因)', () => {
  // 四辺・四隅・中央 × look-ahead四方向 × 全viewport で、安全領域にマップ外露出が無いこと。
  const SPOTS: [string, number, number][] = [
    ['左上隅', 0, 0],
    ['右上隅', MAP_W - 1, 0],
    ['左下隅', 0, MAP_H - 1],
    ['右下隅', MAP_W - 1, MAP_H - 1],
    ['上辺', MAP_W >> 1, 0],
    ['下辺', MAP_W >> 1, MAP_H - 1],
    ['左辺', 0, MAP_H >> 1],
    ['右辺', MAP_W - 1, MAP_H >> 1],
    ['中央', MAP_W >> 1, MAP_H >> 1],
  ]
  const DIRS: [string, number, number][] = [
    ['静止', 0, 0],
    ['上', 0, -1],
    ['下', 0, 1],
    ['左', -1, 0],
    ['右', 1, 0],
  ]

  for (const [vname, vw, vh] of VIEWPORTS) {
    for (const [sname, px, py] of SPOTS) {
      for (const [dname, dx, dy] of DIRS) {
        it(`${vname} ${sname} look-ahead:${dname} — 安全領域のマップ外露出が0`, () => {
          const la = lookAheadOffset(dx, dy, TILE, 1.2)
          const { zoom, cam } = camAt(vw, vh, px, py, la.x, la.y)
          expect(offMapRatio(cam, vw, vh, zoom, TILE, MAP_W, MAP_H)).toBeCloseTo(0, 6)
        })
      }
    }
  }

  it('マップが安全領域より小さい軸では、主人公ではなくマップ全体が中央に置かれる', () => {
    // 極小マップ(3×3)は 1280×720 の安全領域より小さい
    const vw = 1280
    const vh = 720
    const zoom = 1
    const r = safeRect(vw, vh)
    const t = cameraTarget(0, 0, vw, vh, zoom) // 主人公が左上隅にいても
    const c = clampCamera(t, vw, vh, zoom, TILE, 3, 3)
    expect(c.x).toBeCloseTo(r.x + (r.w - 3 * TILE) / 2, 6)
    expect(c.y).toBeCloseTo(r.y + (r.h - 3 * TILE) / 2, 6)
  })

  it('クランプは主人公が内陸にいる時のカメラを動かさない(追従を殺さない)', () => {
    const vw = 1280
    const vh = 720
    const zoom = zoomOf(vw, vh)
    const t = cameraTarget(18 * TILE, 11 * TILE, vw, vh, zoom)
    const c = clampCamera(t, vw, vh, zoom, TILE, MAP_W, MAP_H)
    expect(c.x).toBeCloseTo(t.x, 6)
    expect(c.y).toBeCloseTo(t.y, 6)
  })
})

describe('cameraTarget × holeHalfResPos の整合(核心・クランプ後も成立)', () => {
  // クランプ後は「主人公=画面中央」ではなくなる(それがクランプの目的)。
  // 不変条件は「erase穴の中心 = 主人公の実スクリーン位置」であり、これは全条件で成立せねばならない。
  for (const [vname, vw, vh] of VIEWPORTS) {
    for (const [sname, px, py] of [['隅', 0, 0], ['中央', 18, 11], ['下辺', 18, 21]] as [string, number, number][]) {
      it(`${vname} ${sname}: 穴中央 = 主人公の実スクリーン位置`, () => {
        const { zoom, cam } = camAt(vw, vh, px, py)
        const playerCx = px * TILE + TILE / 2
        const playerCy = py * TILE + TILE / 2
        const hole = holeHalfResPos(playerCx, playerCy, cam.x, cam.y, zoom)
        // 主人公の実スクリーン位置(半解像度)
        expect(hole.x).toBeCloseTo((cam.x + playerCx * zoom) * 0.5, 6)
        expect(hole.y).toBeCloseTo((cam.y + playerCy * zoom) * 0.5, 6)
      })
    }
  }
  it('内陸(クランプが効かない位置)では穴中央=画面中央を保つ', () => {
    const { zoom, cam } = camAt(1280, 720, 18, 11)
    const hole = holeHalfResPos(18 * TILE + TILE / 2, 11 * TILE + TILE / 2, cam.x, cam.y, zoom)
    expect(hole.x).toBeCloseTo(1280 / 4, 6)
    expect(hole.y).toBeCloseTo(720 / 4, 6)
  })
  it('zoom=1でも従来挙動(worldX = vw/2 - playerCx)を保つ', () => {
    const cam = cameraTarget(500, 300, 1280, 720, 1)
    expect(cam.x).toBeCloseTo(640 - 500, 6)
    expect(cam.y).toBeCloseTo(360 - 300, 6)
  })
  it('look-aheadは穴中央から進行方向へずれる(内陸)', () => {
    const la = lookAheadOffset(1, 0, TILE, 1.2)
    const { zoom, cam } = camAt(1280, 720, 18, 11, la.x, la.y)
    const hole = holeHalfResPos(18 * TILE + TILE / 2, 11 * TILE + TILE / 2, cam.x, cam.y, zoom)
    expect(hole.x).toBeLessThan(1280 / 4)
    expect(hole.y).toBeCloseTo(720 / 4, 6)
  })
})

describe('screenToTile — タップ逆変換(クランプ後も往復整合)', () => {
  // クランプで world がずれても、screenToTile は world.x/y を経由するため整合が保たれる。
  for (const [vname, vw, vh] of VIEWPORTS) {
    for (const [px, py] of [[0, 0], [18, 11], [35, 21]] as [number, number][]) {
      it(`${vname} tile(${px},${py}): 主人公の実スクリーン位置をタップ = 主人公タイル`, () => {
        const { zoom, cam } = camAt(vw, vh, px, py)
        const sx = cam.x + (px * TILE + TILE / 2) * zoom
        const sy = cam.y + (py * TILE + TILE / 2) * zoom
        const t = screenToTile(sx, sy, cam.x, cam.y, zoom, TILE)
        expect(t.tx).toBe(px)
        expect(t.ty).toBe(py)
      })
    }
  }
  it('隣タイル中心のタップは隣タイルに解決される', () => {
    const { zoom, cam } = camAt(1280, 720, 10, 10)
    const sx = cam.x + (10 * TILE + TILE / 2) * zoom + TILE * zoom
    const sy = cam.y + (10 * TILE + TILE / 2) * zoom
    const t = screenToTile(sx, sy, cam.x, cam.y, zoom, TILE)
    expect(t.tx).toBe(11)
    expect(t.ty).toBe(10)
  })
})

describe('lookAheadOffset', () => {
  it('静止(0,0)ではオフセット0', () => {
    expect(lookAheadOffset(0, 0, TILE)).toEqual({ x: 0, y: 0 })
  })
  it('方向を単位化して tiles*tile 分だけ進む', () => {
    const o = lookAheadOffset(0, 3, TILE, 1.2)
    expect(o.x).toBeCloseTo(0, 6)
    expect(o.y).toBeCloseTo(1.2 * TILE, 6)
  })
})
