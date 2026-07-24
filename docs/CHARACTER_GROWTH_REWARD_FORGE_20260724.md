# 燈守家・資質成長と戦果見立て 強化設計

作成日: 2026-07-24
状態: 実装前設計（runtime・save・公開環境は未変更）
対象: 一族のレベル成長、資質上限、戦闘経験、戦闘開始時の報酬表示、勝利結果

## 1. 結論

レベルを既存能力へ掛ける減算倍率にはしない。現行の `potential × AGE_CURVE` をレベル1の基準として保存し、レベルはそこへ「資質を戦場で引き出した熟達分」を加える。これにより、新規人物も旧save人物も導入前より弱くならない。

現在の「報酬予告スロット」は廃止し、勝利時に確定している値を示す「戦果見立て」へ置き換える。確率で起きる眷属化などは確定報酬に混ぜず、「縁の兆し 4%」として別表示する。

育成判断は、レベルアップごとの割り振りmodalでは作らない。誰を出陣させるか、どの資質を血珠鍛錬するか、短い寿命の誰へ経験を集中させるかで作る。レベルアップは自動処理し、オート戦闘を止めない。

## 2. 現行実装から動かさない契約

- `potential` は血潮・鍛錬を含む資質であり、0〜120の範囲を維持する。
- `AGE_CURVE` は0〜23月の発現率であり、16〜19月前後の全盛と晩年の衰えを維持する。
- 血珠鍛錬は `potential +3`、上限120、`trainingMarks` に履歴を残す現行契約を維持する。
- レベル熟達は `potential` に書き戻さない。したがって子への遺伝値、隔世遺伝、神童判定を汚染しない。
- 全戦闘でオートを利用でき、手動とオートで経験、通貨、drop、図鑑、称号に差を作らない。
- 新通貨、日次報酬、期間限定、課金、FOMO、画像素材は追加しない。
- UI効果音は `main.tsx` の共通処理を使い、個別実装しない。

## 3. データモデル

`Character` に次を追加する。

```ts
level: number       // 1..levelCap
exp: number         // 現レベル内の経験。上限時は0
```

成長量、成長上限、資質段階は保存せず純粋関数から導出する。保存値の二重正典化を避ける。

推奨する新規module:

```text
src/core/character_progression.ts
  aptitudeScore(character)
  levelCap(character)
  growthCapacity(character, stat)
  growthBonus(character, stat)
  xpToNext(level)
  battleXp(rewardContext)
  grantBattleXp(character, amount)
  migrateCharacterProgression(character)

src/core/battle_rewards.ts
  createBattleRewardPlan(context)
  applyBattleRewardPlan(plan, state, rng)
```

## 4. レベル上限

六能力の単純平均だけでは尖った人物が過小評価されるため、全体と上位2資質を合わせる。

```ts
meanAll = 六資質の平均
meanTop2 = 上位2資質の平均
aptitudeScore = round(meanAll * 0.6 + meanTop2 * 0.4)
```

| aptitudeScore | レベル上限 | 表示 |
|---:|---:|---|
| 0〜44 | 8 | 堅実 |
| 45〜59 | 9 | 伸び盛り |
| 60〜74 | 10 | 俊英 |
| 75〜89 | 11 | 秀抜 |
| 90以上 | 12 | 星器 |

初代燈吾は現行資質なら `aptitudeScore = 50`、上限9になる。上限名称は人物の格付けとして強調せず、詳細画面の補助語に留める。

鍛錬で資質が閾値を越えた場合はlevelCapが上がる。現在レベルと経験は失わない。levelCapは下がらない現行操作だけで構成されるが、破損save正規化時は `level = min(level, levelCap)` とする。

## 5. 能力ごとの成長上限と成長度

レベル1では現行能力値をそのまま維持し、レベル2以降に熟達bonusを加える。

```ts
growthRate[k] = 0.8 + 0.7 * (potential[k] / 120)
growthBonus[k] = round((level - 1) * growthRate[k])
growthCapacity[k] = round((levelCap - 1) * growthRate[k])
effectivePotential[k] = potential[k] + growthBonus[k]
stats[k] = max(1, round(effectivePotential[k] * AGE_CURVE[age]))
```

この式の契約:

- Lv1の `growthBonus` は必ず0で、導入前の能力値と一致する。
- 高資質ほど1level当たりの伸びが大きい。
- レベル上限では各能力が固有の `growthCapacity` へ到達する。
- 鍛錬でlevelCapが上がっても、分母が変化して既得bonusが減ることはない。
- 晩年は `AGE_CURVE` が最後に掛かるため、熟達しても老いを無効化しない。
- `potential` は120を超えないが、Lv12の熟達込み戦闘能力は最大137相当まで許容する。
- 再計算時はHP/MPの割合を維持する。戦闘中のレベルアップは勝利確定後に処理し、戦闘を遡って回復させない。

資質段階は能力ごとに次の表示とする。

| potential | 表示 | 成長説明 |
|---:|---|---|
| 0〜39 | 苦手 | ゆるやかに伸びる |
| 40〜54 | 並 | 素直に伸びる |
| 55〜69 | 得意 | 早く伸びる |
| 70〜89 | 秀 | 大きく伸びる |
| 90〜120 | 極 | 星器の域まで伸びる |

内部数値だけでなく、「力は大きく伸びる」「心はゆるやかに伸びる」など、資質別の成長率を短文へ変換して表示する。早熟／晩成は現行データに能力別の時期差がないため表示しない。

## 6. 経験値

```ts
baseXp = sum(enemy.tier * 5)
battleXp = baseXp
  + (boss ? 20 : 0)
  + (rare ? 8 : 0)
  + (nemesis ? 8 : 0)

xpToNext(level) = 10 + 4 * level
```

初期仮値のtier係数3は100-seed実storeで初回3戦後Lv1が56%、生涯上限到達3.0%となり、§13の目標より遅かった。2026-07-24のMission実測に基づき、正本が指定する最初の調整軸だけを3→5へ変更した。敵能力、寿命、`AGE_CURVE`、通貨は変更しない。

### 付与規則

- 勝利時、出陣した存命人物全員へ同量を付与する。人数割りしない。
- 戦闘終了時HPが0でも、一族として死亡していなければ受け取る。
- 逃走・敗北では付与しない。
- 一戦で複数レベル上昇できる。
- 上限到達時はexpを0にして余剰を蓄積しない。
- 金影、狂乱、商売家訓、福運、眷属の福は経済補正であり、経験値を倍率化しない。
- 経験値は戦闘勝利時に即時確定する。探索の持ち帰り通貨とは分ける。
- 誰を育てるかは出陣選択で決まる。留守番全員への経験配布は行わない。

初期値は仮値であり、後述の100-seed基準を満たさない場合だけ調整する。式や閾値を画面へ直接表示しない。

## 7. 旧save移行

`normalizeLoadedData` の早い段階で、全人物へ冪等な `migrateCharacterProgression` を適用する。

`level` または `exp` が欠ける人物は、既存の戦歴を遡及評価する。

```ts
legacyXp = kills * 3 + expeditions * 4
level = 1
exp = legacyXp
while (level < levelCap && exp >= xpToNext(level)) {
  exp -= xpToNext(level)
  level += 1
}
if (level === levelCap) exp = 0
```

この移行なら未出陣人物はLv1のままで能力が変わらず、歴戦人物は戦歴相当の熟達bonusだけ増える。全人物を上限へ置く移行は、旧saveだけ育成が終わるため採用しない。

save validation:

- 欠落は旧saveとして許容する。
- 存在するlevelは有限整数かつ1以上、expは有限整数かつ0以上を要求し、NaN、Infinity、負数、小数はsave不正としてBAK復旧経路へ送る。
- 有効な整数だが `level > levelCap` の場合はlevelCapへclampする。`exp >= xpToNext(level)` は通常の複数level上昇処理で消費し、cap到達時は0にする。
- migration後は必ずlevelCap内へ正規化する。
- migrationは2回通して同一JSONになることを検査する。
- HP/MPは再計算前の割合を維持し、現在値を最大値内へclampする。
- 旧人物の六能力、最大HP、最大MPは移行前より一つも低下させない。

## 8. 戦果計算の単一正典

戦闘開始時に純粋関数で `BattleRewardPlan` を一度だけ作り、transientな `BattleState.rewardPlan` として保持する。save対象にはしない。UIと勝利処理はこの同じplanを読み、途中の再計算によるdriftを防ぐ。

```ts
interface BattleRewardPlan {
  settlementId: string
  carried: {
    hoto: number
    ketsu: number
    rareDrop?: Item
  }
  immediate: {
    partyXp: number
    fame?: number
    memorialKind?: 'nemesis_weapon'
    loreCompletionHoto?: number
  }
  modifiers: Array<{
    id: string
    label: string
    multiplier?: number
  }>
  familiarCandidates: Array<{
    enemyId: string
    enemyName: string
    probability: 0.04
  }>
  nextPhase?: 'shiori_duel'
}

interface BattleRewardResult {
  settlementId: string
  carried: { hoto: number; ketsu: number; items: Item[] }
  immediate: {
    partyXp: number
    fame: number
    memorials: Item[]
    loreHoto: number
    familiars: Array<{ enemyId: string; name: string }>
  }
  growth: Array<{
    charId: string
    beforeLevel: number
    afterLevel: number
    beforeExp: number
    afterExp: number
    statDelta: Partial<Stats>
    maxHpDelta: number
    maxMpDelta: number
  }>
}

interface BattleRewardSettlement {
  status: 'planned' | 'settled' | 'continued'
  plan: BattleRewardPlan
  result?: BattleRewardResult
}
```

`settlementId` はRNGを使わない遭遇固有tokenとし、同じ `BattleState` 内で不変にする。store内の単調なbattle sequenceと遭遇元IDを組み合わせ、saveへは永続化しない。

### 精算の一回性

現行の `finishBattle()` は報酬付与と結果画面からの退出を同時に行うため、そのままでは付与後のlevel差分を結果画面へ出せない。次の二actionへ分ける。

```text
settleBattleVictory()
  plannedの時だけplanを適用する
  確率抽選、XP、level差分、今回戦果をresultへ固定する
  statusをsettledへ変え、battle画面には留まる

continueAfterBattle()
  settledの時だけstatusをcontinuedへ先に変える
  dungeon / expedition / finaleへ遷移する
```

- battleがwonになった直後のeffectは `settleBattleVictory()` だけを呼ぶ。
- 手動CTAとオートtimerは `status === 'settled'` になってから `continueAfterBattle()` だけを呼ぶ。
- UIはplanで予告し、resultができるまで勝利明細を描画しない。
- `settleBattleVictory()` はsettled/continuedでno-op、`continueAfterBattle()` はplanned/continuedでno-opとする。
- Zustandの同期set内でstatus確認と更新を一体化し、二つのeffect、CTA double click、手動CTAとオートtimerの同時発火でも二重付与しない。
- 既存 `finishBattle` を互換wrapperとして残す場合も、内部では上記guardを必ず通す。
- 逃走・敗北は報酬resultを作らず既存処理へ進むが、画面退出は同じcontinued guardで二重遷移を防ぐ。

### 確定と確率を混ぜない

- 奉燈、血珠、経験値、稀相遺物は確定欄に出す。
- 宿敵戦は「形見の武具・確定」まで表示し、乱数確定前の名称は出さない。
- 眷属化は現行どおり「未所持かつtier 4以下の一意な敵種ごとに4%」を維持し、可能性欄に出す。
- active familiarの星属性による1.1倍補正は確定modifier、勝利時の新規眷属化4%はchanceとして別ID・別表示にする。
- 抽選前に眷属名や武具名を偽って予告しない。
- plan生成はRNGを一切消費しない。
- 眷属候補は敵定義の出現順で一意化し、候補ごとに既存RNGの `chance(0.04)` を正確に一度ずつ呼ぶ。複数成功も許容し、結果画面では実際に加わった眷属だけを表示する。
- 候補数Nに対する「いずれか成功」の参考確率は `1 - 0.96^N` で純粋導出する。これは表示専用で、抽選回数や結果には使わない。
- 玄冬から汐里への二段戦は「連戦へ」を表示し、中間で得られない戦果を見せない。
- 汐里戦の勝利は現行どおりfinaleへ直結するため、通常の携行通貨・経験値を予告せず「千年の勝鬨 — 結末へ」と表示する。最終画面直前に用途のない経験値を付与しない。
- `dungeon`、`dungeonBoss`、旧 `expedition/node` の両経路を同じplan生成へ接続する。

報酬の行き先を型上も分ける。

- `carried`: 探索lootへ加わり、帰還で確定する奉燈・血珠・遺物。
- `immediate`: 経験、武功、形見、図鑑、土地の記など勝利時に即時確定するもの。
- `chance`: 勝利時に候補敵種ごとに抽選する眷属化。

この区別により「今回得た」「探索中に携えている」「帰還済み」をUIで混同しない。

## 9. 報酬ルーレットの置換UI

名称を「報酬予告」から「戦果見立て」へ変更する。スロットのランダム回転は廃止する。

### 戦闘開始時

600〜800msで和紙札が順に開く演出にする。内容は初めから実planへ固定し、抽選を装わない。

```text
勝利時の戦果
奉燈 24　血珠 2　経験 12
稀相遺物 確定
```

表示後は上端予約帯で次の一行chipへ畳む。

```text
戦果見立て　奉燈24・血珠2・経験12　詳細
```

- mobileでは数値3件を一行に収め、特別枠は印だけにする。
- `prefers-reduced-motion` では開札animationなしで即時chip表示する。
- animation終了後も情報を消さない。詳細からいつでも再確認できる。
- 戦場、行動順、敵兆し、設定buttonと同じposition層へ侵入させない。
- 色だけで確定／可能性を区別しない。「確定」「4%」を文字で書く。

### 詳細popover

```text
確定するもの
  奉燈 24（基本16 × 金影2.5 × 商売1.08 の丸め後）
  血珠 2
  経験 12（出陣者それぞれ）

起こるかもしれないこと
  眷属の縁 各種4%（候補3種／いずれか約11.5%）
  候補: 提灯喰い、影鼠、夜雀

持ち帰り
  奉燈・血珠・遺物は帰還時に確定
  経験・武功はこの勝利で確定
```

外側click、Escape、閉じるbuttonで閉じ、起点へfocusを戻す。dialogにせず非modal popoverを基本とし、戦闘操作を止めない。

## 10. 勝利結果とレベルアップ

勝利画面は次の順序に固定する。

1. 勝利／鎮魂の一文
2. 今回の戦果
3. 精算済みresultに含まれる成長人物
4. 携行中の探索累計
5. 次へ進むbutton

```text
今回の戦果
奉燈 +24　血珠 +2　経験 +12

燈吾　Lv3 → Lv4
力 +1　体 +2　最大体力 +5

携行中
奉燈 86　血珠 7　遺物 2
帰還すると獲得が確定します
```

### 表示密度

- 一人の成長札をPC横幅いっぱいにしない。幅220〜280pxを基本とする。
- PCは最大4列、mobileは1列の短い札または横送りとする。
- 能力変化は増加量の大きい上位3件まで。全内訳は人物詳細へ送る。
- レベル上昇なしの場合、経験barだけを小さく更新し、人物札を増やさない。
- オート戦闘は止めない。精算完了後から既存の約2.8秒timerを開始し、1行成長要約を収め、「ここで止める」を維持する。
- level upを見逃しても、一族詳細で現在level、上限、次までの経験を常に確認できる。

button文言は処理と合わせる。

- dungeon勝利: `戦果を携えて進む`
- 即時確定だけの特殊戦: `勝鬨を刻む`
- 逃走: `先へ`
- 敗北: `帰り火へ`

## 11. 一族画面の情報設計

### 一族小札

常時表示は以下だけに限定する。

- `Lv 3 / 9`
- 次までの細い経験bar
- 上位資質2つ（例: `体 得意`、`力 並`）
- 上限到達時は `資質開花`

既存の横送り小札の幅を維持し、level情報の追加で氏名を縦書き状にしない。

### 人物詳細

各能力を次の一行で示す。

```text
力　現在42　資質52　鍛錬1回　熟達+2　年齢上限43　得意
```

同時に見せる概念は3層までにする。

1. 現在値
2. 現在資質と鍛錬回数
3. レベル熟達と現在年齢での上限

`trainingMarks` は回数であり、119→120のように最後の上昇が+3未満になる場合がある。したがって `potential - trainingMarks * 3` を「生来値」として表示してはならない。現行saveから正確な生来値は復元できないため、現在資質と鍛錬回数を別々に表示する。数式そのものはtooltipまたは説明へ退避する。

## 12. プレイヤーが行う育成判断

レベルアップ時の毎回選択は追加しない。短命な複数人物へmodalを連発すると、オート戦闘と世代進行を阻害するためである。

判断は既存ループへ接続する。

- 出陣: 誰へ経験を与えるか。
- 鍛錬: 現在の苦手を補うか、得意とレベル上限を伸ばすか。
- 星契り: 次代の資質上限と専門性をどう組むか。
- 継承: 高levelの現当主を使い切るか、次代へ出陣機会を渡すか。
- 装備: 今の強さを補うか、未熟な次代を安全に育てるか。

画面上では「あと2戦ほどでLv4」のような概算を出さない。敵編成で経験が変わるため、誤誘導になる。代わりに正確な `現在exp / 次に必要なexp` を表示する。

## 13. バランスgate

実装前に現行 `tests/m43_journey_metrics.test.ts` の100-seed結果をJSONで保存し、変更後と比較する。

blocking基準:

- firstBossRateが現行より5 percentage points以上低下する。
- endgameReachRateが現行より5 points以上低下する。
- averageBossRegionCompletionRateが現行許容範囲0.85〜0.95を外れる。
- allBossRegionsRateが現行許容範囲0.01〜0.10を外れる。
- 平均世代が2未満になる。
- 敗北復帰月p90が2を超える。
- 同一seedの結果が非決定的になる。
- 初代が自然な3回の雑兵戦後もLv1のまま、またはLv5以上になる。
- 現役人物の50%以上が死亡前にlevelCapへ到達する。
- 出陣経験のある人物の50%以上が死亡時Lv2以下に留まる。

目標分布:

- 初代: 初回地域の通常戦3回でLv2〜3。
- 一般人物: 現役期間に上限の60〜85%へ到達。
- 上限到達者: 出陣経験のある人物の10〜30%。
- 高資質者は最終能力が高いだけでなく、同level帯で熟達の立ち上がりが早い。

これを満たさない場合、最初にXP係数と `xpToNext` を調整する。`AGE_CURVE`、寿命、敵能力、通貨量を同時に触らない。

## 14. テスト

### progression unit

- Lv1で現行 `potential × AGE_CURVE` と完全一致する。
- level、age、potentialの境界値でNaN、Infinity、負数が出ない。
- level上昇で各能力が減らない。
- age固定時、上限を超えない。
- 同じlevelで高資質ほどgrowthCapacityと成長率が低くならない。
- 鍛錬後に現在能力、levelCapが低下しない。
- 一戦で複数levelへ上がれる。
- cap到達時expが0になる。
- level bonusが子のpotentialへ遺伝しない。

### migration/save unit

- level/exp欠落saveを受理して正規化する。
- NaN、Infinity、負数、小数のlevel/expをsave不正として検出し、levelCap超過と閾値超過の有限整数だけを決定的に正規化する。
- migrationを2回通して同じJSONになる。
- 戦歴0人物の能力、最大HP、最大MPが移行前と一致する。
- 歴戦人物は一能力も移行前より低下しない。
- main/BAK/export/importの全経路でprogressionが保持される。

### reward unit

- normal、elite、boss、golden、frantic、motto、boon、familiar補正でplanと付与通貨が一致する。
- rareDrop、nemesis memorial、lore completion、final two-phaseを個別に検査する。
- familiarは候補敵種ごとの確率欄にだけ入り、確定欄へ入らない。
- familiar候補0/1/3種、既所持除外、boss/nemesis/rare除外、候補順、候補数と同数のRNG消費、複数成功を検査する。
- plan生成前後でRNG状態が変化しない。
- 同じsettlementIdへのsettle二回、手動CTAとauto同時発火、CTA double clickで通貨、XP、drop、levelが一度しか増えない。
- result生成前には勝利明細を表示せず、settled後はplanでなく固定resultを表示する。
- 手動／全オート3方針でXP、通貨、drop、抽選回数が一致する。
- 手動／全オートで図鑑、称号、武功、事績、土地の記、眷属結果も一致する。
- dungeonとlegacy expeditionの二経路で同じ敵・補正なら同じplanになる。

### UI/visual/a11y

- PC 1280×720、mobile 390×844を最低基準にする。
- 上端予約帯で行動順、戦果見立て、設定が重ならない。
- 戦果chipを開閉でき、Escapeとfocus復帰が働く。
- 確定と確率を文字だけで識別できる。
- level-up札1枚がPC全幅へ伸びない。
- 4人同時level-upでもCTAがviewport外へ迷子にならない。
- 200% zoom、reduced-motion、keyboard onlyを確認する。
- `aria-live` は勝利結果を一度だけ読み、開札animationの各段階を連続読み上げしない。

### 出荷前gate

```text
npm run lint
node scripts/validate_data.mjs
npx vitest run
npm run build
関連Playwright
100-seed campaign
git diff --check
```

## 15. 実装順序と自己修復境界

1. 現行100-seed基準線を固定する。
2. progression純粋関数とunit testを先に実装する。
3. save migration、validation、export/importを接続する。
4. Character生成、再計算、鍛錬を接続する。
5. reward plan、settlement state、resultを導入し、dungeonとlegacy expeditionの二重計算、勝利XP、確率抽選を統合する。
6. 戦果見立て、勝利結果、一族小札、人物詳細を接続する。
7. PC/mobile実画面、100-seed、全gateを実行する。
8. 数値調整はXP係数と必要経験だけに限定して再検証する。

実装途中で既存バランスが崩れた場合、敵能力や寿命を同時に調整して帳尻を合わせない。原因が成長量なら `growthRate` の係数、進度ならXPだけを限定修正する。

## 16. 受入条件

- 新規人物のLv1能力が導入前と一致し、旧save人物が弱体化しない。
- 資質がlevel上限、能力別の伸び方、最終熟達量へ一貫して反映される。
- level熟達は遺伝せず、鍛錬と生来資質の意味を維持する。
- 戦闘前表示は確定報酬と確率結果を明確に分離する。
- 表示した確定報酬と実付与が、全戦闘経路・全オート方針で一致する。
- 報酬付与と画面退出を分離し、同じsettlementIdを手動・オート・double clickで二重精算できない。
- 眷属化は候補敵種ごと4%の現行規則、候補順、RNG消費回数、複数成功を維持し、表示確率と一致する。
- 今回戦果、即時確定、携行中、帰還確定の区別を初見で説明できる。
- level-up表示がオート戦闘を止めず、PC/mobileで過密・全幅札・CTA見失いを起こさない。
- save、unit、visual、100-seed、lint、buildが全てgreenになる。
- GDD_v3、STATUS、WORKLOGへ最終式、移行、調整値、検証結果を記録する。
- commit、push、deployはユーザーの明示承認まで行わない。

## 17. スコープ外

- スキルツリー、転職、レベルリセット、経験値item、経験値課金。
- 毎levelの能力割り振りmodal。
- 敵のレベル同期、プレイヤーlevelに応じた動的スケーリング。
- levelを条件にした期間限定報酬。
- 新規画像、通貨、ガチャ、実日付streak。

これらは現在の「短命、世代交代、資質と選択」の焦点を薄め、検証面を過度に増やすため、本実装には含めない。
