// M26 §14.3 / P0-12: 場面送りの誤タップ防止。本文クリックでは進まず、次へbutton/背景で進む。
import { expect, test } from '@playwright/test'

interface W {
  __game: {
    reset: () => void
    store: { setState: (u: unknown) => void }
  }
}

// 章シーン(LifeScene)を直接表示する — 複数行で beat 進行を観測できる
async function gotoLifeScene(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/')
  await page.waitForFunction(() => '__game' in window, null, { timeout: 15_000 })
  await page.evaluate(() => {
    const g = (window as never as W).__game
    g.reset()
    g.store.setState({
      screen: {
        id: 'life',
        title: '章',
        lines: [
          { speaker: '綴', text: '一行目。' },
          { speaker: '綴', text: '二行目。' },
          { speaker: '綴', text: '三行目。' },
        ],
      },
    })
  })
  await page.locator('.scene-screen').waitFor({ state: 'visible' })
}

test('章: 本文クリックでは頁が進まない(誤タップ防止)', async ({ page }) => {
  await gotoLifeScene(page)
  const lines = () => page.locator('.scene-body p').count()
  const before = await lines()
  // 本文(段落)を連打しても進まない
  await page.locator('.scene-body p').first().click()
  await page.locator('.scene-body p').first().click()
  await page.waitForTimeout(300)
  expect(await lines(), '本文クリックでは進行しない').toBe(before)
})

test('章: 「次へ」ページャで進む + 250msデバウンスが連打を捨てる', async ({ page }) => {
  await gotoLifeScene(page)
  const lines = () => page.locator('.scene-body p').count()
  const before = await lines()
  const next = page.getByRole('button', { name: /次|進|めくる|次へ/ }).first()
  // ページャの正確なラベルに依存しないよう、scene-pager内のbuttonを拾う
  const pager = page.locator('.scene-pager button, [class*="pager"] button').first()
  const target = (await pager.count()) ? pager : next
  await target.click()
  await page.waitForTimeout(300)
  expect(await lines(), '次へで1行進む').toBe(before + 1)
})
