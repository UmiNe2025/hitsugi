import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import sharp from 'sharp'

const root = process.cwd()
const imgDir = path.join(root, 'public', 'img')
const outDir = path.join(root, 'docs', 'qa', 'vc5')

async function sourceFiles(prefix) {
  const dir = path.join(root, 'src', 'core', 'data')
  return (await fs.readdir(dir))
    .filter((name) => name.startsWith(prefix) && name.endsWith('.ts'))
    .map((name) => path.join(dir, name))
}

async function extractValues(files, expression) {
  const values = []
  for (const file of files) {
    const source = await fs.readFile(file, 'utf8')
    for (const match of source.matchAll(expression)) values.push(match[1])
  }
  return [...new Set(values)]
}

function jpg(file) {
  return file.replace(/\.png$/i, '.jpg')
}

function variant(file, suffix) {
  return jpg(file).replace(/\.jpg$/i, `_${suffix}.jpg`)
}

function hamming(a, b) {
  let value = a ^ b
  let count = 0
  while (value) {
    count += Number(value & 1n)
    value >>= 1n
  }
  return count
}

async function inspect(relativePath) {
  const absolutePath = path.join(imgDir, relativePath)
  const base = sharp(absolutePath).rotate()
  const metadata = await base.metadata()
  const decoded = await base.clone().ensureAlpha().raw().toBuffer()
  const decodedHash = crypto.createHash('sha256')
    .update(String(metadata.width))
    .update('x')
    .update(String(metadata.height))
    .update(decoded)
    .digest('hex')
  const small = await base.clone().resize(9, 8, { fit: 'fill' }).greyscale().raw().toBuffer()
  let dHash = 0n
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      dHash = (dHash << 1n) | BigInt(small[y * 9 + x] > small[y * 9 + x + 1] ? 1 : 0)
    }
  }
  const stats = await base.stats()
  const luminance = stats.channels.slice(0, 3).reduce((sum, channel) => sum + channel.mean, 0) / 3
  return {
    file: relativePath,
    width: metadata.width,
    height: metadata.height,
    ratio: Number(((metadata.width ?? 1) / (metadata.height ?? 1)).toFixed(4)),
    luminance: Number(luminance.toFixed(2)),
    decodedHash,
    dHash,
  }
}

async function auditGroup(id, files, expectedRatio) {
  const uniqueFiles = [...new Set(files)].sort()
  const missing = []
  const records = []
  for (const file of uniqueFiles) {
    try {
      records.push(await inspect(file))
    } catch {
      missing.push(file)
    }
  }

  const exactGroups = new Map()
  for (const record of records) {
    const group = exactGroups.get(record.decodedHash) ?? []
    group.push(record.file)
    exactGroups.set(record.decodedHash, group)
  }
  const exactDuplicates = [...exactGroups.values()].filter((group) => group.length > 1)

  const nearPairs = []
  for (let i = 0; i < records.length; i += 1) {
    for (let j = i + 1; j < records.length; j += 1) {
      const distance = hamming(records[i].dHash, records[j].dHash)
      if (distance <= 4) nearPairs.push({ a: records[i].file, b: records[j].file, distance })
    }
  }
  nearPairs.sort((a, b) => a.distance - b.distance || a.a.localeCompare(b.a) || a.b.localeCompare(b.b))

  const ratioOutliers = records
    .filter((record) => Math.abs(record.ratio - expectedRatio) > Math.max(0.08, expectedRatio * 0.12))
    .map(({ file, ratio }) => ({ file, ratio }))
  const luminanceOutliers = records
    .filter((record) => record.luminance < 18 || record.luminance > 225)
    .map(({ file, luminance }) => ({ file, luminance }))

  return {
    id,
    required: uniqueFiles.length,
    present: records.length,
    missing,
    exactDuplicates,
    nearPairCount: nearPairs.length,
    nearPairs: nearPairs.slice(0, 200),
    ratioOutliers,
    luminanceOutliers,
    records,
  }
}

async function makeContactSheet(files, output, columns, cellWidth, cellHeight) {
  const present = []
  for (const file of files) {
    try {
      await fs.access(path.join(imgDir, file))
      present.push(file)
    } catch {
      // Missing files remain represented in the JSON report, not as a fake image.
    }
  }
  const rows = Math.max(1, Math.ceil(present.length / columns))
  const composites = []
  for (let index = 0; index < present.length; index += 1) {
    const thumb = await sharp(path.join(imgDir, present[index]))
      .rotate()
      .resize(cellWidth - 4, cellHeight - 4, { fit: 'contain', background: '#0b0f1e' })
      .extend({ top: 2, bottom: 2, left: 2, right: 2, background: '#182242' })
      .png()
      .toBuffer()
    composites.push({
      input: thumb,
      left: (index % columns) * cellWidth,
      top: Math.floor(index / columns) * cellHeight,
    })
  }
  await sharp({
    create: {
      width: columns * cellWidth,
      height: rows * cellHeight,
      channels: 3,
      background: '#0b0f1e',
    },
  }).composite(composites).png({ compressionLevel: 9 }).toFile(output)
}

await fs.mkdir(outDir, { recursive: true })
const godFiles = await sourceFiles('gods')
const enemyFiles = await sourceFiles('enemies')
const godPortraits = await extractValues(godFiles, /\bportrait:\s*'([^']+)'/g)
const enemySprites = await extractValues(enemyFiles, /\bsprite:\s*'([^']+)'/g)
const enemyBaseSprites = enemySprites.filter((file) => !file.startsWith('boss_'))
const bossSprites = enemySprites.filter((file) => file.startsWith('boss_'))
const itemRuntimeFiles = (await fs.readdir(imgDir)).filter((file) => /^it_.+\.jpg$/i.test(file))

const groups = {
  godsNormal: godPortraits.map(jpg),
  godsMax: godPortraits.map((file) => variant(file, 'max')),
  enemiesBase: enemyBaseSprites.map(jpg),
  enemiesYoung: enemyBaseSprites.map((file) => variant(file, 'w')),
  enemiesOld: enemyBaseSprites.map((file) => variant(file, 'o')),
  bosses: bossSprites.map(jpg),
  items: itemRuntimeFiles,
}

const audits = {
  godsNormal: await auditGroup('godsNormal', groups.godsNormal, 0.75),
  godsMax: await auditGroup('godsMax', groups.godsMax, 0.75),
  enemiesBase: await auditGroup('enemiesBase', groups.enemiesBase, 1),
  enemiesYoung: await auditGroup('enemiesYoung', groups.enemiesYoung, 1),
  enemiesOld: await auditGroup('enemiesOld', groups.enemiesOld, 1),
  bosses: await auditGroup('bosses', groups.bosses, 1),
  items: await auditGroup('items', groups.items, 1),
}

for (const audit of Object.values(audits)) {
  audit.records = audit.records.map(({ dHash, decodedHash, ...record }) => ({
    ...record,
    dHash: dHash.toString(16).padStart(16, '0'),
    decodedHash,
  }))
}

await Promise.all([
  makeContactSheet(groups.godsNormal, path.join(outDir, 'gods-normal-contact.png'), 18, 72, 96),
  makeContactSheet(groups.godsMax, path.join(outDir, 'gods-max-contact.png'), 18, 72, 96),
  makeContactSheet(groups.enemiesBase, path.join(outDir, 'enemies-base-contact.png'), 18, 80, 80),
  makeContactSheet(groups.items, path.join(outDir, 'items-contact.png'), 30, 56, 56),
])

const totals = Object.values(audits).reduce((sum, audit) => ({
  required: sum.required + audit.required,
  present: sum.present + audit.present,
  missing: sum.missing + audit.missing.length,
  exactDuplicateGroups: sum.exactDuplicateGroups + audit.exactDuplicates.length,
  nearPairs: sum.nearPairs + audit.nearPairCount,
  ratioOutliers: sum.ratioOutliers + audit.ratioOutliers.length,
  luminanceOutliers: sum.luminanceOutliers + audit.luminanceOutliers.length,
}), { required: 0, present: 0, missing: 0, exactDuplicateGroups: 0, nearPairs: 0, ratioOutliers: 0, luminanceOutliers: 0 })

const report = {
  generatedAt: new Date().toISOString(),
  contract: 'HITSUGI §18 VC5 presentation audit',
  thresholds: {
    decodedExact: 'same decoded RGBA pixels and dimensions',
    perceptual: '64-bit dHash Hamming distance <= 4; review candidate, not automatic rejection',
    ratio: 'expected aspect ratio +/- max(0.08, 12%)',
    luminance: 'mean RGB below 18 or above 225',
  },
  totals,
  groups: audits,
}
await fs.writeFile(path.join(outDir, 'asset-presentation-audit.json'), JSON.stringify(report, null, 2) + '\n')

const lines = [
  '# VC5 asset presentation audit — 2026-07-21',
  '',
  'This report audits only assets actually referenced by current god, enemy, and item data. A perceptual pair is a review candidate, not proof of duplicated identity.',
  '',
  '| Group | Required | Present | Missing | Exact duplicate groups | dHash <= 4 | Ratio outliers | Luminance outliers |',
  '|---|---:|---:|---:|---:|---:|---:|---:|',
  ...Object.values(audits).map((audit) => `| ${audit.id} | ${audit.required} | ${audit.present} | ${audit.missing.length} | ${audit.exactDuplicates.length} | ${audit.nearPairCount} | ${audit.ratioOutliers.length} | ${audit.luminanceOutliers.length} |`),
  `| **Total** | **${totals.required}** | **${totals.present}** | **${totals.missing}** | **${totals.exactDuplicateGroups}** | **${totals.nearPairs}** | **${totals.ratioOutliers}** | **${totals.luminanceOutliers}** |`,
  '',
  '## Contact sheets',
  '',
  '- `gods-normal-contact.png`',
  '- `gods-max-contact.png`',
  '- `enemies-base-contact.png`',
  '- `items-contact.png`',
  '',
  '## Acceptance boundary',
  '',
  '- Exact decoded duplicates and missing references are blocking.',
  '- dHash, crop, and luminance flags require independent visual review against identity, costume, symbol, pose, background, and crop; they are not auto-failures.',
  '- Normal/MAX and base/young/old identity continuity still requires paired human inspection.',
  '- Replacements remain capped at 12 per batch and require source, rights, crop, runtime, and independent-review records before promotion.',
  '',
]
await fs.writeFile(path.join(outDir, 'asset-presentation-audit.md'), lines.join('\n'))

console.log(JSON.stringify(totals))
if (totals.missing > 0 || totals.exactDuplicateGroups > 0) process.exitCode = 1
