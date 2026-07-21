import { useState } from 'react'
import type { Element, God } from '../core/types'
import { gameImg } from './img'

// 神画が壊れた時に、別画風の簡易立ち絵を捏造しない。
// 名前・属性・欠落状態だけを明示し、世界絵はラスター素材だけに限定する。
const EL_MARK: Record<Element, string> = {
  fire: '火',
  water: '水',
  wind: '風',
  earth: '土',
  moon: '月',
  star: '星',
}

export function GodArtFallback({ g, compact, className }: { g: Pick<God, 'id' | 'name' | 'kana' | 'element'>; compact?: boolean; className?: string }) {
  return (
    <div className={`god-pane-fallback god-fallback ${compact ? 'god-fallback-sm' : ''} ${className ?? ''}`} data-el={g.element}>
      <span className="god-pane-aura" />
      <span className="god-fallback-mark" aria-hidden>{EL_MARK[g.element]}</span>
      <span className="god-fallback-name">{g.name}</span>
      {!compact && <span className="god-fallback-kana">{g.kana}</span>}
      <span className="god-fallback-note">御影を読み込めませんでした</span>
    </div>
  )
}

// 画像があれば表示し、404なら状態説明へ退避する(godIdが変われば試行し直す)
export function GodImgOrFallback({
  g, src, className, compact,
}: {
  g: Pick<God, 'id' | 'name' | 'kana' | 'element' | 'portrait'>
  src?: string
  className?: string
  compact?: boolean
}) {
  const [ok, setOk] = useState(true)
  const [lastId, setLastId] = useState(g.id)
  if (g.id !== lastId) {
    setLastId(g.id)
    setOk(true)
  }
  if (!ok) return <GodArtFallback g={g} compact={compact} className={className ? `${className} is-fallback` : undefined} />
  return (
    <img
      className={className}
      src={src ?? gameImg(g.portrait)}
      alt=""
      aria-hidden
      onError={() => setOk(false)}
    />
  )
}
