// M24/M25: レスポンシブカメラ(zoom/追従/look-ahead/境界クランプ)の純粋計算。
// 描画から分離してテスト可能にする。centerCamera と lighting の erase穴が同じ式を共有することで
// 「主人公中心 = 画面中央 = 穴中央」を全zoomで保証する。
//
// M25 §3.1(実ブラウザ検収の第一所見): 主人公はマップ下端付近(入口)から始まるのに、
// カメラが主人公中心を維持し続けるため、マップ下端より下が丸ごと空白になっていた
// (1280×720 実測: 説明のない暗部 41.2%)。原因はbackdrop不足ではなくクランプの不在である。

export const CAM_MIN_ZOOM = 0.85
export const CAM_MAX_ZOOM = 1.6

/** 操作/UI予約領域(M25 §3.1)。マップはこの内側(=安全領域)を必ず覆う。
 *  上端HUD・下端D-pad/隊員札の裏にマップ端が隠れるのは許す。 */
export interface SafeArea {
  top: number
  right: number
  bottom: number
  left: number
}

export function safeArea(viewW: number): SafeArea {
  // 390px級: 上=HUD2段(44-48 + 34-38) / 下=D-pad・隊員札
  if (viewW < 640) return { top: 96, right: 0, bottom: 118, left: 0 }
  return { top: 56, right: 0, bottom: 0, left: 0 }
}

/** 安全領域の矩形(screen px) — マップが必ず覆うべき範囲 */
export function safeRect(viewW: number, viewH: number): { x: number; y: number; w: number; h: number } {
  const s = safeArea(viewW)
  return { x: s.left, y: s.top, w: viewW - s.left - s.right, h: viewH - s.top - s.bottom }
}

// レスポンシブzoom。横タイル数の目標(PC 24 / モバイル 11)に加え、
// **安全領域を覆うのに必要な倍率**を下限として取り込む(M25 §3.1)。
//
// devil S2-A(実証): 旧実装は viewW しか見ておらず、768×1024 では zoom 0.889 →
// マップ高 704px < ビューポート1024px となり、clampでは1pxも減らせない黒帯が31%生じた
// (マップがビューより小さい軸では中央配置にしかならない)。高さ項の欠落が原因。
// タイル数目標と被覆はトレードオフだが、正典の受入(暗部≤15%)は被覆を優先する。
export function computeZoom(viewW: number, viewH: number, tile: number, mapW: number, mapH: number): number {
  const targetTilesX = viewW < 640 ? 11 : 24
  const byTiles = viewW / (targetTilesX * tile)
  // マップ未構築(grid空)では被覆項を無視する — 0除算でzoomがMAXへ張り付くのを防ぐ
  if (mapW <= 0 || mapH <= 0) return clamp(byTiles, CAM_MIN_ZOOM, CAM_MAX_ZOOM)
  const r = safeRect(viewW, viewH)
  const coverX = r.w / (mapW * tile)
  const coverY = r.h / (mapH * tile)
  return clamp(Math.max(byTiles, coverX, coverY), CAM_MIN_ZOOM, CAM_MAX_ZOOM)
}

export function visibleTilesX(viewW: number, tile: number, zoom: number): number {
  return viewW / (tile * zoom)
}

export function visibleTilesY(viewH: number, tile: number, zoom: number): number {
  return viewH / (tile * zoom)
}

// world.x/y のスナップ目標。playerCx/Cy はプレイヤーの中心world座標(px*tile + tile/2)。
// look-aheadは進行方向へ数タイル先を見せるためのworld座標オフセット(px)。
// ※クランプは含まない — 正典 §3.1「look-ahead後の座標へclampを適用する。
//   先にclampしてからlook-aheadを足してはならない」ため、呼び出し側が clampCamera を後段で掛ける。
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

/** マップ境界クランプ(M25 §3.1)。cameraTarget(look-ahead込み)の結果へ後段で掛ける。
 *  - マップが安全領域より大きい軸: マップ端が安全領域の内側へ入らないよう world.x/y を制限。
 *  - マップが安全領域より小さい軸: 主人公ではなくマップ全体を安全領域の中央へ置く。 */
export function clampCamera(
  target: { x: number; y: number },
  viewW: number,
  viewH: number,
  zoom: number,
  tile: number,
  mapW: number,
  mapH: number,
): { x: number; y: number } {
  const r = safeRect(viewW, viewH)
  return {
    x: clampAxis(target.x, r.x, r.w, mapW * tile * zoom),
    y: clampAxis(target.y, r.y, r.h, mapH * tile * zoom),
  }
}

function clampAxis(world: number, safeStart: number, safeLen: number, mapLen: number): number {
  // マップが安全領域より小さい → 中央配置(主人公追従を捨てる)
  if (mapLen <= safeLen) return safeStart + (safeLen - mapLen) / 2
  // マップが大きい → 端が安全領域へ食い込まない範囲に閉じ込める
  const lo = safeStart + safeLen - mapLen // これ未満だとマップ終端が安全領域内へ入る
  const hi = safeStart // これを超えるとマップ始端が安全領域内へ入る
  return Math.max(lo, Math.min(hi, world))
}

/** 安全領域のうちマップが覆えていない面積の割合[%]。0 なら「説明のない暗部」はマップ外に起因しない。
 *  受入テストの機械オラクル(実ピクセル計測とは独立の幾何検算)。 */
export function offMapRatio(
  world: { x: number; y: number },
  viewW: number,
  viewH: number,
  zoom: number,
  tile: number,
  mapW: number,
  mapH: number,
): number {
  const r = safeRect(viewW, viewH)
  const cov = (start: number, len: number, wStart: number, mapLen: number) => {
    const a = Math.max(start, wStart)
    const b = Math.min(start + len, wStart + mapLen)
    return Math.max(0, b - a)
  }
  const cw = cov(r.x, r.w, world.x, mapW * tile * zoom)
  const chh = cov(r.y, r.h, world.y, mapH * tile * zoom)
  const covered = cw * chh
  const total = r.w * r.h
  return total <= 0 ? 0 : (1 - covered / total) * 100
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

// タップ座標(canvas px)→タイル添字の逆変換。zoom/worldオフセットを解いてタイルを求める。
// cameraTarget/holeHalfResPosと同じscale前提で整合する(devil S2: タップが1タイル外す破壊の封じ)。
export function screenToTile(
  screenX: number,
  screenY: number,
  worldX: number,
  worldY: number,
  zoom: number,
  tile: number,
): { tx: number; ty: number } {
  return {
    tx: Math.floor((screenX - worldX) / zoom / tile),
    ty: Math.floor((screenY - worldY) / zoom / tile),
  }
}

// 進行方向のlook-aheadオフセット(world px)。dir=[dx,dy]は正規化前でよい(内部で単位化)。
export function lookAheadOffset(dx: number, dy: number, tile: number, tiles = 1.2): { x: number; y: number } {
  const len = Math.hypot(dx, dy)
  if (len < 1e-6) return { x: 0, y: 0 }
  return { x: (dx / len) * tiles * tile, y: (dy / len) * tiles * tile }
}

/** 画面揺れの上限(M25 §3.1「clamp後に最大4pxだけ加え、マップ外を大きく露出させない」) */
export const CAM_MAX_SHAKE = 4

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}
