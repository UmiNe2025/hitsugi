import { describe, expect, it } from 'vitest'
import { godPresentationImg, isGodMaxArtReviewed } from '../src/ui/img'

describe('VC5 god art promotion policy', () => {
  it('unreviewed MAX candidate never replaces the normal identity', () => {
    expect(isGodMaxArtReviewed('god_hiuchi.png')).toBe(false)
    expect(godPresentationImg('god_hiuchi.png', true)).toMatch(/god_hiuchi\.jpg$/)
    expect(godPresentationImg('god_hiuchi.png', true)).not.toMatch(/_max\.jpg$/)
  })

  it('normal presentation remains unchanged', () => {
    expect(godPresentationImg('god_hiuchi.png', false)).toMatch(/god_hiuchi\.jpg$/)
  })
})
