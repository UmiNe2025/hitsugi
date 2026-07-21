import { useState } from 'react'
import { audio } from '../core/audio'
import { getReduceMotion, setReduceMotion, getAutoBattleDefault, setAutoBattleDefault } from '../core/settings'
import { Sheet } from './layout/shell'
import './settings_vc6.css'

// 設定 — 音量/ミュート/モーション軽減/オート戦闘既定。
// localStorage永続なので開くたびに現在値を読む。M22 §4: 共通Sheet契約(ESC/外側/フォーカス復帰/scroll lock)。
export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [vol, setVol] = useState(Math.round(audio.volume * 100))
  const [muted, setMuted] = useState(audio.muted)
  const [reduceMotion, setRM] = useState(getReduceMotion())
  const [autoDefault, setAutoDef] = useState(getAutoBattleDefault())

  return (
    <Sheet title="道具箱 — 設定" onClose={onClose}>
      <div className="settings-modal settings-toolbox">
        <header className="settings-toolbox-head">
          <span className="settings-toolbox-mark" aria-hidden="true">具</span>
          <p>遊び方は変えず、音・動き・戦闘の始め方だけを手元に合わせる。</p>
        </header>

        <div className="settings-tool-grid">
          <fieldset className="settings-tool-group">
            <legend>音の加減</legend>
            <div className="setting-row">
              <label className="setting-label" htmlFor="setting-volume">音量</label>
              <input
                id="setting-volume" aria-label="音量"
                className="setting-slider" type="range" min={0} max={100} value={vol}
                onChange={(e) => { const v = Number(e.target.value); setVol(v); audio.setVolume(v / 100) }}
              />
              <output className="setting-val" htmlFor="setting-volume" aria-live="polite">{vol}</output>
            </div>

            <button className={`setting-toggle ${muted ? 'on' : ''}`} aria-pressed={muted} onClick={() => setMuted(audio.toggleMute())}>
              <span className="setting-label">音を消す</span>
              <span className="toggle-state">{muted ? '消音中' : '鳴らす'}</span>
            </button>
          </fieldset>

          <fieldset className="settings-tool-group">
            <legend>画面と戦闘</legend>
            <button className={`setting-toggle ${reduceMotion ? 'on' : ''}`} aria-pressed={reduceMotion} onClick={() => { const n = !reduceMotion; setRM(n); setReduceMotion(n) }}>
              <span className="setting-label">演出を控えめに</span>
              <span className="toggle-state">{reduceMotion ? '控えめ' : '通常'}</span>
            </button>
            <p className="setting-hint">画面のゆれ・明滅・移動演出を抑える。攻略情報は減らない。</p>

            <button className={`setting-toggle ${autoDefault ? 'on' : ''}`} aria-pressed={autoDefault} onClick={() => { const n = !autoDefault; setAutoDef(n); setAutoBattleDefault(n) }}>
              <span className="setting-label">戦闘を最初からオート</span>
              <span className="toggle-state">{autoDefault ? 'オート既定' : '手動から'}</span>
            </button>
            <p className="setting-hint">次の出立から、戦闘開始時の状態に反映する。</p>
          </fieldset>
        </div>

        <details className="settings-help">
          <summary>操作の手引き</summary>
          <dl>
            <div><dt>閉じる</dt><dd>画面外を押す / Escape</dd></div>
            <div><dt>項目移動</dt><dd>Tab / Shift + Tab</dd></div>
            <div><dt>決める</dt><dd>Enter / Space</dd></div>
          </dl>
        </details>
      </div>
    </Sheet>
  )
}
