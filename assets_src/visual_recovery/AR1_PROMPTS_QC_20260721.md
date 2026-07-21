# AR1 major visual kit — prompts and QC

Date: 2026-07-21

Contract: HITSUGI Visual Bible HVR-1.0

Prompt version: HVR-1.0-AR1-v1

Generation mode: OpenAI built-in image_gen, one call per distinct asset

Visual QC: accepted by an independent Codex reviewer on 2026-07-21 after the edge-contract 2 pass.
Manifest state: needs-review because rights/model lineage and final human acceptance remain pending.

## Scope

Only the four AR1 major cutouts requested for the vertical slice were produced:

| Asset ID | Source output | Alpha master | Runtime PNG / WebP |
|---|---|---|---|
| village_facade_great_lantern | generated/ar1/village-great-lantern-hvr1-v1.png | generated/ar1/village-great-lantern-hvr1-alpha-v1.png | public/img/visual-recovery/village/great-lantern-hvr1-v1.png and .webp |
| village_facade_forge_storehouse | generated/ar1/village-forge-facade-hvr1-v1.png | generated/ar1/village-forge-facade-hvr1-alpha-v1.png | public/img/visual-recovery/village/forge-facade-hvr1-v1.png and .webp |
| dungeon_hotarubi_landmark_drowned_shrine_firefly_reed | generated/ar1/hotarubi-drowned-shrine-firefly-reed-hvr1-v1.png | generated/ar1/hotarubi-drowned-shrine-firefly-reed-hvr1-alpha-v1.png | public/img/visual-recovery/hotarubi/drowned-shrine-firefly-reed-hvr1-v1.png and .webp |
| dungeon_hotarubi_foreground_root_reed | generated/ar1/hotarubi-foreground-root-reed-hvr1-v1.png | generated/ar1/hotarubi-foreground-root-reed-hvr1-alpha-v1.png | public/img/visual-recovery/hotarubi/foreground-root-reed-hvr1-v1.png and .webp |

Paths in this document are relative to assets_src/visual_recovery unless they begin with public/.

## Prompts

### Village great lantern

~~~text
Use case: stylized-concept
Asset type: HITSUGI top-down three-quarter game environment landmark cutout; village great lantern facade/silhouette; collision remains code-owned
Primary request: one monumental ancestral village lantern structure that functions as a compass-like landmark and can be recognized by silhouette alone; broad soot-dark timber frame, weathered old wood base, a single large warm lamp chamber, modest iron fittings; no people and no surrounding scene
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for local background removal
Subject: a single complete village great-lantern facade, fully separated from the background, entrance/base and whole roof silhouette visible
Style/medium: original hand-painted ink wash and charcoal game art with restrained washi grain; authored irregularity, not polished 3D, not generic fantasy concept art
Composition/framing: fixed three-quarter top-down view, no horizon, readable navigation plane; centered with generous padding; strong asymmetric silhouette; verticals consistent; suitable for a 1024x1024 transparent runtime sprite
Lighting/mood: upper-left light; night materials remain legible; exactly one restrained warm amber-orange living light, otherwise deep indigo and soot black
Color palette: #0b0f1e #101830 #182242 for night depth, #05070d for silhouette only, #e8a33d/#ff9d45 for the single lamp, tiny #c9a86a inheritance accent; no large pure-black fill
Materials/textures: washi, soot, wet old wood, aged iron; texture contrast subtle and readable at 25 percent scale; primary outline equivalent to 2-4 px at 1600x900
Constraints: the subject must be opaque; background must be one perfectly uniform #ff00ff with no shadow, gradient, texture, floor plane, reflection, cast shadow, contact shadow, or lighting variation; crisp isolated edges; do not use #ff00ff anywhere in the subject; no text, no symbols, no seals, no crests, no glyphs, no pseudo-writing, no watermark, no signature; one asset only
Avoid: torii, shrine ropes, signage, letters, runes, decorative emblems, neon glow, ornate gold filigree, blue-only color grading, photorealism, horizon, full environment, characters, checkerboard texture
~~~

### Village forge

~~~text
Use case: stylized-concept
Asset type: HITSUGI top-down three-quarter game environment facade cutout; village forge; collision remains code-owned
Primary request: one compact lived-in village forge facade recognizable by silhouette alone; low heavy roof, broad open working entrance, short offset chimney, one sturdy exterior anvil block and restrained smoke-blackened iron fittings; no people and no surrounding scene
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for local background removal
Subject: a single complete forge building facade, fully separated from the background, entrance and chimney clearly visible
Style/medium: original hand-painted ink wash and charcoal game art with restrained washi grain and imperfect human brush edges; not polished 3D, not generic fantasy concept art
Composition/framing: fixed three-quarter top-down view, no horizon, readable ground-contact plane; centered with generous padding; wide low silhouette clearly different from the great lantern; consistent vertical projection; suitable for a 1024x768 transparent runtime sprite
Lighting/mood: upper-left light; night materials remain legible; exactly one small restrained warm amber forge-mouth light, otherwise deep indigo and soot black
Color palette: #0b0f1e #101830 #182242 for night depth, #05070d for occlusion only, #e8a33d/#ff9d45 for the single forge light, minute #c9a86a metal-edge accent; no danger red
Materials/textures: soot, old wood, blackened iron, wet soil residue, cloth curtain without marks; subtle texture that survives 25 percent scale; primary outline equivalent to 2-4 px at 1600x900
Constraints: the subject must be opaque; background must be one perfectly uniform #ff00ff with no shadow, gradient, texture, floor plane, reflection, cast shadow, contact shadow, or lighting variation; crisp isolated edges; do not use #ff00ff anywhere in the subject; no text, no symbols, no seals, no crests, no glyphs, no pseudo-writing, no watermark, no signature; one asset only
Avoid: shop sign, lettering, runes, weapon display, decorative emblem, shrine architecture, neon glow, ornate gold, blue-only grading, photorealism, horizon, full environment, characters, checkerboard texture
~~~

### Firefly Hollow drowned shrine / firefly reeds

~~~text
Use case: stylized-concept
Asset type: HITSUGI top-down three-quarter dungeon landmark cutout for the Firefly Hollow region; collision remains code-owned
Primary request: one drowned shrine remnant fused with a distinctive firefly-reed landmark; a low collapsed timber shelter half-submerged in a small irregular patch of black water and wet soil, broken plain posts, flattened reed fans, and a sparse trail of discrete amber firefly points flowing visually against the water-ring direction; no characters and no surrounding room
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for local background removal
Subject: one complete composite landmark with its irregular wet-ground footprint, fully separated from the background; low sightline and unmistakable silhouette
Style/medium: original hand-painted ink wash and charcoal game art with restrained washi grain and visible authored brush irregularity; not polished 3D, not generic fantasy concept art
Composition/framing: fixed three-quarter top-down view, no horizon, navigation plane legible; centered with generous padding; asymmetrical low silhouette; consistent projection; suitable for a transparent runtime sprite and readable at 25 percent scale
Lighting/mood: dim region light inherited from upper-left; one restrained warm amber firefly cluster, deep layered indigo night, somber and waterlogged
Color palette: #0b0f1e #101830 #182242 for depth, #05070d only for occlusion and water center, #e8a33d/#ff9d45 sparse firefly points, slight #c9a86a reflected-lamp edge; no danger red
Materials/textures: wet soil, shallow black water, soaked old wood, crushed reeds, subtle water rings; discrete firefly points with hard painterly edges and no soft transparent halo
Constraints: all visible subject pixels must be opaque, including the water footprint and firefly points; background must be one perfectly uniform #ff00ff with no shadow, gradient, texture, floor plane, reflection, cast shadow, contact shadow, or lighting variation; crisp isolated outer edges; do not use #ff00ff anywhere in the subject; no text, no symbols, no seals, no crests, no glyphs, no pseudo-writing, no watermark, no signature; one asset only
Avoid: intact ceremonial gate, readable iconography, rope, paper streamers, grave markers, lettering, runes, decorative emblem, neon glow, bright green reeds, blue-only color grading, horizon, full environment, characters, checkerboard texture
~~~

### Firefly Hollow foreground root / reeds

~~~text
Use case: stylized-concept
Asset type: HITSUGI transparent foreground overlay cutout for the Firefly Hollow dungeon; collision remains code-owned
Primary request: one wide foreground silhouette made from a single tangled old root mass interwoven with bent wet reeds; it should frame and occlude only the lower edge of a playable scene while leaving large open negative space above; no landmark building, no characters, no surrounding room
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for local background removal
Subject: an opaque connected root-and-reed silhouette spanning most of the lower width, with two unequal rising clusters and a clear low center notch so navigation remains readable
Style/medium: original ink wash and charcoal game art with restrained washi grain, bold authored brush silhouette, sparse internal grain; not polished 3D, not generic fantasy concept art
Composition/framing: fixed three-quarter top-down environmental perspective, no horizon; very wide low composition; all outer edges fully visible with generous padding; strong silhouette at 25 percent scale; suitable for a transparent runtime foreground overlay
Lighting/mood: dim upper-left rim catches only; deep soot and indigo occlusion; no lamp and no glow
Color palette: #05070d for the main occluding silhouette, #0b0f1e #101830 #182242 for readable layered depth, tiny muted brown-gray reed edges; no amber, no red
Materials/textures: wet old roots, muddy reed stems, charcoal brush dry-edge texture; internal contrast subtle, outer contour crisp
Constraints: every visible root and reed pixel must be opaque and connected to the main foreground mass; background must be one perfectly uniform #ff00ff with no shadow, gradient, texture, floor plane, reflection, cast shadow, contact shadow, or lighting variation; crisp isolated edges; do not use #ff00ff anywhere in the subject; no soft wisps and no isolated hair-thin floating stems; no text, no symbols, no seals, no crests, no glyphs, no pseudo-writing, no watermark, no signature; one asset only
Avoid: fireflies, smoke, fog, translucent strands, shrine, stones, signage, lettering, runes, decorative emblem, bright green foliage, neon, blue-only grading, horizon, full environment, characters, checkerboard texture
~~~

## Processing

Each source was copied from the built-in generator directory into generated/ar1 before processing. Alpha masters were created with the installed imagegen helper:

~~~text
python %CODEX_HOME%/skills/.system/imagegen/scripts/remove_chroma_key.py
  --input <versioned source>
  --out <versioned alpha master>
  --auto-key border
  --soft-matte
  --transparent-threshold 12
  --opaque-threshold 220
  --despill
  --edge-contract 2
~~~

The alpha masters remain lossless. Runtime files were resized with Lanczos3 using Sharp 0.35.3, placed on transparent safe canvases, encoded as indexed PNG and quality-82 WebP with alpha. Final runtime dimensions were chosen for intended 128–360 px display: 512x512, 512x384, 512x384, and 768x384.

## Automated QC

All alpha statistics use alpha > 16. The 25% column is the actual downsampled runtime sprite, not a zoomed native image.

| Asset | Runtime size | PNG bytes / SHA-256 | WebP bytes / SHA-256 | Edge alpha | Key-like pixels | 25% size / margins L,R,T,B | 25% largest component |
|---|---:|---|---|---:|---:|---|---:|
| great lantern | 512x512 | 71,779 / a85fcb6b78077ed3ba022d0d9597de049ba79ea03283a27c9c6319bcb663c037 | 29,812 / 7190bc2f0c1e08e9af33a43b447b0fba93ec3054d97ea59c0e7e9a018baed305 | 0 | 0 | 128x128 / 25,24,8,9 | 100.000% |
| forge | 512x384 | 69,259 / b15bdbaff4dc47050571641e3686c00c004575b5194ab3d956f4108bac74fde7 | 21,224 / aec7444229ace8a2df5fe14be3dbb48b57abf3b51d5f80ae4eb35b411a51e2e6 | 0 | 0 | 128x96 / 13,13,9,10 | 100.000% |
| drowned shrine / reeds | 512x384 | 70,920 / dd9379116ab4c8f0e6563a3fabe06afda77d63694e3e3c1d5fb1549a9139d436 | 28,362 / 171892dad9eb5be64d52e68e3d558d0b0b6be4ed957d0c0b09cb70803496ebd2 | 0 | 0 | 128x96 / 13,12,15,11 | 100.000% |
| foreground roots / reeds | 768x384 | 61,850 / 64cc5973816dca1eabc4d17c6e0de39261644863785b5964685bb22019c3c399 | 50,204 / 27f790842e974254962a58d28d9a5794bcc2668229ad10b8bfc5217ebb753644 | 0 | 0 | 192x96 / 4,5,11,7 | 98.404% |

Checks:

- PNG and WebP dimensions match, both retain alpha, and all four corners are transparent.
- No alpha-bearing pixel reaches a canvas edge.
- No residual magenta-like key pixel was detected after edge contraction.
- All WebP files are below 150 KB; total WebP delivery is 129,602 bytes.
- At 25%, the great-lantern and forge silhouettes remain distinct; forge entrance and chimney remain readable.
- At 25%, the drowned low-roof/water footprint remains distinct from the wide two-cluster foreground silhouette.
- The foreground's largest connected component retains 98.404% of visible 25% pixels; the remaining specks are fine reed antialias fragments, not separate props.
- Manual visual inspection found no text, pseudo-writing, signature, watermark, seal, crest, or unexplained symbol.
- Upper-left lighting, indigo/soot material family, and restrained warm-light hierarchy are coherent across the four assets.
- Independent post-fix inspection found zero green fringe or halo on dark and light checker backgrounds; the transparent boundaries were accepted for the four intended uses.

Dark and light checker evidence:

- generated/ar1/qc/village-great-lantern-25pct-checker-v1.png
- generated/ar1/qc/village-forge-facade-25pct-checker-v1.png
- generated/ar1/qc/hotarubi-drowned-shrine-firefly-reed-25pct-checker-v1.png
- generated/ar1/qc/hotarubi-foreground-root-reed-25pct-checker-v1.png

## Source hashes

| File | SHA-256 |
|---|---|
| hotarubi-drowned-shrine-firefly-reed-hvr1-v1.png | eacd9d08213485a6c03dee68f3afd9e6e4f5db8fcfbdbac2b6169b8385ce24cb |
| hotarubi-drowned-shrine-firefly-reed-hvr1-alpha-v1.png | 0f39a07dc024d88bdb4c5502fcdfc42ccd320bf5146f5256ad967e3294c315ee |
| hotarubi-foreground-root-reed-hvr1-v1.png | 39813fc097a2b1603e705fb2731b5b7d81e5067e49bb0ec3d84397a97f32a247 |
| hotarubi-foreground-root-reed-hvr1-alpha-v1.png | 9fe1c8ac9b51c758dff690d02eab06c31cc5db3b8468bc18a4d037f0f068f5f7 |
| village-forge-facade-hvr1-v1.png | c6fa54db411f278722620da81e65e6dc8ed45be3aa7f5abea04da064d04ef973 |
| village-forge-facade-hvr1-alpha-v1.png | 2ac65229f15dfd024a7d445bd3643da396521168b7d1e818667e1d23420bd304 |
| village-great-lantern-hvr1-v1.png | f77a8cb4a1c9887fce5adc7e1b37249bccadd9b9c675b06f7b6ca0bff5466ddf |
| village-great-lantern-hvr1-alpha-v1.png | 8c3608349c1a5a7be0501bf8ab7cc22db71ab998b0cb5f6653334b8526bd8517 |

## Rejected or superseded outputs

- No built-in generated source image was rejected; each of the four calls produced one usable distinct source.
- The initial alpha pass without edge contraction was superseded because visible chroma fringe remained.
- The edge-contract 1 pass was rejected after an independent visual review still found neon fringe on roofs, reeds, and roots. The final alpha masters use edge-contract 2 and were rechecked on dark and light checker backgrounds.
- The initial lossless runtime WebP set was rejected for excessive delivery weight (about 2.44 MB total). The final set is 129,602 bytes total.

## Rights and acceptance boundary

The built-in tool did not expose the underlying image-model identifier. The manifest records this gap; model/license lineage and commercial redistribution remain unverified. Independent visual QC is accepted, but the manifest remains needs-review because the current validator only permits accepted when rightsStatus is cleared. Final human acceptance, rights, runtime crop, five-second, journey, and performance gates remain required before release-candidate use.
