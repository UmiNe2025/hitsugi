# 『灯継ぎ -HITSUGI-』多角的プロダクト改善監査 M42

**監査日**: 2026-07-22  
**対象**: HEAD `001dfda` / 公開版 `https://hitsugi-game.github.io/hitsugi/?audit=m42`  
**位置づけ**: 改善点の洗い出しと実装順序の決定。runtime実装、画像生成、commit、push、deployは対象外。  
**優先度の意味**: P0=次の実装サイクルで最初に閉じる価値経路、P1=その後の品質・継続性、P2=基盤成熟。障害severityとは別である。

## 1. 結論

現在の『灯継ぎ』は、タイトル、郷、出立絵図、ダンジョン背景、戦闘美術、煤墨の記録面まで、作品固有の見た目を持つ段階へ到達した。核となる`短命 → 星契り → 親子 → 死 → 形見 → 次代`も、他作品と区別できる。

次の成長を止めているのは素材不足ではない。最重要課題は、既存の豊富な要素をプレイヤーへ届く一つの因果に編集し切れていないことである。

```text
現在: 危機 / 日参り / 物語 / 180柱 / 40地域 / 810品 / 270超事件が並列に見える
目標: 約束 → 選択 → 戦い方 → 結果 → 喪失 → 次代に残ったもの が一本に見える
```

したがって、次の6週間は新しい神、敵、地域、装備、事件、辞世、立ち絵の追加量産を止め、以下の四点へ集中する。

1. 初回30分を`危機 → 契り → 誕生 → 初遠征 → 帰還`へ縮約する。
2. 序盤12敵だけを、見た目ではなく対処法が異なる戦闘へ作り直す。
3. 初代の約束、後継指名、辞世、形見、次代の一手を一つの継承場面へ結ぶ。
4. 匿名マイルストーン、キャンペーンsim、staging、実ブラウザCIで「魅力が上がったか」を測れるようにする。

## 2. 現在の強み — 壊さず伸ばすもの

- タイトルの一枚絵、ロゴ、余白、二つの難度入口は、世界観の第一印象として強い。
- 24か月の有限寿命、星神との契り、遺伝、命名、辞世、形見、世代交代は明確な独自性である。
- 郷はラスター素材と歩行空間が統一され、「すぐ行く」という操作上の逃げ道もある。
- ダンジョンの灯、戦利品、隊HP、帰り火は、深追いと撤退を判断する良い土台である。
- 鍛錬の`人物 → 戦型 → 次の節目 → 推薦3件`、宝具の`53系譜＋家祖棚`、全戦闘オートの3方針は正しい方向である。
- 設定、図鑑詳細、月消費行動の確認、外側クリック、Escapeなど、誤操作防止は多くの面で整っている。
- 保存層にはmain/BAK比較、旧版移行、容量縮退、複数タブread-onlyが既にあり、堅牢化の土台がある。

## 3. 直接観測した現在値

| 観点 | 現在値 | 解釈 |
|---|---:|---|
| Home / PC 1280×720 | `scrollHeight 1257`、button 24、星契りCTA 3 | 約1.75画面。重要行動がfirst view外 |
| Home / mobile 390×844 | `scrollHeight 2298`、12px未満要素12、44px未満高の主要操作多数 | 約2.7画面。読めるが密度が高い |
| 新規/再訪Home | 日参り報酬が血脈危機より先にmount | 作品の約束よりログイン報酬の文法が先行 |
| 星契り / mobile | button 197、神row 180、初期選択0 | 自由度が比較責任とTab負債になる |
| コンテンツ | 神180、敵579（通常基礎180＋変異＋主）、装備810、事件282、地域40 | 追加量ではなく露出・意味・因果が不足 |
| 通常敵の技数 | 0技=106、1技=68、2技=6 | 敵の59%は通常攻撃だけ |
| 配信画像 | 2,825点、241.68MB（raster 2,823 / SVG 2） | 画材統一は進んだが配信artifactは重い |
| production build | main JS 1,424.08kB / gzip 430.89kB、CSS 206.46kB | 初回bundleを画面単位に分割する余地大 |
| 自動検証 | lint緑、build緑、closure 22/40/6/68、manifest 9/9 | 基礎gateは強い |
| Vitest | 初回37/38 files、698 pass、1 hook timeout。単独再試行で3/3 pass | 製品不良ではないがsuiteの時間依存を解消すべき |
| 公開工程 | main pushが本番へ直結。共有staging・branch protection・PR browser smokeなし | レイアウト退行を本番前に止めにくい |
| 行動計測 | GoatCounter `your-code` placeholder、SPA milestone送信なし | 初帰還・初継承・再訪を判断できない |

### 監査方法

- 公開版をPC `1280×720`、mobile `390×844`で操作し、Homeと星契りのDOM件数、scroll、overflow、操作寸法を取得した。
- Home、星契り、出立、郷、鍛冶・宝具録、図鑑、設定を公開版とコードで照合した。
- runtime配列をimportし、神、敵、敵技、装備系譜、事件、地域を再集計した。
- `npm run lint`、`npm test`、visual closure/manifest、`npm run build`を実行した。
- ゲーム性・物語、UI/UX・accessibility、技術・運用の三レーンで独立read-only監査を行った。

## 4. 優先バックログ

工数は `S=1日以内 / M=2〜4日 / L=5〜10日` の概算。各項目は実装完了ではなく、受入条件を満たして初めて完了とする。

### P0 — 次のサイクルで先に閉じる4項目

#### P0-01 初回30分を一本の主経路へ縮約する

- **症状**: Homeに危機、助言、物語、一族、診断、月行動、帳面が縦積みされ、同じ星契りCTAが3件ある。星契りは180柱を初期表示し、親も神も未選択。編成も初期空配列である。
- **根因**: 各機能は改善されたが、初回だけ情報量を減らす体験編集が未実装。
- **実装**: Homeの危機と助言を一つの最優先札へ統合し、主CTAを1件にする。唯一の成人親と初編成は仮選択。星契りは理由付き3柱と「全てを見る」を先に出す。画面進入時は先頭・見出しfocus、戻る時だけ位置復元。
- **受入**: 初見8名中6名が無介助で10分以内に契り→誕生、6名が30分以内に初帰還または安全中断。Home first viewに推奨行動が見え、初回各面の主CTAは1件。
- **依存 / 工数**: local milestone計測、共通ScreenShell / L。

#### P0-02 初代の約束から次代の一手までを一場面へ結ぶ

- **症状**: 次代は最年長へ自動交代し、今代の問い、辞世、形見、家譜が別々に表示される。プレイヤーが「誰に何を残したか」を決めた感覚が弱い。
- **根因**: 継承はデータ上存在するが、`約束 → 行動 → 結果 → 継承`の編集単位がない。
- **実装**: 生前の後継指名（未指定は最年長default）、一つの「残す約束」、本人の生涯2事実を使う返歌、受け継いだ形見と血潮、次代の最初の選択を一つの継承Sheetへまとめる。戦力報酬は付けない。
- **受入**: 候補2人以上で指名可、未指定でも停止しない。100 seedで返歌が真実の事実2件以上を参照し矛盾0。一世代テスト5名の初継承中央値45分以内、継承後3/5が促されず次月を始める。
- **依存 / 工数**: heir/vow save schema、返歌selector、scene integration / L。

#### P0-03 序盤12敵へ「読んで対処する」戦闘文法を作る

- **症状**: 通常敵180体中106体に技がなく、技持ちも通常AIでは35%選択。見た目が違っても通常攻撃中心の同じ問題になりやすい。
- **根因**: 物量生成が敵固有の意図、解除条件、行動周期より先行した。
- **実装**: 全敵を直さず、序盤露出上位12体を`止める / 受ける / 崩す`の3型へ分ける。2〜3手のpattern、対象、危険度、解除条件を兆しで示す。全戦闘オートと手動同報酬は維持する。
- **受入**: 固定攻撃と適切対処で残HP・勝率に意味のある差。初見8名中6名が危険と対処を説明できる。各戦闘に二つ以上の合理的方針が成立。
- **依存 / 工数**: exposure集計、intent UI、battle sim / L。

#### P0-04 魅力を測るマイルストーンとcampaign simを先に敷く

- **症状**: 初帰還、初継承、継承後継続、再訪が未測定で、画像枚数・テスト数を成功と誤認しやすい。
- **根因**: save内には物語metricsがあるが、プロダクトjourneyの一度きりeventと横断集計がない。
- **実装**: PII・自由文・端末IDを持たないlocal milestonesとして`new_game / pact / birth / first_depart / first_return / safe_exit / first_death / first_inherit / next_month`を一度だけ記録。QA exportを作る。併せて100〜1000 seedの新規save→終盤campaign simを実storeで回す。外部送信はproviderとprivacy方針決定後に別gateで有効化。
- **受入**: 旧save移行、二重計上0、送信OFFでもゲーム不変。初ボス到達率、断絶率、世代数、通貨p10/p50/p90、敗北復帰月数を同じseedで再現できる。
- **依存 / 工数**: event辞書、save migration、集計script / M〜L。

### P1 — 価値を守り、快適性と継続性を上げる項目

#### P1-01 Homeの真実を一つの推薦engineへ統合する

- 後継ありでも「血が細い・星契りを急げ」、同時に瀕死で静養推奨という矛盾が公開版で再現した。
- 血脈危機、綴の助言、血脈診断、今月推薦を一つのpriority treeから出す。`最優先`と`次月候補`だけを表示する。
- **受入**: 後継ありなら断絶警告0、瀕死なら静養のみを主CTA。状態組合せtable test全緑。**工数 M**。

#### P1-02 日参りを初回の物語より前へ出さない

- `Home.tsx:93-148`で新規Homeにも日参り報酬が最初にmountする。
- 新規saveでは初帰還後まで保留し、再訪時も「家の便り」を主、通貨を従にする。連続ログインや取り逃し圧は追加しない。
- **受入**: 新規Homeの最初の主語は必ず血脈危機。North Starに受取率を使わない。**工数 S**。

#### P1-03 Dungeonを中断に耐え、深追いを説明できるものにする

- `DungeonRun`がsave対象外で、reloadすると位置、灯、戦利品、加護が失われる。階段確認も危険判断材料が少ない。
- 階移動、宝箱、事件、戦闘決着後にcheckpoint。復元不能時は重複報酬なしの一度きり安全精算。階段Sheetへ全階、最低HP、灯、主層、確定戦利品を表示する。
- **受入**: 各phaseのreloadで完全復元か安全精算、複製0・損失0。初見6/8が「何を賭けて降りたか」を説明。**工数 L**。

#### P1-04 mobile出立を1960pxの入れ子地図から解放する

- 390pxで地図本体が1960px固定、ページと地図が二重scroll。行き先から編成まで遠い。
- 現在地周辺3〜5地点の横swipe絵巻を標準にし、全体絵図は別Sheet。選択直下に編成を置く。
- **受入**: 行き先→隊員選択が1画面以内、scroll領域1つ、主要文字12px以上。**工数 L**。

#### P1-05 星契りと宝具録の一覧操作を本当に縮約する

- 星神180件がすべてTab対象。宝具録検索は入力しても54棚のままで、検索stateがItemCollectionへ渡っていない。PC宝具録は一覧と段詳細が二重scroll。
- 星契りは推奨5、最近契った神、検索、仮想化、roving tabindex。宝具録は検索を配線し、左paneだけをscroll、0件解除導線を出す。
- **受入**: Tabは神一覧へ1回、矢印移動、推奨へ3操作以内。`小太刀`で該当棚のみ、解除で54棚。同時scrollbar最大1本。**工数 M〜L**。

#### P1-06 基本操作のfocus・touch・keyboard contractを統一する

- 画面遷移時にscroll/focusが残る。郷D-padと「見渡す」はpointer-only。Homeの主要操作には高さ33〜41pxが多い。
- ScreenShellで進入focusと戻り復元、郷にEnter/Space/key-up、横札に頁点・左右button、主要touch targetは原則44pxを採用する。
- **受入**: 主要画面進入`scrollY=0`とh1 focus、戻り±20px。郷全操作がpointer/keyboard両方で動作。390pxで誤tap0。WCAG 2.2 AAの24px最低条件を満たし、主要操作は快適性目標44px。**工数 M**。

#### P1-07 復旧可能なセーブを正しく書き出し、クラッシュから戻せるようにする

- `inspectSaveSlot()`はBAKのみ正常でもrecoverableだが、`downloadSave()`は未検証mainだけを書き出す。root Error Boundaryもない。
- main/BAK/旧版から検証済み最新候補を移行・正規化してexport。最上位Error Boundaryに再読込、正常save書出し、匿名診断IDコピーを置く。
- **受入**: 破損main＋正常BAK、BAKのみ、旧版のみでexport→import同値。強制throw E2Eで復旧面が出る。**工数 M**。

#### P1-08 共有stagingと実ブラウザCIを本番前へ置く

- main pushがPages本番へ直結し、共有staging、branch protection、ruleset、PR Playwrightがない。
- PRごとにpreview URL、mainにrequired checksとPR必須、force-push禁止。PRはPC1280/mobile390の初回主経路smoke、nightlyで5幅full。closure/manifestもCIへ入れる。
- **受入**: PRから固定previewを開け、故意のoverflowでCI失敗、main直接push拒否、本番昇格手順が1枚に収まる。**工数 M**。

#### P1-09 低性能環境と初期loadを品質gateにする

- 既存headless baselineはDungeon PC平均2.7fps、mobile 6.2fpsで、現在gateは`fps > 1`だけ。main JS gzip 430.89kB、画像artifact約242MB。
- 物理端末で10分gate、低負荷mode自動提案。Title/Home、Pact、Battle、Codex/Forge、Scenes、重量dataをroute分割。参照allowlistとWebP/AVIF変換でartifactを削る。
- **受入**: 合意端末でPC平均55、mobile平均30、1% low 24、100ms超jank毎分1以下。初期JS gzip 250kB以下、未訪問chunk未取得、artifact 100MB未満、画像欠落0。field Web Vitalsはp75でLCP 2.5s以下、INP 200ms以下、CLS 0.1以下を目安。**工数 L**。

#### P1-10 既存collection、事件、家訓を長期の意味へ変える

- 宝具54棚は記録できるが総合収集分母と節目演出が弱い。inventoryは増え続け整理手段がない。事件効果は即時資源へ収束。家訓は同一当主中に無料変更できる。
- 棚5/10/15段で非戦力の小話・額装・称号を一度だけ解禁。保護・favorite・undo付き「郷へ納める」。露出上位20事件だけを性格、携行品、過去選択、地域記憶へ接続。家訓は当主ごと一度、変更するなら月消費。
- **受入**: milestone重複0、200品を5操作以内で安全整理、上位20事件に永続結果/後日談、同一当主の無償家訓切替不可。**工数 L**。

#### P1-11 時間表記・件数・versionの正典を一致させる

- Chronicle/Dungeonは`seasonIndex / 12`、Ending/共有画像は`/4`。STATUS冒頭は敵147基礎の旧値、titleは`ver 0.1`、packageは`0.0.0`、tagは`v0.2.0`。
- 月→年換算helperとbuild metadataを単一情報源にし、README/STATUS/GDD/表示をruntime countで検査する。
- **受入**: 同一saveの全画面年数一致、表示version/package/tag/SHA追跡可能、恒常warn 0。**工数 S〜M**。

### P2 — 基盤成熟

| ID | 改善 | 受入 | 工数 |
|---|---|---|---:|
| P2-01 | 暗部の閲覧tokenと操作tokenを分ける。無効/通常/選択/推奨を色以外でも示す | 本文4.5:1、UI境界3:1、grayscaleでも4状態識別 | M |
| P2-02 | 各面の主役を一つにする。星契り=御影、宝具録=棚、出立=現在地域＋隊 | 5秒testで80%以上が画面目的と次操作を回答 | L |
| P2-03 | save schemaをversion付きで全構造検証し、migration冪等・fuzzを追加 | 破損fieldを早期拒否、未知field方針明記 | M |
| P2-04 | deploy後production smoke、rollback runbook、commit SHA表示 | HTML/hash asset/title/new gameを自動確認 | S |
| P2-05 | Actions SHA pin、月次Dependabot、production audit | `npm audit --omit=dev` 0、未固定Action 0 | S |
| P2-06 | analytics placeholder時は外部scriptを読まず、faviconをBASE_URL対応 | placeholder request 0、favicon 200 | S |

## 5. 画面別の改善要約

| 面 | 残す強み | 次に直す一手 |
|---|---|---|
| Title | 一枚絵、余白、明快な入口 | mode差を「敵数値22%緩和」だけでなく推奨対象・変更可否まで説明、version統一 |
| Home | 一族と今月の決断 | 警告/助言/診断を統合し、PC first viewへ主行動、日参りを後置 |
| 星契り | 神の御影、血潮予測 | 唯一親仮選択、推奨3〜5柱、全件は二次、roving tabindex |
| 出立 | 国絵図、地域画像 | mobile周辺絵巻、全体図sheet、選択直下に編成 |
| Dungeon | 灯と撤退 | checkpoint、深追い情報、低負荷mode |
| Battle | 美術、兆し、全戦闘オート | 序盤12敵の対処文法、勝因/敗因、campaign balance |
| 郷 | 歩ける空間、施設short-cut | keyboard操作、操作token、目的地への反応強化 |
| 鍛冶/蔵 | 目的指向推薦、53系譜 | 宝具検索配線、二重scroll解消、安全整理 |
| 家譜/図鑑 | 記録と再読 | 宝具を総合達成へ接続、節目の小話・額装 |
| 死/継承 | 生涯事実、辞世、形見 | 後継指名、約束、返歌、次代の一手を統合 |
| 設定/Save | dialog、Escape、外側click | recoverable export、永続保存案内、診断ID |

## 6. 実装順 — 6週間のbackcast

Wave 0はWave 1の基盤として第1週前半に重ね、Wave 1を第2週末、Wave 2を第4週末、Wave 3を第6週末までに閉じる。Wave 3のP1項目が収まらない場合は、後継指名・約束・返歌を優先し、宝具節目・事件20件・蔵整理を次cycleへ送る。最大工数をすべて直列加算して6週間を超える前提にはしない。

### Wave 0: 事実と安全を直す（3〜5日）

`宝具録検索 → scroll/focus → 郷keyboard → Home推薦矛盾 → recoverable export → 年数/version`。

ここは小さく、既知の誤動作を先に消す。完了後にPC/mobileの主経路smokeを固定する。

### Wave 1: 初回30分を縮約する（1〜2週）

local milestone、Home主CTA一本化、日参り後置、親/隊仮選択、星神推奨3〜5、初帰還までの一貫した案内を実装する。

### Wave 2: 遊びの判断を深くする（2週）

序盤12敵、兆し、campaign sim、Dungeon checkpoint、深追いSheet、mobile出立を実装する。全戦闘オートと同報酬は不変。

### Wave 3: 「この家の物語」にする（2週）

後継指名、残す約束、生涯2事実の返歌、継承Sheet、宝具節目、上位20事件の後日談、蔵整理を実装する。

### 並行lane: 公開品質

PR preview、branch protection、browser smoke、Error Boundary、route split、実機performance gateをWave 0〜3と並行する。本番pushは各Waveの実ユーザーgate後だけ行う。

## 7. KPI tree

**North Star**: 週次命脈サイクル完了率  
`約束を残した → 一度帰還した → 死/継承が起きた → 次代で一月進めた`匿名saveの割合。

| 段階 | KPI | 暫定合格 |
|---|---|---:|
| Activation | 契り→誕生を無介助で完了 | 初見8名中6名 / 10分以内 |
| First value | 初帰還または意図的安全中断 | 初見8名中6名 / 30分以内 |
| Comprehension | 危機、敵対処、深追い理由を説明 | 各8名中6名 |
| Legacy | 初継承までの時間 | 5名中央値45分以内 |
| Continuation | 継承後に自発的に次月開始 | 5名中3名以上 |
| Causality | 「自分の選択が一族へ残った」 | 8名中6名が4/5以上 |
| Reliability | save loss / duplicate reward | 0 |
| Performance | 実機frameとfield Web Vitals | P1-09を満たす |

日参り受取、button数、画像数、総滞在時間、テスト件数はNorth Starにしない。

## 8. 今は作らないもの

- 神、敵、地域、装備、事件、辞世、立ち絵の追加量産。
- 新通貨、連続ログイン、期間限定、取り逃し、広告、ガチャ。
- 説明用の長いmodalや、初回を止める長文tutorial。
- 手動戦闘だけが得をする報酬、drop、称号。
- 再訪率とsave消失率を測る前のaccount、server、cloud save。
- 241MB全体をcacheするPWA。まず配信対象を減らす。
- 全画像の再生成。画面の主役と情報編集を先に直す。

## 9. 外部gateと未確定事項

- 初見8名、一世代5名の実ユーザー試験は未実施。上記の魅力KPIは仮説であり、外部観察で閉じる。
- 物理低性能端末の10分試験は未実施。headless SwiftShader値を実機合格とは扱わない。
- analytics provider、privacy文面、opt-outはユーザー判断が必要。決定前はlocal QA exportだけ実装可能。
- staging方式はGitHub PagesのPR previewか別Pages projectかを選ぶ必要がある。ただしmain保護とbrowser smokeは方式に依存せず先行できる。

## 10. 根拠となる基準

- WCAG 2.2 AAのTarget Size Minimumは原則24×24 CSS px。『灯継ぎ』ではmobile主要操作の快適性目標として44pxを採る: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- field性能はLCP、INP、CLSを実訪問の75 percentileで評価する: https://web.dev/articles/vitals
- 既存方針の正典: `docs/GDD_v3.md` §8.23〜8.24。
- 直前のプレイヤー魅力計画: `docs/CODEX_MASTERPLAN_PLAYER_APPEAL_20260721.md`。

## 11. 証拠の再取得

公開版の画面値はDevTools Consoleで再取得できる。

```js
({
  viewport: [innerWidth, innerHeight],
  scrollY,
  scrollHeight: document.documentElement.scrollHeight,
  buttons: document.querySelectorAll('button').length,
  godRows: document.querySelectorAll('.god-row').length,
  starCtas: [...document.querySelectorAll('button')]
    .filter((b) => (b.textContent ?? '').includes('星契りへ')).length,
})
```

repoの量と配信容量は以下を基準に再取得する。

```powershell
npx tsx -e "import {ENEMIES} from './src/core/data/enemies.ts'; const b=ENEMIES.filter(e=>!e.id.endsWith('_w')&&!e.id.endsWith('_o')&&e.tier!==5); console.log(b.reduce((a,e)=>(a[e.skillIds.length]=(a[e.skillIds.length]??0)+1,a),{}))"
Get-ChildItem public -Recurse -File | Measure-Object Length -Sum
npm run lint
npm test
npm run check:visual-closure
npm run check:visual-manifest
npm run build
```
