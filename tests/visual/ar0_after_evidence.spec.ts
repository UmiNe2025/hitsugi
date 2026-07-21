import { test, expect, type Page } from '@playwright/test'
import path from 'node:path'
import { gotoBattle, gotoDungeon, gotoVillage } from './helpers'

interface DebugGame {
  reset: () => void
  screen: (id: string) => void
}

const evidenceProjects = new Set(['pc-1280', 'mobile-390'])

async function gotoScreen(page: Page, screen: 'home' | 'pact'): Promise<void> {
  await page.goto('/')
  await page.waitForFunction(() => '__game' in window, null, { timeout: 15_000 })
  await page.evaluate((id) => {
    const game = (window as unknown as { __game: DebugGame }).__game
    game.reset()
    game.screen(id)
  }, screen)
  await page.locator(`.${screen}-screen`).waitFor({ state: 'visible' })
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
}

async function verifyScreen(page: Page, screen: string, project: string): Promise<void> {
  if (evidenceProjects.has(project)) {
    const target = path.join(process.cwd(), 'docs', 'qa', 'baselines', `20260721-${screen}-${project}-after-ar0.png`)
    await page.screenshot({ path: target, fullPage: true })
  }
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }))
  expect(overflow.scrollWidth, `${screen} ${project} horizontal overflow`).toBeLessThanOrEqual(overflow.clientWidth)
}

test('AR0 five-screen after evidence', async ({ page }, info) => {
  test.setTimeout(120_000)

  await gotoScreen(page, 'home')
  await verifyScreen(page, 'home', info.project.name)

  await gotoScreen(page, 'pact')
  await verifyScreen(page, 'pact', info.project.name)

  await gotoVillage(page)
  await verifyScreen(page, 'village', info.project.name)

  await gotoDungeon(page, { regionId: 'yoi_forest', floor: 0, party: 1 })
  await verifyScreen(page, 'dungeon', info.project.name)

  await gotoBattle(page, { allies: 1, enemies: 2 })
  await verifyScreen(page, 'battle-1v2', info.project.name)
})
