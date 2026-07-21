# CODEX MISSION STATE — M36 village/dungeon asset completion

## ①契約

- Definition of done: 郷とダンジョンの素材不足を現行データから数で洗い出し、全施設・全40地域へ見た目の固有性が出る実装を接続し、PCの横長カラム読みづらさを改善する。`npm run lint`、`npm run test`、`npm run build`、関連検証を通す。
- Out of scope: push、公開デプロイ、外部投稿、課金、既存ユーザー変更の破棄、未承認生成画像の公開昇格。
- Constraints: `docs/GDD_v3.md` を正典とし、`WORKLOG.md`へ記録する。`main`へのpushは公開と同義のため行わない。`tmp/`など既存dirtyは保持する。
- Permission boundary: 新規ファイル追加と可逆なコード変更は実施可。公開・push・権利未確認素材のreleased扱いはユーザー承認が必要。
- Audit class: self audit。理由はローカル実装・非公開であり、公開/課金を含まないため。
- Subjective acceptance: 「中途半端に見える」点は、施設/地域ごとの素材役割、画面内の固有シルエット、PC読み幅、実画面テストの証拠で確認する。

## ②作業分解

| Item | Dependency | Execution path | Acceptance check | Status |
|---|---|---|---|---|
| A. 不足素材の数と内容を棚卸し | repo docs/data | docs追加、manifest/region/village照合 | 郷・ダンジョン・PC幅の不足数が明記される | completed |
| B. 郷素材の全施設状態を強化 | A | 既存5facade + code-native state cue/coverage | normal/crisis両状態でplaceholder 0、5施設識別 | completed |
| C. ダンジョン全40地域へ素材キット接続 | A | `RegionExperience`を全地域V2表示へ接続 | 全40地域がV2 experience stage対象 | completed |
| D. PCカラム幅を制御 | A | shell/CSS幅上限と読字段落幅 | wide PCで読み幅が制限され横伸びしない | completed |
| E. 機械検証と記録 | B-D | lint/test/build/visual checks、WORKLOG/GDD更新 | 全コマンド結果を記録 | completed |

## ③完了済み

- 2026-07-21 15:46 +09:00: mission contract created at `docs/CODEX_MISSION_STATE.md`.
- 2026-07-21 16:16 +09:00: 素材棚卸しを `docs/M36_VILLAGE_DUNGEON_ASSET_COMPLETION.md` に固定。郷facade 5/5、郷normal/crisis cue 10/10、地域背景40/40、ボス背景39/39、ボス立ち絵39/39、ダンジョン地域kit 40/40。
- 2026-07-21 16:16 +09:00: `src/core/feature_flags.ts` で `regionVisualV2` を既定ONへ昇格。`VITE_REGION_VISUAL_V2=0` とDEV query `?regionVisualV2=0` で旧表示へ明示rollback可能。
- 2026-07-21 16:16 +09:00: `src/core/data/region_stage_contracts.ts` の運用コメントを更新し、蛍火0層の画像backed stageと、その他M36 V2地域のcode-native kitを区別。
- 2026-07-21 16:16 +09:00: `src/ui/layout/shell_fix_m29.css` にPC幅制御を追加。1180px以上で `.screen.shell` 最大1160px、`.shell-body` 最大1040px、主要反復gridカード最大280px。
- 2026-07-21 16:16 +09:00: `tests/ar1_region_stage.test.ts` をdefault-ON契約へ更新し、非AR1地域もM36 V2 code-native layerになることを検証。
- 2026-07-21 16:16 +09:00: `tests/visual/village.spec.ts` をdefault-ON/明示OFFの両方へ更新。`tests/visual/shell_width.spec.ts` を追加し、PC作業画面の読み幅とカード幅を回帰検証。
- 2026-07-21 16:16 +09:00: `docs/GDD_v3.md` §8.19、`docs/STATUS.md`、`docs/WORKLOG.md` へローカル実装と非公開境界を記録。
- 検証: `npm run test` => 33 files / 678 tests passed。
- 検証: `npm run lint` => passed。
- 検証: `npm run build` => passed。main chunk 1,409.06 kB warningとplugin timing warningは非阻害。
- 検証: `node scripts/validate_data.mjs` => 0 errors / 1 existing rank distribution warn。
- 検証: `npm run check:visual-manifest` => 7 entries / 7 unique IDs OK。
- 検証: `npm run check:visual-closure` => 22 routes / 40 regions / 6 overlays / 68 ledger entries OK。
- 検証: `npx playwright test tests/visual/ar1_dungeon_battle.spec.ts --project=pc-1280 --project=mobile-390` => 9 passed / 1 intended mobile 1600px skip。
- 検証: `npx playwright test tests/visual/village.spec.ts --project=pc-1280 --project=mobile-390` => 14 passed。
- 検証: `npx playwright test tests/visual/shell_width.spec.ts --project=pc-1280` => 1 passed。
- 注意: 3 visual filesを一括実行したコマンドは180秒でtimeoutしたため、対象別に分割して成功証拠を取得した。

## ④保留リスト

- 公開・push: ユーザー明示承認まで行わない。
- 新規AI生成画像の公開権利: 今回は新規生成せず、既存権利クリア済み7素材とcode-native kitを接続した。今後追加生成する場合はmanifestへ未公開/未承認として分離する。

## ⑤質問キュー

- なし。必要判断はローカル改善として進める。

## ⑥マイルストーン履歴

- M36-0: 稼働開始。現行は `tmp/` が未追跡として存在するため保持する。
- M36-1: 素材棚卸しと通常導線接続を実装。`regionVisualV2` default ON、全40地域V2 code-native kit接続、郷5施設coverageを記録。
- M36-2: PC読み幅を抑制。作業画面shell/body/cardの最大幅を追加し、没入画面は広さを維持。
- M36-3: 検証完了。unit/lint/build/data/manifest/closure/target visualが合格。

## ⑦次の一手

- ユーザー確認後、必要ならcommit/push/deployへ進む。未確認のまま公開しない。

## ⑧最終監査表

- self audit — 2026-07-21 16:16 +09:00
- ✅ A. 不足素材の数と内容を棚卸し: `docs/M36_VILLAGE_DUNGEON_ASSET_COMPLETION.md` に必要数/充足数を記録。
- ✅ B. 郷素材の全施設状態を強化: `tests/visual/village.spec.ts` 14 passed、facade 5/5とnormal/crisis cue 10/10を記録。
- ✅ C. ダンジョン全40地域へ素材キット接続: `check:visual-closure` 40 regions OK、`ar1_dungeon_battle.spec.ts` 9 passed / 1 intended skip。
- ✅ D. PCカラム幅を制御: `shell_width.spec.ts` 1 passed、本文1042px以下・カード282px以下を検証。
- ✅ E. 機械検証と記録: `npm run test` 678 passed、lint/build/data/manifest/closure passed。GDD/STATUS/WORKLOG更新済み。
- ✅ 権限境界: commit/push/deployは未実施。`tmp/`は保持。

## ⑨terminal印

達成 — 2026-07-21 16:16 +09:00。ローカル実装・検証・記録まで完了。公開はユーザー明示承認待ち。
