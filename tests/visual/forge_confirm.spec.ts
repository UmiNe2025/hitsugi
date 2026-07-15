// M26 §7.4 / §20: 血潮鍛錬は「確認Sheet前に血珠を消費しない」。連打即消費(P0-03)の是正確認。
import { expect, test } from '@playwright/test'

interface ForgeWin {
  __game: {
    reset: () => void
    screen: (id: string) => void
    store: { getState: () => { data: { ketsu: number } }; setState: (u: unknown) => void }
  }
}

async function gotoForgeTrain(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/')
  await page.waitForFunction(() => '__game' in window, null, { timeout: 15_000 })
  await page.evaluate(() => {
    const g = (window as never as ForgeWin).__game
    g.reset()
    // 血珠を潤沢に与える(鍛錬セルを有効化するため)
    g.store.setState({ data: { ...g.store.getState().data, ketsu: 100 } })
    g.screen('forge')
  })
  await page.locator('[role="tablist"]').first().waitFor({ state: 'visible' })
  await page.getByRole('tab', { name: '鍛錬' }).click()
}

test('鍛錬: セルを押しても確認前は血珠が減らない → 確定で初めて減る', async ({ page }) => {
  await gotoForgeTrain(page)
  const ketsu = () => page.evaluate(() => (window as never as ForgeWin).__game.store.getState().data.ketsu)
  expect(await ketsu()).toBe(100)

  // 鍛錬セル(能力)を1つ押す — 従来は即-5。今は確認Sheetが開くだけ。
  await page.locator('.train-cell').first().click()
  await expect(page.locator('.train-stepper')).toBeVisible()
  expect(await ketsu(), '確認前に血珠が減っていない').toBe(100)

  // 「やめる」で閉じても減らない(確認欄のやめる — Sheet閉じるボタンと同名のため範囲を限定)
  await page.locator('.confirm-actions').getByRole('button', { name: 'やめる' }).click()
  expect(await ketsu(), 'やめるで消費なし').toBe(100)

  // 再度開いて確定 → ここで初めて減る(1回=珠5)
  await page.locator('.train-cell').first().click()
  await page.getByRole('button', { name: /鍛える/ }).click()
  await expect.poll(ketsu, { timeout: 5000 }).toBeLessThan(100)
})

test('鍛錬ステッパー: 回数を増やすと総費用が増える', async ({ page }) => {
  await gotoForgeTrain(page)
  await page.locator('.train-cell').first().click()
  const cta = page.getByRole('button', { name: /鍛える/ })
  const cost1 = await cta.textContent()
  await page.getByRole('button', { name: '回数を増やす' }).click()
  const cost2 = await cta.textContent()
  expect(cost1).toMatch(/珠5/)
  expect(cost2).toMatch(/珠10/)
})
