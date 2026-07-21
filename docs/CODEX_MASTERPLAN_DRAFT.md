# 灯継ぎ -HITSUGI- 体験再設計・URL移行マスタープラン

> 2026-07-21更新: §17に「AI感解消・空間美術再建」を追加した。郷・ダンジョン・戦闘の魅力改善では、素材の一括追加より先に、少数画面を完成品質へ到達させる縦切り検証を行う。§17は視覚刷新に限って§5・§8・§13・§14・§16の旧gateと旧順序を置換する。機能安全性と公開境界は従来どおり維持する。
>
> 2026-07-21 全景品質再計画: AR1実装後、ユーザーが「鍛冶場だけは良いが、その他はチープ」と実画面で指摘した。これは単品素材の品質ではなく、同じ画角にある地面・他施設・人物・札・接地・光の品質差が完成品を孤立させる問題である。§18はこの反証を受け、AR1とAR2の間にAR1R「完成画角closure」を挿入し、8〜12 family先行案を4 macro biome＋12署名地点へ縮退する。§18は視覚完成の次作業順について§17.8以降を置換する。
>
> 2026-07-21 Forge更新: Claude向けAR0 scope、最初の72時間、dirty M35の同一file隔離、現行の非永続`DungeonRun`に即した`mapVersion`契約を再設計した。新規独立closure評価は5軸すべて5/5、blocking 0でPASS。証跡は`docs/CODEX_FORGE_STATE_VISUAL_PLAN.md`。
>
> 2026-07-20更新: ユーザーは外部公開用Organization `hitsugi-game`を作成し、repositoryを`hitsugi-game/hitsugi`へ移管した。新Pages `https://hitsugi-game.github.io/hitsugi/`はHTTP 200、旧Pagesは404。公開案内前で外部利用者0人のため、今回の移管では一般利用者向け旧origin救出を省略した。今後公開後にoriginを再変更する場合は§9の移行gateを再適用する。詳細は`docs/CODEX_HANDOFF.md`。

- 状態: 実装前ドラフト（Claude / Fable 5への実装指示に変換可能）
- 作成日: 2026-07-20（2026-07-21 視覚再建計画を追記）
- 基準commit: `7966fa25daf5b34e5cbb829c9510d3b1f3895b77`（未commitのM35星契り改善を別作業として保持）
- 正典: `docs/GDD_v3.md`
- 対象: UI/UX、遊びの復帰性、主要画面の魅力、モバイル快適性、公開URL
- 非対象: この文書でのpush、DNS変更、GitHubアカウント名変更、課金導入

## 0. 結論

本作は「素材や機能が足りない」段階を越え、**豊富な内容を一つの感情的な流れへ編集する段階**に入っている。

主経路は次の一文に集約する。

> **郷で家族の危機を知る → 今月の一手を決める → 夜藪で代償を払う → 帰還後に人・景色・家譜が変わる → 次代を見たくて再開する。**

したがって、追加機能を先に増やすのではなく、次の順で進める。

1. モバイルの横崩れ・操作衝突・画面遷移後のスクロール残留を除去する。
2. Homeの複数推薦を「今月の要」一面へ統合する。
3. 帰還後と再開時に「何が変わったか／次に何をしたかったか」を見せる。
4. 鍛冶・図鑑・出立を、全件閲覧中心から人物・目的中心へ変える。
5. 実ユーザー計測で初回継承までの詰まりを特定してから、大きな追加制作を行う。
6. 現在のOrganization URLを正典化し、独自ドメインは公開後の利用実績を見て別案件で判断する。

URLについては、当初**GitHubアカウント名やリポジトリ名を変えず、独自ドメインをGitHub Pagesへ設定すること**を推奨した。その後、ユーザーは社内用accountを保護しつつ外部公開物を分離するため`hitsugi-game` Organizationへrepositoryを移管した。外部利用者0人・公開案内前だったため今回のorigin変更では一般利用者向け救出を省略した。今後、利用者発生後にURLを再変更する場合は、`localStorage`移行と旧origin救出を必須へ戻す。

## 1. ミッション契約

### 1.1 表明されたテーマ

- [事実] 現在の状況を確認し、楽しさと快適さを両立する画面設計を作る。
- [事実] `https://umine2025.github.io/hitsugi/`の`umine2025`部分を変更できるか判断する。

### 1.2 本当に解く仕事

- [推定] プレイヤーは「機能一覧」を消化したいのではなく、短命な家族に愛着を持ち、迷いながら一手を選び、その痕跡が世界に残る体験を求める。
- [推定] 現在の主な欠損はコンテンツ量ではなく、優先順位、因果の見せ方、再開時の記憶補助である。
- [推定] URLの目的は匿名化ではなく、ゲーム名で覚えられる公開住所とブランドの独立性である。完全な匿名化が目的なら、公開リポジトリやDNS参照先からGitHub名を追跡できるため別設計が必要になる。

### 1.3 成功条件

#### 画面・操作

- 360 / 390 / 768 / 1280 / 1440pxでページ全体の横スクロールが0。
- 主要タッチ目標は44×44px以上、戦闘の主要コマンドは48pxを推奨。
- どの主要画面でも5秒以内に「現在地」「危機」「次の主行動」「戻り方」を説明できる。
- Homeでは主推薦が一つだけ表示され、綴・血脈診断・行動札で結論が矛盾しない。
- 画面遷移時は新画面の先頭へ移り、戻る場合だけ必要な内部位置を復元する。
- 購入、鍛錬、月送り、セーブ削除など不可逆操作は結果と費用を確認してから実行する。

#### 楽しさ・復帰

- [仮説] North Starは「7日コアループ継承完了率」とする。
- 新規セーブが7日以内に、星契り→子の命名→初回帰還→初回当主継承まで到達したかを測る。
- 再開後10秒以内の意味ある操作率、Homeから月行動確定までの時間、帰還後60秒以内の次行動率を測る。
- 起動・日参り受領・静養連打だけを成功行動に数えない。

#### URL移行

- 現在の正典URLを`https://hitsugi-game.github.io/hitsugi/`、正典repositoryを`https://github.com/hitsugi-game/hitsugi`に統一する。
- README、DEPLOY、MARKETING、OGP、status文書に旧owner URLを「現行」として残さない。
- 次回origin変更時だけ、旧セーブfixtureを書き出し、新URLへ読み込み後に一族・装備・通貨・家譜・flagsが一致する救出gateを再適用する。
- UI刷新と将来のorigin切替を同じ公開単位へ混ぜない。

### 1.4 前提と権限境界

- [事実] `main`へのpushは公開デプロイと同義で、ユーザー確認が必要。
- [事実] ドメイン購入、DNS、GitHub Pages Settingsは外部状態を変えるため、この計画では実施しない。
- [仮説] PCとスマートフォンを同格の対象にする。
- [事実] Organization移管時点は公開案内前で外部利用者0人だったため、今回のowner変更では一般向けセーブ救出を省略した。
- [仮説] 公開後の次回origin変更では既存セーブ保有者がいるものとして移行を設計する。
- [仮説] 実装担当はClaude / Fable 5、Codexは計画・検収基準を渡す。
- [事実] 作業前から未追跡`tmp/`がある。本監査で`docs/CODEX_MASTERPLAN_DRAFT.md`と`docs/qa/`を追加した。実装時も`git add -A`を使わず、各commitの所有pathだけstageする。

## 2. 現状証拠

### 2.1 リポジトリと品質ゲート

- [事実] 基準codeは`HEAD == origin/main == 478be96`でtracked treeはclean。本稿作成後の未追跡は、既存`tmp/`と、本監査成果`docs/CODEX_MASTERPLAN_DRAFT.md`、`docs/qa/`である。
- [事実] 2026-07-20に`npm run lint`成功、Vitest 19ファイル・565件成功、`npm run build`成功を再確認した。
- [事実] Playwrightは5 viewport、18 spec、205件を列挙する。ただしGitHub Pagesのdeploy workflowではPlaywrightを実行しない。
- [事実] 監査時は`docs/STATUS.md`にM27未pushの古い記述があった。2026-07-20のOrganization移管記録時に公開済みへ同期した。
- [事実] VillageとDungeonは遅延読込済みだが、main JSはビルド時1,348.27kB、gzip 408.40kBで、500kB chunk警告が残る。

### 2.2 公開版の実測

#### 良い点

- [推定] 2026-07-20の公開版目視では、タイトル画面が灯籠・常夜・一族のトーンを最も短時間で伝えていた。
- [事実] Homeは寿命、後継、一族、今月の4行動、11の帳メニューを意味のある見出しで構造化している。
- [事実] 鍛冶は検索、部位フィルタ、推薦、比較差分、確認購入、モバイルSheetを備える。
- [事実] Sheet共通部品は背景タップ、Escape、フォーカス復帰、スクロールロックを持つ。
- [事実] 戦闘とDungeonには矩形交差、暗部率、44px、1対2/4対4、地域差、稀相の自動検証がある。

#### P0: 先に直す実害

1. **Homeのモバイル横崩れ**
   - [事実] 2026-07-20、公開URLをChromeの390px相当でHomeへ進め、`document.documentElement.clientWidth`と`document.body.scrollWidth`を測ると`375 / 1049px`。
   - [事実] `.family-main`、当主の`.char-card`、`.family-smalls`、`.blood-diag`が約1020pxへ拡張され、ページ全体に横スクロールが生じる。
   - [推定] `@media(max-width:640px){.family-board{grid-template-columns:1fr}}`の`1fr`がmin-contentに負け、子へ`min-width:0`がないことが直接原因。
   - 受入: `.family-board { grid-template-columns:minmax(0,1fr) }`相当と子の`min-width:0`を入れ、Home全体の`scrollWidth <= clientWidth`を5幅で固定する。

2. **戦闘モバイルの上端競合**
   - [事実] 永続化した`docs/qa/baselines/20260720-battle-1v2-mobile-360-before.png`では、行動順・敵の兆し・敵名札が同じ上端に重なり、敵札の情報を隠す。
   - 受入: 1対2/4対4とも、行動順、兆し、名札の矩形交差0。行動順が複数行になる場合は領域高も追随する。

3. **郷モバイルの操作衝突**
   - [事実] 永続化した`docs/qa/baselines/20260720-village-mobile-360-before.png`では、D-padと近接人物の「話す」ボタンが下端で重なる。
   - 受入: 移動帯と近接行動帯を別領域にし、相互交差0、端から12px以上、全方向48px以上。

#### P1: 楽しさ・信頼を削る問題

- [事実] Homeには危機札、綴の助言、血脈診断、行動札の「薦」があり、最大4箇所で次行動を示す。
- [事実] 綴と主推薦は異なる判定経路を持ち、複合状態で結論が食い違う可能性がある。
- [事実] Homeを途中までスクロールして鍛冶へ移動すると、鍛冶が`scrollY=235`から開始した。`App.tsx`にscreen変更時のscroll resetはない。
- [事実] 鍛冶の購入一覧は333品。初回50品を表示しても、一覧そのものが主役になり、右の詳細面は未選択時に大きく空く。
- [事実] 鍛冶の「薦」は画面上で明示・変更できない`selChar`を比較対象にする。
- [事実] 出立の地域選択は40地域を一枚の縦長SVGで探し、隊員は毎回空から選び直す。
- [事実] Dungeonのモバイルでは安全行動「帰り火」が小休止の中へ隠れる。
- [事実] Dungeonのミニマップ拡大tap-zoneは透明で、タップ移動と外見上区別できない。
- [事実] 敵札タップと「攻撃」ボタンで対象決定の暗黙規則が異なる。
- [事実] 敵の兆し「攻・術・群」の説明はhover/title中心で、タッチでは意味を得にくい。
- [事実] 図鑑モバイルでは選択詳細が最大50件の一覧末尾に置かれ、押しても反応しないように感じやすい。
- [事実] 家系図の閉じると全画面設定が右上で競合する。
- [事実] `index.html`のfaviconは`/favicon.svg`で、project Pagesではowner直下を参照する。OGP 3箇所は旧URLを直書きしている。
- [事実] `hasSave()`はv1/v3/v4/backupを見るが、現行`downloadSave()`はv4 mainだけを読む。backupまたは旧版だけ残る利用者は「セーブあり」でも書き出せない。

#### 証拠の再現方法

- Home横幅: 公開版で続きから→Home、390px相当。consoleで`[document.documentElement.clientWidth, document.body.scrollWidth]`を評価し、`[...document.querySelectorAll('.family-main,.family-smalls,.blood-diag,.char-card')].map(x => x.getBoundingClientRect())`で原因を確認する。
- 画面scroll残留: Homeを200px以上scroll→鍛冶と蔵。遷移後`window.scrollY`を評価する。2026-07-20の公開版では235。`src/App.tsx:103-220`にはscreen変更時scroll resetがない。
- 戦闘/郷: `docs/qa/ui-audit-baseline-20260720.md`と永続化したbefore画像、`tests/visual/gate.spec.ts`、`tests/visual/village.spec.ts`を同時に確認する。gitignore対象の`.shots/`だけを荷重支持証拠にしない。
- URL: `index.html:5,12-15`、`src/core/save.ts:3-6,212-240,269-299`、`.github/workflows/deploy.yml`を一次証拠とする。

### 2.3 計測の空白

- [事実] GoatCounterは`your-code` placeholderのままで、現実の利用者数、離脱地点、既存セーブ数は不明。
- [事実] unit/visual testsは破綻しない配置をよく検証するが、「初回開始→命名→帰還→継承→翌日再開」の旅程テストはない。
- [事実] スクリーンショットは保存されるがpixel比較・人間の採否記録が自動ゲートではない。
- [推定] 「テスト数が増えた」ことを「魅力が増えた」ことの代替指標にすると、M24と同じ失敗を繰り返す。

## 3. 類似事例から借りる原理

### 3.1 Hades: 難しさを削るのでなく、物語へ戻す補助

- [事実] Supergiant GamesはHadesのGod Modeを常時選択可能にし、死亡のたびに耐久を少し増やす。[Hades公式FAQ](https://www.supergiantgames.com/blog/hades-faq/)
- [推定] 成功点は「簡単モード」を別ゲームとして隔離せず、失敗と物語進行の輪を保ったまま摩擦だけを下げたこと。
- HITSUGIへの適用: オートや推奨はゲームを代行する入口ではなく、同じ継承・探索・因果へ戻す補助に置く。オートを最上段CTAにせず、操作負担設定として扱う。

### 3.2 Xbox Accessibility Guidelines: 地図と一覧を競合させず併設

- [事実] Microsoftは、UIの一貫した位置・順序、keyboard/digital input、二方向スクロールを避けるreflow、全submenuから戻れる導線を推奨している。[XAG 112: UI navigation](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/112)
- [事実] 同ガイドはHalo Infiniteの地図に、地点を探さなくても選べるテキスト一覧を併設する例を挙げる。
- [推定] 地図の魅力を守る方法は一覧を消すことではなく、「候補を一覧で選ぶ→地図がその場所を見せる」という役割分担である。
- HITSUGIへの適用: 出立は「最前線／未討伐／前回地域」の短い候補一覧を先に置き、選択時に絵巻を中央へ寄せる。

### 3.3 Sea of Thieves / The Outer Worlds: 一貫した戻り方とreflow

- [事実] MicrosoftはSea of Thievesの選択・戻る・tab操作が複数画面で同じ位置と規則を保つ例、The Outer Worldsの最大文字サイズでも二方向スクロールを要求しない例を挙げる。[XAG 112](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/112)
- HITSUGIへの適用: 「戻る」「閉じる」「詳細Sheet」「確認」を共通Shellへ寄せ、Homeだけでなく全主要画面の横overflowをCIで検査する。

### 3.4 内部の反例: M24→M25

- [事実] M24はVitest/build成功で公開したが実描画を十分に見ず、翌M25で暗部と390px戦闘重複を修正した。
- 教訓: 機械チェック、人間の5秒理解テスト、同一セーブbefore/afterの3つを揃えて初めて「魅力改善完了」とする。

## 4. 9つのレンズで見た非自明な洞察

### L1. コアファンタジー

- [推定] 本作の固有価値は戦利品の多さではなく、「この子を次代へ残すために今月何を犠牲にするか」である。
- 帰結: Home、出立、帰還、家系図を一本の因果として最優先し、独立した便利メニューの磨き込みは二段目に置く。

### L2. 注意と情報設計

- [推定] 333品、40地域、11メニューは量として魅力だが、初手で全件を並べると「何を選ぶべきか」を隠す。
- 帰結: 初期表示は全件ではなく、人物・目的・未達成に基づく3〜7候補。全件は明示的な「すべて見る」へ送る。

### L3. 推薦の信頼

- [推定] 推薦の重複は単なる情報過多ではない。異なる結論が出た瞬間に、プレイヤーはゲームの助言全体を信用しなくなる。
- 帰結: `recommendAction()`を唯一の決定源にし、各場所は同じ結果を別の語り口で表現するだけにする。

### L4. 因果と報酬

- [推定] 戦闘報酬のtoastだけでは「世界が動いた」と感じにくい。
- 帰結: 帰還後に最大3件だけ、人物・因縁・発見の順で差分を見せ、関連画面へ直行できるようにする。

### L5. 再開性

- [事実] 現在は前回の意図を保存・提示する「前回の灯」がない。
- [推定] 最大の離脱点はプレイ中より、数日後に「何をしていたか分からない」こと。
- 帰結: 続きからの直後に、未完の危機・最後の地域・次月確定事項から純粋導出した再開札を一度だけ出す。

### L6. 利便性とゲーム性の競合

- [推定] 郷の即移動は歩行と偶発会話を、最上段のオートは継足判断を迂回する。便利さが署名体験を食べている。
- 帰結: 初回訪問は歩行を促し、訪問済み施設は短縮可能にする。オートは副操作へ置き、いつでも停止可能に保つ。

### L7. 日次報酬の競合ループ

- [事実] 24時間離席、日参り、御題の合計報酬は序盤の星契り費用を遊ばず賄える場合がある。
- [仮説] 「家族の続きを見たい」より「日付が変わったから回収する」が強くなり得る。
- 帰結: いきなり削除せず計測し、受領だけで終了する率が高ければ、物語近況と再開支援へ置換する。

### L8. 自動検証の盲点

- [事実] 戦闘・Dungeonに強いvisual gateがある一方、Home、出立、鍛冶、図鑑、設定の390px旅程が薄い。
- 帰結: `body.scrollWidth`、主CTA可視、戻る導線、詳細表示、フォーカス復帰を全主要画面の共通contract testにする。

### L9. URLは保存設計

- [事実] 現行セーブは`hitsugi_save_v4`とbackupを`localStorage`へ保存する。
- [事実] Web Storageはorigin単位で、新しい独自ドメインから旧originの保存内容を直接読めない。[MDN Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- 帰結: URL移行はブランド設定ではなく、セーブ移行・旧リンク・OGP・DNS・TLSを含むリリースとして扱う。

## 4A. 引力の設計 — 「強さ」より「この家の次」を見たくさせる

本作の約束は、最強編成を完成させることではない。**短命な一族の誰に、残り少ない今月を使わせるか。その選択が人、郷、家譜へ残ること**である。全画面は次の感情曲線のどこを担当するか明示し、単なる機能入口を増やさない。

| 時点 | プレイヤーの問い | 画面が返すもの | 記憶に残す像 |
|---|---|---|---|
| 最初の30秒 | 私は誰で、何が危ない？ | 当主、寿命、今月の危機を一面で提示 | 消えかけの一灯と空いた座布団 |
| 3分 | 今月は何を選べばいい？ | 推奨1件、理由1文、他の選択肢 | 家族を前にした一度きりの決断 |
| 10分 | 自分の判断は戦いで通じた？ | 敵意図、対象、継足、負傷の因果 | 筆致で繋がる一撃と崩れる灯 |
| 帰還 | 何を持ち帰り、何を失った？ | 人物優先の差分を最大3件 | 郷の灯り・会話・家譜が変わる |
| セッション終端 | 次に何を確かめたい？ | 未解決の危機か次代の予告を一つ | 家系図の「次代が灯る」空節点 |

### 4A.1 五つの署名瞬間

1. **月初の一灯** — Home背景の大灯籠と一族の席が、危機の人物にだけ淡く反応する。
2. **地域入場の一枚絵** — 各地域の地形、光源、主の影を2秒以内で読ませ、同じ迷路の色替えにしない。
3. **稀相の三段予兆** — 環境の異常→固有の遭遇札→産地つき遺物の記録を一続きにする。
4. **継足の筆致** — 技名を増やすより、前の一撃から「なぜ繋がったか」が線と短文で分かる。
5. **帰還の三痕** — 数十個の取得物ではなく、人・因縁・発見から最大3件だけ世界へ刻む。

### 4A.2 健全な継続動機

- 主軸は`好奇心（次の地域/主）×習熟（兆し/継足）×愛着（一族）×収集（遺物/家譜）`。
- 「あと1回」は未解決の問いで作り、期限付き取り逃し、連続ログイン罰、購入連動の可変報酬で作らない。
- 稀相は低確率だけで釣らない。予兆で気づける、地域ごとに母集団が違う、初討伐後に家譜へ残る、重複品にも用途があることを保証する。
- 長時間プレイを強要せず、Home到着時と帰還後に安全な終了点を置く。再開時は「前回の灯」で目的を復元する。

### 4A.3 画面横断の視覚文法

- 深い藍は未知と夜、煤墨は境界、古金は選択可能、灯橙は「今すぐ注目」、朱は損失/危険だけに使う。
- 金枠を全要素へ配らない。主CTA、選択中、初発見のうち同時に最大2用途まで。
- 背景は物語を語るが、文字の背後では局所的に静かにする。画像へ文字・ボタン・人物を焼き込まず、UIと状態差分を実装層で重ねる。
- 希少度、属性、敵意図は必ず`色 + 形/glyph + 明記テキスト`の3系統中2系統以上で伝える。
- 動きは常時漂う環境層、選択への反応層、決着の一回演出に分離し、演出軽減で前二者を停止できる。

## 4B. 物語を「読む場面」からプレイ全体へ戻す

詳細正本は[物語・画像統合計画](NARRATIVE_VISUAL_INTEGRATION_PLAN.md)とする。既存5章、夢渡り、郷の声、非塔39地域縁起、3結末を増量する前に、次を行う。

- 固定神話を「汐里と玄冬の千年の二重奏」、可変主人公をプレイヤーの燈守家とする。
- 主題を`継ぐとは同じ犠牲を繰り返すことか、それとも孤独を分けることか`へ統一する。
- Home、出立、Dungeon、戦闘、帰還、郷、鍛冶、星契り、家系図へ3〜20秒の残響/発見を置き、全画面朗読だけへ集中させない。
- 夢渡り弐〜終の順序抜けをP0として直し、同一月の強制全画面sceneを最大1件にする。
- Intro、初回夢、家業/技、早期神台詞、形見名、灯ノ御山coreを匿名化し、ch4最終の開示beat/skip transactionだけで`汐里`を初開示する。M34 new gameは`m34_narrative_schema=1`を初期化。sentinel欠落legacyだけ`ch4 / gossipIndex>=12 / shioriPhase / endingType / cleared`から一度導出し、判別不能なch4 queue済みsaveへ非modal recapを一度出す。
- 一代の問いと実save由来の固有名/形見/地域をFinaleへ返す。ただし過去行動で3結末をロックせず、推薦もしない。
- 内部ID`cut`はsave互換のため維持し、表示は既存結果と一致する`送る`へ変える。夢8、選択、結果、epilogueの動詞をbranch testで固定する。
- 夢渡り7篇の固有画像は[Story v2 Visual Pack](visuals/story-v2/README.md)を実装候補とする。
- 360/390/768pxの夢CGは16:9 `contain`全景と台詞panelを分け、横長CGの意味を`cover` cropや任意の全景操作へ依存させない。

## 5. 目標画面設計

### 5.0 生成ビジュアルパックと使い方

実装の基準像として、文字・UI・人物を焼き込まない5点を`docs/visuals/ui-v2/`へ追加した。生成条件、寸法、SHA-256、統合規則は[visual manifest](visuals/ui-v2/README.md)を正本とする。

| ID | 対象 | プレビュー | 実装上の役割 |
|---|---|---|---|
| VIS-HOME-01 | Home | [今月の決断台](visuals/ui-v2/home-decision-stage.jpg) | 一族の席、大灯籠、郷を一枚で結ぶ上段hero。主情報は画像上へ直置きしない |
| VIS-BATTLE-01 | 戦闘 | [蛍火の社・戦場](visuals/ui-v2/battle-firefly-shrine.jpg) | 敵味方の空間を光温度で分け、中央を攻防の焦点にする |
| VIS-DUNGEON-01 | Dungeon | [蛍火の窪地・地図](visuals/ui-v2/dungeon-firefly-hollow-map.jpg) | 地域固有の床文法、ランドマーク、帰路を設計する基準像 |
| VIS-VILLAGE-01 | 郷 | [大灯籠の郷](visuals/ui-v2/village-lantern-hub-map.jpg) | 施設の形と位置で方向を覚えられる歩行空間の基準像 |
| VIS-FORGE-01 | 鍛冶と蔵 | [継承工房](visuals/ui-v2/forge-heirloom-workshop.jpg) | 製作と継承品を暖色/寒色で分け、中央を比較面の静域にする |

これらは完成画面のスクリーンショットではなく、**画面が何を感じさせるかを固定するアート・レイアウト契約**である。Dungeonと郷は一枚画像を床へ貼らず、歩行可能層、遮蔽物、光源、POI、前景へ分解する。Home/戦闘/鍛冶も画像採用前に実機cropと文字コントラストを検証し、5枚一括preloadはしない。

物語sceneには別packとして`STORY-DREAM-02`〜`08`の7点を追加した。これは夢渡り弐〜終を同一`cg_kiro.jpg`で見せる現状の反復を解消する候補であり、人物同一性、物語対応、寸法、hash、crop規則は[story visual manifest](visuals/story-v2/README.md)を正本とする。UI画面用5点と夢CG7点を同時preloadしない。

### 5.1 共通Shell

#### PC

- 最大コンテンツ幅は1080〜1200px。ただし1920pxでは本文を単純に拡大せず、重要画面だけ左右ペインを活用する。
- 上段: 画面名、戻る、主要資源、設定。位置と順序を固定する。
- 主面: 一画面一つの主CTA。補助行動は同じ視覚強度にしない。
- 詳細: desktopはsticky右ペイン、未選択時には空白でなく「何を選べばよいか」かおすすめを表示。

#### モバイル

- ページ全体は縦一方向だけスクロール。横スクロールは、人物レールなど意味が明示された局所コンテナだけ許可する。
- 固定下端を使う画面は一つの`ActionDock`だけが所有し、safe-area込みで本文の逃げを確保する。
- 詳細・絞り込み・確認・ログは共通`Sheet`。背景タップ、Escape、明示閉じる、フォーカス復帰を同じ規則にする。
- 画面遷移時に`window.scrollTo(0,0)`。同一画面内tab/filterの位置は保持してよい。

#### 共通受入

- 全操作可能要素に可視focus、明示accessible name、44px以上。
- toastは`role=status` / `aria-live=polite`、重大な保存異常は`role=alert`。
- 設定ボタンに`aria-label="設定"`。全画面へ無条件後載せせず、Shellの予約領域に置く。
- `prefers-reduced-motion`と演出軽減で、花弁、shake、flash、parallaxを止められる。

### 5.2 Title / 続きから

目的: 世界観を約束し、初回と復帰を迷わせない。

- 新規: 「はじめから」を主CTA、「どんなゲームか」を3行で説明。
- 復帰: 「つづきから」の下に、`2年目・弥生 / 当主 燈吾 / 次の危機: 寿命1月`のようなセーブ要約。
- 7日以上ぶり: 「前回の灯」札をHome到着後に一度だけ表示。
- 次回origin移行前: セーブ保有者へ「新しいURLへ移る前に控えを作る」導線を常設。
- セーブ管理: 現在の書き出し・読み込み機能を残し、最終バックアップ日時を表示する。

### 5.3 Home: 「今月の決断台」

目的: 一族全体を理解するのでなく、今月の一手を自信を持って選ぶ。

基準像: [VIS-HOME-01](visuals/ui-v2/home-decision-stage.jpg)。大灯籠は世界の焦点、一族の空いた座は失われる命の予告、遠景の郷は選択の帰結先を示す。PCでは上段heroまたは右側の情景として使い、主情報を中央の灯へ直置きしない。モバイルでは高さ160〜220pxのheroへcropし、今月の要は独立した不透明panelに置く。

#### 情報順

1. 年月・資源
2. **今月の要**: 危機1件、推奨1件、理由1文、主CTA1個
3. 一族: 当主1枚＋他の成人/幼子レール。詳細はタップSheet
4. 4つの月行動: 推奨は強調するが、他の選択肢を隠さない
5. 郷の帳: 営み / 記録 / 心得の3群。初期は要約、展開して全11入口

#### 配置と状態

- PCは`今月の要 7 : 一族 5`の2列。下段の月行動は4枚を同格に並べず、推奨1枚を2列幅、残り3枚を補助幅にする。
- 390px以下は`年月/資源 → 今月の要 → 主CTA → 一族レール → 他の月行動 → 郷の帳`。主CTAまでを初期viewport内へ置く。
- 通常、危機、帰還直後、継承者不在の4状態をfixture化する。危機では人物札と大灯籠の灯色だけが連動し、枠や警告を増殖させない。
- 帰還直後は「帰還の三痕」を今月の要より先に一度だけ出し、閉じた後は履歴から再閲覧できる。

#### ルール

- 綴、血脈診断、推薦札は同一`recommendAction()`結果を共有する。
- 「危機」と「おすすめ」を混同しない。危機は事実、おすすめは解釈。
- 当主以外の詳細statsは初期表示を畳み、寿命・負傷・役割だけを見せる。
- Homeのページ全体overflow testを追加する。
- 5秒テストで初見4/5人が`危機の人物 / 推奨行動 / 他も選べること`を答えられなければ不合格。

### 5.4 出立・隊編成

目的: 行き先と連れていく理由を30秒以内に決める。

- 上段に「最前線」「未討伐」「前回地域」の最大3候補を表示。
- 候補選択で絵巻の該当地点へ自動スクロールし、地図の場所・景観・主・推奨武功を同期表示。
- 全40地域は「すべての地を見る」から閲覧。
- 隊編成は4スロット固定の横一列/2×2。1人カードが横幅一杯にならない。
- 「前回の隊」「おすすめ編成」「全員外す」を用意。幼子・負傷・寿命を明示。
- 地域ノードの実ヒット領域44px、role/button、keyboard activationを保証。

### 5.5 Dungeon

目的: 現在地、目標、危険、戻る判断を視線移動なしで把握する。

- 地域ごとの色、床文法、目印、環境音は維持し、床/壁/未探索の明度差を強める。
- 上端HUDは「灯」「主目的」「階層」だけ。副情報は展開面へ。
- 「帰り火」は全幅で常設。押下後に確認Sheetを出し、隠すことで誤操作を防がない。
- ミニマップ拡大は可視ボタン一つ。透明tap-zoneを廃止。
- 地図の代替として、発見済みPOIの短い一覧を提供し、選択で地図をハイライト。
- 稀相は遭遇前に微かな環境差、遭遇時に固有名・確定遺物、勝利時に産地・初討伐を一続きで演出する。

#### 地域固有文法

各Dungeonは最低でも次の5軸のうち4軸を固有化する。単純な色替えは地域差として数えない。

| 軸 | 蛍火の窪地の基準 | 実装層 |
|---|---|---|
| 歩行面 | 湿った飛石と浅瀬 | tile / navigation |
| 境界 | 水没石垣、葦、深水 | collision / silhouette |
| 光源 | 蛍群と中央の灯籠 | light / particles |
| 道標 | 鳥居、刻石、帰り火 | POI / minimap |
| 環境反応 | 足元の波紋、蛍が進路を避ける | ambient / reduced-motion |

- [VIS-DUNGEON-01](visuals/ui-v2/dungeon-firefly-hollow-map.jpg)を空間文法の基準像とし、歩行可能層、境界、光、POI、前景へ分解する。
- 稀相予兆は`環境音/粒子の変調 → 足跡または影 → 固有遭遇札`の3段。低確率抽選に外れた時も最初の予兆を偽装表示しない。
- 通常敵、稀相、地域主はsilhouetteと接触前markerを分ける。レア度を敵名の色だけで伝えない。
- 探索中の床/壁は色覚差を問わず輪郭差が読め、50%縮小captureでも主経路と未探索境界を判別できること。

### 5.6 戦闘

目的: 敵の意図を読み、誰へ何をするかを迷わず選び、継足の手応えを感じる。

- 画面上端は行動順専用帯。敵名札と重ねない。
- 敵の兆しは`単体攻撃 / 術 / 全体攻撃`と省略せず、icon+text+aria-labelで示す。
- 通常攻撃は「攻撃 → 対象選択」に統一するか、即時なら`攻撃 → 魍魎子A`と対象名をボタンに出す。敵札タップと規則を揃える。
- オートは主CTAの上から外し、補助切替へ。ON中も「次の入力で停止」が理解できる。
- 継足は倍率だけでなく、直前の一撃から何が繋がったかを短く表示。
- 全ログは共通Sheetへ移し、dialog、focus trap、Escape、復帰を得る。
- 戦闘終了は報酬だけで閉じず、人物の負傷・因縁・図鑑・遺物の変化へ接続する。

#### 焦点と手応え

- [VIS-BATTLE-01](visuals/ui-v2/battle-firefly-shrine.jpg)を蛍火地域の戦場基準にする。味方側は灯橙、敵側は月青、中央の水面を攻防の焦点とし、敵札背後は暗く保つ。
- 視線優先度を`敵の兆し → 対象 → 今選べるコマンド → 継足理由 → 全ログ`に固定する。全ログは初期面に置かない。
- PCは上端に行動順、中央に戦場、下端に選択中人物と4コマンド。モバイルは上端行動順を1行、戦場を可変高、下端を唯一の`ActionDock`とする。
- 命中時は`接触0ms → hit-stop 40〜70ms → 筆線/数値120ms → 因果文300ms以内`を基準にし、長いcut-inは主/初見技だけに限定する。演出軽減時はhit-stopと画面shakeを外して情報順は保つ。
- `1対2 / 4対4 / 主戦 / 稀相 / 味方戦闘不能 / オートON`をfixture化し、兆し・名札・行動順・ActionDockの矩形交差0を検証する。
- 初見4/5人が「次に攻撃する敵」「攻撃対象」「なぜ継足になったか」を10秒以内に答えられなければ不合格。

### 5.7 郷を歩く

目的: メニュー背景ではなく、家族と郷人が暮らす場所として記憶させる。

- モバイル下端は左=移動、上/中央=近接行動のように予約領域を分離する。
- 近接時は対象名と行動を一つの大ボタンで表示。D-padの上に被せない。
- 初回訪問の施設は歩いて発見し、訪問後は「すぐ行く」を解禁する案を検証する。
- 郷人の位置、会話、灯り、天候を月/事件で少し変え、Homeの決断結果が景色へ返るようにする。
- 即移動を使っても、到着時の短い一言や環境変化は見逃さない。

#### 空間の記憶と生活感

- [VIS-VILLAGE-01](visuals/ui-v2/village-lantern-hub-map.jpg)を基準像に、中央の大灯籠を常時orientation anchorにする。鍛冶は煙突と暖色、豆腐屋は白暖簾、水場は反射、出立門は鳥居のsilhouetteで識別する。
- 施設名の常設ラベルへ依存しない。初回は近づくと名称、発見後は地図にglyph、即移動後も到着の1〜2秒で場所の特徴を見せる。
- Homeの結果を`灯り / 郷人の位置と一言 / 小道具`の最低1系統へ翌月反映する。全NPCを毎月総入替しない。
- 歩行可能層、建物collision、前景roof、光/天候、NPC、interact hotspotへ分解し、前景が人物を隠す時は透過する。
- 施設3か所を順に訪れるtaskで、初見4/5人が迷子状態30秒未満、D-pad/話すの誤操作0で完了すること。

### 5.8 鍛冶と蔵

目的: 全333品を読むのでなく、「この人を今どう強くするか」を決める。

基準像: [VIS-FORGE-01](visuals/ui-v2/forge-heirloom-workshop.jpg)。左の炉は新造、右の棚と冷光は継承品、中央の作業台は人物と候補の比較に使う。室内画を全面へ強く出さず、品目名の背後は不透明度を確保する。

#### 初期順

1. 人物を選ぶ（現在対象を常に表示）
2. `おすすめ3品 / 装備中 / 所持品`を表示
3. 必要なら検索・絞り込みで全件へ

- desktop右詳細の未選択状態に、対象人物とおすすめ3品を置く。
- モバイルの部位・希少度・並べ替えは「絞り込み」Sheetへ集約し、適用中条件数だけ常設。
- レアリティは色だけに頼らず、名前とglyphを併記。
- 購入後に「誰へ装備する」「蔵へ置く」を選べるが、連続購入を強制しない。
- sticky位置を固定pxで積まず、共通Shellの実高またはCSS custom propertyから計算する。
- 推薦理由は`攻撃+12`だけでなく、`燈吾 / 火属性 / 現在武器比 / 次の主に有効`のうち該当する最大2点を短文化する。
- 詳細には`入手地 / 前の持ち主 / 主な戦果`を表示し、強さが同等でも家の記憶で選べる継承品を作る。
- PCは人物rail、候補一覧、比較詳細の3領域。390px以下は人物1行、推薦3枚、詳細Sheet、下端購入/装備Dockとし、長い全件一覧から開始しない。
- `購入可能 / 資金不足 / 装備不能 / 同部位所持 / 継承品 / 初入手`をfixture化する。背景タップ、Escape、閉じるの全経路で同じ選択元へfocusを戻す。

### 5.9 図鑑・家譜・家系図

目的: 発見数ではなく、一族の歴史が育つ長期報酬を見せる。

- 図鑑モバイル詳細は選択直後のSheet。全一覧末尾へ置かない。
- 図鑑新着は開いただけで全既読にせず、見た項目だけ既読とする現行方針を維持。
- 初代の家系図には「次代がここへ灯る」薄い節点、継承条件、家の短い予告を置き、空白を未来の約束へ変える。
- 「存命のみ」は実際に故人を除外する。薄くするだけなら「故人を薄く」と改名。
- 家系図の閉じると設定の予約領域を分ける。

### 5.10 帰還差分と「前回の灯」

#### 帰還差分

- 最大3件。優先順位は`人物 > 因縁/世代 > 発見/資源`。
- 例: `燈吾が重傷になった`、`灯織が成人まであと1月`、`蛍火の窪地の稀相遺物を家譜へ記した`。
- 各件から一族、家譜、鍛冶、図鑑へ直行できる。
- 数字の羅列や全loot一覧は「詳細」へ畳む。

#### 前回の灯

- 保存するのは自由文ではなく、最後に選んだ地域、未完の危機、次月確定事項、最後の意味ある操作種別。
- 復帰時に一度だけ表示し、`続ける / 別のことをする`を同じ面に置く。
- 反証条件: 操作時間が短くならない、または戻る/目的変更が5pt以上増える。

### 5.11 主要ビジュアルの実装・検収契約

| Gate ID | 対象 | 合格条件 |
|---|---|---|
| VIS-GATE-01 | Home | 390/1280pxで大灯籠と一族席が残り、今月の要/CTAの文字コントラストがWCAG AA。背景OFFでも情報順不変 |
| VIS-GATE-02 | 戦闘 | 1対2/4対4で戦場の焦点が中央に残り、敵名・兆し・対象ringが背景へ沈まない。画面shake OFFでもhit因果を理解可能 |
| VIS-GATE-03 | Dungeon | 概念画を5層以上へ分解し、collisionと見た目が一致。50%縮小でも歩行面/境界/未探索/帰り火を判別可能 |
| VIS-GATE-04 | 郷 | 大灯籠と施設3種をsilhouetteで判別。前景透過、移動/近接の矩形交差0、即移動後も到着地点を説明可能 |
| VIS-GATE-05 | 鍛冶 | 推薦3品・比較差分・購入CTAを背景より先に読める。希少度がgrayscaleでも名前/glyphで識別可能 |
| VIS-GATE-06 | 配信 | 画面別lazy load、未使用画像を初期preloadしない、solid fallbackあり。production profileで採用前baselineよりLCP p75を悪化させない |
| VIS-GATE-07 | 権利/追跡 | `docs/visuals/ui-v2/README.md`のID、prompt、寸法、SHA-256と配信先asset対応を記録 |

画像を採用したこと自体を合格としない。可読性、操作、性能、世界固有性のいずれかを悪化させた場合は、その画面だけ画像を外してlayoutを先に合格させる。

## 6. IAと操作の共通規約

```text
Title
 ├─ Continue → Home「前回の灯」
 └─ New Game → Intro → Home

Home「今月の要」
 ├─ 月行動: 出立 / 星契り / 祭 / 静養
 │   └─ 結果 → 帰還差分/場面 → Home
 ├─ 営み: 鍛冶 / 郷普請 / 郷歩行 / 眷属
 ├─ 記録: 家譜 / 図鑑 / 家系図 / 郷の声
 └─ 心得: 務め / 家訓 / 手引き
```

- 主行動は常に一つ。補助行動は視覚階層を一段下げる。
- 一覧→詳細はdesktopで右ペイン、mobileでSheetという同じmental modelに統一。
- map→地点は「候補一覧で選ぶ→地図が寄る」。地図を読むことだけを必須にしない。
- 戻る、閉じる、確認、キャンセルの語と位置を統一。
- 背景タップ閉じは情報/選択Sheetだけ。不可逆確認は背景タップで実行せず、閉じる場合も入力状態を失う時は警告する。

## 7. 計測と実験

### 7.1 North Starと補助指標

| 指標 | 定義 | 現在値 | 初期目標 |
|---|---|---:|---:|
| 7日コアループ継承完了率 | 新規→命名→初回帰還→初回継承 | 未計測 | まず基準値取得 |
| 初回Home→月行動確定 | 秒数と画面往復数 | 未計測 | 再設計で30%短縮を仮説 |
| 再開10秒以内の意味ある操作率 | 報酬受領だけを除外 | 未計測 | +15ptを仮説 |
| 帰還後60秒以内の次行動率 | 関連画面または次月行動 | 未計測 | +10ptを仮説 |
| 装備改善タスク成功率 | 指定人物を強化できる | 未計測 | 5人中4人以上 |
| モバイル横overflow | 主要画面の超過px | Home 674px超過 | 0px |

母数がない段階で絶対的な継続率目標を置かない。最初の2週間は基準値取得、次に相対改善を判定する。

- [仮説] 7日は最初の観測窓であり、ゲーム内の平均初回継承時間をまだ表さない。2週間のbaselineで、初回継承到達者の80%が7日を超えるなら14日または「初回3session」へ変更する。
- [仮説] PMF調査の40回答は統計的な証明ではなく、少数回答の極端な振れを避ける運用上の最低線。2〜4週で40人に届かなければ、割合判定を中止して定性面接5〜8人へpivotする。
- 30%、15pt、10ptは優先順位づけの仮説値であり、baseline取得後に検出可能差と期間を再計算する。

### 7.2 匿名イベント

- `new_game_started`
- `intro_completed {skipped, elapsed_sec}`
- `child_named {elapsed_sec}`
- `home_viewed {generation, crisis_type}`
- `monthly_action_confirmed {action}`
- `depart_started {region_tier, party_size, used_previous_party}`
- `battle_completed {result, auto_ratio, max_chain}`
- `dungeon_returned {reason, floors, boss_down, loot_band}`
- `return_summary_viewed {item_count}`
- `succession_completed {generation}`
- `resume_card_shown/clicked {intent_type, dormant_days}`
- `forge_recommendation_used {slot, delta_band}`
- `family_tree_opened/shared {generation}`
- `daily_reward_received`
- `odai_claimed`

個人名、辞世本文、セーブJSON、装備の自由記述は送らない。

#### 計測開始gateと代替経路

ネットワーク送信はevent名を実装しただけでは開始しない。次の5点をユーザーが承認し、`GDD_v3.md`と`WORKLOG.md`に送信開始日を記録した日を`M0`とする。

1. providerと保存地域/保存期間を確定する。GoatCounterは候補であり、自動採用しない。
2. 実際のpayload一覧をレビューし、個人名・本文・セーブ内容が送られないcontract testを通す。
3. タイトル/設定から読めるプライバシー説明と、初期状態を含むopt-out方針を確定する。
4. production送信を明示的な設定値で有効化し、test eventがprovider側で受信されることを確認する。
5. ユーザー承認、開始日、停止手順、データ削除窓口を記録する。

定量経路では`M0`から14日間をbaseline期間とし、期間完了まで改善効果を断定しない。計測を導入しない、または承認が得られない場合は、後続Phaseを止めず、同一fixtureを使った初見5〜8人のtask test、再訪インタビュー、画面録画の定性経路へpivotする。その場合、割合やpt改善を成果として掲げず、成功4/5以上、誤操作0、理由説明4/5以上をgateにする。

### 7.3 最初の実験

1. **Home推薦一面化**
   - 仮説: 月行動確定まで30%短縮。
   - 反証: 非推奨行動の自発選択が10pt以上落ちる。
2. **前回の灯**
   - 仮説: 再開10秒以内の意味ある操作率+15pt。
   - 反証: 目的変更/戻るが5pt以上増える。
3. **帰還差分3件**
   - 仮説: 帰還後60秒以内の次行動率+10pt。
   - 反証: summary skipと離脱が増える。
4. **日付報酬の物語置換**
   - 前3実験と基準計測の後に行う。
   - 受領だけで終了する率が高い場合にだけ、報酬量を下げて家族近況へ寄せる。

## 8. 実装ロードマップ

### 8.0 責任・入口・期限

| Phase | 入口条件 | 実装owner / file ownership | 検証owner | 期限上限 |
|---|---|---|---|---:|
| 0 | 基準commit、未追跡差分、before証拠を記録 | Claude/Fable 5: Home CSS、battle/village CSS、対応test、`docs/STATUS.md`、`docs/qa/`、`.github/workflows/deploy.yml` | Codexまたは別担当 | T0+3日 |
| 1 | Phase 0のCI/P0 gate合格 | Claude/Fable 5: App/Home/store補助、Home visual、旅程test、event schema（送信OFF） | Codex+初見5人 | T0+8日 |
| 2 | Phase 1 gate合格。定量は計測開始gate承認、非導入なら定性baseline完了 | Claude/Fable 5: Expedition/Forge/Codex/FamilyTree、Forge visual | Codex+初見5〜8人 | T0+15日 |
| 3A | Phase 2のtask成功4/5 | Claude/Fable 5: Dungeon/Battle/Villageの操作不整合、地域visual layer | Codex | T0+23日 |
| 3B | 下記「体験方針gate」をユーザー承認 | Claude/Fable 5: auto階層、初回歩行、日次報酬実験 | ユーザー+Codex | 実験ごと14日 |
| 4 | Phase 0〜3Aの機能凍結 | Claude/Fable 5: CI/性能/旅程test | 独立監査 | T0+27日 |
| 5（将来任意） | 独自ドメイン採用を別途承認、canonical hostname確定、救出repo承認、UI release安定 | Claude/Fable 5: repo内移行UI。ユーザー: domain/DNS/Settings | Codex+ユーザー | 切替窓+24時間監視 |

`T0`はPhase 0の実装開始日。期限超過時は未完項目を次Phaseへ黙って持ち越さず、範囲縮小か再見積りを判断する。

### 体験方針gate（ユーザー判断が必要）

次は快適性修正ではなく、ゲームの遊び方を変えるため自動実装しない。

- オートを現在位置から副次操作へ降格するか。
- 郷の「すぐ行く」を初回訪問後にだけ解禁するか。
- 日参り/御題の報酬量を下げ、物語近況へ置換するか。

各案は現行baseline→小規模実験→ユーザー採否の順で進める。

### Phase 0 — 安全と測定可能性（1〜3日）

#### 実装

- Home横overflow修正と全主要画面overflow contract test。
- 戦闘上端、郷D-pad/話すの衝突修正。
- `docs/STATUS.md`を実際の公開状態へ同期。
- P0 smoke（Home overflow、戦闘上端、郷操作帯）をGitHub Actionsのblocking jobへ追加。ActionsでChromiumをinstallし、PC/390/360の対象specだけを実行して失敗画像をartifact化する。
- `docs/qa/ui-audit-baseline-20260720.md`のbeforeと同一条件でafterを保存し、commit/viewport/日時/測定値/人間採否を追記する。

#### Exit gate

- 5幅で横overflow 0。
- P0の3欠陥（Home overflow、戦闘上端競合、郷操作競合）が0。
- lint / 565 unit / build / 対象Playwright緑。
- 同一セーブのPC/390px before/afterを追跡可能な`docs/qa/`へ置き、人間が採否記録。
- `.github/workflows/deploy.yml`上でP0 smokeが必須成功し、`docs/qa/ui-acceptance-YYYYMMDD.md`が対象commitを記録する。
- Phase 0 commitでは`tmp/`を除外し、Home/battle/village、対象test、workflow、STATUS、`docs/qa/`だけをpath指定stageする。

### Phase 1 — Homeと復帰（3〜5日）

#### 実装

- screen変更時scroll reset。内部スクロールは画面固有に管理。
- `recommendAction()`単一化と「今月の要」。
- 一族欄の要約/詳細Sheet。
- 「前回の灯」。
- 帰還差分最大3件。
- VIS-HOME-01を候補に、主情報のコントラストとmobile cropを先に検証してからHomeへ統合。未表示時のsolid fallbackを残す。
- 匿名event schemaと送信OFFのadapter。providerへのproduction送信は§7.2の計測開始gate後に別commitで有効化する。

#### Exit gate

- 複合fixtureで全推薦が一致。
- 初見5人のうち4人が5秒以内に主CTAと理由を説明。
- 新規→命名→初回帰還→再開の旅程testが緑。
- 定量経路か定性経路かを決め、provider/privacy/opt-out/開始日、または定性task台本とbaseline結果を正典へ記録する。

### Phase 2 — 選択支援（4〜7日）

#### 実装

- 家系図閉じる/設定の衝突、設定button accessible name、toast live region、戦闘ログ共通Sheet。
- 出立3候補＋地図同期、前回の隊、おすすめ編成。
- 鍛冶の人物先行、おすすめ3品、filter Sheet。
- VIS-FORGE-01を候補に、人物/候補/詳細の可読域を確認してから鍛冶へ統合。
- 図鑑detail Sheet、家系図の未来節点とfilter修正。

#### Exit gate

- 初見5人中4人が30秒以内に目的地と隊を決定。
- 指定人物の装備改善を5人中4人が誤購入なく完了。
- 一覧→詳細→戻るのfocus/scrollが全画面で一貫。

### Phase 3 — Dungeon / 戦闘 / 郷の署名体験（5〜8日）

#### 実装

- Dungeonの帰り火常設、可視map拡大、POI一覧。
- 戦闘の対象決定統一、兆し全文、行動順専用帯。
- 郷の操作帯分離と決断結果の反映。
- 決断結果を郷の会話・灯り・人物位置へ返す最小3パターン。
- VIS-BATTLE-01は戦場背景候補、VIS-DUNGEON-01とVIS-VILLAGE-01はレイヤー分解の基準像として採用する。5画像の一括preloadは禁止。

Phase 3Bはユーザー承認後に、オート副次化、初回歩行/訪問済み短縮、日次報酬の物語置換を一項目ずつ実験する。

#### Exit gate

- 360pxで「灯10%から3秒以内に帰還」「近接人物と会話」「敵の次行動を回答」を5回連続成功。
- 手動戦闘の継足理解と、オート停止の理解を初見4/5人が達成。
- 2地域を5秒見て、場所の違いを言語化できる。
- 主要画像を無効化しても操作不能にならず、有効時もLCP/payload budgetを超えない。具体値はPhase 0のproduction profileを基準に、LCP p75を悪化させない値へ固定する。

### Phase 4 — 検証と性能（2〜4日）

- 新規開始から初回継承、翌日再開までの旅程test。
- Home/出立/鍛冶/図鑑/設定の5幅visual contract。
- 主要スクリーンの人間採否ログ。
- main chunkをprofileし、効果が確認できる単位だけ追加分割。
- 最低40人のPMF対象が集まるまでは「PMF確認済み」と言わない。

### Narrative lane N0〜N4 — 千年の二重奏（UI Phase 0合格後）

- 詳細は`docs/NARRATIVE_VISUAL_INTEGRATION_PLAN.md`を正本とする。
- N0で夢渡りの順序抜け、既読/queue/完読/後回し、同一月の強制scene最大1件を先に修正する。
- N1で夢渡り弐〜終へ固有CG7点とfallback/lazy load/mobile cropを追加する。
- N2でHome、出立、探索、主戦、帰還、郷へ3〜20秒の残響を接続する。
- N3で一代の問い、固有名/形見/地域のFinale回収、三つの灯の響きを追加する。結末はlock/推薦しない。
- N4で物語を読む/読まない両旅程、A11y、scene時間、LCP、初見理解を検証する。
- N0の直接証拠が合格するまで、画像だけを`public/img/`へ投入しない。

### Phase 5 — 独自ドメイン（将来任意・UIとは別リリース）

- 現在は`hitsugi-game.github.io/hitsugi/`を正典とし、実行しない。独自ドメイン採用をユーザーが別途決めた場合だけ、§9のセーブ救出、DNS、GitHub Pages、OGP、HTTPS、旧URL検証を順番どおり実施する。

## 9. URL変更の判断と手順

### 9.1 選択肢

Organization移管は2026-07-20に完了済みである。現在と将来案を混ぜず、次のように扱う。

| 案 | 表示URL | セーブ | 現在の判定 |
|---|---|---|---|
| **Organization URLを維持** | `https://hitsugi-game.github.io/hitsugi/` | 現originを維持 | **採用中。UI改善の正典** |
| 独自ドメイン | `https://<game-domain>/` | origin変更、公開後は救出必須 | 将来任意。別案件で判断 |
| GitHub username変更 | `https://<new-user>.github.io/hitsugi/` | origin変更 | 社内toolへ波及するため非推奨 |
| repository名変更 | owner部分は変わらない | path変更の可能性 | 目的不一致 |

移管前URL`https://umine2025.github.io/hitsugi/`は歴史記録であり、現行導線として表示しない。公開案内前・外部利用者0人の時点で移管し、新PagesのHTTP 200と旧Pagesの404を確認済みのため、今回に限って旧origin救出を省略した。

- [事実] project Pagesの既定URLは`<owner>.github.io/<repositoryname>`。[GitHub Pages概要](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [事実] repo rename時、repository URLは通常redirectされるが、project Pages URLは例外。GitHubもPages利用repoではcustom domainを推奨する。[Renaming a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository)
- [事実] username変更は旧profile URLが404になるなど、Pages以外にも影響する。[GitHub username changes](https://docs.github.com/en/account-and-profile/concepts/username-changes)

### 9.2 推奨構成

- owner: Organization `hitsugi-game`。
- repository: `hitsugi`を維持。
- canonical URL: `https://hitsugi-game.github.io/hitsugi/`。
- remote: `https://github.com/hitsugi-game/hitsugi.git`。
- 直近作業はhard-coded URLとOGP/README/DEPLOY/MARKETING/STATUSの正典化、次回公開後のasset/route/Actions確認であり、DNS作業ではない。
- **将来のPhase 5入口gate**: 独自ドメインを採用する場合だけ、canonical hostnameを`www`、`play`等のsubdomain、またはapexから一つ確定する。未確定のままDNS手順へ入らない。
- 将来subdomainを使う場合のCNAME参照先は、その時点のGitHub Pages owner hostで、`/hitsugi`を付けない。値は切替直前にGitHub公式手順で再確認する。
- [事実] 現行はcustom GitHub Actions workflow。リポジトリへ`CNAME`を置くだけでは設定手段にならず、Pages Settings/API側の設定が必要。[GitHub custom domain troubleshooting](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages)
- [事実] `vite.config.ts`は`base:'./'`で、配信先pathへの依存は比較的小さい。

### 9.3 次回origin変更時はセーブ救出を先に公開する

以下は今回のOrganization移管へ後付け実装する項目ではない。**外部利用者が発生した後にoriginを再変更する場合のtemplate**である。現行にはすでにタイトルの「セーブを書き出す」「セーブを読み込む」があるため、これを移行の中核に使う。

1. `hitsugi_save_v4`、`hitsugi_save_v4_bak`、`hitsugi_save_v3`、`hitsugi_save_v1`の全保存梯子を解決するpure resolverを作る。
2. 正常main、破損main+正常backup、backupの`saveSeq`が新しい、v3のみ、v1のみのfixtureを現行v4へ正規化して書き出すE2Eを追加する。
3. 設定も移す場合は、`hitsugi_reduce_motion`、`hitsugi_auto_default`、`hitsugi_audio`、`hitsugi_audio_vol`、`hitsugi_last_region_v1`をversion付きexport packageへ含める。未対応なら「設定は引き継がれない」と明示する。
4. 旧URLで書き出し→読み込みを実走し、正規化後の意味的不変条件を検査する。
5. 切替前の旧originタイトルにURL移行予告と「今すぐ控えを作る」を表示。
6. ユーザー承認を得て、旧originのowner host上に期限を切らない救出用project repository/pageを別pathで公開する。
7. 救出pageは全保存梯子を検証・正規化し、version付きJSON downloadだけを行う。ゲーム進行や自動転送はしない。
8. 新originのタイトルには、移行期間中「続きから」が無い時に常設する**「旧URLで遊んでいた方へ」救出card**を用意する。固定救出URLは切替時に確定し、3手順（救出pageを開く→JSONをdownload→この画面で読み込む）、データが消えたのではなくoriginが変わった説明を表示する。
9. 新URLでJSON importし、§9.3.1の不変条件を検査。
10. custom domain設定後にも別ブラウザで旧origin救出pageが旧localStorageを読めることを確認する。
11. `旧ゲームURL→新canonical→救出card→固定救出page→download→新canonicalへ戻る→import→続きから`を、空の新originと全保存梯子fixtureでE2E化する。旧ゲームURLがredirectされても救出pageへ到達できなければ不合格。
12. この救出経路が公開されてからcustom domainを切り替える。

HTTP redirectや`postMessage`だけで旧localStorageが自動移動すると仮定しない。

救出repository/pageのownerはユーザー、実装はClaude/Fable 5、検収はCodexまたは独立担当とする。固定URL、監視方法、旧owner hostを維持する期間を`docs/DEPLOY.md`へ記録する。救出保証期間中は旧owner host自体のoriginを変えるuser-site custom domain設定を行わない。

#### 9.3.1 import前後の意味的不変条件

必須一致:

- 暦、全Character（親子、寿命、能力、HP/MP、装備、灯型、家業、故人情報）。
- 奉燈、血珠、武功、inventory、consumables。
- 神縁、pending births、chronicle、flags、motto、seed、narrative mode。
- 討伐/地域進度、visited/cleared、lore fragments、codex、個別既読。
- nemeses、rare/地域由来記録、facilities、familiars、active familiar、gossip progress、NG+関連flag。
- export package対象にした音量、mute、演出軽減、auto既定、前回地域。

許容差分:

- `saveSeq`はimport時の`saveGame()`で単調増加してよい。
- `lastPlayedAt`はimport時刻へ更新してよい。
- v1の季→月換算、v3の`jobClass`補完、旧codex既読のID移行は現行migration関数の期待値と一致すればよい。
- 進行中`expedition`は現行migration仕様で畳まれる場合がある。その事実をexport前に表示し、fixtureで期待値を固定する。

保留中event/sceneがGameData外の一時stateなら移行対象外を明示し、安全なHome再開へ正規化する。raw JSONの完全一致ではなく、この表を機械比較する。

### 9.4 ドメイン切替runbook

1. 希望ドメインを取得。registrarに2FA、自動更新、失効通知を設定。
2. canonical hostnameとapex/subdomain方式を確定し、DNS値をreviewする。
3. GitHubアカウントでdomainをTXT verifyし、wildcard DNSを使わない。[Verifying a custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
4. **DNSを変える前に**Repository Settings → Pagesへcustom domainを追加する。
5. その後DNSを設定。subdomain CNAMEは切替時点のGitHub Pages owner hostへ向け、pathを含めない。
6. DNS check成功と証明書発行を待つ。公式はDNS反映に最大24時間を見込む。[Managing a custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
7. Enforce HTTPSを有効化。
8. `index.html`の`og:url`、`og:image`、Twitter image、faviconを新URL/相対pathへ更新。self-canonicalと新sitemapを追加。
9. README、DEPLOY、MARKETING、STATUS、公開案内を更新。
10. Search Consoleへ旧URL-prefix/new propertyを登録し、利用可能な場合はChange of Addressを送る。旧→新の永久redirectは最低1年間維持する。[Google Site Moves](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)
11. 新URL、asset、OGP、404、救出page、旧URLのHTTP status/Location/final pathを実測。
12. 旧セーブimport後の続きから→Home→出立→Dungeon→戦闘→帰還→reloadを実走。
13. 切替後24時間、証明書、404、import失敗、続きから欠落を監視する。

### 9.5 URL公開停止条件

- 救出pageが旧originのセーブfixtureをdownloadできない。
- 空の新originで救出cardが出ない、固定救出URLへ到達できない、またはimport後に「続きから」が出ない。
- 新originへimport後、主要stateが一致しない。
- 旧ゲームURL→canonicalが1hopの301/308にならない、redirect loop、余計な`/hitsugi/`、最終404のいずれかがある。
- HTTPS証明書未発行、Enforce HTTPS未有効。
- OGP、favicon、main JS/CSSのいずれかが404。
- UI刷新とURL変更が同一commit/同一公開に混在している。

切替後に障害が起きても、最初にDNS/custom domainを外して旧originへ戻してはならない。新originで作られたセーブが今度は見えなくなる。原則は同じ新originでコードを修復する。DNS rollbackは、新origin側の全保存梯子を救出でき、旧originへ戻した後のimportを実走した場合にだけユーザーが承認する。

## 10. クリティカルパスと資源

```text
P0 mobile/layout
  → 共通visual contract
  → Home visual + 今月の要
  → Home推薦単一化
  → 帰還差分・前回の灯
  → 実ユーザー基準値
  → 出立/鍛冶visual/図鑑の選択支援
  → Dungeon/戦闘/郷の固有文法と署名体験
  → 人間受入
  → 現Organization URLで安定公開

将来任意: 独自ドメイン承認 → セーブ救出先行 → custom domain公開
```

必要資源:

- 実装者1名+AI支援。
- 5人の初見usability test、可能なら復帰者5人。
- PMF方向判定は最低40回答、望ましくは100。集まるまでは仮説扱い。
- 将来独自ドメインを採用する場合だけ、年間費用と更新責任者。
- 同一セーブのbefore/after capture置き場と採否記録。

## 11. リスク台帳

| Risk | 兆候 | 予防 | 対応 |
|---|---|---|---|
| 追加装飾で情報過多 | 金枠/札だけ増え、5秒説明不可 | 主CTA1、最大3差分 | 情報を畳む |
| 推薦が自由を奪う | 非推奨行動率が10pt以上低下 | 理由を示し全4行動維持 | 強調を弱める |
| 即移動が郷歩行を殺す | 初回も全員即移動 | 初回発見後解禁を実験 | 条件を緩める |
| オートが戦闘を代行 | manual chain率低下 | 副操作へ移動 | 初期OFF/説明改善 |
| visual test過信 | 緑だが人が迷う | 5秒テスト+旅程test | gateを追加 |
| 生成背景がUIを飲む | 文字コントラスト低下/LCP悪化 | 静域mask、画面別lazy load、solid fallback | 画像を外しlayoutを先に合格 |
| 地図画像を床へ直貼り | collisionと見た目がずれる | navigation/境界/光/POI/前景へ分解 | 基準像へ戻しtile grammarを修正 |
| 計測が物語を収集 | name/本文がeventへ混入 | 匿名状態区分だけ | event停止/削除 |
| URLでセーブ消失 | 新URLに続きから無し | 救出page+JSON import | 切替停止 |
| Organization移管後の旧URL残存 | OGP/READMEから404へ誘導 | canonical scanをCI/公開前に実行 | 現URLへ正典化 |
| STATUSの陳腐化 | 未push表記とHEAD不一致 | Phase 0で同期 | WORKLOG/HEADを再確認 |
| 所有外差分混入 | `tmp/`がstage | path指定stage | commit停止 |

## 12. 仮説台帳とpivot条件

| 仮説 | 最安検証 | 継続条件 | Pivot |
|---|---|---|---|
| Home推薦一面化で迷い減 | 5人+時間計測 | 30%短縮、自由選択維持 | 推薦強度を下げる |
| 前回の灯で復帰改善 | 復帰session比較 | +15pt方向 | Home常設でなくTitle要約へ |
| 帰還差分で因果強化 | 60秒次行動率 | +10pt方向 | 強制面をやめ任意展開 |
| 初回歩行後の即移動解禁 | 5人の歩行/会話率 | 会話発見増、時間悪化小 | すぐ行くを常設し近況だけ表示 |
| 日次報酬が競合 | 受領のみ終了率 | 探索/契り率改善 | 報酬維持、物語だけ追加 |
| 将来独自ドメインがブランド向上 | direct/referralと想起調査 | 流入/想起改善 | Organization URLを維持 |

## 13. 最初の72時間

この72時間は**Phase 0だけ**を扱う。Phase 0が早く合格しても、Phase 1の実装は次の承認単位に分け、以下へ混在させない。

### 0〜24時間

- Home overflowを再現するPlaywright fixtureを先に追加。
- `.family-board/.family-main/.family-smalls/.blood-diag`のmin-width契約を修正。
- 戦闘上端、郷操作帯の衝突をfixtureで固定して修正。
- P0 smokeをdeploy CIのblocking jobへ追加。
- `docs/STATUS.md`を現行HEAD/公開状態に同期。

### 24〜48時間

- P0 3欠陥の同一fixture before/afterを`docs/qa/`へ保存し、矩形とoverflowの測定値を記録。
- PC/390/360の対象Playwrightをblocking jobとして`.github/workflows/deploy.yml`へ組み込む。
- 失敗時artifact、再実行方法、対象commitを`docs/qa/ui-acceptance-YYYYMMDD.md`へ記録。
- `tmp/`を除くpath指定stage一覧を作り、正本`STATUS.md`と実装状態を照合。

### 48〜72時間

- lint、全unit、build、P0 smokeをfreshな状態で再実行。
- 独立担当がHome overflow、戦闘上端、郷操作帯を実機相当で再測定し、人間採否を記録。
- Phase 0のexit gateを一項目ずつPASS/FAIL判定。FAILがあれば欠陥限定で修正し、Phase 1へ進まない。
- 全項目PASSの場合だけPhase 0完了を正典へ記録し、次の作業単位としてPhase 1の開始承認を得る。Phase 1のcode変更はこの72時間計画に含めない。

## 14. Claude / Fable 5への実装順指示

実装は一括で始めず、次の独立commit群に分ける。

1. `fix(home): モバイル横overflowを修正`
2. `fix(ui): 戦闘上端と郷操作帯のモバイル衝突を解消`
3. `ci(ui): P0 visual smokeを公開blocking gateへ追加`
4. `fix(shell): 画面scroll・家系図右上・通知・戦闘logを共通化`
5. `refactor(home): 今月の推薦を単一判定源へ統合`
6. `feat(home): 今月の要と帰還差分を追加`
7. `feat(resume): 前回の灯を追加`
8. `feat(depart): 地域3候補と前回編成を追加`
9. `feat(forge): 人物先行の推薦とmobile filter Sheetを追加`
10. `fix(codex): mobile詳細をSheetへ統一`
11. `feat(dungeon): 帰り火・可視map操作・POI一覧を再設計`
12. `feat(battle): 対象決定・兆し・行動順を統一`
13. `feat(village): 操作帯分離と決断結果の反映を追加`
14. `feat(visual): Home/戦闘/鍛冶の背景を画面別に統合`
15. `feat(world): Dungeon/郷を地域固有layerへ分解`
16. `docs(url): Organization URLを全正典へ同期`
17. `docs: STATUS/GDD_v3/WORKLOGへ判断と検証証拠を記録`

将来originを再変更するとユーザーが別途承認した場合だけ、`feat(save): 全保存梯子のURL救出導線とfixtureを追加`をUI刷新と別releaseで実施する。

オート階層、初回歩行条件、日次報酬は上記commit群に混ぜず、体験方針gate承認後の別commitにする。

各commitで`npm run lint`、対象test、`npm run build`を通す。公開前に全565+追加unit、5幅Playwright、同一セーブbefore/after、人間採否を実行する。pushは必ずユーザー確認後。

## 15. 独立監査の反映

### Round 1: UX / Growth / Devil

- UX判定: **要改善**。Mapping不一致、モバイル安全操作、推薦対象の不可視、詳細表示の不統一を指摘。
- Growth判定: **PMF未確認**。コアループは強いが計測0で、最有力bottleneckは復帰性と推定。
- Devil判定: **REWORK**。テスト数を魅力の根拠にしないこと、UIとURLを分離すること、セーブ救出を先行することを要求。

本稿は次を取り込んだ。

- Home overflowをPhase 0のP0へ追加。
- 人間の5秒理解、旅程test、同一セーブbefore/afterをexit gateへ追加。
- UI刷新とURL移行を別releaseに分離。
- username/repo renameを主経路から除外。
- 旧origin救出page、OGP/404/HTTPS/redirect実測をURL gateへ追加。

### Round 2: URL / scope再監査

- 判定: **REWORK**。
- 指摘: Pages登録とDNSの順序、verifyリンク、URL影響度、全保存梯子、意味的不変条件、救出repoの権限、永久redirect、canonical hostname、CI blocking、証拠参照、Phaseの広さ。
- 反映: §2、§7、§8、§9、§13、§14を修正。特にDNS前のPages登録、v1/v3/v4/backup正規化、新origin維持修復、Phase 3Bのユーザー判断gateを追加した。

### Round 3: 実行可能性の最終監査

- 判定: **REWORK（最終round）**。
- 指摘: 72時間とPhase gateの矛盾、worktree/ownership記載、gitignoreされた視覚証拠、切替後の救出主導線、計測開始条件の不足。
- 反映: 最初の72時間をPhase 0だけへ限定し、`deploy.yml`の所有を追加。before画像とhashを`docs/qa/`へ永続化し、新originの救出card/E2E、provider/privacy/opt-out/送信開始日と定性pivotを明文化した。追加roundは行わず、実装時は各exit gateの直接証拠で判定する。

### Round 4: UI v2 Forge独立評価

- 判定: **PASS（初回、blocking 0）**。
- 固定5軸: 初期フック4/5、世界固有性4/5、快適な判断4/5、報酬と物語の因果5/5、実装具体性4/5。全軸の合格線4/5以上を満たした。
- 客観gate: 主要5画面仕様、画像5点の実在/寸法/SHA-256、実リンク、人間task/DOM/性能の受入条件、現Organization URL、現行指示の矛盾0を確認。
- 非blocking注意: Home/Battleの日食と灯の二焦点は指定済みcrop/暗幕/独立panelを省かない。Villageの5施設識別はasset採用gate、3施設taskは旅程gateとして扱う。Battleの対象決定方式と`object-position`、第2地域の5軸値は各実装Phase開始時に固定する。
- Forgeは初回で合格したため、Round 2用の`docs/CODEX_FORGE_STATE.md`は作成していない。

### Round 5: M34 物語・画像統合Forge

- Round 1: **REWORK**。汐里名の開示順、内部`cut`の表示動詞と結果、縦長mobileでの横長CG cropをblocking 3件とした。
- Round 2: **REWORK**。`送る→看取る/夜明け`とmobile 16:9 `contain`は閉鎖。Intro、家業/技などch4前の実名露出とlegacy判定を継続。
- Round 3: **REWORK**。早期surfaceは網羅したが、ch4冒頭表示と完了条件、新旧v4を判別するsentinelを要求。
- Round 4: **PASS**。固定5軸は家族5/5、謎5/5、世代5/5、快適4/5、画像4/5。全客観条件PASS、blocking 0。
- 最終仕様: ch4最終頁/skipのtransactionだけで汐里名を開示。M34 new gameは`m34_narrative_schema=1`を持ち、sentinel欠落legacyだけ保守導出/recapを一度行う。`cut`は内部IDのまま表示`送る`。360/390/768pxの夢CGは前面16:9 `contain`全景。
- 証跡とblocking台帳は`docs/CODEX_FORGE_STATE.md`。terminalは`合格 — 2026-07-20T18:48:06+09:00`。

## 16. 完了定義

このマスタープランは、次を満たした時に実装完了へ移行できる。

- Phase 0〜3Aの各exit gateが直接証拠で合格。Phase 3Bはユーザーが採用した実験だけを対象にする。
- 定量経路なら計測開始gate後の7日コアループbaselineが取得される。計測非導入なら、同一taskの初見5〜8人による定性baseline/再検証が記録される。
- 5人の初見task testで主要3課題を4/5以上が成功。
- 現Organization URL、repository、OGP/文書のcanonicalが一致。将来originを再変更する場合だけ、セーブ救出を先に公開して新旧originの実走を合格させる。
- 正典`GDD_v3.md`、状態`STATUS.md`、履歴`WORKLOG.md`が実装と一致。
- push前にユーザーが公開を承認する。

この文書から実行へ移す際は、まずPhase 0だけをClaude / Fable 5へ渡し、合格後にPhase 1へ進む。全Phaseの同時実装は禁止する。

## 17. AI感解消・空間美術再建（2026-07-21追加）

### 17.1 この節の位置づけ

- [事実] ユーザーは、主要UIだけでなく「郷を歩く」とダンジョンマップにも、AI生成物を並べたようなチープさを感じている。
- [事実] 現行実装には既に背景、発光、粒子、地域データ、複数描画layerがある。問題を「素材不足」だけで説明することはできない。
- [推定] 本当に解く仕事は画像枚数を増やすことではなく、**一目でHITSUGIと分かる美術規則を定め、世界の意味・操作・絵作りを同じ方向へ揃えること**である。
- [推定] 先に全40地域や全施設を量産すると、現在の不整合も40倍になる。少数の完成見本で規則を証明してから広げる必要がある。
- [仮説] 同時に見える枠・金線・発光を40〜60%減らし、1画面につき主役となる「灯」または「場所」を1つへ絞る方が、背景画像を100点追加するより人手制作らしさの評価を上げる。

本節の主経路は次のとおり。

> **安全性を先に閉じる → Homeから帰還差分までの1本と対照Dungeon 2地域を完成品質へする → 初見評価を通す → 合格した部品だけ量産する。**

視覚刷新について本節と§5・§8・§13・§14・§16が競合する場合、本節のgateと順序を採用する。旧`VIS-GATE-03`の「5層以上」や旧Phase 0〜3Aだけでは視覚刷新を完了扱いにしない。ただし、横overflow、操作衝突、セーブ、公開承認などの安全gateを後回しにしてはならない。

### 17.2 診断: 「AIっぽい」の正体

#### 直接確認できた事実

- [事実] 2026-07-21時点のHEADは`7966fa25daf5b34e5cbb829c9510d3b1f3895b77`で、Vitest列挙は618件。M35星契りの未commit変更と生成素材があるため、AR0はこれを別所有として保持する。
- [事実] `src/village/engine.ts:456-550`では地面をタイル単位の矩形で塗り、1pxの目地を加えている。鍛冶、祠、豆腐屋、門、大燈籠も`rect`、`roundRect`、`poly`、`circle`を組み合わせた幾何図形である。
- [事実] `src/dungeon/render/ground.ts`、`props.ts`、`landmarks.ts`も主にPixiJSの矩形・円・楕円で構成されている。構造は軽量だが、画面の大半を占める世界そのものが仮素材の語彙に留まっている。
- [事実] Dungeonには`ground / water / decal / mid / glow`の描画意図が既にあり、40地域分の`region_visuals`も存在する。一方、`src/dungeon/render/theme.ts`の基礎familyは`forest / zaka / tani / miyama`の4種で、`region_theme.ts`はprops内蔵色を基礎themeの同一性として維持している。
- [事実] 郷にも地面、decal、水面、mid、煙、発光、粒子が既にある。Dungeon/郷とも「layerを追加すれば完成する」という前提は、現状そのものに反証されている。
- [事実] 共通`src/index.css`には`gradient` 50、`box-shadow` 39、`border-radius` 91の出現があり、Home/戦闘の追加CSSにも同じ装飾語彙が反復している。数自体が悪いのではなく、画面固有性より共通効果が支配していることが問題である。
- [事実] Homeと星契りは同じ郷背景を使い、鍛冶も共通`NightBackdrop`構造を使う。`docs/visuals/ui-v2`の5点は方向資料であり、現行runtimeの空間部品には分解・参照されていない。
- [事実] `public/img`は現時点で2,806ファイル、252,039,016 bytes（約240.4MiB）ある。これ以上の無選別な画像追加は、素材不足ではなく統一・採否・保守の問題を悪化させる。
- [事実] 2026-07-21に`tests/visual/baseline.spec.ts`をPC 1280pxとmobile 390pxで再実行し、6/6は完走した。しかしこれは不具合を報告するbaselineであり、魅力を保証する合格gateではない。
- [事実] 同実測の「暗い平坦領域」はPCでDungeon 6.7%、Battle 45.4%、Village 44.8%、mobileでDungeon 3.3%、Battle 17.5%、Village 17.9%だった。純黒率より大きいため、単なる黒画面ではなく、意味や奥行きのない暗部が残っている。
- [事実] 現在の視覚testは矩形衝突やoverflowの検出には有効だが、「その場所を覚えたか」「HITSUGIにしか見えないか」「次に進みたいか」を判定していない。

#### 8つのレンズによる原因分解

| レンズ | 現象 | 判定 | 改善の焦点 |
|---|---|---|---|
| 美術監督 | 紺の半透明panel、金線、橙glowがほぼ全画面で反復 | [事実] | 共通装飾を減らし、画面固有の主素材を前面へ |
| 空間 | 床・建物・人物が同じ平面上の記号に見える | [推定] | 前景遮蔽、接地影、material差、遠近、歩行の予告 |
| 意味 | 詳細な生成背景より、操作対象の施設や床が簡素 | [推定] | 物語的重要度と描画密度を一致させる |
| 地域性 | 40地域が4基礎familyの色替えに近づきやすい | [事実] | 色だけでなく輪郭・材質・空気・動き・目印を変える |
| UI | 多数の同型cardが絵を覆い、視線の主役が競合 | [推定] | 1主行動、段階表示、常設panel削減 |
| 生成素材 | 絵柄、視点、線幅、文字風模様、cropが揃わない危険 | [推定] | 生成前のstyle bibleと採用QC、runtime分解を必須化 |
| 制作工程 | 全件生成・全画面改修は誤りの量産になりやすい | [推定] | 縦切り→blind評価→kit量産の順序 |
| プレイ感 | 装飾は動くが、移動・選択・帰還の結果と連動しない | [推定] | 入力、環境反応、物語差分を同じ演出へ結ぶ |

#### 非自明な結論

1. **足りないのはlayer数ではなく、layerごとの役割差である。** 5層あっても全部が暗い矩形・粒・glowなら奥行きにはならない。
2. **AI感はAI画像単体ではなく、均一な扱いから生まれる。** 全画面で同じ紺、同じ金枠、同じ角丸、同じ密度、同じ生成画風を使うと、意味を考えずtemplateへ流し込んだ印象になる。
3. **高精細背景と簡素な操作対象の落差が、合成物らしさを強める。** 施設、道、扉、敵など触れる対象へ美術予算を寄せる必要がある。
4. **最も効く追加素材は全画面背景ではない。** 地面材質、建物facade、前景、landmark、接地影、状態差分を再利用できる小さなkitの方が、runtimeで一貫した空間を作れる。
5. **量産開始条件はtest greenではなく、美術規則の再現性である。** 第1地域だけ美しくても、第2地域で別物へ崩れるならsystemは未完成である。

### 17.3 外部事例から借りる原理

#### Darkest Dungeon: 明文化した創作核を「切る基準」にする

[GDCのDarkest Dungeon講演概要](https://gdcvault.com/play/1023424/A-Torch-in-the-Dark)は、外部化されたcreative coreがart、audio、designを同じthemeへ揃え、制作上の難しい削減判断にも使われたと説明している。

HITSUGIで借りる原理:

- 追加候補が「短命な家族」「継承される灯」「夜の代償」のいずれも強めないなら、綺麗でも採用しない。
- style bibleを色見本集ではなく、削除基準と画面別主役の規約にする。
- 予算制約を隠さず、墨、紙、影、灯という限定語彙へ変換する。

#### Ghost of Tsushima: 種類を絞り、色と動きを押し、noiseを減らす

[Sucker Punchの環境美術解説](https://blog.playstation.com/2020/07/09/crafting-the-world-of-tsushima/)では、biomeごとの植生種類を制限し、色を強め、texture noiseを減らすことで地域を記憶しやすくしたと説明している。またprocedural toolは量産の代わりではなく、artistic choiceを広げる手段として使われた。

HITSUGIで借りる原理:

- 1地域に主要材質2種、主色1、警戒色1、固有landmark1、固有motion1までを先に固定する。
- 無数の小propではなく、遠目でも分かる輪郭と空気の動きへ予算を寄せる。
- procedural配置は再利用に使い、地域identityの決定は人間が行う。

#### Ghost of Tsushima VFX: 手続き生成と少数の手置き誘導を分業させる

[VFX解説](https://blog.playstation.com/?p=345372)では、少人数teamが自動更新を使いつつ、探索誘導に必要な少数の要素は手置きしたこと、風や粒子をUIではなくnavigationにも使ったことが説明されている。

HITSUGIで借りる原理:

- floor variation、mote、weather、灯の呼吸はsystemで生成する。
- 分岐、施設入口、危険、帰路、稀少遭遇の予兆は手置きanchorで保証する。
- minimapの記号だけに頼らず、環境の灯・風・音・足跡が目的地を示す。

### 17.4 HITSUGI固有の創作核と禁止事項

#### 1文の創作核

> **闇に消えかける一族の記憶を、手渡された小さな灯で次代へ運ぶ。**

Onlyness:

> **短命な一族の「今月の一手」が、灯・郷・傷・形見・道として次代の画面に残り続ける、常夜の世代交代RPG。**

Brand truth:

> **灯は綺麗だから尊いのではない。尽きるから、誰に継ぐかが問われる。**

すべての画面は、次の3問のうち最低2つへ視覚で答える。

1. 誰の命・記憶を扱っているか。
2. 何が失われかけているか。
3. どの灯を次へ渡せるか。

#### 共通美術文法

- 暗藍: 未知、夜、読めない領域。全面を同じ濃度で塗らない。
- 墨黒: 境界、死、遮蔽。背景色ではなく輪郭と前景へ使う。
- 古金: 選択可能・継承可能。枠線一般には使わない。
- 灯橙: 現在の焦点・生。1画面の最重要箇所だけ。
- 朱: 危険・不可逆・血脈断絶。通常CTAに流用しない。
- 和紙、煤、濡土、古木、鉄、布をmaterialの基本語彙とする。ガラス風panelはoverlayや一時情報に限定する。

#### 画面固有の署名

| 画面 | 物理面 | 1つだけ残す署名 |
|---|---|---|
| Home | 一族の座 | **月初の一灯**。空席と危機人物だけに灯が反応する |
| 郷 | 暮らしの環状路 | **大燈籠の羅針盤**。煙、暖簾、水面、鳥居で施設を読む |
| Dungeon | 煤紙に焼き付く踏査記録 | **灯路**。歩いた道だけが金泥で現れ、未踏は未記入の余白になる |
| Battle | 同じ地面上の墨線舞台 | **継足の筆致**。攻撃者から標的へ一本の線と結果理由が残る |
| 鍛冶/蔵 | 炉、作業台、形見棚 | **一打、一代**。前所有者、傷、継承代数を比較理由にする |
| 星契り | 神名帳、御影台、奉納札 | **御影の儀**。親、神、まだ見ぬ子の変化を一つの祭儀にする |

#### 使用を止める表現

- 地面全域のcheckerboard目地。
- 全containerへの紺半透明、角丸、金線、外glowの一括付与。
- 地域差をtintとparticle量だけで済ませること。
- 密な説明文の背後へ横長生成絵を敷き、暗幕で読めなくすること。
- 施設、岩、祠、敵を汎用`rect / circle / roundRect`だけで完成扱いすること。
- 文字風模様、署名風線、透かし、意味不明な家紋を含む生成素材。
- 生成した1枚絵を、collision、state、crop、安全領域へ分解せずruntimeに貼ること。
- 同じ構図・顔・衣装・建築を名前だけ変えて再利用すること。
- 全要素を常時発光・常時揺動させること。静止との対比がないmotionは削る。

### 17.5 画面別の再設計

#### 郷を歩く: 「機能選択map」から「帰ってきた家」へ

目的は施設一覧を歩かせることではなく、月ごとに家族の痕跡が増減する故郷を身体で覚えさせることである。

- 地形は毎月random化せず固定する。中央の大燈籠、北の星契り、西の鍛冶、東の生活圏、南の出立門を輪郭だけで判別できるようにする。
- 主要5施設は共通primitiveを廃止し、正面・側面・屋根・入口灯・閉鎖状態の小型facade kitへ置換する。
- 歩行可能路は地面色ではなく、踏み固め、石の向き、轍、濡れ、足音で示す。タイル境界は原則見せない。
- 手前の軒、枝、暖簾を前景layerに置き、人物が一瞬隠れることで奥行きを作る。ただし入口と操作対象は隠さない。
- 施設名を常時label表示せず、近接時に「場所名 + 今月の出来事 + 主行動」を出す。
- NPCは頭上iconではなく、立ち止まる、振り向く、灯へ寄る等の挙動で存在を知らせる。
- `血脈危機`では戸が閉じる、灯が減る、会話人数が減る。誕生・帰還・死後は供物、洗濯物、位牌、足跡など小さな差分を残す。
- PCは見渡し、mobileは自動camera leadと画面下の独立操作帯を使う。D-padと「話す/入る」を同一領域へ重ねない。
- 5秒test: UIを隠した静止画でも、中央灯・鍛冶・祠・門のうち3つを初見8人中6人が識別する。

実装対象候補:

- `src/village/engine.ts`を、map/stateとrender責務へ分割する。
- 新規`src/village/render/ground.ts`、`facades.ts`、`foreground.ts`、`weather.ts`。
- 新規`src/core/data/village_visual_state.ts`で季節、危機、帰還、死亡、誕生の差分を宣言する。
- 配信kitは`public/img/village/facades/`、`ground/`、`foreground/`、`states/`に役割別配置する。

#### ダンジョン: 「暗いtile map」から「場所を読む遠征」へ

各地域を背景絵の差ではなく、歩き方、見通し、材質、危険予告が異なる場所にする。

- 40地域を最初から40枚作らない。8〜12のvisual familyへ再編し、地域ごとのmodifierで輪郭・材質・空気・動き・landmarkを変える。
- 1地域の視覚契約を「地面材質2 / 主色1 / 危険色1 / landmark1 / motion1 / sound cue1 / navigation cue1」で固定する。
- 地面は大判material patch + edge decal + 疎なdetailへ置換し、セルごとの矩形塗りと目地を不可視化する。
- 壁は単色暗部にせず、通れない理由が輪郭で分かるようにする。森なら根と幹、峠なら崖と石積み、谷なら水際と段差、深山なら岩壁と霧。
- 未踏、既踏、見えているが未到達を値域・輪郭・moteで分ける。色相だけに依存しない。
- 帰り火、稀少敵、boss、採取点はUI iconより先に環境予兆を出す。例: 火の粉の逆流、足跡、鳴き声、局所的な草の伏せ。
- 稀少敵は出現時だけ金glowにせず、遭遇前3〜8秒の「何かいる」演出と、戦闘後に場所へ残る痕跡まで設計する。
- 地域のstage情報を戦闘へ渡し、同じlandmark、地面材質、天候、危険予兆を戦闘背景にも再利用する。
- map generatorへ地域IDとroom archetypeを渡し、見た目だけでなく経路形状、見通し、分岐、危険配置も地域契約に従わせる。同じseedで地域IDだけを変え、navigation graphが変わることを自動検証する。
- 5秒test: UI、地名、色を隠した2地域を並べ、初見8人中6人が別地域と判断し、landmarkと経路形状によって違いを説明できる。

最初に作る対照2地域:

1. **螢火の窪地**: 湿土、浅水、伏した草、橙の火の粉、低い見通し、帰り火の揺らぎ。
2. **山蔭**: 乾いた岩、段差、裂けた注連縄、青白い風塵、長い見通し、落石の予告。

両者が色替えに見えた場合は、40地域へ拡大しない。

実装対象候補:

- `src/dungeon/render/ground.ts`: 大判patch、edge、material mask。
- `src/dungeon/render/props.ts`: primitive完成品からsprite/mesh kit配置へ。
- `src/dungeon/render/landmarks.ts`: silhouette、接地、state差分を持つanchorへ。
- `src/dungeon/render/theme.ts`: 4色familyからvisual contract familyへ。
- `src/dungeon/render/region_theme.ts`: props内蔵色固定を廃止し、材質・輪郭・motion contractを解決。
- `src/core/data/region_visuals.ts`: visual contractと稀少遭遇予兆をdata化。
- 配信kitは`public/img/dungeon/<family>/{ground,edge,props,landmark,foreground,effects}`へ役割別配置。

#### 戦闘: 「cardが浮く暗幕」から「遠征中の対峙」へ

- Dungeonからstage contractを引き継ぎ、戦闘開始時も場所が切り替わったように見せない。
- PCで45.4%あった平坦暗部は、単純に埋めず、前景影、床面、遠景landmark、行動線の4役へ割り当てる。
- 味方と敵を別々のboxに閉じず、同じ床面に立たせる。HP、状態、標的は人物の近傍へ寄せる。
- 手番、狙い、危険は金枠の増加ではなく、接地影、視線、武器の向き、地面の予告域で表す。操作は「標的選択→結果予告→実行」の1経路へ統一し、敵card tapと攻撃buttonの即時実行差をなくす。
- 稀少敵は色違いではなくsilhouette、登場motion、固有予兆、drop演出を持つ。
- mobileでは環境を上半分、選択中の人物・対象・commandを下半分へ整理し、logは展開式にする。
- 5秒test: 地名を隠しても「どの地域で」「誰が誰を狙い」「次に何が起こるか」を8人中6人が説明する。

#### Home / 星契り / 鍛冶 / 蔵

- Homeは背景絵を増やす前に、主役を「今月の一手」「当主」「危機」のどれか1つに固定する。残りは段階表示へ退避する。
- 星契りはM35の全身立ち絵表示を基準に、神ごとの顔・装束・象徴物・背景環境・通常/極み差をasset台帳で一意にする。文字風glyphを採用しない。契約不能な既知神も閲覧可能にし、無効化するのは実行buttonだけとする。初期候補は推奨3〜7柱、全神名帳は二次導線へ送る。
- 鍛冶は商品一覧を主画面にせず、選択人物の身体 + 装備slot + 推薦3件を主役にする。素材・比較・全在庫はdrawerへ送る。
- 蔵はrarityを色だけでなく、frame形状、材質名、取得地、固有物語、装備可能slotで区別する。
- これらのscreenでも共通紺panelを重ねず、星契りは祭壇、鍛冶は作業台、蔵は棚と包みという固有surfaceをUI構造へ使う。

### 17.6 画像・素材の制作契約

#### 生成前に固定するもの

- Style bible 1枚: perspective、line weight、texture粒度、黒の量、光源、許容palette、人物等身。
- Screen crop map: PC 16:9、tablet、390×844、360×800の安全領域とUI占有領域。
- Asset manifest: `assetId / screen / role / family / state / dimensions / alpha / crop / collision / source / sourceSha256 / runtimePath / runtimeSha256 / generator / modelLicenseChain / rightsStatus / promptVersion / reviewStatus / reviewer / rejectReason`。
- 1枚のconcept artをそのまま配信しない。ground、facade、foreground、landmark、effect、portraitなどruntime役割へ分解する。

#### 採用gate

- 擬似文字、署名、透かし、意味不明な家紋が0。
- 神・敵・建物のidentity driftが0。同じ人物の通常/極み、正面/差分が別人に見えない。
- 同一構図や顔の重複を目視 + perceptual hashで検出し、意図しない近似を0にする。
- 25%縮小でもsilhouetteと主役が読め、360×800の実runtime cropでも同じ判定を通る。
- perspective、光源、line weight、材質密度が同一family内で一致する。
- PC/mobileの安全cropで顔、入口、landmark、戦闘予告が隠れない。
- 生成元素材と加工後配信素材を分離し、`assets_src/`にsource、`public/`に採用品だけを置く。
- 出典、生成日、使用modelとlicense系譜、prompt version、加工内容、権利判定、hash、制作者とは別の採否者を台帳に残す。系譜を閉じられない素材は公開候補から隔離する。

#### 最初に必要なasset kit（量産前）

| Kit | 最小内容 | 目的 |
|---|---:|---|
| Village facade | 5施設 × 通常/閉鎖/危機、入口灯、屋根前景 | 施設を輪郭で識別 |
| Village ground | 土、石畳、濡れ、縁、足跡、轍 | checkerboard除去 |
| Dungeon A | 湿土、浅水、草edge、根、火の粉、螢火landmark | 螢火の窪地vertical slice |
| Dungeon B | 岩面、段差edge、縄、風塵、山蔭landmark | 色替えでない対照確認 |
| Shared battle | A/B各前景、床面、遠景、危険予告mask | Dungeon→Battleの場所継承 |
| Rare encounter | silhouette 2種、予兆3種、登場/撃破/drop差分 | 稀少性を遭遇前後に見せる |

この6kitがruntimeで合格するまでは、全神、全地域、全敵の一括生成を開始しない。

### 17.7 主経路・代替経路・比較

| 経路 | 内容 | 期間目安 | 初期費用 | 品質確度 | rollback | 推奨 |
|---|---|---:|---:|---:|---:|---:|
| A. 著者性のあるkit + procedural配置 | 小数の手作りanchorと材質kitをPixiで組み立て、状態と配置をdata駆動 | 3〜5週 | 中 | 高 | 高 | **主経路** |
| B. 高精細な全画面生成背景を大量追加 | 画面/地域ごとに完成絵を生成しUIを重ねる | 1〜3週 | 低〜中 | 低 | 中 | 不採用 |
| C. 3D/完全別engineへ移行 | Tilemap/3D環境を全面再構築 | 2〜4か月以上 | 高 | 中 | 低 | 現時点で不採用 |

Aを選ぶ理由:

- 現行PixiJS、data、collision、saveを保持できる。
- authored identityとprocedural scaleの両方を取れる。
- 1地域ごとにrollback可能で、失敗を全画面へ広げない。

Bは短期的に豪華に見えるが、操作対象との不一致、crop、状態差分、絵柄漂流を増やす。Cは将来の選択肢だが、現在の問題はengine能力より美術規則にあるため過剰である。

### 17.8 段階ロードマップ

期間は原則person-dayであり、並行人数を未確定のままcalendar日へ変換しない。AR4は固定日数ではなく、AR3Bで測定したthroughputから再見積りする。

#### 共用worktreeのM35→AR0統合gate

- 現在の`src/ui/Pact.tsx`、`src/core/data/gods_low.ts`、`public/img/god_kaboshi_v2*.jpg`、`src/ui/pact_m35.css`、`tests/visual/pact.spec.ts`はM35 ownerの専有範囲とする。AR0 ownerはM35 gateが閉じるまで`Pact.tsx`を編集しない。他のAR0対象は並行可能。
- M35 ownerは、tracked差分patch、untracked一覧とSHA-256、`git status --short`、対象test結果を`docs/qa/worktree-m35-handoff-YYYYMMDD.md`へ固定する。`git stash`を共有受渡しに使わない。
- 推奨統合順は`M35検証 → path指定stage → local commit（push禁止）→ そのcommitをAR0 baseとして記録 → AR0のPact変更`とする。commitしない場合は、M35専用worktreeとpatch/hashを用意し、AR0側へ適用したbase hashを記録する。
- AR0のPact差分はM35 baseからの差分として検収し、semantic control、keyboard、閲覧可否以外のhunkを0にする。M35画像、全身crop、奉納札、asset mappingの回帰0を同一fixtureで確認する。
- M35とAR0を別commit/rollback単位にし、AR0だけを戻してもM35が残ることを`git diff`で確認する。M35 handoffが未完ならPact関連ExitをPASSにできず、AR1へ進まない。

#### AR0: 安全閉鎖と視覚契約（2〜4 person-day）

Entry:

- 現在のdirty worktreeを所有者別に記録し、M35星契り作業を混ぜない。
- 既存Phase 0のoverflow、Battle上端、郷操作帯、Dungeon帰還導線のblocking状況を確認する。
- Home/Pactのclickable `div`、Battleの標的即時実行、Pactの閲覧/契約可否混同をP0操作負債として台帳化する。

作業:

- PC/mobileのHome、Village、Dungeon、Battle、Pactの同一save screenshotを永続化。
- 創作核、禁止事項、screen別主役、style bible、asset manifest schemaを確定。
- blind 5秒test用の質問票と採点表を作る。

Exit:

- 視覚contractに未決定項目0。
- Home横overflow、Battle上端競合、郷操作帯競合のP0三欠陥が0。
- 360/390/768/1280/1440pxでページ横overflow 0、blocking Playwrightが全成功。
- Dungeonの帰還は全幅で常時1操作以内、地図入口は可視control 1個、Canvas外の目的/POI/帰還説明をDOMでも取得でき、blocking testが成功。
- Home/Pactの選択可能要素はkeyboard到達・Enter/Space実行・focus可視・戻りfocus復元を満たす。
- Battleの攻撃は「標的選択→結果予告→実行」の1経路だけになり、敵card tapで即時実行しない。
- Pactは契約不能な既知神も閲覧でき、契約実行だけが理由付きで無効になる。
- 現行画面の基準画像、viewport、commit、save fixture、hashが揃う。

#### AR1: コアループvertical slice（5〜8日）

Entry: AR0 PASS。

作業:

- 対象を`Home → 郷の鍛冶1施設 → 螢火の窪地1区画 → 1戦 → 帰還後の郷/Home差分`だけに限定する。
- 郷はcheckerboardを除去し、大燈籠と鍛冶のfacade、地面、前景、通常/血脈危機の2状態を導入する。他3施設はsilhouette仮置きに留める。
- Dungeonは螢火の窪地1区画だけを、新ground/edge/landmark/foregroundで置換する。
- Battleへ同じ地面、遠景、天候を引き継ぎ、帰還後に鍛冶または大燈籠へ結果の痕跡を1つ残す。
- `regionVisualV2` feature flagでvisual rendererへ即時復帰できるようにする。AR1ではnavigation graphを変更しない。
- PC/mobileでcamera、移動、近接prompt、操作帯、戦闘、帰還差分を再検証する。

Exit:

- blind A/B 8人中6人以上が新版を選び、「AIっぽい・汎用・寄せ集め」と自発的に指摘した参加者数が1人以下。8人を確保できない場合は探索結果とし、合否には使わない。
- UIなしで大燈籠と鍛冶を8人中6人以上が識別。
- Homeから帰還差分までのtask成功6/8、誤操作0、mobile操作重なり0。
- 6/8が「誰の選択が、探索で何を起こし、帰還後に何が残ったか」を無誘導で説明する。
- 目地由来のcheckerboardが目視0。
- 合意した低性能mobileで10分後平均30fps以上、1% low 24fps以上、100ms超jankが毎分1回以下。PCは平均55fps以上。既存の`fps > 1`検査だけを合格根拠にしない。

#### AR2: 空間system証明（5〜8日）

Entry: AR1 PASS、visual contract変更を1版固定。

作業:

- AR1で仮置きした郷の祠、豆腐屋、門をfacade化し、5施設を完成する。
- 螢火の窪地の残り区画と山蔭を、新ground/edge/props/landmark/foreground/effect kitで実装。
- region stage contractをBattleへ引き継ぎ、第2地域へ1人日以内で移植できるか計測する。
- 各地域に稀少遭遇予兆1、rare enemy1、固有drop1を通しで実装。
- 現行の`DungeonRun`は`GameData`/`saveGame`対象外で、`continueGame()`は`dungeonRun: null`へ戻す。このForgeでは途中遠征の永続化を新設せず、既存の「reload時は安全なHomeへ戻る」契約を維持する。
- 経路graphを地域化する場合は、一時stateの`DungeonRun.mapVersion: 'v1' | 'v2'`を出立時に固定する。Dungeon→Battle→Dungeonの同一session中は`run.mapVersion`でgenerator/rendererを解決し、flag値を途中で読み直さない。
- `regionVisualV2`をOFFにすると新規出立だけv1へ戻り、既に進行中のv2 runは帰還/敗北までv2を維持する。page reload後は現仕様どおりHomeへ戻り、v2座標や未確定lootを`GameData`へ混入させない。
- 途中遠征の永続再開が将来必要になった場合だけ、`GameData` schema version、migration、期限切れasset、v1/v2 map同梱期間を別計画で設計する。AR2へ便乗実装しない。

Exit:

- 地名、文字、色を隠したblind testで別地域判定6/8、landmarkと経路形状による説明6/8。
- Dungeon→Battle→drop→帰還で地域identityが途切れない。
- 戦闘の地域・対象・次の危険の5秒理解が6/8。
- mobile 30分巡回で操作不能、読めない予告、重大jankが0。
- 第2地域への文法移植が1人日以内。超過した場合、40地域固有化を止め、4つのmacro biome kit + 各1つのhero地域へ縮小する。
- AR1と同一端末/同一手順で、mobile平均30fps以上、1% low 24fps以上、100ms超jank毎分1回以下、PC平均55fps以上。texture memoryと初期化p95はAR0 baseline比+20%以内。
- v1/v2新規出立、Dungeon→Battle→Dungeon、active v2中のflag OFF、v1/v2帰還/敗北、reload→Homeのfixtureが全PASS。`GameData`へ`DungeonRun`、座標、使用済みPOI、未確定lootが保存されない。

#### AR3: 表面UIの固有化（3〜5日）

Entry: AR2 PASS。空間側のpaletteとmaterialが正典化済み。

作業:

- Home、星契り、鍛冶、蔵の常設panelを40〜60%削減。
- 各screen固有surface（家譜/祭壇/作業台/棚）へ情報構造を移す。
- 星契りasset台帳、装備rarity/slotの視覚規則を適用。

Exit:

- 5秒で現在地、主役、主行動、戻り方を6/8人が説明。
- 1画面の主glow 1、主CTA 1、常設情報group 3以下。
- 360/390/768/1280/1440pxで横overflow 0、主要操作44px以上。
- AR1と同一端末/同一手順の性能gateをPASSし、Home/Pact/鍛冶/蔵のscreen-ready p95、JS/CSS payload、peak memoryは各AR0 baseline比+20%以内。

#### AR3B: 量産throughput pilot（最大3 person-day）

Entry: AR1〜AR3のblind testとperformance gateがすべてPASS。

作業:

- 第3visual familyを新規作成し、そのfamily内の3地域、rare enemy 1、boss landmark 1、Battle stage、manifest/QCまで通す。
- 制作、加工、runtime統合、修正、QCの実person-hourを役割別に記録する。

Exit:

- 3 person-day以内に3地域 + rare + boss + Battle継承を完了し、AR2と同じ識別/性能/QC gateをPASS。
- 超過時は8〜12family案を撤回し、4 macro biome kit + 各1 hero地域へ縮小して再pilotする。
- 実throughputから`残family数 × family中央値 + 残地域modifier × 地域中央値 + 統合/全体QA + 25% contingency`でAR4のperson-dayを再見積りする。

#### AR4: 制御された量産（AR3B実測式で算出）

Entry: AR3B PASS、残作業のperson-dayと担当者が確定。

作業:

- 8〜12visual familyへ40地域を割り当てる。
- kitをbatch生成・加工し、manifestとQCを機械検証。
- rare encounterとboss landmarkをfamily単位で追加。

Exit:

- 全地域がvisual contractを満たし、色替えだけの組が0。
- 未登録asset、重複asset、擬似文字、壊れた参照、crop違反が0。
- 全unit、lint、build、5幅visual、旅程test PASS。
- AR1と同一端末/同一手順で、mobile平均30fps以上、1% low 24fps以上、100ms超jank毎分1回以下、PC平均55fps以上。texture memoryと初期化p95はAR0 baseline比+20%以内。

#### AR5: 人間評価・最終収束（2〜4日）

Entry: AR4 PASS、公開候補build固定。

作業:

- 新規8人で15〜20分の遠征taskと、現行/新案のblind比較を実施。
- 「AIっぽい/手作り感」の二択だけでなく、そう感じた箇所を自由回答で採取し、原因codeを付ける。
- blocking原因だけ修正し、装飾の追加要望を無制限に取り込まない。

Exit:

- blind比較8人中6人以上が新案を選ぶ。小標本のため、この比率を母集団推定とは扱わず、自由回答と実taskを併記する。
- 「同じtemplate」「意味のない暗さ」「施設が記号」「地域が色違い」の回答が各1件以下。
- コアループ完遂6/8以上、操作不能0、重大視認問題0。
- 公開候補buildでAR4と同じ性能gateを再実行し、全数値PASS。曖昧な「許容範囲内」で代替しない。
- shipcheck後、ユーザーがpushを明示承認する。承認前は公開しない。

### 17.9 クリティカルパスと資源

```text
P0安全性
  → 創作核/style bible
    → 郷facade + ground kit
      → Dungeon A/B material kit
        → region stage contract
          → Battle継承
            → blind test
              → 第3family throughput pilot
                → 実測person-day再見積り
                  → 量産manifest/QC
                    → 40地域・rare・bossへ展開
```

最小役割:

- Art direction owner: 創作核、style bible、採否を単独で最終決定する。
- Environment asset owner: facade、terrain、foreground、landmarkを制作・加工する。
- Runtime owner: Pixi layer、atlas、collision、state、performanceを担当する。
- UX/QA owner: mobile操作、5秒test、旅程、visual baselineを独立判定する。

同一人物が兼務してもよいが、asset制作者本人だけで採否を決めない。

### 17.10 リスク・前提・rollback

| リスク/前提 | 早期兆候 | 対策 | pivot/撤退基準 |
|---|---|---|---|
| 画像を増やせば改善するという前提 | asset数は増えるがblind評価が不変 | AR1/AR2を量産前gateにする | 2回の修正で新案選好6/8未満ならstyle bibleを再作成 |
| 生成絵のidentity drift | 同一神/建築が別物に見える | seedだけでなく形状sheetと採用台帳を固定 | 同familyで2点以上driftなら該当batch全棄却 |
| Pixi負荷増大 | mobileでframe drop、memory増 | atlas、pool、layer統合、低motion mode | 30/24/55fpsまたはmemory/init +20%のどれか未達ならeffectを削り、再gateする |
| 暗さを雰囲気と誤認 | 情報のない暗部が残る | 暗部にも遮蔽/距離/危険の役割を付与 | 5秒testで場所認識5/8以下ならvalue設計を変更 |
| 40地域へ早すぎる展開 | A/Bが色替えに見える | AR2 exitまで量産禁止 | A/B差説明6/8未満ならfamily設計へ戻る |
| 郷歩行へ過剰投資 | 初回後は常設「すぐ行く」だけ使われる | 現行の歩行/即移動/会話利用をAR0で計測 | 即移動70%以上かつ歩行接触25%未満なら、絵画hub + hotspotへ縮退 |
| UI削減で情報不足 | 判断に必要な値へ到達できない | progressive disclosureと直前比較 | task時間が現行比20%以上悪化なら情報groupを1段戻す |
| 既存save/collision破損 | 建物へ入れない、地形にはまる | visual層とlogic座標を分離 | migrationなしで復旧できなければ該当slice rollback |

主経路Aが失敗した場合の代替は、全面生成背景Bではない。まず「facade/terrain kitの密度を下げ、墨絵silhouette + 灯 + material 3種」まで表現を絞る。絞った版でも場所識別6/8を満たせない場合のみ、専門environment artistへの外注またはvisual engine再選定を別案件として判断する。

### 17.11 最初の72時間

#### 0〜24時間

- 現行5画面のPC/mobile screenshot、save fixture、viewport、commit/hashを固定。
- 郷、Dungeon、Battleの5秒testを初見3人で探索的に実施し、装飾ではなく認識失敗を記録。
- 郷の歩行、即移動、会話、landmark接触の利用率を現行版で取得する。計測不能なら5人の観察taskで代替する。
- 固定PCと合意した低性能mobileでDungeon/Villageの初期、10分後frame time、1% low、100ms超jank、texture memoryを取得する。
- `docs/qa/worktree-m35-handoff-YYYYMMDD.md`へtracked patch、untracked hash、status、test、baseを固定する。M35 gate前はAR0 ownerが`Pact.tsx`を編集しない。
- Home横overflow、Battle上端、郷操作帯、Dungeon帰還、keyboard、標的確認、神閲覧のbefore再現testを先に赤くする。

#### 24〜48時間

- Home横overflow、Battle上端競合、郷の移動/行動帯競合を欠陥ID単位で修正する。
- Dungeonの帰還を全幅で常時1操作以内にし、地図入口を可視control 1個へ統一する。Canvas外にも目的/POI/帰還説明を置く。
- Home/Pactの選択可能`div`をsemantic controlへ変更し、keyboard、focus可視、戻りfocusを閉じる。
- Battleを「標的選択→結果予告→実行」の1経路へ統一し、敵card tapの即時攻撃を廃止する。
- Pactは既知神の閲覧と契約可否を分離し、実行buttonだけを理由付きで無効化する。

#### 48〜72時間

- 360/390/768/1280/1440pxのblocking Playwright、keyboard旅程、対象unit、lint、buildを実行する。
- 同一fixtureのafter screenshot、矩形/overflow、focus順、標的確認、閲覧可否の直接証拠を`docs/qa/`へ保存する。
- `HITSUGI_VISUAL_BIBLE.md`の1ページ版、AR1 asset manifest、質問票、file ownership、rollback単位を確定する。
- 独立評価者がAR0をPASS/REWORK判定する。AR0全ExitがPASSしても、この72時間内はAR1 runtime実装へ入らず、次作業単位として承認待ちにする。

### 17.12 Claude / Fable 5へ渡す実装指示

最初に渡すのは全計画ではなく、次のAR0契約だけとする。

```text
目的: AI感改善の前提となる操作安全性を閉じ、HITSUGI固有の視覚contractを実装前に固定する。
対象: AR0のみ。列挙したUI安全性と操作一意化は変更する。save schema、Dungeon map生成、配信asset、公開URLは変更しない。
必読: docs/GDD_v3.md、docs/CODEX_MASTERPLAN_DRAFT.md §17、docs/qa/ui-audit-baseline-20260720.md。
保持: M35 owner専有pathを確認し、handoff文書とM35 local commitまたは専用worktree baseが揃うまでPact.tsxを編集しない。AR0差分はM35 baseから作り、別commit/rollback単位にする。
成果物:
1. M35のtracked patch、untracked hash、status、test、baseを持つworktree handoff。
2. 現行5画面の再現可能なvisual/performance baseline。
3. Home横overflow、Battle上端、郷操作帯の実欠陥0。
4. Dungeon帰還1操作、地図入口1個、Canvas外の目的/POI/帰還説明。
5. Home/Pactのsemantic control、keyboard、focus可視、戻りfocus。
6. Battleの「標的選択→結果予告→実行」1経路化。
7. Pactの既知神閲覧と契約可否の分離。
8. 1ページstyle bible。
9. asset manifest（郷5施設まで実ID入り）。
10. 初見5秒test質問票と採点表。
11. AR1のfile ownership、対象test、rollback単位。
禁止: 全地域一括生成、全画面背景の貼り付け、push/deploy。
検証: 対象unit、npm run lint、npm run build、360/390/768/1280/1440px blocking Playwright、keyboard旅程、同一fixture before/after、viewport、hash、未決定0をすべて直接証拠とする。
完了条件: §17 AR0 Exitを1項目ずつPASS/FAILで記録する。M35 handoffまたは他の失敗が1件でもあればAR1へ進まない。path指定stageだけを使い、pushしない。
```

AR0合格後も、AR1〜AR3B〜AR5を一括依頼しない。各Phaseを独立commit候補として、exit gateの証拠を人間が確認してから次へ進む。

### 17.13 独立最終監査

- Round 1: **REWORK**。既存5〜7層を再び成果と数える危険、生成/採否の利益相反、性能`fps > 1`、40地域工数、郷の即移動による投資無効化を指摘。縦切り一本、blind 8人、30/24/55fps、歩行pivot、asset権利台帳へ修正。
- Round 2: **REWORK**。旧5層gateの残存、AR0の「計測だけで合格」、経路変更時の進行中save、後半Phaseの性能gate欠落、量産速度未証明を指摘。§17の置換範囲、P0欠陥0、`mapVersion`、各Phase性能、AR3B throughput pilotへ修正。
- Round 3: **REWORK**。追加P0の閉鎖漏れ、AR3性能条件の欠落、否定回答の曖昧な表現を指摘。Dungeon/Home/Pact/Battleの実欠陥0、screen-ready/payload/memory、機械判定可能な回答数へ修正。
- Round 4: **ACCEPT**。blocking 0。旧gate置換、AR0全P0、save rollback、各Phase性能、量産throughput、blind判定の閉鎖を確認。
- Forge Round 1: **OBJECTIVE FAIL**。Claude向けAR0成果物が本文の7操作修正を覆わない、`lint/buildではなく`の逆方向表現、AR0前にAR1試作へ入る72時間計画をblocking 3件として修正。
- Forge Round 2: **REWORK（5/5/3/4/5）**。dirty M35とAR0が`Pact.tsx`を共有する統合境界、存在しない「進行中Dungeon save」を前提にしたversion契約をblocking 2件として修正。
- Forge Round 3: **PASS（5/5/5/5/5、blocking 0）**。M35専有path/patch/hash/base/stage/rollback/停止条件と、非永続`DungeonRun`のsession version/flag OFF/reload/fixtureを新規独立評価者がID単位でCLOSED判定。

### 17.14 完了定義

「素材を追加した」「テストが通った」「layerが増えた」は完了条件ではない。次をすべて満たして完了とする。

- 郷をUIなしで故郷として認識でき、主要施設3/5を初見8人中6人が識別する。
- 螢火の窪地と山蔭を、色以外の理由で初見8人中6人が区別する。
- DungeonからBattleへ場所のidentityが継続し、次の危険と対象を8人中6人が5秒以内に説明する。
- Home、星契り、鍛冶、蔵はそれぞれ固有surfaceを持ち、共通templateの着せ替えに見えない。
- 意図しない重複画像、identity drift、擬似文字、crop違反、壊れた参照が0。
- mobileの操作衝突、横overflow、画面外へ見切れる主要情報が0。
- 低性能mobile平均30fps以上、1% low 24fps以上、100ms超jank毎分1回以下、PC平均55fps以上、texture memory/初期化p95がAR0比+20%以内で、全unit、lint、build、visual、旅程testがPASS。
- blind比較8人中6人以上が新案を選び、主要な「AIっぽい」原因codeが各1件以下。
- 正典と実装証拠を更新し、ユーザーの明示承認後にだけpushする。

## 18. 全景品質・全ゲーム視覚完成計画（2026-07-21 AR1実画面フィードバック反映）

> Forge Round 2 PASS（2026-07-21）: 全22 routeのprimary phase、required state、成果物、Exit、工数を閉じ、base 53〜94＋P0差替え予備0〜12（合計53〜106 person-day）へ再積算した。独立閉鎖評価A/B/C/D/E=5/5/5/5/5、blocking 0。証拠は`docs/CODEX_FORGE_STATE_FULL_GAME_VISUAL_PLAN.md`。

### 18.0 エグゼクティブサマリー

[事実] AR1の鍛冶場facadeは単品として質が高い。一方、同じ郷の画角では祠、豆腐屋、出立門が`Graphics`仮置き、地面がpoly/stroke中心、人物が小さなportrait札とbadgeで示される。完成素材が周囲の仮素材を目立たせ、全景は「高精細画像を簡易マップへ貼った」ように見える。

[事実] 現在の`public/img`は2,814ファイル、約240.75MiBで、神362、敵540、装備810を含む。画像総数は不足していない。AR1空間再建は配信PNG/WebP 8ファイル、実際に読むWebP 4点129,602 bytesで、郷5施設中2施設、Dungeon 40地域中1地域の0層だけを覆う。

[推定] 本当の課題は画像枚数ではなく、**同一画角の最低品質が揃っていないこと**と、**各画面が異なる場所ではなく同じ紺panelの別タブに見えること**である。

主経路は次の一文に改める。

> **高密度な主役を画面の15〜30%に1点だけ置き、周囲は同じ投影・材質・光を持つ抑制した接続層で閉じる。まず一画面に同時に見える地面・建物・人物・小物・UIを同じ世界へ着地させ、その完成画角を郷、蛍火Dungeon/Battle、Home/星契り/鍛冶/蔵へ順に移植し、最後に4 macro biomeへ展開する。**

このため、既存AR2の前に`AR1R`を置く。AR1Rを通過するまで第2地域、40地域、一括画像生成へ進まない。既存`regionVisualV2`は既定OFFを維持する。

### 18.1 テーマ解剖

#### 表明されたテーマ

- [事実] 郷の鍛冶場だけは素材がしっかりして良い。
- [事実] その他の郷と、郷以外の画面はチープなままなので、ゲーム全体を改善したい。

#### 本当に解く仕事

- [推定] 「良い画像を増やす」ことではなく、どこへ移動しても同じ作者・同じ世界・同じ制作水準に見える体験を作る。
- [推定] 操作安全はAR0で改善したため、次は安全なブラウザUIを維持したまま、情報を家、祭壇、作業台、棚、地面、人物へ戻す。
- [仮説] プレイヤーがチープさを感じる主要因は、素材自体の生成感より、完成度差、遠近差、接地不足、浮遊札、同型panel、状態差のtint依存である。
  - 最安検証: 同じ郷を「全要素高密度化」と「鍛冶を抑制して全要素統一」の2案で静止mock化し、初見5名へ絶対評価する。
  - 反証条件: 5名中4名以上が両案とも同じ箇所をチープと指摘し、原因が個別素材の画力だけに集中する。

#### 成功する人と成功指標

- 新規プレイヤー: 5秒で場所、主役、次の行動、危険、戻り方を説明できる。
- 継続プレイヤー: 郷、Dungeon、Battle、Homeで自分の行動結果が環境に残ったと気づく。
- 制作者: 1点ずつの手修正ではなく、kitとcontractで品質を繰り返せる。
- 運用者: low-end mobile、asset rights、初期読込を守ったまま公開できる。

期限と予算は未指定のためcalendar日へ固定しない。以下はperson-dayで扱い、各phaseの実測throughputから再見積りする。

### 18.2 現状証拠と非自明インサイト

#### Insight 1: 良い一点は平均品質を上げず、品質差を拡大する

- [事実] `src/village/render/facades.ts`で実画像を読むのは鍛冶と大燈籠だけ。祠、豆腐屋、門は`Graphics`。
- [事実] `buildVillageGroundV2()`は一枚の濃色面、poly、stroke、ellipseで道・土・水を構成する。
- [事実] 添付画面では鍛冶の屋根、炉、壁だけが細密で、道、影、人物札、周辺物が簡略記号として並ぶ。
- [推定] 完成画像の透明切抜きを足す方式は、その画像を良く見せても画面を完成させない。
- 結論: 今後の採用単位を`assetId`から`scene frame`へ上げる。画角内に`placeholder`または`mismatch`が1カテゴリでも残る場合、画面を完成扱いしない。

#### Insight 2: 2,814画像あっても、プレイヤーが見る「接続面」が弱ければ少なく見える

- [事実] 神、敵、装備には大量の個別画像があるが、Home/Pact/Forgeは`NightBackdrop + panel/card`の比率が高い。
- [事実] 神画像362ファイルはSHA-256で361種あり、完全なbyte重複は主因ではない。
- [推定] 「同じ神絵に見える」原因は完全重複より、同じ構図、同じ背景密度、同じcrop、同じpresentation枠でidentityが平準化されることにある。
- 結論: 生成し直す前に、perceptual contact sheetで顔、装束、象徴物、背景、pose、cropの類似を監査する。画像枚数を成果指標にしない。

#### Insight 3: UXの一貫性と美術の同型化は別問題である

- [事実] AR0は戻る、focus、Sheet、確認、標的予告を改善した。
- [事実] Home、Pact、Forge、Codex等は共通panelを多用し、場所固有のsurfaceが弱い。
- [推定] 戻る位置、button動作、focus順は共通化すべきだが、背景、情報面、主役構図まで共通化すると「同じtemplate」に見える。
- 結論: **操作文法は共通、物理surfaceは画面固有**を固定する。共通殻はtitle/back/resource/focus/Sheetに限定する。

#### Insight 4: AR1のgateは技術接続を証明したが、全景品質を証明していない

- [事実] AR1は機械検証と独立監査でPASSしたが、Phase Exitは人間、実機、権利gate待ち。
- [事実] 既存AR1計画は祠、豆腐屋、門を意図的に仮置きし、その完成をAR2へ送っていた。
- [事実] 人間は郷の全景を一枚として判断するため、完成2施設だけの識別testでは全景の魅力を測れない。
- 結論: AR1を失敗扱いに戻すのではなく「技術slice」と再定義し、視覚証明はAR1Rの完成画角で行う。

#### Insight 5: 40地域より先に、4 macro biomeを完成させる方が現在のdata構造に合う

- [事実] `REGIONS`は`bg_forest / bg_zaka / bg_tani / bg_miyama`の4基盤を使う。
- [事実] `REGION_VISUALS`には40地域の地色、材質、粒子差分、12地域の署名landmarkが既にある。
- [推定] 8〜12 familyを新設すると既存4基盤との二重taxonomyになり、工数とflagが増える。
- 結論: 主経路は4 macro biome kit＋12署名hero地点。他地域は既存modifierを強化する。便宜的な実装名`forest / zaka / tani / miyama`を、体験上は「湿生の境／石祈の道／木都の残骸／骨星の荒境」という材質と履歴の異なる4群へ翻訳する。8〜12 familyはthroughputと識別testを通過した場合だけの上振れ案へ落とす。

### 18.3 外部一次事例から借りる原理

#### Darkest Dungeon: 創作核は足し算でなく切るための刃

- [事実] Red HookのChris Bourassaは、明文化したcreative coreがart/audio/designを統合し、制約下で何を切るかを決めると説明している。[GDC Vault](https://gdcvault.com/play/1023424/A-Torch-in-the-Dark)
- 適用: HVR-1.0をpalette表ではなく採否の刃にする。「高精細だが同画面の投影・材質・接地へ合わない」素材は採用しない。

#### Fallout 4: 大世界は一枚絵の量産でなくmodular kitと反復workflowで作る

- [事実] Bethesdaの講演は、短期間に多数の高品質locationを作るためmodular art kitとiterative level-design workflowを中核にしている。[GDC Vault](https://www.gdcvault.com/play/1022930/-Fallout-4-s-Modular)
- 適用: 40地域を40枚描かず、地面、edge、blocker、prop、landmark、foreground、stageの役割別kitを4 biomeで作る。

#### Below: 場所の歴史と主題は文字なしでも空間から読める

- [事実] CAPYのKris Piotrowskiは、procedural worldに歴史・物語・主題の意味をtext/dialogueに依存せず持たせる設計を扱っている。[GDC Vault](https://gdcvault.com/play/1021352/The-Isle-Creating-a-Space)
- 適用: 郷の施設名札やDungeonの説明文を消すことが目的ではなく、札がなくても入口、用途、危険、通路を読める空間を先に作る。

#### Xbox Accessibility Guidelines: 見た目を固有化しても操作順は共通に保つ

- [事実] Microsoftはゲーム全体で一貫したnavigation、focus順、reflow、mapの代替一覧、常設の戻り導線を求める。[XAG 112](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/112)
- 適用: screen固有surface化で戻る位置、focus、keyboard、Sheetを壊さない。美術の差別化を操作規則の差別化にしない。

#### PixiJS: 画面・level単位bundleと共有textureで初期負荷を抑える

- [事実] PixiJS 8はscreen/level単位のasset bundleをbackground loadし、複数Textureが同じTextureSourceを共有できる。大量textureはGPU uploadでlagを起こし得る。[Background Loader](https://pixijs.com/8.x/guides/components/assets/background-loader)、[Textures](https://pixijs.com/8.x/guides/components/textures)
- 適用: 4 biomeを一括起動読込しない。Home、Village、active region、Battle継承をbundle化し、atlas/TextureSource共有、exit時unload、Prepare後に可視化する。

### 18.4 完成単位: Scene Frame Contract

今後の「1単位」は画像1枚でもgameplay pathでもなく、同時表示される完成画角である。

各`SceneFrameContract`は次を必須にする。

| 区分 | 必須契約 |
|---|---|
| Hero | 画面の主役1点。施設、人物、landmark、形見など。画面占有15〜30%を目安にする |
| Support | Heroと同じ投影・線・材質を持つ抑制した周辺。署名landmarkは最大3点 |
| Ground/contact | 地面材質2、edge、接地影、入口または足場 |
| Light | 主光源1系統。補助光は主光源との因果が読めるものだけ |
| Depth | 遠景、中景、前景の3値。前景は操作を隠さない |
| State | normal/closed/crisis/return等の必要状態。tintだけでなく形状差1つ以上 |
| People | scale、接地影、向き、状態。浮遊portrait pinへ依存しない |
| UI | 主CTA 1、常設情報group 3以下、戻り、focus、44/48px |
| Runtime | bundle、decoded memory、init p95、unload、reduced motion |
| Provenance | source/runtime hash、rights、review、crop、checker、文字0 |

`sceneReady=true`は全カテゴリが`final`かつ権利・crop・性能gate済みの場合だけ設定できる。`placeholder`、`mismatch`、`rights unverified`が1つでもあればproduction cohortへ入れない。

visual versionはscene contract単位で最大2版だけを同梱する。地域ごとのboolean flagを増やさない。新規出立時にscene versionをsnapshotする既存契約は維持する。

#### 18.4.1 Composition / responsive contract

- 1280/1440pxは`世界の主役 / 判断面 / 補助情報`の3領域を同一viewportへ置く。判断面を主役画像の上へ浮かせず、物理surfaceの空きへ接続する。
- 768pxは2領域へ再編し、390/360pxは`現在地と主役 → 今決めること → 結果/詳細 → 戻る`の順へ積む。PC配置の単純縮小は禁止する。
- hero画像は重要部位を切らない`contain`または明示crop mapを使い、操作対象の背後へ疑似文字、顔、入口、危険cueを置かない。
- 常設情報groupは3以下、初期表示の比較候補は3以下、主要CTAは1つ。全件一覧、filter、log、loreは二次面へ置くが、2操作以内で到達可能にする。
- 通常文字4.5:1、大文字3:1、UI境界/状態3:1を全stateで測る。色、glow、motionだけを唯一の情報channelにしない。
- Canvas sceneは現在地、近接対象、移動可能方向、危険、目的、帰還規則をDOMでも読めるようにし、`aria-live`は状態変化だけを簡潔に通知する。

#### 18.4.2 灯痕連鎖: 画面を別素材でなく同じ出来事で結ぶ

HVR-1.0のcreative nucleusを、背景の似た色ではなく「同じGameDataが複数画面へ同じ物質的結果を残す」契約へ変換する。新しい装飾flagを増やさず、既存sourceから純粋導出する。

| 既存source | 物質的な痕 | 表示先 | 寿命 |
|---|---|---|---|
| `family / pendingBirths` | 空席、閉じた戸、減る灯、人の気配 | Home / 郷 / 星契り | 状態解消まで |
| `narrative.lastReturn` | 泥足、煤、傷布、欠けた道具 | Home / 郷 / 鍛冶 | 帰還後1季 |
| `regionsCleared` | 主の消えた火、地図の傷、戦勝の刻み | 出立 / 郷 / 家譜 | 永続 |
| rare victoryと`inventory` | 異質な包み、採集印、装備の産地痕 | Battle / 蔵 / 図鑑 | 所持中または記録後 |
| `family / chronicle`の死・世代交代 | 空いた座、綴じ糸、形見の前所有者 | Home / 看取り / 家譜 / 蔵 | 永続 |

各重要結果は最低2画面へ現れ、片方は次の判断に役立つ情報でなければならない。単なる紙吹雪やglowだけの反応は灯痕と数えない。結果を読まなくても操作は止めず、再訪時に一度だけ強調して以後は環境へ馴染ませる。

#### 18.4.3 Asset lifecycleと採用権限

| 状態 | 必須成果物 | 次へ進む条件 |
|---|---|---|
| `planned` | scene role、shape/material/light sheet、必要state | Art direction owner承認 |
| `source-ready` | `assets_src`原本、prompt/reference、source hash、model/license chain | rights一次判定、疑似文字/署名0 |
| `normalized` | palette、輪郭、投影、scale、接地、alpha、crop map | family contact sheetでmismatch 0 |
| `code-integrated` | WebP/atlas、bundle ID、fallback、DOM/UIとの合成 | runtime/source hash一致、既定OFFを含む安全な接続 |
| `scene-integrated` | 必須stateの実画面証拠、5幅capture、機械check | state/viewport/evidence matrix欠落0 |
| `scene-ready` | 人間評価、物理性能、rights、independent review | `placeholder/mismatch/unverified=0` |
| `released` | commit/run/URL/provenance | shipcheck＋ユーザーの明示公開承認 |

`public/`には`code-integrated`以降の採用候補runtimeだけを置き、原本、棄却案、未使用PNGは`assets_src/`またはQA evidenceへ分離する。`code-integrated`は完成・公開可を意味せず、未確認素材は既定OFFまたは通常素材fallbackを維持する。AI生成、手描き、code-nativeの別を品質の代理にせず、同じlifecycleと採否gateへ通す。

#### 18.4.4 Motion / sound / transition grammar

- 1 screenにambient motion family 1つ、主光源1つ、環境音cue 1つまでを原則とする。粒子、glow、parallaxを同時に増やして密度を作らない。
- UI click音は既存`attachUiClickSfx()`へ任せ、個別buttonへ重複実装しない。追加音は地域、危険、儀礼、結果など世界側の意味に限定する。
- Dungeon→Battleは同じ風、水、火、地面音を持ち越し、帰還時だけ家の音へ解決する。画面切替は因果を切らず「同じ場所の別局面」として聞かせる。
- motion標準は160〜240ms、待たせる演出は任意skip可能にする。`prefers-reduced-motion`では移動量を消し、明度/形/短音/文で同じ情報を残す。
- 危険、rare、選択完了を音だけで知らせない。字幕または視覚cueを必ず併記し、muteでも攻略情報を失わない。

### 18.5 画面別の完成仕様

#### 郷: 高精細素材の島から、生活の一枚絵へ

- 5施設すべてを同じ三四分見下ろし、同じupper-left光、同じ屋根線、同じ接地影でfacade化する。
- 祠は鳥居・供物・星灯、豆腐屋は暖簾・湯気・桶、出立門は轍・番小屋・積荷で文字なし識別を作る。
- 鍛冶と大燈籠も含め、通常/閉鎖/危機は戸、煙、暖簾、人影、供物、灯数の形状差を最低1つ持つ。同一WebPのtintだけを完成扱いしない。
- 地面は一枚のflat polygonをやめ、濡土、踏み固め、石、池edge、轍、接地shadowのatlasを疎に合成する。tile目地は見せない。
- 鍛冶の周囲には薪、鉄滓、水桶、踏み跡を置き、透明cutoutが地面へ刺さったように見せない。
- 主人公/NPCは同じscale、outline、ground shadowへ正規化する。常設portrait札と黄色badgeは近接時promptへ縮退する。
- quick travelは残す。歩行と即移動の利用を計測し、歩行投資の価値を検証する。

最小kit候補（pilot前の上限であり発注確定数ではない）:

- facade base 5
- state overlay class 3（closed/crisis/return。施設ごとのfull imageを無条件量産しない）
- ground/edge/contact 6
- lived-in prop 8〜12
- foreground/depth 4
- character/NPC presentation frame 1式

#### Dungeon: landmarkだけ精細な盤面から、地形を読む遠征へ

- 蛍火0層を第2地域より先に閉じる。地面、浅水edge、壁/根、灯標、採取、敵影、稀少予兆、主人公を全て同品質床へ揃える。
- 水没社は接地面、水反射、遮蔽、周辺葦まで一組にし、浮遊cutoutを防ぐ。
- 通れる場所は踏草、反射灯、乾いた縁で示し、通れない場所は根、崖、水深、倒木など理由ある輪郭にする。
- 未踏/既踏/見えて未到達は明度、edge、material densityの3軸で分ける。色だけに依存しない。
- rareは金glowではなく、環境予兆3〜8秒、異なるsilhouette、戦後痕跡、固有dropの4段を持つ。

#### Battle: 額縁カードの展示から、同じ場所での対峙へ

- Dungeon stage contractの地面、landmark、天候、危険cueを保持する。
- 540敵画像をすぐ再生成しない。通常敵は共通の墨matte、crop、接地影、足場で既存絵を正規化する。
- rareとbossだけを優先してcutout/登場motion/固有telegraphへ格上げする。
- 味方/敵の額縁サイズ、outline、足場、名前・HPの位置を同一規則へ揃える。異なる絵柄を金枠で隠さない。
- commandは主行動4件を残し、戦場と同じ材質の操作盤へ置く。logと副情報は展開式にする。
- actor→targetの一本の灯脈、接地telegraph、結果予告で「誰が誰へ何をするか」を5秒で読ませる。

#### Home: panel dashboardから月初の一灯へ

- 最初の一画面は当主、空席/危機、今月の主推薦、他案への入口だけ。
- 日参り、補記、未読、綴、物語を同時に上へ積まず、priority queueで当月必須1件＋非modal badgeへ送る。
- 背景を暗幕化せず、家の座、位牌、月灯、家族の座布団を情報面にする。
- 月送り以外の閲覧では時間が進まないことを明示する。

#### 星契り: filter管理画面から御影の儀へ

- 初期表示は推奨3柱、親、御影、奉納札、子の変化を一望させる。
- 全神名帳とfilterは二次drawer。既知神は奉燈不足でも閲覧可能、実行だけ無効。
- 神180柱は再生成前にcontact sheetを作り、顔、装束、象徴物、背景、pose、cropの類似clusterを監査する。
- 通常/MAXは同じ人物と分かる差分にし、別人化・同構図コピー・疑似文字を拒否する。

#### 鍛冶: 長い在庫一覧から、一人の身体と一打へ

- 初期面は選択人物の身体、3slot、弱点、推薦3件、炉/作業台。
- 購う、全在庫、素材、絞り込みはdrawerへ。比較、費用、結果確認は維持する。
- 810 item iconの追加生成を主施策にしない。品質/希少度/由来/継承は既存dataから、形、印、棚位置、包み方でも示す。
- 打ち直しはbefore/afterと変わらない軸を並べ、不可逆実行だけ確認する。

#### 蔵: 鍛冶tabから、形見を手に取る棚へ

- 鍛冶と同routeでも視覚surfaceは棚、包み、箱、前所有者札へ切り替える。
- 初期面は最近得た品、装備可能な改善、形見、検索の4入口まで。
- 選択時に前所有者、傷、獲得地、継承代数、現在装備との差を一面で見せる。
- grayscaleでも部位、品質、希少度、由来、形見を区別できる形状規則を持つ。

#### 出立/地域選択: 長いSVGから、目的を持つ絵巻へ

- 最前線、前回、未討伐、物語対象の最大4候補を先に出し、選択すると絵巻が地域へ寄る。
- 地域画、boss silhouette、rare兆し、期待drop、推奨隊を一面にまとめる。
- 地図とtext listの両方を維持し、選択は相互同期する。

#### 二次画面

- Chronicle=綴じた年代記、Codex=採集帖、FamilyTree=家系巻物、Facilities=普請図、Settings=道具箱という固有surfaceを割り当てる。
- 共通panel skinを貼り替えるだけにせず、情報の並びが物理surfaceの意味と一致することを求める。
- ただしback、focus、Sheet、tab、検索、filterの操作順は共通shell契約を守る。

#### 18.5.1 全routeとoverlayのclosure inventory

`src/core/types.ts`の現行`Screen` union 22 IDを次の6群で追跡する。将来IDが増えた場合は、型から抽出した集合とclosure ledgerの集合差をCIで失敗させる。

| 群 | route ID | primary phase | 固有surface / 最低限のrequired state |
|---|---|---|---|
| 入口 | `title / intro` | VC2 | 常夜の境、最初の綴り / new/continue、saveなし/あり/破損、reduced-motion |
| 月次生活 | `home` / `village` | VC2 / AR1R-A | 家族の座、暮らしの環状路 / normal、bloodline-crisis、fresh-return、empty/disabled |
| 契りと生涯 | `pact` / `birth / ceremony / jobrite / life / death / dream / dreamEp` | VC2 / VC3B | 御影台、命の綴り、夢の縁 / eligible/ineligible、pending/completed、skip/replay、missing-image fallback |
| 遠征 | `depart / expedition` / `dungeon / battle` | VC3 / AR1R-B→VC4/6 | 焦げた絵巻、地域地形、同地の戦場 / locked/selected/visited、rare/boss、victory/retreat、map/list |
| 記録と手仕事 | `forge` / `chronicle / codex / facilities` | VC3 / VC6 | 作業台/棚、綴じ本、拓本帳、普請図 / empty/populated、filtered/selected、affordable/unaffordable、confirm/error |
| 千年の終端 | `finale / ending` | VC3B | 灯の岐路、次代へ閉じる景 / choice/confirm、各ending、new-cycle/return-title |

route外でも、FamilyTree、蔵tab、Settings/help、save import/export、Sheet/modal/toastをoverlay inventoryとして別表へ持つ。`Settings`やFamilyTreeをroute IDと誤記せず、親screen、open/close、外側click、Esc、focus復帰、empty/errorを追跡する。

#### 18.5.2 制作量の上限（quotaではなく停止線）

- AR1R-A: facade base 5、state overlay class 3、ground/contact 6、生活prop 12、foreground 4を候補上限とし、atlas化後のruntime file数は別記する。
- 4 biome: 各群`terrain / prop / foreground-weather / battle-stage`の4 bundle、計16 bundle。署名landmarkは既存12地点を上限にし、通常28地域はkit＋route/material modifierで閉じる。
- screen surface: 22routeを22枚の背景にしない。上記6群のsurface kit＋各screen固有heroで構成し、同じsurfaceを使っても情報の物理配置と灯痕を変える。
- 神/敵の修正は1 review batch最大12点。batch単位でidentity、権利、crop、実画面を合格するまで次batchを生成しない。
- この上限は制作目標数ではない。少ない部品で識別・魅力・操作gateを満たせば増やさず、上限で未達なら枚数追加ではなくshape/systemを再設計する。

#### 18.5.3 Closure ledger schema

実装時は`docs/qa/visual-closure-ledger.json`を正とし、最低限次を持つ。

`sceneId / parentSurface / stateId / viewport / hero / support / groundContact / depth / people / ui / motionSound / runtimeBundle / provenance / status / owner / evidence / nAReason`

- `scripts/validate_visual_closure.mjs`は`Screen` union 22 ID、`REGIONS` 40 ID、overlay inventoryとの差集合、required field、実在path/hash、rights、状態coverageを検査する。
- `status`はAsset lifecycleの語彙だけを使い、手書きの「ほぼ完成」「一旦OK」を禁止する。
- `sceneReady`はledgerから導出し、UIコードに地域別の手動booleanを増やさない。
- evidenceは1280/390 captureだけでなく、該当fixture、操作旅程、性能計測、human sheetへ辿れる相対pathを持つ。
- 新しいroute/region/stateを追加したPRはledger行がなければ落とし、見た目の負債を匿名化しない。

### 18.6 主経路と代替経路

| 経路 | 構成 | 情報価値 | 工数/リスク | 判定 |
|---|---|---:|---:|---|
| A | 鍛冶密度へ全要素を上げる | 高 | 60〜120+ pd、権利/性能高リスク | AR1R mockの比較枝 |
| B | 高密度hero 1点＋抑制した接続層を、4 biome kit＋12 hero地点へ展開 | 最高 | base 53〜94 pd＋P0差替え予備0〜12 pd | **主経路** |
| C | 全要素を低密度な墨・silhouetteへ統一 | 中 | 性能と一貫性は高いが、固有の魅力を削る | 性能/権利失敗時の縮退 |
| D | 40地域・全screenへ一枚絵を直接生成 | 低 | identity drift、接地不能、crop/性能/権利 | 不採用 |

AR1RではA「全要素高密度」とB「hero高密度＋接続層を抑制」の静止mockを同時に作る。Bを主仮説にするが、絶対評価で選ぶ。Aが勝っても40地域へ直接量産せず、最初の2完成画角でthroughputを測る。

### 18.7 フェーズ別ロードマップ

#### VC0: 証拠凍結・権利・性能（1〜2 person-day）

Entry: AR1機械実装と今回のユーザーフィードバック。

作業:

- `git status --short`、基準HEAD、既存dirtyの所有者、untracked hash、復元patch、今回の許可pathを凍結する。M35/AR0/AR1既存差分を新計画の成果へ混ぜない。
- 郷1280/390の全可視物を`final / placeholder / mismatch / UI-only`へ分類するcoverage matrixを作る。
- `Screen` unionの全画面、全40地域、各画面/施設/地域に必要なnormal/closed/crisis/return/locked/empty等の状態を列挙したclosure ledgerを作る。状態不要は理由付き`N/A`とし、未記入を許さない。
- Home/Pact/Forge/Dungeon/Battleも同じmatrixで基準化し、最初の比較fixture 6画面を固定する。
- 未使用runtime PNGを公開候補から外し、sourceは`assets_src`、配信はWebP/atlasだけにする方針を固定する。
- manifest validatorへ`requiredStates`の実在/coverage検査を設計する。
- 生成4点のrights owner、判定根拠、期限を割り当てる。
- 物理low-end mobile/PCでV1/V2を10分測る。

Exit:

- 基準画像、fixture、viewport、hash、coverage matrixが郷/Home/Pact/Forge/Dungeon/Battleの6画面で揃う。
- 全screen/state/regionのclosure ledgerに行があり、`未分類=0`。この時点のplaceholderは許すが、VC6/完了判定まで追跡を外さない。
- base HEAD、所有境界、rollback、許可pathがQA文書から再現でき、今回scopeだけを適用/reverseして既存差分のhashが変わらない。
- 権利判定者と48時間の判定期限が決まる。未解決なら生成系統をruntime採用候補から外す。
- V2がV1比10%以上遅い主要画面は原因をmotion/foreground/load/textureへ分類し、AR1R予算を固定する。

#### AR1R-A: 郷の完成画角closure（3〜6 person-day）

Entry: VC0 PASS。新規地域生成は禁止。

作業:

- 同じfixtureのA「全要素高密度」とB「高密度hero＋抑制した接続層」を1280/390でmockする。
- 採用方向で5施設、地面、池edge、生活prop、前景、主人公/NPC、近接prompt、接地影、光源を閉じる。
- 5施設のnormal/closed/crisisへ形状差を入れる。
- portrait pinの常設をやめ、近接・会話・選択時だけ表示する。

Exit:

- coverage matrixの`placeholder/mismatch=0`。
- 初見5名中4名以上がUIなしで主要施設3つと現在地を説明。
- 「貼り付け・仮素材・ここだけ細かい」の指摘が各1名以下。
- 3施設を30秒以内に到達、誤遷移0、D-pad/行動帯交差0。
- 物理端末性能gate、rights、5幅overflow/keyboardをPASS。

#### AR1R-B: 蛍火Dungeon→Battle完成画角closure（4〜7 person-day）

Entry: AR1R-A PASS。郷で採用した投影、edge、接地、bundle規則を再利用する。

作業:

- 蛍火0層の地面/水edge/壁/灯標/採取/敵影/rare予兆/主人公を同品質床へ揃える。
- Battleのcombatantを共通matte/crop/contactへ正規化し、rareまたはboss 1体だけhero cutout化する。
- Dungeon/Battleの同一stage contractと帰還痕を維持する。

Exit:

- 両画面の`placeholder/mismatch=0`。
- 6/8が地名なしで同じ地域と説明し、進路、標的、次の危険を5秒で回答。
- rareの予兆→遭遇→drop→帰還痕が1旅程でつながる。
- 5幅操作、unit、lint、build、物理性能、rights PASS。

#### VC2: 入口・Home・星契りの儀礼面（5〜8 person-day）

Entry: AR1R-B PASS。共通shellの安全規則を変更しない。

作業:

- Titleを常夜の境としてnew/continue/save破損/reduced-motionまで閉じ、Introを最初の綴りとしてskip、keyboard、mobile全文到達を保つ。
- Homeの月初一灯面と情報priority queue。
- 星契りの推奨3柱、御影、奉納札、子の見立て一面化。
- 汎用panel面積を減らし、家の座/神名帳へ情報を移す。

Exit:

- `title / intro / home / pact`の全required stateで`placeholder/mismatch=0`。saveなし/あり/破損の3 fixtureから安全に開始または復旧できる。
- 6/8がHomeで危機人物、主推薦、他案を5秒で説明。
- 6/8が星契りで親、神、費用、子の変化、月進行を説明。
- Introのskip/全文scroll、閲覧不能神0、誤契約0、overflow/keyboard/focus回帰0。

#### VC3: 鍛冶・蔵・出立の作業面（4〜7 person-day）

Entry: VC2 PASS。

作業:

- 鍛冶の身体/3slot/推薦3件/作業台。
- 蔵の棚/形見/前所有者/比較。
- 出立の4候補＋同期する絵巻地図。`expedition`は選択地域、隊、現在node、戻るを同じ絵巻surfaceへ接続する。

Exit:

- 6/8が鍛冶で対象人物、弱いslot、推薦を説明し、誤購入/誤装備0。
- grayscaleで6/8が蔵の5軸を区別し、指定形見を15秒以内に発見。
- 出立で指定地域と隊を60秒以内に選び、`depart→expedition→dungeon`の戻る/取消/費用誤認0。両routeのlocked/selected/map-list stateで`placeholder/mismatch=0`。

#### VC3B: 生涯・夢・千年の終端（6〜11 person-day）

Entry: VC3 PASS。物語順序、skip/replay、選択結果、save migrationは変更しない。

作業:

- `birth / ceremony / jobrite / life / death`を共通「命の綴り」surface kitへ置く。ただし名付け、灯型、家業、日常、看取りのheroと主行動は各routeで1つに固定する。
- `dream / dreamEp`は既存固有CG、16:9 contain、alt、fallback、idle preloadを維持し、夢の縁・台詞面・skip/replayを同じ構図規則へ揃える。
- `finale / ending`は灯の岐路から結果へ連続させ、三択の同格、確認、各ending、new-cycle/return-titleを閉じる。
- 9 routeを9枚の背景へせず、命の綴り/夢の縁/灯の岐路の3 surface kit＋既存または監査済みheroで構成する。

Exit:

- 9 routeの全required stateで`placeholder/mismatch=0`。missing-image、対象人物不在、skip、replay、各ending、new-cycle fixtureを含む。
- 6/8が各代表sceneで「誰の何が変わるか」「進める/後回し/戻る」「時間や進行への影響」を5秒で説明する。
- birth→ceremony→jobrite→life→death、dream順序、finale選択→ending→new cycleの状態遷移が既存save fixtureと一致する。
- 5幅、contrast、keyboard/focus、reduced-motion、alt、進行不変replayをPASSする。

#### VC4: 4 macro biome pilot（5〜8 person-day）

Entry: AR1RとVC2/3/3Bの人間・性能・rights gate PASS。

作業:

- 実装上のforest/zaka/tani/miyamaを、体験上の「湿生の境／石祈の道／木都の残骸／骨星の荒境」へ対応させ、ground/edge/blocker/prop/landmark/foreground/stage bundleへ分ける。
- 各biomeでhero地域1つを完成し、既存12署名地点のうち4つを適用する。
- 3地域目の制作/加工/統合/QC person-hourを計測する。

Exit:

- 地名、文字、固有色を隠した4-way blind classificationを行う。各biome 2 crop、計8 cropの混同行列を残し、各biomeで6/8以上が両cropを正しい群へ分類する。
- 第3地域が1 person-day以内、1 biome kitが3 person-day以内。
- 性能、memory/init+20%、rights、state coverage PASS。
- 未達なら4 biomeを上限としてmodifierを簡素化し、8〜12 familyへ進まない。

#### VC5: 神・敵・装備のpresentation監査（監査3〜6 person-day＋P0差替え予備0〜12）

Entry: VC3Bまでのprimary screen surfaceが固定済み。

作業:

- 神180通常/MAXのcontact sheetとperceptual similarity cluster。
- 敵147基礎＋変異のsilhouette/crop/style outlier監査。
- 装備810は再生成せず、slot/quality/rarity/origin/legacy frameの規則を先に固定。
- 出現頻度、物語重要度、初回30分露出でP0/P1/P2を付け、flagged assetだけ修正する。

Exit:

- 意図しない同人物/同構図、疑似文字、crop違反、identity driftがP0露出範囲で0。
- rare/boss/主要神は通常素材と区別できるが、別gameの絵柄に見えない。
- asset数増加を成果にせず、flagged件数と閉鎖率を記録する。
- 差替えは最大12点/batch、予備工数合計12 person-dayで一度停止する。P0が残る場合は露出をfallback/既存合格素材へ制限し、追加予算・外注・延期の再承認を取る。

#### VC6: 40地域modifier・記録route・overlay（18.7〜34 person-day上限、VC4後に再積算）

Entry: VC4/VC5 PASS。残person-dayと担当者が確定。

作業:

- 4 macro kitを40地域へ割り当て、12署名hero地点を優先する。
- `chronicle / codex / facilities`を綴じ本/拓本帳/普請図へ移す。FamilyTree、Settings/help、save import/export、Sheet/modal、toast/alertはroute外overlayとして親screenとの開閉を閉じる。
- screen/biome bundleをbackground loadし、非使用textureをunloadする。
- 見積式は`残り署名8地点×0.75〜1.0 pd + 通常28地域×0.15〜0.35 pd + 記録route 3×0.75〜1.25 pd + overlay family 5×0.25〜0.75 pd + 統合/QA 5〜8 pd = 18.7〜33.3 pd`とする。VC4の実測単価で再計算し、34 pdを越える予測なら新規bespoke assetを止め、4 kit＋code-native modifierで全行を閉じる。
- 全体予算はVC0〜VC7のbase 53〜94 pd＋VC5 P0差替え予備0〜12 pd、合計53〜106 pdを初期rangeとする。VC6の34 pd上限または差替え予備12 pdでもclosure不能と判明した時点で、未完を隠さずSTOPし、範囲・外注・期間の再承認を取る。

Exit:

- 全40地域と全二次画面のclosure ledgerでrequired stateの`placeholder/mismatch/未確認=0`。`N/A`には独立reviewerの理由がある。
- 色替えだけの地域0。少なくとも材質、輪郭、landmark/navigationの3軸で差がある。
- 4 biome全群、12署名地点、各biome 2つの非署名地域を層化抽出し、混同行列と自由回答を残す。二次画面も5秒で現在地、主役、主行動、戻り方を6/8が説明。
- 全unit、lint、build、5幅visual/旅程、物理性能、rights PASS。

#### VC7: 最終人間評価・release候補（3〜5 person-day）

Entry: VC6 PASS、candidate build固定。

- 制作者を除く新規8名（未経験4、browser/RPG経験4）に、現行版/候補版を順序randomizedで15〜20分のHome→郷→出立→Dungeon→Battle→帰還taskとして依頼する。
- 相対選好に加え、「貼り付け」「仮素材」「同じtemplate」「暗いだけ」「色違い」の自由回答をcode化する。
- 理解と魅力を混ぜず別採点する。理解は場所/主役/次行動/危険/戻り方、魅力は「この作品固有」「一つの世界」「先を見たい」「自分の一族の痕が残る」を各5段階で採る。
- 主要原因code各1件以下、コアループ6/8、魅力4項目それぞれ6/8が4以上、操作不能0を要求する。「安っぽい/貼ったようだ」は6/8が2以下を要求する。
- task後の任意継続率と、どのsurfaceで離脱したかは探索指標として記録するが、8名の小標本をretentionの証明には使わない。
- shipcheck後、ユーザーの明示承認がある場合だけcommit/push/deployする。

### 18.8 クリティカルパスと資源

```text
現行画角の全要素分類
  → rights owner + 物理性能
    → 郷A/B完成mock
      → 郷一画面placeholder 0
        → 蛍火Dungeon/Battle placeholder 0
          → Title/Intro/Home/Pact固有surface
            → Forge/Storehouse/Depart/Expedition固有surface
              → Birth/Ceremony/JobRite/Life/Death/Dream/Finale/Ending固有surface
                → 4 macro biome pilot
                  → 神/敵presentation監査
                    → 40地域modifier・記録route・overlay
                      → 最終人間評価
```

最小役割:

- Art direction owner: complete-frame採否、形状sheet、material/light contract。
- Environment owner: facade/terrain/prop/foreground/landmark。
- UI/UX owner: screen surface、情報優先、keyboard/touch/DOM代替。
- Runtime owner: Pixi layers、bundle/atlas、memory、version、rollback。
- Rights/QC owner: provenance、model terms、hash、crop、文字、state coverage。
- Independent tester: 制作者とは別に5秒test/旅程/絶対評価を採点。

名前・端末・rights判断者が未確定の役割は計画上の資源欠損であり、「後で確認」でPASSにしない。

### 18.9 性能・配信契約

- compressed bytesだけでなくdecoded RGBA、GPU residency、texture upload、screen-ready p95を測る。
- 初期起動で全biomeを読まない。現在screen、次screen、active regionだけをbundle化する。
- atlas/TextureSource共有を優先し、同じPNG/WebPの二重配信をしない。
- visual versionの同時常駐は2以下。covered sceneは2 release以内にV1を除去する。
- AR0比でtexture memory/init p95 +20%以内。
- low-end mobile平均30fps、1% low 24fps、100ms超jank毎分1回以下。PC平均55fps。
- V2がV1より10%以上遅い画面は、motion、foreground、high-res state、eager loadの順に削る。

### 18.10 リスク台帳

| リスク | 早期兆候 | 対策 | 発動/転換条件 |
|---|---|---|---|
| 完成素材の孤島 | 1点だけ細密、周囲にflat primitive | scene frame contract | pasted/temporary指摘2/5以上で単品生成停止 |
| 高精細化しすぎ | path/entranceが背景へ沈む | B案の抑制接続層・輪郭・接地へ正規化 | task時間+20%または識別5/8以下 |
| 状態をtintで済ます | normal/crisisのsilhouette同一 | 形状差1つ必須、validator coverage | 独立状態asset 0のsceneは未完成 |
| 40地域未完 | 第3地域>1 pd、kit>3 pd | 4 biome＋12 heroへ固定 | どちらか超過で8〜12 family撤回 |
| 性能悪化 | V1比-10%、memory/init+20%超 | atlas、static、motion削減、unload | 再測定不合格で表現密度を一段落とす |
| 権利差替え | unverifiedのままpublic候補 | 48h判定、lineage単位停止 | 未解決で該当生成系統を不採用 |
| flag debt | scene別boolean増加 | versioned contract、active2版 | 3版必要なら旧版除去を先に行う |
| 郷歩行が使われない | quick travel≥70%、接触<25% | hub/hotspotへ縮退 | 10人観察で両条件成立 |
| panel削減で迷う | 情報探索時間+20% | 必要groupだけ1段戻す | 2回のtask再試験で未回復ならIA再設計 |
| AI素材の同質化 | pHash/埋込みclusterと人間指摘一致 | exposure優先でflaggedのみ差替え | 同family drift2件でbatch全棄却 |
| 魅力を理解度で代用 | task成功だが先を見たい評価が低い | 理解/魅力を別尺度で盲検比較 | 魅力4項目のいずれか6/8未達 |
| 差替え予備の膨張 | P0 outlierが12 pdで閉じない | batch 12点、fallback、露出制限 | 予備12 pd到達で再承認まで停止 |

### 18.11 前提台帳

| 前提 | 最安検証 | 期限 | 反証後 |
|---|---|---|---|
| 全要素を鍛冶密度へ上げる方が良い | A/B静止mock、初見5名 | AR1R開始48h | Bの高密度hero＋抑制接続層へ統一 |
| 郷歩行に投資価値がある | 10人の歩行/即移動/接触観察 | AR1R-A前 | 絵画hub＋hotspot |
| 生成4点を商用配信できる | terms/model/right reviewer | 48h | 生成系統停止、authored/licensed kit |
| 4 biomeで40地域を区別できる | 4-way blind、各群2 crop、各群6/8、3地域目≤1 pd | VC4 | kit/modifierを再設計し、hero地点を4つへ縮小 |
| 既存神/敵絵をpresentationで統一できる | 主要10神/10敵のcontact sheet | VC5前半 | flagged assetだけ再制作 |
| low-end性能を維持できる | 同端末10分V1/V2 | VC0 | motion/foreground/textureを削る |

### 18.12 撤退・縮退基準

- 完成画角を2回修正しても「貼った」「仮素材」が2/5以上: AI画像追加を停止し、墨silhouette kitまたは専門environment artistへ転換。
- 物理性能がeffect削減後もV1比-10%超: full-detail A案を撤回し、静的atlas中心のB案へ固定。
- rightsが48時間で閉じない: 同じgenerator lineageの新規制作を停止し、公開候補から隔離。
- 第3地域>1 person-dayまたは1 kit>3 person-day: 4 macro biomeを永久上限とし、8〜12 familyを撤回。
- quick travel≥70%かつ歩行接触<25%: walkable mapの拡張を停止し、完成イラストhub＋hotspotへ転換。
- panel削減後のtask時間が現行比+20%を2回超える: 必要情報groupを1段戻し、装飾削減と情報削減を分離する。

### 18.13 最初の72時間

> **実行境界**: 以下は次回実装の開始案であり、この計画作成依頼はmock作成、画像生成、validator/コード変更、commit、push、deployを承認しない。ユーザーから別途「実装してください」と明示された後だけ着手する。

#### 0〜24時間

- 郷、Dungeon、Battle、Home、Pact、Forgeを1280/390の同一fixtureで再撮影。
- 各可視物を`final / placeholder / mismatch / UI-only`へ分類し、scene coverage registryを作る。
- physical low-end端末とrights reviewerを指名する。確保不能なら、その欠損をblockingとして記録する。
- 郷のA「全要素高密度」とB「高密度hero＋抑制した接続層」のshape/light/contact sheetを作る。runtime実装はしない。

#### 24〜48時間

- A/Bの郷1280/390静止mockを作る。
- 初見5名へ5秒testを行い、施設3つ、現在地、次行動、貼り付け/仮素材箇所を自由回答させる。
- 同時にV1/V2を物理端末で10分計測し、性能予算を確定する。
- 生成4点のrightsを判定。未解決ならCのauthored/vector/ink kitへ切替える。

#### 48〜72時間

- 採用案のAR1R-A asset matrix、file ownership、rollback、bundle、testを確定する。
- validatorへrequired state coverage、runtime-only public、sceneReady条件の赤testを作る。
- 実装指示はAR1R-Aだけへ限定し、Dungeon第2地域、全神差替え、40地域生成を含めない。

### 18.14 Claude / Fable 5へ渡す次実装契約

```text
目的: 鍛冶場だけが完成して見える郷を、一画面に同時表示される全要素が同じ制作水準の完成画角へする。
対象: AR1R-Aのみ。郷の5施設、ground/contact、生活prop、foreground、主人公/NPC presentation、近接prompt、normal/closed/crisis。
権限: これは次回用の契約案。ユーザーの別途明示承認まではmock、画像生成、コード変更、commit、push、deployを開始しない。
保持: map、collision、K/L/S/T/G、BFS、quick travel、D-pad/行動帯、Home/Pact/Forge遷移、save、AR0安全性。
先行: A/B 1280/390 mock、初見5名、物理性能、rights判定。
禁止: 第2地域、40地域、全神/全敵再生成、地域別boolean flag、未確認素材のproduction採用、push/deploy。
成果物: scene coverage registry、採用mock、asset manifest/state coverage、runtime bundle、5幅before/after、物理性能、5秒/30秒task、rollback。
完了: placeholder/mismatch 0、施設識別4/5、pasted指摘1/5以下、誤遷移0、30/24/55fps、rights cleared、unit/lint/build/visual PASS。
```

### 18.15 完了定義

全体改善は次をすべて満たした時だけ完了とする。

- `Screen` unionの全画面、全40地域、全required stateを列挙したclosure ledgerがあり、`placeholder/mismatch/未分類/未確認=0`。理由付き`N/A`は独立review済みである。
- 郷、蛍火Dungeon、対応Battle、Home、星契り、鍛冶、蔵、出立に代表となる完成画角があり、二次画面も固有surfaceを持つ。
- `family / pendingBirths / lastReturn / regionsCleared / inventory / chronicle`から導出する灯痕が重要結果ごとに2画面以上へつながり、少なくとも1つは次の判断に役立つ。
- 5施設、4 biome、主要screenを色や常設labelだけでなくshape/material/surfaceで識別できる。
- 神/敵/装備は個数でなく、P0露出範囲のidentity drift、疑似文字、crop違反が0。
- normal/closed/crisis/return等の必要状態に形状差があり、tintのみの完成扱いが0。
- 操作安全、focus、戻り、外側click、keyboard、mobile 44/48px、DOM代替が回帰しない。
- 360/390/768/1280/1440でcomposition順が契約どおり、通常文字4.5:1・大文字3:1・UI境界3:1、mute/reduced-motionでも情報欠落0。
- 物理30/24/55fps、jank、memory/init +20%、bundle/unloadを全主要画面でPASS。
- runtime assetはrights cleared、source/runtime hash一致、publicに採用品だけ、未使用二重形式0。
- 初見8名のコアループ6/8、魅力4項目それぞれ6/8が4以上、安っぽさ2以下が6/8、主要AI感原因code各1以下、操作不能0。
- 正典/STATUS/WORKLOG/QAを同期し、ユーザーの明示承認後だけ公開する。

### 18.16 実装結果（2026-07-21 local mission）

- ユーザーの後続明示承認「計画を実装してください。必要画像の生成も並行して行ってください。」を受け、§18.13/18.14の計画時権限境界を解除してlocal実装した。commit、push、deploy、外部送信は承認範囲に含めていない。
- closure ledgerは22 route、40 region、6 overlay、計68行。全行がrepo内source/runtime/evidenceとSHA-256を持つ`code-integrated`で、必須state×5幅の証拠matrixを満たすまで`scene-integrated`へ昇格しない。`scene-ready/released`も0。
- AR1R-A/B、VC2、VC3、VC3B、VC4/6、VC5のlocal codeと画像生成を完了。郷の星祠・豆腐屋・出立門3点を追加し、生成7素材のmanifestを検証した。全40地域は一枚絵量産を避け、4 code-native kit＋40固有profileで実描画する。
- 神/敵/装備1,749点を実参照ベースで監査。欠落/exact重複は0だが、神MAXの同一性・画風不整合を検出したため一括採用せず、空のportrait別allowlistと通常像fallbackをruntimeへ実装した。
- local gateはVitest 676、oxlint、production build、closure 68/68、manifest 7/7、分割した対象別5幅Playwright、diff-checkをPASS。郷は5幅30/30、蛍火旅程は5幅21合格・4意図的skip、鍛冶/蔵の修正後PC/mobile証拠は8合格・2意図的skip。外部8名、4-way blind、物理端末、生成権利は未達のままHOLDし、`regionVisualV2`既定OFFと未確認素材隔離を維持する。
- 実装状態の正本は`docs/CODEX_MISSION_STATE_FULL_GAME_VISUAL_IMPLEMENTATION.md`、検証台帳は`docs/qa/visual-closure-ledger.json`、画像監査は`docs/qa/vc5/asset-presentation-audit.md`とする。
- 独立監査Round 1のREWORKを是正し、Round 2はローカル`code-integrated`範囲でPASS-with-notes、blocking 0。監査記録は`docs/qa/full-visual-independent-audit-20260721.md`。これは`scene-integrated`または公開可の判定ではない。
