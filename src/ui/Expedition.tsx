import { useEffect, useRef, useState } from 'react'
import { useGame } from '../core/store'
import type { NodeType, Region } from '../core/types'
import { ELEMENT_LABELS } from '../core/types'
import { REGIONS, regionById } from '../core/data/regions'
import { ENEMIES } from '../core/data/enemies'
import { regionSignOf } from '../core/data/region_visuals'
import { traceIntelOf, bossDangerHint } from '../core/trace'
import { eventById } from '../core/expedition'
import { facilityLevel } from '../core/data/facilities'
import { dungeonByRegion } from '../dungeon/maps'
import { isAdult } from '../core/inheritance'
import { regionQuestion } from '../core/narrative'
import { PARTY_SIZE } from '../core/constants'
import { ActionDock, Sheet } from './layout/shell'
import { useForcedDialog } from './layout/dialogs'
import { DepartPartyPicker } from './DepartParty'
import { Bar, Ico, MaybeImg, NightBackdrop, Panel, TsuzuriLine } from './components'
import { eventImg, gameImg, HOME_BG, regionBgR } from './img'
import './m17_home.css'
import './depart_m18.css'
import './expedition_vc3.css'

// ---- 夜行の絵巻 — 一枚の国絵図に40地域の道標を重ねる ----
// 風景はラスター絵巻、地名・開通状態・選択はDOMが担い、絵に情報を焼き込まない。
const TIER_NAMES: Record<number, string> = { 1: '山麓', 2: '中腹', 3: '奥山', 4: '山頂' }
const EXPEDITION_EMAKIMONO = `${import.meta.env.BASE_URL}img/visual-recovery/world/expedition-emakimono-v2.webp`

function routePoint(index: number, total: number): { top: string; left: string; side: 'east' | 'west' } {
  const progress = total <= 1 ? 0 : index / (total - 1)
  const x = 51 + Math.sin(progress * Math.PI * 5.2) * 10 + Math.sin(progress * Math.PI * 1.7) * 5
  return {
    top: `${94 - progress * 88}%`,
    left: `${x}%`,
    side: x <= 51 ? 'east' : 'west',
  }
}

function AscentMap({
  regions, fame, cleared, selected, onSelect,
}: {
  regions: Region[]
  fame: number
  cleared: string[]
  selected: string | null
  onSelect: (id: string) => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const frontierIndex = regions.reduce((bestIndex, region, index) => (
    fame >= region.unlockFame && (bestIndex < 0 || region.unlockFame >= regions[bestIndex].unlockFame) ? index : bestIndex
  ), -1)
  const selectedIndex = selected ? regions.findIndex((region) => region.id === selected) : frontierIndex
  const compactStart = Math.max(0, Math.min(regions.length - 5, selectedIndex - 2))
  const compactRegions = regions.slice(compactStart, compactStart + 5)

  // 初回表示: 選択中の地(なければ最前線)を視界の中央へ
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const targetId = selected
      ?? regions.reduce<Region | null>((best, region) => (
        fame >= region.unlockFame && (!best || region.unlockFame >= best.unlockFame) ? region : best
      ), null)?.id
    if (!targetId) return
    const target = el.querySelector<HTMLElement>(`[data-region-id="${targetId}"]`)
    if (target) {
      const targetTop = target.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop
      el.scrollTop = Math.max(0, targetTop - el.clientHeight / 2 + target.offsetHeight / 2)
    }
  }, [fame, regions, selected])

  return (
    <>
    <div className="ascent-mobile-strip" role="list" aria-label="現在地周辺の横絵巻">
      {compactRegions.map((region) => {
        const unlocked = fame >= region.unlockFame
        const isCleared = cleared.includes(region.id)
        return (
          <button
            type="button"
            role="listitem"
            key={`compact-${region.id}`}
            className={`ascent-mobile-place ${selected === region.id ? 'is-sel' : ''}`}
            style={{ backgroundImage: `linear-gradient(180deg, rgba(5,7,12,.12), rgba(5,7,12,.92)), url(${regionBgR(region.id)})` }}
            disabled={!unlocked}
            aria-pressed={selected === region.id}
            onClick={() => onSelect(region.id)}
          >
            <span>{isCleared ? '鎮' : unlocked ? '灯' : '封'}</span>
            <b>{region.name}</b>
            <small>{unlocked ? `深さ${region.depth}・${'★'.repeat(region.tier)}` : `武功${region.unlockFame}`}</small>
          </button>
        )
      })}
    </div>
    <div className="ascent-wrap" ref={wrapRef} role="list" aria-label="行き先の絵地図">
      <div className="ascent-map-canvas">
        <img className="ascent-map-art" src={EXPEDITION_EMAKIMONO} alt="" aria-hidden loading="lazy" decoding="async" />
        <div className="ascent-summit" aria-hidden>
          <span>玄冬の座</span>
          <small>常夜の頂</small>
        </div>
        {[1, 2, 3, 4].map((tier) => {
          const first = regions.findIndex((region) => region.tier === tier)
          if (first < 0) return null
          const point = routePoint(first, regions.length)
          return (
            <div key={tier} className="ascent-tier" style={{ top: point.top }} aria-hidden>
              <span>{TIER_NAMES[tier] ?? '道中'}</span>
              <small>{'★'.repeat(tier)}</small>
            </div>
          )
        })}
        {regions.map((r, i) => {
          const unlocked = fame >= r.unlockFame
          const isCleared = cleared.includes(r.id)
          const isSel = selected === r.id
          const point = routePoint(i, regions.length)
          return (
            <div
              key={r.id}
              className={`ascent-entry is-${point.side}`}
              style={{ top: point.top, left: point.left }}
              role="listitem"
            >
              <button
                type="button"
                data-region-id={r.id}
                className={`asc-place ${unlocked ? 'is-open' : 'is-locked'} ${isSel ? 'is-sel' : ''}`}
                disabled={!unlocked}
                aria-pressed={isSel}
                aria-label={`${r.name}${unlocked ? '' : `(武功${r.unlockFame}で開通)`}${isCleared ? '・主討伐済' : ''}`}
                onClick={() => onSelect(r.id)}
              >
                <span className="asc-place-seal" aria-hidden>{isCleared ? '鎮' : unlocked ? '灯' : '封'}</span>
                <span className="asc-place-copy">
                  <b>{r.name}</b>
                  <small>{unlocked ? (isCleared ? '鎮め済み' : r.bossId ? '主の気配あり' : '探索できる') : `武功${r.unlockFame}で開く`}</small>
                </span>
              </button>
            </div>
          )
        })}
        <div className="ascent-village" aria-hidden>
          <span>燈ノ郷</span>
          <small>帰るべき灯</small>
        </div>
      </div>
    </div>
    </>
  )
}

function RegionList({
  regions, fame, cleared, selected, onSelect,
}: {
  regions: Region[]
  fame: number
  cleared: string[]
  selected: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="depart-region-list" role="list" aria-label="行き先の文字一覧">
      {regions.map((region) => {
        const unlocked = fame >= region.unlockFame
        const isCleared = cleared.includes(region.id)
        return (
          <div key={region.id} className="depart-region-entry" role="listitem">
            <button
              className={`depart-region-row ${selected === region.id ? 'is-sel' : ''}`}
              disabled={!unlocked}
              aria-pressed={selected === region.id}
              onClick={() => onSelect(region.id)}
            >
              <span className="depart-region-row-state">{isCleared ? '鎮' : unlocked ? '灯' : '封'}</span>
              <span><b>{region.name}</b><small>深さ{region.depth}・見立て{'★'.repeat(region.tier)}</small></span>
              <em>{unlocked ? (region.bossId ? (isCleared ? '主討伐済' : '主あり') : '探索可') : `武功${region.unlockFame}`}</em>
            </button>
          </div>
        )
      })}
    </div>
  )
}

function routeShortlist(fame: number, cleared: string[], selected: string | null) {
  const unlocked = REGIONS.filter((region) => fame >= region.unlockFame)
  const frontier = unlocked.reduce<Region | undefined>((best, region) => (
    !best || region.unlockFame >= best.unlockFame ? region : best
  ), undefined)
  const current = selected ? REGIONS.find((region) => region.id === selected) : undefined
  const unbeaten = [...unlocked].reverse().find((region) => !!region.bossId && !cleared.includes(region.id))
  const previous = [...unlocked].reverse().find((region) => cleared.includes(region.id))
  const nextLocked = REGIONS.find((region) => fame < region.unlockFame)
  const candidates: { region: Region; label: string }[] = []
  const add = (region: Region | undefined, label: string) => {
    if (region && !candidates.some((candidate) => candidate.region.id === region.id)) candidates.push({ region, label })
  }
  add(current, '選び中')
  add(frontier, '最前線')
  add(unbeaten, '未討伐')
  add(previous, '前に鎮めた地')
  add(nextLocked, '次に開く地')
  return candidates.slice(0, 4)
}

// 前回選んだ地(localStorage) — M22 §5: 開いた瞬間から右ペインを非空にする
const LAST_REGION_KEY = 'hitsugi_last_region_v1'

// 初期選択: 前回選んだ地が今も有効ならそれを、なければ最前線(解禁済みの最上段)を選ぶ
function initialRegionId(fame: number): string | null {
  const unlocked = REGIONS.filter((r) => fame >= r.unlockFame)
  if (unlocked.length === 0) return null
  let last: string | null = null
  try {
    last = localStorage.getItem(LAST_REGION_KEY)
  } catch {
    // private mode等で読めなくても初期選択は成立させる
  }
  if (last && unlocked.some((r) => r.id === last)) return last
  // M32修正: 「最前線」は配列末尾でなく解禁武功が最大の地(regions.tsのtier2が配列順で非単調のため)
  return unlocked.reduce((a, b) => (b.unlockFame >= a.unlockFame ? b : a)).id
}

// 地域画 — 404時は別の土地の絵や簡易SVGへ差し替えず、情報だけを静かに残す。
function RegionArt({ region }: { region: Region }) {
  const [ok, setOk] = useState(true)
  const [lastId, setLastId] = useState(region.id)
  if (region.id !== lastId) {
    setLastId(region.id)
    setOk(true)
  }
  if (!ok) {
    return (
      <div className="region-art-fallback">
        <span className="region-art-name">{region.name}</span>
        <span className="region-art-note">遠見が利かぬ — 地誌を確認してください</span>
      </div>
    )
  }
  return (
    <img
      className="region-detail-img"
      src={regionBgR(region.id)}
      alt=""
      aria-hidden
      onError={() => setOk(false)}
    />
  )
}

export function DepartScreen() {
  const data = useGame((s) => s.data)!
  const setScreen = useGame((s) => s.setScreen)
  const depart = useGame((s) => s.depart)
  const departDungeon = useGame((s) => s.departDungeon)
  const adults = data.family.filter((c) => c.alive && isAdult(c, data.seasonIndex))
  const [regionId, setRegionId] = useState<string | null>(() => initialRegionId(data.fame))
  const [party, setParty] = useState<string[]>(() => adults.length === 1 ? [adults[0].id] : [])
  const [view, setView] = useState<'map' | 'list'>('map')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const selectRegion = (id: string) => {
    setRegionId(id)
    try {
      localStorage.setItem(LAST_REGION_KEY, id)
    } catch {
      // 保存できなくても選択は成立する
    }
  }

  const toggle = (id: string) =>
    setParty((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < PARTY_SIZE ? [...p, id] : p))

  const selectedRegion = regionId ? regionById(regionId) : null
  const shortlist = routeShortlist(data.fame, data.regionsCleared, regionId)
  // 出立不可の理由はCTA近くへ常時表示する(押してから初めて出さない — M22 §1.4)
  const dockNote = adults.length === 0
    ? '成人がいない — 幼子の成長を待つか、星契りで子を授かれ'
    : !selectedRegion
      ? '行き先を選べ'
      : party.length === 0
        ? `隊を組め(${party.length}/${PARTY_SIZE})`
        : undefined

  return (
    <div className="screen depart-m18-root">
      <NightBackdrop bg={gameImg(HOME_BG)} />
      <div className="depart-readybar">
        行き先 <b>{selectedRegion ? selectedRegion.name : '未選択'}</b>
        {' ／ '}隊 <b>{party.length}/{PARTY_SIZE}</b>
        {' ／ '}灯100で発つ
      </div>
      <h1 className="season-label" style={{ marginBottom: 14 }}>出立 — 夜藪行</h1>
      <TsuzuriLine text="行き先と、連れて行く者を選べ。四人まで。深く潜るほど実りは多いが、灯が尽きれば常夜はお前らを喰いに来る。" />

      <section className="depart-route-shortlist" aria-labelledby="depart-shortlist-title">
        <div className="depart-shortlist-head">
          <div><span>今夜の道標</span><h2 id="depart-shortlist-title">四つまでに絞った行き先</h2></div>
          <div className="depart-view-switch" role="group" aria-label="絵巻の表示方法">
            <button className={view === 'map' ? 'is-sel' : ''} aria-pressed={view === 'map'} onClick={() => setView('map')}>絵地図</button>
            <button className={view === 'list' ? 'is-sel' : ''} aria-pressed={view === 'list'} onClick={() => setView('list')}>文字一覧</button>
          </div>
        </div>
        <div className="depart-shortlist-grid">
          {shortlist.map(({ region, label }) => {
            const unlocked = data.fame >= region.unlockFame
            return (
              <button
                key={region.id}
                className={`depart-shortlist-card ${region.id === regionId ? 'is-sel' : ''}`}
                disabled={!unlocked}
                aria-pressed={region.id === regionId}
                onClick={() => selectRegion(region.id)}
              >
                <span className="depart-shortlist-label">{label}</span>
                <b>{region.name}</b>
                <small>{unlocked ? `深さ${region.depth}・${region.bossId ? '主あり' : '道中'}` : `武功${region.unlockFame}で開通`}</small>
              </button>
            )
          })}
        </div>
      </section>

      <Panel title="行き先 — 夜行の絵巻">
        <div className="depart-cols">
          {view === 'map' ? (
            <AscentMap
              regions={REGIONS}
              fame={data.fame}
              cleared={data.regionsCleared}
              selected={regionId}
              onSelect={selectRegion}
            />
          ) : (
            <RegionList
              regions={REGIONS}
              fame={data.fame}
              cleared={data.regionsCleared}
              selected={regionId}
              onSelect={selectRegion}
            />
          )}
          <div className="depart-side">
            {!selectedRegion ? (
              <div className="region-detail region-detail-empty">
                <p>絵巻から行き先を選べ。灯った印が、いま踏み込める地だ。</p>
                <p className="asc-legend">
                  <span className="asc-lg"><i className="asc-dot asc-dot-open" />行ける地</span>
                  <span className="asc-lg"><i className="asc-dot asc-dot-clear" />主討伐済</span>
                  <span className="asc-lg"><i className="asc-dot asc-dot-lock" />未開通</span>
                </p>
                {facilityLevel(data.facilities, 'monomi') >= 1 && (
                  <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                    物見櫓の見立て — ★の数は、その地に潜む魔性の強さの目安だ。
                  </p>
                )}
              </div>
            ) : (
              (() => {
                const isCleared = data.regionsCleared.includes(selectedRegion.id)
                const boss = selectedRegion.bossId ? ENEMIES.find((e) => e.id === selectedRegion.bossId) : undefined
                const sign = regionSignOf(selectedRegion.id)
                const monomiLv = facilityLevel(data.facilities, 'monomi')
                const intel = traceIntelOf(data, selectedRegion.id) // 痕跡=石碑の観察度(M23)
                return (
                  // key=地域id: 選び直すたび灯写し(一度だけのreveal)をやり直す
                  <div className="region-detail" key={selectedRegion.id}>
                    <div className="region-hiutsushi">
                      <RegionArt region={selectedRegion} />
                      {boss && !isCleared && (
                        <MaybeImg src={gameImg(boss.sprite)} className="region-boss-sil" />
                      )}
                      {isCleared && <span className="region-shizume-seal" aria-hidden>鎮</span>}
                    </div>
                    <div className="region-detail-head">
                      <span className="region-name">{selectedRegion.name}</span>
                      <span className="region-tier">{'★'.repeat(selectedRegion.tier)}</span>
                    </div>
                    <p className="region-desc">{selectedRegion.desc}</p>
                    <p className="region-question-line">
                      <span>この地の問い</span>
                      {regionQuestion(
                        selectedRegion.name,
                        data.loreFrags?.[selectedRegion.id] ?? 0,
                        isCleared,
                      )}
                    </p>
                    <p className="region-detail-sub">
                      深さ{selectedRegion.depth}
                      {isCleared ? ' ・ 主討伐済(鎮)' : selectedRegion.bossId ? ' ・ 主あり(未討伐)' : ''}
                    </p>
                    <p className="region-detail-risk">
                      見立て★{selectedRegion.tier} ／ 推奨武功 {selectedRegion.unlockFame}
                    </p>
                    {boss && (
                      <p className="region-boss-line">
                        主 <b>{boss.name}</b>
                        {isCleared
                          ? ' — 鎮められた'
                          : ` — 討てば奉燈${boss.hoto}・血珠${boss.ketsu}`}
                      </p>
                    )}
                    {sign && (
                      <p className="region-sign-line">
                        署名 {sign.landmark} ／ 兆し 「{sign.omen}」
                      </p>
                    )}
                    {(monomiLv >= 1 || intel.attr) && boss && !isCleared && (
                      <p className="region-monomi-line">
                        {intel.attr ? '痕跡の見立て' : '物見の見立て'} — 主は{ELEMENT_LABELS[boss.element]}の気配を帯びる。
                      </p>
                    )}
                    {intel.danger && boss && !isCleared && (
                      <p className="region-monomi-line">危険の見立て — {bossDangerHint(boss.id)}</p>
                    )}
                    {intel.max > 0 && (
                      <p className="region-trace-line">
                        土地の観察 {intel.level}/{intel.max}(石碑)
                        {intel.mikiri && !isCleared ? ' — 見切りの構えあり' : ''}
                      </p>
                    )}
                  </div>
                )
              })()
            )}
          </div>
        </div>
      </Panel>

      <Panel title={`隊を組む(${party.length}/${PARTY_SIZE})`}>
        <DepartPartyPicker
          adults={adults}
          family={data.family}
          seasonIndex={data.seasonIndex}
          party={party}
          onToggle={toggle}
        />
      </Panel>

      <ActionDock note={dockNote}>
        <button
          className="btn btn-main"
          disabled={!regionId || party.length === 0}
          onClick={() => {
            if (!regionId || party.length === 0) return
            setConfirmOpen(true)
          }}
        >
          {selectedRegion ? `${selectedRegion.name}へ` : '行き先未選択'} ／ {party.length}人 ／ 今月を使う
        </button>
        <button className="btn btn-ghost" onClick={() => setScreen({ id: 'home' })}>
          郷へ戻る
        </button>
      </ActionDock>

      {confirmOpen && selectedRegion && (
        <Sheet title={`出立の確かめ — ${selectedRegion.name}`} onClose={() => setConfirmOpen(false)} closeLabel="やめる">
          <div className="depart-confirm-route">
            <RegionArt region={selectedRegion} />
            <p><b>行き先</b>{selectedRegion.name}・深さ{selectedRegion.depth}・見立て{'★'.repeat(selectedRegion.tier)}</p>
            <p><b>隊</b>{party.map((id) => data.family.find((character) => character.id === id)?.name).filter(Boolean).join('、')}</p>
            <p><b>費やすもの</b>今月を使う。灯100で発つ。</p>
          </div>
          <div className="confirm-actions">
            <button className="btn btn-ghost" onClick={() => setConfirmOpen(false)}>編成へ戻る</button>
            <button
              className="btn btn-main"
              onClick={() => {
                setConfirmOpen(false)
                if (dungeonByRegion(selectedRegion.id)) departDungeon(selectedRegion.id, party)
                else depart(selectedRegion.id, party)
              }}
            >
              この隊で今月を使い、出立する
            </button>
          </div>
        </Sheet>
      )}
    </div>
  )
}

const NODE_META: Record<NodeType, { icon: string; iconImg: string; label: string }> = {
  battle: { icon: '⚔️', iconImg: 'node_battle', label: '魔性の気配' },
  elite: { icon: '👹', iconImg: 'node_elite', label: '強き魔性' },
  treasure: { icon: '📦', iconImg: 'node_treasure', label: '打ち捨てられた宝' },
  camp: { icon: '🔥', iconImg: 'node_camp', label: '焚火の跡' },
  event: { icon: '📜', iconImg: 'node_event', label: '何かがある' },
  boss: { icon: '💀', iconImg: 'node_boss', label: 'この地の主' },
  start: { icon: '⛩️', iconImg: 'node_start', label: '入口' },
}

export function EventModal() {
  const pendingEvent = useGame((s) => s.pendingEvent)
  if (!pendingEvent) return null
  return <EventDialog eventId={pendingEvent.eventId} />
}

// M22 §4: 事件は「取り返しのつかない確定」— ESC/外側クリックで閉じない(誤閉鎖防止の例外)。
// role/aria/scroll lock/初期フォーカスのみ共通契約(useForcedDialog)を配線する。
function EventDialog({ eventId }: { eventId: string }) {
  const data = useGame((s) => s.data)!
  const resolveEvent = useGame((s) => s.resolveEvent)
  const ref = useForcedDialog()
  const ev = eventById(eventId)
  return (
    <div className="modal-back" role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-label="事件 — 選ばねば先へ進めない" ref={ref}>
        <h2 className="panel-title">事件</h2>
        {/* B(M29+): 事件の目的を明示 — 「何のための選択か」が分かるように */}
        <p className="ev-frame">夜藪の出来事。選んだ道が実り(宝・縁・灯)にも災い(傷・灯減り)にもなる。どちらを選んでも先へは進める。</p>
        <MaybeImg src={eventImg(eventId)} className="ev-img" />
        <p style={{ marginBottom: 16, fontSize: 15 }}>{ev.text}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ev.choices.map((c, i) => {
            // M32修正: 単発outcomeでも battle:true(必ず戦闘発生)は「確かな道」にせず危険側に分類する
            const gamble = c.successRate !== undefined || c.outcomes.length > 1 || c.outcomes.some((o) => o.battle)
            const cost = c.requireHoto !== undefined ? `(奉燈${c.requireHoto})` : ''
            return (
              <button
                key={i}
                className="btn ev-choice"
                disabled={c.requireHoto !== undefined && data.hoto < c.requireHoto}
                onClick={() => resolveEvent(i)}
              >
                <span className="ev-choice-label">{c.label} {cost}</span>
                <span className={`ev-choice-tag ${gamble ? 'is-gamble' : 'is-safe'}`}>
                  {gamble ? '賭け — 吉凶あり' : '確かな道'}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function ExpeditionScreen() {
  const data = useGame((s) => s.data)!
  const chooseNode = useGame((s) => s.chooseNode)
  const useReturnFire = useGame((s) => s.useReturnFire)
  const exp = data.expedition
  if (!exp) return null
  const region = regionById(exp.regionId)
  const current = exp.nodes[exp.currentNodeId]
  const choices = current.choices.map((id) => exp.nodes[id])
  const party = data.family.filter((c) => exp.partyIds.includes(c.id) && c.alive)

  return (
    <div className="screen exp-screen">
      <div
        className="exp-bg"
        style={{ backgroundImage: `url(${regionBgR(region.id)}), url(${gameImg(region.bg)})` }}
        aria-hidden
      />
      <div className="exp-header">
        <span className="exp-region">{region.name}</span>
        <div className="light-wrap">
          <div className="light-label">灯 — 尽きれば常夜が牙を剥く</div>
          <Bar value={exp.light} max={100} kind="light" />
        </div>
        <span className="resource">
          持ち帰り: 奉燈<b>{exp.loot.hoto}</b> 血珠<b>{exp.loot.ketsu}</b>
        </span>
      </div>

      {exp.light <= 0 && (
        <TsuzuriLine text="灯が尽きた! 魔性が狂気を帯びる。今すぐ帰り火を焚け、欲をかくな!" />
      )}

      <main className="exp-scroll-surface" data-testid="expedition-scroll-surface">
        <section className="exp-scroll-place" aria-labelledby="exp-scroll-title">
          <RegionArt region={region} />
          <div>
            <span className="exp-scroll-kicker">選んだ地</span>
            <h1 id="exp-scroll-title">{region.name}</h1>
            <p>{region.desc}</p>
            <small>見立て{'★'.repeat(region.tier)}・全{region.depth}層</small>
          </div>
        </section>

        <section className="exp-scroll-progress" aria-label="いまいる節と次の道">
          <div className="exp-current-node" aria-live="polite">
            <span className="exp-path-line" aria-hidden />
            <span className="exp-current-seal" aria-hidden>{current.depth}</span>
            <div>
              <span>いまいる節</span>
              <b>{NODE_META[current.type].label}</b>
              <small>深さ {current.depth}/{region.depth}</small>
            </div>
          </div>

          {choices.length > 0 ? (
            <div className="exp-branch-field">
              <p>絵巻の先を選ぶ — 選ぶと直ちに道が進む</p>
              <div className="node-choices">
                {choices.map((node, index) => (
                  <button key={node.id} className="node-btn exp-branch" onClick={() => chooseNode(node.id)}>
                    <span className="exp-branch-no" aria-hidden>{index + 1}</span>
                    <span className="node-icon">
                      <Ico name={NODE_META[node.type].iconImg} fb={NODE_META[node.type].icon} size={22} />
                    </span>
                    <span className="node-label">{NODE_META[node.type].label}</span>
                    <span className="node-depth">深さ{node.depth}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="exp-path-end">これより先に道はない。成果を巻き、帰り火を焚いて郷へ戻ろう。</p>
          )}
        </section>

        <section className="exp-scroll-party" aria-labelledby="exp-party-title">
          <div className="exp-scroll-section-head">
            <div><span>同じ絵巻を歩く者</span><h2 id="exp-party-title">隊の様子</h2></div>
            <small>{party.length}人・帰還時に成果を持ち帰る</small>
          </div>
          <div className="exp-party">
            {party.map((character) => (
              <div key={character.id} className="ally-cell">
                <div className="ally-name">{character.name}</div>
                <Bar value={character.hp} max={character.maxHp} kind="hp" />
                <Bar value={character.mp} max={character.maxMp} kind="mp" />
              </div>
            ))}
          </div>
        </section>

        <section className="exp-scroll-return" aria-labelledby="exp-return-title">
          <div>
            <span>ここから郷へ戻る</span>
            <h2 id="exp-return-title">帰り火</h2>
            <p>持ち帰り: 奉燈<b>{exp.loot.hoto}</b>・血珠<b>{exp.loot.ketsu}</b>。帰ればこの遠征を終える。</p>
          </div>
          <button className="btn btn-danger" onClick={useReturnFire}>帰り火を焚く(成果を持って帰還)</button>
        </section>

        <details className="exp-scroll-log">
          <summary>道中の記を読む({Math.min(6, exp.log.length)}件)</summary>
          <div className="exp-log">
            {exp.log.slice(-6).map((line, index) => <p key={index}>{line}</p>)}
          </div>
        </details>
      </main>

      <EventModal />
    </div>
  )
}
