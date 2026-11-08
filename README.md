<!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:bd7f7286b12873acfa67e368899a3ec15f8bbb3273272c180bc9708dfc89457f -->

# Soul Land — The Fallen Realm

A persistent single-player dark fantasy action RPG built with React, Vite, and the MIT-licensed [Three.js engine](https://github.com/mrdoob/three.js).

## Play online

[Play Soul Land](https://codingscenes2-cyber.github.io/Scenes-ps4PKG/docs/)

The game is hosted by GitHub Pages and does not depend on this coding sandbox. The repository root redirects to the built game under `docs/`. Once the game finishes downloading, a service worker caches its core files for offline reopening. Progress stays in this browser. Settings → Export journey / Import journey transfers a save between devices or website origins. Import replaces the current browser journey; export first to retain it.

On supported mobile browsers, use the browser’s Add to Home Screen option for a standalone game window. The web manifest and original icon are included. No account or provider API is required.

## Run and publish

Requires Node.js 20.19+ or 22.12+; verified with Node 24.21.0 / npm 11.19.0.

```sh
npm ci
npm run dev -- --port 3000
npm test
npm run build:pages
```

`npm run build` produces `dist/`; `npm run build:pages` produces a portable build under `docs/` using relative URLs. Commit source and the regenerated docs together. GitHub Pages currently serves branch `coderabbit/build-soul-land-rpg/47064c05` from `/`. The source entry redirects GitHub Pages visitors to `/Scenes-ps4PKG/docs/`; the Vite build removes that redirect from the finished game. Vite’s development watcher excludes generated builds.

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

LocalStorage autosaves every two seconds and on page exit. Clearing site data removes the journey unless exported. Earlier version-one saves migrate to the new campaign fields without losing progression. A new character replaces the old save only after entering the realm. Cloud saves and multiplayer are not included.

WebGL2 is preferred. A CPU Canvas renderer projects the same Three.js scene if WebGL is unavailable. Cloud Chromium exercises this fallback; hardware rendering and physical phone performance need device testing. Mobile pixel ratio is capped and the fallback draws at most 30 frames per second.

## Scope

This is a compact playable RPG with an exploration-to-ending loop. Regions use procedural encounter spaces and original low-poly assets rather than a hand-built AAA open world. NPC conversation is authored, not unrestricted generative dialogue. Time-based world events are authored; independent armies and economies are not simulated. There are sixteen weapon archetypes, three armour sets, ten spells, thirteen guardians and seven conditional conclusions. Free climbing, extensive platforming/fall physics, voiced scenes and multiplayer are not implemented.

## Assets and licenses

- Procedural world geometry, articulated characters, map, particles, icon, animation and synthesized music: authored for Soul Land.
- Overlook artwork: *The Abbey in the Oakwood* (1809–1810), Caspar David Friedrich. Public domain. [Wikimedia Commons source and license](https://commons.wikimedia.org/wiki/File:Caspar_David_Friedrich_-_The_Abbey_in_the_Oakwood_-_WGA08240.jpg). Local copy: `public/ashen-veil.jpg`.
- Three.js, React and Vite: MIT. Lucide icons: ISC. Package licenses are included with installed dependencies.
- Cinzel and Inter use Google Fonts with local serif/sans-serif fallbacks when offline.


<!-- /coderabbit-ai-generated:v1 -->