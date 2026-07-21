import path from 'node:path'
import { expect, test } from '@playwright/test'

test('PC作業画面: ScreenShell本文と反復カードが横へ伸び切らない', async ({ page }, info) => {
  test.skip(!info.project.name.startsWith('pc-'), 'PC幅専用の読み幅回帰')
  await page.goto('/')
  await page.waitForFunction(() => '__game' in window, null, { timeout: 15_000 })
  await page.evaluate(() => {
    type Hook = { reset: () => void; screen: (id: string) => void }
    const game = (window as unknown as { __game: Hook }).__game
    game.reset()
    game.screen('chronicle')
  })

  const shellBody = page.locator('.shell-body')
  await expect(shellBody).toBeVisible()
  const bodyBox = await shellBody.boundingBox()
  expect(bodyBox, 'shell-body has a measurable width').toBeTruthy()
  expect(bodyBox!.width).toBeLessThanOrEqual(1042)

  await page.getByRole('tab', { name: '称号' }).click()
  const card = page.locator('.titles-grid > *').first()
  await expect(card).toBeVisible()
  const cardBox = await card.boundingBox()
  expect(cardBox, 'codex card has a measurable width').toBeTruthy()
  expect(cardBox!.width).toBeLessThanOrEqual(282)
})

test('PC郷ホーム: 家の座を中央へ綴じ、広幅でも枠を画面端まで伸ばさない', async ({ page }, info) => {
  test.skip(!info.project.name.startsWith('pc-'), 'PC幅専用の読み幅回帰')
  await page.goto('/')
  await page.waitForFunction(() => '__game' in window, null, { timeout: 15_000 })
  await page.evaluate(() => {
    type Hook = { reset: () => void; screen: (id: string) => void }
    const game = (window as unknown as { __game: Hook }).__game
    game.reset()
    game.screen('home')
  })

  const home = page.locator('.home-screen')
  const familyPanel = page.getByRole('heading', { name: '燈守家の一族' }).locator('..')
  await expect(home).toBeVisible()
  await expect(familyPanel).toBeVisible()

  const desktopBox = await home.boundingBox()
  expect(desktopBox, 'home-screen has a measurable width').toBeTruthy()
  expect(desktopBox!.x).toBeGreaterThanOrEqual(40)
  expect(desktopBox!.width).toBeLessThanOrEqual(1322)

  await page.setViewportSize({ width: 1920, height: 900 })
  const wideBox = await home.boundingBox()
  const panelBox = await familyPanel.boundingBox()
  expect(wideBox, 'ultrawide home-screen has a measurable width').toBeTruthy()
  expect(panelBox, 'family panel has a measurable width').toBeTruthy()
  expect(wideBox!.width).toBeLessThanOrEqual(1322)
  expect(wideBox!.x).toBeGreaterThanOrEqual(295)
  expect(panelBox!.x).toBeGreaterThan(wideBox!.x)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
  if (info.project.name === 'pc-1280') {
    await page.screenshot({
      path: path.join(process.cwd(), 'docs', 'qa', 'baselines', '20260721-m39-home-wide-pc-1920.png'),
      fullPage: true,
    })
  }
})
