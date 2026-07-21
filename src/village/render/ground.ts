import { Graphics } from 'pixi.js'

export const VILLAGE_V2_GROUND_MARKER = 'continuous-dirt-stone-wet'

interface VillageGroundV2Options {
  tile: number
  cols: number
  rows: number
  crisis: boolean
}

/** 一枚の土面へ道・石・濡れを重ねる。cell単位の塗りや1px目地は作らない。 */
export function buildVillageGroundV2({ tile, cols, rows, crisis }: VillageGroundV2Options): Graphics {
  const width = cols * tile
  const height = rows * tile
  const ground = new Graphics()

  ground.rect(0, 0, width, height).fill(0x05070d)
  ground.roundRect(tile * 0.72, tile * 0.52, width - tile * 1.44, height - tile * 1.02, tile * 0.55)
    .fill(crisis ? 0x121521 : 0x191a29)

  // 大判の濡土。輪郭を不規則にし、格子や反復tileとして読ませない。
  ground.poly([
    tile * 0.8, tile * 4.2,
    tile * 3.4, tile * 3.6,
    tile * 7.8, tile * 4.1,
    tile * 9.6, tile * 6.1,
    tile * 7.4, tile * 9.6,
    tile * 2.0, tile * 9.9,
    tile * 0.9, tile * 7.2,
  ]).fill({ color: 0x191a2a, alpha: 0.96 })
  ground.poly([
    tile * 12.0, tile * 1.0,
    tile * 20.9, tile * 0.8,
    tile * 21.1, tile * 7.7,
    tile * 17.8, tile * 9.9,
    tile * 13.0, tile * 8.8,
    tile * 11.2, tile * 5.4,
  ]).fill({ color: crisis ? 0x111426 : 0x171c31, alpha: 0.94 })

  // 中央は完全な円環にせず、何世代もの往来で広がった不定形の土場にする。
  ground.poly([
    tile * 7.7, tile * 4.25,
    tile * 9.2, tile * 3.65,
    tile * 12.8, tile * 3.75,
    tile * 14.55, tile * 4.7,
    tile * 14.0, tile * 6.65,
    tile * 12.45, tile * 7.35,
    tile * 9.0, tile * 7.1,
    tile * 7.35, tile * 5.75,
  ]).fill({ color: crisis ? 0x26242c : 0x302c32, alpha: 0.84 })
  ground.ellipse(tile * 11.1, tile * 5.55, tile * 3.25, tile * 1.48)
    .fill({ color: crisis ? 0x29262e : 0x353137, alpha: 0.62 })

  // 施設から中央へ集まる生活路。幅と曲率をずらし、ゲーム盤の輪として読ませない。
  const paths: ReadonlyArray<readonly [number, number, number, number, number, number, number]> = [
    [4.15, 3.55, 5.6, 4.4, 7.5, 5.15, 9.0],
    [11.0, 2.0, 10.6, 3.2, 11.35, 4.15, 11.1],
    [18.0, 3.55, 16.9, 4.35, 15.25, 4.9, 13.7],
    [11.0, 9.3, 10.65, 8.2, 11.35, 7.1, 11.15],
    [3.7, 6.5, 5.6, 6.1, 7.2, 5.9, 8.15],
  ]
  for (const [sx, sy, c1x, c1y, c2x, c2y, ex] of paths) {
    ground.moveTo(tile * sx, tile * sy)
      .bezierCurveTo(tile * c1x, tile * c1y, tile * c2x, tile * c2y, tile * ex, tile * 5.55)
      .stroke({ color: crisis ? 0x2c2931 : 0x39343a, width: tile * 0.54, alpha: 0.9 })
    ground.moveTo(tile * sx, tile * sy)
      .bezierCurveTo(tile * c1x, tile * c1y, tile * c2x, tile * c2y, tile * ex, tile * 5.55)
      .stroke({ color: 0x56505a, width: tile * 0.055, alpha: crisis ? 0.12 : 0.2 })
  }

  // 各施設の足元に土間を置き、立ち絵素材ではなく集落の一部として接続する。
  const aprons: ReadonlyArray<readonly [number, number, number, number]> = [
    [4.05, 3.92, 1.65, 0.42],
    [11.0, 3.82, 1.35, 0.34],
    [18.0, 3.94, 1.55, 0.4],
    [11.0, 9.0, 1.45, 0.34],
    [11.5, 6.02, 1.05, 0.29],
  ]
  for (const [x, y, rx, ry] of aprons) {
    ground.ellipse(tile * x, tile * y, tile * rx, tile * ry)
      .fill({ color: 0x25242c, alpha: 0.88 })
      .stroke({ color: 0x57505a, width: 1.2, alpha: 0.24 })
  }

  // 北から南へ続く参道は中央土場の下へ潜らせ、一本の生活軸として残す。
  ground.moveTo(tile * 11, tile * 1.4)
    .bezierCurveTo(tile * 10.65, tile * 3.2, tile * 11.25, tile * 7.2, tile * 11, tile * 10.2)
    .stroke({ color: 0x3a353c, width: tile * 0.48, alpha: 0.54 })
  ground.moveTo(tile * 4.2, tile * 3.8)
    .bezierCurveTo(tile * 6.0, tile * 4.5, tile * 7.6, tile * 5.0, tile * 9.1, tile * 5.35)
    .stroke({ color: 0x292a38, width: tile * 0.48, alpha: 0.84 })

  // 石の向きで中央へ導く。疎な手置きで、規則的な舗装模様にはしない。
  const stones: ReadonlyArray<readonly [number, number, number, number]> = [
    [10.65, 2.0, 0.34, -0.10], [11.18, 2.75, 0.28, 0.08], [10.78, 3.55, 0.38, -0.04],
    [11.18, 6.75, 0.30, 0.06], [10.76, 7.5, 0.35, -0.08], [11.14, 8.35, 0.27, 0.04],
    [6.5, 4.4, 0.32, 0.04], [7.75, 4.82, 0.27, -0.07], [14.2, 4.9, 0.34, 0.08],
  ]
  for (const [x, y, rx, tilt] of stones) {
    ground.ellipse(x * tile, y * tile, rx * tile, 0.12 * tile)
      .fill({ color: 0x3a3948, alpha: 0.62 })
    ground.moveTo((x - rx * 0.7) * tile, (y + tilt) * tile)
      .lineTo((x + rx * 0.7) * tile, (y - tilt) * tile)
      .stroke({ color: 0x555160, width: 1.4, alpha: 0.38 })
  }

  // 生活痕。素材の周囲だけに置き、全面を粒子で埋めない。
  const traces: ReadonlyArray<readonly [number, number, number]> = [
    [2.75, 4.28, 0x5b3e2d], [3.08, 4.38, 0x7a4a2d], [4.78, 4.18, 0x49362c],
    [9.62, 3.95, 0x75634a], [12.22, 3.92, 0x75634a],
    [16.72, 4.28, 0x77706a], [17.1, 4.37, 0x8d847a], [19.1, 4.2, 0x77706a],
    [9.8, 8.72, 0x4c392c], [12.15, 8.75, 0x4c392c],
  ]
  for (const [x, y, color] of traces) {
    ground.roundRect(tile * x, tile * y, tile * 0.26, tile * 0.08, tile * 0.025)
      .fill({ color, alpha: crisis ? 0.28 : 0.44 })
  }

  // 池と雨溜まりは一続きの黒水として置く。
  ground.poly([
    tile * 2.3, tile * 5.8,
    tile * 4.8, tile * 5.95,
    tile * 5.15, tile * 7.75,
    tile * 4.35, tile * 8.45,
    tile * 2.0, tile * 8.15,
    tile * 1.75, tile * 6.6,
  ]).fill({ color: 0x0d1b2f, alpha: 0.96 })
  ground.ellipse(tile * 15.4, tile * 7.4, tile * 1.2, tile * 0.36)
    .fill({ color: 0x101d31, alpha: 0.62 })
  ground.ellipse(tile * 8.0, tile * 2.4, tile * 0.75, tile * 0.22)
    .fill({ color: 0x101d31, alpha: 0.48 })

  // 轍は二本だけ。中央軸を横切らず、鍛冶への生活動線を示す。
  for (const offset of [-0.14, 0.14]) {
    ground.moveTo(tile * 4.8, tile * (4.35 + offset))
      .bezierCurveTo(tile * 6.4, tile * (4.7 + offset), tile * 8.1, tile * (5.0 + offset), tile * 9.45, tile * (5.25 + offset))
      .stroke({ color: 0x0e111f, width: tile * 0.055, alpha: 0.52 })
  }

  return ground
}
