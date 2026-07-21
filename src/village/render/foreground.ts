import { Container, Graphics } from 'pixi.js'
import type { VillageVisualState } from '../../core/data/village_visual_state'

export const VILLAGE_FOREGROUND_OCCLUDERS = [
  { id: 'west-bough', x: 6.7, y: 7.1, entranceSafe: true, controlSafe: true },
  { id: 'east-eave', x: 17.0, y: 6.7, entranceSafe: true, controlSafe: true },
] as const

/** 人物だけが一瞬くぐる前景。施設入口、中央軸、DOM操作帯の上には置かない。 */
export function buildVillageForegroundV2(tile: number, crisis: boolean): Container {
  const layer = new Container()
  const west = new Graphics()
  west.moveTo(tile * 5.55, tile * 6.25)
    .bezierCurveTo(tile * 6.1, tile * 6.2, tile * 6.45, tile * 6.75, tile * 7.35, tile * 7.15)
    .stroke({ color: 0x05070d, width: tile * 0.22, alpha: 0.94 })
  west.poly([
    tile * 6.1, tile * 6.35,
    tile * 6.52, tile * 6.65,
    tile * 6.05, tile * 6.82,
    tile * 5.76, tile * 6.58,
  ]).fill({ color: 0x0b1117, alpha: 0.94 })
  west.poly([
    tile * 6.55, tile * 6.65,
    tile * 7.03, tile * 6.93,
    tile * 6.74, tile * 7.25,
    tile * 6.28, tile * 6.95,
  ]).fill({ color: 0x0d161c, alpha: 0.92 })
  layer.addChild(west)

  const east = new Graphics()
  east.poly([
    tile * 16.45, tile * 6.08,
    tile * 18.25, tile * 5.98,
    tile * 18.52, tile * 6.28,
    tile * 16.22, tile * 6.38,
  ]).fill({ color: 0x080a11, alpha: 0.94 })
  for (let i = 0; i < 4; i++) {
    east.poly([
      tile * (16.55 + i * 0.42), tile * 6.28,
      tile * (16.84 + i * 0.42), tile * 6.26,
      tile * (16.79 + i * 0.42), tile * (6.92 - (i % 2) * 0.08),
      tile * (16.58 + i * 0.42), tile * 6.86,
    ]).fill({ color: 0x151522, alpha: crisis ? 0.82 : 0.9 })
  }
  layer.addChild(east)
  return layer
}

/** lastReturnから得た今月限りの足跡・煤・傷布。衝突にもsaveにも関与しない。 */
export function buildVillageReturnTraceV2(tile: number, state: VillageVisualState): Graphics {
  const trace = new Graphics()
  const fresh = state.freshReturn
  if (!fresh) return trace

  const baseX = tile * 12.3
  const baseY = tile * 6.35
  for (let i = 0; i < Math.min(5, Math.max(2, fresh.partyCount)); i++) {
    const x = baseX + i * tile * 0.28
    const y = baseY + (i % 2) * tile * 0.12
    trace.ellipse(x, y, tile * 0.10, tile * 0.055)
      .fill({ color: 0x5d4938, alpha: 0.52 - i * 0.05 })
  }
  if (fresh.bossDown) {
    // 討伐品を焼き清めた跡。足跡だけではbefore/after差が読めないため、
    // 大燈籠の脇に「消えた火床」と残り火を一つ置く。
    trace.ellipse(tile * 12.82, tile * 6.78, tile * 0.48, tile * 0.18)
      .fill({ color: 0x090a0e, alpha: 0.9 })
    trace.ellipse(tile * 12.82, tile * 6.75, tile * 0.34, tile * 0.11)
      .fill({ color: 0x57515a, alpha: 0.66 })
    trace.moveTo(tile * 12.05, tile * 6.6)
      .quadraticCurveTo(tile * 12.6, tile * 6.88, tile * 13.18, tile * 6.62)
      .stroke({ color: 0x171316, width: tile * 0.08, alpha: 0.86 })
    trace.circle(tile * 12.66, tile * 6.69, tile * 0.035).fill({ color: 0xe8a33d, alpha: 0.72 })
    trace.circle(tile * 12.90, tile * 6.72, tile * 0.024).fill({ color: 0xc9a86a, alpha: 0.58 })
    trace.circle(tile * 13.03, tile * 6.68, tile * 0.02).fill({ color: 0xe8a33d, alpha: 0.48 })
  }
  if (fresh.injuredCount > 0) {
    trace.poly([
      tile * 13.05, tile * 6.48,
      tile * 13.48, tile * 6.60,
      tile * 13.34, tile * 6.78,
      tile * 12.94, tile * 6.66,
    ]).fill({ color: 0x7f3434, alpha: 0.58 })
  }
  return trace
}
