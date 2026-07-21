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
