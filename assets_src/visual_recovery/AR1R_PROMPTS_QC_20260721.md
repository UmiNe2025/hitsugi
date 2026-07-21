# AR1R Village completion assets — prompts and QC

Date: 2026-07-21

Contract: HITSUGI Visual Bible HVR-1.0

Prompt version: HVR-1.0-AR1R-v1

Generation mode: OpenAI built-in `image_gen`, one call per distinct facade
Acceptance state: primary visual and mechanical QC accepted; independent audit, rights lineage, physical-device performance, and final human acceptance remain pending.

## Scope and provenance

| Asset | Generator output preserved as | Alpha master | Runtime WebP |
|---|---|---|---|
| 星祠 | `generated/ar1r/village-star-shrine-hvr1-v1.png` | `generated/ar1r/village-star-shrine-hvr1-alpha-v1.png` | `public/img/visual-recovery/village/star-shrine-hvr1-v1.webp` |
| 豆腐屋 | `generated/ar1r/village-tofu-shop-hvr1-v1.png` | `generated/ar1r/village-tofu-shop-hvr1-alpha-v1.png` | `public/img/visual-recovery/village/tofu-shop-hvr1-v1.webp` |
| 出立門 | `generated/ar1r/village-departure-gate-hvr1-v1.png` | `generated/ar1r/village-departure-gate-hvr1-alpha-v1.png` | `public/img/visual-recovery/village/departure-gate-hvr1-v1.webp` |

Paths without `public/` are relative to `assets_src/visual_recovery/`. The built-in tool did not expose its underlying model identifier, so the manifest intentionally records `rightsStatus: unverified` and `reviewStatus: needs-review`.

## Shared prompt contract

All three calls requested a single isolated HITSUGI environment sprite in fixed three-quarter top-down projection, whole silhouette inside frame, authored ink-wash/charcoal/washi surface language, upper-left key light, deep indigo/soot material family, and no people. Non-subject pixels had to be a perfectly uniform `#ff00ff` chroma background with no floor, shadow, reflection, gradient, fog, halo, scenery, or border. Text, pseudo-writing, letters, numbers, signs, seals, crests, emblems, watermark, signature, and checkerboard transparency were prohibited.

Per-asset distinguishing clauses:

- 星祠: compact ancestral shrine, low entrance gate, central eight-point star lamp, narrow/tall silhouette; whole roof and steps visible.
- 豆腐屋: low/wide shop, open counter, unmarked three-panel noren, tub, tofu press, stacked trays; no steam or translucent effects.
- 出立門: two unequal posts, one-sided gatehouse roof, open navigable center, one lantern, plain crate and travel bundle; explicitly not a torii or ceremonial gate.

## Processing

Alpha masters were made with:

```text
remove_chroma_key.py --auto-key border --soft-matte
  --transparent-threshold 12 --opaque-threshold 220
  --despill --edge-contract 2
```

`scripts/process_visual_asset.mjs` trims transparent bounds, fits the subject to a safe 512×384 canvas, writes lossless indexed PNG and quality-82 alpha WebP, and rejects visible pixels on a canvas edge or residual magenta-like key pixels. It also generates dark/light checker evidence.

## Automated QC

| Asset | Visible / partial-alpha px | Edge alpha | Key-like px | PNG bytes / SHA-256 | WebP bytes / SHA-256 |
|---|---:|---:|---:|---|---|
| 星祠 | 72,867 / 2,224 | 0 | 0 | 66,324 / `51f6bf5875d00a01a1f67f3c89fbb2c65247c1c3390af8d0c23d822b4376d1f4` | 29,238 / `0886411a6e7e4d682ed6d7f18ce266ffbe5c3ad5ab45a5b78810226028b75579` |
| 豆腐屋 | 101,827 / 1,404 | 0 | 0 | 84,401 / `9cc02c36e0dc5e57a3f1d1e3e4fa77e5f4f3349eb8c555e27413d36b4af118a6` | 32,742 / `886d35a47877cf63aecbe9647fe36763e93cb44c86ac76e8883cdc6565103d23` |
| 出立門 | 66,557 / 2,918 | 0 | 0 | 63,501 / `4877ad8b85a31b1884710b6ca73d56f3d2ae9d1aa31c2a07014a46a98c9f00eb` | 28,736 / `8ac4e3410aaa733d8b440fe72bfb1e82944c10c4afd1f6e333c48ac4d97d7e76` |

Dark/light evidence:

- `generated/ar1r/qc/star-shrine-hvr1-v1-checker.png`
- `generated/ar1r/qc/tofu-shop-hvr1-v1-checker.png`
- `generated/ar1r/qc/departure-gate-hvr1-v1-checker.png`

Manual inspection found no magenta fringe on either checker family, no watermark or pseudo-writing, and distinct silhouettes at runtime scale. The shrine's religious fixtures and the departure gate's open passage must still receive final human/cultural-context review in the live scene.

## Validation

- `npm run check:visual-manifest`: 7 entries / 7 unique IDs, PASS.
- Runtime WebP total: 90,716 bytes.
- Source and runtime hashes are recorded separately in `asset-manifest.json`.
- No asset is production-approved; default-OFF V2, physical-device, blind-user, rights, and user-acceptance gates remain open.
