import { createHash } from 'node:crypto'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import sharp from 'sharp'

function readArgs(argv) {
  const args = new Map()
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]
    const value = argv[i + 1]
    if (!key?.startsWith('--') || value == null) {
      throw new Error(`Invalid argument near ${key ?? '<end>'}`)
    }
    args.set(key.slice(2), value)
  }
  return args
}

function required(args, key) {
  const value = args.get(key)
  if (!value) throw new Error(`Missing --${key}`)
  return value
}

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex')
}

const args = readArgs(process.argv.slice(2))
const input = required(args, 'input')
const runtimeBase = required(args, 'runtime-base')
const qcDir = args.get('qc-dir')
const width = Number(required(args, 'width'))
const height = Number(required(args, 'height'))
const inset = Number(args.get('inset') ?? 20)

if (![width, height, inset].every(Number.isFinite) || width < 32 || height < 32 || inset < 1) {
  throw new Error('Invalid dimensions')
}

const trimmed = await sharp(input)
  .ensureAlpha()
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 2 })
  .resize({
    width: width - inset * 2,
    height: height - inset * 2,
    fit: 'inside',
    kernel: sharp.kernel.lanczos3,
    withoutEnlargement: true,
  })
  .png()
  .toBuffer()

const trimmedMeta = await sharp(trimmed).metadata()
const left = Math.floor((width - trimmedMeta.width) / 2)
const right = width - trimmedMeta.width - left
const top = Math.floor((height - trimmedMeta.height) / 2)
const bottom = height - trimmedMeta.height - top
const canvas = sharp(trimmed).extend({
  left,
  right,
  top,
  bottom,
  background: { r: 0, g: 0, b: 0, alpha: 0 },
})

await mkdir(path.dirname(runtimeBase), { recursive: true })
const pngPath = `${runtimeBase}.png`
const webpPath = `${runtimeBase}.webp`
await canvas.clone().png({ compressionLevel: 9, palette: true }).toFile(pngPath)
await canvas.clone().webp({ quality: 82, alphaQuality: 90, smartSubsample: true }).toFile(webpPath)

if (qcDir) {
  const checker = (a, b) => {
    const cell = 24
    const pixels = Buffer.alloc(width * height * 4)
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const color = (Math.floor(x / cell) + Math.floor(y / cell)) % 2 === 0 ? a : b
        const offset = (y * width + x) * 4
        pixels[offset] = color[0]
        pixels[offset + 1] = color[1]
        pixels[offset + 2] = color[2]
        pixels[offset + 3] = 255
      }
    }
    return sharp(pixels, { raw: { width, height, channels: 4 } })
      .composite([{ input: pngPath }])
      .png()
      .toBuffer()
  }
  const [dark, light] = await Promise.all([
    checker([11, 15, 30], [24, 34, 66]),
    checker([236, 232, 220], [201, 193, 178]),
  ])
  await mkdir(qcDir, { recursive: true })
  await sharp({
    create: { width: width * 2, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } },
  }).composite([{ input: dark, left: 0, top: 0 }, { input: light, left: width, top: 0 }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(qcDir, `${path.basename(runtimeBase)}-checker.png`))
}

const { data, info } = await sharp(pngPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
let visible = 0
let partial = 0
let keyLike = 0
let edgeAlpha = 0
for (let y = 0; y < info.height; y += 1) {
  for (let x = 0; x < info.width; x += 1) {
    const offset = (y * info.width + x) * 4
    const r = data[offset]
    const g = data[offset + 1]
    const b = data[offset + 2]
    const a = data[offset + 3]
    if (a > 16) visible += 1
    if (a > 16 && a < 239) partial += 1
    if (a > 16 && r > 180 && b > 170 && g < 100 && Math.abs(r - b) < 100) keyLike += 1
    if (a > 16 && (x === 0 || y === 0 || x === info.width - 1 || y === info.height - 1)) edgeAlpha += 1
  }
}

if (edgeAlpha > 0 || keyLike > 0) {
  throw new Error(`QC failed: edgeAlpha=${edgeAlpha}, keyLike=${keyLike}`)
}

console.log(JSON.stringify({
  input,
  runtime: { pngPath, webpPath, width: info.width, height: info.height },
  alpha: { visible, partial, edgeAlpha, keyLike },
  sha256: { png: await sha256(pngPath), webp: await sha256(webpPath) },
}, null, 2))
