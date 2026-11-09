<!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:36941012e1f78a1c4c90fe183d9b18121164c0d5569117a0829ef8d9d5bbf10f -->

<!-- coderabbit-ai-generated-section:v1:bd7f7286b12873acfa67e368899a3ec15f8bbb3273272c180bc9708dfc89457f -->

# Soul Land — The Fallen Realm

A persistent single-player dark fantasy action RPG built with React, Vite, and the MIT-licensed [Three.js engine](https://github.com/mrdoob/three.js).

## Play online

[Play Soul Land](https://codingscenes2-cyber.github.io/Scenes-ps4PKG/docs/)

The game is hosted by GitHub Pages and does not depend on this coding sandbox. The repository root redirects to the built game under `docs/`. Wait for Settings → Local save to report Offline ready; a service worker caches all game chunks, artwork, guide and screenshots for offline reopening. Progress stays in this browser. Settings → Export journey / Import journey transfers a save between devices or website origins. Import replaces the current browser journey; export first to retain it.

On supported mobile browsers, use the browser’s Add to Home Screen option for a standalone game window. The web manifest and original icon are included. No account or provider API is required.

## Run and publish

Requires Node.js 20.19+ or 22.12+; verified with Node 24.21.0 / npm 11.19.0.

```sh
npm ci
npm run dev -- --port 3000
npm test
npm run build:pages
npm run check:build
```

`npm run build` produces `dist/`; `npm run build:pages` produces a portable build under `docs/` using relative URLs. Commit source and the regenerated docs together. GitHub Pages currently serves branch `coderabbit/build-soul-land-rpg/47064c05` from `/`. The source entry redirects GitHub Pages visitors to `/Scenes-ps4PKG/docs/`; the Vite build removes that redirect from the finished game. Vite’s development watcher excludes generated builds.

## Systems upgrade (November 2026)

[Field guide, screenshots, changelog and roadmap](https://codingscenes2-cyber.github.io/Scenes-ps4PKG/docs/guide.html) · [Pre-change audit and per-system plans](project-docs/AUDIT.md)

- Seven independent throne arcs, three irreversible fates each, earned powers, evolving final-age codas and a read-only story flag inspector in the journal.
- Nine-node skill tree with prerequisites and essence costs; equipment rarity identifies provenance. `npm run balance` emits a deterministic 128-row CSV covering class, difficulty and level bands.
- Buffered inputs, hit-stop, end-recovery dodge cancels, directional hits/dodges, stable lock camera, guard counters and readable signature mechanics for seven throne guardians.
- Thirteen JSON region profiles drive enemy rosters, hazards, loot, lighting, arena leashes and adaptive music. Original core tables and campaign content were extracted into JSON with unchanged public values.
- Rebinding, standard controller gameplay/menu navigation, high contrast, color-vision palettes, reduced decorative motion, brightness, rendering presets and separate master/music/effects sliders. High preset enables Three.js bloom on WebGL.
- Checksummed format-2 save transport, last-good recovery, legacy imports, crash recovery UI, bounded local logs and GitHub Actions test/build/reference checks.
- Bounded impact pool, early Canvas culling, fallback ground LOD, lazy engine scenes, loading feedback and scoped offline caches. Measured Canvas frame interval gains are modest; no device FPS guarantee is claimed.

Content is in `src/content/`: `core.json`, `campaign.json`, `regions.json`, `thrones.json`, `skills.json`, `combat.json`. Keep identifiers and region indices stable for save compatibility. The pure rule modules enforce prerequisites and idempotent rewards. No new runtime dependencies were added.

## The witness campaign

Begin with a cinematic prologue, choose one of eight starting classes, customize your wanderer and choose a fixed difficulty. Follow six chapters of testimony across the Ashen Veil, Hollowwood, Crownfall, Nacreth, the Sunless Sea, and the Fractured Throne. Exploration remains open. Chapters require conversations, recovered memorials and guardian victories; testimony rewards can be claimed once, in narrative order. Later chapter conclusions remain hidden until earned.

Thirteen regional memorials preserve unreliable accounts of the Fracture. NPCs offer authored dialogue topics, keyword responses and persistent choices. In Crownfall, opening the refuge gate earns an extra flask at sanctuaries; demanding a confession teaches a stronger guard. Earlier choices change the final testimony. The journal records recovered accounts, chapter conclusions, hidden-road clues, personal events and defeated creatures. Seven conditional endings remain available through progression and choices.

## Characters and combat

Original articulated models have separate shoulders, elbows, hips, knees, hands, equipment and segmented cloaks. Walking, sprinting, attacks, charging, jumping, casting, healing, blocking, parrying, rolling, hurt and death drive the rig. Regional guardians have bell, antler, crown, wing, crystal, ember, drowned and fractured silhouettes. Character details include a draggable model viewer with animation previews. Equipping gear updates the world model.

Boss attacks share their damage geometry with the visible telegraphs: committed directional sweeps, heavy slams, targeted circles and rings with a safe inner area. Later phases add patterns and shorten windups. Poise must be broken before a boss staggers. Enemy casters commit to a target position; shields, retreat, recovery and repeated-attack counters require timing. The Archive leaves delayed, telegraphed echoes of enemy strikes. Floating damage, spell projectiles and an optional original adaptive synthesized score provide feedback.

- **Move:** WASD / arrows. **Sprint:** Shift. **Dodge:** Space. **Backstep:** V.
- **Light attack:** J. Hold/release J for a charged follow-up. **Heavy:** K. **Jump attack:** X.
- **Block:** hold B. **Parry:** F. **Lock target:** Tab. **Weapon skill:** C.
- **Spell:** R. **Healing flask:** Q. **Interact:** E. **Pause:** Escape.
- **Touch:** drag the left stick (outer edge sprints), use labeled actions, and hold Heavy for over one second for a charged follow-up. Expand the game for more space.

## The world

Thirteen connected regional encounter spaces contain regional landmarks, guardians, NPCs and hidden caches. Secrets use three pilgrim braziers, breakable seals, a charged ice wall, crystal pillars, dusk/night visibility, the ferryman’s permission, a silent answer, an empty altar and acts of mercy. NPCs and the journal provide clues. Rain, snow, ash, fog, moving banners, varied terrain shading and the day/night cycle set the atmosphere. Storm days increase fog. Cold slows stamina recovery, deep water drains stamina, marsh pools and lava damage vitality, crystals restore focus, rain weakens pyromancy and temple light strengthens Faith spells.

Rest at sanctuaries to restore resources, establish a checkpoint, level attributes, upgrade/infuse weapons and attune spells. Death drops unspent essence; dying again replaces the unrecovered drop. Permanent progression, defeated guardians, choices, memorials and opened seals persist.

## Saves and compatibility

LocalStorage autosaves every two seconds and on page exit. A portable format-2 wrapper holds the version-one character, timestamp and corruption checksum. Existing raw saves still load; a damaged primary falls back to the last validated copy, and Settings reports recovery. Export before clearing site data. A new character replaces the journey only after entering the realm. The structure is ready for a future authenticated sync adapter; cloud synchronization and multiplayer are not implemented.

WebGL2 is preferred. A CPU Canvas renderer projects the same Three.js scene if WebGL is unavailable. Cloud Chromium exercises this fallback; hardware rendering and physical phone performance need device testing. Mobile pixel ratio is capped and the fallback draws at most 30 frames per second.

## Scope

This is a compact playable RPG with an exploration-to-ending loop. Regions use procedural encounter spaces and original low-poly assets rather than a hand-built AAA open world. NPC conversation is authored, not unrestricted generative dialogue. Time-based world events are authored; independent armies and economies are not simulated. There are sixteen weapon archetypes, three armour sets, ten spells, thirteen guardians and seven conditional conclusions. Free climbing, extensive platforming/fall physics, voiced scenes and multiplayer are not implemented.

## Assets and licenses

- Procedural world geometry, articulated characters, map, particles, icon, animation and synthesized music: authored for Soul Land.
- Overlook artwork: *The Abbey in the Oakwood* (1809–1810), Caspar David Friedrich. Public domain. [Wikimedia Commons source and license](https://commons.wikimedia.org/wiki/File:Caspar_David_Friedrich_-_The_Abbey_in_the_Oakwood_-_WGA08240.jpg). Local copy: `public/ashen-veil.jpg`.
- Three.js (including post-processing), React, Vite and Prettier: MIT. Lucide icons: ISC. Package licenses are included with installed dependencies.
- Cinzel and Inter use Google Fonts with local serif/sans-serif fallbacks when offline.


<!-- /coderabbit-ai-generated:v1 -->