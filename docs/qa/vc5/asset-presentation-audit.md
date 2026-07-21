# VC5 asset presentation audit — 2026-07-21

This report audits only assets actually referenced by current god, enemy, and item data. A perceptual pair is a review candidate, not proof of duplicated identity.

| Group | Required | Present | Missing | Exact duplicate groups | dHash <= 4 | Ratio outliers | Luminance outliers |
|---|---:|---:|---:|---:|---:|---:|---:|
| godsNormal | 180 | 180 | 0 | 0 | 0 | 0 | 0 |
| godsMax | 180 | 180 | 0 | 0 | 0 | 0 | 0 |
| enemiesBase | 180 | 180 | 0 | 0 | 1 | 0 | 2 |
| enemiesYoung | 180 | 180 | 0 | 0 | 1 | 0 | 0 |
| enemiesOld | 180 | 180 | 0 | 0 | 1 | 0 | 0 |
| bosses | 39 | 39 | 0 | 0 | 0 | 0 | 0 |
| items | 810 | 810 | 0 | 0 | 32 | 0 | 2 |
| **Total** | **1749** | **1749** | **0** | **0** | **35** | **0** | **4** |

## Contact sheets

- `gods-normal-contact.png`
- `gods-max-contact.png`
- `enemies-base-contact.png`
- `items-contact.png`

## Acceptance boundary

- Exact decoded duplicates and missing references are blocking.
- dHash, crop, and luminance flags require independent visual review against identity, costume, symbol, pose, background, and crop; they are not auto-failures.
- Normal/MAX and base/young/old identity continuity still requires paired human inspection.
- Replacements remain capped at 12 per batch and require source, rights, crop, runtime, and independent-review records before promotion.

## Contact-sheet visual review

- `godsNormal` has no machine duplicate or luminance blocker, but the latter half mixes detailed deity portraits with lantern landscapes, abstract marks, white-background objects, and seal/sign-like compositions. Presence alone therefore does not prove a coherent pantheon.
- `godsMax` is the P0 presentation risk. Many images do not preserve the normal portrait's face, costume, symbol, pose, or rendering density; silhouettes, lantern/tree scenes, minimal figures, and pseudo-sign motifs recur. No MAX image is approved merely because it exists.
- Enemy base art is substantially more coherent as one combat family. The two low-luminance and three age-pair similarity candidates remain targeted review items, not automatic failures.
- Item icons have no decoded exact duplicates, but their rendering language varies widely. The current corrective path is a consistent inventory frame, slot, rarity, and comparison surface before any wholesale replacement batch.

## Runtime safety applied

- `src/ui/img.ts` owns an explicit `REVIEWED_GOD_MAX_PORTRAITS` allowlist. It is empty until paired human inspection is recorded.
- Pact ritual, confirmation, and portrait panes call `godPresentationImg()`. An unreviewed MAX candidate cannot replace the normal deity identity; the max-affinity state instead uses the code-native `縁` medallion and restrained frame treatment.
- Future MAX approval must be portrait-specific and must record identity continuity, pseudo-text absence, crop, rights, and reviewer. Bulk enablement is prohibited.
