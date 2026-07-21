import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = path.join(root, 'assets_src', 'visual_recovery', 'asset-manifest.json')
const schemaPath = path.join(root, 'assets_src', 'visual_recovery', 'asset-manifest.schema.json')
const entries = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'))
const ids = new Set()
const errors = []

function isType(value, type) {
  if (type === 'null') return value === null
  if (type === 'array') return Array.isArray(value)
  if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value)
  if (type === 'integer') return Number.isInteger(value)
  return typeof value === type
}

// This manifest intentionally uses a small, closed JSON Schema vocabulary. Reading the schema
// itself prevents the validator and documented contract from drifting without adding a runtime dependency.
function validateSchema(value, rule, at) {
  const allowedTypes = rule.type === undefined ? null : (Array.isArray(rule.type) ? rule.type : [rule.type])
  if (allowedTypes && !allowedTypes.some((type) => isType(value, type))) {
    errors.push(`${at}: expected ${allowedTypes.join('|')}`)
    return
  }
  if (rule.enum && !rule.enum.includes(value)) errors.push(`${at}: not in enum`)
  if (typeof value === 'string') {
    if (rule.minLength !== undefined && value.length < rule.minLength) errors.push(`${at}: shorter than ${rule.minLength}`)
    if (rule.pattern && !(new RegExp(rule.pattern)).test(value)) errors.push(`${at}: does not match ${rule.pattern}`)
  }
  if (typeof value === 'number' && rule.minimum !== undefined && value < rule.minimum) errors.push(`${at}: below ${rule.minimum}`)
  if (Array.isArray(value)) {
    if (rule.minItems !== undefined && value.length < rule.minItems) errors.push(`${at}: fewer than ${rule.minItems} items`)
    if (rule.uniqueItems && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) errors.push(`${at}: duplicate items`)
    if (rule.items) value.forEach((item, index) => validateSchema(item, rule.items, `${at}[${index}]`))
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of rule.required ?? []) if (!(key in value)) errors.push(`${at}: missing ${key}`)
    if (rule.additionalProperties === false) {
      for (const key of Object.keys(value)) if (!(key in (rule.properties ?? {}))) errors.push(`${at}: unexpected ${key}`)
    }
    for (const [key, childRule] of Object.entries(rule.properties ?? {})) {
      if (key in value) validateSchema(value[key], childRule, `${at}.${key}`)
    }
  }
}

validateSchema(entries, schema, 'manifest')

for (const [index, entry] of entries.entries()) {
  const at = `entry[${index}]`
  if (ids.has(entry.assetId)) errors.push(`${at}: duplicate assetId ${entry.assetId}`)
  ids.add(entry.assetId)
  if (entry.reviewStatus === 'accepted') {
    if (entry.rightsStatus !== 'cleared') errors.push(`${at}: accepted asset rights are not cleared`)
    if (!entry.source || !entry.sourceSha256 || !entry.runtimePath || !entry.runtimeSha256 || !entry.generator || !entry.modelLicenseChain || !entry.reviewer) errors.push(`${at}: accepted asset provenance is incomplete`)
  }
  if (entry.reviewStatus === 'rejected' && !entry.rejectReason) errors.push(`${at}: rejected asset needs rejectReason`)

  for (const [pathField, hashField] of [['source', 'sourceSha256'], ['runtimePath', 'runtimeSha256']]) {
    const relativePath = entry[pathField]
    const expectedHash = entry[hashField]
    if ((relativePath === null) !== (expectedHash === null)) {
      errors.push(`${at}: ${pathField} and ${hashField} must both be set or both be null`)
      continue
    }
    if (relativePath === null) continue
    const absolutePath = path.resolve(root, relativePath)
    if (!absolutePath.startsWith(`${root}${path.sep}`)) {
      errors.push(`${at}: ${pathField} escapes repository root`)
      continue
    }
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      errors.push(`${at}: ${pathField} does not resolve to a file`)
      continue
    }
    const actualHash = crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex')
    if (actualHash !== expectedHash.toLowerCase()) errors.push(`${at}: ${hashField} does not match ${pathField}`)
  }
}

const requiredVillageIds = [
  'village_facade_great_lantern', 'village_facade_forge_storehouse', 'village_facade_star_shrine',
  'village_facade_tofu_shop', 'village_facade_departure_gate',
]
for (const id of requiredVillageIds) if (!ids.has(id)) errors.push(`missing AR1 village ID ${id}`)

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log(`visual manifest OK: ${entries.length} entries, ${ids.size} unique IDs`)
