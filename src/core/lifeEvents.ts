import type { Character } from './types'
import { Rng } from './rng'
import { personalityById } from './data/personalities'

// ============================================================
// ライフイベント — 「その子だけの人生」を作る会話群
// 初陣 / 絆(家族の掛け合い) / 灯細りの夜(死の前月)
// 感情移入の本丸。台詞は性根(voice)で分岐する
// ============================================================

export interface LifeLine {
  speaker: string // 表示名('' で地の文)
  text: string
}

export interface LifeScenePayload {
  title: string
  lines: LifeLine[]
  bg?: string // 情景CG(public/img/)
}

const v = (c: Character) => personalityById(c.personalityId).voice

// ---- 初陣 — 初めての夜藪から帰った夜 ----
export function hatsujinScene(c: Character, head: Character | null, rng: Rng): LifeScenePayload {
  const opener: LifeLine = { speaker: '', text: `${c.name}、初陣より帰還。その夜、大燈籠の下で。` }
  const byVoice: Record<string, LifeLine[]> = {
    brave: [
      { speaker: c.name, text: '見たか、今日の私の太刀筋! 明日はもっと深くまで行ける!' },
      { speaker: '綴', text: '「……初陣で笑って帰る奴は、長生きするか、しないかのどちらかだ」' },
    ],
    timid: [
      { speaker: c.name, text: '……怖かった。ずっと、膝が笑ってた。でも……帰ってこられた。' },
      { speaker: head?.name ?? '綴', text: '「帰ってくることが、いちばん難しくて、いちばん偉い。よくやった」' },
    ],
    kind: [
      { speaker: c.name, text: '斬った魔性……あれも昔は、何かの生きものだったのかな。' },
      { speaker: '綴', text: '「そう思える灯は、闇の中で一等よく見える。忘れるな」' },
    ],
    rival: [
      { speaker: c.name, text: '家譜を見せて。私の初陣、歴代で何番目に早い?' },
      { speaker: '綴', text: '「三番目じゃ。……悔しいか? その顔、二番目だった曾祖父とそっくりよ」' },
    ],
    easy: [
      { speaker: c.name, text: 'いやあ、夜藪って歩くだけで疲れるんやなあ。腹減った〜。' },
      { speaker: '綴', text: '「初陣の晩飯は誰より旨い。千年変わらん決まりごとだ」' },
    ],
    cool: [
      { speaker: c.name, text: '灯の残量、敵の出現間隔、記録してきた。次はもっと効率よく回れる。' },
      { speaker: '綴', text: '「頼もしいことだ。……だがな、たまには夜空も見上げておけ」' },
    ],
    wild: [
      { speaker: c.name, text: 'あはは! 魔性って案外もろいな! 明日は主のところまで行こうぜ!' },
      { speaker: head?.name ?? '綴', text: '「その意気や良し。だが無茶と勇気は別物だ — 帰ってこその一族よ」' },
    ],
    lonely: [
      { speaker: c.name, text: '……夜藪で、ずっとみんなの背中を見てた。あれが家族なんだね。' },
      { speaker: '綴', text: '「ああ。そしてお前の背中も、いつか誰かが見て育つ」' },
    ],
  }
  const lines = byVoice[v(c)] ?? byVoice.brave
  void rng
  return { title: '初陣の夜', lines: [opener, ...lines], bg: 'cg_hatsujin.png' }
}

// ---- 絆 — 月々の家族の掛け合い(組み合わせで変化) ----
// スケール規約(GDD_v3 §5): ペア台詞はフラット配列で持つ(Record鍵のN²爆発を回避)。
// a/b は性根voice(アルファベット順で a <= b)または '*'(どの性根でも可)。
// speaker/text 中の {a}/{b} は該当キャラ名に置換。
// 解決順: 完全一致 → 片側ワイルドカード → 汎用(rel対応のコード生成)。
// 同じ組に複数エントリを足せば rng で抽選される(台詞のバリエーション追加はデータ追記のみ)。
interface KizunaPair {
  a: string
  b: string
  lines: LifeLine[]
}

const KIZUNA_PAIRS: KizunaPair[] = [
  {
    a: 'brave', b: 'timid', lines: [
      { speaker: '{a}', text: '前を歩くのは私の役目。お前は後ろで、私の背中だけ見てればいい。' },
      { speaker: '{b}', text: '……うん。でも、あなたが振り向いたとき、ちゃんと立ってるように、するから。' },
    ],
  },
  {
    a: 'brave', b: 'brave', lines: [
      { speaker: '{a}', text: '次の出撃、先陣はもらう。' },
      { speaker: '{b}', text: 'は? 冗談。灯より先に燃えるのはこの私。' },
      { speaker: '', text: '——結局、二人並んで駆けることでいつも決着する。' },
    ],
  },
  {
    a: 'kind', b: 'wild', lines: [
      { speaker: '{b}', text: 'なあなあ、大燈籠のてっぺんに登ると郷が全部見えるんだぜ。' },
      { speaker: '{a}', text: 'こら。……それで、綺麗だった?' },
      { speaker: '{b}', text: '……うん。すっげえ綺麗だった。今度一緒に登る?' },
    ],
  },
  {
    a: 'cool', b: 'easy', lines: [
      { speaker: '{a}', text: '起きて。昼寝が一刻を超えている。時間の無駄よ。' },
      { speaker: '{b}', text: 'ん〜……無駄こそ、二年しかない命の贅沢っちゅうもんや……すぴー。' },
      { speaker: '', text: '{a}は何か言いかけて、やめて、そっと羽織をかけた。' },
    ],
  },
  {
    a: 'lonely', b: 'lonely', lines: [
      { speaker: '{a}', text: '……ねえ。私が先に逝ったら、寂しい?' },
      { speaker: '{b}', text: '寂しいよ。すごく。……だから、一日でも長く、一緒にいよう。' },
    ],
  },
  {
    a: 'rival', b: 'rival', lines: [
      { speaker: '{a}', text: '討伐数、私が上。' },
      { speaker: '{b}', text: '生涯奉燈は私が上。' },
      { speaker: '綴', text: '「家譜が擦り切れるから毎晩数えに来るのはやめんか、お前たち」' },
    ],
  },
  {
    a: 'timid', b: 'timid', lines: [
      { speaker: '{a}', text: '(小声)……夜藪の音、まだ夢に出る?' },
      { speaker: '{b}', text: '(小声)……出る。でも、隣にあなたの布団があると、すぐ眠れる。' },
    ],
  },
  {
    a: 'brave', b: 'kind', lines: [
      { speaker: '{a}', text: 'お前は優しすぎる。夜藪では、その一瞬の迷いが命取りだ。' },
      { speaker: '{b}', text: 'あなたは強すぎる。だからその傷、私が手当てするまで動かないの。' },
    ],
  },
  {
    a: 'brave', b: 'wild', lines: [
      { speaker: '{a}', text: '先陣は私。これは決定事項。' },
      { speaker: '{b}', text: 'じゃあ俺は敵の真ん中に飛び込む係な! 先陣より前だけどな!' },
      { speaker: '綴', text: '「……この二人の代の家譜は、墨の減りが早くて敵わん」' },
    ],
  },
  {
    a: 'brave', b: 'cool', lines: [
      { speaker: '{b}', text: '突撃の前に三つ数えて。それだけで生存率が上がる。' },
      { speaker: '{a}', text: '三つも待てるか。……一つでどうだ。' },
      { speaker: '{b}', text: '交渉成立。一つ数えて、私が二つ目を数え終わる前に敵は終わってるでしょ。' },
    ],
  },
  {
    a: 'easy', b: 'wild', lines: [
      { speaker: '{b}', text: 'なあ! 明日、夜藪の一番深いとこまで競争しようぜ!' },
      { speaker: '{a}', text: 'ええで。ほな、わいは昼寝で先に夢ん中で行っとくわ。' },
      { speaker: '{b}', text: 'ずるいなそれ! ……で、夢の夜藪はどうだった?' },
    ],
  },
  {
    a: 'easy', b: 'lonely', lines: [
      { speaker: '{b}', text: '……隣、いい?' },
      { speaker: '{a}', text: 'ん。ここの縁側は二人分あったかいから、得やで。' },
      { speaker: '', text: 'それきり会話はなかったが、どちらも長いことそこにいた。' },
    ],
  },
  {
    a: 'cool', b: 'wild', lines: [
      { speaker: '{a}', text: 'あなたの無茶を計算に入れると、作戦の成功率が下がるの。' },
      { speaker: '{b}', text: 'でも俺込みの方が楽しいだろ?' },
      { speaker: '{a}', text: '…………楽しさは作戦の要素ではない。(否定はしなかった)' },
    ],
  },
  {
    a: 'cool', b: 'rival', lines: [
      { speaker: '{b}', text: 'あなたの討伐記録、今月中に抜くから。' },
      { speaker: '{a}', text: '無理ね。数字は嘘をつかない。' },
      { speaker: '{b}', text: '数字は抜かれるためにあるの! 見てなさい!' },
    ],
  },
  {
    a: 'kind', b: 'lonely', lines: [
      { speaker: '{a}', text: '寒くない? 綿入れ、もう一枚持ってくる?' },
      { speaker: '{b}', text: 'ううん。……その「寒くない?」だけで、もうあったかい。' },
    ],
  },
  {
    a: 'kind', b: 'rival', lines: [
      { speaker: '{b}', text: '今日も討伐数で負けた……なんであなたはそんなに強いの。' },
      { speaker: '{a}', text: '守りたい背中の数だけ、強くなれるのよ。あなたの背中も入ってる。' },
    ],
  },
  {
    a: 'kind', b: 'timid', lines: [
      { speaker: '{b}', text: '(小声)夜藪、また行くんだよね。……こわいなあ。' },
      { speaker: '{a}', text: '怖いね。でも大丈夫、私の袖を掴んでいていいから。両手が塞がってても、祈りはできるの。' },
    ],
  },
  {
    a: 'rival', b: 'wild', lines: [
      { speaker: '{a}', text: '勝負よ。どっちが多く魔性を狩れるか。' },
      { speaker: '{b}', text: 'のった! 負けた方が今夜の飯当番な!' },
      { speaker: '', text: 'その夜、二人分の飯を作ったのは、結局呆れた当主だった。' },
    ],
  },
  {
    a: 'lonely', b: 'timid', lines: [
      { speaker: '{a}', text: '……あなたがいてくれて、よかった。私一人だったら、とっくに。' },
      { speaker: '{b}', text: 'わ、私も。……ふたりなら、こわさも半分こ、だね。' },
    ],
  },
  {
    a: 'lonely', b: 'rival', lines: [
      { speaker: '{b}', text: '私が記録を作るのはね、家譜に残るためよ。残れば……独りじゃないもの。' },
      { speaker: '{a}', text: '……知ってた。だから私、あなたの記録を毎晩読んでるの。' },
    ],
  },
  {
    a: 'brave', b: 'easy', lines: [
      { speaker: '{a}', text: '起きろ! 鍛錬の刻だ!' },
      { speaker: '{b}', text: 'ん〜……夢ん中で千本素振りしといたから、貸し借りなしや……。' },
      { speaker: '', text: '翌朝、寝ぼけたまま振った一太刀が妙に冴えていて、皆が静かになった。' },
    ],
  },
]

export function kizunaScene(a0: Character, b0: Character, rng: Rng): LifeScenePayload {
  // データ表の a/b と向きを揃える(voice昇順)。
  // 旧実装はキーだけソートしてキャラを並べ替えておらず、話者が入れ替わることがあった。
  const [a, b] = v(a0) <= v(b0) ? [a0, b0] : [b0, a0]
  const va = v(a)
  const vb = v(b)
  const rel = a.humanParentId === b.id || b.humanParentId === a.id ? '親子' : '一族'
  const opener: LifeLine = { speaker: '', text: `ある夜。${a.name}と${b.name}、囲炉裏の傍らで。` }

  const exact = KIZUNA_PAIRS.filter((p) => p.a === va && p.b === vb)
  const wild = KIZUNA_PAIRS.filter(
    (p) => (p.a === '*' && p.b === vb) || (p.a === va && p.b === '*') || (p.a === '*' && p.b === '*'),
  )
  const pool = exact.length > 0 ? exact : wild

  const generic: LifeLine[] = [
    { speaker: a.name, text: rel === '親子' ? 'お前が生まれた日のこと、今でも覚えてる。小さくて、灯みたいに温かかった。' : '私たちの灯、あとどれくらいだろうな。' },
    { speaker: b.name, text: rel === '親子' ? '……その話、もう百回目。でも、もう一回聞かせて。' : '数えるのはよそう。数えたら、歩けなくなる。' },
    { speaker: '', text: '囲炉裏の火が、ぱちりと爆ぜた。' },
  ]

  const fillNames = (t: string) => t.replaceAll('{a}', a.name).replaceAll('{b}', b.name)
  const lines =
    pool.length > 0
      ? rng.pick(pool).lines.map((l) => ({ speaker: fillNames(l.speaker), text: fillNames(l.text) }))
      : generic

  return { title: '絆 — 囲炉裏の夜', lines: [opener, ...lines] }
}

// ---- 灯細りの夜 — 死の前月、当主(または家族)との最後の対話 ----
export function hosoriScene(c: Character, witness: Character | null): LifeScenePayload {
  const w = witness && witness.id !== c.id ? witness.name : '綴'
  const opener: LifeLine = {
    speaker: '',
    text: `${c.name}の灯が、細り始めた。残り、ひと月。本人がいちばんよく分かっている。`,
  }
  const byVoice: Record<string, LifeLine[]> = {
    brave: [
      { speaker: c.name, text: 'なあ。最後にもう一度だけ、夜藪に出たい。……だめか?' },
      { speaker: w, text: '「……ああ、行こう。最後まで、あなたは前を歩く人だ」' },
    ],
    timid: [
      { speaker: c.name, text: 'ずっと怖がりのまま、終わっちゃった。……かっこ悪いね。' },
      { speaker: w, text: '「怖いのに二年間戦い抜いた人を、誰が怖がりと呼ぶものか」' },
      { speaker: c.name, text: '……えへへ。最後に、いいこと聞いた。' },
    ],
    kind: [
      { speaker: c.name, text: '私の形見はね、いちばん寒がりの子にあげて。あの簪、温かいから。' },
      { speaker: w, text: '「……自分の心配をしろと、何度言えば」' },
      { speaker: c.name, text: 'これが私の心配ごとなの。最後まで、変えないわ。' },
    ],
    rival: [
      { speaker: c.name, text: '家譜に書いておいて。「この記録を破る子を、楽しみに待つ」って。' },
      { speaker: w, text: '「破られたら悔しくないのか」' },
      { speaker: c.name, text: '悔しいわよ。でもそれ以上に——嬉しいでしょうね。' },
    ],
    easy: [
      { speaker: c.name, text: '最後の月は、ぜーんぶ昼寝に使うって決めた。' },
      { speaker: w, text: '「……最後まで、お前らしいな」' },
      { speaker: c.name, text: 'せやろ? 星のよう見える縁側、あそこ、次の子にも教えたってな。' },
    ],
    cool: [
      { speaker: c.name, text: '帳簿は整理した。装備の目録も。引き継ぎに漏れはない。' },
      { speaker: w, text: '「……相変わらずだ。何か、し残したことは」' },
      { speaker: c.name, text: '…………夕焼けを、もう少し見ておけばよかった。それだけ。' },
    ],
    wild: [
      { speaker: c.name, text: '祭りだ! 私の灯が消える前に、郷いちばんのでかい祭りをやろう!' },
      { speaker: w, text: '「湿っぽいのは嫌いか」' },
      { speaker: c.name, text: '当たり前だろ! 泣くのは祭りのあと! 笑って送れ!' },
    ],
    lonely: [
      { speaker: c.name, text: '……手、握っててくれる? 消える時まで、ずっと。' },
      { speaker: w, text: '「ずっとだ。約束する」' },
      { speaker: c.name, text: 'なら、もう怖くない。……ねえ、私、この家に生まれてよかった。' },
    ],
  }
  return { title: '灯細りの夜', lines: [opener, ...(byVoice[v(c)] ?? byVoice.brave)], bg: 'cg_hosori.png' }
}
