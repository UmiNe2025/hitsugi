# M36 郷・ダンジョン素材充実 実装記録

2026-07-21

## 問題

郷の鍛冶場など一部は素材密度が高いが、通常プレイでは `regionVisualV2` が既定OFFだったため、郷5施設facadeや40地域のコードネイティブ素材キットが十分に見えなかった。PCでは作業画面の本文/カード幅が横へ伸び、1件だけのカードや詳細カラムが読みにくくなっていた。

## 必要素材数と今回の充足

| 領域 | 必要数 | 現状 | 今回の扱い |
|---|---:|---:|---|
| 郷 主要施設facade | 5施設 | 5 WebP | 通常プレイ既定ONで表示。normal/crisisは同一画像+形状cueで差分化 |
| 郷 状態差分 | 5施設 × 2状態 = 10状態 | 10状態分のcue | 画像量産ではなく、戸締め/縄/灯/供物/障害物のcode cueで全状態を接続 |
| ダンジョン地域背景 | 40地域 | 40 `bg_r_*.jpg` | 出立/導入で既存画像を使用、歩行中は地域kitで補完 |
| ボス背景 | ボスあり39地域 | 39 `bossbg_*.jpg` | 戦闘側の既存接続を維持 |
| ボス立ち絵 | ボスあり39地域 | 39 `boss_*.jpg` | 戦闘側の既存接続を維持 |
| ダンジョン歩行中の地域kit | 40地域 | 40 code-native profile | V2既定ONで全地域へ材質/シルエット/ランドマーク/粒子/ナビ印を表示 |
| 特別画像backed stage | 1地域 | 蛍火の窪地 floor0 | 維持。その他39地域は権利未確認画像を増やさずcode-native kitで閉じる |

## 実装判断

- `regionVisualV2` を既定ONにする。明示的に `VITE_REGION_VISUAL_V2=0` または開発URL `?regionVisualV2=0` で旧表示へ戻せる。
- bespoke画像stageは蛍火の窪地のみ維持し、他39地域は `REGION_EXPERIENCES` の40地域profileを通常プレイへ接続する。
- 新規AI生成画像は今回追加しない。未承認素材を増やすより、既存の権利クリア済み7素材と40地域code kitを通常導線に載せる方が、公開前のリスクが低く、画面の中途半端さを直接減らせるため。
- PCの作業画面は `ScreenShell` 配下だけ本文最大幅を締め、Dungeon/Battle/Villageの没入画面は広さを残す。

## 受入

- 新規出立の既定 `visualVersion` は `v2`。
- `yoi_forest` などAR1専用画像stageを持たない地域でも、`visualVersion='v2'` かつ `stageContractId` なしで安全に開始する。
- 全40地域の `REGION_EXPERIENCES` は既存テストで過不足0、素材キットの構造キー重複0、texture 0、ambient/navigation/danger cueを検証する。
- PC 1180px以上の `ScreenShell` は本文最大1040px、シェル最大1160px。反復カードは1件でも最大280pxへ抑える。

## 検証結果

- `npm run test` — 33 files / 678 tests passed。
- `npm run lint` — passed。
- `npm run build` — passed。main chunk 1,409.06 kB warningは既存の非阻害note。
- `node scripts/validate_data.mjs` — 0 errors / rank分布warn 1。
- `npm run check:visual-manifest` — 7 entries / 7 unique IDs OK。
- `npm run check:visual-closure` — 22 routes / 40 regions / 6 overlays / 68 ledger entries OK。
- `npx playwright test tests/visual/ar1_dungeon_battle.spec.ts --project=pc-1280 --project=mobile-390` — 9 passed / 1 intended skip。
- `npx playwright test tests/visual/village.spec.ts --project=pc-1280 --project=mobile-390` — 14 passed。
- `npx playwright test tests/visual/shell_width.spec.ts --project=pc-1280` — 1 passed。

## 公開境界

このM36はローカル実装まで。`main`へのpushはGitHub Pages公開と同義のため、ユーザーの明示承認までcommit/push/deployしない。
