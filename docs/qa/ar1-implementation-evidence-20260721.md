# AR1 コアループ vertical slice 実装証拠（2026-07-21）

## 判定

**機械実装は完了。AR1 phase gateは保留。**

`Home → 郷の鍛冶 → 蛍火の窪地0層 → 1戦 → Home/郷の帰還痕`を、`regionVisualV2`既定OFFのvertical sliceとして実装した。AR2以降の地域量産へ進むには、8名blind testと合意した物理低性能端末の性能gateが必要であり、headless値で代替しない。

基準HEADは`7966fa25daf5b34e5cbb829c9510d3b1f3895b77`。既存M35/AR0 dirtyを保持したローカル差分で、commit、push、deployは行っていない。

## 実装した契約

- feature flagは`VITE_REGION_VISUAL_V2`、DEVだけ`?regionVisualV2=1|0`で再現でき、未指定時はOFF。
- 出立時に`DungeonRun.visualVersion/stageContractId`へsnapshotし、探索中にflagを変更してもDungeon→Battleは同じstage contractを使う。
- V2は`hotarubi_no_kubochi`のfloor 0だけ。他階層、他地域、flag OFFはV1で、新規画像requestも0。
- `DungeonRun`はsession限定で、`GameData`/save schemaへ座標、契約ID、未確定lootを混入させない。
- 郷はmap、K/L座標、collision、BFS、focusを変えず、checkerboardを連続した濡土・石・轍へ置換。
- 鍛冶と大燈籠だけを採用WebP＋code-native fallbackでfacade化し、他3施設はAR1のsilhouette仮置き。
- 通常／血脈危機は既存GameDataから導出。帰還痕は`dungeonReturn`後の1季だけ表示し、討伐時は大燈籠脇に足跡・消えた火床・残り火を残す。
- 蛍火0層は濡土、浅い黒水、水没社、前景根、逆流する火の粉、水輪、低い霧を一つのcontractで定義。経路graph/collisionは不変。
- Battleは同じ水没社、濡土・浅水、前景根、低い霧を継承し、旧背景との二重mountをしない。
- Homeは既存「灯の余白」に、人・土地・千年の帰還三痕を表示する。

## 画像kitと採否

| asset | runtime WebP | bytes | visual QC | release rights |
|---|---|---:|---|---|
| 大燈籠 | `public/img/visual-recovery/village/great-lantern-hvr1-v1.webp` | 29,812 | 合格 | 未確認 |
| 鍛冶facade | `public/img/visual-recovery/village/forge-facade-hvr1-v1.webp` | 21,224 | 合格 | 未確認 |
| 水没社・蛍火 | `public/img/visual-recovery/hotarubi/drowned-shrine-firefly-reed-hvr1-v1.webp` | 28,362 | 合格 | 未確認 |
| 前景root/reed | `public/img/visual-recovery/hotarubi/foreground-root-reed-hvr1-v1.webp` | 50,204 | 合格 | 未確認 |

4点合計129,602 bytes。dark/light checker、25%縮小、alpha境界、pixel検査で緑fringe、halo、文字、疑似文字、透かしを0件とした。生成元、prompt、棄却履歴は`assets_src/visual_recovery/AR1_PROMPTS_QC_20260721.md`、権利状態と生成元PNG／配信WebPそれぞれのpath・SHA-256は`asset-manifest.json`が正本。validatorは両実ファイルとの一致を検査する。モデル識別子と商用再配布確認が未完のため、台帳は意図的に`rightsStatus: unverified`、`reviewStatus: needs-review`を維持する。

## 5幅の直接検証

- `tests/visual/ar1_dungeon_battle.spec.ts`: **15/15 PASS**（1440/1280/768/390/360）。探索→Battleの同一contract、新素材2 request/200、V1/非対象request 0、帰還→Home三痕→郷traceを確認。
- `tests/visual/village.spec.ts`: 既存6項目×5幅 **30/30 PASS**。最終V2修正後のfocused **5/5 PASS**。
- AR0 Home/Pact keyboard・overflow matrixは**30/30 PASS**、AR0独立再監査はPASS済み。AR1変更はV2経路に限定した。
- `tests/visual/ar1_performance_telemetry.spec.ts`: PC 1280/mobile 390のV1/V2比較 **2/2 PASS**。数値は`docs/qa/ar1-performance-telemetry-20260721.md`。

## 採用スクリーンショット

同一fixture、PC 1280pxとmobile 390px。SHA-256はファイルbytesに対する値。

| 状態 | path | SHA-256 |
|---|---|---|
| 郷V2 PC | `docs/qa/baselines/20260721-ar1-village-pc-1280.png` | `88AFCFBB4BFA337D2C1C9E390B965AF17D123D8DA2CDF88DFFFB4F4A7EC88CFB` |
| 郷V2 mobile | `docs/qa/baselines/20260721-ar1-village-mobile-390.png` | `C0345B933E47B08594B857BB79097ED2D3AC9BE997D2AB89CA4F1F37AD05287B` |
| Dungeon V2 PC | `docs/qa/baselines/20260721-ar1-dungeon-pc-1280.png` | `0DED6B7A2232E642CF0BBFB31EC9A9E363D7EE3D69292E3E26E14376C4DB5570` |
| Dungeon V2 mobile | `docs/qa/baselines/20260721-ar1-dungeon-mobile-390.png` | `E0F2E398378DCEA326F8248255F5BD64BE7793A5417BA21FA1479A255229ADD0` |
| Battle V2 PC | `docs/qa/baselines/20260721-ar1-battle-pc-1280.png` | `4B70114EAA406DD105C6ED10428483651BBABA109A8CC0841038FDC6E23B9C1D` |
| Battle V2 mobile | `docs/qa/baselines/20260721-ar1-battle-mobile-390.png` | `2EE98E4E64B1D4B77342DB56F9BEC1E8CD972D9EFCBD748394AFAD17B87D5FDC` |
| Home帰還 PC | `docs/qa/baselines/20260721-ar1-home-return-pc-1280.png` | `A5E6E68EFFEC6C37BB6C0206DE328E0C0F43170A36B46B61EF00E9D6D0C6D61A` |
| Home帰還 mobile | `docs/qa/baselines/20260721-ar1-home-return-mobile-390.png` | `F921BFB1896E306BD60DC7AFC08261924BB3E45073871D87001A8CE44B9D1334` |
| 郷帰還 PC | `docs/qa/baselines/20260721-ar1-village-return-pc-1280.png` | `615BE3E14B33EE4DC18CD5E9A6DB6FDE98985F03C69858BE745FD2CD8E884C2B` |
| 郷帰還 mobile | `docs/qa/baselines/20260721-ar1-village-return-mobile-390.png` | `A847B3AF7C9A2B92E9867813FF5155C92463BF8197AE436B315104766056E678` |

## 目視で修正した欠陥

1. 初回alpha処理の緑色fringeを棄却し、edge-contract 2で再処理。
2. 約2.44MBのlossless runtime WebPを棄却し、alphaを保った129,602 bytesのkitへ置換。
3. 郷の灯りが半透明円盤に見えたため、V2だけを小さな多層光へ変更。
4. 郷facadeのfallback→画像差替えちらつきを防ぐため、V2の2点だけを最初の可視frame前にpreload。
5. Dungeonの水没社が盤面から浮く大きさ、前景根がmobile経路を覆う大きさだったため、landmarkを縮小し前景を世界幅78%・alpha 0.78へ修正。
6. 帰還足跡だけではbefore/after差が弱かったため、討伐時の消えた火床と残り火を追加。

## 未完gateと停止理由

- `docs/qa/ar0-blind-test-questionnaire.md`の固定手順で、初見8名中6名以上の新版選好、施設識別、旅程成功、因果説明が必要。
- 合意した低性能mobileで10分後平均30fps以上、1% low 24fps以上、100ms超jank毎分1回以下、PC平均55fps以上が必要。
- 画像4点の商用再配布権利確認が必要。

この3項目は自動テストや開発PCのheadless Chromiumで合格へ置き換えない。したがってAR1は「機械実装完了／人間・実機・権利gate待ち」とし、AR2の量産へ進まない。

独立監査は **AR1機械実装PASS / Phase Exit HOLD / AR2 NO-GO**。詳細は`docs/qa/ar1-independent-audit-20260721.md`。
