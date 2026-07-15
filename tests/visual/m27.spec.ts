import { expect, test, type Page } from '@playwright/test'
import { snapshot } from './helpers'

// 2地域ぶんのPixi素材を冷キャッシュから読むため、既定30秒ではPCでも境界に触れる。
test.setTimeout(60_000)

interface M27GameWindow {
  __game: {
    dungeon: (opts: { regionId: string; floor?: number; party?: number }) => void
    rareBattle: (opts: { regionId: string; allies?: number }) => void
    store: {
      getState: () => {
        rareEncounter: null | { enemyName: string; drop: { name: string; source: string; rareOrigin?: string } }
      }
    }
  }
}

async function boot(page: Page): Promise<void> {
  await page.goto('/')
  await page.waitForFunction(() => '__game' in window, null, { timeout: 15_000 })
}

async function settle(page: Page): Promise<void> {
  await page.waitForTimeout(1_100)
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  )
}

test('地域を替えるとダンジョンの実描画が別の景観になる', async ({ page }, info) => {
  await boot(page)
  await page.evaluate(() => (window as unknown as M27GameWindow).__game.dungeon({
    regionId: 'hotarubi_no_kubochi', party: 1,
  }))
  await page.locator('.dungeon-canvas canvas').waitFor({ state: 'visible' })
  await settle(page)
  const fireMap = await page.screenshot()
  await snapshot(page, `m27-hotaru-${info.project.name}`)

  // 同じscreen idへの代入ではPixiアプリの再生成契機にならないため、新しいページ状態で比較する。
  await page.reload()
  await page.waitForFunction(() => '__game' in window, null, { timeout: 15_000 })
  await page.evaluate(() => (window as unknown as M27GameWindow).__game.dungeon({
    regionId: 'yumemaboroshi_no_yakata', party: 1,
  }))
  await page.locator('.dungeon-canvas canvas').waitFor({ state: 'visible' })
  await settle(page)
  const dreamMap = await page.screenshot()
  await snapshot(page, `m27-yume-${info.project.name}`)

  expect(fireMap.equals(dreamMap), '地域を替えても描画が完全一致している').toBe(false)
})

test('稀相戦で固有名と確定遺物の予告が実画面に出る', async ({ page }, info) => {
  await boot(page)
  await page.evaluate(() => (window as unknown as M27GameWindow).__game.rareBattle({
    regionId: 'hotarubi_no_kubochi', allies: 1,
  }))
  await settle(page)

  const rare = await page.evaluate(
    () => (window as unknown as M27GameWindow).__game.store.getState().rareEncounter,
  )
  expect(rare).not.toBeNull()
  expect(rare!.drop.source).toBe('rare')
  expect(rare!.drop.rareOrigin).toBe(rare!.enemyName)
  await expect(page.locator('.combatant-name', { hasText: rare!.enemyName })).toHaveCount(1)

  // 戦況帯は最新一行だけなので「記」を開き、遭遇名と報酬予告の両方を実DOMで確認する。
  await page.getByRole('button', { name: '記', exact: true }).waitFor({ state: 'visible' })
  await page.getByRole('button', { name: '記', exact: true }).click()
  await expect(page.locator('.log-full-body').getByText(
    `——白金の脈動。稀相の魔性「${rare!.enemyName}」が現れた!`,
  )).toBeVisible()
  await expect(page.locator('.log-full-body').getByText(
    `討ち果たせば、稀相遺物「${rare!.drop.name}」が残る。`,
  )).toBeVisible()
  await snapshot(page, `m27-rare-${info.project.name}`)
})
