# AR0 independent audit（2026-07-21）

## 最終判定

**PASS / AR1 GO**

実装に参加していない独立agentが`docs/CODEX_MASTERPLAN_DRAFT.md` §17.8 AR0 Exitを証拠単位で監査した。初回は3点をREWORKとし、欠陥限定修正後の再監査で全項目PASSとした。

## 初回REWORKと閉鎖

| Exit | 初回 | 是正 | 最終 |
|---|---|---|---|
| 5画面×5幅の横overflow | Village/Dungeonの3幅が未assert | `ar0_after_evidence.spec.ts`を全5 project実行へ変更。Home/Pact/Village/Dungeon/Battleを各幅で直接assert | PASS |
| Home/Pact keyboard/focus | Home Enter、Pact click中心でTab/Space/focus復元が不足 | 実Tab、Space、computed outline 2px以上、same-node focus、Pact Sheet Escape復元を追加 | PASS |
| AR0単独rollback / M35保全 | source hashはあるがpatchと逆適用証拠なし | 25ファイルの`ar0-runtime-only.patch`を作成し、M35-baseで前方一致・reverse・保護hash不変を検証 | PASS |

## Exit一覧

| §17.8 AR0 Exit | 判定 | 証拠 |
|---|---|---|
| 視覚contract未決定0 | PASS | `docs/HITSUGI_VISUAL_BIBLE.md`、質問票、manifest schema/validator |
| Home/Battle/Village P0欠陥0 | PASS | 欠陥台帳、screen別実装、blocking Playwright |
| 5幅overflow / blocking test | PASS | 5画面×5幅、追加keyboard matrixを含む30/30 |
| Dungeon地図・帰還・DOM案内 | PASS | 地図semantic control 1、帰り火1操作で確認、Canvas外guide |
| Home/Pact keyboard・focus | PASS | Tab / Enter native semantics / Space / focus-visible / focus保持・復元 |
| Battle選択→予告→実行 | PASS | 5幅10/10、選択時にHP/turn/log不変 |
| Pact閲覧と契約可否 | PASS | 奉燈不足は閲覧可、CTAだけ理由付き無効、封印神は不可 |
| baseline / viewport / base / fixture / hash / rollback | PASS | `ar0-after-evidence-20260721.md`、M35 handoff、AR0-only patch |

## 独立再実行

- `npm run check:visual-manifest`: PASS
- Vitest: 24 files / 621 tests PASS
- oxlint: PASS
- production build: PASS
- `git diff --check`: PASS
- AR0追加matrix: 30/30 PASS

初回監査時のPlaywright 1件は`Execution context was destroyed`というserver/browser lifecycleで、assertion failureではなかった。欠陥限定修正後は対象30件をクリーン完走した。

## 非阻害メモ

現在のmanifest validatorはJSON Schema engineではなく、必須fieldと主要整合を独自検査している。AR1で採用素材を登録する前にschema準拠検査へ強化する。AR0の視覚的魅力そのものは未完であり、AR1の人間blind testと物理低性能端末gateを代替しない。
