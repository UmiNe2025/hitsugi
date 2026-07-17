// A(M28): オート戦闘を任意タイミングで停止できる(処理中もボタン/ストリップ/Escで止まる)。
import { expect, test } from '@playwright/test'
import { gotoBattle } from './helpers'

test('オートを開始できて、停止ストリップで止まる', async ({ page }) => {
  // 敵を多めにして戦闘を長引かせ、オートが数ターン回る余地を作る
  await gotoBattle(page, { allies: 3, enemies: 4 })
  const autoBtn = page.getByRole('button', { name: /オート/ })
  await expect(autoBtn).toBeVisible()
  await autoBtn.click() // ▶ オート → 開始
  // オート実行中の常時停止ストリップが出る
  const strip = page.locator('.auto-stop-strip')
  await expect(strip).toBeVisible({ timeout: 3000 })
  // 停止ストリップは処理中でもクリックできる(pointer-events/常時描画)
  await strip.click()
  await expect(strip).toBeHidden({ timeout: 3000 })
})

test('停止後、次の入力番で自動攻撃が発火しない(灯織のHPが自然減しない)', async ({ page }) => {
  await gotoBattle(page, { allies: 3, enemies: 4 })
  const autoBtn = page.getByRole('button', { name: /オート/ })
  await autoBtn.click()
  await page.waitForTimeout(700) // 数回オート攻撃が走る
  // Escで停止
  await page.keyboard.press('Escape')
  await expect(page.locator('.auto-stop-strip')).toBeHidden({ timeout: 3000 })
  // 停止後、味方の総HPが一定時間変化しない(=自動で戦闘が進まない)
  const totalHp = () =>
    page.evaluate(() => {
      const g = (window as never as { __game: { store: { getState: () => { battle: { allies: { hp: number }[] } | null } } } }).__game
      const b = g.store.getState().battle
      return b ? b.allies.reduce((s, a) => s + a.hp, 0) : -1
    })
  const before = await totalHp()
  await page.waitForTimeout(1200)
  const after = await totalHp()
  expect(after, '停止後は自動で戦闘が進まない').toBe(before)
})
