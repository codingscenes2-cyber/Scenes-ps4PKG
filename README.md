<!-- coderabbit-ai-generated:v1 -->

# Soul Land — The Fallen Realm

A playable, single-player dark fantasy browser RPG built with React, Vite, and the MIT-licensed [Three.js engine](https://github.com/mrdoob/three.js).

## Run

Requires Node.js 20.19+ or 22.12+ (verified with Node 24.21.0 and npm 11.19.0).

```sh
npm ci
npm run dev -- --port 3000
```

Open the running Preview. `npm run build` produces `dist/`; deploy it to any static host. `npm test` runs the progression and persistence tests. No provider API, account, or database is required.

<!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:b473e08b2961b394795ff95ec29901a3163057962a1586bf15ba512a16a044e2 -->

## Publish to GitHub Pages

<!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:fe9ef79c956d0a4ba12d104e856e31b1d9776d35d39bd50cb1a41ff9b56ce17b -->

Run `npm run build:pages` to regenerate the `docs/` directory for the `/Scenes-ps4PKG/` URL. Commit the updated source and `docs/` together. To enable GitHub Pages, open repository Settings → Pages, choose **Deploy from a branch**, and select `coderabbit/build-soul-land-rpg/47064c05` and `/docs`.

<!-- /coderabbit-ai-generated:v1 -->

## Play

<!-- /coderabbit-ai-generated:v1 -->

Begin with the cinematic prologue and create a wanderer from eight classes. Choose a fixed campaign difficulty. Explore thirteen connected regions, collect soul remnants, speak with the regional inhabitants, and confront each region’s guardian. Map roads allow adjacent exploration; discovered regions allow sanctuary travel. Guardians grant shards and equipment. The final sanctuary responds once seven shards are collected and its guardian is defeated. Choices and exploration affect the available conclusions.

- **Move:** WASD / arrows. **Sprint:** Shift. **Dodge:** Space. **Backstep:** V.
- **Light attack:** J. Hold and release J for a charged follow-up. **Heavy:** K. **Jump attack:** X.
- **Block:** hold B. **Parry:** F. **Lock target:** Tab. **Weapon skill:** C.
- **Spell:** R. **Healing flask:** Q. **Interact:** E. **Pause:** Escape.
- On touch screens, drag the left stick and use the labeled action buttons. Expand the game for more space.

Red circles telegraph attacks. Enemies pursue, guard, retreat, or cast at a committed location. Bosses escalate through three phases. Stamina, focus, weapon reach, armour, stagger and recovery determine combat outcomes. Repeated attacks become less effective against bosses.

Rest at sanctuaries to restore resources and establish a checkpoint. Level attributes, upgrade and infuse weapons, attune spells, craft focus restoration, and equip armour. Death drops unspent essence in the current region; a second death replaces that drop. Permanent progression and defeated guardians persist.

## Saves and compatibility

Progress is saved in this browser’s localStorage every two seconds and on page exit. Clearing site data removes the campaign. An old save is replaced only after entering the realm with a newly created character. This is a local single-player game; cloud saves and multiplayer are not included.

WebGL2 is preferred. A CPU Canvas renderer projects the same Three.js scene when WebGL is unavailable. The fallback was exercised in cloud Chromium with WebGL disabled; GPU rendering and physical phone performance require device testing. Original procedural assets keep downloads small. Mobile pixel ratio is capped; the fallback draws at 30 frames per second at most.

## Scope

This is a compact playable interpretation of the requested large RPG, with a full exploration-to-ending progression loop. Regions use generated encounter spaces and distinct environmental props rather than a hand-built AAA open world. NPC speech supports authored keyword responses and persistent choices, not unrestricted AI-generated conversation. Narrative world events advance with time and sanctuary rest; they are authored events rather than independently simulated armies. There are sixteen weapon archetypes, three armour sets, ten spells unlocked through progression, thirteen guardians, and seven conditional conclusions. Free climbing, extensive platforming/fall physics, destructible dungeons, voiced scenes, multiplayer and a full economic simulation are not implemented.

## Assets and source

- Procedural geometry, characters, world map, particles and ambient audio: authored for Soul Land.
- Overlook artwork: *The Abbey in the Oakwood* (1809–1810), Caspar David Friedrich. Public domain. [Wikimedia Commons source and license](https://commons.wikimedia.org/wiki/File:Caspar_David_Friedrich_-_The_Abbey_in_the_Oakwood_-_WGA08240.jpg). Local copy: `public/ashen-veil.jpg`.
- Three.js: MIT. React: MIT. Lucide icons: ISC. Vite: MIT. Their licenses are distributed with their installed packages.
- Cinzel and Inter fonts are served by Google Fonts and fall back to local serif/sans-serif fonts when unavailable.
