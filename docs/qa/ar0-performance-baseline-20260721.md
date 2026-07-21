# AR0 性能ベースライン（2026-07-21）

## 目的と判定範囲

AR1以降の視覚素材・Pixi描画追加による退行を比較するため、AR0完了時点の開発環境値を固定する。この結果は headless Chromium / SwiftShader 上の比較基準であり、`docs/CODEX_MASTERPLAN_DRAFT.md` §17が要求する低性能実機の合格判定を代替しない。

## 測定環境

| 項目 | 値 |
|---|---|
| 端末 | Lenovo 21M3CTO1WW |
| OS | Windows 11 Home 10.0.26200 |
| CPU | AMD Ryzen 7 7735HS |
| RAM | 33,049,239,552 bytes（約32 GB） |
| GPU | AMD Radeon(TM) Graphics / AdapterRAM 1 GB / driver 32.0.21037.3009 |
| Node / npm | Node 24.15.0 / npm 11.12.1 |
| Browser | Playwright 1.61.1 / Chromium 149.0.7827.55 |
| 実行 | Vite development server、headless Chromium、SwiftShader |
| 計測 | readyまでの時間、4秒間のrAF、1% low、100 ms超long frame、JS/CSS/image transfer |

PCは1280px・CPU throttleなし、mobileは390px・CPU throttle 4倍で取得した。各値は絶対性能の保証ではなく、同一手順でのAR1以降との比較に使う。

## 結果

### PC 1280px

| 画面 | ready ms | 平均fps | 1% low | >100ms / 4秒 | JS bytes | CSS bytes | image bytes |
|---|---:|---:|---:|---:|---:|---:|---:|
| Home | 384.8 | 44.2 | 10.0 | 2 | 7,981,618 | 235,864 | 1,440,353 |
| Pact | 283.5 | 43.4 | 12.0 | 0 | 3,070,578 | 6,600 | 269,929 |
| Village | 1,817.8 | 12.0 | 10.0 | 1 | 3,237,308 | 17,185 | 600 |
| Dungeon | 2,857.6 | 2.7 | 1.7 | 10 | 3,163,823 | 9,148 | 600 |
| Battle | 302.1 | 55.5 | 20.0 | 0 | 3,070,278 | 6,600 | 0 |

### Mobile 390px / CPU throttle 4倍

| 画面 | ready ms | 平均fps | 1% low | >100ms / 4秒 | JS bytes | CSS bytes | image bytes |
|---|---:|---:|---:|---:|---:|---:|---:|
| Home | 2,484.3 | 29.5 | 6.7 | 7 | 7,981,618 | 235,864 | 1,440,353 |
| Pact | 1,541.3 | 57.7 | 30.0 | 1 | 3,070,578 | 6,600 | 269,929 |
| Village | 1,416.7 | 23.3 | 5.5 | 1 | 9,791,679 | 17,185 | 600 |
| Dungeon | 1,598.1 | 6.2 | 3.5 | 24 | 10,137,599 | 24,887 | 600 |
| Battle | 653.9 | 59.8 | 59.5 | 0 | 3,070,578 | 6,600 | 418,579 |

## 解釈とAR1制約

- DungeonとVillageはSwiftShaderで既に余裕が小さい。AR1は大きな全画面画像や常時particleを足すのではなく、atlas化した少数kit、静的layer、effect数の上限を優先する。
- PC 55fps / mobile平均30fps・1% low 24fps・100ms超jank毎分1回以下は、合意した物理端末で別途測る。上表の未達を無視してAR1を合格扱いにしない。
- `tests/visual/ar0_performance_baseline.spec.ts`を同一手順で再実行し、screen-ready、転送量、frame指標をAR0から比較する。
- Vite/Playwright管理serverは環境上`EPIPE`や`ERR_CONNECTION_REFUSED`が出る場合がある。その場合は明示的にViteを起動して同じtestを再実行し、アプリ本体の失敗とserver lifecycleを分離する。
