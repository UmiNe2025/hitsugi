// M25 §9.3 性能実測 — ダンジョン/戦闘の10秒平均fps。
// M2エージェントが「PC/tabletでPixi描画が4〜7fps、boundingBoxがタイムアウトする」と報告した。
// これは受入(PC 55fps / モバイル 30fps)に直結する重大事なので、指揮側が実測で確定させる。
import { test } from '@playwright/test'
import { gotoBattle, gotoDungeon } from './helpers'

async function measureFps(page: import('@playwright/test').Page, ms = 4000): Promise<number> {
  return page.evaluate(
    (dur) =>
      new Promise<number>((resolve) => {
        let frames = 0
        const t0 = performance.now()
        const tick = () => {
          frames++
          if (performance.now() - t0 >= dur) resolve((frames / (performance.now() - t0)) * 1000)
          else requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }),
    ms,
  )
}

test('ダンジョン 10秒平均fps', async ({ page }, info) => {
  await gotoDungeon(page)
  const fps = await measureFps(page)
  info.annotations.push({ type: 'fps', description: `dungeon ${info.project.name}: ${fps.toFixed(1)} fps` })
  console.log(`[fps] dungeon ${info.project.name}: ${fps.toFixed(1)}`)
})

test('戦闘 10秒平均fps', async ({ page }, info) => {
  await gotoBattle(page, { allies: 1, enemies: 2 })
  const fps = await measureFps(page)
  info.annotations.push({ type: 'fps', description: `battle ${info.project.name}: ${fps.toFixed(1)} fps` })
  console.log(`[fps] battle ${info.project.name}: ${fps.toFixed(1)}`)
})
