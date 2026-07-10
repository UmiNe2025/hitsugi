# MISSION: M18 UI/UX再編「命脈の家譜」実装 — STATE

## ① 契約(不変。変更はユーザー承認のみ)
設計正典: docs/UI_UX_REDESIGN_PLAN.md(Codex作・ユーザー承認済)+ docs/UI_UX_ACCEPTANCE_CHECKLIST.md + docs/HANDOFF_UI_UX_CLAUDE.md。
監査区分=**自己監査**(kenshu)+最終独立code-review 1回。push=完了定義外(ユーザーゲート)。
- P0 ベースライン(スクショはpreview_screenshot不能のためDOMスナップショット+数値で代替・明記済み)
- P1 共通殻(ScreenShell/ActionDock/Sheet/WorkspaceTabs/StatusCallout/LiveBadge/EmptyGuide/CompareRow/LifeThread+focus管理)→ **UI_SHELL_API.md確定が委譲ゲート**
- P2 郷ホーム(血脈診断/状況別推奨/月送り確認/郷の帳+LiveBadge)
- P3 作業画面(鍛冶4タブ独立画面/普請/星契りステップ+固定CTA/出立CTA)
- P4 戦闘「火脈の戦場」+探索HUD
- P5 記録画面(家譜4タブ/図鑑/家系図全画面/郷の声)— sonnet並列(ファイル所有)
- P6 仕上げ(モバイル/キーボード/reduced-motion/大量一覧性能/文言)+GAPSレポート
- スコープ外: push・ゲームロジック変更・新規画像アセット・未追跡sprite一括add・設計書の再設計

## ①b devil反映の回帰ガード(P1受入条件に内蔵)
1. **SFX class契約**: クリック音はApp.tsx委譲リスナー(.btn/.node-btn/.god-card/.region-card/.char-card.clickable)+audio.ts(button/.cmd-btn分岐)。新殻は既存classを継承するか、リスナー側を一箇所だけ拡張(個別配線禁止=CLAUDE.md)。
2. **BGM track map**: 新Screen id(forge/facilities/familytree等)はApp.tsxのtrack switchに追加(default='none'=無音事故防止)。
3. **戻る導線**: goBackスタック非存在。独立画面化する各画面に「郷へ戻る」明示配線+実測。
4. **keep/rewrite対応表**: ↓②b

## ②b 直近資産×設計要求 対応表(判断基準: 設計書が上位、ただし直近実装が設計意図を既に満たす場合はkeep+差分補完)
| 直近資産(6b4ab2f..748b2f6) | 設計書の要求 | 判断 |
|---|---|---|
| 出立の絵地図AscentMap+詳細カード | 5.2 地域比較(危険度/深さ/主/推奨武功)+固定CTA | **keep+merge**(詳細カードに推奨武功・未回収を追加、ActionDockでCTA固定) |
| 選択色--sel統一+◆ | 3.1 命火=選択/推奨 | **keep**(同一思想) |
| 日参りバナー/御題カード | 4.5 郷の帳(務め 達成1・受領可) | **keep**+郷の帳のLiveBadgeに「受領可」を反映 |
| nav3群(営み/記録/心得) | 4.5 郷の帳(名前+現在値の帳面) | **rewrite**(3群構造は継承、入口に現在値/LiveBadge付与) |
| 戦闘FX(ダメージ階層/八芒星/キャレット) | 5.4 火脈の戦場(配置再編) | **keep**(FXは配置と直交。レイアウトのみ再編) |
| モーダル群(9 boolean) | 2.3 画面/小窓の再分類 | **rewrite**(鍛冶/普請/家系図=独立画面へ、他はSheet化) |

## ② 完了の定義(機械/実測)
各Phase+最終: npm run build緑 / npm run lint 0 / node scripts/validate_data.mjs 0失敗 / git diff --check 0。
preview実測: 1280×720+390×844で console error 0・意図しない横スクロール0・ESC/フォーカス復帰/trapのactiveElement機械検証。
Jシナリオ主要5本(新規→出立→初戦闘→帰還 / 存命1後継なし→星契り→誕生 / HP1→静養確認→回復 / 鍛冶購入→装備→差分 / 家系図移動)preview完走。
Phase毎に個別コミット(ローカル)。GAPSレポート=独立レンズ1回で受入。

## ③ 完了ビート(証跡=ファイル/実測)
- (未着手)

## ④ 保留リスト
- push(公開)=ユーザーゲート。
- P0のピクセルスクショ: preview_screenshotがWebGL/この環境でタイムアウトするためDOMスナップショット+レイアウト数値で代替(handoffの要求から逸脱・正直に記録)。

## ⑤ 質問キュー
- (なし)

## ⑥ マイルストーン履歴
- Phase0契約: devil-advocate攻撃1回→修正3点(対応表/UI_SHELL_API/境界STATE)を契約化。出立CTA宛先はdepart画面と自己解決。

## ⑦ 次の一手
P0 ベースライン計測(dev server→DOMスナップショット+操作数+console+機械検証の現状値)。

## ⑧ 最終監査表
- (未実施)

## ⑨ terminal
- 未完(継続中)
