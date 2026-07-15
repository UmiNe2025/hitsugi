// M26 Phase0 §15.1: WorkspaceTabs の WAI-ARIA tabs 準拠を実ブラウザで検証。
// 図鑑(codex)画面はタブ(魔性/星神/縁起/宿敵)を持ち、新規ゲームでも描画される。
import { expect, test } from '@playwright/test'

async function gotoCodex(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/')
  await page.waitForFunction(() => '__game' in window, null, { timeout: 15_000 })
  await page.evaluate(() => {
    const g = (window as never as { __game: { reset: () => void; screen: (id: string) => void } }).__game
    g.reset()
    g.screen('codex')
  })
  await page.locator('[role="tablist"]').first().waitFor({ state: 'visible' })
}

test('WorkspaceTabs: tablist/tab の role と aria 関連付け', async ({ page }) => {
  await gotoCodex(page)
  const tabs = page.locator('[role="tab"]')
  const n = await tabs.count()
  expect(n).toBeGreaterThanOrEqual(2)

  // 選択中は1つだけ、aria-selected と roving tabIndex(選択=0/他=-1)が整合
  let selected = 0
  for (let i = 0; i < n; i++) {
    const t = tabs.nth(i)
    const isSel = (await t.getAttribute('aria-selected')) === 'true'
    const tabindex = await t.getAttribute('tabindex')
    expect(await t.getAttribute('aria-controls'), 'aria-controls').toBe('ws-tabpanel')
    expect(await t.getAttribute('id'), 'tab id').toMatch(/^ws-tab-/)
    expect(tabindex, `roving tabindex(${i})`).toBe(isSel ? '0' : '-1')
    if (isSel) selected++
  }
  expect(selected, '選択中タブは1つ').toBe(1)

  // パネルが存在し、選択中タブへ aria-labelledby で紐づく
  const panel = page.locator('#ws-tabpanel')
  await expect(panel).toHaveAttribute('role', 'tabpanel')
  const selId = await page.locator('[role="tab"][aria-selected="true"]').first().getAttribute('id')
  expect(await panel.getAttribute('aria-labelledby')).toBe(selId)
})

test('WorkspaceTabs: 矢印キーで選択とフォーカスが移動する(§15.1)', async ({ page }) => {
  await gotoCodex(page)
  const tabs = page.locator('[role="tab"]')
  const first = tabs.nth(0)
  const second = tabs.nth(1)

  await first.focus()
  await expect(first).toBeFocused()
  await page.keyboard.press('ArrowRight')
  // 自動選択: 2番目が選択+フォーカス
  await expect(second).toBeFocused()
  await expect(second).toHaveAttribute('aria-selected', 'true')
  await expect(first).toHaveAttribute('aria-selected', 'false')

  // Home で先頭へ戻る
  await page.keyboard.press('Home')
  await expect(first).toBeFocused()
  await expect(first).toHaveAttribute('aria-selected', 'true')

  // End で末尾へ
  await page.keyboard.press('End')
  await expect(tabs.nth((await tabs.count()) - 1)).toBeFocused()
})
