# Codex Forge State — 全景品質・全ゲーム視覚完成計画

> `docs/CODEX_FORGE_STATE.md`は完了済みM34 Forgeの正本、`docs/CODEX_FORGE_STATE_VISUAL_PLAN.md`は完了済み§17 Forgeの正本であるため上書きせず、本runをこの固有pathで管理する。

## ①対象

- 成果物: `docs/CODEX_MASTERPLAN_DRAFT.md` §18「全景品質・全ゲーム視覚完成計画」
- 利用者: Claude / Fable 5実装者、asset制作者、UI/UX owner、rights/QC、独立tester
- ゴール: 鍛冶場だけが精細で周囲と全ゲームがチープに見える問題を、全route・全地域・全stateで再発不能な実装計画へ収束させる

## ②固定合格ライン

客観条件:

1. 必須節、外部/内部参照、22 Screen ID、40地域、overlay、required state、工数式、権限境界、正典同期に矛盾0。
2. 全routeが担当phase、成果物、工数、Exitへ割り当てられ、closure ledgerだけの水増し完了を許さない。
3. AR1 HOLD、`regionVisualV2`既定OFF、AR2前AR1R、rights/物理性能/rollbackを保持する。
4. `git diff --check`成功、blocking 0。

主観条件は各4/5以上: A 世界/美術のHITSUGI固有性、B 画面別UXと快適な理解、C Claude/Fable 5の実装具体性、D 量産/性能/権利/工数現実性、E 人間の魅力を含む検収可能性。

blockingは、客観失敗、いずれか3以下、未上限scope/工数、非強制の完了条件、AR1/公開境界矛盾、完成素材の孤島を残せる欠陥。最大5round。基準は緩めない。

## ③ラウンド履歴

| Round | 判定 | 得点 A/B/C/D/E | Blocking | 要約 |
|---:|---|---|---:|---|
| 1 | REWORK | 5/5/3/4/5 | 1 | 22 routeを列挙したが、9つの場面系route等が担当phase・成果物・工数へ展開されていない |
| 2 | PASS | 5/5/5/5/5 | 0 | 全22 routeをphase/required state/成果物/Exitへ割当て、base53〜94＋予備0〜12へ再積算 |

## ④blocking台帳

| ID | State | Consecutive unresolved | Closure evidence | Certifier |
|---|---|---:|---|---|
| `§18.5.1+§18.7/route-phase-gap` | closed | 0 | Round 2: Screen 22/22、phase/Exit、52.7〜93.3→53〜94、VC6 18.7〜33.3/cap34、GDD/STATUS同期、diff-checkを確認 | independent Round 2 |

## ⑤settled list

- `§18.7/ar1-hold`: settled。AR1 HOLD、AR2前AR1R、V2既定OFFを維持している。
- `§18.13/approval-boundary`: settled。mock、画像、コード、commit、push、deployは別途明示承認まで禁止。
- `§18.15/polished-island`: settled。全screen/state/region ledgerの未分類/placeholder/mismatch/unverified 0を完了条件にしている。

## ⑥次の一手

Forgeは合格。ユーザーが別途実装を承認した場合だけ§18のVC0を開始し、dirty ownership、closure ledger赤test、物理端末、rights ownerを先に固定する。

## ⑦次ゴール候補

- 合格後、ユーザーが別途実装を承認した場合だけVC0を開始する。
- 実装前にclosure ledgerの赤testとdirty ownershipを固定する。

## ⑧terminal印

合格 — 2026-07-21T11:00:33+09:00。Round 2独立閉鎖評価でA/B/C/D/E=5/5/5/5/5、blocking 0。
