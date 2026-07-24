import type { Character, GameData, GenerationVowId, God, Item, NarrativeScene, Stats, StatKey, SuccessionRecord } from './types'
import { LIFESPAN_MONTHS, STAT_LABELS } from './types'
import { Rng, uid } from './rng'
import { MALE_NAMES, FEMALE_NAMES } from './data/names'
import { PERSONALITIES } from './data/personalities'
import { skillById } from './data/skills'
import { effectivePotential } from './character_progression'

const STAT_KEYS: StatKey[] = ['str', 'vit', 'dex', 'agi', 'mnd', 'luk']

// 成長曲線 — 生後nヶ月の血潮発現率。16〜20ヶ月が全盛、晩年は僅かに衰える
export const AGE_CURVE = [
  0.30, 0.34, 0.38, 0.42, 0.47, 0.52, // 0-5月: 幼子
  0.60, 0.65, 0.70, 0.74, 0.78, 0.82, // 6-11月: 成人・伸び盛り
  0.86, 0.90, 0.93, 0.96, 1.00, 1.00, // 12-17月: 充実
  1.00, 1.00, 0.98, 0.96, 0.93, 0.90, // 18-23月: 全盛から灯細り
]

export const ADULT_MONTHS = 6 // 成人(初陣が許される月齢)

export const GENERATION_VOWS: Readonly<Record<GenerationVowId, { name: string; promise: string; nextStep: string }>> = {
  guard_line: { name: '血脈を守る', promise: '誰も独りで夜へ置いていかない', nextStep: 'まず家族の傷と後継の備えを確かめる' },
  break_night: { name: '常夜を破る', promise: '恐れを抱いたままでも、夜の奥へ進む', nextStep: '先代が届かなかった地へ出立する' },
  keep_names: { name: '名を忘れない', promise: '生きた証を、勝敗より長く家譜へ残す', nextStep: '家譜を開き、先代の名と事績を読む' },
}

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
  const potentialWithMastery = effectivePotential(c)
  const stats = Object.fromEntries(
    STAT_KEYS.map((k) => [k, Math.max(1, Math.round(potentialWithMastery[k] * mult))]),
  ) as unknown as Stats
  const maxHp = Math.round(stats.vit * 2.6 + 30)
  const maxMp = Math.round(stats.mnd * 1.3 + 12)
  const hpRatio = Math.min(1, Math.max(0, c.maxHp > 0 ? c.hp / c.maxHp : 1))
  const mpRatio = Math.min(1, Math.max(0, c.maxMp > 0 ? c.mp / c.maxMp : 1))
  return {
    ...c,
    stats,
    maxHp,
    maxMp,
    hp: !c.alive && c.hp === 0 ? 0 : Math.max(c.alive ? 1 : 0, Math.round(maxHp * hpRatio)),
    mp: Math.min(maxMp, Math.max(0, Math.round(maxMp * mpRatio))),
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

  // 神童(M15-5): ごく稀に、星の寵を一身に受けた子が生まれる
  const prodigy = rng.chance(0.04)
  if (prodigy) {
    for (const k of STAT_KEYS) {
      potential[k] = Math.min(120, Math.round(potential[k] * 1.15))
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
    level: 1,
    exp: 0,
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
    deeds: [
      ...(atavism && grand ? [`${grand.name}の血が強く顕れた(隔世遺伝)`] : []),
      ...(prodigy ? ['生まれながらに星の寵を受けた(神童の相)'] : []),
    ],
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
    level: 1,
    exp: 0,
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

/** 指名者が存命なら優先し、無効時は従来どおり最年長の存命者へ安全に戻す。 */
export function chooseSuccessor(data: Pick<GameData, 'family' | 'designatedHeirId'>): Character | undefined {
  const living = data.family.filter((char) => char.alive)
  const designated = data.designatedHeirId
    ? living.find((char) => char.id === data.designatedHeirId)
    : undefined
  return designated ?? [...living].sort((a, b) => a.bornSeason - b.bornSeason || a.id.localeCompare(b.id))[0]
}

interface SuccessionTruth {
  label: string
  line: string
}

function successionTruths(data: GameData, predecessor: Character, keepsakes: readonly Item[]): [SuccessionTruth, SuccessionTruth] {
  const children = data.family.filter((char) => char.humanParentId === predecessor.id)
  const candidates: SuccessionTruth[] = [
    predecessor.kills > 0 ? { label: `魔性${predecessor.kills}体を討った`, line: `討った魔性は、確かに${predecessor.kills}体。` } : null,
    predecessor.expeditions > 0 ? { label: `${predecessor.expeditions}度出立した`, line: `夜藪へ出立したのは、確かに${predecessor.expeditions}度。` } : null,
    children.length > 0 ? { label: `${children.length}人の子を残した`, line: `残した子は${children.length}人 — ${children.map((child) => child.name).join('、')}。` } : null,
    keepsakes.length > 0 ? { label: `形見「${keepsakes[0].name}」を残した`, line: `蔵へ戻った形見は「${keepsakes[0].name}」。` } : null,
    predecessor.deeds[0] ? { label: `「${predecessor.deeds[0]}」を成した`, line: `家譜には「${predecessor.deeds[0]}」とある。` } : null,
  ].filter((truth): truth is SuccessionTruth => truth !== null)
  if (candidates.length < 2) {
    candidates.push(
      { label: `魔性${predecessor.kills}体を討った`, line: `討った魔性は${predecessor.kills}体。その零も偽らず記す。` },
      { label: `${predecessor.expeditions}度出立した`, line: `夜藪への出立は${predecessor.expeditions}度。その零も生涯の真実だ。` },
    )
  }
  const unique = candidates.filter((truth, index, all) => all.findIndex((other) => other.label === truth.label) === index)
  return [unique[0], unique[1] ?? candidates[candidates.length - 1]]
}

/** 先代の約束→実在する二つの事実→返歌→形見/血潮→次の一手を一場面へまとめる。 */
export function buildSuccessionScene(
  data: GameData,
  predecessor: Character,
  successor: Character,
  keepsakes: readonly Item[],
  question: string,
): { scene: NarrativeScene; record: SuccessionRecord } {
  const [first, second] = successionTruths(data, predecessor, keepsakes)
  const vow = data.generationVow?.madeById === predecessor.id ? GENERATION_VOWS[data.generationVow.id] : undefined
  const strongest = (Object.entries(successor.potential) as [StatKey, number][]).sort((a, b) => b[1] - a[1])[0]
  const bloodLegacy = `${STAT_LABELS[strongest[0]]}${strongest[1]}の血潮`
  const reply = `あなたが${first.label}ことも、${second.label}ことも、私は忘れない。その続きを私の生で返す。`
  const heirloomName = keepsakes[0]?.name
  const nextStep = vow?.nextStep ?? '家族の顔を見て、次のひと月に何を残すか決める'
  const record: SuccessionRecord = {
    predecessorId: predecessor.id,
    successorId: successor.id,
    season: data.seasonIndex,
    vowId: data.generationVow?.madeById === predecessor.id ? data.generationVow.id : undefined,
    truthLabels: [first.label, second.label],
    reply,
    heirloomName,
    bloodLegacy,
  }
  const lines = [
    { speaker: predecessor.name, text: vow ? `「${vow.promise}」— これが私の約束だった。` : '約束は言葉にしきれなかった。それでも、歩いた跡は残る。' },
    { speaker: '家譜', text: first.line },
    { speaker: '家譜', text: second.line },
    { speaker: successor.name, text: reply },
    { speaker: '綴', text: heirloomName ? `「形見『${heirloomName}』と、${bloodLegacy}が汝へ継がれた」` : `「形ある品はなくとも、${bloodLegacy}は汝へ継がれた」` },
    { speaker: '綴', text: `「今代の問い — ${question}」` },
    { speaker: successor.name, text: `次の一手 — ${nextStep}。` },
  ]
  return {
    record,
    scene: { kind: 'life', narrativeId: `inherit:${data.seasonIndex}:${predecessor.id}:${successor.id}`, bg: 'cg2_succession.jpg', title: '当主継承 — 灯の返歌', lines },
  }
}
