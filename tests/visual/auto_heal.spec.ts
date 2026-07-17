// M32: オートの2挙動を固定する。
//  (1) 味方が瀕死(<35%)で回復薬を持つ時、オートは攻撃でなく回復薬を使う(理不尽死の防止)。
//  (2) 技/道具メニュー中にオートONにすると、メニューがrootへ戻る(選択が宙に浮く回帰の防止)。
import { expect, test } from '@playwright/test'
import { gotoBattle } from './helpers'

interface GW {
  __game: { store: { getState: () => {
    data: { consumables?: { id: string; count: number }[] }
    battle: { allies: { key: string; hp: number; maxHp: number }[] } | null
  }; setState: (u: unknown) => void } }
}

test('オート: 味方が瀕死で回復薬を持つ時、攻撃でなく回復薬を使う', async ({ page }) => {
  await gotoBattle(page, { allies: 2, enemies: 2 }) // newGame由来で araigusa×3 を所持
  // 当主(allies[0])を負傷(25% — 閾値35%を下回るが敵の一撃では死なない)にする
  await page.evaluate(() => {
    const st = (window as never as GW).__game.store
    const b = st.getState().battle!
    st.setState({ battle: { ...b, allies: b.allies.map((a, i) => (i === 0 ? { ...a, hp: Math.max(1, Math.round(a.maxHp * 0.25)) } : a)) } })
  })
  const snap = () => page.evaluate(() => {
    const s = (window as never as GW).__game.store.getState()
    return { hp0: s.battle!.allies[0].hp, araigusa: (s.data.consumables ?? []).find((c) => c.id === 'araigusa')?.count ?? 0 }
  })
  const before = await snap()
  await page.locator('.cmd-auto-persist').click() // オート開始
  await page.waitForTimeout(1200)
  const after = await snap()
  expect(after.hp0, '瀕死の味方が回復した').toBeGreaterThan(before.hp0)
  expect(after.araigusa, '回復薬が消費された').toBeLessThan(before.araigusa)
})

test('オート: 技メニュー中にONにするとメニューがrootへ戻る(PC — 技盤とオートが共存する幅)', async ({ page }) => {
  // モバイル(≤560px)では技盤が bottom-sheet(position:fixed / z-index:55)としてコマンド帯ごと覆う設計
  //(battle_m24.css @560)。その幅ではオート常設ボタンはシート裏に隠れ、「技盤を開いたままオートを押す」
  // 操作自体が起きない(「選ばず戻る」で戻る導線)。本テストが固定する共存挙動は >560px 専用。
  test.skip((page.viewportSize()?.width ?? 0) <= 560, 'モバイルは技盤がbottom-sheet — オート×技盤の共存はPC専用挙動')
  await gotoBattle(page, { allies: 2, enemies: 2 })
  await page.getByRole('button', { name: '技' }).click() // 技メニューを開く
  await expect(page.locator('.skill-panel')).toBeVisible()
  await page.locator('.cmd-auto-persist').click() // オートON
  await expect(page.locator('.skill-panel'), 'オートONでメニューが閉じる').toBeHidden()
})
