import { describe, expect, it } from 'vitest'
import { buildSuccessionScene, chooseSuccessor, GENERATION_VOWS } from '../src/core/inheritance'
import type { Character, GameData, Item, Stats } from '../src/core/types'

const stats: Stats = { str: 40, vit: 41, dex: 42, agi: 43, mnd: 44, luk: 45 }
function char(id: string, patch: Partial<Character> = {}): Character {
  return {
    id, name: id, gen: 1, sex: 'm', bornSeason: -9, potential: stats, stats,
    hp: 100, maxHp: 100, mp: 40, maxMp: 40, element: 'fire', personalityId: 'brave', skills: [],
    equipment: {}, godParentId: 'kagaribi', isHead: false, alive: true, kills: 0, expeditions: 0, deeds: [], fatigue: 0,
    ...patch,
  }
}
function data(family: Character[]): GameData {
  return {
    seasonIndex: 18, family, hoto: 0, ketsu: 0, inventory: [], godAffinity: {}, fame: 0,
    regionsCleared: [], chronicle: [], pendingBirths: [], flags: {}, narrativeMode: false, seed: 1,
  }
}

describe('M43 successor designation', () => {
  it('存命の指名者を最年長より優先し、無効なら最年長へ戻す', () => {
    const elder = char('elder', { bornSeason: 0 })
    const younger = char('younger', { bornSeason: 5 })
    expect(chooseSuccessor({ family: [elder, younger], designatedHeirId: 'younger' })?.id).toBe('younger')
    expect(chooseSuccessor({ family: [elder, { ...younger, alive: false }], designatedHeirId: 'younger' })?.id).toBe('elder')
    expect(chooseSuccessor({ family: [elder, younger], designatedHeirId: 'missing' })?.id).toBe('elder')
  })

  it('100 seed相当の生涯で、返歌が実在事実2件を参照し矛盾語を出さない', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const predecessor = char(`先代${seed}`, {
        alive: false, isHead: false, kills: seed % 7, expeditions: seed % 5,
        deeds: seed % 3 === 0 ? [`第${seed}の事績`] : [],
      })
      const successor = char(`次代${seed}`, { gen: 2, bornSeason: 4, potential: { ...stats, luk: 50 + seed % 20 } })
      const children = seed % 2 ? [char(`子${seed}`, { humanParentId: predecessor.id, gen: 2 })] : []
      const keepsake: Item[] = seed % 4 === 0 ? [{ id: `i${seed}`, baseId: 'w_kodachi', name: `形見${seed}`, slot: 'weapon', generation: 1 }] : []
      const d = {
        ...data([predecessor, successor, ...children]),
        generationVow: { id: (Object.keys(GENERATION_VOWS)[seed % 3]) as keyof typeof GENERATION_VOWS, madeById: predecessor.id, generation: 1, setSeason: 17 },
      }
      const built = buildSuccessionScene(d, predecessor, successor, keepsake, `問い${seed}`)
      expect(built.record.truthLabels).toHaveLength(2)
      expect(built.record.reply).toContain(built.record.truthLabels[0])
      expect(built.record.reply).toContain(built.record.truthLabels[1])
      const text = built.scene.kind === 'life' ? built.scene.lines.map((line) => line.text).join('\n') : ''
      expect(text).not.toMatch(/undefined|NaN/)
      expect(text).toContain(`問い${seed}`)
    }
  })
})
