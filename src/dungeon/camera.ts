// M24: レスポンシブカメラ(zoom/追従/look-ahead)の純粋計算。
// 描画から分離してテスト可能にする — devil S2「scale前提の破壊は単体テストで穴中心=主人公中心をassert」。
// world.scale=zoom を導入する際、centerCamera と lighting の erase穴が同じ式を共有することで整合を保証する。

export const CAM_MIN_ZOOM = 0.85
export const CAM_MAX_ZOOM = 1.6

// レスポンシブzoom: PCは横22〜26タイル(目標24)、モバイル(<640px)は横10〜12タイル(目標11)を狙う。
// 現スプライト(TILE*1.6)前提では主人公表示px = TILE*1.6*zoom となり、PCで約79〜93px(指示§4.1の
// 天井64pxは現スプライトでは両立不能 — 視認性目的を優先しタイル数を正とする。契約①で確定)。
export function computeZoom(viewW: number, tile: number): number {
  const targetTilesX = viewW < 640 ? 11 : 24
  const raw = viewW / (targetTilesX * tile)
  return clamp(raw, CAM_MIN_ZOOM, CAM_MAX_ZOOM)
}

export function visibleTilesX(viewW: number, tile: number, zoom: number): number {
  return viewW / (tile * zoom)
}

export function visibleTilesY(viewH: number, tile: number, zoom: number): number {
  return viewH / (tile * zoom)
}

// world.x/y のスナップ目標。playerCx/Cy はプレイヤーの中心world座標(px*tile + tile/2)。
// look-aheadは進行方向へ数タイル先を見せるためのworld座標オフセット(px)。
export function cameraTarget(
  playerCx: number,
  playerCy: number,
  viewW: number,
  viewH: number,
  zoom: number,
  lookAheadX = 0,
  lookAheadY = 0,
): { x: number; y: number } {
  return {
    x: viewW / 2 - (playerCx + lookAheadX) * zoom,
    y: viewH / 2 - (playerCy + lookAheadY) * zoom,
  }
}

// erase穴の半解像度スクリーン座標。lightingは renderer/2 のRTへ描くため 0.5 を掛ける。
// worldX/Y は world コンテナの実 x/y(cameraTargetの結果がlerpで反映された値)。
// この式が cameraTarget と整合していれば「主人公中心 = 画面中央 = 穴中央」が全zoomで成立する。
export function holeHalfResPos(
  sourceWx: number,
  sourceWy: number,
  worldX: number,
  worldY: number,
  zoom: number,
): { x: number; y: number } {
  return {
    x: (worldX + sourceWx * zoom) * 0.5,
    y: (worldY + sourceWy * zoom) * 0.5,
  }
}

// 進行方向のlook-aheadオフセット(world px)。dir=[dx,dy]は正規化前でよい(内部で単位化)。
export function lookAheadOffset(dx: number, dy: number, tile: number, tiles = 1.2): { x: number; y: number } {
  const len = Math.hypot(dx, dy)
  if (len < 1e-6) return { x: 0, y: 0 }
  return { x: (dx / len) * tiles * tile, y: (dy / len) * tiles * tile }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}
