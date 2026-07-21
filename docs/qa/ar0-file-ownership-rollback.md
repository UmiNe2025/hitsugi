# Visual recovery ownership and rollback units

Version: HVR-1.0

Rule: one owner per path at a time; no stash-based handoff; no push without user approval.

| Unit | Owner path | Must not modify | Rollback unit | Gate |
|---|---|---|---|---|
| M35 Pact base | `src/ui/Pact.tsx`, `src/core/data/gods_low.ts`, `src/ui/pact_m35.css`, `tests/visual/pact.spec.ts`, `public/img/god_kaboshi_v2*.jpg` | AR0 behaviour before handoff | `docs/qa/patches/m35-before-ar0.patch` + recorded untracked hashes | five viewports 10/10 |
| AR0 Home/Pact | Home/Pact/components files and separate AR0 tests | M35 image/crop/offering layout | AR0-only diff from M35 handoff | keyboard, focus, overflow, browse-vs-contract |
| AR0 Battle | `src/ui/Battle.tsx`, `battle_m24.css`, `battle_m25.css`, Battle tests | combat math and other screens | target-confirm unit | collision zero and one execution path |
| AR0 spaces | Dungeon/Village UI/CSS plus explicit engine read API | Battle/Home/Pact | spatial-safety unit | map/return/DOM guidance and control zones |
| AR1 Village slice | feature-flagged Village renderer/data/assets | collision and navigation coordinates | `regionVisualV2` off | one forge facade, ground, foreground, two states |
| AR1 Dungeon A | feature-flagged region kit and renderer | save schema and navigation graph | `regionVisualV2` off for new runs | material/landmark/crop/performance |
| AR1 Battle inheritance | stage-contract resolver and stage layers | turn/combat resolution | v1 stage resolver | region continuity and target clarity |
| AR2 region system | visual contracts, session-local map version, A/B kits | `GameData` persistence | new departures use v1; active run keeps captured version | session fixtures and two-region blind test |
| AR3 surfaces | Home/Pact/Forge/Storehouse surface-specific units | spatial renderer | per-screen feature flag or isolated commit | five-second and payload gates |

## Integration rules

- A worker may edit only its assigned paths and reports any cross-owner dependency instead of editing through it.
- Before a shared path changes owners, record base HEAD, `git status --short`, tracked patch, untracked SHA-256, and targeted tests.
- AR0 may be reverted without removing the M35 portrait/crop work. AR1 visual changes must be disabled without changing collision, saves, rewards, or story data.
- `DungeonRun` stays session-only. A future `mapVersion` belongs to `DungeonRun`, is captured at departure, and is never added to `GameData` in this programme.
- A failed human, performance, identity, or provenance gate stops expansion. It does not trigger unbounded decoration.

## Release boundary

Local implementation, tests, and documentation are authorised. Commit, push, deploy, external participant recruitment, paid generation, and publication require the user's explicit approval. In this repository push is deployment.

## AR0 runtime rollback evidence（2026-07-21）

- Patch: `docs/qa/patches/ar0-runtime-only.patch`
- Size / SHA-256: 104,709 bytes / `0AE892E27B8D80B0B697B05FCCF031E314F5B046893631AE888AE2A9D463F1CF`
- Base: HEAD `7966fa25daf5b34e5cbb829c9510d3b1f3895b77`へ`m35-before-ar0.patch`だけを適用した一時worktree。
- Forward: `git apply --check` PASS、適用後のAR0 25ファイルはLF/CRLFを正規化して現worktreeと25/25一致。
- Reverse: `git apply --reverse --check`とreverse applyがPASS。
- M35保全: `docs/GDD_v3.md`、`docs/WORKLOG.md`、`src/core/data/gods_low.ts`、`src/ui/Pact.tsx`のM35-base hashはAR0 reverse前後で不変。
- 一時worktreeは検証後に安全確認して削除済み。commit、push、deployなし。
