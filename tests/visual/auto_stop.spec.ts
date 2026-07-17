// A(M28→M29+): 戦闘コマンド盤の常設オート切替(.cmd-auto-persist)。手番・メニュー・演出に関わらず
// 戦闘中いつでも入切できる。is-on/is-off クラスと実挙動(停止後にHPが自動で減らない)で検証する。
import { expect, test } from '@playwright/test'
import { gotoBattle } from './helpers'

const totalHp = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const g = (window as never as { __game: { store: { getState: () => { battle: { allies: { hp: number }[] } | null } } } }).__game
    const b = g.store.getState().battle
    return b ? b.allies.reduce((s, a) => s + a.hp, 0) : -1
  })

test('常設オート切替で、戦闘中いつでも入切できる', async ({ page }) => {
  await gotoBattle(page, { allies: 3, enemies: 4 })
  const toggle = page.locator('.cmd-auto-persist')
  await expect(toggle, '常設トグルが見えている').toBeVisible()
  await expect(toggle, '初期はオフ').not.toHaveClass(/is-on/)
  await toggle.click() // 開始
  await expect(toggle, 'オンに切替').toHaveClass(/is-on/)
  await toggle.click() // 停止
  await expect(toggle, 'オフに戻る').not.toHaveClass(/is-on/)
})

test('停止後、次の入力番で自動攻撃が発火しない(HPが自然減しない)', async ({ page }) => {
  await gotoBattle(page, { allies: 3, enemies: 4 })
  const toggle = page.locator('.cmd-auto-persist')
  await toggle.click() // オート開始
  await expect(toggle).toHaveClass(/is-on/)
  await page.waitForTimeout(700) // 数回オート攻撃が走る
  await page.keyboard.press('Escape') // Escで停止
  await expect(toggle, 'Escで停止=オフ表示').not.toHaveClass(/is-on/)
  // 停止後、味方の総HPが一定時間変化しない(=自動で戦闘が進まない)
  const before = await totalHp(page)
  await page.waitForTimeout(1200)
  const after = await totalHp(page)
  expect(after, '停止後は自動で戦闘が進まない').toBe(before)
})
