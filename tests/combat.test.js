import test from "node:test";
import assert from "node:assert/strict";
import { bossMove, attackConnects } from "../src/combat.js";
const origin = { x: 0, z: 0 };
test("boss sweep is committed to its facing with a safe space behind the attack", () => {
  const move = bossMove(0, 1, 0);
  assert.equal(move.shape, "cone");
  assert.equal(attackConnects({ x: 0, z: 3 }, origin, 0, move), true);
  assert.equal(attackConnects({ x: 0, z: -3 }, origin, 0, move), false);
  assert.equal(attackConnects({ x: 0, z: 8 }, origin, 0, move), false);
  assert.equal(attackConnects({ x: 3, z: 0 }, origin, Math.PI / 2, move), true);
});
test("late boss patterns offer a safe inner ring and a committed target circle", () => {
  const ring = bossMove(0, 3, 2);
  assert.equal(ring.shape, "ring");
  assert.equal(attackConnects({ x: 0, z: 1 }, origin, 0, ring), false);
  assert.equal(attackConnects({ x: 0, z: 5 }, origin, 0, ring), true);
  assert.equal(attackConnects({ x: 0, z: 8 }, origin, 0, ring), false);
  const mark = bossMove(0, 2, 1),
    target = { x: 10, z: -10 };
  assert.equal(mark.shape, "mark");
  assert.equal(attackConnects(target, target, 0, mark), true);
  assert.equal(attackConnects(origin, target, 0, mark), false);
});
test("all guardians have deterministic named patterns, readable windups and recovery", () => {
  for (let region = 0; region < 13; region++)
    for (let phase = 1; phase <= 3; phase++)
      for (let turn = 0; turn < 8; turn++) {
        const m = bossMove(region, phase, turn);
        assert.deepEqual(m, bossMove(region, phase, turn));
        assert.ok(m.windup >= 0.8);
        assert.ok(m.recovery >= 1);
        assert.ok(m.radius > 0);
        assert.ok(m.name.length > 5);
      }
});
