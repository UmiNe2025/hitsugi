// M26 Phase0: 確認Sheetの安全性 — 閲覧(カード押下)では資源を消費せず、確認CTAで初めて確定する。
import { expect, test } from '@playwright/test'

interface W {
  __game: {
    reset: () => void
    screen: (id: string) => void
    store: { getState: () => { data: { hoto: number } }; setState: (u: unknown) => void }
  }
}

test('郷普請: カード押下では奉燈が減らず、確認CTAで初めて減る(P0-02)', async ({ page }) => {
  await page.goto('/')
  await page.waitForFunction(() => '__game' in window, null, { timeout: 15_000 })
  await page.evaluate(() => {
    const g = (window as never as W).__game
    g.reset()
    g.store.setState({ data: { ...g.store.getState().data, hoto: 500 } }) // 建設可能に
    g.screen('facilities')
  })
  const hoto = () => page.evaluate(() => (window as never as W).__game.store.getState().data.hoto)
  expect(await hoto()).toBe(500)

  // 施設カードの主ボタンを押す — 従来は即建設。今は確認Sheetが開くだけ。
  const buildBtn = page.locator('button', { hasText: /建てる|普請/ }).first()
  await buildBtn.click()
  const confirmCta = page.locator('[data-testid="facility-build-confirm"]')
  await expect(confirmCta).toBeVisible({ timeout: 5000 })
  expect(await hoto(), '確認前は奉燈が減っていない').toBe(500)

  // 確認CTAで確定 → ここで初めて減る
  await confirmCta.click()
  await expect.poll(hoto, { timeout: 5000 }).toBeLessThan(500)
})
