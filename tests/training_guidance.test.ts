import { describe, expect, it } from 'vitest'
import type { Character } from '../src/core/types'
import { buildTrainingGuidance } from '../src/core/training_guidance'
import { jobById } from '../src/core/data/jobs'
import { tozaOf } from '../src/core/data/toza'

function character(overrides: Partial<Character> = {}): Character {
  return {
    id: 'c1', name: '灯', gen: 1, sex: 'f', bornSeason: 0,
    potential: { str: 80, vit: 52, dex: 70, agi: 48, mnd: 45, luk: 40 },
    stats: { str: 70, vit: 45, dex: 61, agi: 42, mnd: 39, luk: 35 },
    hp: 100, maxHp: 100, mp: 40, maxMp: 40, element: 'fire',
    tomoshigata: 'homura', jobClass: 'kanuchi', personalityId: 'brave',
    skills: [], equipment: {}, godParentId: 'g1', isHead: true, alive: true,
    kills: 0, expeditions: 0, deeds: [], fatigue: 0,
    ...overrides,
  }
}

describe('buildTrainingGuidance', () => {
  it('uses toza, job, age, and actual unlock data to explain a focused build', () => {
    const toza = tozaOf('homura', 'fire')
    const job = jobById('kanuchi')
    const person = character({
      skills: [toza.skills[0].id, toza.skills[1].id, job.skillIds[0], job.skillIds[1]],
    })
    const guidance = buildTrainingGuidance(person, 13)

    expect(guidance.role.label).toContain(toza.name)
    expect(guidance.role.label).toContain(job.name)
    expect(guidance.nextMilestone).toMatchObject({ age: 14, monthsUntil: 1, name: toza.skills[2].name })
    expect(guidance.recommendations.length).toBeLessThanOrEqual(3)
    expect(new Set(guidance.recommendations.map((entry) => entry.stat)).size).toBe(guidance.recommendations.length)
    expect(guidance.recommendations[0].stat).toBe('str')
    expect(guidance.recommendations.every((entry) => entry.reason.length > 0)).toBe(true)
  })

  it('describes inheritance cautiously rather than promising exact stat transfer', () => {
    const guidance = buildTrainingGuidance(character(), 20)
    expect(guidance.monthsLeft).toBe(4)
    expect(guidance.inheritanceText).toContain('同じ値の継承は保証されない')
    expect(guidance.inheritanceText).toContain('残る月')
  })

  it('survives missing and malformed legacy fields with at most three unique, reasoned suggestions', () => {
    const guidance = buildTrainingGuidance({
      bornSeason: Number.NaN,
      potential: { str: Number.NaN } as Character['potential'],
      skills: undefined as unknown as string[],
    }, Number.NaN)
    expect(guidance.age).toBe(0)
    expect(guidance.role.label).toBe('幼き灯')
    expect(guidance.recommendations).toHaveLength(3)
    expect(new Set(guidance.recommendations.map((entry) => entry.stat)).size).toBe(3)
    expect(guidance.recommendations.every((entry) => Number.isFinite(entry.priority) && entry.reason.length > 0)).toBe(true)
  })

  it('reports an already-due missing skill as available now without a negative countdown', () => {
    const guidance = buildTrainingGuidance(character({ skills: [] }), 16)
    expect(guidance.nextMilestone?.monthsUntil).toBe(0)
    expect(guidance.nextMilestone?.age).toBe(6)
  })
})
