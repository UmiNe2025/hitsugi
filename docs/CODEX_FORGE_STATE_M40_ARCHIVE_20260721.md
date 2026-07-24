# Codex Forge State — M40 プレイヤー魅力強化

## ①対象

- `docs/CODEX_MASTERPLAN_PLAYER_APPEAL_20260721.md`
- `docs/GDD_v3.md`、`docs/STATUS.md`、`docs/WORKLOG.md`のM40関連記録
- 目的: 全戦闘でオートを使える現行価値を守りながら、コレクション、育成、画面意匠を実装可能な計画へ収束させる

## ②固定合格ライン

客観条件:

1. 初遭遇、通常、elite、稀相、主、宿敵、常夜百層を含む全戦闘でオートを開始・途中切替でき、設定のオート既定を維持する。
2. 手動とオートで報酬、drop、図鑑、称号、血珠、経験・成長に差を設けない。
3. 810装備を53系譜として収集でき、未発見段を誤推定しない永続保存契約が一意である。
4. 鍛錬が数値選択だけでなく、人物像、現在の役割、次の節目、継承への影響を説明する。
5. 既存情報構造を壊さず、PC・mobileの直接操作、状態、アクセシビリティ、受入testまで実装可能である。
6. blocking defect 0。

主観条件は各4/5以上、平均4.4以上: A オート尊重、B 収集欲、C 育成の手応え、D 世界観一体型意匠、E 実装・検証可能性。

blockingは、オートの戦闘種制限・不利益、単なる物量追加、数値だけの鍛錬、既存IAとの衝突、保存契約の矛盾、主要受入条件の欠落、いずれかの軸4未満とする。最大5round。

## ③ラウンド履歴

| Round | 判定 | 得点 A/B/C/D/E | Blocking | 要約 |
|---:|---|---|---:|---|
| 1 | REWORK | 5/5/5/5/3 | 1 | 全戦闘オート、収集、育成、意匠は合格。装備発見の永続保存形式だけがPhase 4と実装契約で矛盾 |
| 2 | PASS | 5/5/5/5/5 | 0 | 53系譜の正規保存を15段bitsetへ一本化。全戦闘オートと報酬同一性にも回帰なし |

## ④blocking台帳

| ID | State | Consecutive unresolved | Closure evidence | Certifier |
|---|---|---:|---|---|
| `Phase 4 / collection-state-contract-contradiction` | closed | 0 | Phase 4と§14.3が`seriesId → 15段bitset`で一致。最高段は派生表示、旧save optionalはmigration後に正規化、§14.4で冪等性を受入化 | independent Round 2 |

## ⑤settled list

- `first-encounter-explicit-test-list`: non-blocking。全戦闘の不変条件と受入条件に既に包含され、実装時のfixture名として明記する改善候補。
- `new-generated-art`: non-blocking。今回の意匠強化は既存美術とCSS質感、印、罫線、余白で成立させ、新規画像量産を前提にしない。

## ⑥次の一手

Forgeは合格。Phase 0で行動計測、全戦闘オート不変条件、collectionV2のmigration fixtureを固定し、緑になるまでPhase 1へ進まない。

## ⑦次ゴール候補

- Phase 0: 行動計測、全戦闘オート不変条件test、save fixtureを先に固定する。
- Phase 1以降: 一画面一目的の再編集から着手し、コレクション・鍛錬・オート方針を順に接続する。

## ⑧terminal印

合格 — 2026-07-21T22:36:45+09:00。Round 2独立評価で全客観条件PASS、5軸5/5/5/5/5、blocking 0、台帳1件closed。
