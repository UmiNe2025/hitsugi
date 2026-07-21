export interface PactAvailability {
  inspectable: boolean
  contractable: boolean
  reason?: string
}

/**
 * 星神の閲覧権と契約権を分離する。
 * 封印だけが詳細閲覧を妨げ、奉燈不足は契約CTAだけを止める。
 */
export function pactAvailability(unlocked: boolean, hoto: number, cost: number): PactAvailability {
  if (!unlocked) return { inspectable: false, contractable: false, reason: 'この星はまだ封印されている' }
  const shortfall = Math.max(0, cost - hoto)
  if (shortfall > 0) {
    return {
      inspectable: true,
      contractable: false,
      reason: `奉燈があと${shortfall}足りない`,
    }
  }
  return { inspectable: true, contractable: true }
}
