// M8 / M26 §6: 郷の追従カメラ受入。ユーザー報告バグ(NPCが金色の立ち絵札で豆粒・盤面に見える)の是正確認。
import { expect, test } from '@playwright/test'
import type { GameData } from '../../src/core/types'
import { boxesOf, crossings, gotoVillage, snapshot } from './helpers'

// 主人公スプライトの world 高さ(engine の V_PLAYER_H = V_TILE*1.15)
const V_PLAYER_H = 46 * 1.15

test('郷: 主人公の見た目高さが56〜88px(§6.5) — 全景fitの豆粒を解消', async ({ page }, info) => {
  const recoveryRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/visual-recovery/village/')) recoveryRequests.push(request.url())
  })
  await gotoVillage(page)
  await expect(page.locator('.village-screen')).toHaveAttribute('data-village-visual', 'v2')
  await expect(page.locator('.village-host')).toHaveAttribute('data-ground-pattern', 'raster-painted-village')
  await expect(page.locator('.village-host')).toHaveAttribute('data-environment-material', 'raster-painted-village')
  expect(recoveryRequests.length).toBeGreaterThanOrEqual(1)
  await snapshot(page, `village-${info.project.name}`)
  // canvas内スプライトは boundingBox で測れないため、engine が host に公開した実scaleから算出する。
  const scale = await page.locator('.village-host').evaluate(
    (el) => Number((el as HTMLElement).dataset.camScale ?? 'NaN'),
  )
  const playerPx = V_PLAYER_H * scale
  info.annotations.push({ type: 'measure', description: `主人公 ${playerPx.toFixed(1)}px (scale ${scale.toFixed(3)})` })
  expect(playerPx).toBeGreaterThanOrEqual(56)
  expect(playerPx).toBeLessThanOrEqual(88)
})

test('郷: 明示OFFなら旧表示に戻り、visual-recovery素材を要求しない', async ({ page }) => {
  const recoveryRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/visual-recovery/village/')) recoveryRequests.push(request.url())
  })
  await page.goto('/?regionVisualV2=0')
  await page.waitForFunction(() => '__game' in window, null, { timeout: 15_000 })
  await page.evaluate(() => {
    type Hook = { reset: () => void; screen: (id: string) => void }
    const game = (window as unknown as { __game: Hook }).__game
    game.reset()
    game.screen('village')
  })
  await expect(page.locator('.village-screen')).toHaveAttribute('data-village-visual', 'v1')
  await expect(page.locator('.village-host')).toHaveAttribute('data-ground-pattern', 'tile-grid')
  expect(recoveryRequests).toEqual([])
})

test('郷: 「見渡す」ボタンが44px以上(§15.3)でaria-labelを持つ', async ({ page }) => {
  await gotoVillage(page)
  const survey = page.locator('.village-survey')
  await expect(survey).toBeVisible()
  await expect(survey).toHaveAttribute('aria-label', /見渡す/)
  const box = (await boxesOf(page, '.village-survey'))[0]
  expect(box, '見渡すボタンが可視で寸法を持つ').toBeTruthy()
  expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44)
})

test('郷: D-pad各方向にaria-labelがある(§6.4)', async ({ page }) => {
  await gotoVillage(page)
  const labels = await page.locator('.dpad-btn').evaluateAll((els) =>
    els.map((e) => e.getAttribute('aria-label')),
  )
  expect(labels.length).toBeGreaterThanOrEqual(4)
  expect(labels.every((l) => l && /上|下|左|右/.test(l))).toBe(true)
})

test('郷: 近接対象は一つの大buttonで、D-padとの矩形交差が0', async ({ page }) => {
  await gotoVillage(page)
  const action = page.locator('[data-zone="village-action"]')
  await expect(action).toBeVisible()
  await expect(action).toHaveRole('button')
  const [actions, dpad] = await Promise.all([
    boxesOf(page, '[data-zone="village-action"]'),
    boxesOf(page, '[data-zone="dpad"]'),
  ])
  expect(actions).toHaveLength(1)
  expect(dpad).toHaveLength(1)
  expect(actions[0].height).toBeGreaterThanOrEqual(48)
  expect(crossings(actions, dpad), '近接行動×D-pad').toEqual([])
})

test('郷: 会話中はD-padを非表示にして誤移動を防ぐ', async ({ page }) => {
  await gotoVillage(page)
  await page.getByRole('button', { name: '豆腐屋', exact: true }).click()
  await expect(page.locator('.village-talk')).toBeVisible()
  await expect(page.locator('[data-zone="dpad"]')).toHaveCount(0)
})

test('AR1 郷V2: continuous groundとfresh return traceをDOM hookで識別できる', async ({ page }, info) => {
  await page.goto('/?regionVisualV2=1')
  await page.waitForFunction(() => '__game' in window, null, { timeout: 15_000 })
  await page.evaluate(() => {
    type Hook = {
      store: {
        getState: () => { data: GameData | null }
        setState: (next: { data: GameData }) => void
      }
      reset: () => void
      screen: (id: string) => void
    }
    const game = (window as unknown as { __game: Hook }).__game
    game.reset()
    const data = game.store.getState().data!
    const head = data.family[0]
    game.store.setState({
      data: {
        ...data,
        family: [head, { ...head, id: `${head.id}-heir`, name: '継', isHead: false }],
        narrative: {
          ...(data.narrative ?? {} as GameData['narrative']),
          lastReturn: {
            id: 'ar1-return-trace', season: data.seasonIndex - 1, regionId: 'hotarubi_no_kubochi',
            partyIds: [head.id], injuredIds: [head.id], bossDown: true,
          },
        } as NonNullable<GameData['narrative']>,
      },
    })
    game.screen('village')
  })
  const screen = page.locator('.village-screen')
  await expect(screen).toHaveAttribute('data-village-visual', 'v2')
  await expect(screen).toHaveAttribute('data-village-life-state', 'normal')
  await expect(screen).toHaveAttribute('data-village-return-trace', 'scarred-victory')
  const host = page.locator('.village-host')
  await expect(host).toHaveAttribute('data-ground-pattern', 'raster-painted-village')
  await expect(host).toHaveAttribute('data-environment-material', 'raster-painted-village')
  await expect(host).toHaveAttribute('data-return-trace', 'scarred-victory')
  await expect(host).toHaveAttribute('data-facade-total', '0')
  await expect(host).toHaveAttribute('data-facade-resolved', '0')
  await expect(host).toHaveAttribute('data-facade-placeholder', '0')
  await expect(host).toHaveAttribute('data-facade-mismatch', '0')
  await expect(host).toHaveAttribute('data-facade-coverage', 'environment-plate')
  await expect(host).toHaveAttribute('data-portrait-pin-policy', 'proximity-only')
  expect(Number(await host.getAttribute('data-portrait-pin-count'))).toBeLessThanOrEqual(1)

  // このspecはplaywright.configの1440/1280/768/390/360全projectで実行される。
  const overflow = await page.locator('.village-screen').evaluate(
    (el) => Math.max(0, el.scrollWidth - el.clientWidth),
  )
  expect(overflow, `AR1R-A横overflow (${info.project.name})`).toBe(0)

  const [actions, dpad] = await Promise.all([
    boxesOf(page, '[data-zone="village-action"]'),
    boxesOf(page, '[data-zone="dpad"]'),
  ])
  expect(actions.length).toBeLessThanOrEqual(1)
  expect(dpad).toHaveLength(1)
  expect(crossings(actions, dpad), `AR1R-A action×D-pad (${info.project.name})`).toEqual([])

  // 全5施設を同時確認するcomplete-frameは、既存「見渡す」hold経路をそのまま使う。
  await page.locator('.village-survey').dispatchEvent('pointerdown')
  await expect(host).toHaveAttribute('data-camera-mode', 'survey')
  await page.waitForTimeout(350)
  await snapshot(page, `village-ar1-v2-${info.project.name}`)
  await page.locator('.village-survey').dispatchEvent('pointerup')
})
