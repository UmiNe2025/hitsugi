// 郷普請(v3.1 M16-6 → M18 P3) — 独立画面版。奉燈を注ぎ、代を跨いで効く4つの施設を建てる/普請する。
// 参考実装: Home.tsx 内 FacilitiesModal(内容を ScreenShell 上に載せ替え・カードグリッド化)。
// 契約: docs/UI_SHELL_API.md。store/core の変更はしない(表示専用の純関数のみ追加)。
import { useMemo } from 'react'
import { useGame } from '../core/store'
import { FACILITIES, FACILITY_MAX_LV, facilityCost, facilityLevel } from '../core/data/facilities'
import { ScreenShell, StatusCallout } from './layout/shell'
import './facilities.css'

type FacilityState = 'buildable' | 'insufficient' | 'maxed'

interface FacilityView {
  id: string
  name: string
  desc: string
  effects: string[]
  lv: number
  maxed: boolean
  cost: number
  nextEffect: string | null // 未達Lvの先頭(=次に普請すると得る効果)
  shortfall: number // 費用に対する奉燈の不足分(0以下なら足りている)
  state: FacilityState
}

// 表示専用の集計 — store/coreの値は読むだけ、書き換えない
function buildFacilityViews(hoto: number, facilities: Record<string, number> | undefined): FacilityView[] {
  return FACILITIES.map((f) => {
    const lv = facilityLevel(facilities, f.id)
    const maxed = lv >= FACILITY_MAX_LV
    const cost = maxed ? 0 : facilityCost(f.id, lv)
    const shortfall = maxed ? 0 : Math.max(0, cost - hoto)
    return {
      id: f.id,
      name: f.name,
      desc: f.desc,
      effects: f.effects,
      lv,
      maxed,
      cost,
      nextEffect: maxed ? null : f.effects[lv],
      shortfall,
      state: maxed ? 'maxed' : shortfall > 0 ? 'insufficient' : 'buildable',
    }
  })
}

function buildLabel(v: FacilityView): string {
  if (v.maxed) return '普請済み(最大)'
  return v.lv === 0 ? `建てる — ${v.cost}燈` : `Lv${v.lv + 1}へ普請 — ${v.cost}燈`
}

export function FacilitiesScreen() {
  const data = useGame((s) => s.data)!
  const buildFacility = useGame((s) => s.buildFacility)

  const views = useMemo(
    () => buildFacilityViews(data.hoto, data.facilities),
    [data.hoto, data.facilities],
  )

  // 次のおすすめ = 未完成のうち費用最安の1件(自動実行はしない・提示のみ)
  const recommended = useMemo(() => {
    const open = views.filter((v) => !v.maxed)
    return open.reduce<FacilityView | null>((min, v) => (min === null || v.cost < min.cost ? v : min), null)
  }, [views])

  return (
    <ScreenShell
      title="郷普請"
      onBack={() => useGame.getState().setScreen({ id: 'home' })}
      resources={<>奉燈 <b>{data.hoto}</b></>}
    >
      {recommended && (
        <StatusCallout kind="info" title={`次のおすすめ — ${recommended.name}(${recommended.cost}燈)`}>
          {recommended.nextEffect}
        </StatusCallout>
      )}
      <div className="facility-grid">
        {views.map((v) => (
          <div key={v.id} className={`facility-card facility-card--${v.state}`}>
            <div className="facility-card-head">
              <span className="facility-name">{v.name}</span>
              <span className="facility-lv">Lv{v.lv}/{FACILITY_MAX_LV}</span>
            </div>
            <p className="facility-desc">{v.desc}</p>
            {v.nextEffect && <p className="facility-next">次Lv: {v.nextEffect}</p>}
            <ul className="facility-effects">
              {v.effects.map((e, i) => (
                <li key={i} className={i < v.lv ? 'is-achieved' : 'is-pending'}>
                  Lv{i + 1}: {e}
                </li>
              ))}
            </ul>
            <div className="facility-foot">
              {v.state === 'insufficient' && (
                <p className="facility-shortfall">奉燈があと{v.shortfall}足りない</p>
              )}
              {v.state === 'maxed' && <p className="facility-maxed-note">普請済み(最大)</p>}
              <button
                className="btn facility-build-btn"
                disabled={v.maxed || v.shortfall > 0}
                onClick={() => buildFacility(v.id)}
              >
                {buildLabel(v)}
              </button>
            </div>
          </div>
        ))}
      </div>
    </ScreenShell>
  )
}
