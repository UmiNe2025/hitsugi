// M25 §4.1: 全combatant画像を共通の「戦絵札」へ入れる共通component。
// object-fit:containに任せず、art_profiles.tsの焦点/拡大率/余白/素材種別を反映する。
// 表示専用 — 戦闘計算・ゲームデータには一切触れない。
import type { ReactNode } from 'react'
import { artProfileFor, resolveArtBucket } from './art_profiles'

export type CardTier = 'normal' | 'nemesis' | 'lord'

interface BattleArtFrameProps {
  /** バケット解決に使う実sprite/候補ファイル名(例: "en_chochin.png"、"pose_homura_m_adult.png") */
  spriteKey?: string
  /** 例外テーブルの参照キー(未指定はspriteKeyそのまま) */
  overrideKey?: string
  /** 階層 — 通常札/宿敵札/主札の3つだけ(§4.1) */
  tier: CardTier
  /** 実測フックが拾う最外郭ゾーン */
  zone: 'enemy-card' | 'ally-card'
  className?: string
  domRef?: (el: HTMLDivElement | null) => void
  children: ReactNode
}

export function BattleArtFrame({ spriteKey, overrideKey, tier, zone, className, domRef, children }: BattleArtFrameProps) {
  const profile = artProfileFor(spriteKey, overrideKey)
  return (
    <div
      className={`battle-art-frame ${className ?? ''}`}
      data-zone={zone}
      data-tier={tier}
      data-material={profile.material}
      data-bucket={resolveArtBucket(spriteKey)}
      ref={domRef}
    >
      <div
        className="baf-inner"
        style={{
          inset: `${profile.pad}%`,
          ['--af-x' as string]: `${profile.focusX}%`,
          ['--af-y' as string]: `${profile.focusY}%`,
          ['--af-scale' as string]: profile.scale,
        }}
      >
        {children}
      </div>
      <div className="baf-shade" aria-hidden />
    </div>
  )
}
