// 灯の加護(v3.1 M16-4) — 出撃時と焚火で選ぶ「この遠征だけ」の三択強化
// ローグライトの毎回ビルド変化。効果の適用箇所: store(灯費/回復/実り/宝/武名)・enrichAllies(能力)・battle(灯力費)
export interface Boon {
  id: string
  name: string
  desc: string
}

export const BOONS: Boon[] = [
  { id: 'kasei', name: '火勢の加護', desc: '腕の力が漲る(攻撃+12%)' },
  { id: 'teppeki', name: '鉄壁の加護', desc: '肌が岩のように締まる(防御+18%)' },
  { id: 'idaten', name: '韋駄天の加護', desc: '足が軽い(素早さ+8)' },
  { id: 'kyoun', name: '強運の加護', desc: '星回りが良い(運+15 — 会心が出やすい)' },
  { id: 'oohi', name: '大灯の加護', desc: '松明が長持ちする(灯の減りが約3分の2に)' },
  { id: 'touji', name: '湯治の心得', desc: '歩くほど傷が癒える(一歩ごとに微回復)' },
  { id: 'fukuun', name: '福運の加護', desc: '実りが豊か(戦利品+30%)' },
  { id: 'mekiki', name: '目利きの心得', desc: '宝の在処が視える(宝箱の実り+50%)' },
  { id: 'seishin', name: '静心の加護', desc: '技の灯力が澄む(技の消費-25%)' },
  { id: 'kaeribi', name: '帰り火の加護', desc: '無事の帰還が誉れになる(帰還時に武名+15)' },
  { id: 'yamiyo', name: '闇夜の目', desc: '闇に目が慣れる(灯が細っても敵影に気取られにくい)' },
  { id: 'chisio', name: '血汐の滾り', desc: '危地で燃える(体力半分以下で攻撃+25%)' },
]

export function boonById(id: string): Boon | undefined {
  return BOONS.find((b) => b.id === id)
}

// 三択の候補を引く(所持済みは除外)
export function draftBoons(owned: string[], rand: () => number): Boon[] {
  const pool = BOONS.filter((b) => !owned.includes(b.id))
  const picks: Boon[] = []
  const copy = [...pool]
  while (picks.length < 3 && copy.length > 0) {
    picks.push(copy.splice(Math.floor(rand() * copy.length), 1)[0])
  }
  return picks
}
