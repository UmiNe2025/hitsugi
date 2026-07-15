// M18 P3: 鍛冶と蔵 — 独立作業画面(UI_UX_REDESIGN_PLAN §5.5)
// 購う/装備/打ち直し/鍛錬の4タブ。選択人物は画面上部に固定し、タブを跨いで保持する(§6.3)。
// 契約: docs/UI_SHELL_API.md(SFX=.btn系クラス/文言/12.5px下限/大量一覧は50件刻み)。
import { Fragment, useMemo, useState } from 'react'
import { useGame } from '../core/store'
import type { GameData, Item, ItemSlot, StatKey, Stats } from '../core/types'
import { STAT_LABELS } from '../core/types'
import { ITEM_BASES, previewReforge, reforgeCost, REFORGE_MAX } from '../core/data/items'
import {
  diffItems, qualityOf, rarityOf, sourceLabelOf,
  RARITY_LABELS, SLOT_MARKS, type ItemDiff, type RarityKey,
} from '../core/item_axes'
import { isAdult } from '../core/inheritance'
import { MaybeImg, NightBackdrop, Panel } from './components'
import { itemIcon } from './img'
import { ScreenShell, WorkspaceTabs, Sheet, CompareRow, EmptyGuide } from './layout/shell'
import { emitToast } from './toast'
import './forge_m18.css'
import './forge_m26.css' // M26 §7.4: 血潮鍛錬の回数ステッパー(forge_m18.cssより後 — 後勝ち)

type Tab = 'buy' | 'equip' | 'reforge' | 'train'
type SlotFilter = 'all' | 'weapon' | 'armor' | 'charm'
const SLOT_LABEL: Record<string, string> = { weapon: '武具', armor: '防具', charm: '御守' }
const SLOT_ORDER: Record<string, number> = { weapon: 0, armor: 1, charm: 2 }
const PAGE = 50 // 大量一覧は50件刻み(§7契約)

// 装備差分(M22): 同スロットの現装備と比べ、攻/防+六能力を軸別に返す(core/item_axes)
function diffAgainst(
  ch: { equipment: Partial<Record<ItemSlot, Item>> } | undefined,
  it: { slot: ItemSlot; atk?: number; def?: number; statBonus?: Partial<Stats> },
) {
  return diffItems(ch?.equipment[it.slot], it)
}

// 差分の軸別表示 — スカラー合算で「同等」と誤らせない(M22 §2.2)
function DiffText({ d }: { d: ItemDiff }) {
  return (
    <span className="item-stat">
      {d.dAtk !== 0 && <em className={d.dAtk > 0 ? 'up' : 'down'}>攻{d.dAtk > 0 ? '+' : ''}{d.dAtk}</em>}
      {d.dDef !== 0 && <em className={d.dDef > 0 ? 'up' : 'down'}> 防{d.dDef > 0 ? '+' : ''}{d.dDef}</em>}
      {(Object.entries(d.dStats) as [StatKey, number][]).map(([k, v]) => (
        <em key={k} className={v > 0 ? 'up' : 'down'}> {STAT_LABELS[k]}{v > 0 ? '+' : ''}{v}</em>
      ))}
      {d.same && '同等'}
    </span>
  )
}

// 品質(基礎の格)+希少度(来歴)のチップ — 色+枠+文字で示す(M22 §2.2)
function AxisChips({ baseId, it }: { baseId: string; it?: Pick<Item, 'source' | 'generation' | 'legacyOf'> }) {
  const q = qualityOf(baseId)
  const r = it ? rarityOf(it) : null
  return (
    <span className="item-axes">
      {q && <span className={`q-chip ${q.key}`}>{q.name}</span>}
      {r && r.key !== 'common' && <span className={`r-chip r-${r.key}`}>◆{r.name}</span>}
    </span>
  )
}

// 基礎の能力表記(攻/防+六能力)
function baseStatText(b: { atk?: number; def?: number; statBonus?: Partial<Stats> }): string {
  const parts: string[] = []
  if (b.atk) parts.push(`攻${b.atk}`)
  if (b.def) parts.push(`防${b.def}`)
  if (b.statBonus) {
    for (const [k, v] of Object.entries(b.statBonus) as [StatKey, number][]) parts.push(`${STAT_LABELS[k]}+${v}`)
  }
  return parts.join(' ')
}

export function ForgeScreen() {
  const data = useGame((s) => s.data)!
  const setScreen = useGame((s) => s.setScreen)
  const buyItem = useGame((s) => s.buyItem)
  const equipItem = useGame((s) => s.equipItem)
  const trainStat = useGame((s) => s.trainStat)
  const forgeUpgrade = useGame((s) => s.forgeUpgrade)

  const [tab, setTab] = useState<Tab>('buy')
  const [charId, setCharId] = useState<string | null>(null)
  const [slotF, setSlotF] = useState<SlotFilter>('all')
  const [invSort, setInvSort] = useState<'slot' | 'atk' | 'def' | 'gen'>('slot')
  const [shown, setShown] = useState(PAGE)
  const [search, setSearch] = useState('') // 名前検索(M22 §2.2)
  const [rarF, setRarF] = useState<'all' | RarityKey>('all') // 希少度絞り込み(装備タブ)
  const [affordOnly, setAffordOnly] = useState(false) // 今買える物のみ(購うタブ)
  const [reforgeTarget, setReforgeTarget] = useState<{ it: Item; where: string } | null>(null)
  const [trainTarget, setTrainTarget] = useState<StatKey | null>(null) // M26 §7.4: 鍛錬の確認対象(即消費を廃止)

  const alive = data.family.filter((c) => c.alive)
  const selChar = alive.find((c) => c.id === charId) ?? alive.find((c) => c.isHead) ?? alive[0]

  const shopTier = data.regionsCleared.length
  const stock = useMemo(() => {
    let list = ITEM_BASES.filter((b) => b.shopTier <= shopTier && (slotF === 'all' || b.slot === slotF))
    if (search) list = list.filter((b) => b.name.includes(search))
    if (affordOnly) list = list.filter((b) => b.price <= data.hoto)
    // 初期状態(全て)はカテゴリ別に並べる(M22 §2.2)
    if (slotF === 'all') list = [...list].sort((a, b) => (SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot]) || a.shopTier - b.shopTier)
    return list
  }, [shopTier, slotF, search, affordOnly, data.hoto])

  const inv = useMemo(() => {
    let filtered = data.inventory.filter((it) => slotF === 'all' || it.slot === slotF)
    if (search) filtered = filtered.filter((it) => it.name.includes(search))
    if (rarF !== 'all') filtered = filtered.filter((it) => rarityOf(it).key === rarF)
    return [...filtered].sort((a, b) => {
      if (invSort === 'atk') return (b.atk ?? 0) - (a.atk ?? 0)
      if (invSort === 'def') return (b.def ?? 0) - (a.def ?? 0)
      if (invSort === 'gen') return b.generation - a.generation
      return (SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot]) || (b.atk ?? 0) - (a.atk ?? 0)
    })
  }, [data.inventory, invSort, slotF, search, rarF])

  // 打ち直し対象: 蔵の品+全員の装備
  const forgeables = useMemo(() => {
    const all = [
      ...data.inventory.map((it) => ({ it, where: '蔵' })),
      ...alive.flatMap((c) =>
        (['weapon', 'armor', 'charm'] as const)
          .map((s) => c.equipment[s])
          .filter((x): x is NonNullable<typeof x> => !!x)
          .map((it) => ({ it, where: c.name })),
      ),
    ]
    return search ? all.filter((f) => f.it.name.includes(search)) : all
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.inventory, data.family, search])

  const TABS: { key: Tab; label: string }[] = [
    { key: 'buy', label: '購う' },
    { key: 'equip', label: '装備' },
    { key: 'reforge', label: '打ち直し' },
    { key: 'train', label: '鍛錬' },
  ]
  const changeTab = (t: Tab) => { setTab(t); setShown(PAGE) }

  const doBuy = (baseId: string) => {
    const base = ITEM_BASES.find((b) => b.baseId === baseId)
    if (!base || data.hoto < base.price) return
    buyItem(baseId)
    emitToast(`${base.name}を購うた — 残り奉燈${data.hoto - base.price}`, 'info')
  }

  const doEquip = (it: Item) => {
    if (!selChar) return
    equipItem(selChar.id, it.id)
    emitToast(`${selChar.name}に${it.name}を授けた`, 'info')
  }

  const needsChar = tab === 'equip' || tab === 'train'

  return (
    <ScreenShell
      title="鍛冶と蔵"
      onBack={() => setScreen({ id: 'home' })}
      resources={<>奉燈 <b>{data.hoto}</b> ／ 血珠 <b>{data.ketsu}</b></>}
      tabs={<WorkspaceTabs tabs={TABS} active={tab} onChange={changeTab} />}
      activeTab={tab}
    >
      <NightBackdrop />

      {/* 選択人物の固定表示(装備/鍛錬タブ) */}
      {needsChar && (
        <div className="forge-char-rail">
          {alive.length === 0 ? (
            <EmptyGuide text="いま生きている者はいない。" actionLabel="郷へ戻る" onAction={() => setScreen({ id: 'home' })} />
          ) : (
            alive.map((c) => (
              <button
                key={c.id}
                className={`btn forge-char ${selChar?.id === c.id ? 'is-sel' : ''}`}
                onClick={() => setCharId(c.id)}
              >
                {c.isHead && <span className="forge-char-head">当主</span>}
                {c.name}
                {!isAdult(c, data.seasonIndex) && <span className="forge-char-note">幼子</span>}
              </button>
            ))
          )}
        </div>
      )}

      {/* 絞り込み(購う/装備/打ち直し): 検索+部位+希少度+買える物のみ(M22 §2.2) */}
      {tab !== 'train' && (
        <div className="forge-filter-row">
          <input
            className="forge-search"
            type="search"
            placeholder="名で捜す"
            aria-label="装備を名前で捜す"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShown(PAGE) }}
          />
          {(tab === 'buy' || tab === 'equip') &&
            (['all', 'weapon', 'armor', 'charm'] as SlotFilter[]).map((s) => (
              <button key={s} className={`btn btn-ghost filter-tab ${slotF === s ? 'active' : ''}`} onClick={() => { setSlotF(s); setShown(PAGE) }}>
                {s === 'all' ? '全て' : SLOT_LABEL[s]}
              </button>
            ))}
          {tab === 'buy' && (
            <button
              className={`btn btn-ghost filter-tab ${affordOnly ? 'active' : ''}`}
              aria-pressed={affordOnly}
              onClick={() => { setAffordOnly((v) => !v); setShown(PAGE) }}
            >
              買える物のみ
            </button>
          )}
          {tab === 'equip' && (
            <>
              <span className="forge-sort-lbl">希少</span>
              {(['all', 'common', 'uncommon', 'rare', 'epic', 'legendary'] as const).map((r) => (
                <button
                  key={r}
                  className={`btn btn-ghost filter-tab ${rarF === r ? 'active' : ''}`}
                  onClick={() => { setRarF(r); setShown(PAGE) }}
                >
                  {r === 'all' ? '全' : RARITY_LABELS[r]}
                </button>
              ))}
              <span className="forge-sort-lbl">並べ替え</span>
              {([['slot', '種別'], ['atk', '攻'], ['def', '防'], ['gen', '継承']] as const).map(([key, label]) => (
                <button key={key} className={`btn btn-ghost inv-sort-btn ${invSort === key ? 'active' : ''}`} onClick={() => setInvSort(key)}>
                  {label}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {tab === 'buy' && (
        <Panel title={`購う(あがなう) — ${stock.length}品`}>
          {stock.length === 0 && <EmptyGuide text="この見世にはまだ何も並んでいない。地の主を鎮めるほど品が増える。" actionLabel="出立へ" onAction={() => setScreen({ id: 'depart' })} />}
          <div className="item-grid">
            {stock.slice(0, shown).map((b, i, arr) => {
              const d = selChar ? diffAgainst(selChar, b) : null
              const lack = data.hoto < b.price
              return (
                <Fragment key={b.baseId}>
                  {slotF === 'all' && (i === 0 || arr[i - 1].slot !== b.slot) && (
                    <h3 className="item-group-head">{SLOT_LABEL[b.slot]}</h3>
                  )}
                  <button className="btn item-cell" disabled={lack} onClick={() => doBuy(b.baseId)}>
                    <MaybeImg src={itemIcon(b.baseId)} className="it-ico" />
                    <span className="item-name">
                      <span className={`slot-mark slot-${b.slot}`}>{SLOT_MARKS[b.slot]}</span>
                      {b.name}
                      {d && d.strictlyBetter && <span className="item-reco">薦</span>}
                    </span>
                    <AxisChips baseId={b.baseId} />
                    <span className="item-stat">{baseStatText(b)}</span>
                    <span className="item-price">
                      {b.price}燈
                      {lack && <span className="item-lack">奉燈不足</span>}
                    </span>
                  </button>
                </Fragment>
              )
            })}
          </div>
          {stock.length > shown && (
            <button className="btn btn-ghost forge-more" onClick={() => setShown(shown + PAGE)}>
              さらに表示({stock.length - shown}品)
            </button>
          )}
        </Panel>
      )}

      {tab === 'equip' && selChar && (
        <div className="equip-cols">
          <Panel title={`${selChar.name}の装い`} className="equip-now">
            {(['weapon', 'armor', 'charm'] as const).map((s) => {
              const cur = selChar.equipment[s]
              return (
                <div key={s} className="equip-slot-row">
                  <span className="equip-slot-name">
                    <span className={`slot-mark slot-${s}`}>{SLOT_MARKS[s]}</span>
                    {SLOT_LABEL[s]}
                  </span>
                  <span className="equip-slot-item">
                    {cur ? (
                      <>
                        {cur.name} {baseStatText(cur)}
                        <AxisChips baseId={cur.baseId} it={cur} />
                      </>
                    ) : (
                      '— なし'
                    )}
                  </span>
                </div>
              )
            })}
          </Panel>
          <Panel title={`蔵の品 — ${inv.length}品`} className="equip-list">
            {inv.length === 0 && <EmptyGuide text="蔵は空だ。見世で購うか、夜藪から持ち帰れ。" actionLabel="購うへ" onAction={() => changeTab('buy')} />}
            <div className="item-grid">
              {inv.slice(0, shown).map((it, i, arr) => {
                const d = diffAgainst(selChar, it)
                return (
                  <Fragment key={it.id}>
                    {slotF === 'all' && invSort === 'slot' && (i === 0 || arr[i - 1].slot !== it.slot) && (
                      <h3 className="item-group-head">{SLOT_LABEL[it.slot]}</h3>
                    )}
                    <button className="btn item-cell" onClick={() => doEquip(it)}>
                      <MaybeImg src={itemIcon(it.baseId)} className="it-ico" />
                      <span className="item-name">
                        <span className={`slot-mark slot-${it.slot}`}>{SLOT_MARKS[it.slot]}</span>
                        {it.name}
                        {d.strictlyBetter && <span className="item-reco">薦</span>}
                      </span>
                      <AxisChips baseId={it.baseId} it={it} />
                      <DiffText d={d} />
                      <span className="item-origin">
                        {sourceLabelOf(it)}
                        {it.generation > 0 && ` ・ 継${it.generation}代`}
                      </span>
                      {it.legacyOf && <span className="item-legacy">{it.legacyOf}の形見</span>}
                    </button>
                  </Fragment>
                )
              })}
            </div>
            {inv.length > shown && (
              <button className="btn btn-ghost forge-more" onClick={() => setShown(shown + PAGE)}>
                さらに表示({inv.length - shown}品)
              </button>
            )}
          </Panel>
        </div>
      )}

      {tab === 'reforge' && (
        <Panel title="打ち直し — 槌を入れ、代を深める">
          <p className="forge-note">
            打つほど強く(1代ごと基礎+12%)。遺品は銘を保ったまま深まる。上限{REFORGE_MAX}代。
          </p>
          {forgeables.length === 0 && <EmptyGuide text="打てる品がない。" actionLabel="購うへ" onAction={() => changeTab('buy')} />}
          <div className="item-grid">
            {forgeables.slice(0, shown).map(({ it, where }) => {
              const cost = reforgeCost(it)
              const maxed = it.generation >= REFORGE_MAX
              return (
                <button
                  key={it.id}
                  className="btn item-cell"
                  disabled={maxed || data.hoto < cost.hoto || data.ketsu < cost.ketsu}
                  onClick={() => setReforgeTarget({ it, where })}
                >
                  <MaybeImg src={itemIcon(it.baseId)} className="it-ico" />
                  <span className="item-name">
                    <span className={`slot-mark slot-${it.slot}`}>{SLOT_MARKS[it.slot]}</span>
                    {it.name}<span className="item-where">({where})</span>
                  </span>
                  <AxisChips baseId={it.baseId} it={it} />
                  <span className="item-stat">{baseStatText(it)} 第{it.generation}代</span>
                  <span className="item-price">{maxed ? '打ち止め' : `${cost.hoto}燈+珠${cost.ketsu}`}</span>
                </button>
              )
            })}
          </div>
          {forgeables.length > shown && (
            <button className="btn btn-ghost forge-more" onClick={() => setShown(shown + PAGE)}>
              さらに表示({forgeables.length - shown}品)
            </button>
          )}
        </Panel>
      )}

      {tab === 'train' && selChar && (
        <Panel title={`鍛錬 — ${selChar.name}の血潮を磨く`}>
          <p className="forge-note">血珠5で望む血潮を+3。磨いた血潮は子へも受け継がれる。持てる血珠: {data.ketsu}</p>
          <div className="train-grid">
            {(Object.keys(STAT_LABELS) as StatKey[]).map((k) => (
              <button
                key={k}
                className="btn train-cell"
                disabled={data.ketsu < 5 || selChar.potential[k] >= 120}
                onClick={() => setTrainTarget(k)}
              >
                <span className="train-stat">{STAT_LABELS[k]}</span>
                <span className="train-val">{selChar.potential[k]} → {Math.min(120, selChar.potential[k] + 3)}</span>
                <span className="item-price">{selChar.potential[k] >= 120 ? '極み' : '珠5'}</span>
              </button>
            ))}
          </div>
        </Panel>
      )}

      {/* 打ち直し確認 — 高額操作は差分と費用を見てから(§2.4) */}
      {reforgeTarget && (
        <ReforgeConfirm
          target={reforgeTarget}
          data={data}
          onClose={() => setReforgeTarget(null)}
          onDo={() => {
            forgeUpgrade(reforgeTarget.it.id)
            emitToast(`${reforgeTarget.it.name}を打ち直した — 第${reforgeTarget.it.generation + 1}代`, 'info')
            setReforgeTarget(null)
          }}
        />
      )}

      {/* 血潮鍛錬確認 — 回数ステッパーで一括確定(§7.4「連打消費を廃止」)。閲覧だけで血珠は減らない */}
      {trainTarget && selChar && (
        <TrainConfirm
          char={selChar}
          statKey={trainTarget}
          data={data}
          onClose={() => setTrainTarget(null)}
          onDo={(n) => {
            const before = selChar.potential[trainTarget]
            for (let i = 0; i < n; i++) trainStat(selChar.id, trainTarget)
            emitToast(`${selChar.name}の${STAT_LABELS[trainTarget]}を鍛えた(${before}→${Math.min(120, before + n * 3)})`, 'info')
            setTrainTarget(null)
          }}
        />
      )}
    </ScreenShell>
  )
}

// M26 §7.4: 血潮鍛錬の確認Sheet。回数(1〜上限)を選び総血珠を見てから一括確定する。
// 上限 = min(買える回数 floor(血珠/5), 極みまでの回数 ceil((120-現在)/3))。
function TrainConfirm({ char, statKey, data, onClose, onDo }: {
  char: GameData['family'][number]
  statKey: StatKey
  data: GameData
  onClose: () => void
  onDo: (n: number) => void
}) {
  const start = char.potential[statKey]
  const maxN = Math.max(1, Math.min(Math.floor(data.ketsu / 5), Math.ceil((120 - start) / 3)))
  const [n, setN] = useState(1)
  const nn = Math.max(1, Math.min(maxN, n))
  const end = Math.min(120, start + nn * 3)
  const cost = nn * 5
  return (
    <Sheet title={`血潮鍛錬 — ${char.name}の${STAT_LABELS[statKey]}`} onClose={onClose} closeLabel="やめる">
      <p className="confirm-lead">
        血珠5で{STAT_LABELS[statKey]}を+3。回数を選んで一括で鍛える。磨いた血潮は子へも受け継がれる。
      </p>
      <div className="train-stepper" role="group" aria-label="鍛錬回数">
        <button className="btn btn-ghost" aria-label="回数を減らす" disabled={nn <= 1} onClick={() => setN(nn - 1)}>−</button>
        <span className="train-count"><b>{nn}</b> 回</span>
        <button className="btn btn-ghost" aria-label="回数を増やす" disabled={nn >= maxN} onClick={() => setN(nn + 1)}>＋</button>
        <button className="btn btn-ghost" disabled={nn >= maxN} onClick={() => setN(maxN)}>最大({maxN})</button>
      </div>
      <CompareRow label={STAT_LABELS[statKey]} before={start} after={end} />
      <CompareRow label="血珠" before={data.ketsu} after={data.ketsu - cost} />
      <div className="confirm-actions">
        <button className="btn btn-ghost" onClick={onClose}>やめる</button>
        <button className="btn btn-main" onClick={() => onDo(nn)}>珠{cost}で鍛える</button>
      </div>
    </Sheet>
  )
}

function ReforgeConfirm({ target, data, onClose, onDo }: {
  target: { it: Item; where: string }
  data: GameData
  onClose: () => void
  onDo: () => void
}) {
  const { it, where } = target
  const cost = reforgeCost(it)
  // 見込み値は実処理(applyGeneration)と同じ式から引く — 確認画面と結果をズレさせない
  const next = previewReforge(it)
  return (
    <Sheet title={`打ち直し — ${it.name}`} onClose={onClose} closeLabel="やめる">
      <p className="confirm-lead">{where}にある{it.name}(第{it.generation}代)へ槌を入れ、第{it.generation + 1}代へ深める。</p>
      {it.atk ? <CompareRow label="攻" before={it.atk} after={next.atk ?? it.atk} /> : null}
      {it.def ? <CompareRow label="防" before={it.def} after={next.def ?? it.def} /> : null}
      {it.statBonus &&
        (Object.entries(it.statBonus) as [StatKey, number][]).map(([k, v]) => (
          <CompareRow key={k} label={STAT_LABELS[k]} before={v} after={next.statBonus?.[k] ?? v} />
        ))}
      <CompareRow label="奉燈" before={data.hoto} after={data.hoto - cost.hoto} />
      <CompareRow label="血珠" before={data.ketsu} after={data.ketsu - cost.ketsu} />
      <div className="confirm-actions">
        <button className="btn btn-ghost" onClick={onClose}>やめる</button>
        <button className="btn btn-main" onClick={onDo}>打ち直す</button>
      </div>
    </Sheet>
  )
}
