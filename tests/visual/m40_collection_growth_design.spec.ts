// M40: 収集・育成・全戦闘オートを「一画面一判断」で読めることを、PC/mobileの実DOMで固定する。
import { expect, test, type Page } from '@playwright/test'
import { gotoBattle } from './helpers'

interface GameWindow {
  __game: {
    reset: () => void
    screen: (id: string) => void
    store: {
      getState: () => { data: unknown; screen: unknown }
      setState: (update: unknown) => void
    }
  }
}

async function bootScreen(page: Page, screen: unknown): Promise<void> {
  await page.goto('/')
  await page.waitForFunction(() => '__game' in window, null, { timeout: 15_000 })
  await page.evaluate((next) => {
    const game = (window as never as GameWindow).__game
    game.reset()
    game.store.setState({ screen: next })
  }, screen)
  await page.waitForTimeout(500)
}

test('宝具録: 810品を54棚へ圧縮し、PCは詳細併置・mobileはSheetで開く', async ({ page }) => {
  await bootScreen(page, { id: 'forge', tab: 'collection' })

  await expect(page.getByRole('heading', { name: '拾った物を、誰かが残した痕として綴る' })).toBeVisible()
  await expect(page.locator('.collection-shelf')).toHaveCount(54)
  await expect(page.locator('.collection-ledger-count')).toContainText('/ 810')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)

  const firstShelf = page.locator('.collection-shelf').first()
  if ((page.viewportSize()?.width ?? 0) <= 768) {
    await expect(page.locator('.collection-detail')).toHaveCount(0)
    await firstShelf.click()
    await expect(page.locator('[role="dialog"] .collection-detail')).toBeVisible()
    await expect(page.getByRole('button', { name: '次の棚 →' })).toBeVisible()
    await page.screenshot({ path: 'tests/visual/.shots/m40-collection-mobile.png', fullPage: true })
    await page.keyboard.press('Escape')
    await expect(page.locator('[role="dialog"]')).toBeHidden()
    await expect(firstShelf).toBeFocused()
  } else {
    await expect(page.locator('.collection-detail-pane .collection-detail')).toBeVisible()
    await expect(page.locator('.collection-ranks li')).toHaveCount(15)
    await page.screenshot({ path: 'tests/visual/.shots/m40-collection-pc.png', fullPage: true })
  }
})

test('家譜: 四つの収集入口から宝具系譜録へ一手で到達する', async ({ page }) => {
  await bootScreen(page, { id: 'chronicle' })
  await expect(page.locator('.collection-portal')).toHaveCount(4)
  await page.getByRole('button', { name: /宝具系譜録/ }).click()
  await expect(page.getByRole('tab', { name: '宝具録' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.item-collection')).toBeVisible()
})

test('鍛錬: 一人の役割・次の節目・次代と三つの推薦を読み、六能力は自由に選べる', async ({ page }) => {
  await bootScreen(page, { id: 'forge', tab: 'train' })
  const guidance = page.getByTestId('training-guidance')
  await expect(guidance).toBeVisible()
  await expect(guidance).toContainText('現在の戦型')
  await expect(guidance).toContainText('次の節目')
  await expect(guidance).toContainText('次代へ')
  await expect(page.locator('.training-recommendation')).toHaveCount(3)
  await expect(page.locator('.train-cell')).toHaveCount(6)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  await page.screenshot({
    path: `tests/visual/.shots/m40-training-${(page.viewportSize()?.width ?? 0) <= 768 ? 'mobile' : 'pc'}.png`,
    fullPage: true,
  })

  await page.locator('.training-recommendation').first().click()
  await expect(page.locator('.train-stepper')).toBeVisible()
  await expect(page.locator('.training-confirm-reason')).toBeVisible()
  await expect(page.locator('.training-confirm-inheritance')).toBeVisible()
})

test('全戦闘オート: 三方針を戦闘中に変更でき、停止条件なしでも利用できる', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('hitsugi_auto_policy'))
  await gotoBattle(page, { allies: 2, enemies: 2 })

  const policies = page.getByRole('radiogroup', { name: 'オートの方針' }).getByRole('radio')
  await expect(policies).toHaveCount(3)
  await expect(page.getByRole('radio', { name: '堅実' })).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('radio', { name: '全力' }).click()
  await expect(page.getByRole('radio', { name: '全力' })).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('radio', { name: '全力' }).press('ArrowLeft')
  await expect(page.getByRole('radio', { name: '温存' })).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('radio', { name: '温存' }).press('End')
  await expect(page.getByRole('radio', { name: '全力' })).toHaveAttribute('aria-checked', 'true')

  const auto = page.locator('.cmd-auto-persist')
  await expect(auto).toBeVisible()
  const directControls = page.locator('.cmd-auto-persist, .cmd-btn')
  expect(await directControls.count()).toBeGreaterThanOrEqual(6)
  for (let index = 0; index < await directControls.count(); index += 1) {
    const control = directControls.nth(index)
    await expect(control).toBeVisible()
    const box = await control.boundingBox()
    expect(box, `戦闘操作${index + 1}の矩形`).not.toBeNull()
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(
      box!.y + box!.height,
      `${(await control.textContent())?.trim() ?? `戦闘操作${index + 1}`} ${JSON.stringify(box)}`,
    ).toBeLessThanOrEqual(page.viewportSize()!.height)
  }
  await page.screenshot({
    path: `tests/visual/.shots/m40-auto-${(page.viewportSize()?.width ?? 0) <= 768 ? 'mobile' : 'pc'}.png`,
    fullPage: true,
  })

  await page.getByTitle('設定').click()
  const stopOptions = page.locator('.auto-stop-options button')
  await expect(stopOptions).toHaveCount(4)
  for (let index = 0; index < 4; index += 1) {
    await expect(stopOptions.nth(index)).toHaveAttribute('aria-pressed', 'false')
  }
  await page.keyboard.press('Escape')

  await auto.click()
  await expect(auto).toHaveAttribute('aria-pressed', 'true')
  await page.waitForTimeout(700)
  await page.evaluate(() => {
    const game = (window as never as GameWindow).__game
    const state = game.store.getState() as unknown as { battle: Record<string, unknown> }
    game.store.setState({ battle: { ...state.battle, phase: 'won' } })
  })
  const report = page.locator('.auto-battle-report')
  await expect(report).toContainText('方針 — 全力')
  await expect(report).toHaveAttribute('aria-live', 'polite')
  await expect(page.locator('.auto-battle-report p')).toHaveCount(2)
  await expect(page.getByRole('button', { name: 'ここで止める' })).toBeVisible()
  await page.getByRole('button', { name: 'ここで止める' }).click()
  await expect(report).toBeVisible()
})
