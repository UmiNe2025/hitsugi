// 眷属(式神) v3.1 M16-5 — 討った魔性が稀に懐き、一族に随行する
// 属性ごとに一つの加護。全6属性が実効き:
//   fire=灯消費-10%(store lightCost) / water=戦端に先頭を癒し(store) /
//   wind=隠密・追跡半径-2(Dungeon→engine.setStealth) / earth=宝目・開幕にミニマップ表示(DungeonEngine) /
//   star=戦利品+10%(store lootK) /
//   moon=夜目・敵影を検知半径5マスでミニマップに点描(Dungeon→engine.setNightVision→Minimap.setNightVision、M18で実効化)。
import type { Element } from '../types'

export interface FamiliarPerk {
  label: string // 加護の名
  perk: string // 一言(UI表示用の効能)
  desc: string // 由来・雰囲気の説明
}

export const FAMILIAR_KINDS: Record<Element, FamiliarPerk> = {
  fire: {
    label: '灯強め',
    perk: '探索の灯消費 -10%',
    desc: '火の眷属は懐に灯る小さな焔。歩くたび、松明の油を少しだけ惜しんでくれる。',
  },
  water: {
    label: '癒し',
    perk: '戦の始め、先頭が少し癒える',
    desc: '水の眷属は傷を舐めてくれる。戦端が開く刹那、先頭の傷を薄く塞ぐ。',
  },
  wind: {
    label: '韋駄天',
    perk: '敵影の追跡がやや鈍る',
    desc: '風の眷属は足音を攫っていく。夜藪の敵影は、心なしか間合いを詰めにくくなる。',
  },
  earth: {
    label: '宝目',
    perk: 'フロアの宝・石碑の在処を開幕に知らせる',
    desc: '土の眷属は地に伏せる気配に聡い。踏み入った刹那、宝箱と石碑の場所を鼻で示す。',
  },
  moon: {
    label: '夜目',
    perk: '敵影をやや遠くから見分けられる',
    desc: '月の眷属は闇でも瞳が澄む。灯が細っても、敵影の輪郭だけは見失いにくい。',
  },
  star: {
    label: '福',
    perk: '戦利品がわずかに実る',
    desc: '星の眷属は運を拾ってくる。懐にいるだけで、戦利品の実りが心なし豊かになる。',
  },
}

export function familiarPerk(element: Element): string {
  return FAMILIAR_KINDS[element].perk
}

export function familiarLabel(element: Element): string {
  return FAMILIAR_KINDS[element].label
}
