import type { GameData } from '../types'

// 今日の御題(おだい) — 実日付でローテする小さな課題。独立システムにはせず、「務め」の一枠として置く(A案)。
// 達成判定は computeObjectives と同じく現在stateからの純粋導出のみ — 実日付スコープの進捗追跡は作らない。
// (早期は達成できない御題が目標になり、中盤以降は日々の小さな褒賞に変わる=スケールする)
export interface Odai {
  id: string
  text: string
  hint: string
  check: (d: GameData) => boolean
  reward: { hoto: number; ketsu: number }
}

const maxGen = (d: GameData): number => (d.family.length > 0 ? Math.max(...d.family.map((c) => c.gen)) : 0)

export const ODAI: Odai[] = [
  { id: 'adults3', text: '一族に、三人の血を保つ', hint: '存命の一族が三人以上いれば達成', check: (d) => d.family.filter((c) => c.alive).length >= 3, reward: { hoto: 20, ketsu: 0 } },
  { id: 'hoto100', text: '奉燈を、百まで蓄える', hint: '奉燈が百以上で達成', check: (d) => d.hoto >= 100, reward: { hoto: 0, ketsu: 2 } },
  { id: 'inv1', text: '蔵に、得物を一つ備える', hint: '蔵に品が一つ以上あれば達成', check: (d) => d.inventory.length >= 1, reward: { hoto: 16, ketsu: 0 } },
  { id: 'codex10', text: '魔性を、十種まで見聞する', hint: '魔性図鑑が十種以上で達成', check: (d) => (d.codex?.enemies?.length ?? 0) >= 10, reward: { hoto: 24, ketsu: 1 } },
  { id: 'region1', text: '地の主を、一体鎮める', hint: '主を討った地が一つ以上で達成', check: (d) => d.regionsCleared.length >= 1, reward: { hoto: 30, ketsu: 1 } },
  { id: 'gen2', text: '血を継ぎ、二代へ進める', hint: '到達世代が二代以上で達成', check: (d) => maxGen(d) >= 2, reward: { hoto: 20, ketsu: 1 } },
  { id: 'ketsu5', text: '血珠を、五つ手にする', hint: '血珠が五つ以上で達成', check: (d) => d.ketsu >= 5, reward: { hoto: 24, ketsu: 0 } },
]

// 実日付キー(YYYYMMDD)から今日の御題を決める。日替わりで一つに定まる。
export function todaysOdai(dateKey: number): Odai {
  return ODAI[dateKey % ODAI.length]
}
