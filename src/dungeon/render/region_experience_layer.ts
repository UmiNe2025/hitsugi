import { Container, Graphics } from 'pixi.js'
import type { RegionExperienceProfile } from '../../core/data/region_experience'
import type { TileKind } from '../types'
import { isWalkable } from '../types'
import type { DungeonTheme } from './theme'

interface PooledMark {
  graphic: Graphics
  x: number
  y: number
  phase: number
  span: number
}

export interface RegionPrimitiveRecipe {
  structuralKey: string
  materialPattern: number
  silhouetteVariant: number
  silhouetteTeeth: number
  navigationGlyph: number
  dangerGlyph: number
  ambientPool: number
}

export interface RegionExperienceStage {
  ground: Container
  mid: Container
  effects: Container
  setDangerTelegraph: (worldX: number, worldY: number, visible: boolean, rare: boolean) => void
  update: (elapsedMs: number, reducedMotion: boolean) => void
  budget: Readonly<{
    staticGraphics: number
    textures: 0
    landmarks: number
    navigationMarks: number
    telegraphs: 2
    ambient: number
    structuralKey: string
  }>
}

function hashText(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function resolveRegionPrimitiveRecipe(profile: RegionExperienceProfile): RegionPrimitiveRecipe {
  const structuralKey = [
    profile.groundMaterials.join('+'),
    profile.silhouette.profileId,
    profile.landmark.id,
    profile.navigationCue.id,
    profile.danger.cueId,
  ].join('|')
  const hash = hashText(structuralKey)
  return {
    structuralKey,
    materialPattern: hash % 7,
    silhouetteVariant: (hash >>> 3) % 4,
    silhouetteTeeth: 2 + ((hash >>> 6) % 5),
    navigationGlyph: (hash >>> 10) % 4,
    dangerGlyph: (hash >>> 13) % 4,
    // Preserve the authored relative density but keep the live pool bounded.
    ambientPool: Math.max(4, Math.min(10, Math.ceil(profile.ambientMotion.maxInstances / 4))),
  }
}
function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x1_0000_0000
  }
}

function collectWalkable(grid: TileKind[][]): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = []
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < (grid[y]?.length ?? 0); x++) {
      if (isWalkable(grid[y][x])) cells.push({ x, y })
    }
  }
  return cells
}

function findTile(grid: TileKind[][], kinds: readonly TileKind[]): { x: number; y: number } | null {
  for (const kind of kinds) {
    for (let y = 0; y < grid.length; y++) {
      const x = grid[y]?.indexOf(kind) ?? -1
      if (x >= 0) return { x, y }
    }
  }
  return null
}

function navigationPath(grid: TileKind[][]): { x: number; y: number }[] {
  const start = findTile(grid, ['entrance']) ?? collectWalkable(grid)[0]
  const goal = findTile(grid, ['stairs', 'boss', 'monument', 'shrine'])
  if (!start || !goal) return start ? [start] : []
  const width = Math.max(...grid.map((row) => row.length))
  const key = (x: number, y: number) => y * width + x
  const previous = new Map<number, number>([[key(start.x, start.y), -1]])
  const queue: { x: number; y: number }[] = [start]
  const goalKey = key(goal.x, goal.y)
  let found = -1
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const current = queue[cursor]
    const currentKey = key(current.x, current.y)
    if (currentKey === goalKey) {
      found = currentKey
      break
    }
    for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      const x = current.x + dx
      const y = current.y + dy
      const nextKey = key(x, y)
      if (!isWalkable(grid[y]?.[x] ?? 'wall') || previous.has(nextKey)) continue
      previous.set(nextKey, currentKey)
      queue.push({ x, y })
    }
  }
  if (found < 0) return [start]
  const reversed: { x: number; y: number }[] = []
  for (let current = found; current >= 0; current = previous.get(current) ?? -1) {
    reversed.push({ x: current % width, y: Math.floor(current / width) })
  }
  return reversed.reverse()
}

function findLandmarkSpot(grid: TileKind[][]): { x: number; y: number } | null {
  const entrance = findTile(grid, ['entrance'])
  if (!entrance) return null
  for (let radius = 2; radius <= 5; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = entrance.x + dx
        const y = entrance.y + dy
        if (grid[y]?.[x] !== 'wall') continue
        const open = [[0, 1], [1, 0], [0, -1], [-1, 0]].filter(
          ([ox, oy]) => isWalkable(grid[y + oy]?.[x + ox] ?? 'wall'),
        ).length
        if (open >= 2) return { x, y }
      }
    }
  }
  return entrance
}

function drawMaterialMark(
  graphic: Graphics,
  x: number,
  y: number,
  tile: number,
  pattern: number,
  color: number,
): void {
  const variant = pattern % 7
  if (variant === 0) {
    graphic.moveTo(x - tile * 0.28, y).quadraticCurveTo(x, y - tile * 0.12, x + tile * 0.28, y)
      .stroke({ color, width: 1, alpha: 0.18 })
  } else if (variant === 1) {
    graphic.circle(x - 4, y, 2.3).circle(x + 3, y - 2, 1.6).circle(x + 5, y + 3, 1.2)
      .fill({ color, alpha: 0.13 })
  } else if (variant === 2) {
    graphic.moveTo(x - tile * 0.32, y - 3).lineTo(x + tile * 0.32, y - 3)
      .moveTo(x - tile * 0.24, y + 4).lineTo(x + tile * 0.26, y + 4)
      .stroke({ color, width: 1.2, alpha: 0.18 })
  } else if (variant === 3) {
    graphic.moveTo(x - 7, y - 5).lineTo(x + 3, y - 8).lineTo(x + 8, y + 1).lineTo(x - 2, y + 7).closePath()
      .stroke({ color, width: 1, alpha: 0.16 })
  } else if (variant === 4) {
    graphic.moveTo(x - 8, y + 4).quadraticCurveTo(x - 2, y - 7, x + 1, y + 3)
      .quadraticCurveTo(x + 5, y - 5, x + 8, y + 4)
      .stroke({ color, width: 1.4, alpha: 0.18 })
  } else if (variant === 5) {
    graphic.moveTo(x - 8, y + 5).lineTo(x - 2, y - 5).lineTo(x + 1, y + 2).lineTo(x + 8, y - 3)
      .stroke({ color, width: 1.2, alpha: 0.18 })
  } else {
    graphic.ellipse(x, y, tile * 0.26, tile * 0.07).stroke({ color, width: 1, alpha: 0.16 })
  }
}

function drawNavigationGlyph(
  graphic: Graphics,
  x: number,
  y: number,
  dx: number,
  dy: number,
  variant: number,
  color: number,
): void {
  const sideX = -dy
  const sideY = dx
  const forwardX = dx * 6
  const forwardY = dy * 6
  if (variant === 0) {
    graphic.moveTo(x - sideX * 4 - forwardX, y - sideY * 4 - forwardY)
      .lineTo(x + forwardX, y + forwardY)
      .lineTo(x + sideX * 4 - forwardX, y + sideY * 4 - forwardY)
      .stroke({ color, width: 1.3, alpha: 0.34 })
  } else if (variant === 1) {
    graphic.ellipse(x, y, 5 + Math.abs(sideX) * 2, 3 + Math.abs(sideY) * 2)
      .stroke({ color, width: 1.1, alpha: 0.3 })
    graphic.moveTo(x, y).lineTo(x + forwardX, y + forwardY).stroke({ color, width: 1.2, alpha: 0.34 })
  } else if (variant === 2) {
    graphic.moveTo(x - sideX * 5, y - sideY * 5).lineTo(x + sideX * 5, y + sideY * 5)
      .moveTo(x - sideX * 3 + forwardX, y - sideY * 3 + forwardY)
      .lineTo(x + sideX * 3 + forwardX, y + sideY * 3 + forwardY)
      .stroke({ color, width: 1.2, alpha: 0.32 })
  } else {
    graphic.circle(x - sideX * 3, y - sideY * 3, 1.8).circle(x + sideX * 3, y + sideY * 3, 1.8)
      .fill({ color, alpha: 0.32 })
    graphic.moveTo(x, y).lineTo(x + forwardX, y + forwardY).stroke({ color, width: 1, alpha: 0.3 })
  }
}

function buildLandmarkSilhouette(
  profile: RegionExperienceProfile,
  recipe: RegionPrimitiveRecipe,
  theme: DungeonTheme,
  tile: number,
): Container {
  const node = new Container()
  const shadow = new Graphics().ellipse(0, 3, tile * 1.25, tile * 0.25)
    .fill({ color: 0x05070d, alpha: 0.62 })
  const body = new Graphics()
  const dark = theme.family === 'forest' ? 0x111c1a : theme.family === 'zaka' ? 0x191315 : theme.family === 'tani' ? 0x111520 : 0x130f1a
  const accent = theme.lanternTint
  const height = tile * (1.25 + recipe.silhouetteVariant * 0.15)
  const half = tile * (0.62 + recipe.silhouetteTeeth * 0.04)

  if (profile.macroBiome === 'wetland-border') {
    body.moveTo(-half, 0).quadraticCurveTo(-half * 0.8, -height, 0, -height * 0.78)
      .quadraticCurveTo(half * 0.8, -height, half, 0)
      .stroke({ color: dark, width: tile * 0.22, alpha: 0.98 })
    body.ellipse(0, 1, half * 0.9, tile * 0.13).fill({ color: theme.waterDeep, alpha: 0.9 })
  } else if (profile.macroBiome === 'stone-prayer-road') {
    body.moveTo(-half, 0).lineTo(-half * 0.72, -height).lineTo(half * 0.72, -height).lineTo(half, 0)
      .stroke({ color: dark, width: tile * 0.2, alpha: 0.98 })
    body.moveTo(-half, -height * 0.72).lineTo(half, -height * 0.72)
      .stroke({ color: accent, width: 1.4, alpha: 0.38 })
  } else if (profile.macroBiome === 'timber-city-remains') {
    body.moveTo(-half, -height * 0.7).lineTo(0, -height).lineTo(half, -height * 0.62)
      .lineTo(half * 0.72, 0).moveTo(-half * 0.72, 0).lineTo(-half, -height * 0.7)
      .stroke({ color: dark, width: tile * 0.19, alpha: 0.98 })
    body.moveTo(-half * 0.7, -height * 0.38).lineTo(half * 0.72, -height * 0.38)
      .stroke({ color: theme.stain, width: tile * 0.12, alpha: 0.92 })
  } else {
    body.moveTo(0, 0).lineTo(0, -height)
      .moveTo(0, -height * 0.82).lineTo(-half, -height * 0.5)
      .moveTo(0, -height * 0.68).lineTo(half, -height * 0.38)
      .stroke({ color: dark, width: tile * 0.2, alpha: 0.98 })
    body.circle(0, -height, tile * 0.18).stroke({ color: accent, width: 1.6, alpha: 0.5 })
  }

  for (let i = 0; i < recipe.silhouetteTeeth; i++) {
    const x = (i - (recipe.silhouetteTeeth - 1) / 2) * (half * 1.45 / Math.max(1, recipe.silhouetteTeeth - 1))
    const top = -height * (0.25 + ((i + recipe.silhouetteVariant) % 3) * 0.11)
    body.moveTo(x, 0).lineTo(x, top).stroke({ color: dark, width: 2.2, alpha: 0.9 })
  }
  node.addChild(shadow, body)
  return node
}

function drawDangerGlyph(graphic: Graphics, tile: number, variant: number, color: number): void {
  if (variant === 0) {
    graphic.ellipse(0, 0, tile * 0.52, tile * 0.17).stroke({ color, width: 1.8, alpha: 0.72 })
    graphic.moveTo(0, -tile * 0.84).lineTo(6, -tile * 0.66).lineTo(0, -tile * 0.5).lineTo(-6, -tile * 0.66).closePath()
      .stroke({ color, width: 1.6, alpha: 0.9 })
  } else if (variant === 1) {
    for (let i = 0; i < 3; i++) {
      const offset = (i - 1) * 7
      graphic.moveTo(offset - 4, -tile * 0.72).lineTo(offset, -tile * 0.5).lineTo(offset + 4, -tile * 0.72)
        .stroke({ color, width: 1.6, alpha: 0.82 })
    }
    graphic.ellipse(0, 0, tile * 0.46, tile * 0.14).stroke({ color, width: 1.5, alpha: 0.62 })
  } else if (variant === 2) {
    graphic.circle(0, -tile * 0.58, 7).stroke({ color, width: 1.8, alpha: 0.86 })
      .circle(0, -tile * 0.58, 2.4).fill({ color, alpha: 0.88 })
      .ellipse(0, 0, tile * 0.48, tile * 0.15).stroke({ color, width: 1.4, alpha: 0.65 })
  } else {
    graphic.moveTo(-10, -tile * 0.48).lineTo(-3, -tile * 0.72).lineTo(0, -tile * 0.48)
      .lineTo(5, -tile * 0.78).lineTo(10, -tile * 0.5)
      .stroke({ color, width: 2, alpha: 0.88 })
    graphic.ellipse(0, 0, tile * 0.5, tile * 0.16).stroke({ color, width: 1.5, alpha: 0.64 })
  }
}

function makeAmbientGraphic(kind: RegionExperienceProfile['ambientMotion']['kind'], color: number, tile: number): Graphics {
  const graphic = new Graphics()
  if (kind === 'rain') graphic.moveTo(0, -6).lineTo(-2, 6).stroke({ color, width: 1.2, alpha: 0.54 })
  else if (kind === 'ash') graphic.moveTo(-2, -2).lineTo(3, 0).lineTo(-1, 3).closePath().fill({ color, alpha: 0.5 })
  else if (kind === 'fog') graphic.moveTo(-tile, 0).quadraticCurveTo(0, -3, tile, 0).stroke({ color, width: 5, alpha: 0.08 })
  else if (kind === 'pollen') graphic.circle(-2, 1, 1.8).circle(3, -2, 1.1).fill({ color, alpha: 0.66 })
  else if (kind === 'stardust') graphic.moveTo(0, -4).lineTo(2, 0).lineTo(0, 4).lineTo(-2, 0).closePath().fill({ color, alpha: 0.76 })
  else graphic.moveTo(0, 4).quadraticCurveTo(3, 0, 0, -5).quadraticCurveTo(-3, 0, 0, 4).fill({ color, alpha: 0.8 })
  return graphic
}

/**
 * Code-native regional layer. It overlays only visual primitives and reads the
 * existing grid; it never mutates walkability, collision, encounters, or save data.
 */
export function buildRegionExperienceStage(
  grid: TileKind[][],
  tile: number,
  profile: RegionExperienceProfile,
  theme: DungeonTheme,
  seed: number,
  showLandmark: boolean,
  moteColor: number,
): RegionExperienceStage {
  const width = Math.max(...grid.map((row) => row.length)) * tile
  const height = grid.length * tile
  const recipe = resolveRegionPrimitiveRecipe(profile)
  const rand = seeded(seed ^ hashText(recipe.structuralKey))
  const walkable = collectWalkable(grid)
  const ground = new Container()
  const mid = new Container()
  const effects = new Container()

  const material = new Graphics()
  const sampled = [...walkable].sort((a, b) => ((a.x * 31 + a.y * 17 + seed) % 97) - ((b.x * 31 + b.y * 17 + seed) % 97))
  for (const cell of sampled.slice(0, Math.min(72, sampled.length))) {
    drawMaterialMark(material, (cell.x + 0.5) * tile, (cell.y + 0.68) * tile, tile, recipe.materialPattern, theme.grass)
  }

  const navGraphic = new Graphics()
  const path = navigationPath(grid)
  const markStep = Math.max(2, Math.ceil(path.length / 7))
  const navigationMarks = path
    .map((cell, index) => ({ cell, index }))
    .filter(({ index }) => index > 0 && index % markStep === 0)
    .slice(0, 7)
  for (const { cell, index } of navigationMarks) {
    const next = path[Math.min(path.length - 1, index + 1)] ?? cell
    drawNavigationGlyph(
      navGraphic,
      (cell.x + 0.5) * tile,
      (cell.y + 0.72) * tile,
      Math.sign(next.x - cell.x),
      Math.sign(next.y - cell.y),
      recipe.navigationGlyph,
      theme.lanternTint,
    )
  }
  ground.addChild(material, navGraphic)

  let landmarks = 0
  if (showLandmark) {
    const spot = findLandmarkSpot(grid)
    if (spot) {
      const landmark = buildLandmarkSilhouette(profile, recipe, theme, tile)
      landmark.position.set((spot.x + 0.5) * tile, (spot.y + 1) * tile)
      landmark.zIndex = landmark.y
      mid.zIndex = landmark.y
      mid.addChild(landmark)
      landmarks = 1
    }
  }

  const ambient: PooledMark[] = []
  for (let i = 0; i < recipe.ambientPool; i++) {
    const graphic = makeAmbientGraphic(profile.ambientMotion.kind, moteColor, tile)
    const mark = {
      graphic,
      x: rand() * width,
      y: rand() * height,
      phase: rand() * Math.PI * 2,
      span: tile * (0.7 + rand() * 1.2),
    }
    ambient.push(mark)
    effects.addChild(graphic)
  }

  const dangerNormal = new Graphics()
  drawDangerGlyph(dangerNormal, tile, recipe.dangerGlyph, theme.bossTint)
  dangerNormal.visible = false
  const dangerRare = new Graphics()
  drawDangerGlyph(dangerRare, tile, (recipe.dangerGlyph + 1) % 4, 0xffe1a0)
  dangerRare.visible = false
  effects.addChild(dangerNormal, dangerRare)

  const setDangerTelegraph = (worldX: number, worldY: number, visible: boolean, rare: boolean): void => {
    dangerNormal.visible = visible && !rare
    dangerRare.visible = visible && rare
    const active = rare ? dangerRare : dangerNormal
    active.position.set(worldX, worldY)
  }

  const update = (elapsedMs: number, reducedMotion: boolean): void => {
    for (let i = 0; i < ambient.length; i++) {
      const mark = ambient[i]
      if (reducedMotion) {
        mark.graphic.position.set(mark.x, mark.y)
        mark.graphic.alpha = profile.ambientMotion.kind === 'fog' ? 0.2 : 0.58
        continue
      }
      const phase = elapsedMs / 1000 + mark.phase
      if (profile.ambientMotion.kind === 'rain') {
        mark.graphic.position.set(mark.x, mark.y + ((elapsedMs * 0.08 + i * 29) % mark.span) - mark.span / 2)
      } else if (profile.ambientMotion.kind === 'ash') {
        mark.graphic.position.set(mark.x + Math.sin(phase * 0.8) * 9, mark.y + ((elapsedMs * 0.012 + i * 17) % mark.span) - mark.span / 2)
      } else if (profile.ambientMotion.kind === 'fog') {
        mark.graphic.position.set(mark.x + Math.sin(phase * 0.3) * mark.span, mark.y + Math.cos(phase * 0.2) * 3)
      } else if (profile.ambientMotion.kind === 'pollen') {
        mark.graphic.position.set(mark.x + Math.sin(phase) * 6, mark.y - ((elapsedMs * 0.008 + i * 13) % mark.span) + mark.span / 2)
      } else {
        mark.graphic.position.set(mark.x + Math.sin(phase) * 5, mark.y + Math.cos(phase * 0.7) * 4)
      }
      mark.graphic.alpha = profile.ambientMotion.kind === 'fog'
        ? 0.12 + Math.sin(phase * 0.4) * 0.03
        : 0.42 + Math.max(0, Math.sin(phase * 1.6)) * 0.36
    }
    for (const danger of [dangerNormal, dangerRare]) {
      if (!danger.visible) continue
      const pulse = reducedMotion ? 1 : 0.92 + Math.sin(elapsedMs / 280) * 0.08
      danger.scale.set(pulse)
      danger.alpha = reducedMotion ? 0.78 : 0.62 + Math.sin(elapsedMs / 360) * 0.2
    }
  }
  update(0, true)

  return {
    ground,
    mid,
    effects,
    setDangerTelegraph,
    update,
    budget: {
      staticGraphics: 2 + landmarks,
      textures: 0,
      landmarks,
      navigationMarks: navigationMarks.length,
      telegraphs: 2,
      ambient: ambient.length,
      structuralKey: recipe.structuralKey,
    },
  }
}
