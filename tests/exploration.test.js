import test from "node:test";
import assert from "node:assert/strict";
import {
  createCharacter,
  deathState,
  loadSave,
  saveGame,
} from "../src/state.js";
import { lightBrazier } from "../src/campaign.js";
import {
  secretOpen,
  unseal,
  lightPillar,
  weatherAt,
} from "../src/exploration.js";
const fresh = (region) => ({
  ...createCharacter({ className: "Knight", difficulty: "Normal" }),
  region,
});
test("the opening cache requires all three persistent pilgrim lights", () => {
  let s = fresh(0);
  assert.equal(secretOpen(s), false);
  for (let i = 0; i < 3; i++) {
    s = lightBrazier(s, i);
    assert.equal(secretOpen(s), i === 2);
  }
  assert.equal(secretOpen(deathState(s, { x: 0, z: 0 })), true);
});
test("seals respond to the required action and stay open after time, death and reload", () => {
  for (const [region, action] of [
    [1, "heavy"],
    [2, "heavy"],
    [4, "charged"],
    [6, "touch"],
    [9, "kneel"],
    [10, "silence"],
    [11, "touch"],
  ]) {
    const s = fresh(region);
    assert.equal(unseal(s, "light"), s);
    assert.equal(secretOpen(s), false);
    const next = unseal(s, action);
    assert.equal(secretOpen(next), true);
    assert.equal(unseal(next, action), next);
    let encoded;
    const storage = {
      setItem: (_, v) => (encoded = v),
      getItem: () => encoded,
    };
    saveGame(next, storage);
    assert.equal(secretOpen(loadSave(storage)), true);
    assert.ok(deathState(next, { x: 0, z: 0 }).campaign.seals.includes(region));
  }
});
test("time, testimony and mercy have separate discoverable gates", () => {
  assert.equal(secretOpen({ ...fresh(3), time: 12 }), false);
  assert.equal(secretOpen({ ...fresh(3), time: 22 }), true);
  assert.equal(secretOpen({ ...fresh(7), time: 16.9 }), false);
  assert.equal(secretOpen({ ...fresh(7), time: 18 }), true);
  assert.equal(secretOpen({ ...fresh(7), time: 20 }), false);
  assert.equal(secretOpen(fresh(8)), false);
  assert.equal(secretOpen({ ...fresh(8), choices: { 3: "mercy" } }), true);
  assert.equal(secretOpen({ ...fresh(12), mercy: 6 }), false);
  assert.equal(secretOpen({ ...fresh(12), mercy: 7 }), true);
  let s = fresh(5);
  for (let i = 0; i < 3; i++) s = lightPillar(s, i);
  assert.equal(secretOpen(s), true);
  assert.equal(lightPillar(s, 0), s);
  assert.equal(lightPillar(fresh(0), 0).campaign.pillars.length, 0);
});
test("weather varies by region and storm day without changing chosen difficulty", () => {
  const s = fresh(1);
  assert.equal(weatherAt(s).rain, true);
  assert.equal(weatherAt(fresh(4)).snow, true);
  assert.ok(
    weatherAt({ ...s, worldDay: 3 }).fog > weatherAt({ ...s, worldDay: 2 }).fog,
  );
  assert.equal(s.difficulty, "Normal");
});
