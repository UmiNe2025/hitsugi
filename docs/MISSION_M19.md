# MISSION M19: 不足分+残作業 — STATE

## ① 契約
ゴール=M18_GAPS.md推奨順1〜3の消化+M18実測バッテリー(preview復旧次第)。監査=自己監査+C3設計へdevil 1回+最終code-review 1回。スコープ外=B1難易度/B2状態異常/B5クラウド/A3スライド/push(要確認)。

## ⑧ 最終監査表(自己監査 /kenshu規律)
| 契約項目 | 判定 | 証跡 |
|---|---|---|
| ①A4 シーン誤タップ防止 | ✅ | ScenePager(頁N／M+次へ▸)を6シーン+序章に配線・選択後の背景進行は各guardで停止・レビューMEDIUM(頁計算)修正済(35ec79d) |
| ②C1 CIゲート | ✅ | deploy.ymlに lint+validate_data+vitest(build=tsc内包)。yml実物 |
| ③A9 命脈の点灯 | ✅ | LifeThread→Home血脈診断(存命=灯/懐妊=未点)+Chronicle概要(世代+次代)。tsc緑 |
| ④C3 save硬化 | ✅ | devil攻撃1回→必須4点反映(意味検証/saveSeq単調=NG+安全/BAK予算/quota梯子+DOMException限定+初回限定toast)。テスト9本で機械検証 |
| ⑤C2 vitest | ✅ | vitest 4.1・**27/27緑**(save往復/破損復旧/quota/移行/推奨6条/census/予告/御題/夢解禁)・`npm test` |
| ⑥B3+A1 | ✅ | 収集率称号5種(ゼロ除算ガード付)+新着フィルタ(flags.codexSeenEn/Gods+セッション固定スナップショット+タブ・帳badge) |
| ⑦実測バッテリー | ⚠️ | **preview系ツールが障害中(長時間継続)のため未実施**。機械検証は全緑。契約時のフォールバック(⚠️引継ぎ)を適用 |
- 最終code-review(opus独立): **出荷可(CRITICAL 0/HIGH 0)**。MEDIUM 1修正済・LOW 2(BAK quota誘発のテスト未カバー/HMR時のwarnOnce体感)は記録のみ。
- 監査範囲外の明記: 受入オラクル妥当性はPhase0 devil攻撃が担保。実ブラウザ挙動(focus/Tab順/モバイル/60vh横持ち)は⑦未実施のため未保証。

## ④ 保留リスト(再開手順)
- **実測バッテリー**: preview復旧後に (1)`preview_start {name:'hitsugi-dev'}` (2)チェックリストA-I(UI_UX_ACCEPTANCE_CHECKLIST.md)を1280×720/390×844で (3)Jシナリオ5本 (4)M18レビューMEDIUM2件の目視(戦闘中央寄せの死者スロット空隙/battle-stage 60vhの横持ちはみ出し) (5)P0基準は`git stash`or worktreeで6b4ab2f時点を計測。
- push(公開)=ユーザーゲート。未push: 238e553〜35ec79d(M18監査docs+M19一式)+M18本体(c78547c/1d8a590)。

## ⑨ terminal
- **部分達成(terminal)** — 実装項目①-⑥は全✅・⑦実測のみ外部障害で⚠️。再開はこのSTATEの④から。後続セッションはミッションを再開せず、④の実測のみ実施してよい。
