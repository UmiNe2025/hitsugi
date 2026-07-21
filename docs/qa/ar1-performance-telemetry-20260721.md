# AR1 V1/V2 headless性能比較（2026-07-21）

## 判定範囲

同一Playwright test内でV1→V2を順に開き、郷、蛍火0層、同地域Battleを各3秒rAF計測した。PCは1280×720、mobile proxyは390×844＋CPU throttle 4倍。Vite development server、headless Chromium、SwiftShaderであり、AR1の物理端末gateを代替しない。

## 結果

### PC 1280px

| 画面 | version | ready ms | 平均fps | 1% low | >100ms / 3秒 |
|---|---|---:|---:|---:|---:|
| 郷 | V1 | 1,973 | 10.2 | 7.5 | 9 |
| 郷 | V2 | 2,038 | 7.3 | 6.0 | 21 |
| Dungeon | V1 | 3,082 | 2.7 | 1.9 | 8 |
| Dungeon | V2 | 2,050 | 3.1 | 1.8 | 9 |
| Battle | V1 | 493 | 46.6 | 20.0 | 0 |
| Battle | V2 | 314 | 36.6 | 15.0 | 0 |

### Mobile 390px / CPU throttle 4倍

| 画面 | version | ready ms | 平均fps | 1% low | >100ms / 3秒 |
|---|---|---:|---:|---:|---:|
| 郷 | V1 | 3,771 | 18.5 | 2.9 | 1 |
| 郷 | V2 | 2,627 | 13.6 | 5.5 | 1 |
| Dungeon | V1 | 3,686 | 4.4 | 2.0 | 13 |
| Dungeon | V2 | 1,993 | 5.8 | 1.9 | 13 |
| Battle | V1 | 1,285 | 55.7 | 20.0 | 1 |
| Battle | V2 | 1,581 | 51.8 | 15.0 | 1 |

## 解釈

- SwiftShaderのPixi値は絶対値・run間変動が大きい。郷とBattleのV2平均fpsはこのrunで低下し、Dungeonは改善した。これを物理端末の合否へ外挿しない。
- V2郷は常時particleと水面再描画を無効化し、静的layer、facade texture 2点、pool済み煙2〜3だけを使う。
- V2 Dungeonはstatic Graphics 4、texture 2、pool済みの火の粉10、水輪3、霧2。tick内で新しいdisplay objectを生成しない。
- DungeonのPixi asset requestはresponse監視で2件・HTTP 200を確認。Battleの同じ2点はCSS backgroundとしてPerformanceResourceTimingにも現れた。V1/非対象地域/非対象階層はrequest 0。
- 配信用WebPはVillage 51,036 bytes、Dungeon/Battle 78,566 bytes、4点合計129,602 bytes。

## 結論

機械的な退行検知用telemetryは取得済みだが、30/24/55fps gateは未合格のまま。合意した物理端末で10分runを実施し、DevToolsまたは同等の計測ログを保存するまでAR2へ進めない。
