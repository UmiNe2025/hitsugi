import type { God } from '../types'

// ============================================================
// 極ツ星(rank4)増員分 — 世界の根に触れる星々(GDD_v3 §1: 最終8柱)
// 北辰老は gods.ts に残る。極ツ星の流儀: 物語の核心に指をかける神々。
// 全柱 unlock 付き(GDD_v3 §3)。神授技は gs_{element}4。
// ============================================================

export const GODS_APEX: God[] = [
  {
    id: 'amatsuhi', name: '天津日の残照', kana: 'あまつひのざんしょう', rank: 4, element: 'fire',
    statBias: { str: 24, mnd: 24, luk: 12 }, cost: 800, skillId: 'gs_fire4',
    personality: '消えた太陽の、残り香',
    desc: '千年前に玄冬へ喰われた太陽——その最後の残照が凝った星。誰よりも眩しく、誰よりも寂しい。「私は本体ではないよ。……夕焼けの、忘れ物さ」',
    pactLines: ['太陽の子を産むといい。常夜の郷にこそ、ふさわしい。', '……いつか本物の朝が来たら、私は消える。それまでの縁だ。大事にしよう。'],
    portrait: 'god_amatsuhi.png',
    unlock: { regionId: 'hoshimukuro_tani' },
  },
  {
    id: 'ushimitsu', name: '丑三の大御', kana: 'うしみつのおおみ', rank: 4, element: 'moon',
    statBias: { dex: 26, agi: 22, mnd: 12 }, cost: 700, skillId: 'gs_moon4',
    personality: '夜の最も深い刻の主',
    desc: '丑三つ刻——夜が最も深く、静かな刻の主。常夜千年は、彼にとって千年続く「自分の時間」。だが最近、少し飽きたらしい。',
    pactLines: ['千年、儂の刻が続いた。……正直に言おう。朝が恋しいのは、儂も同じよ。', '夜の底を知る子になる。夜の底を知る者だけが、灯の値打ちを知る。'],
    portrait: 'god_ushimitsu.png',
    unlock: { regionId: 'chochin_zaka' },
  },
  {
    id: 'amanogawa', name: '天の川母神', kana: 'あまのがわのははがみ', rank: 4, element: 'water',
    statBias: { vit: 24, mnd: 26, luk: 10 }, cost: 900, skillId: 'gs_water4',
    personality: '星々すべての母、大河の女神',
    desc: '夜空を流れる大河にして、星々みなの母。星神たちは皆、彼女の川から掬い上げられた雫である。「汐里も、あなたたちも、みんな私の子ですよ」',
    pactLines: ['八代。よくぞ絶やさず繋ぎました。母として、これほど誇らしいことはない。', '私の川の水を一雫、その子に。……渇かない心を持つ子になるでしょう。'],
    portrait: 'god_amanogawa.png',
    unlock: { gen: 8 },
  },
  {
    id: 'genkou', name: '玄黄始祖', kana: 'げんこうのしそ', rank: 4, element: 'earth',
    statBias: { str: 20, vit: 20, mnd: 20, luk: 6 }, cost: 850, skillId: 'gs_earth4',
    personality: '天と地が分かれる前を知る最古の星',
    desc: '天と地がまだ分かたれていなかった頃を知る唯一の星。玄冬が生まれる前から、この夜空を見ていた。「境が生まれる前は、皆同じ闇だったのだよ」',
    pactLines: ['境が生まれる前を知る者として言おう。お前たちの一族は、良い境を保ってきた。', '天地開闢の記憶を、少しだけその子に。……重い贈り物だが、悪いようにはすまい。'],
    portrait: 'god_genkou.png',
    unlock: { regionId: 'akashi_miyama' },
  },
  {
    id: 'shukuyou', name: '宿曜の主', kana: 'しゅくようのぬし', rank: 4, element: 'star',
    statBias: { dex: 22, mnd: 22, luk: 14 }, cost: 820, skillId: 'gs_star4',
    personality: '全ての運命を記す星々の書記',
    desc: '星読みの根源、あらゆる者の生まれと死にを記す星。玄冬にすら記録される運命を与えたのはこの星だという。「記すだけだ。定めるのではない、それだけは違う」',
    pactLines: ['お前たちの一族の頁は、もう千頁を超えている。……大した書物になったものだ。', '運命は記すが、決めはせぬ。だから安心して、好きに生きよ。それがこの星の唯一の助言だ。'],
    portrait: 'god_shukuyou.png',
    unlock: { fame: 1400 },
  },
  {
    id: 'reimei', name: '黎明の胎動', kana: 'れいめいのたいどう', rank: 4, element: 'fire',
    statBias: { str: 18, dex: 18, mnd: 18, agi: 18 }, cost: 950, skillId: 'gs_fire4',
    personality: 'まだ生まれきっていない、次の朝そのもの',
    desc: '常夜の果てに、いつか来るはずの朝そのものが、まだ生まれきらぬまま胎動している星。生まれるにはまだ理由が足りないという。「あと少し……あと少しの理由が要るのだ」',
    pactLines: ['……感じるか。私が近づいている気配を。あなたたちの一族が、その理由の一つだ。', '生まれる日が来たら、真っ先にあなたの家の屋根を照らそう。約束する。'],
    portrait: 'god_reimei.png',
    unlock: { regionId: 'chochin_zaka', gen: 6 },
  },
  {
    id: 'owarinaki', name: '終わりなき者', kana: 'おわりなきもの', rank: 4, element: 'moon',
    statBias: { str: 16, vit: 16, dex: 16, agi: 16, mnd: 16, luk: 16 }, cost: 999, skillId: 'gs_moon4',
    personality: '始まりも終わりも知らぬ、円環そのもの',
    desc: '世代交代という円環そのものが姿を得た星。始まりも終わりもなく、ただ継がれ続けることを見守る。「終わらぬことこそが、お前たちの一族の強さだ」',
    pactLines: ['八季で終わる命が、千年続く。……その矛盾こそ、我が最も愛する物語だ。', '契ろう。この円環に、また一つ環が加わる。それだけで、我は満たされる。'],
    portrait: 'god_owarinaki.png',
    unlock: { fame: 1800, gen: 10 },
  },
]

// 弔いの文(極ツ星増員分)
export const MOURNING_APEX: Record<string, string> = {
  amatsuhi: '「私の残照を、少しだけあの子の墓標に当てておいた。……千年ぶりに、夕焼けというものを思い出したよ」',
  ushimitsu: '「今夜の丑三つ刻は、いつもより長い。……儂が延ばした。あの子との別れを惜しむ者らのために、夜の底を少しだけ広げた」',
  amanogawa: '「お帰りなさい、私の子。川はすべての雫を憶えています。あなたが流れた岸辺のことも、ぜんぶ、ぜんぶ」',
  genkou: '「境が生まれる前の闇に、あの子を還した。……そこには、もう寂しさという境目もない」',
  shukuyou: '「あの子の頁に、最後の一行を記した。『よく生きた』——短いが、これ以上の言葉を儂は知らぬ」',
  reimei: '「あの子の分だけ、私が生まれる理由が増えた。……いつか本当に朝が来たなら、それはあの子のおかげでもある」',
  owarinaki: '「終わりではない。円環に、また一つ環が閉じただけだ。……お前たちはそれを『死』と呼ぶのだろうが、我には『継承』としか見えぬ」',
}
