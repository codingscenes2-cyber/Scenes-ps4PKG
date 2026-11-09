<!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:d8074540fee59e939499d7ee767626d90275ea8957a1df9fefc768df8ce298a9 -->

# Soul Land upgrade audit and implementation plan

Audit revision: `8b41dfd2e6e225c9d50ee3fd86aa85842d2e6003`. All tracked handwritten source, tests, configuration and public assets were inspected before changes. Generated bundles were inventoried as build artifacts. Quality labels describe the current scope, not production certification.

## Stack and existing features

JavaScript, React, Three.js and Vite; desktop/mobile browsers, WebGL with Canvas fallback. Eight starting classes, eight attributes, sixteen weapon archetypes, three armour sets, ten spells, four fixed difficulties, stamina combat, thirteen connected region scenes, map and fast travel, weather/day/night, regional secrets, six chapters, NPC decisions, seven ending gates, death drops, sanctuaries, forging, import/export and offline caching already exist. Regions are compact procedural arenas; this is not a commercial-scale seamless world.

## Complete tracked file inventory

| File | Quality | Responsibility / current limitation |
|---|---|---|
| `.gitignore` | OK | Dependency, entry point or publishing configuration. |
| `.nojekyll` | OK | Dependency, entry point or publishing configuration. |
| `README.md` | OK | Setup, controls, scope and hosting instructions. |
| `docs/.nojekyll` | OK | Generated production artifact; rebuild from source. |
| `docs/ashen-veil.jpg` | OK | Generated production artifact; rebuild from source. |
| `docs/assets/index-Biebr7h5.css` | OK | Generated production artifact; rebuild from source. |
| `docs/assets/index-ChNO3Qw5.js` | OK | Generated production artifact; rebuild from source. |
| `docs/index.html` | OK | Generated production artifact; rebuild from source. |
| `docs/manifest.webmanifest` | OK | Generated production artifact; rebuild from source. |
| `docs/soul-icon.svg` | OK | Generated production artifact; rebuild from source. |
| `docs/sw.js` | OK | Generated production artifact; rebuild from source. |
| `index.html` | OK | Dependency, entry point or publishing configuration. |
| `package-lock.json` | OK | Dependency, entry point or publishing configuration. |
| `package.json` | OK | Dependency, entry point or publishing configuration. |
| `public/.nojekyll` | OK | Public artwork / app identity. |
| `public/ashen-veil.jpg` | OK | Public artwork / app identity. |
| `public/manifest.webmanifest` | OK | Public artwork / app identity. |
| `public/soul-icon.svg` | OK | Public artwork / app identity. |
| `src/CharacterViewer.jsx` | OK | Rotatable animated class model viewer. |
| `src/SoftwareRenderer.js` | OK | Canvas fallback; expensive whole-scene traversal and triangle sorting. |
| `src/World.jsx` | rough | Procedural scenes, combat, AI, movement and interactions; coupled simulation/rendering. |
| `src/audio.js` | rough | Procedural adaptive soundtrack and cues; no separate mixer. |
| `src/campaign.js` | OK | Six authored chapters, NPC dialogue, memories, idempotent rewards. |
| `src/characters.js` | OK | Original articulated characters, equipment and regional boss ornaments. |
| `src/combat.js` | OK | Shared boss telegraph geometry and phase move selection. |
| `src/data.js` | OK | Eight classes, thirteen regions, weapons, armour, spells, four fixed difficulties. |
| `src/exploration.js` | OK | Thirteen secret conditions and deterministic weather. |
| `src/main.jsx` | rough | All screens, creation, inventory, journal, endings, touch controls; monolithic UI. |
| `src/state.js` | OK | Attributes, death rules, equipment math, save validation; no backup. |
| `src/style.css` | OK | Responsive dark fantasy UI, touch controls and modal layouts. |
| `tests/campaign.test.js` | solid | Focused automated contract checks. |
| `tests/characters.test.js` | solid | Focused automated contract checks. |
| `tests/combat.test.js` | solid | Focused automated contract checks. |
| `tests/exploration.test.js` | solid | Focused automated contract checks. |
| `tests/state.test.js` | solid | Focused automated contract checks. |
| `vite.config.js` | OK | Relative Pages builds and generated offline worker. |

## Prioritized phases and per-system changes

No engine replacement or broad scene rewrite is justified. Extract pure, testable rules and retain the current rigs, renderer fallback and campaign contracts. Each phase is a separate commit.

| System | Problems | Concrete upgrade | Test checklist |
|---|---|---|---|
| F Persistence (first) | One local copy; corrupt data loses access; unversioned transport | Checksummed format-2 transport, validated legacy migration, last-good backup, export envelope; keep character schema and death invariants | Raw v1 migration; envelope round trip; tamper detection; corrupt-primary recovery; storage failure; unknown formats |
| K Quality | No CI or crash recovery | Node test/build workflow; bounded local error log and React recovery screen | Existing tests; malformed saves; recovery screen; build from lockfile |
| A Combat | Dropped recovery inputs; no hit-stop; dodge ignores keyboard direction; repeated attacks shorten enemy windup | JSON timing config, expiring single input buffer, explicit dodge cancel boundary, directional hit check, stable lock target and framed camera, hit-stop and bounded shake | Buffer expiry; no early hit; i-frame boundary; no windup shortening; stamina; actual browser duel |
| B Thrones | Seven endings but no seven independent arcs | JSON arcs and choices; pure state machine, derived flags, persistent decisions, journal throne cards and read-only debug inspector | All seven arcs; prerequisites; idempotent resolution; invalid choices; legacy save; ending consequences |
| D Progression | No skill tree or measured balance | JSON skill graph and rarity; essence costs and prerequisites; bounded passive bonuses; deterministic balance simulation CSV | Prerequisites, insufficient funds, idempotence, damage/HP/stamina budgets; simulation regression |
| C Regions | Same enemy roster; mechanics scattered by index | JSON biome/roster/loot/music/light/hazard profiles, use in scene/AI/audio/map; retain reciprocal map and discovered travel | All 13 definitions valid; graph; hazard rates; visible variation and discovery persistence |
| E Enemies/bosses | Shared patterns, no explicit decision tree or arena leash | Priority behavior tree helper; regional attack decks with seven signature telegraphs, boss arena boundary and phases | All attack geometry; readable windup/recovery; priorities; safe zones; phase deck coverage |
| G Interface | No rebinding/controller/visual preferences | Persistent settings, rebinding, standard gamepad, motion/shake/subtitle/contrast/color filters; skill/flag panels | Rebind movement/action; controller edge behavior; modal focus; mobile layout; settings reload |
| H Visuals | Flat fallback and fixed post look | Retain original rigs; configurable exposure/lighting/fog; pooled impact effects, subtle bloom-like glow overlays, reduced motion | No telegraph mismatch; screenshot desktop/mobile; fallback; settings |
| I Audio | Single volume; centered cues | Separate master/music/effects buses, region mood, spatial event cues and sliders | Mixer initialization and values; combat/region transitions; mute; no audio before user gesture |
| J Performance | No baseline; transient geometry allocation; late culling | Measure baseline frame intervals; pooled ring effects and early frustum culling; loading feedback and lazy scene module | Compare identical viewport/renderer; bounded pool; travel cleanup; offline lazy chunks |
| L Docs/offline | No changelog, guide or CI; cache not scoped | Published field guide with controls, screenshots, features, changelog, roadmap/licenses; scoped worker and complete precache | Build paths; all precache URLs; offline reload and new game; deployed byte match |

## Compatibility and limits

Preserve fixed campaign difficulty, earned equipment, irreversible NPC choices, boss permanence, one recoverable essence drop and all thirteen stable region IDs. Format-2 transport intentionally changes the serialized save wrapper, while accepting existing raw version-1 characters and retaining the storage key. New throne decisions supplement existing chapters; legacy ending gates remain available. Settings stay separate from campaign data. No third-party account or cloud provider is added: transport is ready for an authenticated sync adapter, not an implemented cloud-save service.

## Licenses

React (MIT), Three.js (MIT), Vite (MIT), Lucide (ISC), Prettier (MIT). No additional engine or proprietary middleware is needed. Character meshes, scene geometry and synthesized sound are repository-authored procedural assets. Existing `ashen-veil.jpg` is The Abbey in the Oakwood by Caspar David Friedrich, public domain, credited in the existing README and UI. Do not imply that named asset sites were used.


<!-- /coderabbit-ai-generated:v1 -->