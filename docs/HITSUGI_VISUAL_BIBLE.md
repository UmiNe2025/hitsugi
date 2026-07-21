# HITSUGI Visual Bible — HVR-1.0

Status: AR0 fixed contract

Canonical plan: `docs/CODEX_MASTERPLAN_DRAFT.md` §17
Applies to: Home / 郷 / Dungeon / Battle / 星契り / 鍛冶 / 蔵

## Creative nucleus

> 闇に消えかける一族の記憶を、手渡された小さな灯で次代へ運ぶ。

Every major screen must visually answer at least two questions: whose life or memory is being handled, what is about to be lost, and which light can be passed onward. Beauty without consequence is decoration and is rejected.

## Value, palette, and material

| Role | Token | Fixed use |
|---|---|---|
| Unknown night | `#0b0f1e`, `#101830`, `#182242` | depth in three values; never one flat navy field |
| Boundary / death | `#05070d` | silhouettes, occlusion, and foreground only; not a full-screen fill |
| Inheritable | `#c9a86a` | the one selectable or inheritable focus; not generic borders |
| Living focus | `#e8a33d`, `#ff9d45` | one primary light per screen |
| Irreversible danger | `#c73e3a`, text `#e0655c` | danger and bloodline loss only |
| Reading surface | `#efe6d4`, `#9a917f` | body and secondary text |

- Target distribution is indigo night 90–95%, inheritance gold 4–9%, danger vermilion at most 1% outside crisis states.
- Pure-black area is at most 12% of a normal screenshot. Any low-contrast area larger than 20% must communicate distance, concealment, danger, or calm by silhouette or material.
- The material vocabulary is washi, soot, wet soil, old wood, iron, and cloth. Glass panels are reserved for temporary overlays.
- Texture contrast is 3–7% at native size. No uniform noise, fake paper seam, or checkerboard grid may be visible at 50% scale.

## Perspective and line

- Village and Dungeon: fixed three-quarter top-down view, no horizon, navigation plane readable at 50% scale. Building verticals share one projection within a family.
- Battle: the current region's ground plane continues behind combatants; distant landmark in the top third, contact plane in the middle third, commands in the bottom third.
- Portraits: 3:4 full-body master, face in the upper 22–38%, hands and identity object visible, safe crop variants derived from the same master.
- Environment anchor outline: 2–4 px at a 1600×900 source. Secondary texture lines: 1–2 px. UI icons: silhouette first, detail second.
- Light direction is upper-left for Village/Home and inherited from the region contract in Dungeon/Battle. A family may not mix incompatible light directions.

## Motion and sound

- One ambient motion family per screen: Village smoke/curtain, firefly hollow reverse embers/water, mountain shade wind dust/rope.
- Motion must reveal direction, danger, or life state. Constant zoom, glow on every object, and unsynchronised particles are rejected.
- `prefers-reduced-motion` removes all nonessential loops while leaving POI, danger, selection, and result information visible.
- Every region contract includes one navigation sound and one danger sound. Sound is reinforcement; no required information is audio-only.

## Screen signatures

| Screen | Physical surface | Primary subject | Single signature | Always secondary |
|---|---|---|---|---|
| Home | family seat / genealogy | this month's one decision | a monthly lamp reacts to the endangered person or empty seat | archive, secondary resources |
| Village | lived circular road | current destination and village state | giant lantern compass, facade silhouettes | labels and quick travel |
| Dungeon | survey burned into soot paper | current route and imminent risk | walked path appears in gold mud | inventory and history |
| Battle | ink stage on the same region ground | actor, target, next danger | one brush line from actor to selected target | full log and secondary stats |
| Pact | deity register, portrait dais, offering slip | deity identity and future child change | portrait rite | full deity catalogue |
| Forge | body, slots, workbench | selected person and recommended improvement | one strike, one generation | full inventory and materials |
| Storehouse | shelves and wrapped heirlooms | object identity and lineage | former owner, scar, inheritance count | bulk sorting |

## Region visual contracts

Each region must declare exactly: two ground materials, one dominant value family, one danger value, one landmark, one ambient motion, one sound cue, and one navigation cue.

| Region | Ground materials | Shape / landmark | Motion | Navigation | Danger cue |
|---|---|---|---|---|---|
| 螢火の窪地 | wet soil, shallow black water | low sightline, drowned shrine and firefly reed | reverse-flowing amber embers and water rings | flattened grass and reflected lamps | embers reverse for 3–8 s before a rare encounter |
| 山蔭 | dry rock, stepped scree | long sightline, torn shimenawa and split cliff | blue-white wind dust and rope snap | aligned stone edges and windward cloth | dust stops, pebbles roll, then shadow crosses the path |

If the pair remains distinguishable only by hue, neither is approved for expansion.

## Crop map and control reserve

| Viewport | Safe visual area | Reserved UI area | Never crop |
|---|---|---|---|
| 1440×900 / 1280×720 | inner 92% width, inner 88% height | top 64 px, bottom 176 px in Battle | face, facility entrance, landmark, danger telegraph |
| 768×1024 | inner 90% width, inner 90% height | top 72 px, bottom 220 px | same |
| 390×844 | x 12–378, y 12–832 | top 56 px; bottom 196 px; right 160×160 for movement only where present | same |
| 360×800 | x 12–348, y 12–788 | top 56 px; bottom 196 px; right 160×160 for movement only where present | same |

- All primary controls are at least 44×44 CSS px; movement controls are at least 48×48.
- A background focal point and the primary CTA may not intersect. On mobile the action and movement zones may not intersect.
- Generated lettering, signatures, watermarks, and pseudo-crests are never accepted as information or decoration.

## Runtime asset decomposition

No generated concept sheet is shipped as a complete playable space. It is decomposed into `ground`, `edge`, `facade/prop`, `landmark`, `foreground`, and `effect`; collision and navigation remain code/data owned. Source files live under `assets_src/`; reviewed delivery files alone live under `public/`.

## Acceptance and rejection

An asset or screen is rejected when any one is true:

- pseudo-text, signature, watermark, or unexplained crest is present;
- a deity, enemy, or building drifts between states;
- the silhouette or primary subject fails at 25% scale or a real 360×800 crop;
- perspective, light, line weight, or material density differs inside one family;
- a landmark, entrance, face, or telegraph enters a reserved control area;
- the change only adds a generic navy panel, gold outline, rounded rectangle, or glow;
- provenance, generator/model licence chain, review status, or SHA-256 is missing at release-candidate status.

The creator cannot be the sole acceptance reviewer. Human five-second and journey tests remain release gates; screenshot similarity alone cannot approve a screen.
