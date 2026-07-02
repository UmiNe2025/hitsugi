// 生成画像のURL解決 — 原本png名をweb配信用jpgへ読み替える
export function gameImg(file: string): string {
  return `${import.meta.env.BASE_URL}img/${file.replace(/\.png$/, '.jpg')}`
}
