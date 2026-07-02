import type { EventDef } from '../expedition'

// ============================================================
// 夜藪の事件・増員第4波(GDD_v3 M3c: 121→180) — events3.tsの続き。
// ============================================================

export const EXTRA_EVENTS_4: EventDef[] = [
  {
    id: 'tsuchi_no_tsuki_no_kakera',
    text: '地面に、月の欠片のような淡く光る石が突き刺さっている。触れると冷たく、しかし温かい。',
    choices: [
      { label: '拾い上げる', successRate: 0.55, outcomes: [{ log: '欠片は掌の中で溶けるように消え、代わりに力が満ちた。', ketsu: 4 }, { log: '欠片は砕けて光の粉になり、風に散った。何も残らなかった。' }] },
      { label: '土に埋め直す', outcomes: [{ log: '欠片が迷わぬよう、そっと元の場所へ還した。', hpRatio: 0.08 }] },
    ],
  },
  {
    id: 'kubinashi_no_zou',
    text: '首から上のない石像が、道の真ん中に鎮座している。誰かが首を持ち去ったのか、最初からないのか。',
    choices: [
      { label: '首の代わりに石を積む', outcomes: [{ log: '即席の首を作ってやった。心なしか、像が安堵したように見えた。', fame: 3 }] },
      { label: '足早に通り過ぎる', outcomes: [{ log: '妙な視線を感じたが、振り返らずに進んだ。' }] },
    ],
  },
  {
    id: 'akai_ito_no_musubime',
    text: '木々の間に、赤い糸が幾重にも結ばれている。誰と誰を結ぶ糸か、辿ることはできない。',
    choices: [
      { label: '糸を辿ってみる', successRate: 0.45, outcomes: [{ log: '糸の先に小さな祠を見つけた。縁結びの神が微笑んでいる。', fame: 4, light: 6 }, { log: '糸は絡まり合うばかりで、結局辿りきれなかった。' }] },
      { label: 'そっと糸を整える', outcomes: [{ log: '絡まった糸をほどいてやった。誰かの縁が結ばれやすくなっただろうか。', hpRatio: 0.06 }] },
    ],
  },
  {
    id: 'suna_no_tokei',
    text: '朽ちた砂時計が、誰にも触れられていないのに逆さになったり戻ったりを繰り返している。',
    choices: [
      { label: '手で止めてみる', successRate: 0.5, outcomes: [{ log: '砂時計はぴたりと止まった。中の砂が一瞬、宝石に見えた。', ketsu: 3 }, { log: '触れた途端、砂時計は粉々に砕けた。時が惜しかったのかもしれない。' }] },
      { label: '気にせず観察する', outcomes: [{ log: 'しばらく眺めていたが、法則はついに掴めなかった。' }] },
    ],
  },
  {
    id: 'warehateta_koibumi',
    text: '破れた恋文が茂みに引っかかっている。文字は滲んでいるが、想いの強さだけは伝わってくる。',
    choices: [
      { label: '最後まで読んでみる', outcomes: [{ log: '届かなかった想いの記録だった。持ち帰り、家譜に添えて弔うことにした。', fame: 2 }] },
      { label: '土に埋めて弔う', outcomes: [{ log: '文を丁寧に埋めた。せめて土の下で、想いが届きますように。', hpRatio: 0.1 }] },
    ],
  },
  {
    id: 'odoru_kage_no_wa',
    text: '開けた場所で、無数の影が輪になって静かに踊っている。実体は見当たらない。',
    choices: [
      { label: '輪に加わってみる', successRate: 0.5, outcomes: [{ log: '影たちは歓迎するように輪を広げた。踊り終えると力が満ちていた。', hpRatio: 0.2, fame: 2 }, { log: '輪に入った途端、影が乱れて消えた。場違いだったようだ。' }] },
      { label: '遠くから眺める', outcomes: [{ log: '静かな踊りをしばし見物した。悪いものではなさそうだった。' }] },
    ],
  },
  {
    id: 'kieta_kobune',
    text: '涸れた川床に小舟が乗り上げている。水はないのに、舟だけが濡れているように見える。',
    choices: [
      { label: '舟の中を調べる', successRate: 0.5, outcomes: [{ log: '舟底に古い奉燈がいくつか残されていた。', hoto: 35 }, { log: '舟は触れた途端に砂となって崩れた。幻だったのかもしれない。' }] },
      { label: 'そっとしておく', outcomes: [{ log: '舟の持ち主がいつか戻るかもしれない。そのままにした。' }] },
    ],
  },
  {
    id: 'nemuru_ishigami',
    text: '苔むした石神が、目を閉じてすやすやと寝息を立てている。起こしていいものか迷う。',
    choices: [
      { label: '静かに見守る', outcomes: [{ log: '穏やかな寝息を邪魔せず、その場を離れた。', hpRatio: 0.1 }] },
      { label: 'そっと声をかけてみる', successRate: 0.4, outcomes: [{ log: '石神は薄目を開け、礼にと小さな加護を授けてくれた。', light: 10 }, { log: '石神は寝返りを打っただけだった。起きなかったようだ。' }] },
    ],
  },
  {
    id: 'kuchihateta_fumizukue',
    text: '朽ちた文机の上に、書きかけの家譜が置かれたままになっている。筆はとうに乾いている。',
    choices: [
      { label: '続きを書き足す', successRate: 0.5, outcomes: [{ log: '拙いながらも続きを綴った。名も知らぬ誰かの記録が、少しだけ繋がった。', fame: 4 }, { log: '筆が思うように動かず、うまく書けなかった。それでも心は届いただろう。' }] },
      { label: '家譜を大切に持ち帰る', outcomes: [{ log: '郷の書庫に納めることにした。誰かがいつか読むかもしれない。', fame: 2 }] },
    ],
  },
  {
    id: 'tobira_no_nai_ie',
    text: '扉のない小さな家が建っている。窓からは温かそうな灯りが漏れているが、入り口が見当たらない。',
    choices: [
      { label: '窓越しに声をかける', successRate: 0.45, outcomes: [{ log: '中から柔らかな声が返り、隙間から温かい菓子が差し出された。', hpRatio: 0.15 }, { log: '声をかけても、灯りはふっと消えてしまった。' }] },
      { label: '扉を探して家の周りを回る', outcomes: [{ log: '結局、扉は見つからなかった。最初から必要ないのかもしれない。' }] },
    ],
  },
  {
    id: 'mure_naki_hotaru',
    text: '一匹だけの蛍が、群れからはぐれたように点滅しながら彷徨っている。',
    choices: [
      { label: '道を示すように先導する', outcomes: [{ log: '蛍は嬉しそうに明滅を強め、しばらく道を照らしてくれた。', light: 8 }] },
      { label: '手のひらに乗せて休ませる', outcomes: [{ log: '蛍はしばし休み、元気を取り戻して飛び立った。', hpRatio: 0.08 }] },
    ],
  },
  {
    id: 'sabita_suzu_no_ki',
    text: '錆びた鈴が無数に吊るされた木がある。風もないのに、時折ひとつだけ小さく鳴る。',
    choices: [
      { label: '鳴った鈴を確かめる', successRate: 0.5, outcomes: [{ log: '鈴の中に小さな血珠が挟まっていた。', ketsu: 3 }, { log: '鈴は触れた途端に砕けて土に還った。' }] },
      { label: '音の数を数えてみる', outcomes: [{ log: '数えるうちに落ち着いた気持ちになった。', hpRatio: 0.08 }] },
    ],
  },
  {
    id: 'kage_no_nai_hi',
    text: '焚き火のような光がゆらめいているのに、影がまったくできない。近づいても熱は感じない。',
    choices: [
      { label: '手をかざしてみる', successRate: 0.5, outcomes: [{ log: '不思議な温もりが体に染み渡った。', hpRatio: 0.2 }, { log: '手は冷たいまま何も感じなかった。幻の火だったようだ。' }] },
      { label: '離れた場所から見守る', outcomes: [{ log: '揺らめく光を静かに眺めた。' }] },
    ],
  },
  {
    id: 'mayoiko_no_uta',
    text: 'あどけない歌声が、どこからともなく聞こえてくる。姿は見えず、声だけが道案内のように響く。',
    choices: [
      { label: '歌に導かれてみる', successRate: 0.5, outcomes: [{ log: '導かれた先に小さな社があった。歌声は満足げに止んだ。', fame: 4, light: 5 }, { log: '歌は途中で止み、迷ってしまった。何とか元の道に戻れた。', hpRatio: -0.06 }] },
      { label: '歌に耳を澄ませるだけにする', outcomes: [{ log: '優しい歌声をしばし楽しんだ。', hpRatio: 0.06 }] },
    ],
  },
  {
    id: 'kuroi_kasa_no_retsu',
    text: '黒い傘だけが等間隔に並んで、誰も差していないのに一列に浮かんでいる。',
    choices: [
      { label: '列の下を通り抜ける', successRate: 0.6, outcomes: [{ log: '傘の下を通ると、ふわりと良い香りがした。歓迎されたようだ。', fame: 2 }, { log: '傘が一斉に閉じ、小さな悲鳴と共に驚かされた。', hpRatio: -0.06 }] },
      { label: '迂回する', outcomes: [{ log: '無用な詮索は避け、遠回りをした。' }] },
    ],
  },
  {
    id: 'tokoyo_no_kingyo',
    text: '干上がった水鉢の中で、金魚が一匹、水がないのに平然と泳いでいる。',
    choices: [
      { label: '水を汲んできてやる', successRate: 0.6, outcomes: [{ log: '水を注ぐと金魚は嬉しそうに跳ね、鱗が一枚金色に光って落ちた。', hoto: 30 }, { log: '水を探したが、近くには見当たらなかった。金魚は気にせず泳ぎ続けている。' }] },
      { label: 'そのまま見守る', outcomes: [{ log: '水がなくても平気なようだ。しばし眺めて満足した。', hpRatio: 0.06 }] },
    ],
  },
  {
    id: 'shiroi_kemuri_no_wa',
    text: '白い煙が輪を描きながら立ち上っている。煙にしては妙に形が崩れない。',
    choices: [
      { label: '輪をくぐってみる', successRate: 0.5, outcomes: [{ log: '輪をくぐると、体が軽くなったような感覚があった。', hpRatio: 0.15 }, { log: '輪は触れた途端に霧散した。何も起きなかった。' }] },
      { label: '煙の元を探す', outcomes: [{ log: '元を辿ると、小さな香炉が見つかった。誰かの供養の跡らしい。', fame: 2 }] },
    ],
  },
  {
    id: 'yobisuteno_ishibumi',
    text: '苔に覆われた石碑がある。刻まれた名は読めないが、何度も摩られた跡だけが残っている。',
    choices: [
      { label: '苔を払って読もうとする', successRate: 0.4, outcomes: [{ log: '一部だけ読み取れた。かつてこの地を守った誰かの名だった。', fame: 5 }, { log: '苔はどうしても取れなかった。名は永遠に隠れたままだ。' }] },
      { label: '手を合わせるだけにする', outcomes: [{ log: '名もわからぬまま、静かに祈りを捧げた。', hpRatio: 0.08 }] },
    ],
  },
  {
    id: 'kuraki_ni_hikaru_medama',
    text: '茂みの奥、地面すれすれの高さに小さな目玉がいくつも並んで光っている。生き物かどうかも分からない。',
    choices: [
      { label: 'そっと目を逸らして通る', outcomes: [{ log: '刺激しないよう、静かに通り過ぎた。' }] },
      { label: '正面から見つめ返す', successRate: 0.5, outcomes: [{ log: '目玉たちは根負けしたように瞬きし、茂みの奥へ引っ込んだ。', fame: 2 }, { log: '見つめ返すと、一斉にこちらへ近づいてきた! 慌てて身構えた。', battle: true }] },
    ],
  },
  {
    id: 'kareha_no_tegami',
    text: '一枚の枯葉に、蟻の這った跡のような細かい文字が刻まれている。誰かの伝言だろうか。',
    choices: [
      { label: '文字を読み解こうとする', successRate: 0.45, outcomes: [{ log: '断片的にだが読めた。「ここに眠る」とだけ書かれていた。丁重に弔った。', fame: 3 }, { log: '結局読み解けなかった。枯葉は風に飛ばされていった。' }] },
      { label: '大切に持ち帰る', outcomes: [{ log: '解読はできなかったが、家譜に挟んで保管することにした。' }] },
    ],
  },
  {
    id: 'nijuu_no_ashioto',
    text: '自分たちの足音に、もう一つ余分な足音が重なって聞こえる。振り返っても誰もいない。',
    choices: [
      { label: '「一緒に来るか」と声をかける', outcomes: [{ log: '足音は心なしか弾むように変わった。道連れができたようだ。', hpRatio: 0.1 }] },
      { label: '気にせず歩調を保つ', outcomes: [{ log: '余分な足音は、しばらくすると自然に消えた。' }] },
    ],
  },
  {
    id: 'saita_mama_no_higanbana',
    text: '季節外れの彼岸花が一面に咲いている。常夜でこれほど鮮やかな赤は珍しい。',
    choices: [
      { label: '花を摘んで持ち帰る', successRate: 0.55, outcomes: [{ log: '摘んだ花は不思議な力を宿していた。', ketsu: 3 }, { log: '摘んだ途端、花は黒く萎れてしまった。持ち帰れなかった。' }] },
      { label: '咲いたまま愛でる', outcomes: [{ log: '鮮やかな赤をしばし眺めた。目の保養になった。', hpRatio: 0.08 }] },
    ],
  },
  {
    id: 'kuzureta_kamado',
    text: '崩れた竈の跡から、まだ温かい灰が僅かに立ち上っている。誰かが最近まで使っていたようだ。',
    choices: [
      { label: '灰をかき分けて調べる', successRate: 0.5, outcomes: [{ log: '灰の中から欠けていない土鍋が出てきた。使えそうだ。', hoto: 25 }, { log: '灰を払っただけで、特に何も見つからなかった。' }] },
      { label: '竈を直してやる', outcomes: [{ log: '簡単に積み直した。誰かがまた使うかもしれない。', fame: 2 }] },
    ],
  },
  {
    id: 'tomaranai_fuusha',
    text: '風のない場所で、小さな風車だけが休みなく回り続けている。誰が回しているのか分からない。',
    choices: [
      { label: '手で止めてみる', successRate: 0.5, outcomes: [{ log: '止めた瞬間、心地よい風が一陣吹き抜けた。', hpRatio: 0.12 }, { log: '止めようとしたが、なぜか手が滑って止められなかった。' }] },
      { label: '回り続けるままにする', outcomes: [{ log: '不思議な光景をしばし眺めた。', fame: 1 }] },
    ],
  },
  {
    id: 'namae_no_nai_hakaishi',
    text: '何も刻まれていない真っ白な墓石がぽつんと立っている。誰のためのものかは分からない。',
    choices: [
      { label: '自分の名を語りかける', outcomes: [{ log: '墓石にそっと家名を告げた。誰かの代わりに、聞き届けてくれたようだ。', fame: 3 }] },
      { label: '花を手向けて去る', outcomes: [{ log: '名もなき誰かに、せめて手向けを。', hpRatio: 0.08 }] },
    ],
  },
  {
    id: 'chi_no_ame',
    text: '突然、生温かい霧のような雨が降り出した。触れると微かに赤みを帯びているように見える。',
    choices: [
      { label: '急いで雨宿りする', outcomes: [{ log: '木陰に避難した。雨はすぐに止み、何事もなかった。' }] },
      { label: 'そのまま進み続ける', successRate: 0.5, outcomes: [{ log: '雨に濡れても特に害はなかった。むしろ体が軽くなった気がする。', hpRatio: 0.1 }, { log: '雨に当たると寒気がした。急いで先を急いだ。', hpRatio: -0.08 }] },
    ],
  },
  {
    id: 'warau_men_no_yama',
    text: '古びた能面が山のように積まれている。すべて同じ、微かに笑ったような表情をしている。',
    choices: [
      { label: '一枚手に取ってみる', successRate: 0.4, outcomes: [{ log: '面を持つと、亡き演者の記憶が一瞬流れ込んできた。良い形見だ。', itemTier: 2 }, { log: '面を持つと妙な悪寒がした。すぐに戻した。', hpRatio: -0.1 }] },
      { label: '触れずに立ち去る', outcomes: [{ log: '得体のしれなさに、そっと距離を取った。' }] },
    ],
  },
  {
    id: 'oto_dake_no_matsuri',
    text: '祭囃子の音だけが遠くから聞こえてくるが、灯りも人影もどこにも見えない。',
    choices: [
      { label: '音のする方へ向かう', successRate: 0.45, outcomes: [{ log: '小さな空き地に着くと、音がぴたりと止んだ。代わりに奉燈が置かれていた。', hoto: 30 }, { log: '歩いても歩いても音との距離は縮まらなかった。' }] },
      { label: '音を楽しみながらその場に留まる', outcomes: [{ log: '賑やかな音色をしばし楽しんだ。', hpRatio: 0.08 }] },
    ],
  },
  {
    id: 'kieyuku_teashi_no_ato',
    text: '地面に残る手足の跡が、まるで生き物のように少しずつ薄れて消えていく。',
    choices: [
      { label: '跡を辿って急ぐ', successRate: 0.5, outcomes: [{ log: '消える寸前、跡の主が落とした小さな守り袋を見つけた。', itemTier: 1 }, { log: '追いつく前に、跡は完全に消えてしまった。' }] },
      { label: '消えるに任せる', outcomes: [{ log: '無理に追わず、静かに見送った。' }] },
    ],
  },
  {
    id: 'futatsu_no_tsuki',
    text: '常夜の空に、見慣れぬもう一つの月がうっすらと重なって見える。すぐにまた一つに戻った。',
    choices: [
      { label: '重なった瞬間を記録する', outcomes: [{ log: '咄嗟にスケッチした。貴重な記録になりそうだ。', fame: 3 }] },
      { label: 'ただ見上げて過ごす', outcomes: [{ log: '不思議な光景に、しばし言葉を失った。', hpRatio: 0.1 }] },
    ],
  },
  {
    id: 'karappo_no_kago',
    text: '空の駕籠が、担ぎ手もいないのにゆっくりと道の真ん中を進んでいる。',
    choices: [
      { label: '道を譲る', outcomes: [{ log: '深く頭を下げて道を譲った。駕籠は会釈するように揺れて通り過ぎた。', fame: 2 }] },
      { label: '中を覗いてみる', successRate: 0.4, outcomes: [{ log: '中には古い位牌が一つ、丁重に安置されていた。手を合わせた。', fame: 3 }, { log: '覗いた瞬間、駕籠は急に速度を上げて走り去った。少し驚いた。', hpRatio: -0.05 }] },
    ],
  },
  {
    id: 'kobore_ochita_hoshikuzu',
    text: '夜空から、粉雪のような星屑がはらはらと零れ落ちてくる。手のひらに受けると仄かに光る。',
    choices: [
      { label: '両手いっぱいに受け止める', successRate: 0.5, outcomes: [{ log: '星屑が掌の中で小さな結晶になった。', ketsu: 4 }, { log: '星屑は手のひらで溶けるように消えてしまった。' }] },
      { label: '降る様をただ眺める', outcomes: [{ log: '幻想的な光景に隊全員が見入った。', hpRatio: 0.12 }] },
    ],
  },
  {
    id: 'kuchi_no_kane',
    text: '朽ちかけた鐘楼に、ひび割れた鐘がひとつ吊るされている。鳴らせば何かが応えそうな気配。',
    choices: [
      { label: '鐘を鳴らす', successRate: 0.5, outcomes: [{ log: '鐘の音が夜藪全体に響き渡り、遠くで別の鐘が応えるように鳴った。', fame: 5, light: 6 }, { log: '鐘はひび割れた音を立てただけだった。何も起こらなかった。' }] },
      { label: '鳴らさず立ち去る', outcomes: [{ log: '何かを起こすのが怖く、そっとその場を離れた。' }] },
    ],
  },
  {
    id: 'tsuchi_ni_moguru_hi',
    text: '青白い火の玉が、まるで生き物のように地面に潜ったり出てきたりを繰り返している。',
    choices: [
      { label: '火の玉を追いかける', successRate: 0.45, outcomes: [{ log: '火の玉が潜った跡に、小さな骨壺が埋まっていた。丁重に弔った。', fame: 4 }, { log: '追いかけているうちに見失ってしまった。' }] },
      { label: '遊ぶに任せて見守る', outcomes: [{ log: '火の玉は満足そうに何度も出入りを繰り返し、やがて消えた。', hpRatio: 0.08 }] },
    ],
  },
  {
    id: 'yozora_wo_utsusu_tamago',
    text: '大きな卵型の石が、磨かれたように夜空を鏡のごとく映している。触れると温かい。',
    choices: [
      { label: '石に耳を当ててみる', successRate: 0.4, outcomes: [{ log: '微かな鼓動のような音が聞こえた。まだ何かが眠っているようだ。', light: 12 }, { log: '何も聞こえなかった。ただの石だったのかもしれない。' }] },
      { label: 'そのままにしておく', outcomes: [{ log: '眠りを妨げぬよう、静かに離れた。' }] },
    ],
  },
  {
    id: 'wareta_kagami_no_mura',
    text: '割れた鏡の破片が地面一帯に散らばり、それぞれが違う景色を映している。',
    choices: [
      { label: '破片を一つ拾ってみる', successRate: 0.5, outcomes: [{ log: '拾った破片には、懐かしい郷の景色が映っていた。心が温まった。', hpRatio: 0.15 }, { log: '拾った破片は不吉な景色を映し、慌てて捨てた。', hpRatio: -0.08 }] },
      { label: '踏まないよう慎重に通り抜ける', outcomes: [{ log: '割れた鏡を踏まぬよう、慎重に道を選んで進んだ。' }] },
    ],
  },
  {
    id: 'negau_ishi_no_yama',
    text: '小石が積み上げられた山がいくつも連なっている。誰かの願掛けの跡らしい。',
    choices: [
      { label: '自分たちも石を積む', outcomes: [{ log: '無事の帰還を願い、石を一つ積み足した。', fame: 1, hpRatio: 0.05 }] },
      { label: '崩れた山を直してやる', outcomes: [{ log: '崩れかけた石山をいくつか積み直した。誰かの願いが守られますように。', fame: 2 }] },
    ],
  },
  {
    id: 'nagareru_todokanai_tegami',
    text: '小川もないのに、宛名の書かれた手紙が水面を流れるように宙を漂っている。',
    choices: [
      { label: '手紙を受け取る', successRate: 0.5, outcomes: [{ log: '受け取った手紙には温かい言葉が綴られていた。届け先を探し、無事渡せた。', fame: 4 }, { log: '手を伸ばした瞬間、手紙はすり抜けて消えてしまった。' }] },
      { label: '流れるままにする', outcomes: [{ log: 'きっと正しい宛先へ届くのだろう。見送った。' }] },
    ],
  },
  {
    id: 'yoru_ni_saku_himawari',
    text: '常夜には決して咲かないはずの向日葵が一輪、見えない太陽を追うように首を振っている。',
    choices: [
      { label: '水をやる', outcomes: [{ log: '水をやると、花はひときわ大きく揺れた。感謝しているようだった。', hpRatio: 0.1 }] },
      { label: '種を分けてもらう', successRate: 0.5, outcomes: [{ log: '種を数粒持ち帰れた。郷で育てば、常夜に光をもたらすかもしれない。', fame: 3 }, { log: '種には触れられなかった。花はまだ誰にも渡す気がないようだ。' }] },
    ],
  },
  {
    id: 'kabuto_dake_no_musha',
    text: '兜だけが地面に転がっている。中を覗くと、誰もいないのに温かい。',
    choices: [
      { label: '兜を被ってみる', successRate: 0.35, outcomes: [{ log: '兜からかつての武人の気迫が流れ込んできた。力が漲る。', light: 15 }, { log: '兜は急に重くなり、慌てて脱いだ。まだ主が必要らしい。', hpRatio: -0.1 }] },
      { label: '兜を高く掲げて弔う', outcomes: [{ log: '無名の武人を敬い、静かに弔った。', fame: 3 }] },
    ],
  },
  {
    id: 'tokoyo_no_semi_no_koe',
    text: '常夜には季節外れのはずの蝉の声が、途切れることなく響いている。姿はどこにも見えない。',
    choices: [
      { label: '声のする木を調べる', successRate: 0.4, outcomes: [{ log: '木の洞から、丁寧に折られた千羽鶴が出てきた。誰かの祈りの跡だ。', fame: 3 }, { log: '洞の中には何もなかった。声だけが響き続けている。' }] },
      { label: '懐かしく聴き入る', outcomes: [{ log: '故郷を思い出させる声だった。少し心が安らいだ。', hpRatio: 0.08 }] },
    ],
  },
  {
    id: 'houki_boshi_no_ha',
    text: '箒星が尾を引いて低く飛んだ後、羽根のようなものが一枚、ひらりと落ちてきた。',
    choices: [
      { label: '羽根を拾う', successRate: 0.5, outcomes: [{ log: '羽根は温かく、握るとほのかに輝きを残した。', ketsu: 3 }, { log: '拾おうとした瞬間、羽根は風にさらわれて消えた。' }] },
      { label: '流れ星に願い事をする', outcomes: [{ log: '咄嗟に安全な旅を願った。少しだけ心強くなった。', hpRatio: 0.06 }] },
    ],
  },
  {
    id: 'ana_no_naka_no_hikari',
    text: '地面にぽっかり空いた小さな穴の奥から、規則正しく明滅する光が漏れている。',
    choices: [
      { label: '穴を覗き込む', successRate: 0.4, outcomes: [{ log: '奥に小さな結晶の群れが光っていた。手が届く分だけ持ち帰った。', hoto: 40 }, { log: '覗き込むと、生温かい風が吹き上げてきて慌てて離れた。', hpRatio: -0.06 }] },
      { label: '穴に石を落として深さを測る', outcomes: [{ log: '音が返ってくるまでかなりの時間がかかった。かなり深いようだ。', fame: 1 }] },
    ],
  },
  {
    id: 'karesareta_niwa',
    text: '手入れの行き届いた庭園の跡がある。花はとうに枯れているが、剪定の跡だけは新しい。',
    choices: [
      { label: '庭を手入れしてやる', outcomes: [{ log: '雑草を払い、枝を整えた。誰かが見たら喜びそうだ。', fame: 3 }] },
      { label: '庭石に腰掛けて休む', outcomes: [{ log: '静かな庭で、しばし旅の疲れを癒した。', hpRatio: 0.15 }] },
    ],
  },
  {
    id: 'nemurenai_ningyo',
    text: '古びた市松人形が、目を見開いたまま木の根元に座らされている。誰かが忘れていったようだ。',
    choices: [
      { label: '目を閉じさせてやる', outcomes: [{ log: '瞼をそっと下ろしてやった。安らかな表情に変わった気がした。', hpRatio: 0.1 }] },
      { label: '大切に持ち帰る', successRate: 0.5, outcomes: [{ log: '郷に持ち帰り、大切に飾ることにした。良い供養になるだろう。', itemTier: 1 }, { log: '持ち上げた途端、人形はひどく重くなり、諦めて元の場所に戻した。' }] },
    ],
  },
  {
    id: 'kemuri_no_naka_no_te',
    text: 'かすかな煙が立ち上る焚き跡から、小さな手のようなものが一瞬だけ伸びて消えた。',
    choices: [
      { label: '手を握り返すように差し出す', outcomes: [{ log: '煙がふわりと形を変え、感謝するように揺れて消えた。', fame: 2, hpRatio: 0.06 }] },
      { label: '見なかったことにして進む', outcomes: [{ log: '見間違いだと自分に言い聞かせ、先を急いだ。' }] },
    ],
  },
  {
    id: 'ame_no_oto_dake_no_yozora',
    text: '空は晴れているのに、雨音だけがはっきりと聞こえてくる。奇妙な夜だ。',
    choices: [
      { label: '傘を差して備える', outcomes: [{ log: '結局、雨は一滴も降らなかった。音だけの現象だったようだ。' }] },
      { label: '音の出処を探す', successRate: 0.45, outcomes: [{ log: '古い雨乞いの太鼓を見つけた。誰かが遠くで叩いているらしい。', fame: 3 }, { log: '出処は見つからなかった。音はやがて止んだ。' }] },
    ],
  },
  {
    id: 'kie_nokoru_taimatsu',
    text: '燃え尽きたはずの松明が、灰の中でまだ小さな火種を残している。',
    choices: [
      { label: '火種を大切に持ち帰る', outcomes: [{ log: '灯として持ち帰った。郷の火に加えれば、絶やさぬ縁になる。', light: 10 }] },
      { label: '完全に消してやる', outcomes: [{ log: '静かに消し、灰を土に還した。役目を終えた火に敬意を払った。', hpRatio: 0.06 }] },
    ],
  },
  {
    id: 'yozora_ni_ukabu_kaidan',
    text: '虚空に浮かぶ短い階段がある。上っても下りても、同じ場所に戻ってきそうな不思議さがある。',
    choices: [
      { label: '上ってみる', successRate: 0.4, outcomes: [{ log: '一番上から、思いがけず遠くの灯りが見えた。良い目印になった。', fame: 3, light: 5 }, { log: '上った途端に眩暈がして、慌てて降りた。', hpRatio: -0.08 }] },
      { label: '下から眺めるだけにする', outcomes: [{ log: '不可思議な階段をしばし観察した。' }] },
    ],
  },
  {
    id: 'kobushi_hodo_no_taiyou',
    text: '拳ほどの小さな光の玉が、まるで太陽のように暖かい光を放っている。',
    choices: [
      { label: '光を浴びる', outcomes: [{ log: '久しぶりの陽だまりのような暖かさに、体が軽くなった。', hpRatio: 0.2 }] },
      { label: '持ち帰れないか試す', successRate: 0.4, outcomes: [{ log: '小さな器に光を分けてもらえた。郷を照らす足しになるだろう。', light: 15 }, { log: '触れようとすると光は驚いたように弱まった。無理はやめた。' }] },
    ],
  },
  {
    id: 'kutsuon_no_nai_uma',
    text: '一頭の馬が、蹄の音を一切立てずに静かに歩いている。鞍には誰も乗っていない。',
    choices: [
      { label: '馬に付いていく', successRate: 0.45, outcomes: [{ log: '馬は隠れた近道へ案内してくれた。旅程が楽になった。', fame: 2, light: 6 }, { log: '馬は不意に速足になり、見失ってしまった。' }] },
      { label: 'たてがみを撫でる', outcomes: [{ log: '馬は気持ちよさそうに首を垂れた。しばし触れ合った。', hpRatio: 0.08 }] },
    ],
  },
  {
    id: 'wareta_tsubo_no_naka',
    text: '割れた壺の中から、細かい砂が絶え間なくこぼれ続けている。壺の中身は尽きる気配がない。',
    choices: [
      { label: '手で受け止めてみる', successRate: 0.5, outcomes: [{ log: '砂の中に混じっていた小さな粒を見つけた。', ketsu: 2 }, { log: '砂はさらさらとこぼれ落ちるだけだった。' }] },
      { label: '壺を立て直してやる', outcomes: [{ log: '壺を起こしてやると、こぼれる砂が止まった。', fame: 1 }] },
    ],
  },
  {
    id: 'shizumanai_tsuki',
    text: 'いつまで経っても同じ高さに留まっている月がある。時が止まっているかのようだ。',
    choices: [
      { label: '月に向かって歩き続ける', successRate: 0.35, outcomes: [{ log: '不思議と月に近づいた気がした瞬間、視界が開けて隠し道を見つけた。', fame: 4 }, { log: 'どれだけ歩いても距離は縮まらなかった。諦めて引き返した。', hpRatio: -0.06 }] },
      { label: '月を横目に予定通り進む', outcomes: [{ log: '不思議な月を気にしつつも、旅を続けた。' }] },
    ],
  },
  {
    id: 'tsuchikure_no_naka_no_te',
    text: '土くれの塊から、小さな手だけがにゅっと突き出ている。助けを求めているようにも見える。',
    choices: [
      { label: '掘り出してやる', successRate: 0.5, outcomes: [{ log: '掘り出すと、小さな土人形だった。目を覚ましたように輝き、消えた。', fame: 4 }, { log: '掘っても掘っても、手の先には何もなかった。' }] },
      { label: '手を握って挨拶するだけにする', outcomes: [{ log: '手を軽く握ると、満足したようにゆっくり土の中へ戻っていった。', hpRatio: 0.08 }] },
    ],
  },
  {
    id: 'todokanai_taiko_no_oto',
    text: '遠くで太鼓の音が鳴っているが、進めば進むほど音は遠ざかっていくように感じる。',
    choices: [
      { label: '逆方向に歩いてみる', successRate: 0.45, outcomes: [{ log: '逆に進むと、案外すぐ音源に辿り着いた。奉燈を鳴らす祭壇があった。', hoto: 30 }, { log: '逆に進んでも音は変わらず遠かった。諦めて元の道に戻った。' }] },
      { label: '音を無視して自分たちの道を進む', outcomes: [{ log: '太鼓の音は、いつしか気にならなくなっていた。' }] },
    ],
  },
  {
    id: 'kabe_ni_utsuru_kazoku',
    text: '古い壁に、影絵のような家族団らんの光景がぼんやりと映し出されている。',
    choices: [
      { label: '静かに見守る', outcomes: [{ log: '温かい光景をしばし眺めた。自分の家族を思い出し、旅を続ける力が湧いた。', hpRatio: 0.15 }] },
      { label: '壁に手を当てる', successRate: 0.4, outcomes: [{ log: '手を当てると、影絵の家族が一瞬こちらを向いて頭を下げた。', fame: 3 }, { log: '手を当てた途端、影絵は掻き消えてしまった。少し寂しい気持ちになった。' }] },
    ],
  },
  {
    id: 'ochiba_no_shita_no_tegami_bako',
    text: '積もった落ち葉の下に、小さな郵便箱のようなものが埋もれている。中に何か入っているようだ。',
    choices: [
      { label: '開けてみる', successRate: 0.55, outcomes: [{ log: '中には奉燈の束が残されていた。誰かの忘れ物か、贈り物か。', hoto: 35 }, { log: '箱は空っぽで、うっすらと埃だけが積もっていた。' }] },
      { label: '落ち葉を払って元通りにする', outcomes: [{ log: '見なかったことにして、そっと落ち葉を戻した。' }] },
    ],
  },
  {
    id: 'nagai_nagai_kubi',
    text: '首の異様に長い影が、木々の隙間からこちらを覗いている。ろくろ首の類だろうか。',
    choices: [
      { label: '挨拶をしてみる', successRate: 0.5, outcomes: [{ log: '影は照れたように首を引っ込め、木の実をいくつか落としていった。', hoto: 15 }, { log: '首はにゅうっと伸びてこちらに迫ってきた! 慌てて構えた。', battle: true }] },
      { label: '見ないふりをして通り過ぎる', outcomes: [{ log: '視線を感じつつも、平静を装って通り過ぎた。' }] },
    ],
  },
  {
    id: 'yozora_kara_no_tsuri',
    text: '夜空から一本の糸が垂れ下がり、先には小さな餌のようなものが結ばれている。誰かが釣りをしているらしい。',
    choices: [
      { label: '糸を引いてみる', successRate: 0.4, outcomes: [{ log: '引くと上から小さな贈り物が降ってきた。何とも奇妙な釣りだ。', ketsu: 3 }, { log: '引いた途端、糸はぷつりと切れて上へ消えてしまった。' }] },
      { label: '触れずに見上げる', outcomes: [{ log: '不思議な光景を見上げるだけにした。' }] },
    ],
  },
  {
    id: 'kie_yuku_kagaribi',
    text: '篝火が一列に並んでいるが、通り過ぎるそばから一つずつ静かに消えていく。',
    choices: [
      { label: '消える前に急いで通り抜ける', successRate: 0.55, outcomes: [{ log: '全ての火が消える前に走り抜けた。最後の火が祝うように爆ぜた。', light: 10 }, { log: '途中で足を止めてしまい、暗闇に取り残された。', hpRatio: -0.1 }] },
      { label: 'ゆっくりと最後まで見届ける', outcomes: [{ log: '一つ一つの火に見送られるように、静かに歩いた。', fame: 2 }] },
    ],
  },
  {
    id: 'wasurerareta_ningyo_shibai',
    text: '朽ちた舞台の上で、糸の切れた操り人形たちが風もないのに小さく揺れている。',
    choices: [
      { label: '糸を結び直してやる', successRate: 0.45, outcomes: [{ log: '一体だけ直すと、人形はぎこちなく一礼するように動いた。', fame: 3 }, { log: '古すぎて糸はすぐにまた切れてしまった。それでも、感謝は伝わった気がする。' }] },
      { label: '舞台の前で静かに拍手する', outcomes: [{ log: '誰もいない客席で、たった一人分の拍手を送った。', hpRatio: 0.08 }] },
    ],
  },
  {
    id: 'ikiteiru_youna_kabe_no_e',
    text: '壁に描かれた絵の中の目だけが、こちらの動きに合わせて僅かに動いているように見える。',
    choices: [
      { label: '絵に話しかけてみる', successRate: 0.4, outcomes: [{ log: '絵はまるで答えるように、微かに輪郭が揺らめいた。良い兆しだと感じた。', fame: 3 }, { log: '話しかけても反応はなかった。気のせいだったのだろう。' }] },
      { label: 'そっとその場を離れる', outcomes: [{ log: '見つめられているような感覚がして、静かに立ち去った。' }] },
    ],
  },
]
