import { expect, test, type Page } from '@playwright/test'

async function gotoPact(page: Page) {
  await page.goto('/')
  await page.waitForFunction(() => '__game' in window, null, { timeout: 15_000 })
  await page.evaluate(() => {
    const game = (window as unknown as {
      __game: { reset: () => void; screen: (id: string) => void }
    }).__game
    game.reset()
    game.screen('pact')
  })
  await page.locator('.char-card.clickable').first().click()
  await page.getByRole('button', { name: /欠け星の童/ }).click()
  await page.locator('.god-pane-img').waitFor({ state: 'visible' })
  await page.locator('.god-stage').scrollIntoViewIfNeeded()
  await page.waitForTimeout(150)
}

test('星契り: 神の3:4御影を切らず、奉納札まで同じ面で読める', async ({ page }, info) => {
  await gotoPact(page)

  const fit = await page.locator('.god-pane-img').evaluate((el) => {
    const img = el as HTMLImageElement
    const style = getComputedStyle(img)
    return {
      objectFit: style.objectFit,
      objectPosition: style.objectPosition,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
    }
  })
  expect(fit.complete).toBe(true)
  expect(fit.naturalWidth / fit.naturalHeight).toBeCloseTo(3 / 4, 2)
  expect(fit.objectFit).toBe('contain')
  expect(fit.objectPosition).toBe('50% 50%')
  await expect(page.locator('.god-pane-img')).toHaveAttribute('src', /god_kaboshi_v2\.jpg$/)

  const [pane, art, infoBox] = await Promise.all([
    page.locator('.god-pane').boundingBox(),
    page.locator('.god-pane-art').boundingBox(),
    page.locator('.god-pane-info').boundingBox(),
  ])
  expect(pane).not.toBeNull()
  expect(art).not.toBeNull()
  expect(infoBox).not.toBeNull()
  const vp = page.viewportSize()!
  if (vp.width > 820) {
    expect(infoBox!.x).toBeGreaterThanOrEqual(art!.x + art!.width - 1)
    expect(Math.abs(infoBox!.height - art!.height)).toBeLessThanOrEqual(2)
    expect(pane!.height).toBeLessThanOrEqual(422)
  } else {
    expect(infoBox!.y).toBeGreaterThanOrEqual(art!.y + art!.height - 1)
  }

  await expect(page.locator('.god-pane-eyebrow')).toHaveText('契りの御影')
  await expect(page.locator('.god-pane-info')).toContainText('欠け星の童')

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow, `横overflow (${info.project.name})`).toBeLessThanOrEqual(0)

  if (info.project.name === 'pc-1280' || info.project.name === 'mobile-390') {
    await page.screenshot({ path: `tests/visual/.shots/pact-m35-${info.project.name}.png` })
  }
})

test('星契り: 長い画面を最下部までスクロールでき、固定CTAの逃げが残る', async ({ page }) => {
  await gotoPact(page)
  const result = await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight)
    return new Promise<{ bottom: number; height: number; viewport: number; paddingBottom: number }>((resolve) => {
      requestAnimationFrame(() => {
        const screen = document.querySelector('.pact-screen') as HTMLElement
        resolve({
          bottom: window.scrollY + window.innerHeight,
          height: document.documentElement.scrollHeight,
          viewport: window.innerHeight,
          paddingBottom: Number.parseFloat(getComputedStyle(screen).paddingBottom),
        })
      })
    })
  })
  expect(result.height).toBeGreaterThan(result.viewport)
  expect(result.bottom).toBeGreaterThanOrEqual(result.height - 1)
  expect(result.paddingBottom).toBeGreaterThanOrEqual(96)
})
