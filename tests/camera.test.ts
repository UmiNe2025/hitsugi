// M24: レスポンシブカメラの純粋計算テスト。
// 最重要: cameraTarget と holeHalfResPos の整合 —「主人公中心=画面中央=erase穴中央」が
// 全zoomで成立すること(devil S2: scale導入で照明穴が主人公からズレる破壊を機械的に封じる)。
import { describe, expect, it } from 'vitest'
import {
  CAM_MIN_ZOOM, CAM_MAX_ZOOM,
  computeZoom, visibleTilesX, visibleTilesY,
  cameraTarget, holeHalfResPos, lookAheadOffset, screenToTile,
} from '../src/dungeon/camera'

const TILE = 36

describe('computeZoom — レスポンシブ倍率', () => {
  it('PC 1280×720で横22〜26タイルに収まる', () => {
    const z = computeZoom(1280, TILE)
    const tx = visibleTilesX(1280, TILE, z)
    expect(tx).toBeGreaterThanOrEqual(22)
    expect(tx).toBeLessThanOrEqual(26)
  })
  it('PC 1440×900で横22〜26タイルに収まる', () => {
    const z = computeZoom(1440, TILE)
    expect(visibleTilesX(1440, TILE, z)).toBeGreaterThanOrEqual(22)
    expect(visibleTilesX(1440, TILE, z)).toBeLessThanOrEqual(26)
  })
  it('モバイル 390で横10〜12タイルに収まる', () => {
    const z = computeZoom(390, TILE)
    const tx = visibleTilesX(390, TILE, z)
    expect(tx).toBeGreaterThanOrEqual(10)
    expect(tx).toBeLessThanOrEqual(12)
  })
  it('zoomは[0.85, 1.6]にclampされる', () => {
    expect(computeZoom(100, TILE)).toBeGreaterThanOrEqual(CAM_MIN_ZOOM)
    expect(computeZoom(100, TILE)).toBe(CAM_MIN_ZOOM)
    expect(computeZoom(9999, TILE)).toBe(CAM_MAX_ZOOM)
  })
  it('主人公表示高(TILE*1.6*zoom)がPCで48px以上(受入§7.2)', () => {
    const z = computeZoom(1280, TILE)
    expect(TILE * 1.6 * z).toBeGreaterThanOrEqual(48)
  })
  it('縦タイル数がPC 720で13〜17の目安に収まる', () => {
    const z = computeZoom(1280, TILE)
    const ty = visibleTilesY(720, TILE, z)
    expect(ty).toBeGreaterThanOrEqual(13)
    expect(ty).toBeLessThanOrEqual(17)
  })
})

describe('cameraTarget × holeHalfResPos の整合(核心)', () => {
  // プレイヤーがタイル(px,py)にいる時、erase穴の半解像度スクリーン座標が
  // 常に画面中央(vw/4, vh/4 = 半解像度の中心)に一致することを全zoomで確認する。
  const cases: [number, number, number, number][] = [
    [1280, 720, 5, 5],
    [1280, 720, 20, 14],
    [1440, 900, 0, 0],
    [390, 844, 8, 30],
  ]
  for (const [vw, vh, px, py] of cases) {
    it(`${vw}×${vh} tile(${px},${py})で穴中央=画面中央`, () => {
      const zoom = computeZoom(vw, TILE)
      const playerCx = px * TILE + TILE / 2
      const playerCy = py * TILE + TILE / 2
      const cam = cameraTarget(playerCx, playerCy, vw, vh, zoom)
      const hole = holeHalfResPos(playerCx, playerCy, cam.x, cam.y, zoom)
      // 半解像度なので画面中央は (vw/2, vh/2) の半分
      expect(hole.x).toBeCloseTo(vw / 4, 6)
      expect(hole.y).toBeCloseTo(vh / 4, 6)
    })
  }
  it('zoom=1でも従来挙動(worldX = vw/2 - playerCx)を保つ', () => {
    const cam = cameraTarget(500, 300, 1280, 720, 1)
    expect(cam.x).toBeCloseTo(640 - 500, 6)
    expect(cam.y).toBeCloseTo(360 - 300, 6)
  })
  it('look-aheadは穴中央から進行方向へずれる(主人公は中央外側を見る)', () => {
    const vw = 1280
    const vh = 720
    const zoom = computeZoom(vw, TILE)
    const playerCx = 20 * TILE
    const playerCy = 14 * TILE
    const la = lookAheadOffset(1, 0, TILE, 1.2)
    const cam = cameraTarget(playerCx, playerCy, vw, vh, zoom, la.x, la.y)
    const hole = holeHalfResPos(playerCx, playerCy, cam.x, cam.y, zoom)
    // 右へlook-aheadした分、穴(主人公)は画面中央より左へ寄る
    expect(hole.x).toBeLessThan(vw / 4)
    expect(hole.y).toBeCloseTo(vh / 4, 6)
  })
})

describe('screenToTile — タップ逆変換(cameraTargetと往復整合)', () => {
  const cases: [number, number, number, number][] = [
    [1280, 720, 5, 5],
    [1280, 720, 20, 14],
    [1440, 900, 12, 8],
    [390, 844, 6, 25],
  ]
  for (const [vw, vh, px, py] of cases) {
    it(`${vw}×${vh}: 画面中央タップ=主人公タイル(${px},${py})`, () => {
      const zoom = computeZoom(vw, TILE)
      const cam = cameraTarget(px * TILE + TILE / 2, py * TILE + TILE / 2, vw, vh, zoom)
      // 画面中央をタップすれば主人公の居るタイルに解決される
      const t = screenToTile(vw / 2, vh / 2, cam.x, cam.y, zoom, TILE)
      expect(t.tx).toBe(px)
      expect(t.ty).toBe(py)
    })
  }
  it('隣タイル中心のタップは隣タイルに解決される', () => {
    const vw = 1280
    const vh = 720
    const zoom = computeZoom(vw, TILE)
    const cam = cameraTarget(10 * TILE + TILE / 2, 10 * TILE + TILE / 2, vw, vh, zoom)
    // 主人公の1タイル右(world +TILE)の中心 = 画面上では vw/2 + TILE*zoom
    const t = screenToTile(vw / 2 + TILE * zoom, vh / 2, cam.x, cam.y, zoom, TILE)
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
