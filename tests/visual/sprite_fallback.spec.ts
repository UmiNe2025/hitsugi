// M-A(2026-07-17): 老い姿/幼子スプライトのフォールバック回帰テスト。
// M23工場汚染の walke_/walkc_ 144枚は assets_src/quarantine_sprites_m23/ へ退避済み。
// elder(月齢21)の当主でもダンジョン/郷の主人公が成人姿フォールバックでエラーなく描画されること。
// (ユーザー報告「マップ上の金色人型」= 汚染スプライトが主人公として描画されていた実害の再発防止)
import { expect, test } from '@playwright/test'

interface W {
  __game: {
    reset: () => void
    dungeon: (o: unknown) => void
    village: () => void
    store: { getState: () => { data: { family: { id: string; bornSeason: number }[]; seasonIndex: number } }; setState: (u: unknown) => void }
  }
}

for (const scene of ['dungeon', 'village'] as const) {
  test(`elder当主の${scene} — 成人姿フォールバックでエラーなく描画`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/')
    await page.waitForFunction(() => '__game' in window, null, { timeout: 15_000 })
    await page.evaluate((s) => {
      const g = (window as never as W).__game
      g.reset()
      // 当主を月齢21(elder)にする: bornSeason を 21季前へ
      const st = g.store.getState()
      const d = st.data
      const family = d.family.map((c, i) => (i === 0 ? { ...c, bornSeason: d.seasonIndex - 21 } : c))
      g.store.setState({ data: { ...d, family } })
      if (s === 'dungeon') g.dungeon({ regionId: 'tourou_kuzure_michi', floor: 0 })
      else g.village()
    }, scene)
    await page.locator('canvas').first().waitFor({ state: 'visible' })
    await page.waitForTimeout(1400)
    expect(errors, `pageerror: ${errors.join(' | ').slice(0, 200)}`).toEqual([])
    // 汚染スプライト(walke_)が「画像として」配信されていないこと(退避の実効性)。
    // vite devは欠落ファイルにSPAフォールバック(200+text/html)を返すため、okではなく
    // content-typeで判定する(Pixi側もHTMLはPNGデコード失敗→成人姿へ退避する)。
    const servedAsImage = await page.evaluate(async () => {
      try {
        const r = await fetch('img/sprites/walke_homura_m_down_1.png')
        return r.ok && (r.headers.get('content-type') ?? '').startsWith('image')
      } catch {
        return false
      }
    })
    expect(servedAsImage, 'walke_ は画像として配信されない(退避済み)').toBe(false)
  })
}
