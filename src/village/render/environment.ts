import { Sprite, type Texture } from 'pixi.js'

export const VILLAGE_RASTER_ENVIRONMENT_MARKER = 'raster-painted-village'

export function defaultVillageEnvironmentAsset(baseUrl: string): string {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return `${base}img/visual-recovery/village/village-lantern-hub-map-v2.webp`
}

/**
 * 建物・灯籠・池・生活路を一枚の画材で閉じた歩行面。
 * 当たり判定と近接座標は engine の MAP が引き続き所有し、この画像は視覚だけを担う。
 */
export function buildVillageEnvironmentV2(
  texture: Texture,
  width: number,
  height: number,
  crisis: boolean,
): Sprite {
  const sprite = new Sprite(texture)
  sprite.width = width
  sprite.height = height
  sprite.alpha = crisis ? 0.78 : 0.92
  if (crisis) sprite.tint = 0xb7a6a8
  return sprite
}
