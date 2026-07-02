// ダンジョン定義の公開窓口(品質刷新v3.1 M7b)
// 実データは maps.gen.ts(scripts/gen_all_maps.mjs による自動生成)。
// フロアを直したい時は gen_all_maps.mjs のシード表を変えて再生成する — ASCIIの手編集は禁止。
import type { DungeonDef } from './types'
import { DUNGEONS_GEN } from './maps.gen'

export const DUNGEONS: DungeonDef[] = DUNGEONS_GEN

export function dungeonByRegion(regionId: string): DungeonDef | undefined {
  return DUNGEONS.find((d) => d.regionId === regionId)
}
