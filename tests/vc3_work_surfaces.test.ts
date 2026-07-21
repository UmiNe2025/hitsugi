import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const forge = readFileSync('src/ui/Forge.tsx', 'utf8')
const forgeCss = readFileSync('src/ui/forge_vc3.css', 'utf8')
const depart = readFileSync('src/ui/Expedition.tsx', 'utf8')
const departCss = readFileSync('src/ui/depart_m18.css', 'utf8')
const expeditionCss = readFileSync('src/ui/expedition_vc3.css', 'utf8')

describe('VC3 work-surface contract', () => {
  it('鍛冶は一人の身体・三枠・推薦三品を全在庫より先に出す', () => {
    expect(forge).toContain('data-testid="forge-workbench"')
    expect(forge).toContain("(['weapon', 'armor', 'charm'] as ItemSlot[]).map")
    expect(forge).toContain('return candidates.slice(0, 3)')
    expect(forge.indexOf('data-testid="forge-workbench"')).toBeLessThan(forge.indexOf('data-testid="forge-list-card"'))
    expect(forge).toContain('見立て —')
  })

  it('蔵は棚入口と前所有者・継承・比較を保持する', () => {
    for (const label of ['すべての棚', '最近得た品', '装いを強める品', '形見と継承品']) {
      expect(forge).toContain(label)
    }
    expect(forge).toContain('legacyFirstOwner')
    expect(forge).toContain('CompareAxes')
    expect(forge).toContain('sourceLabelOf(it)')
  })

  it('出立は四候補・同期map/list・確認Sheetを持つ', () => {
    expect(depart).toContain('.slice(0, 4)')
    expect(depart).toContain("const [view, setView] = useState<'map' | 'list'>('map')")
    expect(depart).toContain('<AscentMap')
    expect(depart).toContain('<RegionList')
    expect(depart).toContain('setConfirmOpen(true)')
    expect(depart).toContain('出立の確かめ')
    expect(depart).toContain('この隊で今月を使い、出立する')
  })

  it('遠征は地域・現在節・隊・帰還を同じ絵巻surfaceへ載せる', () => {
    expect(depart).toContain('data-testid="expedition-scroll-surface"')
    expect(depart).toContain('いまいる節')
    expect(depart).toContain('同じ絵巻を歩く者')
    expect(depart).toContain('ここから郷へ戻る')
    expect(depart).toContain('帰り火を焚く(成果を持って帰還)')
  })

  it('5幅・44/48px・reduced motion・overflowの機械契約を持つ', () => {
    const css = `${forgeCss}\n${departCss}\n${expeditionCss}`
    for (const width of ['1100px', '900px', '560px', '390px']) expect(css).toContain(width)
    expect(css).toMatch(/min-height:\s*44px/)
    expect(css).toMatch(/min-height:\s*48px/)
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('overflow-y: auto')
  })
})
