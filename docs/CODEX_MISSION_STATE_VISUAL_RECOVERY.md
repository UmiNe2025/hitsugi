# Codex Mission State — AI感解消・空間美術再建実装

> `docs/CODEX_MISSION_STATE.md`は完了済みM34 missionの正本として参照されているため上書きせず、本missionをこの衝突回避pathで管理する。

## ①契約

- Definition of Done: `docs/CODEX_MASTERPLAN_DRAFT.md` §17のAR0〜AR5をPhase gate順に実装し、操作安全、コアループvertical slice、対照2地域、Battle継承、screen固有化、throughput pilot、量産、性能、人間採否、独立監査を全て直接証拠でPASSさせる。
- Scope外: 無関係なゲーム機能、途中Dungeon永続再開の新設、課金、外部送信、commit、push、deploy、既存dirty差分の破棄。
- 制約: `docs/GDD_v3.md`を正典とし、M35 owner pathを保全する。現行`DungeonRun`非永続契約、save互換、各Phase Entry/Exit、§17の量産禁止を守る。
- 権限境界: 可逆なlocal code/assets/tests/docsまで。既存dirtyのcommit、削除、push/deploy、外部人間test募集はユーザー承認が必要。
- エスカレーション: M35の安全な統合にlocal commitが必須、正典変更が必要、人間8名blind gateで後続Phaseが停止、またはsave互換を維持不能な場合。
- 監査クラス: independent audit。主要画面、戦闘、Dungeon、save、配信assetへまたがる重要missionのため。
- 主観項目の受入: 同一fixtureのcurrent/new blind比較8人、無文字施設識別、色なし地域識別、因果説明、自由回答codeを§17の閾値で判定する。確保不能時は合格へ代替しない。

## ②作業分解

| 項目 | 依存 | owner / 実行経路 | 受入確認 | 状態 |
|---|---|---|---|---|
| M0 契約・dirty境界 | なし | 指揮側 | HEAD/status、M35 patch/hash/test、状態正本 | 完了 |
| AR0 操作安全・視覚契約 | M0 | Home/Battle/Village/Dungeon/Pact、QA | §17 AR0 Exit全PASS | 完了 |
| AR1 コアループslice | AR0 | Village/Dungeon/Battle/Home/assets | blind 6/8、task 6/8、性能 | 機械実装完了・gate待ち |
| AR2 空間system | AR1 | 2地域、rare、Battle、DungeonRun | 地域識別、version fixture、性能 | 未着手 |
| AR3 固有surface | AR2 | Home/Pact/Forge/Storehouse | 5秒理解、overflow、性能 | 未着手 |
| AR3B throughput pilot | AR3 | 第3family/3地域/rare/boss | 3 person-day、AR2 gate | 未着手 |
| AR4 制御量産 | AR3B | 8〜12family/40地域/QC | 全contract、全test、性能 | 未着手 |
| AR5 人間評価・収束 | AR4 | QA + 外部協力者 | blind 6/8、原因code各1以下 | 未着手 |
| M6 正典同期・独立監査 | AR5 | docs + fresh agent | 契約全項✅、blocking 0 | 未着手 |

## ③完了済み

- 2026-07-21開始。branch `main`、HEAD/origin-main `7966fa25daf5b34e5cbb829c9510d3b1f3895b77`。
- 開始時dirty: `docs/GDD_v3.md`、`docs/WORKLOG.md`、`src/core/data/gods_low.ts`、`src/ui/Pact.tsx`、M35画像/CSS/test、§17計画/QA証拠、`tmp/`。既存変更として保持する。
- 計画Forge: `docs/CODEX_FORGE_STATE_VISUAL_PLAN.md`で5軸5/5、blocking 0、terminal合格。
- M0完了: `docs/qa/worktree-m35-handoff-20260721.md`へtracked patch、untracked hash、5幅10/10 PASSを固定。commit / push / deployなし。
- AR0完了: P0操作9件、HVR-1.0、manifest/schema/validator、5画面×5幅overflow、Home/Pact keyboard/focus、Battle標的確認、Village/Dungeon操作導線を実装。追加matrix 30/30、Vitest 621、lint/build/diff-check PASS。
- AR0 rollback: `docs/qa/patches/ar0-runtime-only.patch`（SHA-256 `0AE892E27B8D80B0B697B05FCCF031E314F5B046893631AE888AE2A9D463F1CF`）。M35-baseへ前方25/25一致、reverse、M35保護hash不変。
- AR0独立監査: 初回REWORK 3件を欠陥限定修正し、再監査 **PASS / AR1 GO**。`docs/qa/ar0-independent-audit-20260721.md`。
- AR1機械実装: feature flag既定OFF、郷の連続地面/鍛冶・大燈籠/通常・危機・帰還痕、蛍火0層のregion stage contract、同一contract Battle、Home帰還三痕を接続。
- AR1素材: 4点129,602 bytes。alpha/fringe/文字/QC合格、商用再配布確認は未完。`assets_src/visual_recovery/AR1_PROMPTS_QC_20260721.md`。
- AR1機械検証: Vitest 637、lint/build/manifest/diff-check、5幅旅程15/15、郷V2 5/5、PC/mobile headless比較2/2。`docs/qa/ar1-implementation-evidence-20260721.md`。
- AR1独立監査: **機械実装PASS / Phase Exit HOLD / AR2 NO-GO**。生成元PNGと配信WebPのhash対象が曖昧という非阻害指摘を、別path/hash＋実ファイル検証へ是正。`docs/qa/ar1-independent-audit-20260721.md`。

## ④保留リスト

- AR1/AR5の外部人間8名blind testは現時点で未手配。AR1はgate到達済みだが、8名中6名の受入を得るまでPASSへ昇格しない。
- AR1の物理低性能mobile性能gateは未実施。headless AR0 baselineで代替しない。
- AR1生成4点のモデル識別子と商用再配布確認が未完。visual QC合格とrelease可否を分離する。
- push/deployは未承認。local完了後も公開しない。

## ⑤質問キュー

- 非緊急: M35をlocal commitへ固定してよいか。承認なしではpatch/hash handoffで進め、既存変更をcommitしない。

## ⑥マイルストーン履歴

- M0完了: Mission契約、既存dirty境界、M35復元patch/hash、5幅の直接検証を固定。
- AR0完了: 独立監査の初回REWORK（全幅overflow、keyboard matrix、AR0単独rollback）を閉じ、再監査PASS。
- AR1開始: feature flag既定OFF、既存map/collision/save不変のvertical sliceへ限定。
- AR1機械実装完了: visual QCと5幅自動旅程を閉じた。人間/物理端末/権利の3gateで停止し、AR2へ進めない。

## ⑦次の一手

`docs/qa/ar0-blind-test-questionnaire.md`で初見8名のAR1 blind/journey testを実施し、合意した物理低性能mobile/PCで10分性能を測定する。生成4点の商用再配布確認も行う。3gateが揃うまでAR2を開始しない。

## ⑧最終監査表

監査種別: independent audit（AR1機械実装到達点で実施済み）

| 契約項目 | 判定 | 証拠 |
|---|---|---|
| M0 dirty境界 | ✅ | `docs/qa/worktree-m35-handoff-20260721.md`、M35 10/10 PASS |
| AR0 | ✅ | 5画面×5幅30/30、621 unit、HVR-1.0、独立再監査PASS |
| AR1 | ⚠️ | 機械実装完了。人間8名、物理端末、画像権利gate待ち |
| AR2〜AR5 | ⚠️ | 未実装 |
| 正典同期 | ✅ | AR1到達点をGDD v3、STATUS、WORKLOG、実装証拠へ同期 |
| 独立監査 | ✅ | AR1機械実装PASS / Phase Exit HOLD / AR2 NO-GO |
| push/deploy境界 | ✅ | Scope外として固定 |

## ⑨terminal印

外部gate待ち — AR1機械実装完了、AR2停止
