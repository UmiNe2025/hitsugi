import { useEffect, useRef, useState } from 'react'
import { useGame } from '../core/store'
import { inspectSaveSlot, downloadSave, importSaveString, clearSave } from '../core/save'
import { SceneBg } from './components'
import { emitToast } from './toast'
import './vc2_entry.css'

export function TitleScreen() {
  const newGame = useGame((s) => s.newGame)
  const continueGame = useGame((s) => s.continueGame)
  const [mode, setMode] = useState<'normal' | 'narrative' | 'data' | null>(null)
  const [confirmNew, setConfirmNew] = useState(false)
  const [, setSlotVersion] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const saveStatus = inspectSaveSlot()
  const saveExists = saveStatus !== 'none'
  const canContinue = saveStatus === 'ready' || saveStatus === 'recoverable'
  const canExport = canContinue

  // 「はじめから」— 既存セーブがあれば上書き確認を挟む
  const onNewGame = () => { if (saveExists) setConfirmNew(true); else setMode('normal') }
  const onImportFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const ok = importSaveString(String(reader.result))
      emitToast(ok ? 'セーブを読み込んだ。「つづきから」で再開できる。' : '読み込めなかった(壊れたファイル)。', ok ? 'info' : 'error')
      if (ok) setSlotVersion((value) => value + 1)
    }
    reader.readAsText(file)
  }

  return (
    <div className="screen title-screen">
      <img
        className="title-art-img"
        src={`${import.meta.env.BASE_URL}img/title_key.jpg`}
        alt=""
        aria-hidden
      />
      <div className="embers" aria-hidden>
        {Array.from({ length: 14 }, (_, i) => (
          <span key={i} className="ember" style={{ left: `${(i * 7.3) % 100}%`, animationDelay: `${i * 0.9}s` }} />
        ))}
      </div>
      <div className="title-main">
        <p className="title-kicker">常夜千年・一族継承譚</p>
        <h1 className="game-title">
          <span className="title-hi">灯</span>
          <span className="title-tsugi">継ぎ</span>
        </h1>
        <p className="title-sub">- HITSUGI -</p>
        <p className="title-copy">八季の命を、継いでゆけ。</p>
      </div>

      {confirmNew ? (
        <div className="title-menu">
          <p className="mode-ask">既に一族の記がある。新たに始めれば、それは失われる。よいか?</p>
          <button className="btn btn-main" onClick={() => { setConfirmNew(false); setMode('normal') }}>
            承知の上で、始める
          </button>
          <button className="btn btn-ghost" onClick={() => setConfirmNew(false)}>
            やめておく
          </button>
        </div>
      ) : mode === 'data' ? (
        <div className="title-menu">
          <p className="mode-ask">セーブの管理</p>
          <p className="title-save-state" data-state={saveStatus}>
            {saveStatus === 'ready' && <>端末の記 <strong>読取可能</strong></>}
            {saveStatus === 'recoverable' && <>端末の記 <strong>控えから復旧可能</strong></>}
            {saveStatus === 'damaged' && <>端末の記 <strong>破損を検出</strong><span>ファイルから正常な控えを読み込むか、この記を消してください。</span></>}
            {saveStatus === 'none' && <>端末の記 <strong>まだない</strong></>}
          </p>
          <button className="btn" disabled={!canExport} onClick={() => { if (!downloadSave()) emitToast('書き出せる正常なセーブが無い。', 'error') }}>
            セーブを書き出す(バックアップ)
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            セーブを読み込む(ファイルから)
          </button>
          <button className="btn btn-ghost" disabled={!saveExists} onClick={() => { if (confirm('この端末のセーブを完全に消す。取り消せない。よいか?')) { clearSave(); setSlotVersion((value) => value + 1); emitToast('セーブを消した。', 'info'); setMode(null) } }}>
            セーブを消す
          </button>
          <button className="btn btn-ghost" onClick={() => setMode(null)}>
            戻る
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); e.target.value = '' }} />
        </div>
      ) : mode === null ? (
        <div className="title-menu">
          <p className="title-save-state" data-state={saveStatus} aria-live="polite">
            {saveStatus === 'ready' && <>端末の記 <strong>続きあり</strong></>}
            {saveStatus === 'recoverable' && <>端末の記 <strong>控えから復せる</strong></>}
            {saveStatus === 'damaged' && <>端末の記 <strong>読めない</strong><span>「セーブの管理」で復旧してください。</span></>}
            {saveStatus === 'none' && <>端末の記 <strong>まだない</strong></>}
          </p>
          <button className="btn btn-main" onClick={onNewGame}>
            はじめから
          </button>
          {canContinue && (
            <button className="btn" onClick={() => continueGame()}>
              {saveStatus === 'recoverable' ? '控えからつづける' : 'つづきから'}
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => setMode('data')}>
            セーブの管理
          </button>
        </div>
      ) : (
        <div className="title-menu">
          <p className="mode-ask">語り部の問い — いかに歩む?</p>
          <button className="btn btn-main" onClick={() => newGame(false)}>
            宿命(標準) — 夜は深く、灯は重い
          </button>
          <button className="btn" onClick={() => newGame(true)}>
            語り部(易しめ) — 物語を味わう歩み
          </button>
          <button className="btn btn-ghost" onClick={() => setMode(null)}>
            戻る
          </button>
        </div>
      )}
      <p className="title-ver">ver 0.1 — 燈ノ郷にて</p>
    </div>
  )
}

const INTRO_BEATS = [
  '千年前、この郷から太陽が消えた。',
  '星喰いの神・玄冬(げんとう)が、空を喰らったのだ。',
  '旅の楽士は、己の寿命を薪として大燈籠に火を点し、郷を常夜から守った。',
  'だが火は完全ではなかった。その楽士の血族には、二つの呪いが残った。',
  '一つ。生まれて八つの季節で、体の内の灯が燃え尽きること — 「八季の命」。',
  '一つ。人と子を成せぬこと — 「結ばれぬ身」。',
  'ゆえに一族は、夜空の星神と契りて子を授かり、代を継いで戦い続けてきた。',
  '目指すは夜藪の最深部、灯ノ御山の頂。玄冬の御座。',
  '……さて。千年目の当主よ。あんたの名は燈吾。残る命は、五季。',
  '筆は持った。あんたら一族の生き様、この綴(つづり)が一字も漏らさず書き残す。',
  '— ゆけ。灯を、継いでゆけ。',
]

export function IntroScreen() {
  const setScreen = useGame((s) => s.setScreen)
  const [beat, setBeat] = useState(0)
  const currentRef = useRef<HTMLParagraphElement>(null)
  const done = beat >= INTRO_BEATS.length

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    currentRef.current?.scrollIntoView({ block: 'center', behavior: reducedMotion ? 'auto' : 'smooth' })
  }, [beat])

  const advance = () => {
    if (done) return
    if (beat === INTRO_BEATS.length - 1) {
      setScreen({ id: 'home' })
    } else {
      setBeat(beat + 1)
    }
  }

  return (
    <div className="screen intro-screen" onClick={advance} data-beat={beat + 1}>
      <SceneBg file="cg_prologue.png" />
      <div className="intro-spine" aria-hidden><span>千年目の綴り</span></div>
      <div className="intro-text">
        {INTRO_BEATS.slice(0, beat + 1).map((t, i) => (
          <p key={i} ref={i === beat ? currentRef : undefined} className={i === beat ? 'intro-current' : 'intro-past'}>
            {t}
          </p>
        ))}
      </div>
      <div className="scene-pager" onClick={(e) => e.stopPropagation()}>
        <span className="scene-page-mark">頁 {beat + 1}／{INTRO_BEATS.length}</span>
        <button className="btn scene-next" onClick={advance}>{beat === INTRO_BEATS.length - 1 ? '郷へ進む' : '次の頁へ'}</button>
      </div>
      <button
        className="btn btn-ghost intro-skip"
        onClick={(e) => {
          e.stopPropagation()
          setScreen({ id: 'home' })
        }}
      >
        物語を飛ばす
      </button>
    </div>
  )
}
