// M8 / M26 §6: 郷の追従カメラ受入。ユーザー報告バグ(NPCが金色の立ち絵札で豆粒・盤面に見える)の是正確認。
import { expect, test } from '@playwright/test'
import { boxesOf, gotoVillage, snapshot } from './helpers'

// 主人公スプライトの world 高さ(engine の V_PLAYER_H = V_TILE*1.15)
const V_PLAYER_H = 46 * 1.15

test('郷: 主人公の見た目高さが56〜88px(§6.5) — 全景fitの豆粒を解消', async ({ page }, info) => {
  await gotoVillage(page)
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
