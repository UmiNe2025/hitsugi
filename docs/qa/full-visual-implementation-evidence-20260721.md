# 全景品質mission — ローカル実装証拠

更新: 2026-07-21 JST

## 判定範囲

- 対象: `docs/CODEX_MASTERPLAN_DRAFT.md` §18のローカルcode、生成素材、runtime接続、機械試験、実画面証拠。
- 対象外: commit、push、deploy、外部8名評価、4-way blind test、低性能物理端末、生成素材の商用再配布権利判断。
- 公開安全策: `regionVisualV2`既定OFF。未承認神MAXのallowlistは空。生成7素材のrightsは未確認のまま。

## closureの正直な状態

- `Screen` 22、`REGIONS` 40、route外overlay 6、計68行を`docs/qa/visual-closure-ledger.json`へ列挙。
- 68行はsource/runtime/evidenceとSHA-256が接続された`code-integrated`。
- `scene-integrated`は0。全required state、5 canonical viewport、mechanical checkの`coverageEvidence`がそろわない行はvalidatorが昇格を拒否する。
- `scene-ready`と`released`も0。

## 生成・統合した画像

- 星祠、豆腐屋、出立門を追加生成し、alpha masterから512×384 PNG/WebPへ処理。
- 新規3 WebPは合計90,716 bytes。既存の鍛冶、大燈籠、水没社、葦根と合わせmanifest 7/7。
- source/runtime hash、edge alpha、key-like pixelを`assets_src/visual_recovery/asset-manifest.json`で検証。

## 独立監査Round 1の是正

1. lifecycleへ`code-integrated`を追加し、68行の過剰な`scene-integrated`宣言を撤回。
2. 郷の不透明な黒楕円を短い二層接地へ変更。単純円環を不定形の中央土場、5施設の土間、生活路、轍、生活痕へ置換。
3. 390/360pxの見渡しを、巨大な上下空白のある縮小mapから、2:1全景と五地点の見取り案内へ変更。CSS reflow後にPixi rendererを明示resize。
4. 蛍火0層では旧汎用environment propを止め、機能markerだけを保持。専用の湿地岸、濡土、短い灯杭、葦根、水面接地へ一本化。
5. 鍛冶は人物・三装備枠・弱点・推薦3件を先に表示し、全品棚は二次入口後に限定。蔵も目的別4入口を先に表示。

## 実画面証拠

- 郷最終: `docs/qa/baselines/20260721-ar1r-village-final-pc-1280.png`、`20260721-ar1r-village-final-mobile-390.png`
- 蛍火探索最終: `docs/qa/baselines/20260721-ar1r-dungeon-final-pc-1280.png`、`20260721-ar1r-dungeon-final-mobile-390.png`
- 蛍火戦闘最終: `docs/qa/baselines/20260721-ar1r-battle-final-pc-1280.png`、`20260721-ar1r-battle-final-mobile-390.png`
- 鍛冶初期面: `docs/qa/baselines/20260721-vc3-forge-focused-pc-1280.png`、`20260721-vc3-forge-focused-mobile-390.png`
- 蔵初期面: `docs/qa/baselines/20260721-vc3-storehouse-focused-pc-1280.png`、`20260721-vc3-storehouse-focused-mobile-390.png`

## 最終機械検証

| command / scope | 結果 |
|---|---|
| `npm test` | 33 files / 676 tests PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS。main chunk 1,409.06 kB warningは残る |
| `npm run check:visual-closure` | 22 route / 40 region / 6 overlay / 68 code-integrated PASS |
| `npm run check:visual-manifest` | 7/7 PASS |
| `git diff --check` | PASS。Windows改行予告のみ |
| `village.spec.ts` 5幅 | 30/30 PASS。mobile再撮影2/2 PASS |
| `ar1_dungeon_battle.spec.ts` 5幅 | 21 PASS / 4 intentional skip |
| `vc3_work_surfaces.spec.ts` PC1280・mobile390 | 8 PASS / 2 intentional skip |

初回総合実行では郷の最終編集後にclosure hash 3件が旧値となり1 testが失敗した。`scripts/promote_visual_closure_integration.mjs`で現行hashへ再同期し、上記の最終実行で676/676とclosure 68/68を再確認した。

## 残るHOLD

- 外部初見8名の理解・魅力・AI感評価。
- 4 macro-biomeの4-way blind識別。
- 低性能mobile/PCの物理実機性能。
- 生成7素材のmodel/licenseおよび商用再配布権利。
- ユーザー明示承認後のcommit/push/deploy。
