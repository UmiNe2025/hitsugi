// M21頭金(M22 P1-5で先行実装): 新12地域の署名データ。
// 正本: docs/VISUAL_RECOVERY_DUNGEON_PLAN.md §7.1(署名ランドマーク/粒子/主の痕跡)。
// RegionVisualProfile本体(palette/四幕/痕跡3段階)はM21で実装する — ここは出立画面の
// 予告表示に使う「署名1語+主の痕跡」のみをデータ化し、ダンジョン実装時に拡張する。
export interface RegionSign {
  landmark: string // 署名ランドマーク(その地を一語で見分ける物)
  particle: string // 粒子/天候(M21のRegionVisualProfileへ引き継ぐ)
  omen: string // 主の痕跡(ボスの気配 — 出立時は「兆し」として見せる)
}

export const REGION_SIGNS: Record<string, RegionSign> = {
  hotarubi_no_kubochi: { landmark: '水没した石灯籠', particle: '数を揃える蛍', omen: '焦げない足跡' },
  nemurijizou_no_michi: { landmark: '首を伏せた地蔵列', particle: '苔胞子', omen: '背負われた空台座' },
  kuchinawa_no_hotoke: { landmark: '巨大な朽ち注連縄', particle: '蛇行する塵', omen: '締め跡のある仏像' },
  usugiri_no_watashiba: { landmark: '岸のない桟橋', particle: '横へ流れる霧', omen: '濡れた足跡が途中で消える' },
  hisui_no_sawa: { landmark: '割れた翡翠柱', particle: '水中の光', omen: '水面下の巨大な影' },
  nakiotoko_no_hara: { landmark: '泣き石の群れ', particle: '逆流する雨', omen: '声だけが距離を変える' },
  sabigatana_no_haka: { landmark: '刀の森', particle: '錆粉', omen: '新しい血の付いた古刀' },
  yumemaboroshi_no_yakata: { landmark: '入れ子の襖', particle: '逆向きの埃', omen: '同じ部屋の異なる遺体' },
  maboroshi_no_sandou: { landmark: '尽きない鳥居', particle: '上へ落ちる紙垂', omen: '帰路側にだけ足跡' },
  nakiryuu_no_mine: { landmark: '龍骨の稜線', particle: '横殴りの星雪', omen: '岩に残る涙の溝' },
  todome_no_kaidan: { landmark: '数の違う石段', particle: '静止する灰', omen: '一段だけ温かい石' },
  gentou_no_zenya: { landmark: '無人の宴席', particle: '上向きに落ちる酒滴', omen: '食べ物だけが減る' },
}

export function regionSignOf(regionId: string): RegionSign | null {
  return REGION_SIGNS[regionId] ?? null
}

// ---- M23(指示7 V2): 地域別ビジュアルプロファイル ----
// 4基盤テーマ(forest/zaka/tani/miyama)の上に被せる「色とランドマークの差分」。
// 全て0xRRGGBBの数値。描画エンジン(src/dungeon/render/)がテーマ解決時に一度だけ適用する。
// if分岐を画面へ散らさない — データはここが単一情報源(正本: VISUAL_RECOVERY_DUNGEON_PLAN §7)。

// 署名ランドマーク(新12地域のみ固有。他地域は基盤テーマのbigPropが務める)
export type LandmarkKind =
  | 'sunken_lantern' // 水没した石灯籠(蛍火の窪地)
  | 'jizo_row' // 首を伏せた地蔵列(眠り地蔵の道)
  | 'great_shimenawa' // 巨大な朽ち注連縄(朽縄の仏道)
  | 'ghost_pier' // 岸のない桟橋(薄霧の渡し場)
  | 'jade_pillar' // 割れた翡翠柱(翡翠の沢)
  | 'weeping_stones' // 泣き石の群れ(泣き男の原)
  | 'sword_grove' // 刀の森(錆刀の墓)
  | 'nested_fusuma' // 入れ子の襖(夢幻の館)
  | 'endless_torii' // 尽きない鳥居(幻の参道)
  | 'dragon_spine' // 龍骨の稜線(泣き竜の峰)
  | 'counted_steps' // 数の違う石段(止めの階段)
  | 'empty_banquet' // 無人の宴席(玄冬の前夜)

// M24 Phase D(§4.7): 地面材質。色差だけで終わらせず、静止画でも「材質の形状」で
// 地域を見分けられるようにする。ground.ts(buildGround)が歩行床の局所模様として描く。
export type GroundKind =
  | 'soil' // 土(既定・現状維持 — jitter+小石speckleのみ)
  | 'moss' // 苔(柔らかい斑点)
  | 'plank' // 板(横板の継ぎ目線)
  | 'stone' // 石畳(多角形の割れ線)
  | 'bone' // 骨(白い破片散り)
  | 'ash' // 灰(細かい灰目)
  | 'water_film' // 水膜(薄い反射帯)

// M24 Phase D(§4.7): 空気粒子の挙動。色はmote流用、動き方だけで地域の空気感を差別化する。
// engine.ts(mote生成/tick)が読む。reduced-motion時はどの種も静的表示に落ちる。
export type ParticleKind =
  | 'firefly' // 蛍(既定・呼吸浮遊 — 現状のsin/cos揺らぎ)
  | 'rain' // 雨(上→下の速い直線、下端で再生)
  | 'ash' // 灰(ゆっくり下降+横流れ)
  | 'fog' // 霧(大きく薄い横移動)
  | 'pollen' // 花粉(ゆるい上昇漂い)
  | 'stardust' // 星屑(瞬く点滅)

export interface RegionVisualProfile {
  ground?: number // 地色(基盤themeのgroundBase置換 — 暗色帯を守ること)
  stain?: number // 染み
  grass?: number // 下草
  waterDeep?: number // 水面基調
  waterGlint?: number // 水面ハイライト
  lantern?: number // 定置光(焚火・提灯グロー)
  mote?: number // 浮遊光粒の色(未指定は0xffe79e)
  moteCount?: number // 光粒の数(未指定は22)
  landmark?: LandmarkKind
  groundKind?: GroundKind // M24 §4.7: 地面材質(未指定はsoil相当=現状維持)
  particleKind?: ParticleKind // M24 §4.7: 空気粒子の挙動(未指定はfirefly相当=現状維持)
}

// 40地域全ての差分プロファイル。bg系統(forest/zaka/tani/miyama)ごとに基盤テーマ
// (src/dungeon/render/theme.ts)へ寄せた暗色帯の中で、地域名/desc/REGION_SIGNSの
// particleから意味づけした差分のみを持たせる。署名12地域のみlandmarkを持つ。
export const REGION_VISUALS: Record<string, RegionVisualProfile> = {
  // --- bg_forest(tier1・10地域) ---
  // 宵の森 — 郷に近い薄闇。基盤forestとほぼ同調、灯粒は蛾の鱗粉色。地面は土、粒子は蛍(基準形)
  yoi_forest: {
    ground: 0x0a0f12, grass: 0x1d3326, mote: 0xffe79e, moteCount: 22,
    groundKind: 'soil', particleKind: 'firefly',
  },
  // 蛍火の窪地 — 水気と蛍。草と光粒を蛍緑へ、静かな水面。地面は苔、粒子は蛍(REGION_SIGNS準拠)
  hotarubi_no_kubochi: {
    ground: 0x0a1210, stain: 0x0f231c, grass: 0x1e3a22, waterDeep: 0x0d2028,
    mote: 0xa8e07a, moteCount: 34, landmark: 'sunken_lantern',
    groundKind: 'moss', particleKind: 'firefly',
  },
  // 濡れ縁の辻 — 雨も降らぬのに湿った辻。水音の気配を淡い水色の霧粒で。地面は水膜、粒子は霧
  nureen_no_tsuji: {
    ground: 0x0a1114, stain: 0x102230, grass: 0x1c2f30, waterDeep: 0x0e2436,
    waterGlint: 0x6fa8c0, mote: 0xcfe8ea, moteCount: 12,
    groundKind: 'water_film', particleKind: 'fog',
  },
  // 眠り地蔵の道 — 苔胞子が地蔵の間を漂う。下草を深い苔色に寄せる。地面は苔、粒子は胞子=花粉
  nemurijizou_no_michi: {
    ground: 0x0b1210, stain: 0x13241a, grass: 0x24402c,
    mote: 0xd7e6a0, moteCount: 18, landmark: 'jizo_row',
    groundKind: 'moss', particleKind: 'pollen',
  },
  // 烏の里 — 廃里に舞う灰と羽根の粉。下草は枯れ色へ。地面は灰、粒子は羽根粉=花粉
  karasu_no_sato: {
    ground: 0x0d1013, stain: 0x1a1712, grass: 0x241f1a, mote: 0xcac2b0, moteCount: 16,
    groundKind: 'ash', particleKind: 'pollen',
  },
  // 灯篭崩れ道 — 消えない灯篭の火。定置光と共鳴する橙の灯粒。地面は崩れた石畳、粒子は灯=蛍
  tourou_kuzure_michi: {
    ground: 0x0c0f10, stain: 0x1c150f, grass: 0x22301e,
    lantern: 0xffc36a, mote: 0xffd27a, moteCount: 26,
    groundKind: 'stone', particleKind: 'firefly',
  },
  // 蟲時雨の径 — 雨のように降る羽虫の羽。淡黄緑の粒を密集させる。地面は土、粒子はdesc直結の雨
  mushishigure_michi: {
    ground: 0x0b1310, stain: 0x14201a, grass: 0x1f3524, mote: 0xe9f0b0, moteCount: 36,
    groundKind: 'soil', particleKind: 'rain',
  },
  // 苅田の亡霊 — 誰もいない稲穂の揺れ。月下の穂波を淡金の粒で。地面は田の土、粒子は穂波=花粉
  karita_no_bourei: {
    ground: 0x0d100e, stain: 0x1a1c12, grass: 0x2c3320, mote: 0xecd468, moteCount: 20,
    groundKind: 'soil', particleKind: 'pollen',
  },
  // 破れ傘の道標 — 数え違える傘の枚数。淡い和紙色の光粒で不確かさを表す。地面は木の道標、粒子は霧
  yaregasa_douhyou: {
    ground: 0x0c0e11, stain: 0x1b1712, grass: 0x1e281c, mote: 0xd8cfe0, moteCount: 14,
    groundKind: 'plank', particleKind: 'fog',
  },
  // 蓑虫の廻廊 — 揺れる蓑虫の房。埃っぽい藁緑の粒を密度高めに。地面は木の廻廊、粒子は埃=花粉
  minomushi_no_kairou: {
    ground: 0x0b0f11, stain: 0x161d14, grass: 0x263322, mote: 0xc9d488, moteCount: 24,
    groundKind: 'plank', particleKind: 'pollen',
  },

  // --- bg_zaka(tier2・10地域) ---
  // 提灯坂 — 絶えない提灯の火。基盤そのまま、暖色の灯粒を密に。地面は坂の石畳、粒子は提灯=蛍
  chochin_zaka: {
    ground: 0x120d0e, stain: 0x1e1512, grass: 0x2b2a1c,
    lantern: 0xffae4f, mote: 0xffcf8a, moteCount: 30,
    groundKind: 'stone', particleKind: 'firefly',
  },
  // 廃墟の御殿 — 誰もいない奥座敷の灯。冷たい青白光を混ぜ暖色基盤からずらす。地面は板の間、粒子は冷光の瞬き
  haikyo_goten: {
    ground: 0x110c10, stain: 0x1d1420, grass: 0x272432,
    lantern: 0xdce6ff, mote: 0xc8d4f0, moteCount: 16,
    groundKind: 'plank', particleKind: 'stardust',
  },
  // 塗壁小路 — 塗り込められた閉塞感。粒は控えめな漆喰色でわずかに。地面は土、粒子は塗壁の粉埃=灰
  nurikabe_koji: {
    ground: 0x100d0d, stain: 0x1c1613, grass: 0x211f18, mote: 0xbcb6a0, moteCount: 10,
    groundKind: 'soil', particleKind: 'ash',
  },
  // 涸れ沼の畔 — 涸れても残る水音。marsh-gasの淡黄を粒に、水面反射は地中に控えめ。地面は苔生した沼畔、粒子は沼気=霧
  kare_numa: {
    ground: 0x0f0f0c, stain: 0x1e1c12, grass: 0x312f1a, waterDeep: 0x141c1e,
    waterGlint: 0x7fae8a, mote: 0xd8d68a, moteCount: 12,
    groundKind: 'moss', particleKind: 'fog',
  },
  // 朧橋 — 霧の橋。霞色の水面反射と白いもや粒。地面は橋板、粒子は霧
  oboro_bashi: {
    ground: 0x0e1012, stain: 0x161c20, grass: 0x232c26, waterDeep: 0x101e2c,
    waterGlint: 0x86aac0, mote: 0xdce8ec, moteCount: 18,
    groundKind: 'plank', particleKind: 'fog',
  },
  // 朽縄の仏道 — 蛇行する塵を注連縄の藁色で。地面は参道の石畳、粒子は蛇行する塵=霧
  kuchinawa_no_hotoke: {
    ground: 0x120d0f, stain: 0x201510, grass: 0x332a1a,
    mote: 0xd8b878, moteCount: 20, landmark: 'great_shimenawa',
    groundKind: 'stone', particleKind: 'fog',
  },
  // 薄霧の渡し場 — 横へ流れる霧を淡青の粒に、岸のない水面を強調。地面は水膜、粒子はdesc直結の霧
  usugiri_no_watashiba: {
    ground: 0x0e1113, stain: 0x151e22, grass: 0x212c28, waterDeep: 0x0e222e,
    waterGlint: 0x6a98b8, mote: 0xa8d8e0, moteCount: 22, landmark: 'ghost_pier',
    groundKind: 'water_film', particleKind: 'fog',
  },
  // 硯石の坂 — 墨の匂いの坂。硯の艶を淡藍の粒で。地面は坂の石畳、粒子は硯の艶=瞬き
  suzuriishi_no_saka: {
    ground: 0x0e0e10, stain: 0x191820, grass: 0x201f24, mote: 0xa8b8d8, moteCount: 12,
    groundKind: 'stone', particleKind: 'stardust',
  },
  // 蝋燭河岸 — 涸れた河岸に並ぶ蝋燭。橙寄りの灯りと灯粒で密度を作る。地面は水気の名残=水膜、粒子は蝋燭=蛍
  rousoku_kashi: {
    ground: 0x110d0c, stain: 0x1e1712, grass: 0x282318, waterDeep: 0x121c26,
    lantern: 0xffd9a0, mote: 0xffe0b0, moteCount: 28,
    groundKind: 'water_film', particleKind: 'firefly',
  },
  // 鏡ヶ淵 — 澄みきった淵の鏡面。銀藍の反射と粒で「見返す何か」の気配。地面は水膜、粒子は鏡面の瞬き
  kagami_ga_fuchi: {
    ground: 0x0d0f12, stain: 0x161c22, grass: 0x1f2a28, waterDeep: 0x0e2032,
    waterGlint: 0x9ec8e8, mote: 0xc8e0f0, moteCount: 14,
    groundKind: 'water_film', particleKind: 'stardust',
  },

  // --- bg_tani(tier3・11地域) ---
  // 星骸の谷 — 喰われた星の骸。基盤そのまま、星屑色の粒だけ強調。地面は星の骸=骨、粒子は星屑
  hoshimukuro_tani: {
    ground: 0x0a0c14, stain: 0x131829, grass: 0x22303a, mote: 0xd8e6ff, moteCount: 20,
    groundKind: 'bone', particleKind: 'stardust',
  },
  // 翡翠の沢 — 水中の光を翡翠緑で統一。基盤tani(青系)からjade系へ大きく振る。地面は水膜、粒子は雨
  hisui_no_sawa: {
    ground: 0x0a1210, stain: 0x11241c, grass: 0x1e3c2e, waterDeep: 0x0c2820,
    waterGlint: 0x6ad2a0, mote: 0x7ee8b8, moteCount: 16, landmark: 'jade_pillar',
    groundKind: 'water_film', particleKind: 'rain',
  },
  // 影法師の丘 — 持ち主なき影の輪郭光。淡紫の粒を控えめに。地面は丘の土、粒子は影の輪郭=霧
  kageboushi_no_oka: {
    ground: 0x0b0a10, stain: 0x14131f, grass: 0x201f2c, mote: 0xb0a8e0, moteCount: 10,
    groundKind: 'soil', particleKind: 'fog',
  },
  // 鍛地の跡 — 絶えない鎚音の鍛冶場。橙の火花粒で鍛地らしさを。地面は炉床の石畳、粒子は火花=瞬き
  kaji_ato: {
    ground: 0x120e0c, stain: 0x231810, grass: 0x2c2416,
    lantern: 0xffb060, mote: 0xffc878, moteCount: 24,
    groundKind: 'stone', particleKind: 'stardust',
  },
  // 泣き男の原 — 逆流する雨を淡青灰の粒に。枯野らしく下草は褪せた黄土へ。地面は枯野の土、粒子はdesc直結の雨
  nakiotoko_no_hara: {
    ground: 0x0c0e14, stain: 0x161c2a, grass: 0x2a2c22,
    waterGlint: 0x8fa8c8, mote: 0xb8c8e0, moteCount: 18, landmark: 'weeping_stones',
    groundKind: 'soil', particleKind: 'rain',
  },
  // 骨董坂 — 読めなくなった値札。古道具のくすんだ真鍮色を粒に。地面は木の陳列棚=板、粒子は埃=霧
  kottou_zaka: {
    ground: 0x0d0d12, stain: 0x1a1826, grass: 0x282436, mote: 0xc8b88a, moteCount: 14,
    groundKind: 'plank', particleKind: 'fog',
  },
  // 錆刀の墓 — 錆粉を赤錆色の粒で。stainも錆色へ強く寄せる。地面は墓=骨、粒子は錆粉=灰(例示準拠)
  sabigatana_no_haka: {
    ground: 0x120a0a, stain: 0x2a1810, grass: 0x241e18,
    mote: 0xd88858, moteCount: 20, landmark: 'sword_grove',
    groundKind: 'bone', particleKind: 'ash',
  },
  // 百鬼夜行の辻 — 数え違える行列の灯。妖しい紫の灯りで基盤tani(青)から大きくずらす。地面は辻の石畳、粒子は行列の灯=蛍
  hyakki_yakou_no_tsuji: {
    ground: 0x0b0d14, stain: 0x151a2c, grass: 0x24222e,
    lantern: 0xe8b8ff, mote: 0xe0a8f0, moteCount: 26,
    groundKind: 'stone', particleKind: 'firefly',
  },
  // 夢幻の館 — 逆向きに舞う埃を薄紫の粒で。地面は館の板の間、粒子は埃=花粉
  yumemaboroshi_no_yakata: {
    ground: 0x0e0c14, stain: 0x1a1828, grass: 0x2a2438,
    mote: 0xc0a8e8, moteCount: 14, landmark: 'nested_fusuma',
    groundKind: 'plank', particleKind: 'pollen',
  },
  // 白骨林 — 根を張る白骨。象牙色の粒で骨の艶を。地面は白骨そのもの、粒子は林に立ち込める霧
  hakkotsu_bayashi: {
    ground: 0x0d0c10, stain: 0x1c1a24, grass: 0x2e2c30, mote: 0xe8e0d0, moteCount: 22,
    groundKind: 'bone', particleKind: 'fog',
  },
  // 常闇の回廊 — 頼りない灯。tani最暗、粒も最少で常闇らしさを。地面は苔むした暗い回廊、粒子は頼りない灯=蛍
  tokoyami_no_kairou: {
    ground: 0x090a10, stain: 0x121522, grass: 0x1e222c, mote: 0x8898c0, moteCount: 8,
    groundKind: 'moss', particleKind: 'firefly',
  },

  // --- bg_miyama(tier4・9地域) ---
  // 星喰い野 — 地面ごと瞬く星の欠片。基盤そのまま、星色の粒を密に。地面は星が埋まる岩=石畳、粒子は瞬く星屑
  hoshikui_no: {
    ground: 0x0d0a12, stain: 0x191024, grass: 0x282436, mote: 0xe8ecff, moteCount: 30,
    groundKind: 'stone', particleKind: 'stardust',
  },
  // 幻の参道 — 上へ落ちる紙垂を白金の粒で。鳥居の朱に寄せた地色。地面は参道の石畳、粒子は紙垂の上昇漂い=花粉
  maboroshi_no_sandou: {
    ground: 0x110c10, stain: 0x1e1420, grass: 0x2e2432,
    lantern: 0xffe0b0, mote: 0xfff0d0, moteCount: 18, landmark: 'endless_torii',
    groundKind: 'stone', particleKind: 'pollen',
  },
  // 亡者町 — 誰もいない家々の灯。冷たい青灯りの粒で亡者町の静けさを。地面は町屋の板の間、粒子は冷たい霧
  mouja_machi: {
    ground: 0x0c0a14, stain: 0x17122a, grass: 0x231f38,
    lantern: 0xb0c8f0, mote: 0xa0b8e8, moteCount: 16,
    groundKind: 'plank', particleKind: 'fog',
  },
  // 泣き竜の峰 — 横殴りの星雪を密な白青の粒で。龍の啼く風音の激しさを密度に。地面は稜線の岩、粒子は星雪の速い流れ=雨
  nakiryuu_no_mine: {
    ground: 0x0a0c16, stain: 0x141828, grass: 0x20263a,
    mote: 0xd0e0ff, moteCount: 32, landmark: 'dragon_spine',
    groundKind: 'stone', particleKind: 'rain',
  },
  // 玄冬前庭 — 常夜の重みを圧の強い紫で。粒数も控えめに息苦しさを表す。地面は降り積もる灰、粒子は重い霧
  gentou_zentei: {
    ground: 0x0b0810, stain: 0x160e20, grass: 0x211a30, mote: 0x9880c0, moteCount: 12,
    groundKind: 'ash', particleKind: 'fog',
  },
  // 止めの階段 — 静止する灰を淡灰の粒で。数え違える石段に落ちて止まる様を密度低めに。地面は石段、粒子はdesc直結の灰
  todome_no_kaidan: {
    ground: 0x0e0a10, stain: 0x1c1220, grass: 0x2a2030,
    mote: 0xd8ccc0, moteCount: 10, landmark: 'counted_steps',
    groundKind: 'stone', particleKind: 'ash',
  },
  // 玄冬の前夜 — 誰もいない宴の灯だけが妙に明るい。上向きの酒滴を金色の粒で。地面は灰、粒子は酒滴の瞬き(例示準拠)
  gentou_no_zenya: {
    ground: 0x0f0a14, stain: 0x201428, grass: 0x2c2038,
    lantern: 0xffdca0, mote: 0xffe8b8, moteCount: 24, landmark: 'empty_banquet',
    groundKind: 'ash', particleKind: 'stardust',
  },
  // 灯ノ御山 — 玄冬が座す中心。基盤miyamaに紅を差し込み最も異質な色に。地面は主が座す骨、粒子は灯=蛍
  akashi_miyama: {
    ground: 0x0c0810, stain: 0x220c1c, grass: 0x2e1c2c, mote: 0xf0a8c0, moteCount: 18,
    groundKind: 'bone', particleKind: 'firefly',
  },
  // 常夜百層 — 終わりなき層。無彩に近い銀白の粒で他地域と一線を画す。地面は塔の床板、粒子は無彩の瞬き
  tokoyo_tou: {
    ground: 0x0a0a12, grass: 0x20202e, mote: 0xd8d8f0, moteCount: 20,
    groundKind: 'plank', particleKind: 'stardust',
  },
}

export function regionVisualOf(regionId: string): RegionVisualProfile | null {
  return REGION_VISUALS[regionId] ?? null
}

// ---- M27: 地域固有の景観文法 ----
// 色・材質だけでなく、壁沿い/連続壁/大物/主参道のプロップ構成を地域ごとに変える。
// PropKind と同じ文字列unionをcore側で持ち、core -> dungeon の逆依存を避ける。
export type RegionPropKind =
  | 'bamboo' | 'tree' | 'bush' | 'log' | 'rock'
  | 'stonewall' | 'lantern' | 'fence' | 'brokenlantern'
  | 'spire' | 'bone' | 'crystal' | 'cairn'
  | 'torii' | 'grave' | 'pillar' | 'wisp'

export interface RegionIdentity {
  motif: string // HUD/ログで短く示す地相名
  entryLine: string // 入場直後に一度だけ流す環境の読み取り
  wallProps: RegionPropKind[]
  runProp: RegionPropKind
  bigProp: RegionPropKind
  gauntletProp: RegionPropKind
}

export const REGION_IDENTITIES: Record<string, RegionIdentity> = {
  yoi_forest: {
    motif: '灯路の樹海', entryLine: '地相「灯路の樹海」——古い茸狩り道が、枝と灯の間を縫っている。',
    wallProps: ['tree', 'bush', 'log', 'rock', 'bamboo'], runProp: 'bush', bigProp: 'tree', gauntletProp: 'tree',
  },
  hotarubi_no_kubochi: {
    motif: '蛍環の窪', entryLine: '地相「蛍環の窪」——水没した灯籠を中心に、蛍が幾重もの輪を描く。',
    wallProps: ['rock', 'lantern', 'bush', 'stonewall', 'tree'], runProp: 'lantern', bigProp: 'rock', gauntletProp: 'lantern',
  },
  nureen_no_tsuji: {
    motif: '濡れ四辻', entryLine: '地相「濡れ四辻」——板と垣根の継ぎ目を、雨のない雫が伝っている。',
    wallProps: ['fence', 'brokenlantern', 'bush', 'log', 'stonewall'], runProp: 'fence', bigProp: 'brokenlantern', gauntletProp: 'stonewall',
  },
  nemurijizou_no_michi: {
    motif: '伏し地蔵列', entryLine: '地相「伏し地蔵列」——苔むす石像が、道の奥へ同じ角度で首を垂れる。',
    wallProps: ['grave', 'cairn', 'rock', 'bush', 'lantern'], runProp: 'cairn', bigProp: 'grave', gauntletProp: 'grave',
  },
  karasu_no_sato: {
    motif: '羽葬の廃里', entryLine: '地相「羽葬の廃里」——空家を囲う垣根に、黒い羽根だけが積もっている。',
    wallProps: ['fence', 'tree', 'brokenlantern', 'bone', 'log'], runProp: 'fence', bigProp: 'tree', gauntletProp: 'brokenlantern',
  },
  tourou_kuzure_michi: {
    motif: '崩灯参道', entryLine: '地相「崩灯参道」——割れた石灯籠が、消えぬ火で進路を刻んでいる。',
    wallProps: ['lantern', 'brokenlantern', 'stonewall', 'rock', 'fence'], runProp: 'lantern', bigProp: 'brokenlantern', gauntletProp: 'lantern',
  },
  mushishigure_michi: {
    motif: '羽音の蛇行路', entryLine: '地相「羽音の蛇行路」——竹と藪の狭間で、羽音が雨脚のように濃くなる。',
    wallProps: ['bush', 'bamboo', 'tree', 'log', 'wisp'], runProp: 'bamboo', bigProp: 'bush', gauntletProp: 'tree',
  },
  karita_no_bourei: {
    motif: '亡霊の畦', entryLine: '地相「亡霊の畦」——刈田を区切る畦が、夜ごと違う格子を結ぶ。',
    wallProps: ['fence', 'bush', 'log', 'rock', 'grave'], runProp: 'fence', bigProp: 'log', gauntletProp: 'fence',
  },
  yaregasa_douhyou: {
    motif: '偽りの道標', entryLine: '地相「偽りの道標」——破れ傘と倒れた灯が、互いに違う方角を指す。',
    wallProps: ['brokenlantern', 'fence', 'tree', 'rock', 'lantern'], runProp: 'brokenlantern', bigProp: 'tree', gauntletProp: 'brokenlantern',
  },
  minomushi_no_kairou: {
    motif: '吊り房廻廊', entryLine: '地相「吊り房廻廊」——竹の長廊に、風のない蓑が無数に揺れている。',
    wallProps: ['bamboo', 'tree', 'bush', 'log', 'wisp'], runProp: 'bamboo', bigProp: 'tree', gauntletProp: 'bamboo',
  },
  chochin_zaka: {
    motif: '百灯の段坂', entryLine: '地相「百灯の段坂」——提灯の列が坂を刻み、こちらを数える目を灯す。',
    wallProps: ['lantern', 'brokenlantern', 'stonewall', 'fence', 'torii'], runProp: 'lantern', bigProp: 'lantern', gauntletProp: 'torii',
  },
  haikyo_goten: {
    motif: '朽ち御殿', entryLine: '地相「朽ち御殿」——柱間と崩れ壁が、誰もいない座敷の序列を守る。',
    wallProps: ['pillar', 'stonewall', 'fence', 'lantern', 'grave'], runProp: 'pillar', bigProp: 'pillar', gauntletProp: 'pillar',
  },
  nurikabe_koji: {
    motif: '閉ざし小路', entryLine: '地相「閉ざし小路」——石壁が視線を折り、来たはずの路地を塞いでいる。',
    wallProps: ['stonewall', 'pillar', 'rock', 'fence', 'brokenlantern'], runProp: 'stonewall', bigProp: 'pillar', gauntletProp: 'stonewall',
  },
  kare_numa: {
    motif: '涸れた島影', entryLine: '地相「涸れた島影」——沼底の石と骨が、乾いた中洲の輪郭を残す。',
    wallProps: ['rock', 'cairn', 'bone', 'fence', 'brokenlantern'], runProp: 'cairn', bigProp: 'rock', gauntletProp: 'fence',
  },
  oboro_bashi: {
    motif: '帰らずの橋', entryLine: '地相「帰らずの橋」——霧に沈む欄干と橋脚が、同じ岸へ道を戻す。',
    wallProps: ['pillar', 'lantern', 'fence', 'stonewall', 'wisp'], runProp: 'fence', bigProp: 'pillar', gauntletProp: 'pillar',
  },
  kuchinawa_no_hotoke: {
    motif: '蛇縄仏道', entryLine: '地相「蛇縄仏道」——鳥居と墓標の間を、朽ちた注連縄が締め上げる。',
    wallProps: ['torii', 'pillar', 'grave', 'stonewall', 'bone'], runProp: 'grave', bigProp: 'torii', gauntletProp: 'torii',
  },
  usugiri_no_watashiba: {
    motif: '岸なき渡し', entryLine: '地相「岸なき渡し」——桟橋の杭と淡い灯だけが、霧の対岸を偽っている。',
    wallProps: ['fence', 'pillar', 'lantern', 'brokenlantern', 'wisp'], runProp: 'fence', bigProp: 'pillar', gauntletProp: 'lantern',
  },
  suzuriishi_no_saka: {
    motif: '墨溜りの段', entryLine: '地相「墨溜りの段」——黒い石壁の窪みに、乾かぬ墨が月を映す。',
    wallProps: ['stonewall', 'rock', 'cairn', 'pillar', 'wisp'], runProp: 'stonewall', bigProp: 'rock', gauntletProp: 'pillar',
  },
  rousoku_kashi: {
    motif: '不滅蝋の河岸', entryLine: '地相「不滅蝋の河岸」——蝋燭列が涸れた水路と平行に、奥へ燃え続ける。',
    wallProps: ['lantern', 'brokenlantern', 'pillar', 'fence', 'stonewall'], runProp: 'lantern', bigProp: 'pillar', gauntletProp: 'lantern',
  },
  kagami_ga_fuchi: {
    motif: '鏡面の淵', entryLine: '地相「鏡面の淵」——柱と水晶が左右対称に並び、水面だけが別の道を映す。',
    wallProps: ['pillar', 'crystal', 'cairn', 'stonewall', 'wisp'], runProp: 'crystal', bigProp: 'pillar', gauntletProp: 'pillar',
  },
  hoshimukuro_tani: {
    motif: '星骸の窪', entryLine: '地相「星骸の窪」——骨と星晶が、墜ちたものを囲む放射状の谷を作る。',
    wallProps: ['bone', 'spire', 'crystal', 'rock', 'cairn'], runProp: 'bone', bigProp: 'spire', gauntletProp: 'bone',
  },
  hisui_no_sawa: {
    motif: '翡翠水脈', entryLine: '地相「翡翠水脈」——割れた翠柱の間を、細い沢筋が枝分かれしている。',
    wallProps: ['crystal', 'rock', 'cairn', 'spire', 'wisp'], runProp: 'crystal', bigProp: 'crystal', gauntletProp: 'spire',
  },
  kageboushi_no_oka: {
    motif: '影立つ丘', entryLine: '地相「影立つ丘」——開けた丘に、持ち主のいない影と墓標だけが立つ。',
    wallProps: ['wisp', 'pillar', 'grave', 'rock', 'torii'], runProp: 'wisp', bigProp: 'pillar', gauntletProp: 'grave',
  },
  kaji_ato: {
    motif: '冷えぬ炉跡', entryLine: '地相「冷えぬ炉跡」——炉床と石柱が作業場を囲み、打音の余韻を返す。',
    wallProps: ['stonewall', 'pillar', 'rock', 'lantern', 'crystal'], runProp: 'stonewall', bigProp: 'pillar', gauntletProp: 'stonewall',
  },
  nakiotoko_no_hara: {
    motif: '慟哭の石環', entryLine: '地相「慟哭の石環」——泣き石と塚が、声の中心を避ける輪を描く。',
    wallProps: ['cairn', 'grave', 'rock', 'wisp', 'pillar'], runProp: 'cairn', bigProp: 'grave', gauntletProp: 'cairn',
  },
  kottou_zaka: {
    motif: '遺物の露店坂', entryLine: '地相「遺物の露店坂」——柱間に古物と割れ灯が積まれ、細い折返しを作る。',
    wallProps: ['pillar', 'stonewall', 'brokenlantern', 'fence', 'grave'], runProp: 'brokenlantern', bigProp: 'pillar', gauntletProp: 'fence',
  },
  sabigatana_no_haka: {
    motif: '錆刃の墓林', entryLine: '地相「錆刃の墓林」——墓標と骨の間から、抜けぬ刀のような柱が突き出す。',
    wallProps: ['bone', 'grave', 'pillar', 'rock', 'cairn'], runProp: 'grave', bigProp: 'pillar', gauntletProp: 'bone',
  },
  hyakki_yakou_no_tsuji: {
    motif: '夜行の大辻', entryLine: '地相「夜行の大辻」——鳥居と灯の大きな十字路に、見えぬ行列の間が空く。',
    wallProps: ['torii', 'lantern', 'grave', 'wisp', 'pillar'], runProp: 'torii', bigProp: 'lantern', gauntletProp: 'torii',
  },
  yumemaboroshi_no_yakata: {
    motif: '入れ子座敷', entryLine: '地相「入れ子座敷」——柱と垣の向こうに、同じ間取りが一回り小さく続く。',
    wallProps: ['pillar', 'fence', 'lantern', 'wisp', 'grave'], runProp: 'pillar', bigProp: 'pillar', gauntletProp: 'fence',
  },
  hakkotsu_bayashi: {
    motif: '肋骨の林', entryLine: '地相「肋骨の林」——白骨と石塔が、獣の胸郭のような回廊を組む。',
    wallProps: ['bone', 'spire', 'grave', 'rock', 'cairn'], runProp: 'bone', bigProp: 'spire', gauntletProp: 'bone',
  },
  tokoyami_no_kairou: {
    motif: '灯絶え回廊', entryLine: '地相「灯絶え回廊」——墓標と柱の直路を、淡い鬼火だけが逆行する。',
    wallProps: ['pillar', 'grave', 'wisp', 'torii', 'brokenlantern'], runProp: 'grave', bigProp: 'pillar', gauntletProp: 'torii',
  },
  hoshikui_no: {
    motif: '星穴の環野', entryLine: '地相「星穴の環野」——星晶の消えた穴を、尖塔と骨の円環路が結ぶ。',
    wallProps: ['spire', 'crystal', 'bone', 'wisp', 'rock'], runProp: 'crystal', bigProp: 'spire', gauntletProp: 'spire',
  },
  maboroshi_no_sandou: {
    motif: '尽きぬ鳥居', entryLine: '地相「尽きぬ鳥居」——くぐった鳥居が背後へ戻り、参道の終わりを隠す。',
    wallProps: ['torii', 'grave', 'pillar', 'wisp', 'lantern'], runProp: 'torii', bigProp: 'torii', gauntletProp: 'torii',
  },
  mouja_machi: {
    motif: '死者の町割', entryLine: '地相「死者の町割」——墓と垣根で区切られた路地に、無人の灯が点る。',
    wallProps: ['grave', 'lantern', 'fence', 'pillar', 'brokenlantern'], runProp: 'grave', bigProp: 'pillar', gauntletProp: 'lantern',
  },
  nakiryuu_no_mine: {
    motif: '龍骨稜線', entryLine: '地相「龍骨稜線」——骨と尖塔の折返しが、泣く竜の背を登ってゆく。',
    wallProps: ['bone', 'spire', 'rock', 'crystal', 'cairn'], runProp: 'bone', bigProp: 'spire', gauntletProp: 'spire',
  },
  gentou_zentei: {
    motif: '玄冬の対庭', entryLine: '地相「玄冬の対庭」——柱と鳥居が左右を揃え、中央の空白だけを畏れている。',
    wallProps: ['pillar', 'torii', 'grave', 'wisp', 'crystal'], runProp: 'pillar', bigProp: 'torii', gauntletProp: 'pillar',
  },
  todome_no_kaidan: {
    motif: '数違いの石段', entryLine: '地相「数違いの石段」——石壁と塚が段を刻むたび、上りと下りの数がずれる。',
    wallProps: ['stonewall', 'pillar', 'grave', 'cairn', 'bone'], runProp: 'stonewall', bigProp: 'pillar', gauntletProp: 'stonewall',
  },
  gentou_no_zenya: {
    motif: '無人の宴座', entryLine: '地相「無人の宴座」——柱間の灯と空席が、客のいない祝宴を囲む。',
    wallProps: ['lantern', 'pillar', 'grave', 'wisp', 'brokenlantern'], runProp: 'lantern', bigProp: 'pillar', gauntletProp: 'lantern',
  },
  akashi_miyama: {
    motif: '封星の神路', entryLine: '地相「封星の神路」——鳥居と星晶が同心に重なり、山頂の座へ絞られる。',
    wallProps: ['torii', 'pillar', 'crystal', 'wisp', 'grave'], runProp: 'torii', bigProp: 'torii', gauntletProp: 'torii',
  },
  tokoyo_tou: {
    motif: '巡る百層', entryLine: '地相「巡る百層」——柱、尖塔、鳥居、骨が十層ごとに支配を入れ替える。',
    wallProps: ['pillar', 'spire', 'torii', 'crystal', 'bone'], runProp: 'pillar', bigProp: 'spire', gauntletProp: 'torii',
  },
}

export function regionIdentityOf(regionId: string): RegionIdentity | null {
  return REGION_IDENTITIES[regionId] ?? null
}
