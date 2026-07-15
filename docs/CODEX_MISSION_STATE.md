# Codex Mission State — 地域固有ダンジョンと稀少魔性

最終更新: 2026-07-15 JST

## ①契約

- Definition of Done: 全40地域に固有の景観構成と地相説明があり、低頻度で遭遇する稀少魔性が固有名・強化能力・確定レア装備を持つ。勝利・逃走・敗北の状態遷移、初討伐記録、装備の産地表示がテストされ、build/lint/関連回帰/実画面確認が通る。
- Scope外: 戦闘ルール全面改変、M25/M26の未完作業の上書き、push・公開デプロイ、課金要素。
- 制約: `docs/GDD_v3.md` を仕様正典とする。既存/並行dirtyの `docs/MISSION_M25_M26.md`、`src/dungeon/render/ground.ts`、`src/dungeon/render/props.ts`、`src/ui/Dungeon.tsx`、`src/ui/dungeon_m25.css`、`src/ui/Battle.tsx`、`src/ui/battle/`、`src/ui/battle_m25.css`、`tests/visual/gate.spec.ts`、`tests/visual/perf.spec.ts` を保護する。生成物 `maps.gen.ts` は手編集しない。
- 権限境界: ローカル実装・テスト・文書更新まで。push/公開はユーザーの明示確認が必要。
- 監査クラス: independent audit。ゲーム進行・報酬・全地域描画にまたがる重要変更のため。
- 主観項目の受入: 40地域の固有プロファイル網羅表、代表地域の実画面、稀少遭遇の視認性と報酬導線を独立監査で評価する。

## ②作業分解

| 項目 | 依存 | 実行経路 | 受入確認 | 状態 |
|---|---|---|---|---|
| M0 境界・ベースライン | なし | Codex | git状態、既存テスト、保護ファイル一覧 | 完了 |
| M1 地域固有性 | M0 | Codex | 40地域網羅テスト、描画テーマ適用、入場ログ | 完了 |
| M2 稀少魔性とレアドロップ | M0 | Codex | 遭遇生成・能力補正・確定報酬・状態遷移テスト | 完了 |
| M3 収集循環・正典更新 | M1,M2 | Codex | 初討伐記録、産地表示、GDD/WORKLOG | 完了 |
| M4 統合検証・独立監査 | M1-M3 | Codex + 独立エージェント | build/lint/test/実画面/差分監査 | 完了 |

## ③完了済み

- M0: `HEAD=f267850`からの既存dirtyを記録し、M25/M26作業ファイルを上書きしない経路を固定。変更前build/lint/vitest 468件は緑。
- M1: 全40地域へ固有の地相名・入場文・4軸プロップ文法を追加。非塔39地域の静的マップを114層から171層へ拡張し、塔100層を維持。全171層の宣言個数とBFS到達を検証。
- M2: 特殊影18%を金影13%/稀相5%へ分割。6印の固有名・能力補正・既存変異絵優先・勝利時確定遺物・逃走/全滅0・再抽選防止を実装。
- M3: 稀相遺物を希少度「秘」、魔性名付き産地として装備5軸へ接続。初討伐のみ家譜、以後は印別討伐数を記録。GDD_v3/STATUS/WORKLOGを更新。
- M4検証: build成功、lint exit 0、vitest 524/524、validate_data 0 errors、map生成SHA-256一致、Playwright 5幅10/10。スクリーンショットを目視し、PC/モバイルで地形差・固有名・報酬予告を確認。

## ④保留リスト

- 非阻害Low: 実`DungeonEngine`そのものを再mountする専用回帰テストは未追加。floor seed決定論、engineの消費キー参照、storeの重複通知降格テスト、Playwright再mountを組み合わせて現行挙動は担保済み。帰還時のrun loot→inventory一度移送テストは監査中に追加した。
- `tests/visual/perf.spec.ts`のlint警告1件は並行M25作業由来で、lintの終了コードは0。本ミッションでは所有外として変更しない。

## ⑤質問キュー

- なし。公開・pushは本ミッションに含めない。

## ⑥マイルストーン履歴

- M0: 契約とdirty境界を固定。baseline build/lint/test緑。
- M1: 40地域の景観文法と39地域171層の歩行マップを完成。
- M2: 稀相5%・金影13%・確定遺物・結果別状態遷移・再抽選防止を完成。
- M3: 収集記録、産地表示、正典3文書を完成。
- M4: 機械検証と5幅の実画面検証を完了。独立監査へ移行。
- M4監査: Critical/High/Medium 0、Low 1(非阻害)、全契約PASS、最終GO。監査側でも重点208件/全524件を再実行。

## ⑦次の一手

ローカル実装は完了。公開する場合だけ、ユーザー確認後にM27対象パスを明示選択してcommit/pushする。

## ⑧最終監査表

監査種別: independent audit（実装完了後に実施）

| 契約項目 | 判定 | 証拠 |
|---|---|---|
| 全40地域の固有性 | ✅ | `region_visuals.test.ts`、`generated_maps.test.ts`、Playwright 5幅 |
| 稀少魔性 | ✅ | 10万floor分布、全40地域生成、実戦闘画面 |
| 確定レアドロップ | ✅ | 勝利/逃走/全滅/二重確定テスト、実画面予告 |
| 初討伐記録・産地表示 | ✅ | `rare_store.test.ts`、`item_axes.test.ts` |
| 回帰・実画面 | ✅ | build、lint、vitest 524、Playwright 10件 |
| 独立監査 | ✅ | GO。Critical/High/Medium 0、Low 1(非阻害)、契約全項PASS |

## ⑨terminal印

完了 — GO（未commit・未push）
