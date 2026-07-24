// M23(指示6): 燈ノ郷を歩く — PixiJS歩行マップ画面。
// 歩行(WASD/矢印/タップ/D-pad)と即移動(すぐ行くバー常設)を併設し、月は消費しない(setScreenのみ)。
// 契約: docs/POLISH_FIX_INSTRUCTIONS_CLAUDE.md §5
import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../core/store'
import type { Character, GameData, Screen, Tomoshigata } from '../core/types'
import { resolveVillageVisualState } from '../core/data/village_visual_state'
import { isRegionVisualV2Enabled } from '../core/feature_flags'
import { VILLAGERS, villagerBandOf, villagerLine, villagerLineKey } from '../core/data/villagers'
import { GOSSIP, type GossipEntry } from '../core/data/gossip'
import { personalityById } from '../core/data/personalities'
import { CONSUMABLES } from '../core/data/consumables'
import { ageOf, seasonsLeft } from '../core/inheritance'
import { getReduceMotion } from '../core/settings'
import { VillageEngine, type VillageFocus, type VillageNpc } from '../village/engine'
import { defaultVillageFacadeAssets, type VillageFacadeAssetSet } from '../village/render/facades'
import { defaultVillageEnvironmentAsset } from '../village/render/environment'
import { charSprite, spriteUrl, stageOf, villagerImg, walkBasePath } from './img'
import { MaybeImg } from './components'
import { Sheet } from './layout/shell'
import { emitToast } from './toast'
import './village.css'
import './village_m26.css' // M26 §6: 追従カメラUI(village.cssより後 — 後勝ち)
import './village_polish_m29.css' // M29+: 郷歩行画面の視覚改善。village-stageの寸法には触れない(後勝ち)
import './village_m47.css'

// NPCの立ち位置(engine側MAPの歩行可タイルに合わせる)
const NPC_SPOTS: Record<string, [number, number]> = {
  tetsuzo: [5, 3],
  kosuzu: [12, 3],
  tane: [16, 4],
  matsukichi: [12, 8],
}

const NPC_WALK_SPRITES: Record<string, { gata: Tomoshigata; sex: 'm' | 'f' }> = {
  tetsuzo: { gata: 'iwao', sex: 'm' },
  kosuzu: { gata: 'nagi', sex: 'f' },
  tane: { gata: 'sumi', sex: 'f' },
  matsukichi: { gata: 'homura', sex: 'm' },
}

// M34 N2: 各郷の声を、歩行マップに実在する一人へ預ける。
// 綴や名のない声も「伝え聞いた話」として郷人が運ぶため、画面外の架空話者を増やさない。
const GOSSIP_VILLAGER_IDS = [
  'matsukichi', 'tane', 'matsukichi', 'tetsuzo', 'kosuzu', 'tetsuzo',
  'tane', 'kosuzu', 'tane', 'matsukichi', 'matsukichi', 'kosuzu',
  'kosuzu', 'tetsuzo', 'kosuzu', 'kosuzu', 'kosuzu', 'kosuzu',
] as const

const JOURNEY_GOSSIP_FLAG_BASE = 1000
const DEFAULT_VILLAGE_FACADE_ASSETS = defaultVillageFacadeAssets(import.meta.env.BASE_URL)
const DEFAULT_VILLAGE_ENVIRONMENT_ASSET = defaultVillageEnvironmentAsset(import.meta.env.BASE_URL)

export interface VillageGossipAssignment {
  entry: GossipEntry
  ordinal: number
  villagerId: string
}

/** 解禁済みの最新一本だけを返す。唯一開示前はgsp11で止め、実名を先に出さない。 */
// oxlint-disable-next-line react/only-export-components -- NPC割当と開示上限を単体検証するため公開する。
export function latestVillageGossip(
  data: Pick<GameData, 'gossipIndex' | 'flags'>,
): VillageGossipAssignment | null {
  const revealCap = data.flags.reveal_shiori_name ? GOSSIP.length : 11
  const unlocked = Math.min(Math.max(0, data.gossipIndex ?? 0), revealCap, GOSSIP.length)
  if (unlocked === 0) return null
  const index = unlocked - 1
  return { entry: GOSSIP[index], ordinal: unlocked, villagerId: GOSSIP_VILLAGER_IDS[index] }
}

function decodedTalkFlag(flag: boolean | number | undefined): { gossipOrdinal: number; lineKey: number | null } | null {
  if (typeof flag !== 'number' || flag < JOURNEY_GOSSIP_FLAG_BASE) return null
  const payload = flag - JOURNEY_GOSSIP_FLAG_BASE
  const lineSlot = payload % 10
  return { gossipOrdinal: Math.floor(payload / 10), lineKey: lineSlot > 0 ? lineSlot - 1 : null }
}

function encodeTalkFlag(gossipOrdinal: number, lineKey: number | null): number {
  return JOURNEY_GOSSIP_FLAG_BASE + gossipOrdinal * 10 + (lineKey === null ? 0 : lineKey + 1)
}

function normalLineWasHeard(flag: boolean | number | undefined, lineKey: number): boolean {
  if (flag === lineKey) return true
  return decodedTalkFlag(flag)?.lineKey === lineKey
}

// oxlint-disable-next-line react/only-export-components -- 会話済みフラグの後方互換を単体検証するため公開する。
export function villageGossipWasHeard(flag: boolean | number | undefined, gossipOrdinal: number): boolean {
  return (decodedTalkFlag(flag)?.gossipOrdinal ?? 0) >= gossipOrdinal
}

/** 噂を聞いた印と、その月の通常会話を聞いた印を一つの既存フラグへ共存させる。 */
// oxlint-disable-next-line react/only-export-components -- 一度だけ表示する永続値を単体検証するため公開する。
export function markVillageGossipValue(
  flag: boolean | number | undefined,
  lineKey: number,
  gossipOrdinal: number,
): number {
  return encodeTalkFlag(gossipOrdinal, normalLineWasHeard(flag, lineKey) ? lineKey : null)
}

function markNormalTalkValue(flag: boolean | number | undefined, lineKey: number): number {
  const gossipOrdinal = decodedTalkFlag(flag)?.gossipOrdinal
  return gossipOrdinal ? encodeTalkFlag(gossipOrdinal, lineKey) : lineKey
}

interface Talk {
  name: string
  role?: string
  text: string
  imgUrl?: string
  action?: 'medicine'
}

export interface VillageScreenProps {
  visualV2?: boolean
  facadeAssets?: VillageFacadeAssetSet
  environmentAsset?: string
}

export function VillageScreen({ visualV2, facadeAssets, environmentAsset }: VillageScreenProps = {}) {
  const data = useGame((s) => s.data)!
  const setScreen = useGame((s) => s.setScreen)
  const markVillagerTalked = useGame((s) => s.markVillagerTalked)
  const buyConsumable = useGame((s) => s.buyConsumable)
  const hostRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<VillageEngine | null>(null)
  const [focus, setFocus] = useState<VillageFocus | null>(null)
  const [talk, setTalk] = useState<Talk | null>(null)
  const [pressedDirection, setPressedDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null)
  const [surveying, setSurveying] = useState(false)
  const [medicineShopOpen, setMedicineShopOpen] = useState(false)
  const surveyingRef = useRef(false)
  const resolvedVisualV2 = visualV2 ?? isRegionVisualV2Enabled()
  const villageVisualState = useMemo(() => resolveVillageVisualState(data), [data])

  const alive = data.family.filter((c) => c.alive)
  const leader = alive.find((c) => c.isHead) ?? alive[0]
  const lineKey = villagerLineKey(data.seasonIndex)
  const band = villagerBandOf(data.seasonIndex)
  const latestGossip = latestVillageGossip(data)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const npcs: VillageNpc[] = VILLAGERS.map((v) => {
      const flag = data.flags[`vilTalk_${v.id}`]
      const hasLatestGossip = latestGossip?.villagerId === v.id
      return {
        id: v.id,
        name: v.name,
        role: v.role,
        x: NPC_SPOTS[v.id]?.[0] ?? 8,
        y: NPC_SPOTS[v.id]?.[1] ?? 6,
        imgUrl: villagerImg(v.id, band),
        spriteUrl: NPC_WALK_SPRITES[v.id]
          ? spriteUrl(NPC_WALK_SPRITES[v.id].gata, NPC_WALK_SPRITES[v.id].sex)
          : undefined,
        news: !normalLineWasHeard(flag, lineKey)
          || !!(hasLatestGossip && !villageGossipWasHeard(flag, latestGossip.ordinal)),
      }
    })
    const kin = alive
      .filter((c) => c.id !== leader?.id)
      .map((c) => ({
        id: c.id,
        name: c.name,
        spriteUrl: c.tomoshigata ? charSprite(c, stageOf(ageOf(c, data.seasonIndex))) : null,
      }))
    const engine = new VillageEngine(
      host,
      {
        leaderSpriteBase: leader?.tomoshigata
          ? walkBasePath(leader.tomoshigata, leader.sex, stageOf(ageOf(leader, data.seasonIndex)))
          : null,
        npcs,
        kin,
        reduceMotion: getReduceMotion(),
        visualV2: resolvedVisualV2,
        visualState: villageVisualState,
        facadeAssets: facadeAssets ?? DEFAULT_VILLAGE_FACADE_ASSETS,
        environmentAsset: environmentAsset ?? DEFAULT_VILLAGE_ENVIRONMENT_ASSET,
      },
      { onFocus: setFocus },
    )
    engineRef.current = engine
    void engine.init().then(() => engine.setSurvey(surveyingRef.current))
    return () => {
      engine.destroy()
      engineRef.current = null
    }
    // 郷マップは滞在中の家族構成変化がない(月不消費)ため初回マウントのみでよい
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openTalk = (id: string) => {
    const line = villagerLine(id, data)
    const v = VILLAGERS.find((x) => x.id === id)
    const flag = data.flags[`vilTalk_${id}`]
    if (latestGossip?.villagerId === id && !villageGossipWasHeard(flag, latestGossip.ordinal)) {
      setTalk({
        name: line.name,
        role: `${v?.role ?? '郷人'}・${latestGossip.entry.speaker}からの郷の声`,
        text: latestGossip.entry.text,
        imgUrl: villagerImg(id, band),
      })
      markVillagerTalked(id, markVillageGossipValue(flag, lineKey, latestGossip.ordinal))
    } else {
      setTalk({
        name: line.name,
        role: v?.role,
        text: line.text,
        imgUrl: villagerImg(id, band),
        action: id === 'tane' ? 'medicine' : undefined,
      })
      markVillagerTalked(id, markNormalTalkValue(flag, lineKey))
    }
    engineRef.current?.markNewsCleared(id) // 頭上の「話」印もその場で消す
  }

  const kinLine = (c: Character): string => {
    if (c.hp <= c.maxHp * 0.3) return '傷の手当てをしている。「……平気だ。次も連れて行ってくれ」'
    if (seasonsLeft(c, data.seasonIndex) <= 3) return '灯の残りを数えるような目で、静かに笑った。'
    if (c.fatigue >= 60) return '少し疲れた顔だ。「今月は、休みたい気もするな」'
    return `${personalityById(c.personalityId).label}らしい顔で頷いた。「行ってらっしゃい、気をつけて」`
  }

  const act = (f: VillageFocus | null) => {
    if (!f) return
    switch (f.kind) {
      case 'forge':
        setScreen({ id: 'forge' })
        return
      case 'pact':
        setScreen({ id: 'pact' })
        return
      case 'depart':
        setScreen({ id: 'depart' })
        return
      case 'talk-tane':
        openTalk('tane')
        return
      case 'npc':
        if (f.id) openTalk(f.id)
        return
      case 'kin': {
        const c = alive.find((x) => x.id === f.id)
        if (c) setTalk({ name: c.name, text: kinLine(c) })
        return
      }
      case 'lantern':
        setTalk({
          name: '大燈籠',
          text: `一族${data.family.length}人ぶんの灯が、今日も郷を照らしている。灯が続く限り、郷は常夜に呑まれない。`,
        })
        return
    }
  }

  // Enter/Space=近接対象へ、Escape=郷へ戻る(月不消費)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (medicineShopOpen) {
          setMedicineShopOpen(false)
          return
        }
        if (talk) {
          setTalk(null)
          return
        }
        setScreen({ id: 'home' })
        return
      }
      if (e.key === 'Enter' || e.key === ' ') {
        if (talk) {
          setTalk(null)
          e.preventDefault()
          return
        }
        const f = engineRef.current?.getFocused() ?? null
        if (f) {
          e.preventDefault()
          act(f)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talk, data, medicineShopOpen])

  // 会話中は移動操作を見せず、押下中だったD-pad入力も必ず解放する。
  useEffect(() => {
    if (!talk) return
    for (const dir of ['up', 'down', 'left', 'right'] as const) engineRef.current?.pressDir(dir, false)
    setPressedDirection(null)
  }, [talk])

  const go = (s: Screen) => setScreen(s)
  const medicineCount = (data.consumables ?? [])
    .filter((stack) => CONSUMABLES.some((item) => item.id === stack.id && item.effect.stat === 'hp'))
    .reduce((sum, stack) => sum + stack.count, 0)
  const setDirection = (dir: 'up' | 'down' | 'left' | 'right', pressed: boolean) => {
    engineRef.current?.pressDir(dir, pressed)
    setPressedDirection((current) => pressed ? dir : current === dir ? null : current)
  }
  const setSurvey = (pressed: boolean) => {
    surveyingRef.current = pressed
    engineRef.current?.setSurvey(pressed)
    setSurveying(pressed)
  }
  const dpad = (dir: 'up' | 'down' | 'left' | 'right', label: string) => (
    <button
      className="dpad-btn"
      aria-label={{ up: '上へ', down: '下へ', left: '左へ', right: '右へ' }[dir]}
      aria-pressed={pressedDirection === dir}
      onPointerDown={(e) => {
        e.preventDefault()
        setDirection(dir, true)
      }}
      onPointerUp={() => setDirection(dir, false)}
      onPointerLeave={() => setDirection(dir, false)}
      onPointerCancel={() => setDirection(dir, false)}
      onKeyDown={(event) => {
        if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
          event.preventDefault()
          event.stopPropagation()
          setDirection(dir, true)
        }
      }}
      onKeyUp={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.stopPropagation()
          setDirection(dir, false)
        }
      }}
      onBlur={() => setDirection(dir, false)}
    >
      {label}
    </button>
  )

  return (
    <div
      className="screen village-screen"
      data-village-visual={resolvedVisualV2 ? 'v2' : 'v1'}
      data-village-life-state={villageVisualState.lifeState}
      data-village-return-trace={villageVisualState.freshReturn?.kind ?? 'none'}
      data-village-return-id={villageVisualState.freshReturn?.id ?? 'none'}
    >
      <div className="village-head">
        <button className="btn btn-ghost" onClick={() => go({ id: 'home' })}>← 郷へ戻る</button>
        <h1 className="village-title">燈ノ郷 — 大燈籠のふもと</h1>
        <span className="village-note">郷の中は月を使わない</span>
      </div>

      {/* すぐ行く — 歩かずとも全施設へ即到達(常設・§5) */}
      <div className="village-quickbar" role="navigation" aria-label="すぐ行く">
        <span className="village-quicklabel">すぐ行く</span>
        <button className="btn btn-ghost filter-tab" onClick={() => go({ id: 'pact' })}>星契りの祠</button>
        <button className="btn btn-ghost filter-tab" onClick={() => go({ id: 'forge' })}>鍛冶と蔵</button>
        <button
          className="btn btn-ghost filter-tab village-medicine-entry"
          data-testid="village-medicine-entry"
          onClick={() => setMedicineShopOpen(true)}
        >
          薬種見世 <span aria-label={`回復薬の所持数${medicineCount}`}>所持 {medicineCount}</span>
        </button>
        <button className="btn btn-ghost filter-tab" onClick={() => openTalk('tane')}>豆腐屋</button>
        <button className="btn btn-ghost filter-tab" onClick={() => go({ id: 'depart' })}>出立門</button>
        <button className="btn btn-ghost filter-tab" onClick={() => go({ id: 'facilities' })}>郷普請</button>
      </div>

      <div className="village-stage">
        <div className="village-host" ref={hostRef} />

        <aside className="village-survey-guide" aria-label="郷の見取り案内">
          <p className="village-survey-kicker">灯路の見取り</p>
          <p className="village-survey-copy">中央の大燈籠から、暮らしと継承の五つの場所へ道が伸びている。</p>
          <div className="village-survey-places">
            <span><b>北西</b> 鍛冶と蔵</span>
            <span><b>北</b> 星契りの祠</span>
            <span><b>北東</b> 豆腐屋</span>
            <span><b>中央</b> 大燈籠</span>
            <span><b>南</b> 出立門</span>
          </div>
          <p className="village-survey-release">指を離すと、現在地へ戻る</p>
        </aside>

        {/* 近接対象 — 対象名と動詞を一つの大buttonへ統合し、誤タップ領域を増やさない。 */}
        {focus && !talk && (
          <button
            className="btn btn-main village-focus village-focus-act"
            data-zone="village-action"
            onClick={() => act(focus)}
            aria-label={`${focus.label} — ${focus.action}`}
          >
            <span className="village-focus-label">{focus.label}</span>
            <span className="village-focus-verb">{focus.action}</span>
          </button>
        )}

        {/* 会話 — 下部の帯(モーダルにせず歩行を止めない) */}
        {talk && (
          <div className="village-talk" role="status" aria-live="polite">
            {talk.imgUrl && <MaybeImg src={talk.imgUrl} className="village-talk-img" />}
            <div className="village-talk-body">
              <b className="village-talk-name">
                {talk.name}
                {talk.role && <span className="village-talk-role">({talk.role})</span>}
              </b>
              <p className="village-talk-text">{talk.text}</p>
            </div>
            <button className="btn btn-ghost" onClick={() => setTalk(null)}>閉じる</button>
            {talk.action === 'medicine' && (
              <button
                className="btn btn-main village-talk-action"
                onClick={() => { setTalk(null); setMedicineShopOpen(true) }}
              >薬種を見る</button>
            )}
          </div>
        )}

        {/* 見渡す — 押している間だけ全景(§6.2)。離すと主人公追従へ戻る。 */}
        <button
          className="village-survey"
          aria-label="郷を見渡す(押している間)"
          aria-pressed={surveying}
          onPointerDown={(e) => { e.preventDefault(); setSurvey(true) }}
          onPointerUp={() => setSurvey(false)}
          onPointerLeave={() => setSurvey(false)}
          onPointerCancel={() => setSurvey(false)}
          onKeyDown={(event) => {
            if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
              event.preventDefault()
              event.stopPropagation()
              setSurvey(true)
            }
          }}
          onKeyUp={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              event.stopPropagation()
              setSurvey(false)
            }
          }}
          onBlur={() => setSurvey(false)}
        >
          見渡す
        </button>

        {!talk && (
          <div className="dpad" data-zone="dpad">
            <div />
            {dpad('up', '▲')}
            <div />
            {dpad('left', '◀')}
            <div />
            {dpad('right', '▶')}
            <div />
            {dpad('down', '▼')}
            <div />
          </div>
        )}
      </div>

      <p className="village-hint">移動: WASD/矢印/タップ ・ 話す/入る: Enterか近接ボタン ・ 戻る: Esc</p>

      {medicineShopOpen && (
        <Sheet title="薬種見世" onClose={() => setMedicineShopOpen(false)}>
          <div className="village-medicine-shop" data-testid="village-medicine-shop">
            <div className="village-medicine-ledger">
              <div>
                <span>持てる奉燈</span>
                <strong>{data.hoto}</strong>
              </div>
              <p>郷にいる間は月を使わず補充できる。買った薬は戦の「道具」に入り、使うと一つ減る。</p>
            </div>
            <div className="village-medicine-grid">
              {CONSUMABLES.map((item) => {
                const owned = (data.consumables ?? []).find((stack) => stack.id === item.id)?.count ?? 0
                const locked = item.unlockFame !== undefined && data.fame < item.unlockFame
                const affordable = data.hoto >= item.price
                const effect = `${item.effect.scope === 'party' ? '一族全員の' : '一人の'}${item.effect.stat === 'hp' ? '傷' : '灯力'}を${item.effect.amount}回復`
                return (
                  <article key={item.id} className={`village-medicine-card ${locked ? 'is-locked' : ''}`}>
                    <span className="village-medicine-icon" aria-hidden>{item.icon}</span>
                    <div className="village-medicine-copy">
                      <div className="village-medicine-name">
                        <strong>{item.name}</strong>
                        <span>所持 {owned}</span>
                      </div>
                      <p className="village-medicine-effect">{effect}</p>
                      <p className="village-medicine-desc">{item.desc}</p>
                    </div>
                    <button
                      className="btn btn-main village-medicine-buy"
                      disabled={locked || !affordable}
                      onClick={() => {
                        buyConsumable(item.id)
                        emitToast(`${item.name}を購うた — 所持${owned + 1}`, 'info')
                      }}
                    >
                      {locked ? `武功${item.unlockFame}で解禁` : !affordable ? `奉燈が${item.price - data.hoto}不足` : `${item.price} 奉燈で購う`}
                    </button>
                  </article>
                )
              })}
            </div>
            <p className="village-medicine-footnote">探索中は買い足せない。出立前に傷薬と灯明油の数を確かめよ。</p>
          </div>
        </Sheet>
      )}
    </div>
  )
}
