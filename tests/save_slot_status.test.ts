import { beforeEach, describe, expect, it, vi } from 'vitest'
import { inspectSaveSlot } from '../src/core/save'

class MemStorage {
  private data = new Map<string, string>()
  getItem(key: string) { return this.data.get(key) ?? null }
  setItem(key: string, value: string) { this.data.set(key, String(value)) }
  removeItem(key: string) { this.data.delete(key) }
  clear() { this.data.clear() }
}

const mem = new MemStorage()
vi.stubGlobal('localStorage', mem)

const valid = {
  family: [{ id: 'head', hp: 10, equipment: {} }],
  seasonIndex: 0,
  inventory: [],
  hoto: 0,
  ketsu: 0,
  chronicle: [],
  saveSeq: 1,
  lastPlayedAt: 1,
}

describe('inspectSaveSlot', () => {
  beforeEach(() => mem.clear())

  it('保存が無ければnone', () => {
    expect(inspectSaveSlot()).toBe('none')
  })

  it('正常な本体はready', () => {
    mem.setItem('hitsugi_save_v4', JSON.stringify(valid))
    expect(inspectSaveSlot()).toBe('ready')
  })

  it('本体が壊れていても正常な控えがあればrecoverable', () => {
    mem.setItem('hitsugi_save_v4', '{broken')
    mem.setItem('hitsugi_save_v4_bak', JSON.stringify(valid))
    expect(inspectSaveSlot()).toBe('recoverable')
  })

  it('存在する記がどれも読めなければdamaged', () => {
    mem.setItem('hitsugi_save_v4', '{broken')
    mem.setItem('hitsugi_save_v4_bak', '[]')
    expect(inspectSaveSlot()).toBe('damaged')
  })
})
