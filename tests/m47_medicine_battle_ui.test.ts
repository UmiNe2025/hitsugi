import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const village = readFileSync('src/ui/Village.tsx', 'utf8')
const villageCss = readFileSync('src/ui/village_m47.css', 'utf8')
const battle = readFileSync('src/ui/Battle.tsx', 'utf8')
const battleCss = readFileSync('src/ui/battle_m47.css', 'utf8')

describe('M47 郷の薬種見世と戦支度盤', () => {
  it('郷から既存consumables在庫へ直接購入できる', () => {
    expect(village).toContain('data-testid="village-medicine-entry"')
    expect(village).toContain('data-testid="village-medicine-shop"')
    expect(village).toContain('buyConsumable(item.id)')
    expect(village).toContain('CONSUMABLES.map')
    expect(village).toContain('戦の「道具」に入り、使うと一つ減る')
  })

  it('購入面は外側click・Escape・focus復帰を共通Sheetへ委譲する', () => {
    expect(village).toContain('<Sheet title="薬種見世"')
    expect(villageCss).toContain('.sheet:has(.village-medicine-shop)')
    expect(villageCss).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))')
    expect(villageCss).toContain('grid-template-columns: 1fr')
    expect(villageCss).toContain('overflow-x: hidden')
  })

  it('PC戦闘盤は定幅中央寄せで、行動理由と戦況を同時に読める', () => {
    expect(battleCss).toContain('max-width: 1180px')
    expect(battleCss).toContain('margin-inline: auto')
    expect(battle).toContain('className="command-board-heading"')
    expect(battle).toContain('継足を重ねる')
    expect(battle).toContain('次の傷を抑える')
    expect(battle).toContain('<BattleTacticalBrief')
    expect(battle).toContain('郷の薬種見世で補充できる')
  })

  it('モバイルは戦闘盤を画面幅内へ戻し、操作面積を48px確保する', () => {
    expect(battleCss).toContain('@media (max-width: 560px)')
    expect(battleCss).toContain('width: 100%')
    expect(battleCss).toContain('min-height: 48px')
  })
})
