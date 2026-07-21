import { expect, test, type Page } from '@playwright/test'
import path from 'node:path'

interface UiGameWindow {
  __game: {
    screen: (id: string) => void
  }
}

const evidenceProjects = new Set(['pc-1280', 'mobile-390'])

async function bootTitle(page: Page): Promise<void> {
  await page.goto('/')
  await page.locator('.title-screen').waitFor({ state: 'visible' })
}

test('VC2 Title: five widths, first-start and damaged-save states remain actionable', async ({ page }, info) => {
  await bootTitle(page)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(page.locator('.title-save-state')).toContainText('まだない')
  await expect(page.getByRole('button', { name: 'はじめから' })).toBeVisible()
  await expect(page.locator('.game-title')).toBeFocused()
  expect(await page.locator('.game-title').evaluate((title) => getComputedStyle(title).outlineStyle)).toBe('none')
  await expect(page.locator('.title-screen svg.title-art')).toHaveCount(0)
  expect(await page.locator('.title-art-img').evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)

  await page.evaluate(() => {
    localStorage.setItem('hitsugi_save_v4', '{broken')
    localStorage.setItem('hitsugi_save_v4_bak', '[]')
  })
  await page.reload()
  await expect(page.locator('.title-save-state')).toContainText('読めない')
  await expect(page.getByRole('button', { name: 'つづきから' })).toHaveCount(0)
  await page.getByRole('button', { name: 'セーブの管理' }).click()
  await expect(page.locator('.title-save-state')).toContainText('ファイルから正常な控えを読み込む')

  const metrics = await page.evaluate(() => ({
    horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    controls: [...document.querySelectorAll<HTMLButtonElement>('.title-menu button')].map((button) => ({
      width: button.getBoundingClientRect().width,
      height: button.getBoundingClientRect().height,
    })),
  }))
  expect(metrics.horizontalOverflow).toBeLessThanOrEqual(0)
  expect(metrics.controls.every(({ width, height }) => width >= 44 && height >= 44)).toBe(true)

  if (evidenceProjects.has(info.project.name)) {
    await page.screenshot({
      path: path.join(process.cwd(), 'docs', 'qa', 'baselines', `20260721-vc2-title-damaged-${info.project.name}.png`),
      fullPage: true,
    })
  }
})

test('VC2 Intro: past pages remain reachable and latest page stays visible', async ({ page }, info) => {
  await bootTitle(page)
  await page.evaluate(() => {
    const game = (window as unknown as UiGameWindow).__game
    game.screen('intro')
  })
  await page.locator('.intro-screen').waitFor({ state: 'visible' })
  const next = page.getByRole('button', { name: /次の頁へ|郷へ進む/ })
  for (let i = 0; i < 10; i += 1) await next.click()

  await expect(page.locator('.intro-text p')).toHaveCount(11)
  await expect(page.locator('.intro-current')).toBeInViewport()
  await expect(page.getByRole('button', { name: '郷へ進む' })).toBeVisible()
  const metrics = await page.evaluate(() => {
    const transcript = document.querySelector<HTMLElement>('.intro-text')!
    return {
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      transcriptScrollable: transcript.scrollHeight > transcript.clientHeight,
    }
  })
  expect(metrics.horizontalOverflow).toBeLessThanOrEqual(0)
  if (info.project.name.startsWith('mobile')) expect(metrics.transcriptScrollable).toBe(true)

  if (evidenceProjects.has(info.project.name)) {
    await page.screenshot({
      path: path.join(process.cwd(), 'docs', 'qa', 'baselines', `20260721-vc2-intro-${info.project.name}.png`),
      fullPage: true,
    })
  }
})
