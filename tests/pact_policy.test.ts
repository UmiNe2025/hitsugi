import { describe, expect, it } from 'vitest'
import { pactAvailability } from '../src/ui/pactPolicy'

describe('星契りの閲覧・契約可否', () => {
  it('封印解除済みなら奉燈不足でも詳細を閲覧できる', () => {
    expect(pactAvailability(true, 40, 100)).toEqual({
      inspectable: true,
      contractable: false,
      reason: '奉燈があと60足りない',
    })
  })

  it('奉燈が足りれば閲覧も契約もできる', () => {
    expect(pactAvailability(true, 100, 100)).toEqual({ inspectable: true, contractable: true })
  })

  it('封印中は奉燈に関係なく閲覧できない', () => {
    expect(pactAvailability(false, 999, 100)).toEqual({
      inspectable: false,
      contractable: false,
      reason: 'この星はまだ封印されている',
    })
  })
})
