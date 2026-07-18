# MISSION M33: M32次段送り項目の完遂 — STATE

作成: 2026-07-18。/mission 起動(ユーザー=「次段へ送った設計判断を全て対応終わらせて」)。前提: M32(MISSION_M32_AUDIT2.md ⑪)で報告のみ・次段送りとした設計判断/技術債/UX項目を全て実装する。M32本体は公開デプロイ済(達成)。

## ①契約(ドラフト — 発見エージェント回収後に確定)
**ゴール**: M32 ⑪「報告のみ(設計/大規模/要リファクタ)」全17項を実装し、証跡で確定する。
**監査区分**: 自己監査(push無し・git可逆)。push=公開デプロイは完了定義に含めない(達成後に別途ユーザー確認)。
**完了の定義(項目別)**:
- バランス(設計判断・balance_sim緑をガードに、値の根拠をWORKLOG/GDDへ記録して受入):
  1. buff技power反映 — バフ効果量がskill.power依存(大防御48>守り30)。単体テストで単調性固定。
  2. defUp対称化 — atkUp/defUpの実効が対称(現状 ×1.25 / ÷1.2 の非対称是正)。
  3. 玄冬の難易度崖緩和 — balance_simで最終盤の瀕死率の崖を緩和(測定メトリクスを追加/利用)。
  4. 回復薬の段階追加 — 消耗品にtier段階を追加。validate_data緑・辞世/id重複0。
  5. 装備価格カーブ緩和 — tier14の性能あたり価格倍率を圧縮(既存テストがあれば再ピン)。
- 技術債:
  6. bundle分割 — dynamic importでchunk分割、最大chunk<現状1,781kB。build緑。
  7. perf.spec閾値 — 実測ベースの緩め閾値を追加(flaky回避)。
  8. 複数タブ保存競合検知 — storage event/BroadcastChannelでクロスタブ検知+穏当な警告。
  9. 歩行ダンジョンcheckpoint — dungeonRunをGameDataへ永続化しcrash/タブ閉じ耐性。isValidSaveも追随。
  10. sealBoss/renderFailedテスト — used-key生成とボス床列挙を純関数抽出しvitestで固定。
- UX/a11y(純属性・後勝ちCSS。index.css不改変):
  11. ActionDock safe-area — env(safe-area-inset-bottom)反映(後勝ちCSS)。
  12. filter-tab 44px — min-height:44px。
  13. Codex aria-current — 選択カードに付与。
  14. 技MP mobileラベル — mobile幅でMP消費を可視。
  15. 交神推奨★ — Pact神一覧に推奨マーク。
- セーブ堅牢化:
  16. 季非消費操作の即保存 — assignTomoshigata/assignJobClass/setMotto/setLastWords/renameCharacterでsaveGame。
  17. 保存通知ラッチの深刻度別化 — 単一ラッチを深刻度別フラグへ。
**スコープ外**: push/公開デプロイ・index.css直接編集・maps.gen.ts手編集・GDD正典の大改訂(根拠追記はする)・**新規導線(HelpModal/tutorial)= ⑩I-F HIGHだが⑪未記載の大機能。別ミッション扱いで本契約外**(必要ならユーザー指示で追加)。
**受入方法**: 機械検証(tsc -b/oxlint/vitest/vite build/validate_data/playwright)。バランス値は balance_sim緑+根拠記録で受入。

## ②作業分解(3マイルストーン・依存順)
- **M1 低リスク(polish/save堅牢化)**: 11,12,13,14,15,16,17 — 並列sonnet(ファイル所有分割)。純属性/局所追加。
- **M2 技術債**: 8,9,10,6,7 — エンジニアリング。9はセーブ系(M32硬化と干渉注意)、10は純関数抽出。
- **M3 バランス(設計判断・指揮側 opus)**: 1,2 → sim → 3 → 4,5。balance_sim を各変更後に再実行。1は70件超波及=最難所。

## ③完了済み
(実行前)

## 発見①: バランス(agent回収 2026-07-18)
- **#1 buff power無視**: `battle.ts:267` `buffMult=(atkUp?1.25:1)/(defUp?1.2:1)` powerを見ない。付与`battle.ts:341-353`はbuffsに残ターン`3`のみ格納。`types.ts:228` `buffs:{atkUp?:number;defUp?:number}`=**残ターン専用でmagnitude枠が無い**。decay `battle.ts:399-406`。バフ技**79件**(atk34/def45)power26-72。ガード=`regression_m29.test.ts:60-104`はbuffKind分類のみ(powerは非検証・壊れない)。
- **#2 defUp非対称**: 同`battle.ts:267`。atkUp×1.25(+25%)/ defUp÷1.2(実効-16.7%)。→**#1と統合**: `(1+atkMag)/(1+defMag)` の対称式にすれば同時解決。
- **設計(#1+#2統合・低リスク加算方式)**: `buffs`にmagnitude枠を**追加**(既存の残ターンatkUp/defUpは不変): `{atkUp?,defUp?,atkMag?,defMag?}`。付与時 `mag=clamp(0.12+power*0.003, 0.15, 0.40)`(power26→0.20/40→0.24/48→0.26/72→0.34、中央≈0.25で現行+0.25と整合、大防御48>守り30が単調)。読取 `buffMult=(1+(atkMag??0))/(1+(defMag??0))`。decayでturnsが尽きたらmagもクリア。単体テストで単調性固定。**balance_sim緑を各変更後に再実行**(simがバフ技を使う場合は式定数を微調整)。
- **#3 玄冬崖**: 地域`akashi_miyama`(fame520=FAME_SEAL_THRESHOLD)ボス`boss_gentou`(hp2400/atk85/def40)。直前ボス列 maeburenokage(hp1100!←tier3のhoshimukuro1600を下回るディップ)→1950→2100→2400。`balance_sim.test.ts`は`nearDeathRate`を**計算済みだがexpect未接続**(console出力のみ・崖でCI落ちない)。sim代役`合成玄冬`はskillIdsがhoshimukuro流用で非忠実。→**(1)nearDeathRateをexpect接続(崖をゲート化)(2)簡易玄冬をboss_gentou実kitへ(3)pre-boss列のディップ是正+閾値で滑らかなランプに**。
- **#4 回復薬段階**: `consumables.ts:20-53` **4件のみ**(hp60/hp165/mp45/party75)。tier枠無し・全件開始直後から購入可(equipmentはregionsClearedで15段ゲート)。ガード`consumables.test.ts:114-124`はid一意/price>0/amount>0/stat/scopeのみ。→**HP上位・party上位・MP上位・(蘇生?)を追加、`unlockFame`等の解放ゲートをConsumableDef+buyConsumable+Forge表示へ**。
- **#5 価格カーブ**: `items.ts:275` `price=round(basePrice*1.52^i)` 性能は`growth^i`(1.17-1.20)。乖離でtier0→14=27倍(charmは39倍)。無テスト。`FOUNDING_ITEMS`は別系で非影響。→**1.52を性能growth連動値へ圧縮(例 growth*1.15)。price/perf比の上限をピンする新テスト追加で固定**。

## ④保留リスト
(なし)

## ⑤質問キュー
(なし — 新規導線はスコープ外として先出し。異論あればユーザー割り込み)

## 発見②③: save/技術債・a11y(agent回収 2026-07-18)
- **⑥季非消費即保存**: `store.ts` assignTomoshigata(L790)/assignJobClass(L814)/setMotto(L840)/setLastWords(L931)/renameCharacter(L947)は`mutate`のみでsaveGame無し。`mutate`は`nd`を返す(L171)。→各末尾に`saveGame(get().data!)`。
- **⑦通知ラッチ**: `save.ts:25` `warnedThisSession`単一。L127/128=warn・**L139=critical(全段失敗)**・L194/200=info。→`warnedBySeverity{warn,critical}`+`warnOnce(msg,sev)`。
- **⑧複数タブ**: 検知皆無。→`save.ts`に`onExternalSaveChange(cb)`(storage event KEY/KEY_BAK)export、`App.tsx`のsink配線点(L36-45)でtoast警告。送信側無改修(setItemが自然発火)。警告のみ。
- **⑨checkpoint**: dungeonRunはGameStore(store.ts:69)でGameData外。dungeonReturn時のみ保存。→types.ts GameDataに`dungeonRun?`追加/store.ts dungeonAdvanceFloor(L1589)+finishBattle戦利品確定(L1870-1894)でcheckpoint保存/**continueGame(L585-614)がdungeonRun:nullを無条件で捨てるのを復元へ**/dungeonReturn(L1656)でクリア/isValidSave追随/Dungeon.tsx無改修。
- **⑩sealBoss純関数**: 新規`src/dungeon/usedTiles.ts`に`usedKey/isReusableGuardTile/findBossTiles/sealBossKeys`抽出、engine.ts(L860/871/886)が呼ぶだけに。PixiJS非依存でvitest可。renderFailedのwebglcontextlost系は別性質(playwright/heartbeat要)=切り分け報告。
- **⑪bundle**: 実測1,782kB単一。vite.config分割設定無し。App.tsx全画面静的import(switch L132-181)。Pixi依存はDungeon+Villageのみ。→両ScreenをReact.lazy+Suspense化でpixi/engineをmain chunkから外す。
- **a11y**: (a)`.shell.has-dock`(index.css:1678)静的96px vs dock自体env込み=不整合→shell_fix_m29.css後勝ち。`.pact-has-dock`→pact_m26.css。`.depart-m18-root.screen`→depart_m18.css。(b)`.filter-tab`(index.css:1598)40px<44px→shell_fix_m29.css。(c)Codex 4カード(is-selのみ)→aria-current。(d)`Battle.tsx:808` mp-cost裸数字(道具×countと骨格共有→CSS不可)→JSXに灯ラベル。(e)Pact god-row推奨★→recommendStat(当主最強素質×topBias一致)+pact_m26.css。

## ③実装済み
- **M1a完了**(UX/a11y 5件): filter-tab 44px・dock safe-area×3(shell/pact/depart)・Codex aria-current×4・技MP「灯」ラベル・Pact推奨★(当主最強素質×神topBias一致)。
- **M1b完了**(save堅牢化2件): 季非消費5操作の即saveGame・通知ラッチ深刻度別化(critical分離)。
- 検証: tsc0/lint0/vitest**553**緑。M1 playwright(codex/menu/battle/save系)実行中。

## ⑥マイルストーン履歴
- Phase0: 契約ドラフト+3発見エージェント投入→全回収→devil-advocate投入(2026-07-18)。
- M1: UX/a11y 5件+save堅牢化2件を適用。tsc0/lint0/vitest553緑(2026-07-18)。

## devil-advocate攻撃結果(2026-07-18・裏取り済・判定=否)
- **CRITICAL-1 ⑬⑮⑯の受入オラクル空虚**: `balance_sim.test.ts:48`味方policy=`{attack}`固定で味方はスキル/道具を撃たず、敵にbuff技0件。→buff式を変えてもsim出力バイト同一。「sim緑」は⑬⑮⑯を1ビットも保証しない(sim可視は⑭のボスstatのみ)。
- **CRITICAL-2 ⑨は設計反転**: `continueGame:610`が`dungeonRun:null`を毎ロード明示破棄=意図的「周回中は戻れない設計」。**WORKLOG裏取り: MISSION_M25_M26.md:25,161が「DungeonRunは永続化されない/変更はスコープ外の設計変更」と明記**。永続化は毎歩save→quota逼迫(M32硬化退行)・isValidSame全体reject・NG+汚染crashのリスク。
- **HIGH-1 ⑬式は中央≈現行でない**: 実power分布で atk34件平均mag0.244(≈横ばい)・def45件平均0.256(**clamp下限が効かず全件強化・被ダメ-16.7%→-20.4%**)。atk横ばい×def全面強化の非対称、⑭と重なり終盤二重易化。
- **HIGH-2 加算方式のstack上限/decay未定義**: 多人数バフ積みで青天井(mag0.24×3=0.72)のexploit。要:合計clamp+max上書き+反例vitest。
- **HIGH-3 4バランス全て同方向(易化)・3つ測定不能**: overshootで作業ゲー化。→⑭単独先行→現実policy sim整備→⑬⑮⑯を1つずつplaytest。
- **HIGH-4 ⑧警告のみ無実効**: last-writer-wins。喪失はtoastでは防げない。要read-only化 or reload、でなければ見送りが誠実。
- MEDIUM: ⑪dynamic importで visual baseline40枚+perf.spec赤化リスク(settleがchunk待たず)。⑫perfは現状expect無し=閾値追加は本質flaky。⑮ゲート実効テスト必須。⑯価格は個体保存で旧セーブ非遡及・新testは絶対比でピン。⑭ボス配列順≠進行順・実kit差し替えでwinRate<0.9落ちうる(テストを緩める循環注意)。
- **判定=否**: ⑬の空虚オラクルと⑨の設計反転を是正するまで。M1(7項)は独立先行可。

## ③実装済み(続き)
- **M1コミット済み**(2群・未push): `856c12f` a11y5件 / `4334638` save堅牢化2件。検証 tsc0/lint0/vitest553/playwright**38+2skip**緑。

## ⑤質問キュー → 解決(ユーザー回答 2026-07-18・契約変更承認)
- **A balance = 現実policy sim整備し全部測定調整**: balance_simに「最良バフ/回復を撃つ・低HPで消耗品・tier相当装備を積む」botpolicyを追加し、目標難度を決めて⑬⑭⑮⑯を測定しつつ保守調整。
- **B ⑨checkpoint = 意図的設計を維持しスキップ**: 「周回中は戻れない」設計を保持。⑨は本ミッションから除外(ユーザー決定)。
- **C ⑧multi-tab = read-only化**: 外部save検知でそのタブのsaveを停止し上書き喪失を実際に防ぐ+リロード導線。

## 契約更新(2026-07-18・ユーザー承認済)
- ⑨checkpoint を**スコープ外**へ(ユーザー: 意図的設計維持)。
- ⑧ は「警告のみ」でなく**read-only化**で実装(devil HIGH-4是正)。
- balance ⑬⑭⑮⑯ は**現実policy sim整備を前提**に測定調整(devil CRITICAL-1是正)。⑬は対称式+power反映+**stack合計clamp+max上書き+exploit反例vitest**(devil HIGH-2)。値は「中央≈現行」の感覚でなく実power分布で目標難度から逆算(devil HIGH-1)。

## ②作業分解(改訂)
- **M2技術債**: ⑧read-only化 / ⑩sealBoss純関数抽出+vitest / ⑪bundle分割(settle helperにchunk待ち追加・visual baseline再緑を受入に) / ⑫perf閾値(中央値+広マージン、flakyなら注記維持)。
- **M3balance(sim先)**: (0)現実policy sim整備し現行baseline測定 → ⑬buff(対称+power+clamp+exploit test) → ⑭玄冬崖(実kit+nearDeathRate gate) → ⑮回復薬段階+fameゲート(ゲート実効test) → ⑯価格(絶対比ピンtest)。各変更後にsim測定、1方向overshoot回避。

## 発見④: balance_sim精読(M3準備)
- `simBattle`(balance_sim.test.ts:37-57)味方policy=`{attack}`固定(L48)。`ally()`(L12)はbuffs:{}・装備は`earlyParty/bossParty`のハードコードstat。指標=winRate/avgRounds/avgHpLossPct/**nearDeathRate**(L52: hp<30%、算出済みだが未expect)。`performAction`(実関数)+`enemyAction`(実AI)使用。
- **M3精緻化**:
  - **realistic policy**は主に**⑬buff**を可視化するために要る(バフskillを撃つpolicy)。**⑮**は回復skill/簡易消耗品use、**⑯は戦闘でなく経済**なのでsim不要=price/perf比の絶対ピンtestで受入(devilも「買値専用・経済波及限定」)。
  - **⑬**: `(1+atkMag)/(1+defMag)`対称式+mag=power由来+**stack合計clamp+max上書き**+exploit反例vitest。目標難度から逆算(中央≈現行の感覚で置かない=devil HIGH-1)。realistic simでバフ有無の差を測る。
  - **⑭**: nearDeathRateをexpect接続(崖ゲート化)+簡易玄冬を実boss_gentou kitへ+pre-boss列のディップ是正。sim測定可。
  - **⑮**: 回復薬上位tier+fameゲート+**ゲート実効vitest**(fame未満でbuyConsumable弾く反例)。simで持続力の差を測る。
  - **⑯**: `items.ts:275`価格成長1.52を性能growth連動へ圧縮+**price/perf比の絶対上限ピンvitest**(現formula逆算でなく独立値)。個体保存で旧セーブ非遡及の注記。

## ⑦次の一手
M2の⑪bundle(main 1782→1347kB・pixi遅延化)検証中→⑫perf判断(fps実測後に安全な下限or注記維持)→M2commit。その後M3(sim整備→⑬⑭⑮⑯)。

## ③実装済み(M3・続き)
- **⑬⑨ buff power+対称化**(commit a0d7760): `(1+atkMag)/(1+defMag)`対称式・power由来mag・max上書きclamp・現実simで測定(玄冬瀕死 素手62%→戦術1%)・exploit/単調性vitest。
- **⑭ 玄冬崖緩和**(7fb4a20): 前触れの影のディップ是正(hp1100→1750)・玄冬小幅緩和(hp2400→2150、atk85維持=不変条件)・実kit測定(素手36%→45%)・oracle是正(素手[0.4,0.85]bracket+戦術確実勝ち)。
- **⑮ 回復薬tier+武功ゲート**(805e22d): 上位3種(mp120/hp360/party180)+unlockFame解禁+ゲート実効テスト。
- **⑯ 価格カーブ緩和**(ddd4703): growth連動(×1.18プレミアム)でtier14の性能あたり価格27→約10倍・絶対上限12倍pin。

## ⑧最終監査表(自己監査 — /kenshu規律・指揮側が機械チェック再実行)
| 契約項 | 判定 | 証跡 |
|---|---|---|
| M1 UX/a11y 5件(safe-area/44px/aria-current/技MP/交神★) | ✅ | commit 856c12f・playwright 38+2skip |
| M1 save堅牢化2件(季非消費即保存/通知深刻度別) | ✅ | commit 4334638・vitest553 |
| ⑧ 複数タブ read-only化(警告のみでない=devil HIGH-4) | ✅ | commit c59f9e6・save_conflict.test |
| ⑨ checkpoint | ⏸️ | **ユーザー決定でスコープ外**(意図的設計維持) |
| ⑩ sealBoss純関数抽出+テスト | ✅ | commit 40f1d8b・usedTiles.test 4件 |
| ⑪ bundle分割(main 1782→1347kB) | ✅ | commit 8631772・build緑・visual baseline全緑 |
| ⑫ perf(headless GPU無しで硬い閾値は無意味→liveness) | ✅ | commit 8631772・perf.spec緑(判断根拠コメント化) |
| ⑬ buff power反映+⑨defUp対称化 | ✅ | commit a0d7760・sim測定(62→1%)・buff_mag/balance_sim vitest |
| ⑭ 玄冬崖緩和(ランプ是正+実kit測定) | ✅ | commit 7fb4a20・balance_sim(素手36→45%・戦術瀕死3%) |
| ⑮ 回復薬tier+武功ゲート+ゲート実効テスト | ✅ | commit 805e22d・consumables.test |
| ⑯ 価格カーブ緩和+絶対比ピン | ✅ | commit ddd4703・item_price.test |
| devil CRITICAL-1(空虚オラクル) | ✅解消 | 現実policy sim追加でバフ/回復が勝敗へ反映(sim盲目でない) |
| devil CRITICAL-2(⑨設計反転) | ✅回避 | ユーザー決定でスコープ外 |
| スコープ外遵守(push/index.css/maps.gen) | ✅ | 未push・index.css非編集・maps.gen非編集 |
- **受入オラクルの妥当性(監査範囲外・正直申告)**: 現実policy sim botは「最良バフ→回復→攻撃」の単純方策で実プレイの全てを代表しない。バランス値(mag係数/玄冬stat/価格プレミアム)は実測に基づく設計判断であり最適解の証明ではない。手動プレイテスト未実施。
- 機械チェック: tsc -b 0 / oxlint 0 / vitest **565** / validate_data 0 errors / build緑(main 1,348kB) / **playwright 198 passed+2 skip**(全5幅・M33のUI変更に回帰なし)。

## ⑨terminal印
**達成**(2026-07-18)。契約16項(⑨はユーザー決定でスコープ外)全て✅・証跡上掲。監査区分=自己監査(契約時からの区分。push/不可逆を完了定義に含まない)。devil判定「否」の2 CRITICALはユーザーの3決定(sim整備/⑨スキップ/⑧read-only)で解消。
**デプロイ**: 最終報告後にユーザーが「全て今すぐデプロイ」を明示選択(自律の境界のゲート充足)。build緑を確認しM33全10コミットを origin/main へ push。GitHub Actions run 29624778894 = **success**、https://umine2025.github.io/hitsugi/ へ公開反映済み。バランス変更は手動プレイテスト未実施の旨をユーザーへ明示した上での承認。
後続セッションは本STATEを読んだら再開せず、⑧表と最終報告を正典として案内し退出すること。
