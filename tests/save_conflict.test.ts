import { describe, expect, it } from 'vitest'
import type { GameData } from '../src/core/types'
import { saveGame, onExternalSaveChange, isSaveReadOnly } from '../src/core/save'

// M33: 複数タブ read-only 化。別タブが保存(storageイベント)したら、このタブは saveGame を止めて
// 相手の新しい進行を上書き潰さない(警告のみでは last-writer-wins の喪失を防げない — devil HIGH-4)。
// プロジェクトは jsdom を使わない方針なので、save.test.ts と同じく Node環境へ window/localStorage を
// 最小注入する(save.ts の onExternalSaveChange は window.addEventListener、saveGame は localStorage を使う)。
// vitestはテストファイル単位でモジュール状態を隔離するため、ここで saveReadOnly を true にしても
// 他テスト(save.test.ts)の saveGame には影響しない。
type Ev = { type: string; key: string | null; newValue: string | null }
const listeners: Record<string, ((e: Ev) => void)[]> = {}
const fakeWindow = {
  addEventListener: (t: string, h: (e: Ev) => void) => { (listeners[t] ??= []).push(h) },
  removeEventListener: (t: string, h: (e: Ev) => void) => { listeners[t] = (listeners[t] ?? []).filter((x) => x !== h) },
  dispatchEvent: (e: Ev) => { for (const h of listeners[e.type] ?? []) h(e); return true },
}
class MemStorage {
  store = new Map<string, string>()
  getItem(k: string) { return this.store.get(k) ?? null }
  setItem(k: string, v: string) { this.store.set(k, v) }
  removeItem(k: string) { this.store.delete(k) }
  clear() { this.store.clear() }
}
// @ts-expect-error node環境へwindowを最小注入
globalThis.window = fakeWindow
// @ts-expect-error node環境へlocalStorageを注入
globalThis.localStorage = new MemStorage()

const KEY = 'hitsugi_save_v4'
const fire = (key: string | null) => fakeWindow.dispatchEvent({ type: 'storage', key, newValue: 'x' })

describe('複数タブ read-only 化(M33)', () => {
  it('外部saveを検知するとread-only化し、以後のsaveGameが止まる', () => {
    expect(isSaveReadOnly()).toBe(false)
    let notified = false
    const off = onExternalSaveChange(() => { notified = true })

    fire(KEY) // 別タブがKEYを更新した体
    expect(notified, '検知コールバックが呼ばれる').toBe(true)
    expect(isSaveReadOnly(), 'read-only化する').toBe(true)

    // read-only後は saveGame が localStorage を触らない(相手の進行を守る)。
    // ガードは saveGame の先頭で return するため data の中身は参照されない。
    localStorage.removeItem(KEY)
    saveGame({} as GameData)
    expect(localStorage.getItem(KEY), 'read-only中はKEYへ書き込まない').toBeNull()

    off()
  })

  it('無関係なキーのstorageイベントでは新規検知しない', () => {
    let notified = false
    const off = onExternalSaveChange(() => { notified = true })
    fire('some_unrelated_key')
    expect(notified, '別キーでは通知しない').toBe(false)
    off()
  })
})
