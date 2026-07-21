# M35 worktree handoff before AR0

Date: 2026-07-21 JST

Branch: `main`
Base HEAD / `origin/main`: `7966fa25daf5b34e5cbb829c9510d3b1f3895b77`

## Purpose

M35の「星契り」見切れ修正と固有御影差し替えを、後続AR0が同じ`Pact.tsx`へ触れる前に復元可能な形で固定する。これはcommitではなく、既存dirty worktreeを保持したままの統合境界である。push / deployは行っていない。

## M35 owner paths

Tracked:

- `docs/GDD_v3.md`
- `docs/WORKLOG.md`
- `src/core/data/gods_low.ts`
- `src/ui/Pact.tsx`

Untracked:

- `public/img/god_kaboshi_v2.jpg`
- `public/img/god_kaboshi_v2_max.jpg`
- `src/ui/pact_m35.css`
- `tests/visual/pact.spec.ts`

## Tracked recovery patch

- Path: `docs/qa/patches/m35-before-ar0.patch`
- Bytes: `7738`
- SHA-256: `9C3B6660108B92E68426E099DF874A57033E2E46B080D1A9DC5DAA2BDD98E7B3`
- Verification: `git apply --reverse --check --whitespace=nowarn docs/qa/patches/m35-before-ar0.patch` PASS

Patch内のnumstat:

| File | Added | Deleted |
|---|---:|---:|
| `docs/GDD_v3.md` | 8 | 0 |
| `docs/WORKLOG.md` | 10 | 0 |
| `src/core/data/gods_low.ts` | 1 | 1 |
| `src/ui/Pact.tsx` | 2 | 0 |

復元時は同一baseへpatchを適用し、下記4つのuntracked素材を対応するhashで戻す。AR0実装後の`Pact.tsx`全体diffをM35 patchと誤認しないこと。

## Untracked artifact hashes

| File | Bytes | SHA-256 |
|---|---:|---|
| `public/img/god_kaboshi_v2.jpg` | 203664 | `17C1F29B4261F9C4EF9EA517D23927F6F0F3E84A47281324D68A066BE90D33CD` |
| `public/img/god_kaboshi_v2_max.jpg` | 126374 | `0DEACE7DC1FE67EA4C6FE6E639B9D6C297CD767B49EC9AA6DBB8FB05880AA916` |
| `src/ui/pact_m35.css` | 2765 | `7CABD3BFF4880CABD5A200F460839A7FAD41451922D6251CCCEBA86D73D0B2B1` |
| `tests/visual/pact.spec.ts` | 3611 | `82442787D73E5418421FC105FF1A2B0B9D0C7844ADD8BFB69F5F71BC8DE3AA0B` |

## Direct validation

The aggregate command initially produced `1 passed / 9 failed` because Playwright's shared Vite web server stopped after the first case; the remaining failures were all `net::ERR_CONNECTION_REFUSED http://localhost:5173/`, not layout assertions. Each viewport was therefore rerun in its own server lifecycle:

- `npx playwright test tests/visual/pact.spec.ts --project=pc-1440` — 2/2 PASS
- `npx playwright test tests/visual/pact.spec.ts --project=pc-1280` — 2/2 PASS
- `npx playwright test tests/visual/pact.spec.ts --project=tablet-768` — 2/2 PASS
- `npx playwright test tests/visual/pact.spec.ts --project=mobile-390` — 2/2 PASS
- `npx playwright test tests/visual/pact.spec.ts --project=mobile-360` — 2/2 PASS

Total: 10/10 PASS. The covered contract is 3:4 portrait containment, the visible offering panel, horizontal overflow zero, bottom reachability, and fixed CTA clearance.

## Integration boundary

- This snapshot closes the M35 handoff gate without staging or committing user-owned dirty changes.
- AR0 may now edit `Pact.tsx` sequentially, but must preserve the M35 import and portrait heading recorded in the patch.
- `pact_m35.css` and `tests/visual/pact.spec.ts` remain M35-owned; AR0-specific behavior/tests should use separate files where practical.
- Any final audit must rerun all five M35 viewport projects and compare these hashes or explicitly record intentional replacements.
- No commit, push, or deploy was performed.
