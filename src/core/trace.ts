// M23(指示7 V3): 痕跡→ボス開示の単一情報源。
// 痕跡=既存の石碑(monument/loreFrags)を「土地の観察度」として読み取り専用で流用する(ADR: devil反映②)。
// 書き込みはstoreのmonument既存経路のみ — 本モジュールは読むだけで、バランス数値には一切触れない。
// ゲートは固定値(1/2/3)でなく地域の石碑総数でクランプする(7/27地域が石碑<3 — devil反映①)。
import { dungeonByRegion } from '../dungeon/maps'
import { ENEMIES } from './data/enemies'
import { ELEMENT_ADVANTAGE, ELEMENT_LABELS, type Element, type GameData } from './types'

// 地域の石碑総数(痕跡の物理上限)。未知地域は0
export function maxTraceOf(regionId: string): number {
  const d = dungeonByRegion(regionId)
  if (!d) return 0
  return d.floors.reduce(
    (n, f) => n + f.ascii.reduce((m, row) => m + (row.split('M').length - 1), 0),
    0,
  )
}

export interface TraceIntel {
  level: number // 観察済みの痕跡数(0-3)
  max: number // この地域で観察できる上限(min(3, 石碑総数))
  attr: boolean // 開示1: 主の属性
  danger: boolean // 開示2: 危険の見立て
  mikiri: boolean // 開示3: 初回ボス戦の見切り(表示のみ)
}

export function traceIntelOf(data: Pick<GameData, 'loreFrags'>, regionId: string): TraceIntel {
  const total = maxTraceOf(regionId)
  const max = Math.min(3, total)
  const level = Math.min(data.loreFrags?.[regionId] ?? 0, max)
  if (max === 0) return { level: 0, max: 0, attr: false, danger: false, mikiri: false }
  return {
    level,
    max,
    attr: level >= Math.min(1, max),
    danger: level >= Math.min(2, max),
    mikiri: level >= max, // 石碑が3未満の地域は全て読み切れば開示全開(見切り永久不能の回避)
  }
}

function bossOf(bossId: string | undefined) {
  return bossId ? ENEMIES.find((e) => e.id === bossId) : undefined
}

// 開示2: 危険の見立て — ボスの数値傾向から生成する一文(表示専用)
export function bossDangerHint(bossId: string | undefined): string | null {
  const b = bossOf(bossId)
  if (!b) return null
  const trait =
    b.agi >= b.atk
      ? '出足が速い。先手を取られると隊列が乱れる'
      : b.def >= b.atk
        ? '守りが堅い。長引く — 灯の残りに気を配れ'
        : '一撃が重い。半端な体力で受けるな'
  return `${ELEMENT_LABELS[b.element]}の気配を帯び、${trait}。`
}

// 開示3: 見切り — 弱点属性と初手への構えを明示する(数値バフなし・「回避方法の明示」型)
export function bossMikiriLine(bossId: string | undefined): string | null {
  const b = bossOf(bossId)
  if (!b) return null
  const strong = (Object.keys(ELEMENT_ADVANTAGE) as Element[]).find(
    (k) => ELEMENT_ADVANTAGE[k] === b.element,
  )
  return `見切った — 主は${ELEMENT_LABELS[b.element]}。${
    strong ? `${ELEMENT_LABELS[strong]}の技が深く通る。` : ''
  }初太刀の癖は読めている、慌てず受けろ。`
}
