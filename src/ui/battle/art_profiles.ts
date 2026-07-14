// M25 §4.1: 戦絵札の表示専用プロファイル。
// sprite接頭辞から4バケット(en_/boss_/pose_/walk_)へ割り当て、例外だけをOVERRIDESへ積む。
// 「全個体へ個別登録」はしない(実画像を1枚ずつ見ないと決められないため — 正典 §4.1)。
// このファイルは表示調整専用であり、神/敵のゲームデータや戦闘計算(src/core/**)へは一切混ぜない。

export type ArtMaterial = 'card' | 'cutout'

export interface ArtProfile {
  focusX: number // object-position X(%)
  focusY: number // object-position Y(%) — 足元基準なら100
  scale: number // 1=containのまま。1超で余白を切り込み拡大する
  pad: number // 枠内側の余白(%)
  material: ArtMaterial // 'card'=白地/彩色の札絵(意図された絵として見せる) / 'cutout'=透過絵・シルエット
}

export type ArtBucketKey = 'enemy' | 'boss' | 'allyPose' | 'allyWalk' | 'default'

const DEFAULT_PROFILE: ArtProfile = { focusX: 50, focusY: 100, scale: 1, pad: 8, material: 'cutout' }

// 実sprite接頭辞(2026-07-15確認: src/core/data/enemies.ts=en_*/boss_*, src/ui/img.ts poseImg=pose_*/spriteImg walk_*)
const BUCKETS: Record<Exclude<ArtBucketKey, 'default'>, ArtProfile> = {
  enemy: { focusX: 50, focusY: 96, scale: 1.08, pad: 8, material: 'cutout' }, // en_* — 比率混在を軽いズームで均す
  boss: { focusX: 50, focusY: 92, scale: 1.16, pad: 4, material: 'cutout' }, // boss_* — 主札は余白を切り詰め大きく見せる
  allyPose: { focusX: 50, focusY: 100, scale: 1.0, pad: 3, material: 'card' }, // pose_* — 白地+落款の縦絵札を意図通り見せる
  allyWalk: { focusX: 50, focusY: 100, scale: 1.5, pad: 10, material: 'cutout' }, // walk_*退避 — 小さな歩行絵を拡大
}

// 例外テーブル — sprite/ポーズのファイル名をキーに個別上書き。実画像監査が進むまでは空でよい。
const OVERRIDES: Record<string, Partial<ArtProfile>> = {}

/** sprite/候補ファイル名の接頭辞からバケットを引く(例: "en_chochin.png" → 'enemy') */
export function resolveArtBucket(fileName: string | undefined): ArtBucketKey {
  if (!fileName) return 'default'
  if (fileName.startsWith('boss_')) return 'boss'
  if (fileName.startsWith('en_')) return 'enemy'
  if (fileName.startsWith('pose_')) return 'allyPose'
  if (fileName.startsWith('walk_')) return 'allyWalk'
  return 'default'
}

/** バケット+例外キー(既定はfileName自体)からプロファイルを解決する */
export function artProfileFor(fileName: string | undefined, overrideKey?: string): ArtProfile {
  const bucket = resolveArtBucket(fileName)
  const base = bucket === 'default' ? DEFAULT_PROFILE : BUCKETS[bucket]
  const key = overrideKey ?? fileName
  const override = key ? OVERRIDES[key] : undefined
  return override ? { ...base, ...override } : base
}
