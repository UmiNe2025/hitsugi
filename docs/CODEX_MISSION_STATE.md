# CODEX MISSION STATE — M45 engagement additions audit

## ①契約

- Definition of done: 現行公開版の不足を実装証拠から特定し、没入・判断・世代継承・収集育成・再訪動機に効く追加内容を、優先順位・最小実装単位・測定指標・見送り条件付きの正本資料へまとめる。
- Out of scope: ゲーム実装、新規画像量産、外部ユーザー募集、課金、commit、push、deploy。
- Constraints: GDD v3と現行runtimeを正とし、M43との重複を除く。既存baseline PNG 9点、`tmp/`、未追跡M40/M42文書を上書きしない。
- Permission boundary: ローカルの読み取り・文書作成・機械検証のみ。公開、外部送信、費用発生は別承認とする。
- Escalation: 外部初見8名、一世代5名、物理低性能端末、analytics providerは外部gateへ分離する。
- Audit class: independent audit。魅力・没入という主観品質と優先順位判断を含むため。
- Subjective acceptance: 初回30分、戦闘判断、継承因果、収集育成、再訪動機の5軸で、既存機能との重複0・各案の検証可能性を判定する。

## ②作業分解

| Item | Dependency | Execution path | Acceptance check | Status |
|---|---|---|---|---|
| A. 契約・dirty境界固定 | git/GDD | main | state/Goal/plan一致、既存差分保護 | completed |
| B. 現状証拠収集 | A | main＋read-only audit | GDD/M42/runtime/testの照合 | completed |
| C. 5軸gap分析 | B | main | M43重複除外、候補の根拠あり | completed |
| D. M45正本資料 | C | main | 優先度、実装単位、指標、見送り条件 | completed |
| E. 独立最終監査 | D | fresh reviewer | blocking 0または修正 | completed |
| F. 正典同期・終了 | E | main | GDD/STATUS/WORKLOG/state整合 | completed |

## ③完了済み

- 2026-07-23: HEAD `b8d78ae`、公開M43/M44、既存dirty PNG 9点、`tmp/`、未追跡M40/M42文書を確認し、非接触境界を固定した。
- M43で初回30分、継承場面、序盤12敵、local journey metrics、星籤が実装済みであることをGDD v3 §8.26とruntimeから確認した。
- gameplay、onboarding/retentionの独立read-only監査から、M43後に残る候補を収集し、既存実装との重複を除いた。
- `docs/PRODUCT_ENGAGEMENT_ADDITIONS_M45_20260723.md`へ8候補、優先度、最小実装、分子/分母付き測定表、見送り条件、Phase 0→A1→A2→A3の逐次gateを記録した。
- 独立Round 1のblocking 3件を受け、家族は既存scene置換、地域は既存見切り経路、計測はlocal event、順序は現行baseline・Dungeon安全性先行へ限定修正した。
- 独立Round 2はPASS / blocking 0。GDD v3 §8.27、STATUS、WORKLOGへ正本と公開境界を同期した。

## ④保留リスト

- 実ユーザー行動・魅力評価・低性能実機は、この文書監査では代替しない。
- 実装、commit、push、deployは本mission外。
- 次missionのPhase 0は、外部初見8名・一世代5名の協力と、実装着手のユーザー指示を必要とする。

## ⑤質問キュー

- なし。候補を先に絞り、実装順の選択は成果物提示後とする。

## ⑥マイルストーン履歴

- M45-0: 契約、Goal、5項目plan、独立read-only auditを開始。
- M45-1: 5軸gap分析を統合し、M45正本資料を作成。
- M45-2: 独立Round 1 FAIL / blocking 3。重複、測定不能、一括投入順序を検出。
- M45-3: 限定修正後、独立Round 2 PASS / blocking 0。正典同期完了。

## ⑦次の一手

- ユーザーが実装を指示した場合、`docs/PRODUCT_ENGAGEMENT_ADDITIONS_M45_20260723.md` Phase 0から開始し、contentの一括投入を行わない。

## ⑧最終監査表

- **監査種別**: independent audit。
- ✅ 既存機能との重複0: 家族sceneは置換、地域は`loreFrags → traceIntel → bossMikiri`の拡張。
- ✅ 魅力5軸: 初回、戦闘判断、継承、収集育成、再訪の候補と測定を記録。
- ✅ 実装可能性: 各候補へ最小実装、event key、分子/分母、baseline、cohort、合格/見送り値を付与。
- ✅ 安全境界: scene/deferred純増0、全戦闘オート同報酬、FOMO/新通貨/限定必須戦力なし。
- ✅ 順序: 現行baseline、local計測、Dungeon安全性をPhase 0へ置き、A1〜A3を単独検証。
- ✅ 独立Round 2: PASS / blocking 0。実ユーザー/実機は外部gateとして代替しない。

## ⑨terminal印

達成 — 2026-07-24T00:03:27+09:00。M45正本資料、GDD/STATUS/WORKLOG同期、独立再監査PASS / blocking 0。runtime/save/素材/公開版は変更していない。
