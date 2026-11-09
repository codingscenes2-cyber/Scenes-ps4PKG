import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ActionBuffer,
  TIMING,
  canDodgeCancel,
  meleeConnects,
} from "../src/combatTiming.js";
import {
  PROFILES,
  regionalResources,
  enemyBehavior,
  signatureEffect,
} from "../src/regions.js";
import { bossMove, attackConnects } from "../src/combat.js";
import { REGIONS, WEAPONS } from "../src/data.js";
test("input buffering retains one recent intent, waits for recovery, expires and clears on pause", () => {
  const b = new ActionBuffer();
  b.push("heavy", 1);
  assert.equal(b.take(1.05, false), null);
  assert.equal(b.take(1.1, true), "heavy");
  assert.equal(b.take(1.11, true), null);
  b.push("light", 2);
  b.push("dodge", 2.01);
  assert.equal(b.take(2.1, true), "dodge");
  b.push("heal", 3);
  assert.equal(b.take(3 + TIMING.bufferSeconds + 0.001, true), null);
  b.push("magic", 4);
  b.clear();
  assert.equal(b.take(4, true), null);
});
test("dodges cancel only after the active hit and near recovery end; melee respects facing and reach", () => {
  assert.equal(canDodgeCancel(0.1, 0.47, 1), false);
  assert.equal(canDodgeCancel(0.2, 0.47, 0), false);
  assert.equal(canDodgeCancel(0.1, 0.47, 0), true);
  assert.equal(meleeConnects({ x: 0, z: 0 }, { x: 0, z: 2 }, 0, 3), true);
  assert.equal(meleeConnects({ x: 0, z: 0 }, { x: 0, z: -2 }, 0, 3), false);
  assert.equal(meleeConnects({ x: 0, z: 0 }, { x: 0, z: 4 }, 0, 3), false);
  assert.ok(TIMING.heavyIFrames < TIMING.lightIFrames);
  assert.ok(TIMING.lightIFrames < TIMING.dodgeRecovery);
});
test("all13 region profiles have distinct biomes and names, valid equipment, lighting, hazards, music and arenas", () => {
  assert.equal(PROFILES.length, REGIONS.length);
  assert.equal(new Set(PROFILES.map((p) => p.biome)).size, 13);
  for (const [i, p] of PROFILES.entries()) {
    assert.equal(p.id, i);
    assert.equal(p.enemies.length, 3);
    for (const e of p.enemies)
      assert.ok(WEAPONS.some((w) => w.name === e.weapon));
    assert.ok(p.music.root > 30);
    assert.ok(p.lighting.exposure > 0);
    assert.ok(p.arena.radius > 10);
  }
  const s = { region: 3, hp: 100, stamina: 70, focus: 50 },
    max = { hp: 100, stamina: 70, focus: 50 };
  assert.equal(regionalResources(s, { x: 0 }, 2, max).hp, 100);
  assert.equal(regionalResources(s, { x: 20 }, 2, max).hp, 94);
  assert.equal(
    regionalResources({ ...s, region: 8 }, { x: -20 }, 2, max).stamina,
    46,
  );
  assert.equal(
    regionalResources({ ...s, region: 5, focus: 49 }, { x: 12 }, 2, max).focus,
    50,
  );
});
test("priority behavior tree never cancels committed telegraphs or recovery to chase or retreat", () => {
  const e = {
    hp: 10,
    max: 100,
    mode: "windup",
    timer: 0.5,
    personality: "hunter",
    boss: false,
    stagger: 0,
  };
  assert.equal(enemyBehavior(e, 2, 50), "windup");
  assert.equal(enemyBehavior({ ...e, mode: "recovery" }, 2, 50), "recovery");
  assert.equal(enemyBehavior({ ...e, mode: "idle" }, 2, 50), "return");
  assert.equal(enemyBehavior({ ...e, mode: "idle" }, 2, 0), "retreat");
  assert.equal(
    enemyBehavior(
      { ...e, hp: 100, mode: "idle", personality: "sentinel" },
      2,
      0,
    ),
    "guard",
  );
});
test("each throne guardian has a readable signature with a geometric escape and distinct consequence", () => {
  const ids = new Set();
  for (const p of PROFILES.filter((p) => p.signature)) {
    const move = bossMove(p.id, 2, 2);
    ids.add(move.signature);
    assert.ok(move.windup >= 1.4);
    assert.ok(move.recovery >= 1.5);
    assert.ok(move.hint.length > 20);
    assert.equal(
      attackConnects({ x: move.radius + 1, z: 0 }, { x: 0, z: 0 }, 0, move),
      false,
    );
    if (move.shape === "ring")
      assert.equal(
        attackConnects({ x: 0, z: 0 }, { x: 0, z: 0 }, 0, move),
        false,
      );
    assert.ok(Object.keys(signatureEffect(move.signature)).length);
  }
  assert.equal(ids.size, 7);
});
