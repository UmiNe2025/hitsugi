// M18 P3: 鍛冶と蔵 — 独立作業画面(UI_UX_REDESIGN_PLAN §5.5)
// 購う/装備/打ち直し/鍛錬の4タブ。選択人物は画面上部に固定し、タブを跨いで保持する(§6.3)。
// 契約: docs/UI_SHELL_API.md(SFX=.btn系クラス/文言/12.5px下限/大量一覧は50件刻み)。
import { useMemo, useState } from 'react'
import { useGame } from '../core/store'
import type { GameData, Item, ItemSlot, StatKey } from '../core/types'
import { STAT_LABELS } from '../core/types'
import { ITEM_BASES, reforgeCost, REFORGE_MAX } from '../core/data/items'
import { isAdult } from '../core/inheritance'
import { MaybeImg, NightBackdrop, Panel } from './components'
import { itemIcon } from './img'
import { ScreenShell, WorkspaceTabs, Sheet, CompareRow, EmptyGuide } from './layout/shell'
import { emitToast } from './toast'
import './forge_m18.css'

type Tab = 'buy' | 'equip' | 'reforge' | 'train'
type SlotFilter = 'all' | 'weapon' | 'armor' | 'charm'
const SLOT_LABEL: Record<string, string> = { weapon: '武具', armor: '防具', charm: '御守' }
const PAGE = 50 // 大量一覧は50件刻み(§7契約)

// 装備差分: 同スロットの現装備と比べた攻/防の増減
function diffAgainst(ch: { equipment: Partial<Record<ItemSlot, Item>> } | undefined, it: { slot: ItemSlot; atk?: number; def?: number }) {
  const cur = ch?.equipment[it.slot]
  const dAtk = (it.atk ?? 0) - (cur?.atk ?? 0)
  const dDef = (it.def ?? 0) - (cur?.def ?? 0)
  return { dAtk, dDef, total: dAtk + dDef }
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
  const [reforgeTarget, setReforgeTarget] = useState<{ it: Item; where: string } | null>(null)

  const alive = data.family.filter((c) => c.alive)
  const selChar = alive.find((c) => c.id === charId) ?? alive.find((c) => c.isHead) ?? alive[0]

  const shopTier = data.regionsCleared.length
  const stock = useMemo(
    () => ITEM_BASES.filter((b) => b.shopTier <= shopTier && (slotF === 'all' || b.slot === slotF)),
    [shopTier, slotF],
  )

  const SLOT_ORDER: Record<string, number> = { weapon: 0, armor: 1, charm: 2 }
  const inv = useMemo(() => {
    const filtered = data.inventory.filter((it) => slotF === 'all' || it.slot === slotF)
    return [...filtered].sort((a, b) => {
      if (invSort === 'atk') return (b.atk ?? 0) - (a.atk ?? 0)
      if (invSort === 'def') return (b.def ?? 0) - (a.def ?? 0)
      if (invSort === 'gen') return b.generation - a.generation
      return (SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot]) || (b.atk ?? 0) - (a.atk ?? 0)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.inventory, invSort, slotF])

  // 打ち直し対象: 蔵の品+全員の装備
  const forgeables = useMemo(() => [
    ...data.inventory.map((it) => ({ it, where: '蔵' })),
    ...alive.flatMap((c) =>
      (['weapon', 'armor', 'charm'] as const)
        .map((s) => c.equipment[s])
        .filter((x): x is NonNullable<typeof x> => !!x)
        .map((it) => ({ it, where: c.name })),
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [data.inventory, data.family])

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

      {/* スロット絞り込み(購う/装備) */}
      {(tab === 'buy' || tab === 'equip') && (
        <div className="forge-filter-row">
          {(['all', 'weapon', 'armor', 'charm'] as SlotFilter[]).map((s) => (
            <button key={s} className={`btn btn-ghost filter-tab ${slotF === s ? 'active' : ''}`} onClick={() => { setSlotF(s); setShown(PAGE) }}>
              {s === 'all' ? '全て' : SLOT_LABEL[s]}
            </button>
          ))}
          {tab === 'equip' && (
            <>
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
            {stock.slice(0, shown).map((b) => {
              const d = selChar ? diffAgainst(selChar, b) : null
              return (
                <button key={b.baseId} className="btn item-cell" disabled={data.hoto < b.price} onClick={() => doBuy(b.baseId)}>
                  <MaybeImg src={itemIcon(b.baseId)} className="it-ico" />
                  <span className="item-name">
                    {b.name}
                    {d && d.total > 0 && <span className="item-reco">薦</span>}
                  </span>
                  <span className="item-stat">{b.atk ? `攻${b.atk}` : ''}{b.def ? ` 防${b.def}` : ''}</span>
                  <span className="item-price">{b.price}燈</span>
                </button>
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
                  <span className="equip-slot-name">{SLOT_LABEL[s]}</span>
                  <span className="equip-slot-item">{cur ? `${cur.name}${cur.atk ? ` 攻${cur.atk}` : ''}${cur.def ? ` 防${cur.def}` : ''}` : '— なし'}</span>
                </div>
              )
            })}
          </Panel>
          <Panel title={`蔵の品 — ${inv.length}品`} className="equip-list">
            {inv.length === 0 && <EmptyGuide text="蔵は空だ。見世で購うか、夜藪から持ち帰れ。" actionLabel="購うへ" onAction={() => changeTab('buy')} />}
            <div className="item-grid">
              {inv.slice(0, shown).map((it) => {
                const d = diffAgainst(selChar, it)
                return (
                  <button key={it.id} className="btn item-cell" onClick={() => doEquip(it)}>
                    <MaybeImg src={itemIcon(it.baseId)} className="it-ico" />
                    <span className="item-name">
                      {it.name}
                      {d.total > 0 && <span className="item-reco">薦</span>}
                    </span>
                    <span className="item-stat">
                      {d.dAtk !== 0 && <em className={d.dAtk > 0 ? 'up' : 'down'}>攻{d.dAtk > 0 ? '+' : ''}{d.dAtk}</em>}
                      {d.dDef !== 0 && <em className={d.dDef > 0 ? 'up' : 'down'}> 防{d.dDef > 0 ? '+' : ''}{d.dDef}</em>}
                      {d.dAtk === 0 && d.dDef === 0 && '同等'}
                    </span>
                    {it.legacyOf && <span className="item-legacy">{it.legacyOf}の形見</span>}
                  </button>
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
                  <span className="item-name">{it.name}<span className="item-where">({where})</span></span>
                  <span className="item-stat">{it.atk ? `攻${it.atk}` : ''}{it.def ? ` 防${it.def}` : ''} 第{it.generation}代</span>
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
                onClick={() => trainStat(selChar.id, k)}
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
    </ScreenShell>
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
  const nextAtk = it.atk ? Math.round(it.atk * 1.12) : 0
  const nextDef = it.def ? Math.round(it.def * 1.12) : 0
  return (
    <Sheet title={`打ち直し — ${it.name}`} onClose={onClose} closeLabel="やめる">
      <p className="confirm-lead">{where}にある{it.name}(第{it.generation}代)へ槌を入れ、第{it.generation + 1}代へ深める。</p>
      {it.atk ? <CompareRow label="攻" before={it.atk} after={nextAtk} /> : null}
      {it.def ? <CompareRow label="防" before={it.def} after={nextDef} /> : null}
      <CompareRow label="奉燈" before={data.hoto} after={data.hoto - cost.hoto} />
      <CompareRow label="血珠" before={data.ketsu} after={data.ketsu - cost.ketsu} />
      <div className="confirm-actions">
        <button className="btn btn-ghost" onClick={onClose}>やめる</button>
        <button className="btn btn-main" onClick={onDo}>打ち直す</button>
      </div>
    </Sheet>
  )
}
