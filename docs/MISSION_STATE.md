# MISSION M24: 戦闘表示・ダンジョンマップ全面改善 — STATE

## ①契約
**ゴール**: `docs/BATTLE_DUNGEON_OVERHAUL_M24.md`(正典 GDD §8.9)のPhase A〜Dを完遂。共通署名=「灯路/灯脈」(判断/行動の瞬間のみ、常設装飾でない)。
**完了の定義(機械検証可能)**:
- **M1 ダンジョン**(§4/Phase A1-2・B1・C1): world.scaleレスポンシブzoom(PC横22-26/モバイル横10-12タイル、`camera.ts`純粋関数+単体テストで検証)+centerCamera/lighting穴のscale補正+look-ahead+地域別backdrop層(マップ外純黒解消)+床壁3段コントラスト+主人公接地円+タップBFS移植(村→ダンジョン)+灯路可視化(目的印/先頭4-7マス/到達不能印/手動でクリア)+敵影の縁・足元・金個体形状差・追跡視線+特殊物1.25-1.6倍+短期目的plate+HUD統合。
- **M2 戦闘**(§3): 三段grid(52/1fr/152px)+人物140-180px(1体180-220/主220-300)+地平線/接地影+HP二重解消(足元=名前+HP+状態、下部=手番者詳細+隊MP1行サマリ)+灯脈SVG線+接触点接近アニメ(論理座標・impact12px以内・hit-stop中shake抑止)+コマンド盤3分割+1-4キー対象+報酬予告化+ログ一行化+ボス`.is-boss`専用scale+開幕終幕順序+モバイル390px+bottom sheet+reduced-motion。継足の次撃倍率は行動順bar横に常設維持。
- **M3 地域5層**(§4.7、M1後): ground材質7種+空気粒子6種+RegionVisualProfile拡張+40地域割当(機械ゲート)+四幕画面変化。
- **M4 統合**: build/lint/test/validate_data/git diff --check緑+新規テスト(camera/タップ経路/配置)+最終独立code-review+WORKLOG+Phase別コミット。

**スコープ外**: Phase E(敵の兆し=AI設計変更・room archetype・環境ギミック — 指示書が「別commit・第二Phase」と規定)・push(ユーザーゲート)・戦闘計算/威力/AI/報酬/灯消費/バランス変更・maps.gen.ts手編集・**preview/fps実測**(分類器障害継続 — 計算+テストで代替し⚠️、受入7.3スクショは再開手順へ)。
**エスカレーション**: push/バランス変更が必要と判明/契約変更。
**監査区分**: **自己監査**(不可逆成果物なし・全変更git可逆)+devil攻撃1回+最終独立code-review(Mode O規律: マージ直前コードの独立第二パス)。
**主観項目の受入**: 見た目品質はコードレビュー+計算検証で代替、実機目視は⚠️で再開手順に残す。
**実測不能時の代替受入(契約時固定)**: 受入7.1/7.2のpx/タイル数値は「コード定数×zoom式」の計算+単体テストで検証。fps(55/30)は「新規全画面filterを増やさない(霧含め禁止・backdrop層で代替)+毎フレーム処理をO(既存)に保つ」のコードレビューで代替。

**devil攻撃反映(2026-07-12 第2回・REWORK→10緩和)**:
1. [S1]正典§4.3「タップBFS実装済み」は虚偽(ダンジョン未実装)→訂正コミット済み(M24.md:200)。
2. [S2]scale数学(lighting穴/centerCamera/look-ahead/タップ逆変換)は**本体(Opus)実装+単体テスト先行**→`camera.ts`+`tests/camera.test.ts`14本緑(穴中央=画面中央を全zoom保証)。
3. [S3]「22-26タイル」と「主人公48-64px」は両立不能→**タイル数優先・主人公px79-93px受容**(§4.1天井は現スプライトTILE*1.6では不可能、視認性目的に合致。テストで48px以上=§7.2は担保)。
4. [S4]両レーンとも`src/index.css`編集**禁止**、完了条件に`git diff --stat src/index.css`空を含む。上書きは新規css(battle_m24.css/dungeon_m24.css)へ集約。
5. [S5]戦闘560px有効ブロックは`index.css:1881`、`:1006`は死にコード(触るな/可能なら別コミット削除)。
6. [S6]ボスは`--sz`非依存の`.is-boss`専用scale(画像/SVG両経路+モバイル上限)。
7. [S7]接触点は**論理座標**(--slot/--n/--depth)算出、rectベース禁止、hit-stop中stage-shake抑止。
8. [S8]足元名札に状態異常常設+隊MP1行サマリ維持、継足倍率は行動順bar横に常設(灯脈は装飾)。
9. fps受入は「毎フレーム粒子コスト解析上限+全画面filter新規禁止」へ格上げ。
10. Phase別コミット厳守+統合前に独立code-review1本。

## ②作業分解
- M1a 難所(camera/lighting scale・タップ逆変換・backdrop) — 担当: **本体Opus**(単体テスト先行)
- M1b ダンジョン量産(床壁コントラスト・敵影・特殊物・HUD統合CSS・灯路可視化) — sonnet委譲(所有: dungeon_m24.css新規/render/*/Dungeon.tsx。index.css禁止)
- M2 戦闘レーン — sonnet委譲(所有: Battle.tsx/m17_battle.css/battle_m24.css新規。index.css禁止)。難所(接触点論理座標)は本体が数式提供
- M3 地域5層 — M1マージ後(engine/ground/region_theme直列)
- M4 統合+独立レビュー — 本体
- 依存: M1a→M1b→M3。M1a/M2の数式は本体。M1b/M2は並列(ファイル素集合)。

## ③完了済み(証跡)
- **S1訂正** ✅(M24.md:200訂正)
- **M1a-1 camera.ts基盤** ✅(証跡: `tests/camera.test.ts` 14/14緑 — zoom範囲/穴中央一致/look-ahead)

## ④保留リスト
- preview/fps実測(⚠️確定): ツール復旧後にM22④/M23④と合わせて実施。
- Phase E → 次期ミッション。

## ⑤質問キュー
(空)

## ⑥マイルストーン履歴
- Phase0: ディスカバリー2レーン+devil攻撃(REWORK/10緩和)→契約確定(2026-07-12)。
- M1a-1: camera純粋関数+14テスト緑。

## ⑦次の一手
camera.tsをengine.ts/lighting.tsへ配線(zoom適用/centerCamera/lighting穴/look-ahead/backdrop)→tsc緑→コミット。次にM1b/M2をsonnet委譲。

## ⑧最終監査表
(稼働中)

## ⑨terminal印
稼働中
