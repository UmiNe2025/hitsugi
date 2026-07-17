// M28-C: 回復薬(消耗品)のUI実測(契約Cの受入「戦闘で道具→HP回復・購入で在庫増」)。
// DOMクラスに極力依存せず、role名+自作クラス(.consum-cell)+store状態でassertする
// (戦闘コマンド盤はD=視覚改善が別途restyleするため、道具ボタンはrole名で掴む)。
import { expect, test } from '@playwright/test'
import { gotoBattle } from './helpers'

interface GW {
  __game: {
    reset: () => void
    screen: (id: string) => void
    store: {
      getState: () => {
        data: { hoto: number; consumables?: { id: string; count: number }[] }
        battle: { allies: { hp: number }[] } | null
      }
      setState: (u: unknown) => void
    }
  }
}
const countOf = (page: import('@playwright/test').Page, id: string) =>
  page.evaluate((i) => {
    const d = (window as never as GW).__game.store.getState().data
    return (d.consumables ?? []).find((s) => s.id === i)?.count ?? 0
  }, id)
const hotoOf = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as never as GW).__game.store.getState().data.hoto)

test('見世: 回復薬を購うと在庫が増え、奉燈が減る', async ({ page }) => {
  await page.goto('/')
  await page.waitForFunction(() => '__game' in window, null, { timeout: 15_000 })
  await page.evaluate(() => {
    const g = (window as never as GW).__game
    g.reset()
    g.screen('forge')
  })
  await page.locator('[role="tablist"]').first().waitFor({ state: 'visible' })
  await page.getByRole('tab', { name: '見世' }).click()

  const beforeCount = await countOf(page, 'araigusa') // 初期備え=3
  const beforeHoto = await hotoOf(page)
  // 洗い草の札の中の「購う」ボタンだけを押す(価格22)
  await page.locator('.consum-cell', { hasText: '洗い草' }).getByRole('button', { name: /購う/ }).click()

  expect(await countOf(page, 'araigusa'), '在庫が1増える').toBe(beforeCount + 1)
  expect(await hotoOf(page), '奉燈が価格分減る').toBe(beforeHoto - 22)
})

test('道具: 戦闘で回復薬を使うとHPが回復し、在庫が1減る', async ({ page }) => {
  await gotoBattle(page, { allies: 2, enemies: 2 })
  // 当主(allies[0])を負傷させて、回復が可視になるようにする
  await page.evaluate(() => {
    const st = (window as never as GW).__game.store
    const b = st.getState().battle!
    st.setState({ battle: { ...b, allies: b.allies.map((a, i) => (i === 0 ? { ...a, hp: 12 } : a)) } })
  })
  const hp0 = () => page.evaluate(() => (window as never as GW).__game.store.getState().battle!.allies[0].hp)
  const beforeHp = await hp0()
  const beforeCount = await countOf(page, 'araigusa') // 3

  // 道具コマンド → 洗い草 → 単体回復なので対象(味方)選択 → 数字キー1で当主
  await page.getByRole('button', { name: /道具/ }).click()
  await page.getByRole('button', { name: /洗い草/ }).click()
  await expect(page.getByText('授ける相手を選べ')).toBeVisible({ timeout: 3000 })
  await page.keyboard.press('1')

  expect(await countOf(page, 'araigusa'), '在庫が1減る(3→2)').toBe(beforeCount - 1)
  expect(await hp0(), 'HPが回復している').toBeGreaterThan(beforeHp)
})
