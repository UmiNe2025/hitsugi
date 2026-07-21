import { expect, test } from '@playwright/test'
import { boxesOf, snapshot } from './helpers'

interface GameWindow {
  __game: {
    reset: () => void
    screen: (id: string) => void
    store: {
      getState: () => { data: Record<string, unknown> }
      setState: (value: unknown) => void
    }
  }
}

async function bootScreen(page: import('@playwright/test').Page, id: string): Promise<void> {
  await page.goto('/')
  await page.waitForFunction(() => '__game' in window, null, { timeout: 15_000 })
  await page.evaluate((screenId) => {
    const game = (window as unknown as GameWindow).__game
    game.reset()
    game.screen(screenId)
  }, id)
  await page.locator('.shell').waitFor({ state: 'visible' })
}

async function expectNoPageOverflow(page: import('@playwright/test').Page): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow, '画面全体の横overflow').toBeLessThanOrEqual(1)
}

test('VC6: 年代記・拓本帳・普請図が固有surfaceを持ち、5幅で横溢れしない', async ({ page }, info) => {
  test.setTimeout(90_000)
  const routes = [
    ['chronicle', '.chronicle-book'],
    ['codex', '.codex-register'],
    ['facilities', '.facility-blueprint'],
  ] as const
  await bootScreen(page, routes[0][0])
  for (let i = 0; i < routes.length; i++) {
    const [id, surface] = routes[i]
    if (i > 0) {
      await page.evaluate((screenId) => (window as unknown as GameWindow).__game.screen(screenId), id)
      await page.locator(surface).waitFor({ state: 'visible' })
    }
    await expect(page.locator(surface)).toBeVisible()
    await expectNoPageOverflow(page)
    await snapshot(page, `vc6-${id}-${info.project.name}`)
  }
})

test('VC6: 普請図は一計画だけを作業面へ載せ、選択・不足・確認を分離する', async ({ page }) => {
  await bootScreen(page, 'facilities')
  await page.evaluate(() => {
    const game = (window as unknown as GameWindow).__game
    const data = game.store.getState().data
    game.store.setState({ data: { ...data, hoto: 0 } })
  })

  const tabs = page.locator('.facility-plan-tab')
  await expect(tabs).toHaveCount(4)
  await expect(page.locator('.facility-plan-tab[aria-selected="true"]')).toHaveCount(1)
  await expect(page.locator('.facility-active-plan .facility-card')).toHaveCount(1)
  for (const box of await boxesOf(page, '.facility-plan-tab')) expect(box.height, '普請tab 44px').toBeGreaterThanOrEqual(44)

  await tabs.nth(1).click()
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.facility-active-plan')).toContainText(/足りない|普請済み/)

  const opener = page.locator('.facility-build-btn:not([disabled])')
  if (await opener.count()) {
    await opener.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(page.locator('[data-testid="facility-build-confirm"]')).toBeDisabled()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(opener).toBeFocused()
  }
})

test('VC6: 設定SheetはEscape・外側clickで閉じ、起点へfocusを戻す', async ({ page }, info) => {
  await bootScreen(page, 'chronicle')
  const opener = page.getByTitle('設定')
  await opener.focus()
  await opener.click()
  await expect(page.getByRole('dialog', { name: /道具箱/ })).toBeVisible()
  if (info.project.name === 'pc-1280' || info.project.name === 'mobile-390') {
    await snapshot(page, `vc6-settings-${info.project.name}`)
  }
  await expect(page.getByRole('dialog').getByRole('button', { name: /閉じる/ })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(opener).toBeFocused()

  await opener.click()
  const backdrop = page.locator('[data-testid="sheet-backdrop"]')
  await backdrop.click({ position: { x: 2, y: 2 } })
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(opener).toBeFocused()
})

test('VC6: toastは非modal通知として読み上げられ、44px操作で閉じられる', async ({ page }, info) => {
  await bootScreen(page, 'chronicle')
  await page.evaluate(async () => {
    const modulePath = '/src/ui/toast.ts'
    const toast = await import(/* @vite-ignore */ modulePath) as {
      emitToast: (message: string, kind: 'info' | 'error') => void
    }
    toast.emitToast('星屑をひとつ拾った', 'info')
  })

  const notice = page.getByRole('status')
  await expect(notice).toContainText('星屑をひとつ拾った')
  const dismiss = notice.getByRole('button', { name: /通知.*を閉じる/ })
  const box = await dismiss.boundingBox()
  expect(box?.width).toBeGreaterThanOrEqual(44)
  expect(box?.height).toBeGreaterThanOrEqual(44)
  await dismiss.click()
  await expect(notice).toBeHidden()

  await page.evaluate(async () => {
    const modulePath = '/src/ui/toast.ts'
    const toast = await import(/* @vite-ignore */ modulePath) as {
      emitToast: (message: string, kind: 'info' | 'error') => void
    }
    toast.emitToast('記録を保存できません', 'error')
  })
  await expect(page.getByRole('alert')).toContainText('記録を保存できません')
  if (info.project.name === 'pc-1280' || info.project.name === 'mobile-390') {
    await page.waitForTimeout(350)
    await snapshot(page, `vc6-toast-${info.project.name}`)
  }
})

test('VC6: 家系巻物は選択状態を読み上げ、外側clickで元の操作へ戻る', async ({ page }) => {
  await bootScreen(page, 'chronicle')
  const opener = page.getByRole('button', { name: '家系図を見る' })
  await opener.click()
  const dialog = page.getByRole('dialog', { name: '家系図' })
  await expect(dialog).toBeVisible()
  await expect(page.locator('.familytree-result-count')).toContainText(/人|代/)

  const node = page.locator('[data-testid="familytree-node"]').first()
  if (await node.count()) {
    await node.click()
    await expect(node).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.familytree-detail-band')).toBeVisible()
  }

  await page.locator('.familytree-backdrop').click({ position: { x: 2, y: 2 } })
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()
})

test('VC6: 図鑑の選択は詳細面へ到達し、新着0件を空白にしない', async ({ page }) => {
  await bootScreen(page, 'codex')
  await page.evaluate(() => {
    const game = (window as unknown as GameWindow).__game
    const data = game.store.getState().data
    game.store.setState({
      data: {
        ...data,
        codex: { ...((data.codex as object | undefined) ?? {}), enemies: ['chochin_kui'] },
        codexSeenIds: { enemies: [], gods: [] },
      },
    })
  })
  await page.getByRole('tab', { name: /魔性/ }).click()
  const card = page.locator('.codex-card-btn').first()
  await card.click()
  await expect(card).toHaveAttribute('aria-current', 'true')
  await expect(page.locator('.codex-detail-panel')).toContainText('提灯喰い')
  await expectNoPageOverflow(page)
})
