# AR1 独立監査（2026-07-21）

## 判定

**AR1機械実装: PASS / AR1 Phase Exit: HOLD / AR2: NO-GO**

独立監査は、実装担当と別のfresh agentがコード、テスト、証拠、採用スクリーンショットを直接確認した。vertical sliceの機械受入にはblocking defectがなく、未完の外部gateをPASSへ誤昇格していない。したがって実装自体はPASSだが、AR1 Phase Exitは保留し、AR2の対照地域・量産へ進めない。

## 直接確認した契約

- `regionVisualV2`は既定OFF。DEV query override、出立時snapshot、途中flag変更後も同一contractを維持する。
- V2対象は蛍火の窪地0層だけ。他地域・他階層・V1は従来表示で、新規visual-recovery asset requestは0。
- `DungeonRun.visualVersion/stageContractId`はsession限定。`GameData`とsave schemaへ探索途中状態を混入させず、reload時は従来どおりrunを破棄する。
- 郷のmap、K/L、collision、経路探索は不変。Dungeon/Battleは同一stage contractを共有し、旧背景を二重mountしない。
- 帰還痕の季節判定は`dungeonReturn()`後の`advanceSeason()`と整合し、Homeと郷の両方へ結果が残る。
- PC/mobile採用画像に、操作を阻害する重なり、主要経路の閉塞、文字・疑似文字・透かしはない。

## 機械証拠

- Vitest: **27 files / 637 tests PASS**。
- oxlint: **PASS**。
- production build: **PASS**（既存のlarge chunk warningのみ）。
- visual manifest validator: **7 entries / 7 unique IDs PASS**。
- AR1旅程: **15/15 PASS**（1440/1280/768/390/360）。
- 郷既存matrix: **30/30 PASS**、最終V2 focused **5/5 PASS**、V1新素材request 0 **5/5 PASS**。
- `git diff --check`: **PASS**（改行変換warningのみ）。

独立監査側のPlaywright全件再実行は環境上のtimeout/EPIPEで完走しなかったため、その事実を合格根拠には使っていない。上記のPlaywright件数は実装側がクリーンな単独実行で完走し、画像・trace・reportを固定した結果である。独立監査はその成果物と対象コードを照合した。

## 監査指摘と是正

初回の非阻害指摘は、素材台帳の`source`が生成元PNGを指す一方、旧`sha256`の対象が配信側ファイルであることをフィールド名から判別できない点だった。次のように是正した。

- `source` / `sourceSha256`: versioned生成元PNG。
- `runtimePath` / `runtimeSha256`: 実際にコードが読む配信WebP。
- validatorは各パスのrepository外escape、欠落、ハッシュ不一致、片側nullを失敗にする。
- `accepted`へ昇格する場合、両系統のprovenanceと`rightsStatus: cleared`を必須にする。

是正後の`npm run check:visual-manifest`は7/7でPASSした。

## Phase Exitを止める外部gate

1. 初見8名のblind/journey testで6/8以上。
2. 合意した低性能物理端末でmobile平均30fps、1% low 24fps、100ms超jank毎分1回以下、PC平均55fps。
3. 生成4素材のモデル／利用条件／商用再配布権利確認。

headless telemetry、開発者目視、機械testはこれらの代替にしない。3項目が揃うまでAR1 Phase ExitをHOLDし、AR2を開始しない。

## 公開境界

本監査時点の変更はローカルのみ。commit、push、GitHub Pages deployは行っていない。
