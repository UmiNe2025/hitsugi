# Codex Forge State — AI感解消・空間美術再建計画

> `docs/CODEX_FORGE_STATE.md`は完了済みM34 Forgeの正本として参照されているため上書きせず、本runをこの衝突回避pathで管理する。

## ①対象

- 成果物: `docs/CODEX_MASTERPLAN_DRAFT.md` §17「AI感解消・空間美術再建」
- 補助証拠: `docs/qa/ui-audit-baseline-20260720.md`と`docs/qa/baselines/20260721-*-before.png`
- 利用者: Claude / Fable 5の実装者、asset制作者、独立QA、公開判断者
- ゴール: AI的なtemplate感の原因へ直接当たり、誤実装・水増し完了・save破損・性能劣化・公開事故をgateで防ぐ実装可能な計画へ収束させる

## ②固定合格ライン

客観条件:

1. §17.1〜17.14、AR0/1/2/3/3B/4/5、主経路、代替、asset契約、リスク、最初の72時間、Claude実装指示、完了定義が実在する。
2. local参照が実在し、§5・§8・§13・§14・§16との優先関係、Phase entry/exit、数値gate、rollback、Claude実装指示の矛盾が0。
3. 視覚品質を画像数・layer数・test件数だけで合格させず、blind評価、地域識別、因果説明、性能、save互換を直接検証する。
4. dirty M35差分の所有、push承認境界、asset権利系譜、現行の非永続`DungeonRun`契約を保持する。
5. `git diff --check`成功、blocking 0。

主観条件は各4/5以上:

- A 原因への直撃: 追加装飾でなく、template反復・primitive空間・意味不一致を解く。
- B HITSUGI固有性: 短命、家族、灯、継承、帰還の痕跡が画面と空間を貫く。
- C 実装可能性: ownership、成果物、依存、工数、rollbackが一意である。
- D 検収可能性: 初見task、数値、fixture、性能、証拠が再現可能である。
- E 量産安全性: vertical sliceとthroughput pilotを通らず全件量産できない。

blockingは、誤実装、水増し完了、save破損、性能劣化、未確認asset公開、push誤認を許す欠陥。最大5round。基準はrun中に緩めない。

## ③ラウンド履歴

| Round | 判定 | 得点 A/B/C/D/E | Blocking | 要約 |
|---:|---|---|---:|---|
| 1 | OBJECTIVE FAIL | 未採点 | 3 | Claude向けAR0指示と本文scopeの不一致、検証文の逆方向表現、AR0前のAR1着手を限定修正する |
| 2 | REWORK | 5/5/3/4/5 | 2 | M35同一fileの統合境界と、現行では非永続なDungeonRunに即したversion契約だけを限定修正する |
| 3 | PASS | 5/5/5/5/5 | 0 | 新規closure verifierが2 IDをCLOSED、回帰blocking 0と判定 |

## ④blocking台帳

| ID | State | Consecutive unresolved | Closure evidence | Certifier |
|---|---|---:|---|---|
| `§17.12/ar0-scope-mismatch` | closed | 0 | Round 2独立評価で再発指摘0。成果物11点にAR0の全UI修正を列挙 | independent Round 2 |
| `§17.12/verification-wording` | closed | 0 | Round 2独立評価で再発指摘0。unit/lint/build/5幅/keyboard旅程を全列挙 | independent Round 2 |
| `§17.11/phase-gate-bypass` | closed | 0 | Round 2独立評価で再発指摘0。72時間をAR0だけへ限定しAR1は承認待ち | independent Round 2 |
| `§17.8/m35-file-isolation` | closed | 0 | M35専有path、patch/hash/status/test、path stage、base、統合順、別rollback、未完時停止を確認 | independent Round 3 |
| `§17.8/dungeon-persistence-contract` | closed | 0 | 現行sourceと一致する非永続run、session mapVersion、flag OFF、reload、fixture、将来scope分離を確認 | independent Round 3 |

## ⑤settled list

- `state-path/collision`: non-blocking。既存`docs/CODEX_FORGE_STATE.md`はM34完了証拠として保持し、本runは固有pathを使う。
- `baseline/artifacts`: settled。20260721 PC/mobile before 6点は実在し、0-byte 0、SHA-256をQA文書へ記録済み。
- `prior-masterplan-review`: 参考情報。今回Forgeの合格証拠にはせず、固定rubricで新規評価する。
- `regionVisualV2/resolver-detail`: Round 2 non-blocking。AR2実装開始時にresolver APIを固定する。
- `performance/device-profile`: Round 2 non-blocking。AR0で低性能端末、OS、browser、tool、warm-upを記録する。
- `phase-owner/file-list`: Round 2 non-blocking。各Phase Entryでpath ownershipを固定する。

## ⑥次の一手

Forgeは合格。Claude / Fable 5へ§17.12のAR0契約だけを渡し、AR0 Exitの全直接証拠がPASSするまでAR1へ進まない。

## ⑦次ゴール候補

- 合格後、Claude / Fable 5へAR0だけを渡す。
- AR0実装開始前に`HITSUGI_VISUAL_BIBLE.md`、asset manifest、test scriptを別成果物として作る。

## ⑧terminal印

合格 — 2026-07-21T07:18:58+09:00。Round 3独立closure評価で2 ID CLOSED、5軸5/5/5/5/5、回帰blocking 0。
