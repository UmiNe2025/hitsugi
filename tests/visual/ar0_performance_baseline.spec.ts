import { test, expect, type Page } from '@playwright/test'

interface DebugGame {
  reset: () => void
  screen: (id: string) => void
  village: () => void
  dungeon: (opts?: unknown) => void
  battle: (opts?: unknown) => void
}

interface FrameTelemetry {
  averageFps: number
  onePercentLowFps: number
  longFramesOver100ms: number
  estimatedLongFramesPerMinute: number
  sampleMs: number
}

async function boot(page: Page): Promise<void> {
  await page.goto('/')
  await page.waitForFunction(() => '__game' in window, null, { timeout: 15_000 })
  await page.evaluate(() => (window as unknown as { __game: DebugGame }).__game.reset())
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
}

async function sampleFrames(page: Page, sampleMs = 4_000): Promise<FrameTelemetry> {
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
      const longFrames = deltas.filter((value) => value > 100).length
      const elapsed = now - start
      resolve({
        averageFps: Number((1_000 / Math.max(mean, 0.001)).toFixed(1)),
        onePercentLowFps: Number((1_000 / Math.max(p99, 0.001)).toFixed(1)),
        longFramesOver100ms: longFrames,
        estimatedLongFramesPerMinute: Number((longFrames * 60_000 / Math.max(elapsed, 1)).toFixed(1)),
        sampleMs: Math.round(elapsed),
      })
    }
    requestAnimationFrame(tick)
  }), sampleMs)
}

async function resourceTelemetry(page: Page) {
  return page.evaluate(() => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    const byType = (suffixes: string[]) => resources
      .filter((entry) => suffixes.some((suffix) => new URL(entry.name).pathname.endsWith(suffix)))
      .reduce((sum, entry) => sum + (entry.transferSize || entry.encodedBodySize || 0), 0)
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory
    return {
      jsBytes: byType(['.js', '.tsx', '.ts']),
      cssBytes: byType(['.css']),
      imageBytes: byType(['.png', '.jpg', '.jpeg', '.webp', '.avif']),
      usedJsHeapBytes: memory?.usedJSHeapSize ?? null,
      resourceCount: resources.length,
    }
  })
}

test('AR0 reproducible performance telemetry', async ({ page }, info) => {
  test.setTimeout(120_000)
  const cdp = await page.context().newCDPSession(page)
  const mobileProxy = info.project.name.startsWith('mobile-')
  if (mobileProxy) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })

  const cases: Array<{ id: string; ready: string }> = [
    { id: 'home', ready: '.home-screen' },
    { id: 'pact', ready: '.pact-screen' },
    { id: 'village', ready: '.village-screen canvas' },
    { id: 'dungeon', ready: '.dungeon-screen canvas' },
    { id: 'battle', ready: '.battle-screen' },
  ]

  const results = []
  for (const item of cases) {
    await boot(page)
    const started = performance.now()
    await page.evaluate((id) => {
      const game = (window as unknown as { __game: DebugGame }).__game
      if (id === 'village') game.village()
      else if (id === 'dungeon') game.dungeon({ regionId: 'yoi_forest', floor: 0, party: 1 })
      else if (id === 'battle') game.battle({ allies: 1, enemies: 2 })
      else game.screen(id)
    }, item.id)
    await page.locator(item.ready).first().waitFor({ state: 'visible', timeout: 15_000 })
    await settle(page)
    const readyMs = performance.now() - started
    const frames = await sampleFrames(page)
    const resources = await resourceTelemetry(page)
    results.push({ screen: item.id, readyMs: Number(readyMs.toFixed(1)), frames, resources })
  }

  if (mobileProxy) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  const payload = {
    project: info.project.name,
    cpuThrottle: mobileProxy ? 4 : 1,
    browser: info.project.use.browserName ?? 'chromium',
    results,
  }
  console.log(`[ar0-perf] ${JSON.stringify(payload)}`)
  await info.attach('ar0-performance-baseline.json', {
    body: Buffer.from(JSON.stringify(payload, null, 2)),
    contentType: 'application/json',
  })
  expect(results).toHaveLength(5)
})
