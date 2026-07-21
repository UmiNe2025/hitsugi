export type RegionVisualVersion = 'v1' | 'v2'

export interface RegionVisualFlagInput {
  envValue?: unknown
  dev?: boolean
  search?: string
}

const TRUE_VALUES = new Set(['1', 'true', 'on', 'yes', 'v2'])
const FALSE_VALUES = new Set(['0', 'false', 'off', 'no', 'v1'])

function parseBooleanFlag(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  if (TRUE_VALUES.has(normalized)) return true
  if (FALSE_VALUES.has(normalized)) return false
  return null
}

/**
 * M36 visual renderer gate. The authored village facades and all 40 code-native
 * dungeon kits are now the default presentation; an explicit env/query OFF path
 * remains so QA can compare the legacy renderer and roll back without touching saves.
 */
export function isRegionVisualV2Enabled(input: RegionVisualFlagInput = {}): boolean {
  const envEnabled = parseBooleanFlag(input.envValue ?? import.meta.env.VITE_REGION_VISUAL_V2) ?? true
  const dev = input.dev ?? import.meta.env.DEV
  if (!dev) return envEnabled

  const search = input.search ?? (typeof window !== 'undefined' ? window.location.search : '')
  const override = parseBooleanFlag(new URLSearchParams(search).get('regionVisualV2'))
  return override ?? envEnabled
}

/** Capture once at departure; active runs never re-read the live flag. */
export function captureRegionVisualVersion(input?: RegionVisualFlagInput): RegionVisualVersion {
  return isRegionVisualV2Enabled(input) ? 'v2' : 'v1'
}
