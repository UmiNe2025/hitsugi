import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()

function filesUnder(dir: string, suffix: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return filesUnder(path, suffix)
    return entry.name.endsWith(suffix) ? [path] : []
  })
}

describe('world art media boundary', () => {
  it('keeps inline SVG only in functional diagrams, meters, and battle information', () => {
    const uiRoot = join(ROOT, 'src', 'ui')
    const svgOwners = filesUnder(uiRoot, '.tsx')
      .filter((path) => readFileSync(path, 'utf8').includes('<svg'))
      .map((path) => relative(uiRoot, path).replaceAll('\\', '/'))
      .sort()

    expect(svgOwners).toEqual([
      'Battle.tsx',
      'Dungeon.tsx',
      'FamilyTree.tsx',
      'layout/shell.tsx',
    ])
  })

  it('does not ship standalone SVG as scenery, portraits, enemies, or maps', () => {
    const publicRoot = join(ROOT, 'public')
    const svgAssets = filesUnder(publicRoot, '.svg')
      .map((path) => relative(publicRoot, path).replaceAll('\\', '/'))
      .sort()

    expect(svgAssets).toEqual(['favicon.svg', 'icons.svg'])
  })

  it('does not restore the removed vector-art fallbacks', () => {
    const sources = [
      'src/ui/Title.tsx',
      'src/ui/components.tsx',
      'src/ui/Expedition.tsx',
      'src/ui/GodArtFallback.tsx',
    ].map((path) => readFileSync(join(ROOT, path), 'utf8')).join('\n')

    expect(sources).not.toContain('<svg')
    expect(sources).not.toContain('backdrop-art')
    expect(sources).not.toContain('ascent-svg')
    expect(sources).not.toContain('god-fallback-svg')
  })
})
