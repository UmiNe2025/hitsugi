import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { validateVisualClosure } from '../scripts/validate_visual_closure.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const canonicalLedgerPath = path.join(root, 'docs', 'qa', 'visual-closure-ledger.json')
const typesPath = path.join(root, 'src', 'core', 'types.ts')
const regionsPath = path.join(root, 'src', 'core', 'data', 'regions.ts')

type LedgerEntry = Record<string, unknown> & {
  kind: 'route' | 'region' | 'overlay'
  sceneId: string
  status: string
  evidence: string[]
  runtimeBundle: unknown
  provenance: unknown
  nAReason: string | null
  verification: unknown
}

type Ledger = { schemaVersion: number; entries: LedgerEntry[] }

function readLedger(): Ledger {
  return JSON.parse(fs.readFileSync(canonicalLedgerPath, 'utf8')) as Ledger
}

function validateMutation(mutate: (ledger: Ledger) => void) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hitsugi-visual-closure-'))
  const ledgerPath = path.join(directory, 'ledger.json')
  try {
    const ledger = readLedger()
    mutate(ledger)
    fs.writeFileSync(ledgerPath, JSON.stringify(ledger), 'utf8')
    return validateVisualClosure({ root, ledgerPath, typesPath, regionsPath })
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
}

describe('visual closure ledger validator', () => {
  it('derives and closes the current 22 routes, 40 regions, and route-external overlays', () => {
    const result = validateVisualClosure({ root, ledgerPath: canonicalLedgerPath, typesPath, regionsPath })
    expect(result.errors).toEqual([])
    expect(result.counts).toEqual({ routes: 22, regions: 40, overlays: 6, entries: 68 })
  })

  it('rejects missing and extra route IDs, missing regions, and missing overlays', () => {
    const result = validateMutation((ledger) => {
      const title = ledger.entries.find((entry) => entry.kind === 'route' && entry.sceneId === 'title')!
      ledger.entries = ledger.entries.filter((entry) => !(
        (entry.kind === 'route' && entry.sceneId === 'title')
        || (entry.kind === 'region' && entry.sceneId === 'yoi_forest')
        || (entry.kind === 'overlay' && entry.sceneId === 'toast')
      ))
      ledger.entries.push({ ...title, sceneId: 'future-route' })
    })
    expect(result.errors).toContain('ledger routes vs Screen union: missing title')
    expect(result.errors).toContain('ledger routes vs Screen union: extra future-route')
    expect(result.errors).toContain('ledger regions vs REGIONS: missing yoi_forest')
    expect(result.errors).toContain('ledger overlays vs overlay inventory: missing toast')
  })

  it('rejects missing fields, non-lifecycle status, unexplained N/A, and state coverage drift', () => {
    const result = validateMutation((ledger) => {
      const title = ledger.entries.find((entry) => entry.sceneId === 'title')!
      delete title.hero
      title.status = 'almost-done'
      title.runtimeBundle = 'N/A'
      title.nAReason = ''
      title.stateId = ['new']
    })
    expect(result.errors).toContain('entries[0]: missing hero')
    expect(result.errors).toContain('entries[0].status: invalid lifecycle status almost-done')
    expect(result.errors).toContain('entries[0].nAReason: required when a field is N/A')
    expect(result.errors.some((error) => error.startsWith('route title state coverage: missing '))).toBe(true)
  })

  it('rejects escaping evidence paths and a supplied runtime hash mismatch', () => {
    const result = validateMutation((ledger) => {
      const title = ledger.entries.find((entry) => entry.sceneId === 'title')!
      title.evidence = ['../outside-repository.txt']
      title.runtimeBundle = { path: 'package.json', sha256: '0'.repeat(64) }
    })
    expect(result.errors).toContain('entries[0].evidence[0]: escapes repository root')
    expect(result.errors).toContain('entries[0].runtimeBundle.sha256: does not match package.json')
  })

  it.each(['scene-ready', 'released'])('rejects unverified %s claims', (status) => {
    const result = validateMutation((ledger) => {
      const title = ledger.entries.find((entry) => entry.sceneId === 'title')!
      title.status = status
      title.runtimeBundle = 'N/A'
      title.provenance = 'N/A'
      title.nAReason = 'Mutation deliberately removes integration evidence.'
      title.verification = null
    })
    expect(result.errors).toContain(`entries[0]: ${status} requires a runtime bundle`)
    expect(result.errors).toContain(`entries[0]: ${status} requires provenance`)
    expect(result.errors).toContain(`entries[0]: ${status} requires verification`)
    if (status === 'released') expect(result.errors).toContain('entries[0].verification.releaseApproval: must be approved')
  })

  it('rejects scene-integrated claims without per-state, five-width, and mechanical evidence', () => {
    const result = validateMutation((ledger) => {
      const title = ledger.entries.find((entry) => entry.sceneId === 'title')!
      title.status = 'scene-integrated'
      delete title.coverageEvidence
    })
    expect(result.errors).toContain('entries[0]: scene-integrated requires coverageEvidence')
  })
})
