// UI設定 — localStorage永続。音量は audio.ts が持つ。
// 旧セーブ/初回は既定値(モーション有効・オート既定OFF)。

const RM_KEY = 'hitsugi_reduce_motion'
const AB_KEY = 'hitsugi_auto_default'
const AUTO_POLICY_KEY = 'hitsugi_auto_policy'

export type AutoBattlePolicy = 'steady' | 'economy' | 'allOut'

export interface AutoPolicySettings {
  version: 1
  policy: AutoBattlePolicy
  stops: {
    hpDanger: boolean
    newDiscovery: boolean
    rareEnemy: boolean
    boss: boolean
  }
}

export const DEFAULT_AUTO_POLICY_SETTINGS: AutoPolicySettings = {
  version: 1,
  policy: 'steady',
  stops: {
    hpDanger: false,
    newDiscovery: false,
    rareEnemy: false,
    boss: false,
  },
}

function safeStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}

function isPolicy(value: unknown): value is AutoBattlePolicy {
  return value === 'steady' || value === 'economy' || value === 'allOut'
}

/**
 * オートの戦い方だけを保存する。オート既定ON/OFFは従来のAB_KEYへ残し、
 * 設定破損や将来versionを理由に既存の開始挙動を変えない。
 */
export function getAutoPolicySettings(): AutoPolicySettings {
  const storage = safeStorage()
  if (!storage) return structuredClone(DEFAULT_AUTO_POLICY_SETTINGS)
  try {
    const raw = storage.getItem(AUTO_POLICY_KEY)
    if (!raw) return structuredClone(DEFAULT_AUTO_POLICY_SETTINGS)
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return structuredClone(DEFAULT_AUTO_POLICY_SETTINGS)
    const value = parsed as Record<string, unknown>
    const stops = value.stops
    if (value.version !== 1 || !isPolicy(value.policy) || !stops || typeof stops !== 'object') {
      return structuredClone(DEFAULT_AUTO_POLICY_SETTINGS)
    }
    const stopValues = stops as Record<string, unknown>
    if (!['hpDanger', 'newDiscovery', 'rareEnemy', 'boss'].every((key) => typeof stopValues[key] === 'boolean')) {
      return structuredClone(DEFAULT_AUTO_POLICY_SETTINGS)
    }
    return {
      version: 1,
      policy: value.policy,
      stops: {
        hpDanger: stopValues.hpDanger as boolean,
        newDiscovery: stopValues.newDiscovery as boolean,
        rareEnemy: stopValues.rareEnemy as boolean,
        boss: stopValues.boss as boolean,
      },
    }
  } catch {
    return structuredClone(DEFAULT_AUTO_POLICY_SETTINGS)
  }
}

export function setAutoPolicySettings(settings: AutoPolicySettings): void {
  const storage = safeStorage()
  if (!storage) return
  const normalized: AutoPolicySettings = {
    version: 1,
    policy: isPolicy(settings.policy) ? settings.policy : DEFAULT_AUTO_POLICY_SETTINGS.policy,
    stops: {
      hpDanger: settings.stops?.hpDanger === true,
      newDiscovery: settings.stops?.newDiscovery === true,
      rareEnemy: settings.stops?.rareEnemy === true,
      boss: settings.stops?.boss === true,
    },
  }
  try {
    storage.setItem(AUTO_POLICY_KEY, JSON.stringify(normalized))
  } catch {
    // 容量超過やprivacy modeでも戦闘そのものを止めない。
  }
}

export function getReduceMotion(): boolean {
  return localStorage.getItem(RM_KEY) === '1'
}

export function setReduceMotion(on: boolean): void {
  localStorage.setItem(RM_KEY, on ? '1' : '0')
  applyReduceMotion()
}

// <html> に reduce-motion クラスを付け外し(CSSがアニメを抑制)。起動時とトグル時に呼ぶ。
export function applyReduceMotion(): void {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('reduce-motion', getReduceMotion())
  }
}

export function getAutoBattleDefault(): boolean {
  return localStorage.getItem(AB_KEY) === '1'
}

export function setAutoBattleDefault(on: boolean): void {
  localStorage.setItem(AB_KEY, on ? '1' : '0')
}
