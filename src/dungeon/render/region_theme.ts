// M23(指示7 V2/V3): 地域プロファイルと幕(act)による基盤テーマの変調 — 単一情報源。
// データはcore/data/region_visuals.ts、基盤はrender/theme.ts。engineはここの結果だけを読む。
// 適用範囲の正直な限定(devil反映): props内蔵色は基盤テーマの同一性として維持し、
// 差別化は ground/stain/grass/water/光tint/mote/landmark で行う。
import type { DungeonTheme } from './theme'
import { regionVisualOf, type LandmarkKind } from '../../core/data/region_visuals'

export type DungeonAct = 'norm' | 'dread' | 'seat' // 幕: 通常 / 畏(最終前) / 座(ボス階)

export interface ResolvedVisual {
  theme: DungeonTheme
  mote: number // 浮遊光粒の色
  moteCount: number
  landmark: LandmarkKind | null
}

// 0xRRGGBB同士のチャンネル線形補間
export function lerpColor(a: number, b: number, t: number): number {
  const ch = (sa: number, sb: number) => Math.round(sa + (sb - sa) * t)
  return (
    (ch((a >> 16) & 0xff, (b >> 16) & 0xff) << 16) |
    (ch((a >> 8) & 0xff, (b >> 8) & 0xff) << 8) |
    ch(a & 0xff, b & 0xff)
  )
}

export function resolveRegionVisual(
  base: DungeonTheme,
  regionId: string | undefined,
  act: DungeonAct,
  cleared: boolean,
): ResolvedVisual {
  const p = regionId ? regionVisualOf(regionId) : null
  const theme: DungeonTheme = { ...base }
  if (p) {
    if (p.ground !== undefined) theme.groundBase = p.ground
    if (p.stain !== undefined) theme.stain = p.stain
    if (p.grass !== undefined) theme.grass = p.grass
    if (p.waterDeep !== undefined) theme.waterDeep = p.waterDeep
    if (p.waterGlint !== undefined) theme.waterGlint = p.waterGlint
    if (p.lantern !== undefined) theme.lanternTint = p.lantern
  }
  let mote = p?.mote ?? 0xffe79e
  let moteCount = p?.moteCount ?? 22

  // 第三幕「畏」: 最終前フロア — 色を沈め、光粒を減らし主の色が滲む(VISUAL §6)
  if (act === 'dread') {
    theme.groundBase = lerpColor(theme.groundBase, 0x000000, 0.28)
    theme.stain = lerpColor(theme.stain, theme.bossTint, 0.3)
    theme.grass = lerpColor(theme.grass, 0x120a0c, 0.35)
    theme.veilAlpha = Math.min(0.92, theme.veilAlpha + 0.03)
    mote = lerpColor(mote, theme.bossTint, 0.5)
    moteCount = Math.max(4, Math.round(moteCount * 0.5))
  }
  // 第四幕「座」: ボス階 — 定置光まで主の色に呑まれる
  if (act === 'seat') {
    theme.stain = lerpColor(theme.stain, theme.bossTint, 0.45)
    theme.lanternTint = lerpColor(theme.lanternTint, theme.bossTint, 0.4)
    mote = lerpColor(mote, theme.bossTint, 0.65)
    moteCount = Math.max(3, Math.round(moteCount * 0.35))
  }
  // 鎮: 討伐後の再訪 — 帳が薄れ、光粒は郷の灯色へ緩む(VISUAL §8の「光」実装。
  // 採取物・住民の痕跡は未実装 — M23の明示スコープ外)
  if (cleared) {
    theme.groundBase = lerpColor(theme.groundBase, 0x181208, 0.15)
    theme.veilAlpha = Math.max(0.6, theme.veilAlpha - 0.08)
    mote = 0xd9c26a
    moteCount = Math.min(moteCount, 14)
  }
  return { theme, mote, moteCount, landmark: p?.landmark ?? null }
}
