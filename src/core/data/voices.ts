// 戦闘台詞(品質刷新v3.1 M15-1) — キャラが「生きて」感じられる文脈台詞
// 性根8種 × 文脈: attack(攻撃) / hurt(被弾) / crisis(危機・灯3割) / victory(勝鬨) / kin(血の呼応) / memento(形見の得物)
// {legacy} は故人名に置換される。発行はbattle.ts(確率制御もそちら)。
import type { Rng } from '../rng'

type VoiceCtx = 'attack' | 'hurt' | 'crisis' | 'victory' | 'kin' | 'memento'

const LINES: Record<string, Record<VoiceCtx, string[]>> = {
  brave: {
    attack: ['前へ!', '一太刀で決める!', '我が家の型、見よ!'],
    hurt: ['この程度……!', '効かぬ!'],
    crisis: ['まだ折れぬ。折れてなるものか。', '灯はまだ、消えておらん!'],
    victory: ['勝鬨を上げよ!', '一族に敗北の二字はない。'],
    kin: ['続くぞ、合わせろ!', '血が呼んでいる — 行くぞ!'],
    memento: ['{legacy}の得物、鈍らせはせん!', 'この一振り、{legacy}と共に!'],
  },
  timid: {
    attack: ['え、えいっ……!', 'あ、当たって……!'],
    hurt: ['ひゃっ……!', 'いたい、いたいよ……'],
    crisis: ['こわい……でも、逃げない……!', 'まだ、立てる、から……'],
    victory: ['か、勝った……? 勝ったんだ……!', 'みんな、無事? よかったぁ……'],
    kin: ['わ、わたしも、やる……!', 'ひとりじゃ、ないから……!'],
    memento: ['{legacy}が、守ってくれてる……', 'この得物……あったかい……'],
  },
  kind: {
    attack: ['御免なさい、痛いでしょうけど。', '安らかに、お眠りなさい。'],
    hurt: ['大丈夫、私は大丈夫。', 'このくらい、平気よ。'],
    crisis: ['皆が無事なら、それでいいの。', 'まだ、祈りは尽きていないわ。'],
    victory: ['皆、傷はない? 見せてごらんなさい。', '敵にも、静かな眠りを。'],
    kin: ['あなたを独りにはさせない。', '血の縁が、手を引くのよ。'],
    memento: ['{legacy}の優しさが、この柄に残ってる。', '{legacy}、見守っていてね。'],
  },
  rival: {
    attack: ['一番槍はもらった!', '記録更新といこう!'],
    hurt: ['……今のは数に入れんぞ。', '痛みも記録のうちだ!'],
    crisis: ['ここで倒れたら負けだ……負けは、嫌いだ!', 'まだ勝敗はついていない!'],
    victory: ['討伐数、更新だ。家譜に書いておけ!', '当然の勝ちだ。次はもっと速く勝つ。'],
    kin: ['取られてたまるか、私も出る!', '手柄は山分けだからな!'],
    memento: ['{legacy}の記録、ここで越える!', '見ていろ{legacy}、俺の方が強い!'],
  },
  easy: {
    attack: ['ほい、っと。', 'まあ、当たるやろ。'],
    hurt: ['いったぁ……かなんなあ。', 'まあ、これくらいはな。'],
    crisis: ['ちょい、まずいかもしれんな……', '慌てへん、慌てへん……たぶん。'],
    victory: ['ほな、終わりや。茶にしよか。', 'ようやった、わいも、みんなも。'],
    kin: ['しゃあない、わいも出るか。', '身内の喧嘩は買わなな。'],
    memento: ['{legacy}はんの得物や、雑には振れんわ。', '{legacy}はん、借りるで。'],
  },
  cool: {
    attack: ['急所は把握済みだ。', '軌道、計算通り。'],
    hurt: ['被弾。だが許容範囲内。', '……痛覚も情報だ。'],
    crisis: ['残灯三割。だが撤退の計算はまだしない。', '危険域。それでも、前へ出る価値はある。'],
    victory: ['戦闘終了。損害、想定以下。', '記録する — 全員、生還。'],
    kin: ['連携効率、最適だ。続く。', '血縁の呼応 — 非合理だが、有効だ。'],
    memento: ['{legacy}の得物。手入れの癖まで残っている。', '{legacy}の型を再現する。観測していろ。'],
  },
  wild: {
    attack: ['うおおおっ!', 'ど真ん中もらいや!'],
    hurt: ['いってえ! やりやがったな!', 'はは、効く効く!'],
    crisis: ['上等だ……祭りはここからだろうが!', '燃えてきたぜ、この土壇場!'],
    victory: ['っしゃあ! 大勝利!', '見たか! これが俺たちの祭りだ!'],
    kin: ['俺も混ぜろ、その喧嘩!', '血が騒ぐんだよ、なあ!'],
    memento: ['{legacy}の得物が唸ってるぜ!', '{legacy}! 見てるか、この暴れっぷり!'],
  },
  lonely: {
    attack: ['みんな、見てて……いくよ!', '離れないで、すぐ終わらせるから。'],
    hurt: ['まだ、そばにいたいのに……!', 'う……はぐれ、ない……!'],
    crisis: ['置いていかないで……まだ戦える!', 'ひとりは、いや……だから勝つ!'],
    victory: ['終わった……ね。みんな、いる?', 'よかった、誰も欠けてない。'],
    kin: ['呼んでくれたの? ……うれしい。', '一緒なら、こわくない!'],
    memento: ['{legacy}がそばにいてくれる気がする。', 'この重さ、{legacy}の温もりだ。'],
  },
}

// 台詞を引く。該当がなければnull(発話しないのも間)。
export function voiceFor(
  personalityId: string,
  ctx: VoiceCtx,
  rng: Rng,
  opts?: { legacy?: string },
): string | null {
  const table = LINES[personalityId]
  if (!table) return null
  const pool = table[ctx]
  if (!pool || pool.length === 0) return null
  let line = rng.pick(pool)
  if (line.includes('{legacy}')) {
    if (!opts?.legacy) return null
    line = line.replaceAll('{legacy}', opts.legacy)
  }
  return line
}

export type { VoiceCtx }
