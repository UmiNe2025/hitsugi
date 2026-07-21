import { expect, test, type Page } from '@playwright/test'

type VisualVersion = 'v1' | 'v2'

interface TelemetryGame {
  reset: () => void
  battle: (opts?: { allies?: number; enemies?: number }) => void
  screen: (id: string) => void
  store: {
    getState: () => {
      data: { family: { id: string; alive: boolean }[] }
      dungeonRun: unknown
      departDungeon: (regionId: string, partyIds: string[]) => void
    }
    setState: (state: Record<string, unknown>) => void
  }
}

interface FrameTelemetry {
  averageFps: number
  onePercentLowFps: number
  longFramesOver100ms: number
  sampleMs: number
}

async function sampleFrames(page: Page, sampleMs = 3_000): Promise<FrameTelemetry> {
  return page.evaluate((duration) => new Promise<FrameTelemetry>((resolve) => {
    const deltas: number[] = []
    let previous = performance.now()
    const start = previous
    const tick = (now: number) => {
      deltas.push(now - previous)
      previous = now
      if (now - start < duration) {
        requestAnimationFrame(tick)
        return
      }
      const sorted = [...deltas].sort((a, b) => a - b)
      const mean = deltas.reduce((sum, value) => sum + value, 0) / Math.max(1, deltas.length)
      const p99 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.99))] ?? 1_000
      resolve({
        averageFps: Number((1_000 / Math.max(mean, 0.001)).toFixed(1)),
        onePercentLowFps: Number((1_000 / Math.max(p99, 0.001)).toFixed(1)),
        longFramesOver100ms: deltas.filter((value) => value > 100).length,
        sampleMs: Math.round(now - start),
      })
    }
    requestAnimationFrame(tick)
  }), sampleMs)
}

async function recoveryResources(page: Page) {
  return page.evaluate(() => {
    const entries = (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
      .filter((entry) => entry.name.includes('/visual-recovery/'))
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory
    return {
      count: entries.length,
      bytes: entries.reduce((sum, entry) => sum + (entry.transferSize || entry.encodedBodySize || 0), 0),
      urls: entries.map((entry) => new URL(entry.name).pathname),
      usedJsHeapBytes: memory?.usedJSHeapSize ?? null,
    }
  })
}

async function boot(page: Page, version: VisualVersion): Promise<void> {
  await page.goto(`/?regionVisualV2=${version === 'v2' ? '1' : '0'}`)
  await page.waitForFunction(() => '__game' in window, null, { timeout: 15_000 })
  await page.evaluate(() => performance.clearResourceTimings())
}

test('AR1 V1/V2 headless telemetry for the vertical slice', async ({ page }, info) => {
  test.setTimeout(120_000)
  const cdp = await page.context().newCDPSession(page)
  const mobileProxy = info.project.name.startsWith('mobile-')
  if (mobileProxy) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })

  const results: unknown[] = []
  for (const version of ['v1', 'v2'] as const) {
    for (const screen of ['village', 'dungeon', 'battle'] as const) {
      await boot(page, version)
      const started = Date.now()
      await page.evaluate(({ screen }) => {
        const game = (window as unknown as { __game: TelemetryGame }).__game
        game.reset()
        if (screen === 'village') {
          game.screen('village')
          return
        }
        const id = game.store.getState().data.family.find((member) => member.alive)!.id
        game.store.getState().departDungeon('hotarubi_no_kubochi', [id])
        game.store.setState({ boonDraft: null })
        if (screen === 'battle') {
          const run = game.store.getState().dungeonRun
          game.battle({ allies: 1, enemies: 2 })
          game.store.setState({ dungeonRun: run })
        }
      }, { screen })
      const ready = screen === 'village'
        ? '.village-screen canvas'
        : screen === 'dungeon'
          ? '.dungeon-screen canvas'
          : '.battle-screen'
      await page.locator(ready).first().waitFor({ state: 'visible', timeout: 15_000 })
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
      results.push({
        version,
        screen,
        readyMs: Date.now() - started,
        frames: await sampleFrames(page),
        resources: await recoveryResources(page),
      })
    }
  }

  if (mobileProxy) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  const payload = {
    project: info.project.name,
    cpuThrottle: mobileProxy ? 4 : 1,
    results,
  }
  console.log(`[ar1-perf] ${JSON.stringify(payload)}`)
  await info.attach('ar1-performance-telemetry.json', {
    body: Buffer.from(JSON.stringify(payload, null, 2)),
    contentType: 'application/json',
  })
  expect(results).toHaveLength(6)
})
