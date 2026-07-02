import type { Character, Tomoshigata } from '../core/types'

// 生成画像のURL解決 — 原本png名をweb配信用jpgへ読み替える
export function gameImg(file: string): string {
  return `${import.meta.env.BASE_URL}img/${file.replace(/\.png$/, '.jpg')}`
}

// 歩行スプライトの正面立ちフレーム(down_1=中立の立ち姿)を立ち絵として転用する。
// 灯型(tomoshigata)×性別で決まり、成人前の幼子はまだ型を成さぬため null を返す。
export function charSprite(char: Pick<Character, 'tomoshigata' | 'sex'>): string | null {
  if (!char.tomoshigata) return null
  return spriteUrl(char.tomoshigata, char.sex)
}

export function spriteUrl(gata: Tomoshigata, sex: 'm' | 'f'): string {
  return `${import.meta.env.BASE_URL}img/sprites/walk_${gata}_${sex}_down_1.png`
}

// 郷(ホーム)の背景。まだ生成されていなければ描画側でCSS/SVGへフォールバックする。
export const HOME_BG = 'bg_sato.png'
