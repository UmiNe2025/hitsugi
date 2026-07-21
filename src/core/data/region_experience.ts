import type { GroundKind, LandmarkKind, ParticleKind } from './region_visuals'

// VC4/VC6: legacy bg family is kept for save/map compatibility, while these
// player-facing macro biomes define distinct material histories.
export type ExperienceMacroBiome =
  | 'wetland-border'
  | 'stone-prayer-road'
  | 'timber-city-remains'
  | 'bone-star-frontier'

export type ValueFamily =
  | 'wet-ink-low'
  | 'soot-amber-low'
  | 'blue-iron-low'
  | 'bone-violet-low'

export type DangerPressure = 'watchful' | 'hostile' | 'severe' | 'terminal'

export interface RegionExperienceProfile {
  macroBiome: ExperienceMacroBiome
  // Two tactile surfaces are required in every frame; exact pairs are unique.
  groundMaterials: readonly [primary: string, secondary: string]
  valueFamily: ValueFamily
  danger: {
    pressure: DangerPressure
    cueId: string
    shapeCue: string
    leadSeconds: readonly [min: number, max: number]
  }
  silhouette: {
    profileId: string
    boundary: string
    rhythm: string
  }
  landmark: {
    id: string
    form: string
    signatureKind?: LandmarkKind
    signaturePriority?: number
  }
  ambientMotion: {
    id: string
    kind: ParticleKind
    maxInstances: number
  }
  soundCue: {
    id: string
    family: string
    maxConcurrent: 1
    carryIntoBattle: true
  }
  navigationCue: {
    id: string
    form: string
    rule: string
  }
  render: {
    groundKind: GroundKind
    particleKind: ParticleKind
  }
}

const wet = (
  profile: Omit<RegionExperienceProfile, 'macroBiome' | 'valueFamily'>,
): RegionExperienceProfile => ({ macroBiome: 'wetland-border', valueFamily: 'wet-ink-low', ...profile })

const stone = (
  profile: Omit<RegionExperienceProfile, 'macroBiome' | 'valueFamily'>,
): RegionExperienceProfile => ({ macroBiome: 'stone-prayer-road', valueFamily: 'soot-amber-low', ...profile })

const timber = (
  profile: Omit<RegionExperienceProfile, 'macroBiome' | 'valueFamily'>,
): RegionExperienceProfile => ({ macroBiome: 'timber-city-remains', valueFamily: 'blue-iron-low', ...profile })

const bone = (
  profile: Omit<RegionExperienceProfile, 'macroBiome' | 'valueFamily'>,
): RegionExperienceProfile => ({ macroBiome: 'bone-star-frontier', valueFamily: 'bone-violet-low', ...profile })

const danger = (pressure: DangerPressure, cueId: string, shapeCue: string): RegionExperienceProfile['danger'] => ({
  pressure,
  cueId,
  shapeCue,
  leadSeconds: pressure === 'terminal' ? [2, 5] : pressure === 'severe' ? [3, 6] : [3, 8],
})

const motion = (id: string, kind: ParticleKind, maxInstances: number): RegionExperienceProfile['ambientMotion'] => ({
  id,
  kind,
  maxInstances,
})

const sound = (id: string, family: string): RegionExperienceProfile['soundCue'] => ({
  id,
  family,
  maxConcurrent: 1,
  carryIntoBattle: true,
})

const nav = (id: string, form: string, rule: string): RegionExperienceProfile['navigationCue'] => ({ id, form, rule })

// All art instructions below are code-native: no file path or external texture is
// allowed in this table. Exact material, silhouette, and navigation keys are
// intentionally unique, so a region cannot pass as a palette-only variant.
export const REGION_EXPERIENCES: Record<string, RegionExperienceProfile> = {
  yoi_forest: wet({
    groundMaterials: ['root-packed loam', 'damp mushroom litter'],
    danger: danger('watchful', 'branch-snap-ahead', 'one low branch bends against travel'),
    silhouette: { profileId: 'low-canopy-lantern-gap', boundary: 'arched roots under a low canopy', rhythm: 'three trunks, one open lantern gap' },
    landmark: { id: 'old-mushroom-cairn', form: 'flat gathering stones beneath a split cedar' },
    ambientMotion: motion('moth-drift-between-roots', 'firefly', 22),
    soundCue: sound('wet-leaf-step', 'leaf-and-distant-owl'),
    navigationCue: nav('warm-mushroom-trail', 'pale caps form a broken line', 'caps always continue toward the next walkable opening'),
    render: { groundKind: 'soil', particleKind: 'firefly' },
  }),
  hotarubi_no_kubochi: wet({
    groundMaterials: ['reed-bound mud', 'shallow black water'],
    danger: danger('watchful', 'reverse-ember-flow', 'fireflies reverse into a narrow stream'),
    silhouette: { profileId: 'sunken-basin-shrine', boundary: 'reeds descend into a circular basin', rhythm: 'low reeds, drowned stone, low reeds' },
    landmark: { id: 'drowned-lantern-shrine', form: 'half-submerged stone lantern and reed crown', signatureKind: 'sunken_lantern', signaturePriority: 1 },
    ambientMotion: motion('paired-fireflies-and-water-rings', 'firefly', 34),
    soundCue: sound('hollow-water-ring', 'water-and-reed'),
    navigationCue: nav('reflected-lamp-lane', 'paired reflections in shallow water', 'the unbroken reflection marks the traversable bank'),
    render: { groundKind: 'moss', particleKind: 'firefly' },
  }),
  nureen_no_tsuji: wet({
    groundMaterials: ['rain-darkened boards', 'crossroad water film'],
    danger: danger('watchful', 'following-ripple', 'a second ripple copies each footfall'),
    silhouette: { profileId: 'four-eaves-crossroad', boundary: 'four low eaves point into an empty junction', rhythm: 'roof tip, gap, roof tip, flooded center' },
    landmark: { id: 'dry-bell-wet-post', form: 'a dry bell hanging from a dripping post' },
    ambientMotion: motion('sideways-mist-over-ripples', 'fog', 12),
    soundCue: sound('unseen-second-step', 'drip-and-board'),
    navigationCue: nav('single-dry-board', 'one pale board remains dry', 'follow dry grain across the wet crossing'),
    render: { groundKind: 'water_film', particleKind: 'fog' },
  }),
  nemurijizou_no_michi: wet({
    groundMaterials: ['moss-padded flagstone', 'incense-grey silt'],
    danger: danger('watchful', 'bowing-statue-count', 'one silhouette lowers after the party passes'),
    silhouette: { profileId: 'bowed-jizo-procession', boundary: 'small stone figures close both verges', rhythm: 'equal heads interrupted by one empty plinth' },
    landmark: { id: 'sleeping-jizo-row', form: 'a row of bowed jizo and one vacant base', signatureKind: 'jizo_row', signaturePriority: 2 },
    ambientMotion: motion('moss-spore-breath', 'pollen', 18),
    soundCue: sound('stone-bib-rustle', 'moss-and-small-bell'),
    navigationCue: nav('red-bib-facing', 'faded bib knots face one direction', 'walk opposite the knots to avoid the returning loop'),
    render: { groundKind: 'moss', particleKind: 'pollen' },
  }),
  karasu_no_sato: wet({
    groundMaterials: ['ash-soft village earth', 'feather-clogged drainage'],
    danger: danger('watchful', 'roof-feather-lift', 'black feathers rise before an ambush'),
    silhouette: { profileId: 'empty-village-roof-teeth', boundary: 'collapsed farm roofs make a serrated horizon', rhythm: 'two huts, bare tree, broken loft' },
    landmark: { id: 'crowless-watchtower', form: 'a leaning watch platform packed with empty nests' },
    ambientMotion: motion('feather-pollen-lift', 'pollen', 16),
    soundCue: sound('hollow-roof-peck', 'timber-and-feather'),
    navigationCue: nav('white-tail-feather', 'single white feathers pin to fence corners', 'white feather tips point to the route not watched from above'),
    render: { groundKind: 'ash', particleKind: 'pollen' },
  }),
  tourou_kuzure_michi: wet({
    groundMaterials: ['broken shrine stone', 'ember-warmed moss'],
    danger: danger('watchful', 'wrong-lantern-flare', 'one broken lantern burns blue and widens'),
    silhouette: { profileId: 'fallen-lantern-spine', boundary: 'tilted stone lanterns form a jagged spine', rhythm: 'fallen, upright, missing, fallen' },
    landmark: { id: 'three-piece-lantern-arch', form: 'three broken lantern caps balanced as an arch' },
    ambientMotion: motion('low-ember-breath', 'firefly', 26),
    soundCue: sound('stone-wick-hiss', 'ember-and-stone'),
    navigationCue: nav('intact-flame-side', 'only one face of each lantern is lit', 'keep lit faces on the left to advance'),
    render: { groundKind: 'stone', particleKind: 'firefly' },
  }),
  mushishigure_michi: wet({
    groundMaterials: ['insect-shell loam', 'bamboo-leaf mulch'],
    danger: danger('watchful', 'wing-noise-drop', 'the dense wing noise stops in a wedge ahead'),
    silhouette: { profileId: 'bamboo-funnel-cloud', boundary: 'bamboo leans inward beneath an insect canopy', rhythm: 'tight stalks, low cloud, sudden clearing' },
    landmark: { id: 'molted-wing-gate', form: 'two bamboo poles webbed with translucent cast wings' },
    ambientMotion: motion('vertical-wing-rain', 'rain', 36),
    soundCue: sound('layered-wing-shigure', 'insect-and-bamboo'),
    navigationCue: nav('quiet-air-channel', 'a narrow channel has no wing particles', 'the quiet channel leads forward but warns of a nearby threat'),
    render: { groundKind: 'soil', particleKind: 'rain' },
  }),
  karita_no_bourei: wet({
    groundMaterials: ['cut-paddy stubble', 'moonlit irrigation mud'],
    danger: danger('watchful', 'straw-bow-wave', 'stubble bows toward an unseen walker'),
    silhouette: { profileId: 'paddy-grid-scarecrow', boundary: 'low field grids expose a single tall scarecrow', rhythm: 'flat rows crossed by narrow raised ridges' },
    landmark: { id: 'empty-harvest-rack', form: 'a harvest rack holding only moving shadows' },
    ambientMotion: motion('pale-grain-pollen', 'pollen', 20),
    soundCue: sound('dry-stalk-with-water', 'stalk-and-irrigation'),
    navigationCue: nav('uncut-rice-corner', 'one gold stalk remains at each safe turning', 'turn toward the next uncut stalk'),
    render: { groundKind: 'soil', particleKind: 'pollen' },
  }),
  yaregasa_douhyou: wet({
    groundMaterials: ['splintered wayboard', 'umbrella-oil mud'],
    danger: danger('watchful', 'umbrella-rib-turn', 'ribs rotate to point behind the party'),
    silhouette: { profileId: 'crooked-umbrella-arrows', boundary: 'torn umbrellas make alternating triangular profiles', rhythm: 'high rib, low rib, false branch' },
    landmark: { id: 'many-pointing-parasol-post', form: 'one post pinned through three contradictory umbrellas' },
    ambientMotion: motion('paper-fog-fold', 'fog', 14),
    soundCue: sound('oiled-paper-creak', 'paper-and-drip'),
    navigationCue: nav('exposed-bamboo-rib', 'one umbrella exposes an unpainted rib', 'follow the bare rib rather than the canopy tip'),
    render: { groundKind: 'plank', particleKind: 'fog' },
  }),
  minomushi_no_kairou: wet({
    groundMaterials: ['suspended cedar planks', 'cocoon-fibre dust'],
    danger: danger('watchful', 'cocoon-sway-against', 'one hanging cocoon swings against the others'),
    silhouette: { profileId: 'hanging-cocoon-corridor', boundary: 'parallel beams carry dense pendant forms', rhythm: 'short, long, paired, empty hanger' },
    landmark: { id: 'giant-empty-cocoon', form: 'a person-sized split cocoon over the central span' },
    ambientMotion: motion('cocoon-dust-rise', 'pollen', 24),
    soundCue: sound('fibre-rope-groan', 'rope-and-cocoon'),
    navigationCue: nav('still-cocoon-line', 'a line of cocoons remains completely still', 'the still line hangs over sound floorboards'),
    render: { groundKind: 'plank', particleKind: 'pollen' },
  }),

  chochin_zaka: stone({
    groundMaterials: ['soot-polished stair stone', 'wax-run gutter'],
    danger: danger('hostile', 'hundred-eyes-ignite', 'three lantern pupils open in sequence'),
    silhouette: { profileId: 'lantern-stair-canyon', boundary: 'tall lantern ranks pinch a climbing stair', rhythm: 'paired lights at every third riser' },
    landmark: { id: 'hundredth-unlit-lantern', form: 'a giant unlit lantern above the upper bend' },
    ambientMotion: motion('lantern-ember-count', 'firefly', 30),
    soundCue: sound('wax-pop-uphill', 'lantern-and-stair'),
    navigationCue: nav('short-wick-side', 'short wicks mark one side of each landing', 'take the turn opposite the longest flame'),
    render: { groundKind: 'stone', particleKind: 'firefly' },
  }),
  haikyo_goten: stone({
    groundMaterials: ['lacquer-worn floorboards', 'fallen plaster grit'],
    danger: danger('hostile', 'screen-shadow-kneel', 'a kneeling shadow crosses intact screens'),
    silhouette: { profileId: 'palace-post-enfilade', boundary: 'tall posts frame successive empty rooms', rhythm: 'wide bay, narrow bay, collapsed bay' },
    landmark: { id: 'roofless-audience-dais', form: 'an elevated dais beneath an absent roof' },
    ambientMotion: motion('cold-dust-glint', 'stardust', 16),
    soundCue: sound('far-sliding-screen', 'palace-and-dust'),
    navigationCue: nav('moonlit-threshold', 'one threshold receives cold moonlight', 'cross only moonlit thresholds to progress'),
    render: { groundKind: 'plank', particleKind: 'stardust' },
  }),
  nurikabe_koji: stone({
    groundMaterials: ['compressed alley earth', 'flaking lime plaster'],
    danger: danger('hostile', 'wall-breath-bulge', 'plaster bulges before the passage closes'),
    silhouette: { profileId: 'blind-plaster-zigzag', boundary: 'high blank walls break sightlines into teeth', rhythm: 'short choke, square pocket, false choke' },
    landmark: { id: 'handprint-sealed-door', form: 'a door-shaped plaster patch covered in inward prints' },
    ambientMotion: motion('plaster-ash-settle', 'ash', 10),
    soundCue: sound('muffled-wall-rub', 'plaster-and-pressure'),
    navigationCue: nav('floor-scrape-arc', 'curved scrape marks stop before false walls', 'follow scrapes that continue under the wall edge'),
    render: { groundKind: 'soil', particleKind: 'ash' },
  }),
  kare_numa: stone({
    groundMaterials: ['cracked basin clay', 'mossed burial pebble'],
    danger: danger('hostile', 'subsoil-water-knock', 'concentric cracks pulse from below'),
    silhouette: { profileId: 'dry-basin-island-rings', boundary: 'low cracked basins surround raised stone islands', rhythm: 'broad hollow, narrow saddle, bone mound' },
    landmark: { id: 'boat-on-dry-bed', form: 'a reed boat stranded over a sound of water' },
    ambientMotion: motion('marsh-fog-well', 'fog', 12),
    soundCue: sound('buried-water-lap', 'dry-marsh-and-bone'),
    navigationCue: nav('dark-crack-current', 'the darkest crack branches like a current', 'walk beside, never across, the main crack'),
    render: { groundKind: 'moss', particleKind: 'fog' },
  }),
  oboro_bashi: stone({
    groundMaterials: ['mist-slick bridge plank', 'lichened pier stone'],
    danger: danger('hostile', 'railing-repeat-shift', 'a railing post repeats one span too soon'),
    silhouette: { profileId: 'bridge-piers-without-bank', boundary: 'tall piers vanish into horizontal mist', rhythm: 'three rails, missing rail, repeated pier' },
    landmark: { id: 'bankless-bridge-bell', form: 'a bridge bell hanging where the far bank should be' },
    ambientMotion: motion('cross-current-fog', 'fog', 18),
    soundCue: sound('returning-plank-step', 'bridge-and-river'),
    navigationCue: nav('rope-knot-sequence', 'railing knots increase from one to four', 'advance only toward increasing knot counts'),
    render: { groundKind: 'plank', particleKind: 'fog' },
  }),
  kuchinawa_no_hotoke: stone({
    groundMaterials: ['prayer-worn flagstone', 'rotted straw coil'],
    danger: danger('hostile', 'rope-constriction-wave', 'the great rope tightens from its far end'),
    silhouette: { profileId: 'shimenawa-buddha-throat', boundary: 'a huge hanging rope compresses statue rows', rhythm: 'small statue, tall rope loop, blind altar' },
    landmark: { id: 'great-rotten-shimenawa', form: 'a monumental snake-like sacred rope', signatureKind: 'great_shimenawa', signaturePriority: 3 },
    ambientMotion: motion('serpentine-dust-stream', 'fog', 20),
    soundCue: sound('straw-fibre-tighten', 'rope-and-prayer-stone'),
    navigationCue: nav('loose-rope-belly', 'one rope loop hangs loose enough to pass', 'follow slack loops; taut loops mark dead ends'),
    render: { groundKind: 'stone', particleKind: 'fog' },
  }),
  usugiri_no_watashiba: stone({
    groundMaterials: ['waterlogged pier plank', 'pale river silt'],
    danger: danger('hostile', 'empty-boat-nudge', 'an empty boat noses against the current'),
    silhouette: { profileId: 'ghost-pier-horizontal', boundary: 'thin piers project into bankless mist', rhythm: 'post pair, long void, mooring fork' },
    landmark: { id: 'shoreless-ghost-pier', form: 'a pier whose final posts float without a bank', signatureKind: 'ghost_pier', signaturePriority: 4 },
    ambientMotion: motion('lateral-ferry-fog', 'fog', 22),
    soundCue: sound('oar-without-rower', 'ferry-and-mist'),
    navigationCue: nav('mooring-rope-dip', 'mooring ropes dip toward safe footing', 'choose the pier whose rope touches visible water'),
    render: { groundKind: 'water_film', particleKind: 'fog' },
  }),
  suzuriishi_no_saka: stone({
    groundMaterials: ['ink-glazed stair slab', 'paper-fibre grit'],
    danger: danger('hostile', 'ink-pool-letterless', 'an ink pool spreads uphill in a sharp fan'),
    silhouette: { profileId: 'inkstone-switchback', boundary: 'oval inkstones terrace a steep switchback', rhythm: 'flat oval, tall retaining wall, black basin' },
    landmark: { id: 'moon-holding-inkstone', form: 'a giant inkstone reflecting an impossible moon' },
    ambientMotion: motion('ink-star-glints', 'stardust', 12),
    soundCue: sound('brushless-ink-grind', 'inkstone-and-slope'),
    navigationCue: nav('dry-brush-groove', 'pale grooves cross otherwise black slabs', 'follow the groove that never fills with ink'),
    render: { groundKind: 'stone', particleKind: 'stardust' },
  }),
  rousoku_kashi: stone({
    groundMaterials: ['wax-layered quay stone', 'dry channel sediment'],
    danger: danger('hostile', 'flame-lean-inward', 'all flames lean toward one dark berth'),
    silhouette: { profileId: 'candle-quay-ranks', boundary: 'low quay walls carry dense vertical candles', rhythm: 'seven flames, dark berth, seven flames' },
    landmark: { id: 'wax-buried-mooring', form: 'a mooring post almost entombed in candle wax' },
    ambientMotion: motion('candle-firefly-drift', 'firefly', 28),
    soundCue: sound('many-small-wicks', 'wax-and-dry-river'),
    navigationCue: nav('shortest-candle-line', 'the shortest candle at each group stands by the route', 'move from shortest wick to shortest wick'),
    render: { groundKind: 'water_film', particleKind: 'firefly' },
  }),
  kagami_ga_fuchi: stone({
    groundMaterials: ['mirror-still water film', 'silver-veined rim stone'],
    danger: danger('hostile', 'reflection-lag', 'the reflected party stops one beat late'),
    silhouette: { profileId: 'paired-pillar-mirror', boundary: 'identical pillars double across a black plane', rhythm: 'paired forms split by one asymmetric shard' },
    landmark: { id: 'backward-reflection-arch', form: 'a broken arch complete only in reflection' },
    ambientMotion: motion('mirror-star-delay', 'stardust', 14),
    soundCue: sound('single-drop-double-echo', 'mirror-water-and-crystal'),
    navigationCue: nav('unreflected-cairn', 'one small cairn has no reflection', 'keep the unreflected cairn on the forward side'),
    render: { groundKind: 'water_film', particleKind: 'stardust' },
  }),

  hoshimukuro_tani: timber({
    groundMaterials: ['star-bone scree', 'collapsed trestle timber'],
    danger: danger('severe', 'dead-star-blink', 'buried star fragments extinguish in a moving line'),
    silhouette: { profileId: 'trestle-over-star-grave', boundary: 'broken timber spans cross a low field of ribs', rhythm: 'angled beam, bright pit, rib cluster' },
    landmark: { id: 'fallen-star-ribcage', form: 'a vast rib form cupping a dim star remnant' },
    ambientMotion: motion('cold-star-pulse', 'stardust', 20),
    soundCue: sound('timber-over-star-hum', 'trestle-and-star-bone'),
    navigationCue: nav('warm-nail-chain', 'forged nails retain a faint amber point', 'follow connected warm nails across sound beams'),
    render: { groundKind: 'bone', particleKind: 'stardust' },
  }),
  hisui_no_sawa: timber({
    groundMaterials: ['jade water film', 'split cedar sluice'],
    danger: danger('severe', 'underwater-shadow-cross', 'a broad shadow crosses beneath both banks'),
    silhouette: { profileId: 'jade-pillars-sluice', boundary: 'fractured green pillars rise through timber channels', rhythm: 'low sluice, tall shard, forked stream' },
    landmark: { id: 'broken-jade-pillar', form: 'a luminous cracked pillar straddling the stream', signatureKind: 'jade_pillar', signaturePriority: 5 },
    ambientMotion: motion('submerged-jade-rain', 'rain', 16),
    soundCue: sound('deep-current-under-wood', 'jade-water-and-sluice'),
    navigationCue: nav('upright-sluice-handle', 'one intact handle leans downstream', 'take the branch aligned with the intact handle'),
    render: { groundKind: 'water_film', particleKind: 'rain' },
  }),
  kageboushi_no_oka: timber({
    groundMaterials: ['wind-planed hill soil', 'charred roof-shingle'],
    danger: danger('severe', 'ownerless-shadow-lengthen', 'one shadow lengthens across the route without a body'),
    silhouette: { profileId: 'open-hill-chimney-shadows', boundary: 'bare chimney posts stand above low ruined roofs', rhythm: 'wide void, thin post, long dark wedge' },
    landmark: { id: 'shadow-only-house', form: 'a house silhouette cast by no remaining structure' },
    ambientMotion: motion('low-shadow-fog', 'fog', 10),
    soundCue: sound('empty-chimney-wind', 'hill-and-ruined-town'),
    navigationCue: nav('shortest-shadow-gap', 'a gap between shadows stays the same length', 'move through stable gaps, avoiding stretching edges'),
    render: { groundKind: 'soil', particleKind: 'fog' },
  }),
  kaji_ato: timber({
    groundMaterials: ['hammered forge slab', 'charcoal timber ash'],
    danger: danger('severe', 'anvil-strike-spark', 'sparks jump from a cold anvil before the blow'),
    silhouette: { profileId: 'forge-chimney-sawline', boundary: 'collapsed workshops leave sawtooth chimneys and gantries', rhythm: 'chimney, roof gap, crane arm, furnace' },
    landmark: { id: 'self-striking-anvil', form: 'a cracked anvil beneath a suspended hammer' },
    ambientMotion: motion('iron-star-spark', 'stardust', 24),
    soundCue: sound('unseen-hammer-cadence', 'forge-and-iron'),
    navigationCue: nav('cool-slag-path', 'blue-grey slag lies between orange seams', 'follow the cool slag when the hammer falls silent'),
    render: { groundKind: 'stone', particleKind: 'stardust' },
  }),
  nakiotoko_no_hara: timber({
    groundMaterials: ['salt-streaked field soil', 'rain-cut foundation stone'],
    danger: danger('severe', 'cry-distance-collapse', 'rain lines reverse when the cry sounds near'),
    silhouette: { profileId: 'weeping-stone-foundations', boundary: 'low house foundations encircle upright wet stones', rhythm: 'empty slab, bowed stone, empty doorway' },
    landmark: { id: 'ring-of-weeping-stones', form: 'standing stones wet only on their inward faces', signatureKind: 'weeping_stones', signaturePriority: 6 },
    ambientMotion: motion('upward-cold-rain', 'rain', 18),
    soundCue: sound('moving-mans-cry', 'rain-and-empty-field'),
    navigationCue: nav('dry-stone-face', 'one stone face remains dry', 'exit through the gap faced by the dry stone'),
    render: { groundKind: 'soil', particleKind: 'rain' },
  }),
  kottou_zaka: timber({
    groundMaterials: ['stall-worn floor planks', 'brass-and-ceramic grit'],
    danger: danger('severe', 'price-tag-flutter', 'blank tags turn together toward the party'),
    silhouette: { profileId: 'stacked-antique-stalls', boundary: 'leaning stalls and tall cabinets narrow a switchback', rhythm: 'low table, tall chest, hanging frame' },
    landmark: { id: 'ownerless-tally-counter', form: 'a counter arranged for a sale that never ended' },
    ambientMotion: motion('cabinet-dust-fog', 'fog', 14),
    soundCue: sound('porcelain-in-closed-box', 'market-and-old-timber'),
    navigationCue: nav('unpriced-object-line', 'objects without blank tags mark one shelf edge', 'follow untagged objects to the next landing'),
    render: { groundKind: 'plank', particleKind: 'fog' },
  }),
  sabigatana_no_haka: timber({
    groundMaterials: ['rust-fed burial bone', 'iron-stained cedar chips'],
    danger: danger('severe', 'fresh-blood-on-rust', 'one old blade beads with fresh dark drops'),
    silhouette: { profileId: 'sword-grove-roof-ribs', boundary: 'upright blades pierce collapsed roof ribs', rhythm: 'short blade, beam, tall blade cluster' },
    landmark: { id: 'rusted-sword-grove', form: 'a grove of blades around an empty grave', signatureKind: 'sword_grove', signaturePriority: 7 },
    ambientMotion: motion('rust-ash-drift', 'ash', 20),
    soundCue: sound('blade-in-earth-hum', 'rust-and-burial-wood'),
    navigationCue: nav('blade-edge-away', 'safe blades show their blunt backs to the route', 'walk where every nearby edge faces away'),
    render: { groundKind: 'bone', particleKind: 'ash' },
  }),
  hyakki_yakou_no_tsuji: timber({
    groundMaterials: ['procession-worn paving', 'festival-stall splinters'],
    danger: danger('severe', 'invisible-procession-gap', 'dust divides around bodies that cannot be seen'),
    silhouette: { profileId: 'festival-crossroad-gates', boundary: 'ruined stalls frame an oversized torii crossing', rhythm: 'stall rank, broad lane, lantern rank' },
    landmark: { id: 'empty-procession-platform', form: 'a carried platform resting without bearers' },
    ambientMotion: motion('procession-lamp-drift', 'firefly', 26),
    soundCue: sound('many-feet-no-bodies', 'festival-and-crossroad'),
    navigationCue: nav('open-procession-interval', 'dust leaves a repeating person-wide interval', 'cross only during the fourth empty interval'),
    render: { groundKind: 'stone', particleKind: 'firefly' },
  }),
  yumemaboroshi_no_yakata: timber({
    groundMaterials: ['tatami-scored floorboard', 'paper-screen dust'],
    danger: danger('severe', 'room-scale-repeat', 'a smaller copy of the room opens inside itself'),
    silhouette: { profileId: 'nested-room-frames', boundary: 'door frames repeat inward at diminishing scale', rhythm: 'large bay, medium bay, tiny impossible bay' },
    landmark: { id: 'nested-fusuma-room', form: 'sliding screens containing smaller copies of themselves', signatureKind: 'nested_fusuma', signaturePriority: 8 },
    ambientMotion: motion('reverse-room-dust', 'pollen', 14),
    soundCue: sound('sliding-screen-inside-screen', 'dream-house-and-paper'),
    navigationCue: nav('largest-threshold-shadow', 'one threshold shadow does not shrink', 'choose the doorway with the unscaled shadow'),
    render: { groundKind: 'plank', particleKind: 'pollen' },
  }),
  hakkotsu_bayashi: timber({
    groundMaterials: ['bone-root lattice', 'rotted battlefield beam'],
    danger: danger('severe', 'rib-tree-contract', 'arched ribs close one joint at a time'),
    silhouette: { profileId: 'rib-forest-tenements', boundary: 'rib arches grow through stacked timber shells', rhythm: 'paired ribs, window void, bone trunk' },
    landmark: { id: 'house-inside-ribcage', form: 'a collapsed dwelling enclosed by a giant ribcage' },
    ambientMotion: motion('marrow-fog-crawl', 'fog', 22),
    soundCue: sound('bone-tree-knock', 'bone-and-battlefield-timber'),
    navigationCue: nav('open-rib-joint', 'one arch has an unsealed lower joint', 'pass through open joints before the next contraction'),
    render: { groundKind: 'bone', particleKind: 'fog' },
  }),
  tokoyami_no_kairou: timber({
    groundMaterials: ['lightless corridor moss', 'blackened threshold timber'],
    danger: danger('severe', 'wisp-backflow', 'the last reliable lights drift toward the entrance'),
    silhouette: { profileId: 'endless-post-corridor', boundary: 'straight posts vanish into a narrow black slot', rhythm: 'paired post, grave notch, unlit span' },
    landmark: { id: 'last-burned-town-gate', form: 'a charred gate beyond which no fixed light remains' },
    ambientMotion: motion('backward-wisp-breath', 'firefly', 8),
    soundCue: sound('timber-silence-pressure', 'dark-corridor-and-wisp'),
    navigationCue: nav('touch-worn-post-side', 'one side of each post is polished by hands', 'keep the polished side within reach'),
    render: { groundKind: 'moss', particleKind: 'firefly' },
  }),

  hoshikui_no: bone({
    groundMaterials: ['star-pocked mountain stone', 'powdered celestial bone'],
    danger: danger('terminal', 'ground-star-extinguish', 'points in the ground go dark beneath an approaching shape'),
    silhouette: { profileId: 'crater-spire-rings', boundary: 'black craters alternate with needle spires', rhythm: 'ring hollow, bone ridge, starless notch' },
    landmark: { id: 'star-eaten-crater-crown', form: 'a circular crater ringed by hollow star shards' },
    ambientMotion: motion('buried-star-flicker', 'stardust', 30),
    soundCue: sound('thin-star-crack', 'star-stone-and-high-wind'),
    navigationCue: nav('steady-star-chain', 'a few embedded stars do not flicker', 'follow the steady chain around the crater rim'),
    render: { groundKind: 'stone', particleKind: 'stardust' },
  }),
  maboroshi_no_sandou: bone({
    groundMaterials: ['pilgrim-polished stone', 'upward-falling paper fibre'],
    danger: danger('terminal', 'torii-return-behind', 'the gate just crossed reappears ahead'),
    silhouette: { profileId: 'endless-torii-compression', boundary: 'torii frames compress toward no vanishing point', rhythm: 'large gate, narrow gate, doubled gate' },
    landmark: { id: 'endless-torii-procession', form: 'a procession of gates folding back through itself', signatureKind: 'endless_torii', signaturePriority: 9 },
    ambientMotion: motion('paper-stream-upward', 'pollen', 18),
    soundCue: sound('gate-beam-return', 'pilgrimage-and-paper'),
    navigationCue: nav('fresh-rope-fibre', 'one gate rope sheds fibres upward', 'pass the shedding gate from its frayed side'),
    render: { groundKind: 'stone', particleKind: 'pollen' },
  }),
  mouja_machi: bone({
    groundMaterials: ['grave-set town planks', 'cold hearth ash'],
    danger: danger('terminal', 'empty-window-lamp', 'house lights turn on in the order of the party formation'),
    silhouette: { profileId: 'dead-town-grave-roofs', boundary: 'steep vacant roofs overlap rows of grave posts', rhythm: 'lit window, grave alley, roof bridge' },
    landmark: { id: 'lit-house-without-door', form: 'a complete lit house with no entrance' },
    ambientMotion: motion('window-mist-exhale', 'fog', 16),
    soundCue: sound('occupied-empty-house', 'dead-town-and-hearth'),
    navigationCue: nav('unlit-eave-cord', 'one eave cord stays dark among lit houses', 'follow the dark cord across connected roofs'),
    render: { groundKind: 'plank', particleKind: 'fog' },
  }),
  nakiryuu_no_mine: bone({
    groundMaterials: ['dragon-rib shale', 'star-snow ledge stone'],
    danger: danger('terminal', 'crosswind-roar-cut', 'the roar stops inside a long moving shadow'),
    silhouette: { profileId: 'dragon-spine-switchback', boundary: 'giant vertebrae form a serrated ascending ridge', rhythm: 'rib gate, exposed ledge, spine tower' },
    landmark: { id: 'dragon-bone-ridgeline', form: 'a mountain path climbing through a dragon spine', signatureKind: 'dragon_spine', signaturePriority: 10 },
    ambientMotion: motion('horizontal-star-snow', 'rain', 32),
    soundCue: sound('dragon-wind-cry', 'bone-ridge-and-gale'),
    navigationCue: nav('lee-side-tear-groove', 'tear-like grooves remain free of star snow', 'stay on the lee side where grooves remain visible'),
    render: { groundKind: 'stone', particleKind: 'rain' },
  }),
  gentou_zentei: bone({
    groundMaterials: ['pressure-cracked courtyard ash', 'violet altar gravel'],
    danger: danger('terminal', 'central-void-weight', 'loose fragments slide toward an untouched central void'),
    silhouette: { profileId: 'symmetrical-void-court', boundary: 'paired pillars and gates frame a deliberately empty center', rhythm: 'mirror pair, void, mirror pair' },
    landmark: { id: 'weight-of-night-court', form: 'a court whose center remains bare beneath falling ash' },
    ambientMotion: motion('heavy-violet-fog', 'fog', 12),
    soundCue: sound('low-courtyard-pressure', 'altar-and-heavy-night'),
    navigationCue: nav('asymmetric-gravel-scar', 'one gravel rake line breaks the symmetry', 'follow the only broken line around the central void'),
    render: { groundKind: 'ash', particleKind: 'fog' },
  }),
  todome_no_kaidan: bone({
    groundMaterials: ['miscounted stair stone', 'motionless funeral ash'],
    danger: danger('terminal', 'warm-step-pulse', 'one step warms and darkens before contact'),
    silhouette: { profileId: 'unequal-count-stair', boundary: 'stair flights disagree in length across paired walls', rhythm: 'eight risers, landing, seven shadows' },
    landmark: { id: 'miscounted-final-stair', form: 'a monumental stair with incompatible side profiles', signatureKind: 'counted_steps', signaturePriority: 11 },
    ambientMotion: motion('stopped-ash-points', 'ash', 10),
    soundCue: sound('missing-stair-footfall', 'stone-step-and-silence'),
    navigationCue: nav('cold-step-edge', 'safe edges remain cold grey', 'step only where edge and shadow counts agree'),
    render: { groundKind: 'stone', particleKind: 'ash' },
  }),
  gentou_no_zenya: bone({
    groundMaterials: ['banquet-floor ash', 'gold-lacquer shard'],
    danger: danger('terminal', 'empty-cup-drain', 'filled cups empty in a line toward the party'),
    silhouette: { profileId: 'empty-banquet-canopy', boundary: 'low feast tables surround one towering vacant canopy', rhythm: 'seat pair, bright table, empty high seat' },
    landmark: { id: 'empty-final-banquet', form: 'a fully served feast without guests', signatureKind: 'empty_banquet', signaturePriority: 12 },
    ambientMotion: motion('upward-gold-droplets', 'stardust', 24),
    soundCue: sound('cup-set-by-no-hand', 'banquet-and-upward-liquid'),
    navigationCue: nav('untouched-setting-gap', 'one place setting remains untouched', 'leave the ring through the gap behind the untouched setting'),
    render: { groundKind: 'ash', particleKind: 'stardust' },
  }),
  akashi_miyama: bone({
    groundMaterials: ['sealed star-bone', 'blood-red shrine stone'],
    danger: danger('terminal', 'mountain-heart-eclipse', 'all secondary lights narrow around a red-black core'),
    silhouette: { profileId: 'concentric-god-road', boundary: 'gates, pillars, and crystal ribs close into concentric crowns', rhythm: 'outer gate, bone ring, sealed summit' },
    landmark: { id: 'gentou-sealed-summit', form: 'the central divine road bound by star crystal and graves' },
    ambientMotion: motion('sealed-lamp-orbit', 'firefly', 18),
    soundCue: sound('mountain-heart-and-chain', 'sealed-summit-and-lamp'),
    navigationCue: nav('broken-orbit-gap', 'one orbiting light repeatedly leaves the circle', 'enter only through the recurring break in the orbit'),
    render: { groundKind: 'bone', particleKind: 'firefly' },
  }),
  tokoyo_tou: bone({
    groundMaterials: ['century-worn tower plank', 'layered bone-and-star dust'],
    danger: danger('terminal', 'ten-floor-material-shift', 'the dominant debris changes one floor before the threat'),
    silhouette: { profileId: 'rotating-era-tower', boundary: 'pillars, spires, torii, crystal, and bone trade dominance', rhythm: 'ten-layer cycle with one displaced era' },
    landmark: { id: 'hundred-layer-memory-shaft', form: 'a central shaft exposing fragments of every prior biome' },
    ambientMotion: motion('era-star-rotation', 'stardust', 20),
    soundCue: sound('layer-count-resonance', 'tower-and-remembered-regions'),
    navigationCue: nav('previous-era-material', 'one material from the prior ten floors marks the exit', 'follow the previous era, not the current dominant surface'),
    render: { groundKind: 'plank', particleKind: 'stardust' },
  }),
}

export function regionExperienceOf(regionId: string): RegionExperienceProfile | null {
  return REGION_EXPERIENCES[regionId] ?? null
}
