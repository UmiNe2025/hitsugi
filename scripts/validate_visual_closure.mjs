import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const LIFECYCLE_STATUSES = [
  'planned',
  'source-ready',
  'normalized',
  'code-integrated',
  'scene-integrated',
  'scene-ready',
  'released',
]

export const ROUTE_REQUIRED_STATES = {
  title: ['new', 'continue', 'save-none', 'save-present', 'save-corrupt', 'reduced-motion'],
  intro: ['first-run', 'skip', 'reduced-motion'],
  home: ['normal', 'bloodline-crisis', 'fresh-return', 'empty', 'disabled'],
  village: ['normal', 'bloodline-crisis', 'fresh-return', 'empty', 'disabled'],
  pact: ['eligible', 'ineligible', 'missing-image-fallback'],
  birth: ['pending', 'completed', 'skip', 'replay', 'missing-image-fallback'],
  ceremony: ['pending', 'completed', 'skip', 'replay', 'missing-image-fallback'],
  jobrite: ['pending', 'completed', 'skip', 'replay', 'missing-image-fallback'],
  life: ['pending', 'completed', 'skip', 'replay', 'missing-image-fallback'],
  death: ['pending', 'completed', 'skip', 'replay', 'missing-image-fallback'],
  dream: ['pending', 'completed', 'skip', 'replay', 'missing-image-fallback'],
  dreamEp: ['pending', 'completed', 'skip', 'replay', 'missing-image-fallback'],
  depart: ['locked', 'selected', 'map', 'list'],
  expedition: ['selected', 'visited', 'rare', 'boss'],
  dungeon: ['visited', 'rare', 'boss'],
  battle: ['rare', 'boss', 'victory', 'retreat'],
  forge: ['empty', 'populated', 'filtered', 'selected', 'affordable', 'unaffordable', 'confirm', 'error'],
  chronicle: ['empty', 'populated', 'filtered', 'selected', 'error'],
  codex: ['empty', 'populated', 'filtered', 'selected', 'error'],
  facilities: ['empty', 'populated', 'selected', 'affordable', 'unaffordable', 'confirm', 'error'],
  finale: ['choice', 'confirm'],
  ending: ['ending-cut', 'ending-save', 'ending-inherit', 'new-cycle', 'return-title'],
}

export const REGION_BASE_STATES = ['normal', 'locked', 'selected', 'visited', 'rare']

export const OVERLAY_REQUIRED_STATES = {
  'family-tree': { parentSurface: 'home', states: ['open', 'close', 'outside-click', 'escape', 'focus-return', 'empty', 'error'] },
  'storehouse-tab': { parentSurface: 'forge', states: ['open', 'close', 'outside-click', 'escape', 'focus-return', 'empty', 'error'] },
  'settings-help': { parentSurface: 'title/home', states: ['open', 'close', 'outside-click', 'escape', 'focus-return', 'empty', 'error'] },
  'save-import-export': { parentSurface: 'settings-help', states: ['open', 'close', 'outside-click', 'escape', 'focus-return', 'empty', 'error'] },
  'sheet-modal': { parentSurface: 'route-dependent', states: ['open', 'close', 'outside-click', 'escape', 'focus-return', 'empty', 'error'] },
  // Toasts are non-modal, do not move focus, and must not inherit modal-only
  // outside-click / Escape / focus-return requirements. Their own contract is
  // announcement plus automatic or explicit dismissal.
  toast: { parentSurface: 'global', states: ['open', 'close', 'auto-dismiss', 'manual-dismiss', 'empty', 'error'] },
}

const REQUIRED_FIELDS = [
  'sceneId', 'parentSurface', 'stateId', 'viewport', 'hero', 'support', 'groundContact',
  'depth', 'people', 'ui', 'motionSound', 'runtimeBundle', 'provenance', 'status', 'owner',
  'evidence', 'nAReason',
]
const TEXT_FIELDS = ['sceneId', 'parentSurface', 'hero', 'support', 'groundContact', 'depth', 'people', 'ui', 'motionSound', 'owner']
const REQUIRED_VIEWPORTS = ['1280x720', '390x844']
const SCENE_EVIDENCE_VIEWPORTS = ['1440x900', '1280x720', '768x1024', '390x844', '360x800']
const KIND_VALUES = ['route', 'region', 'overlay']
const SHA256 = /^[a-f\d]{64}$/i

function addSetDiff(errors, label, actual, expected) {
  const missing = [...expected].filter((id) => !actual.has(id)).sort()
  const extra = [...actual].filter((id) => !expected.has(id)).sort()
  if (missing.length) errors.push(`${label}: missing ${missing.join(', ')}`)
  if (extra.length) errors.push(`${label}: extra ${extra.join(', ')}`)
}

function extractScreenIds(source) {
  const block = source.match(/export\s+type\s+Screen\s*=([\s\S]*?)(?=\nexport\s+(?:type|interface)\s+)/)?.[1]
  if (!block) throw new Error('could not find exported Screen union')
  return [...block.matchAll(/\{\s*id:\s*'([^']+)'/g)].map((match) => match[1])
}

function extractRegions(source) {
  const block = source.match(/export\s+const\s+REGIONS[^=]*=\s*\[([\s\S]*?)\n\]/)?.[1]
  if (!block) throw new Error('could not find REGIONS array')
  const lines = block.split(/\r?\n/)
  const regions = []
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^\s*id:\s*'([^']+)'/)
    if (!match) continue
    let record = lines[index]
    for (let cursor = index + 1; cursor < lines.length && !/^\s*id:\s*'/.test(lines[cursor]); cursor += 1) record += `\n${lines[cursor]}`
    regions.push({ id: match[1], hasBoss: /\bbossId\s*:/.test(record) })
  }
  return regions
}

function resolveRepoFile(root, relativePath, at, errors) {
  if (typeof relativePath !== 'string' || !relativePath || path.isAbsolute(relativePath)) {
    errors.push(`${at}: must be a non-empty repository-relative path`)
    return null
  }
  const absolutePath = path.resolve(root, relativePath)
  const relative = path.relative(root, absolutePath)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    errors.push(`${at}: escapes repository root`)
    return null
  }
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    errors.push(`${at}: does not resolve to a file`)
    return null
  }
  return absolutePath
}

function validateHashedFile(root, value, pathField, hashField, at, errors) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    errors.push(`${at}: must be an object when supplied`)
    return
  }
  const absolutePath = resolveRepoFile(root, value[pathField], `${at}.${pathField}`, errors)
  const expectedHash = value[hashField]
  if (typeof expectedHash !== 'string' || !SHA256.test(expectedHash)) {
    errors.push(`${at}.${hashField}: must be a SHA-256 hex digest`)
    return
  }
  if (!absolutePath) return
  const actualHash = crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex')
  if (actualHash !== expectedHash.toLowerCase()) errors.push(`${at}.${hashField}: does not match ${value[pathField]}`)
}

function validateEntry(entry, index, root, errors) {
  const at = `entries[${index}]`
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    errors.push(`${at}: must be an object`)
    return
  }
  for (const field of REQUIRED_FIELDS) if (!(field in entry)) errors.push(`${at}: missing ${field}`)
  if (!KIND_VALUES.includes(entry.kind)) errors.push(`${at}.kind: must be route, region, or overlay`)
  for (const field of TEXT_FIELDS) {
    if (typeof entry[field] !== 'string' || !entry[field].trim()) errors.push(`${at}.${field}: must be a non-empty string`)
  }
  if (!Array.isArray(entry.stateId) || !entry.stateId.length || entry.stateId.some((state) => typeof state !== 'string' || !state)) {
    errors.push(`${at}.stateId: must be a non-empty string array`)
  } else if (new Set(entry.stateId).size !== entry.stateId.length) {
    errors.push(`${at}.stateId: contains duplicates`)
  }
  if (!Array.isArray(entry.viewport) || !entry.viewport.length) {
    errors.push(`${at}.viewport: must be a non-empty array`)
  } else {
    for (const viewport of REQUIRED_VIEWPORTS) if (!entry.viewport.includes(viewport)) errors.push(`${at}.viewport: missing ${viewport}`)
  }
  if (!LIFECYCLE_STATUSES.includes(entry.status)) errors.push(`${at}.status: invalid lifecycle status ${String(entry.status)}`)
  const hasNA = REQUIRED_FIELDS.some((field) => entry[field] === 'N/A')
  if (hasNA && (typeof entry.nAReason !== 'string' || !entry.nAReason.trim())) errors.push(`${at}.nAReason: required when a field is N/A`)
  if (!hasNA && entry.nAReason !== null) errors.push(`${at}.nAReason: must be null when no field is N/A`)

  if (!Array.isArray(entry.evidence) || !entry.evidence.length) {
    errors.push(`${at}.evidence: must contain at least one path`)
  } else {
    entry.evidence.forEach((evidencePath, evidenceIndex) => resolveRepoFile(root, evidencePath, `${at}.evidence[${evidenceIndex}]`, errors))
  }

  if (entry.runtimeBundle !== 'N/A') validateHashedFile(root, entry.runtimeBundle, 'path', 'sha256', `${at}.runtimeBundle`, errors)
  if (entry.provenance !== 'N/A') {
    validateHashedFile(root, entry.provenance, 'sourcePath', 'sourceSha256', `${at}.provenance`, errors)
    validateHashedFile(root, { path: entry.provenance?.runtimePath, sha256: entry.provenance?.runtimeSha256 }, 'path', 'sha256', `${at}.provenance.runtime`, errors)
    if (!['pending', 'cleared', 'restricted'].includes(entry.provenance?.rightsStatus)) errors.push(`${at}.provenance.rightsStatus: invalid rights status`)
    if (typeof entry.provenance?.reviewer !== 'string' || !entry.provenance.reviewer.trim()) errors.push(`${at}.provenance.reviewer: required`)
  }

  if (['source-ready', 'normalized'].includes(entry.status) && entry.provenance === 'N/A') errors.push(`${at}: ${entry.status} requires provenance`)
  if (['code-integrated', 'scene-integrated', 'scene-ready', 'released'].includes(entry.status) && entry.runtimeBundle === 'N/A') errors.push(`${at}: ${entry.status} requires a runtime bundle`)
  if (['code-integrated', 'scene-integrated', 'scene-ready', 'released'].includes(entry.status) && entry.provenance === 'N/A') errors.push(`${at}: ${entry.status} requires provenance`)

  if (['scene-integrated', 'scene-ready', 'released'].includes(entry.status)) {
    const coverage = entry.coverageEvidence
    if (!coverage || typeof coverage !== 'object' || Array.isArray(coverage)) {
      errors.push(`${at}: ${entry.status} requires coverageEvidence`)
    } else {
      const states = coverage.states
      const viewports = coverage.viewports
      const checks = coverage.mechanicalChecks
      if (!states || typeof states !== 'object' || Array.isArray(states)) {
        errors.push(`${at}.coverageEvidence.states: must map every required state to evidence paths`)
      } else {
        for (const state of entry.stateId ?? []) {
          const paths = states[state]
          if (!Array.isArray(paths) || !paths.length) {
            errors.push(`${at}.coverageEvidence.states.${state}: requires at least one evidence path`)
            continue
          }
          paths.forEach((evidencePath, evidenceIndex) => resolveRepoFile(root, evidencePath, `${at}.coverageEvidence.states.${state}[${evidenceIndex}]`, errors))
        }
      }
      if (!viewports || typeof viewports !== 'object' || Array.isArray(viewports)) {
        errors.push(`${at}.coverageEvidence.viewports: must map all five canonical viewports to captures`)
      } else {
        for (const viewport of SCENE_EVIDENCE_VIEWPORTS) {
          const paths = viewports[viewport]
          if (!Array.isArray(paths) || !paths.length) {
            errors.push(`${at}.coverageEvidence.viewports.${viewport}: requires at least one capture path`)
            continue
          }
          paths.forEach((evidencePath, evidenceIndex) => resolveRepoFile(root, evidencePath, `${at}.coverageEvidence.viewports.${viewport}[${evidenceIndex}]`, errors))
        }
      }
      if (!Array.isArray(checks) || !checks.length) {
        errors.push(`${at}.coverageEvidence.mechanicalChecks: requires at least one evidence path`)
      } else {
        checks.forEach((evidencePath, evidenceIndex) => resolveRepoFile(root, evidencePath, `${at}.coverageEvidence.mechanicalChecks[${evidenceIndex}]`, errors))
      }
    }
  }

  if (['scene-ready', 'released'].includes(entry.status)) {
    const verification = entry.verification
    if (!verification || typeof verification !== 'object') {
      errors.push(`${at}: ${entry.status} requires verification`)
    } else {
      for (const [field, expected] of Object.entries({ rights: 'verified', humanReview: 'passed', independentReview: 'passed', stateCoverage: 'passed', performance: 'passed' })) {
        if (verification[field] !== expected) errors.push(`${at}.verification.${field}: must be ${expected}`)
      }
    }
    if (entry.provenance !== 'N/A' && entry.provenance?.rightsStatus !== 'cleared') errors.push(`${at}: ${entry.status} requires cleared rights`)
  }
  if (entry.status === 'released') {
    const verification = entry.verification ?? {}
    if (verification.releaseApproval !== 'approved') errors.push(`${at}.verification.releaseApproval: must be approved`)
    if (typeof verification.commit !== 'string' || !/^[a-f\d]{7,40}$/i.test(verification.commit)) errors.push(`${at}.verification.commit: invalid commit`)
    for (const field of ['runUrl', 'releaseUrl']) {
      if (typeof verification[field] !== 'string' || !/^https:\/\//.test(verification[field])) errors.push(`${at}.verification.${field}: must be an https URL`)
    }
  }
}

export function validateVisualClosure({ root, ledgerPath, typesPath, regionsPath }) {
  const errors = []
  let ledger
  let screenIds
  let regions
  try {
    ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'))
  } catch (error) {
    return { errors: [`ledger: ${error.message}`], counts: null }
  }
  try {
    screenIds = extractScreenIds(fs.readFileSync(typesPath, 'utf8'))
    regions = extractRegions(fs.readFileSync(regionsPath, 'utf8'))
  } catch (error) {
    return { errors: [`source extraction: ${error.message}`], counts: null }
  }

  if (ledger.schemaVersion !== 1) errors.push('schemaVersion: expected 1')
  if (!Array.isArray(ledger.entries)) errors.push('entries: must be an array')
  const entries = Array.isArray(ledger.entries) ? ledger.entries : []
  entries.forEach((entry, index) => validateEntry(entry, index, root, errors))

  const routeDefinitionIds = new Set(Object.keys(ROUTE_REQUIRED_STATES))
  addSetDiff(errors, 'route state definitions vs Screen union', routeDefinitionIds, new Set(screenIds))

  const byKind = (kind) => entries.filter((entry) => entry?.kind === kind)
  const routeIds = new Set(byKind('route').map((entry) => entry.sceneId))
  const regionIds = new Set(byKind('region').map((entry) => entry.sceneId))
  const overlayIds = new Set(byKind('overlay').map((entry) => entry.sceneId))
  addSetDiff(errors, 'ledger routes vs Screen union', routeIds, new Set(screenIds))
  addSetDiff(errors, 'ledger regions vs REGIONS', regionIds, new Set(regions.map((region) => region.id)))
  addSetDiff(errors, 'ledger overlays vs overlay inventory', overlayIds, new Set(Object.keys(OVERLAY_REQUIRED_STATES)))

  const checkCoverage = (kind, sceneId, requiredStates) => {
    const actualStates = new Set()
    for (const entry of byKind(kind).filter((candidate) => candidate.sceneId === sceneId)) {
      for (const state of Array.isArray(entry.stateId) ? entry.stateId : []) {
        if (actualStates.has(state)) errors.push(`${kind} ${sceneId}: duplicate state ${state}`)
        actualStates.add(state)
      }
    }
    addSetDiff(errors, `${kind} ${sceneId} state coverage`, actualStates, new Set(requiredStates))
  }
  for (const screenId of screenIds) checkCoverage('route', screenId, ROUTE_REQUIRED_STATES[screenId] ?? [])
  for (const region of regions) checkCoverage('region', region.id, [...REGION_BASE_STATES, ...(region.hasBoss ? ['boss'] : [])])
  for (const [overlayId, definition] of Object.entries(OVERLAY_REQUIRED_STATES)) {
    checkCoverage('overlay', overlayId, definition.states)
    for (const entry of byKind('overlay').filter((candidate) => candidate.sceneId === overlayId)) {
      if (entry.parentSurface !== definition.parentSurface) errors.push(`overlay ${overlayId}: parentSurface must be ${definition.parentSurface}`)
    }
  }

  return {
    errors,
    counts: { routes: screenIds.length, regions: regions.length, overlays: Object.keys(OVERLAY_REQUIRED_STATES).length, entries: entries.length },
  }
}

const modulePath = fileURLToPath(import.meta.url)
if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  const root = path.resolve(path.dirname(modulePath), '..')
  const result = validateVisualClosure({
    root,
    ledgerPath: path.join(root, 'docs', 'qa', 'visual-closure-ledger.json'),
    typesPath: path.join(root, 'src', 'core', 'types.ts'),
    regionsPath: path.join(root, 'src', 'core', 'data', 'regions.ts'),
  })
  if (result.errors.length) {
    console.error(result.errors.join('\n'))
    process.exitCode = 1
  } else {
    const { routes, regions, overlays, entries } = result.counts
    console.log(`visual closure OK: ${routes} routes, ${regions} regions, ${overlays} overlays, ${entries} ledger entries`)
  }
}
