import type { Character, Skill, StatKey, Stats } from './types'
import { LIFESPAN_MONTHS, STAT_LABELS } from './types'
import { JOB_ROLE_LABELS, JOB_SKILL_UNLOCK_AGES, jobById } from './data/jobs'
import { skillById } from './data/skills'
import { tomoshigataById, tozaOf } from './data/toza'

const STAT_KEYS: StatKey[] = ['str', 'vit', 'dex', 'agi', 'mnd', 'luk']

export interface TrainingRecommendation {
  stat: StatKey
  label: string
  reason: string
  priority: number
}

export interface TrainingMilestone {
  age: number
  monthsUntil: number
  name: string
  source: 'toza' | 'job'
}

export interface TrainingGuidance {
  role: {
    label: string
    description: string
  }
  age: number
  monthsLeft: number
  nextMilestone?: TrainingMilestone
  inheritanceText: string
  recommendations: TrainingRecommendation[]
}

interface Candidate {
  stat: StatKey
  score: number
  reasons: string[]
}

function safeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function safeSkill(id: string): Skill | undefined {
  try {
    return skillById(id)
  } catch {
    return undefined
  }
}

function primaryAxesForRole(role: string): StatKey[] {
  switch (role) {
    case 'atk': return ['str', 'dex']
    case 'tank': return ['vit', 'mnd']
    case 'swift': return ['agi', 'luk']
    case 'heal': return ['mnd', 'vit']
    case 'hex': return ['dex', 'agi']
    case 'sup': return ['mnd', 'luk']
    default: return []
  }
}

/**
 * 人物の既知情報だけから「なぜ鍛えるか」を組み立てる。
 * Partialを受けるのは旧saveや読込途中の欠損を画面クラッシュへ波及させないため。
 */
export function buildTrainingGuidance(
  character: Partial<Character> | null | undefined,
  seasonIndex: number,
): TrainingGuidance {
  const safeSeason = safeNumber(seasonIndex)
  const bornSeason = safeNumber(character?.bornSeason)
  const age = Math.max(0, Math.floor(safeSeason - bornSeason))
  const monthsLeft = Math.max(0, LIFESPAN_MONTHS - age)
  const skills = Array.isArray(character?.skills) ? character.skills.filter((id): id is string => typeof id === 'string') : []
  const learned = new Set(skills)
  const potential = Object.fromEntries(
    STAT_KEYS.map((key) => [key, safeNumber((character?.potential as Partial<Stats> | undefined)?.[key])]),
  ) as unknown as Stats

  let roleLabel = age < 6 ? '幼き灯' : '定まらぬ戦型'
  const descriptions: string[] = []
  const candidates = new Map<StatKey, Candidate>(
    STAT_KEYS.map((stat) => [stat, { stat, score: 0, reasons: [] }]),
  )
  const milestones: TrainingMilestone[] = []

  const add = (stat: StatKey, score: number, reason: string) => {
    const candidate = candidates.get(stat)!
    candidate.score += score
    if (!candidate.reasons.includes(reason)) candidate.reasons.push(reason)
  }

  if (character?.tomoshigata) {
    try {
      const gata = tomoshigataById(character.tomoshigata)
      const toza = character.element ? tozaOf(character.tomoshigata, character.element) : undefined
      roleLabel = toza ? `${toza.name} — ${toza.title}` : `${gata.label}の灯し手`
      descriptions.push(gata.desc)
      for (const [stat, bias] of Object.entries(gata.statBias) as [StatKey, number][]) {
        add(stat, 60 + bias, `${gata.label}の型が${STAT_LABELS[stat]}を活かす`)
      }
      if (toza) {
        const tozaSteps = [
          { age: 6, skill: toza.skills[0] },
          { age: 10, skill: toza.skills[1] },
          { age: 14, skill: toza.skills[2] },
          { age: 18, skill: toza.ougi },
        ]
        for (const step of tozaSteps) {
          if (!learned.has(step.skill.id)) {
            milestones.push({ age: step.age, monthsUntil: Math.max(0, step.age - age), name: step.skill.name, source: 'toza' })
          }
        }
      }
    } catch {
      descriptions.push('灯型の記録を読み解いている。')
    }
  } else {
    descriptions.push(age < 6 ? '成人の儀までは血潮の伸びを見守る時期。' : '成人の儀で灯型を授かると役割が定まる。')
  }

  if (character?.jobClass) {
    try {
      const job = jobById(character.jobClass)
      roleLabel = `${roleLabel} / ${job.name}・${JOB_ROLE_LABELS[job.role]}`
      descriptions.push(job.desc)
      for (const stat of primaryAxesForRole(job.role)) {
        add(stat, stat === primaryAxesForRole(job.role)[0] ? 90 : 55, `${job.name}の${JOB_ROLE_LABELS[job.role]}役を支える`)
      }
      job.skillIds.forEach((skillId, index) => {
        if (learned.has(skillId)) return
        const skill = safeSkill(skillId)
        if (!skill) return
        milestones.push({
          age: JOB_SKILL_UNLOCK_AGES[index],
          monthsUntil: Math.max(0, JOB_SKILL_UNLOCK_AGES[index] - age),
          name: skill.name,
          source: 'job',
        })
      })
    } catch {
      descriptions.push('家業の記録を読み解いている。')
    }
  }

  milestones.sort((a, b) => a.monthsUntil - b.monthsUntil || a.age - b.age || a.name.localeCompare(b.name, 'ja'))
  const nextMilestone = milestones[0]

  // 血潮はそのまま複製されず、星神の血と揺らぎを経る。最も濃い軸を「影響し得る」とだけ案内する。
  const strongest = [...STAT_KEYS].sort((a, b) => potential[b] - potential[a])[0]
  add(strongest, age >= 18 ? 35 : 18, `${STAT_LABELS[strongest]}の血潮は次代の素質へ影響し得る`)

  // 役割情報が欠けても空欄にせず、極端に低い軸を安全網として示す。
  for (const stat of STAT_KEYS) {
    if (candidates.get(stat)!.score === 0) add(stat, Math.max(1, 40 - potential[stat] / 3), `${STAT_LABELS[stat]}の血潮を補い戦型の幅を残す`)
  }

  const recommendations = [...candidates.values()]
    .sort((a, b) => b.score - a.score || potential[a.stat] - potential[b.stat] || STAT_KEYS.indexOf(a.stat) - STAT_KEYS.indexOf(b.stat))
    .slice(0, 3)
    .map((candidate) => ({
      stat: candidate.stat,
      label: STAT_LABELS[candidate.stat],
      reason: candidate.reasons.slice(0, 2).join('。'),
      priority: Math.round(candidate.score),
    }))

  const inheritanceText = monthsLeft <= 6
    ? `残る月はおよそ${monthsLeft}。磨いた血潮は星神の血と揺らぎを経て次代へ影響するが、同じ値の継承は保証されない。`
    : '磨いた血潮は星神の血と揺らぎを経て次代へ一部影響する。同じ値や同じ戦型の継承を保証するものではない。'

  return {
    role: { label: roleLabel, description: descriptions.join(' ') },
    age,
    monthsLeft,
    nextMilestone,
    inheritanceText,
    recommendations,
  }
}
