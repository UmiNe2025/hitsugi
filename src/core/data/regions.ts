import type { Region } from '../types'
import { FAME_SEAL_THRESHOLD } from '../constants'

// 夜藪の地域 — 武功(fame)で順に解放
export const REGIONS: Region[] = [
  {
    id: 'yoi_forest', name: '宵の森', tier: 1, depth: 6, unlockFame: 0,
    desc: '郷のすぐ外に広がる薄闇の森。かつては茸狩りの山だった。',
    bg: 'bg_forest.png',
  },
  {
    id: 'mushishigure_michi', name: '蟲時雨の径', tier: 1, depth: 6, unlockFame: 30, bossId: 'boss_kokenushi',
    desc: '羽虫の羽音が雨のように降り注ぐ小径。踏み入るたび、羽音が濃くなる。',
    bg: 'bg_forest.png',
  },
  {
    id: 'yaregasa_douhyou', name: '破れ傘の道標', tier: 1, depth: 6, unlockFame: 45, bossId: 'boss_karakasababa',
    desc: '朽ちた傘が道しるべのように連なる山道。数えるたび本数が違うという。',
    bg: 'bg_forest.png',
  },
  {
    id: 'chochin_zaka', name: '提灯坂', tier: 2, depth: 8, unlockFame: 60, bossId: 'boss_hyakume',
    desc: '無数の朽ちた提灯が並ぶ古い参道。誰が灯すのか、火だけは絶えない。',
    bg: 'bg_zaka.png',
  },
  {
    id: 'haikyo_goten', name: '廃墟の御殿', tier: 2, depth: 8, unlockFame: 180, bossId: 'boss_yureidono',
    desc: '誰の持ち物だったかも忘れられた大きな御殿の廃墟。夜ごと奥座敷に灯りが点る。',
    bg: 'bg_zaka.png',
  },
  {
    id: 'kare_numa', name: '涸れ沼の畔', tier: 2, depth: 8, unlockFame: 140, bossId: 'boss_hiruhime',
    desc: '千年前に涸れたはずの沼。畔に立つと、今も地中で水の音がする。',
    bg: 'bg_zaka.png',
  },
  {
    id: 'hoshimukuro_tani', name: '星骸の谷', tier: 3, depth: 10, unlockFame: 220, bossId: 'boss_hoshimukuro',
    desc: '玄冬に喰われた星々が墜ちて積もる谷。星の骸は今も微かに瞬く。',
    bg: 'bg_tani.png',
  },
  {
    id: 'hakkotsu_bayashi', name: '白骨林', tier: 3, depth: 10, unlockFame: 350, bossId: 'boss_hakkotsu',
    desc: '古戦場の骨が根を張って林になったと伝わる森。風のない夜も、木々が鳴る。',
    bg: 'bg_tani.png',
  },
  {
    id: 'akashi_miyama', name: '灯ノ御山', tier: 4, depth: 12, unlockFame: FAME_SEAL_THRESHOLD, bossId: 'boss_gentou',
    desc: '常夜の中心。頂に玄冬が座す。千年、誰も頂に届いていない。',
    bg: 'bg_miyama.png',
  },
]

export function regionById(id: string): Region {
  const r = REGIONS.find((x) => x.id === id)
  if (!r) throw new Error(`unknown region: ${id}`)
  return r
}
