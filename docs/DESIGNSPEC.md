# DESIGNSPEC — A案「墨金の家譜」(2026-07-08 /designspec)

> **前提ベース・要検証**: Phase 0 の6問はユーザー未回答のため本セッション文脈から導出した前提で進めた —
> ①ブランド性格=和風ダーク・静謐・悲哀と温かさ(既存トーン) ②ターゲット=俺屍世代30-50代+インディーRPG層・PC/モバイル同格 ③言語=日本語のみ(RTLなし)
> ④参考=俺屍系/避ける=ソシャゲ的ネオン ⑤制約=React19+素CSS・Shippori Mincho・GitHub Pages静的 ⑥A11y=reduce-motion実装済・display=swap。
> いずれかが外れる場合(特に②の年齢層と⑥)は該当次元の再検討が必要。
>
> **経路**: 方向性はユーザー選択(A/B/C提示→「A: 墨金の家譜」選択)[事実]。
> **ペルソナ注記**: ux-sonoda / brand-takashiro / devil-advocate はモデル人格による疑似専門視点であり、実在の専門家レビューの代替ではない。最終判断はプロのデザイナー確認を推奨。

## 1. 方向性+根拠

**A案「墨金の家譜」** — 現行の和風ダーク基調(紺+金)は不変。磨き方=①書物・和紙・罫線メタファー強化 ②階調を締める ③金を「見出し・当主・確定行為」に限定して価値回復 ④明朝階層の厳密化。

ブランド原則(brand-takashiro、運用形):
1. **金は見出し・当主・確定行為にのみ**使う。警告色・汎用ボタン・ゲージには使わない(希少性=価値)
2. **絵文字は全廃**(🎯🏹🌌🕯️🦊等)→ 漢字一字の印 or 家紋風アイコンへ
3. **ゲーム記号は和語に翻訳**(Lv→位: 壱位・弐位…。数値は添字に留める)
4. **明朝階層は3段まで**。強調手段は罫線・行間・金の3つだけ
5. **罫線・和紙質感はコンテナ単位のみ**(Panel/Modal外枠・綴じ目)。ボタン内部・本文行に模様を入れない

## 2. 15次元別仕様

| # | 次元 | 視点 | 仕様(要点) | 優先 |
|---|---|---|---|---|
| 1 | ビジュアル方向 | brand-takashiro+汎用※ | §1の原則5箇条。家譜メタファー: Panel左端に1px金の縦罫(綴じ目)・panel-title下線を一本罫・場面送りは既存se('page')に「めくり」の薄いモーションを揃える | 高 |
| 2 | IA・ナビ | ux-sonoda+汎用IA※ | `.home-links`(9個並列)をpanelで囲み「郷の営み」見出しで行動カードへの従属を明示。条件解禁ボタンに`.btn-unlock`(初出現時のみ金縁) | 中 |
| 3 | 配色 | **決定的次元**→§3 | 選択色flame統一(9セレクタ)・--ember-text新設・disabled非色手がかり`filter: grayscale(0.4)` | 高 |
| 4 | タイポ | **決定的次元**→§3 | remトークン3段+和語位階 | 高 |
| 5 | UIパターン | ux-sonoda | panel間をmarginでなく罫線境界(`border-top: 1px double var(--panel-border)`)で区切る。一覧系モーダルに`.modal-dense`(padding/line-height圧縮) | 中 |
| 6 | 状態デザイン | ux-sonoda | Title.tsxの`flash()`を`.toast`系に統一・`.toast-error`(ember枠)新設。セーブインポートのFileReader読込中表示追加 | 高 |
| 7 | UIコピー | 汎用UXライティング※+brand | トーン=「筆記者の口伝(乾いた敬意)」・断定形・絵文字禁止・和語。例: 務め三部を🎯🏹🌌→「今/代/紀」漢字印、`Lv3`→`参位` | 中 |
| 8 | 素材 | 汎用制作※ | →§4。原則**新規ラスタ不要**(罫線・和紙はCSSで実現) | 低 |
| 9 | モーション | ux-sonoda+ゲート昇格 | `@media (prefers-reduced-motion: reduce)`追加(OS設定を既定尊重・設定トグルは上書き用に格下げ)。**主題/装飾分類表**: 主題(灯flicker・灯ゲージ危険パルス)=静的グロー/固定色警告に**置換して残す**(消灯しない)・装飾(粒子/浮遊/シェイク/victoryJump)=停止 | 高 |
| 10 | アクセシビリティ | ux-sonoda | `:focus-visible`全域(2px amber outline+offset 2px)・タッチ目標44px底上げ(.mute-btn/.filter-tab/.cmd-btn)・選択の色非依存化=2px枠(非選択1px)+右上◆印(::after)・region-card/god-card等divクリックのtabIndex/onKeyDown有無は要確認 | 高 |
| 11 | レスポンシブ | ux-sonoda | **モバイル同格違反2件の修正**: `.action-card-desc{display:none}`がdisabled理由(note)まで消す→noteのみ表示残す。`.god-row-bias`非表示→2文字略記に | 高 |
| 12 | SEO・OGP | 汎用Web※ | **該当薄**: title/description/OG/twitter/ogp.jpg/favicon完備済み。追加はtheme-color程度 | 低 |
| 13 | 実装接続 | **決定的次元**→§3 | 素CSS+:rootトークン維持 | 高 |
| 14 | コスト | 単一視点(cfo-yukiスポーン省略) | **該当薄**: 金銭コスト0円構成(Google Fonts無料・素CSS・素材は既存2107枚活用)のため。工数のみ(§6の実装順で1〜2日規模[推定]) | 低 |
| 15 | 権利 | 汎用法務※ | フォント=OFL 1.1で問題なし[事実→§3]。生成画像=novaAnimeXL利用規約依存[要確認]。GoatCounter商用利用条件[要確認] | 中 |

※=単一視点・要専門確認。ux-sonodaが7次元を担当する集中はHCD一貫性のための意図的配置だが、それ自体が単一視点リスクである(注記)。

## 3. 決定的次元の具体表(devil-advocateゲート: 1周目要修正→修正→**合格**)

### 3a. タイポ

| 項目 | 値 | タグ |
|---|---|---|
| 和文書体 | Shippori Mincho(現行維持)。ライセンス **SIL OFL 1.1** | [事実(fonts.google.com/specimen/Shippori+Mincho)] |
| ウェイト | 500/600/700/800(Google Fonts配信CSSに全部実在) | [事実(fonts.googleapis.com配信CSS実確認)] |
| 配信 | Google Fonts・`display=swap`(現行)・JPはunicode-range自動分割配信 | [事実(developers.googleblog.com)] |
| 商用webfont可否 | OFLは他ソフトウェアへのバンドル・再配布を許諾(単体販売のみ不可)→ゲームUI組込み可 | [事実(openfontlicense.org条文)] |
| 欧文ペア | EB Garamond(OFL・5ウェイト)を**タイトル英字装飾のみ任意**。本文数字はShippori Mincho内蔵数字(追加リクエスト0・統一感優先)→**当面導入見送り** | [推定(KISS判断)] |
| 階層(remトークン) | `--fs-title: 1.3125rem`(21px)/700/letter-spacing 0.08em ・ `--fs-sub: 1rem`(16px)/600 ・ `--fs-body: 0.90625rem`(14.5px)/500/line-height 1.75 | [仮説(**要実機検証**→§7)] |

ゲート指摘の反映: サイズはpx直書きでなくremトークン化(後日調整=:root 1行)。本文500維持は「600だと見出しとの階層差が消える」判断で、可読性はサイズ(14.5px)と行間(1.75)で確保 — **実機検証を確定条件とする**。

### 3b. 配色(算出=WCAG相対輝度・sRGB。panel(rgba 0.88)は最暗#0b0f1e/最明#1a2440両地の合成最悪点方式)

| ペア | 比 | AA(4.5) | タグ |
|---|---|---|---|
| --text #efe6d4 / --night | 14.17(panel合成 14.05〜14.46) | ✅ | [事実(算出: sRGB輝度)] |
| --text-dim #9a917f / --night | 5.63(panel合成 5.58) | ✅ | [事実(算出)] |
| --gold #c9a86a / --night | 7.77 | ✅ | [事実(算出)] |
| --amber / --flame / 夜地 | 8.15 / 8.50 | ✅ | [事実(算出)] |
| **--ember #c73e3a を文字色使用** | **3.50** | **❌ AA未達** | [事実(算出)] |
| **新設 --ember-text: #e0655c** | 5.17(panel合成最悪 5.13) | ✅ | [事実(算出)] |
| バッジ #fff on --ember | 5.03 | ✅(修正不要) | [事実(算出)] |
| 選択色 --flame on --night-soft | 7.55 | ✅ | [事実(算出)] |

**変更は2点のみ**:
1. `--ember-text: #e0655c` 新設 → 文字色として--emberを使う4箇所を置換: `.region-tier`(502) `.log-ko`(574) `.log-lose`(577) `.boss-banner-sub`(835)。--emberは枠/背景/バッジ用に存続
2. **「選択中」をflame系に全画面統一**(現状gold/amber/el-starが混在)。移行対象9セレクタ(index.css実測): `.char-card.selected`(228) `.filter-tab.active`(313) `.god-card.selected`(324) `.god-row.selected`(373) `.naming-pick.active`(475) `.region-card.selected`(491) `.inv-sort-btn.active`(1057) `.familytree-node.selected`(1449) — border/bg/inset/glowを `#ff9d45`+`rgba(255,157,69,α)` に一括置換。**例外**: `.elem-chip.active`(316)は白枠維持(各属性色地の上で全属性共通に効く唯一の高輝度枠)。`.targetable`系は「敵対象=ember」の意味色なので対象外
- 選択の**色非依存化**: 選択=2px枠(非選択1px)+右上◆印(::after・flame)。色を失っても枠太差+印形状で判別可能
- **受入基準(機械検証)**: 対象9行の旧色 `rgba(232, 163, 61` **および** `rgba(217, 194, 106`・`var(--el-star)`(.god-card用)の出現0件をgrepで確認+全画面目視(ゲート指摘反映)

### 3c. UI実装方針

- **素CSS+:rootデザイントークン方式を維持**。Tailwind/CSS-in-JS/CSS Modules移行は**しない** — 稼働中ゲームの全面書き換えリスク・個人開発2名にKISS。代替案として検討し棄却[推定(移行コスト>便益)]
- index.cssは分割しない(カスケード順リスク)。セクションコメントで整理。追記ブロック: トークン追加(--ember-text/--fs-*)・:focus-visible・prefers-reduced-motion・.btn-unlock・.modal-dense・.toast-error・罫線メタファー
- トレードオフ: 単一CSS約1500行の肥大は続く。分割は「lightningcssビルドが壊れた時」まで先送り(過去にCSSコメント`*/`でビルド破壊の前科あり — 追記時は`npx vite build`必須)

## 4. 素材

| 種類 | 点数 | スタイル | 調達 | 権利 |
|---|---|---|---|---|
| 和紙テクスチャ | 0〜1 | 極薄ノイズ。**まずCSSグラデ+ノイズで代替**し、不足時のみ生成 | CSS(0円)or /genprompt | 生成時はnovaAnimeXL規約[要確認] |
| 漢字一字印(務め: 今/代/紀 等) | 0 | 絵文字置換はテキスト+罫線囲みで実現(生成不要) | CSS | — |
| 朱印マーク(当主・確定ボタン用) | 1 | 掠れた角印風 | SVG自作(0円)推奨 | 自作=問題なし |
| 家紋風アイコン(🕯️🦊等の置換) | 必要分のみ | 既存ico_*資産を先に流用検討 | 既存→不足分/genprompt | 同上[要確認] |

生成AI素材の商用可否は生成モデルの利用規約に依存するため断定しない[要確認]。

## 5. AAチェック

- **コントラスト**: §3bの算出表の通り。現状の唯一の未達=--emberの文字使用(3.50)→--ember-text(5.17)で解消 [事実(算出)]
- **機械保証はコントラスト比まで**。フォーカス可視性(:focus-visible追加)・タッチ目標44px・キーボード操作(divクリックのtabIndex)・SR動作はux-sonoda所感+実装後の手動確認であり、WCAG AA全体の機械的保証ではない
- prefers-reduced-motion: 主題モーションは「静止した灯」に置換(情報・世界観を失わず前庭障害保護と両立)

## 6. 実装接続(→/mission契約の入力)

**完了の定義(機械検証可能)**:
1. `:root`に`--ember-text`・`--fs-title/-sub/-body`追加、tsc緑+`npx vite build`緑
2. 選択色移行: §3b受入grep(旧色3種0件)クリア
3. `:focus-visible`・`@media (prefers-reduced-motion: reduce)`がindex.cssに存在(grep)
4. モバイル同格2件(.action-card-desc note表示/.god-row-bias略記)修正、560px幅で目視
5. 絵文字全廃: `src/ui/`から対象絵文字のgrep 0件
6. Title flash()→toast統一・.toast-error新設

**スコープ外**: 画像素材の新規生成(→/genprompt別途)・BGM/SE変更・GDD_v3の仕様変更を伴う画面追加。
**実装順(推奨)**: トークン+AA修正(1)(2)→a11y(3)→レスポンシブ(4)→トーン統一(5)(6)→罫線メタファー(§2 #1,5)。

## 7. 未解決前提と最安検証法

| 前提 | 検証法(最安) |
|---|---|
| 本文14.5px/500の実機可読性[仮説] | 非Retina Windows+中位Android実機で本文画面スクショ各1枚(計10分)。NG時は:rootの--fs-body 1行調整 |
| ターゲット層30-50代(Phase 0前提由来) | 公開後のGoatCounter+X反応の観察(0円) |
| novaAnimeXL生成画像の商用可否 | モデル配布ページの規約読解(15分)[要確認] |
| GoatCounter商用利用条件 | 公式サイトの料金/規約ページ(10分)[要確認] |
| 罫線・綴じ目の情緒適合 | Home 1画面だけ先行実装して目視(30分)。過剰装飾ならコンテナ単位規則(§1-5)まで後退 |
| divクリック要素のキーボード操作可否 | `grep tabIndex src/ui/`(5分)→なければ§2 #10の実装に含める |

---
*生成: /designspec(Phase 0前提刻印→A案ユーザー選択→15次元スイープ(ux-sonoda/brand-takashiro/フォント裏取り)→決定的3次元+devil-advocateゲート合格)。ペルソナは疑似専門視点であり実在専門家の代替ではない。*
