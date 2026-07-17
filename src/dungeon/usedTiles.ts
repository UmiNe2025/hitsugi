// M33: ダンジョンの「使用済みタイル」キー生成とボス床列挙の純粋関数。
// engine.ts(PixiJS依存クラス)から切り出し、Node/vitestで固定できるようにする。
// sealBoss()と再踏ガードはM29(討伐後のボス床空発火)/M30(空キャンバス)のHIGH修正でありながら
// テスト0だった(M28-29で自己回帰2件の実績)。ここを純関数化して回帰を封じる。
import type { TileKind } from './types'

/** 階層とマス座標から使用済みSetのキーを作る。engine/store/Dungeonで同一書式を共有する単一情報源。 */
export function usedKey(floorIndex: number, x: number, y: number): string {
  return `${floorIndex}:${x}:${y}`
}

/** 一度触れたら再発火させないタイル種(宝箱/野営/祠/石碑/ボス)。通路・階段・入口は含めない。
 *  engine.arrive() のボス/宝箱等の再踏ガード条件(M29修正でbossを含めた)をここへ集約する。 */
export function isReusableGuardTile(kind: TileKind): boolean {
  return kind === 'chest' || kind === 'camp' || kind === 'shrine' || kind === 'monument' || kind === 'boss'
}

/** グリッド上の全ボス床の座標。玄冬等のボス床は複数マスの塊なので複数返りうる。 */
export function findBossTiles(grid: TileKind[][]): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = []
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y]
    for (let x = 0; x < row.length; x++) {
      if (row[x] === 'boss') out.push({ x, y })
    }
  }
  return out
}

/** ボス撃破後に使用済み化すべき全ボス床のキー(sealBoss()の中身)。
 *  これをしないと討伐後もボス床を踏む度に戦闘演出が空発火する(M29が塞いだ不具合)。 */
export function sealBossKeys(grid: TileKind[][], floorIndex: number): string[] {
  return findBossTiles(grid).map(({ x, y }) => usedKey(floorIndex, x, y))
}
