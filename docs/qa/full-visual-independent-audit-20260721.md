# 全景品質mission — 独立監査

実施: 2026-07-21 JST

監査対象: ローカル`code-integrated`実装

Round 1: FAIL — REWORK
Round 2: **PASS-with-notes**

## 最終判定

blockingは0。これはローカル`code-integrated`範囲の判定であり、`scene-integrated`、公開可、release可の判定ではない。外部評価、物理実機性能、生成素材の権利確認はHOLDを維持する。

## Round 1のblockingと閉鎖

| blocking | 是正 | Round 2 |
|---|---|---|
| 68行の`scene-integrated`過剰昇格 | `code-integrated`を新設。全required state、5幅capture、mechanical resultがない昇格をvalidatorで拒否 | 閉鎖 |
| 郷の黒楕円、円環、mobile巨大空白 | 短い二層接地、生活路・土間・生活痕、2:1全景＋五地点見取りへ変更 | 閉鎖 |
| Dungeonの矩形床、反復灯、素材の浮き | 旧汎用environment propsを停止し、専用湿地岸・短い灯杭・水面接地へ統合 | 閉鎖 |
| 集約Playwrightのtimeout/EPIPE | scope別・viewport別に分割して完走。repo内証拠画像を保存 | 閉鎖 |
| Forge修正後の証拠不足 | 人物＋三枠＋推薦／蔵4入口のPC・mobile画像を保存 | 閉鎖 |

## 直接確認

- `npm test`: 33 files / 676 tests PASS。
- lint: PASS。
- production build: PASS。main chunk 1,409.06 kB warningあり。
- closure: 22 route、40 region、6 overlay、68/68 `code-integrated`。`scene-integrated`、`scene-ready`、`released`は0。
- visual manifest: 7/7 PASS。
- Village: 30/30 PASS。
- AR1 Dungeon/Battle: 21 PASS / 4 intentional skip。
- VC3 work surfaces: 8 PASS / 2 intentional skip。
- V2既定OFF。セーブ形式とマップ衝突定義への混入なし。
- commit、push、deployなし。

## Non-blocking notes

1. visual evidence validatorはpath存在とstate/viewport keyを検査するが、画像MIME、寸法、viewport一致、capture間hash重複、構造化mechanical resultまでは検査しない。
2. main chunk 1,409.06 kBの警告が残る。低性能端末の初期表示・遷移性能は未測定。
3. Forge mobileの省略titleと密集headerは物理実機、文字倍率200%で未確認。
4. 外部8名、4-way macro-biome blind、物理性能、生成7素材の権利確認は未完。

## Worst case

証拠の意味を誤って68行を一括昇格しV2を有効化すると、知覚差の弱い40地域、未確認の生成7素材、低性能端末での負荷が同時に利用者へ露出する。現状はV2既定OFF、68行`code-integrated`止まり、ready/released 0件のため封じ込められている。

## Release前の必須対策

- required state×5幅の実captureと構造化mechanical resultを収集する。
- 8名外部testと4-way macro-biome blind比較を完了する。
- 物理端末で30/24/55fps、jank、memory、init時間を測定する。
- 生成7素材のmodel/licenseと商用再配布権利を確定する。
- Forge mobileを文字倍率200%を含む実機で確認する。
- 完了まではV2既定OFFを維持し、`scene-integrated`昇格、commit、push、deployを行わない。
