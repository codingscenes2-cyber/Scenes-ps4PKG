import test from "node:test";
import assert from "node:assert/strict";
import {
  createActor,
  animateActor,
  playClip,
  disposeActor,
} from "../src/characters.js";
import { CLASSES } from "../src/data.js";
test("all classes have separate knee, elbow, cloak and weapon joints", () => {
  for (const c of CLASSES) {
    const a = createActor({ className: c.name, weapon: c.weapon });
    const r = a.userData;
    assert.equal(r.knees.length, 2);
    assert.equal(r.elbows.length, 2);
    assert.equal(r.cape.children.length, 5);
    animateActor(a, 0.05, 0.3, { moving: 1 });
    assert.notEqual(r.legs[0].rotation.x, 0);
    assert.notEqual(r.knees[1].rotation.x, 0);
    disposeActor(a);
  }
});
test("all action clips produce finite articulated transforms and settle after recovery", () => {
  const a = createActor();
  for (const clip of [
    "light",
    "heavy",
    "charged",
    "jump",
    "skill",
    "riposte",
    "backstab",
    "sprint",
    "cast",
    "heal",
    "roll",
    "parry",
    "hurt",
    "death",
  ]) {
    playClip(a, clip, 1);
    for (let i = 0; i < 30; i++) {
      animateActor(a, 0.05, i * 0.05);
      a.updateMatrixWorld();
      a.traverse((o) =>
        assert.ok(o.matrixWorld.elements.every(Number.isFinite)),
      );
    }
    assert.equal(a.userData.animation.clip, "idle");
  }
  assert.equal(a.userData.head.rotation.x, 0);
  disposeActor(a);
});
test("guardians have regional ornaments and differentiated silhouettes", () => {
  const signatures = new Set();
  for (let i = 0; i < 13; i++) {
    const a = createActor({ role: "boss", bossIndex: i });
    let count = 0;
    a.traverse((o) => {
      if (o.isMesh) count++;
    });
    signatures.add(`${count}:${a.scale.x}:${a.userData.ornaments.length}`);
    disposeActor(a);
  }
  assert.ok(signatures.size >= 8);
});
