import type { Character, God, Stats, StatKey } from './types'
import { LIFESPAN_MONTHS } from './types'
import { Rng, uid } from './rng'
import { MALE_NAMES, FEMALE_NAMES } from './data/names'
import { PERSONALITIES } from './data/personalities'
import { skillById } from './data/skills'

const STAT_KEYS: StatKey[] = ['str', 'vit', 'dex', 'agi', 'mnd', 'luk']

// 成長曲線 — 生後nヶ月の血潮発現率。16〜20ヶ月が全盛、晩年は僅かに衰える
export const AGE_CURVE = [
  0.30, 0.34, 0.38, 0.42, 0.47, 0.52, // 0-5月: 幼子
  0.60, 0.65, 0.70, 0.74, 0.78, 0.82, // 6-11月: 成人・伸び盛り
  0.86, 0.90, 0.93, 0.96, 1.00, 1.00, // 12-17月: 充実
  1.00, 1.00, 0.98, 0.96, 0.93, 0.90, // 18-23月: 全盛から灯細り
]

export const ADULT_MONTHS = 6 // 成人(初陣が許される月齢)

export function ageOf(c: Character, seasonIndex: number): number {
  return seasonIndex - c.bornSeason
}

export function isAdult(c: Character, seasonIndex: number): boolean {
  return c.alive && ageOf(c, seasonIndex) >= ADULT_MONTHS
}

export function seasonsLeft(c: Character, seasonIndex: number): number {
  return LIFESPAN_MONTHS - ageOf(c, seasonIndex)
}

// 現在ステータスを血潮×年齢曲線から再計算(HP/MP割合は維持)
export function recalcStats(c: Character, seasonIndex: number): Character {
  const age = Math.min(Math.max(ageOf(c, seasonIndex), 0), LIFESPAN_MONTHS - 1)
  const mult = AGE_CURVE[age]
  const stats = Object.fromEntries(
    STAT_KEYS.map((k) => [k, Math.max(1, Math.round(c.potential[k] * mult))]),
  ) as unknown as Stats
  const maxHp = Math.round(stats.vit * 2.6 + 30)
  const maxMp = Math.round(stats.mnd * 1.3 + 12)
  const hpRatio = c.maxHp > 0 ? c.hp / c.maxHp : 1
  const mpRatio = c.maxMp > 0 ? c.mp / c.maxMp : 1
  return {
    ...c,
    stats,
    maxHp,
    maxMp,
    hp: Math.max(1, Math.round(maxHp * hpRatio)),
    mp: Math.round(maxMp * mpRatio),
  }
}

// 星神の血潮基準値
function godStat(god: God, key: StatKey): number {
  return 42 + god.rank * 9 + (god.statBias[key] ?? 0)
}

// UI表示用(v3.1 M9: 遺伝子画面の神系バー)。計算はgodStatと同一の単一情報源。
export function godStatValue(god: God, key: StatKey): number {
  return godStat(god, key)
}

// 子の血潮予測レンジ(UI表示用) — 透明性のための機能
export function predictChild(parent: Character, god: God): Record<StatKey, [number, number]> {
  const out = {} as Record<StatKey, [number, number]>
  for (const k of STAT_KEYS) {
    const mid = parent.potential[k] * 0.48 + godStat(god, k) * 0.55
    out[k] = [Math.round(Math.min(120, mid * 0.88)), Math.round(Math.min(120, mid * 1.12))]
  }
  return out
}

// 星契り — 子を生成
// v3.1 M12: affinity(縁)が深いほど下振れしにくい。familyを渡すと隔世遺伝(祖の血の強い発現)が起こりうる
export function conceiveChild(
  parent: Character,
  god: God,
  gen: number,
  bornSeason: number,
  rng: Rng,
  usedNames: string[],
  affinity = 0,
  family?: Character[],
): Character {
  const sex: 'm' | 'f' = rng.chance(0.5) ? 'm' : 'f'
  const pool = sex === 'm' ? MALE_NAMES : FEMALE_NAMES
  const available = pool.filter((n) => !usedNames.includes(n))
  const name = available.length > 0 ? rng.pick(available) : `${rng.pick(pool)}${gen}`

  // 縁の加護: 乱数の下限が持ち上がる(最大+0.06)
  const floor = 0.88 + Math.min(0.06, affinity * 0.012)
  const potential = {} as Stats
  for (const k of STAT_KEYS) {
    const mid = parent.potential[k] * 0.48 + godStat(god, k) * 0.55
    const v = mid * (floor + rng.next() * (1.12 - floor))
    potential[k] = Math.round(Math.min(120, Math.max(8, v)))
  }

  // 隔世遺伝(M12-3): 一割の子に、祖父母の血が強く顕れる
  const grand = family?.find((c) => c.id === parent.humanParentId)
  const atavism = !!grand && rng.chance(0.1)
  if (atavism && grand) {
    for (const k of STAT_KEYS) {
      potential[k] = Math.min(120, Math.max(potential[k], Math.round(grand.potential[k] * 0.82)))
    }
  }

  // 属性: 基本は星神から、3割で親から
  const element = rng.chance(0.3) ? parent.element : god.element

  // 技: 自属性の基本技 + 星神の奥義 + 親から継承可能技を最大2つ
  const basicByElement: Record<string, string> = {
    fire: 'homura_giri', water: 'mikagami', wind: 'kazenagi',
    earth: 'iwatoshi', moon: 'tsukikage', star: 'hoshiugachi',
  }
  const skills = new Set<string>([basicByElement[element]])
  skills.add(god.skillId)
  const parentLegacy = parent.skills.filter((id) => skillById(id).inheritable && !skills.has(id))
  for (const s of rng.shuffle(parentLegacy).slice(0, 2)) skills.add(s)
  // 心が高い子は癒しを覚える
  if (potential.mnd >= 55) skills.add('koyashi')

  const child: Character = {
    id: uid('chr'),
    name,
    gen,
    sex,
    bornSeason,
    potential,
    stats: { ...potential },
    hp: 1, maxHp: 1, mp: 1, maxMp: 1,
    element,
    personalityId: rng.pick(PERSONALITIES).id,
    skills: [...skills],
    equipment: {},
    godParentId: god.id,
    humanParentId: parent.id,
    isHead: false,
    alive: true,
    kills: 0,
    expeditions: 0,
    deeds: atavism && grand ? [`${grand.name}の血が強く顕れた(隔世遺伝)`] : [],
    fatigue: 0,
  }
  const withStats = recalcStats(child, bornSeason)
  return { ...withStats, hp: withStats.maxHp, mp: withStats.maxMp }
}

// 縁による奉納点の割引(v3.1 M12-2): 縁1につき4%引、上限20%
export function pactCost(god: God, affinity: number): number {
  return Math.ceil(god.cost * (1 - Math.min(0.2, Math.floor(affinity) * 0.04)))
}

// 初代当主の生成
export function makeFounder(bornSeason: number, rng: Rng): Character {
  const potential: Stats = { str: 52, vit: 55, dex: 48, agi: 46, mnd: 42, luk: 45 }
  const founder: Character = {
    id: uid('chr'),
    name: '燈吾',
    gen: 1,
    sex: 'm',
    bornSeason: bornSeason - 9, // 既に9ヶ月生きている(残り15ヶ月)
    potential,
    stats: { ...potential },
    hp: 1, maxHp: 1, mp: 1, maxMp: 1,
    element: 'fire',
    personalityId: 'brave',
    skills: ['homura_giri', 'kien'],
    equipment: {},
    godParentId: 'kagaribi',
    isHead: true,
    alive: true,
    kills: 0,
    expeditions: 0,
    deeds: ['大燈籠の前で当主を継いだ'],
    fatigue: 0,
  }
  void rng
  const withStats = recalcStats(founder, bornSeason)
  return { ...withStats, hp: withStats.maxHp, mp: withStats.maxMp }
}
