# AR0 blocking defect ledger

Version: HVR-1.0

All rows are blocking until the direct gate is green at 360, 390, 768, 1280, and 1440 CSS px unless a narrower fixture is stated.

| ID | Screen | Reproduced cause | Required correction | Direct gate | Owner |
|---|---|---|---|---|---|
| AR0-P0-HOME-OVERFLOW | Home | `.family-smalls` children have intrinsic `min-width:168px`; grid ancestors lacked `min-width:0`, expanding a 375px document to 1049px | contain intrinsic width; internal family rail may scroll but document may not | document `scrollWidth <= clientWidth`; family rectangles stay in viewport | Home/Pact |
| AR0-P0-BATTLE-TOP | Battle | wrapped turn chips, fixed settings button, reward forecast, enemy intent, and enemy cards share the mobile top band | reserve non-overlapping bands; turn row never wraps and every chip remains inside parent | rectangle intersection 0 for 1v2, 4v4, boss; each chip inside order strip | Battle |
| AR0-P0-VILLAGE-CONTROLS | Village | action prompt, dialogue strip, and D-pad occupy the same bottom coordinates; unscoped Dungeon `.dpad` leaks into Village | separate action/movement zones; dialogue explicitly disables movement; screen-scope D-pad rules | zone intersection 0, edge inset ≥12px, each movement target ≥48px | Spaces |
| AR0-P0-DUNGEON-RETURN | Dungeon | desktop return takes open+confirm while mobile hides it behind rest, requiring three operations | always-visible return opens the safety confirmation in one operation; irreversible confirm remains second operation | return control visible once; one click reaches confirmation at all widths and 10% light | Spaces |
| AR0-P0-DUNGEON-MAP | Dungeon | a visible HUD entry and a transparent canvas-sized tap zone provide two inconsistent entrances | remove transparent zone; keep one visible named control | exactly one visible semantic map button | Spaces |
| AR0-P0-DUNGEON-DOM | Dungeon | objective exists in DOM, but discovered POIs live only in engine state and return rules appear only in a sheet | engine exposes discovered POIs read-only; DOM guide holds objective, real discovered POIs, and return rule | guide is outside canvas and text is obtainable; used POI is not treated as discovered | Spaces |
| AR0-P0-SEMANTICS | Home/Pact | clickable `CharCard` root is a `div`; focus style exists but cannot be reached | native button only when actionable, `aria-pressed`, focus retained/restored | Tab, Enter, Space, visible focus, Escape/close return focus | Home/Pact |
| AR0-P0-PACT-AVAILABILITY | Pact | one `affordable` flag controls both viewing and contracting, so an unlocked unaffordable deity cannot be inspected | split viewable from contractable; only execution CTA is disabled with reason | hoto=0 unlocked deity opens details; CTA disabled and reason present; sealed deity does not open | Home/Pact |
| AR0-P0-BATTLE-EXECUTION | Battle | enemy card, attack button, and number key can call `runCommand` immediately | single `target → confirm preview → execute` state path; selection never mutates battle | HP/turn/log unchanged until explicit execute; keyboard path and two-step Escape pass | Battle |

## Safety interpretations

- “Dungeon return within one operation” means one operation to reach the confirmation sheet. Irreversible return remains a second explicit operation; direct one-tap departure is rejected if any accidental return occurs.
- “One map control” counts semantic controls and hit areas, not only visible button text.
- A POI is discovered only when engine discovery state says so. `run.used` is not a substitute.
- A green geometry test is insufficient if a five-second participant cannot identify the map entrance or return method; the human gate remains separate.
