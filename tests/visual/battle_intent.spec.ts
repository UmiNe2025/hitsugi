// M25 §5: 敵の兆しが実戦闘で名札の上に表示されるか(入力番のみ)。
import { expect, test } from '@playwright/test'
import { gotoBattle } from './helpers'

test('敵の兆しバッジが生存敵の上に出る(攻/術/群のいずれか)', async ({ page }) => {
  await gotoBattle(page, { allies: 1, enemies: 3 })
  const badges = page.locator('.enemy-intent')
  await expect(badges.first()).toBeVisible({ timeout: 7000 })
  const n = await badges.count()
  expect(n).toBeGreaterThan(0)
  // 各バッジは 攻/術/群 のいずれかの文字を持つ(色だけに頼らない)
  for (let i = 0; i < n; i++) {
    const txt = (await badges.nth(i).innerText()).trim()
    expect(['攻', '術', '群']).toContain(txt)
  }
})
