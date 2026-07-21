// M25 §5: 敵の兆しが実戦闘で名札の上に表示されるか(入力番のみ)。
import { expect, test } from '@playwright/test'
import { gotoBattle } from './helpers'

test('敵の兆しが次の手・対象・対処を文字で示し、viewport外へ溢れない', async ({ page }) => {
  await gotoBattle(page, { allies: 1, enemies: 3 })
  const badges = page.locator('.enemy-intent')
  await expect(badges.first()).toBeVisible({ timeout: 7000 })
  const n = await badges.count()
  expect(n).toBeGreaterThan(0)
  // 各バッジは 攻/術/群 を先頭に持つ(色だけに頼らない)。序盤12種は二行目に対処も出す。
  for (let i = 0; i < n; i++) {
    const txt = (await badges.nth(i).innerText()).trim()
    expect(txt).toMatch(/^(攻|術|群)/)
    const label = await badges.nth(i).getAttribute('aria-label')
    if (await badges.nth(i).evaluate((node) => node.classList.contains('has-behavior'))) {
      expect(txt).toMatch(/[止受崩]/)
      expect(label).toMatch(/次の手.+危険度.+対象.+対処/)
    }
    const box = await badges.nth(i).boundingBox()
    const viewport = page.viewportSize()!
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width)
  }
})
