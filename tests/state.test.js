import test from "node:test";
import assert from "node:assert/strict";
import {
  createCharacter,
  limits,
  damageFor,
  receiveDamage,
  deathState,
  spendLevel,
  levelCost,
  loadSave,
  saveGame,
  softCap,
} from "../src/state.js";
import { CLASSES, REGIONS, WEAPONS, DIFFICULTIES, ATTRS } from "../src/data.js";
const character = (extra = {}) =>
  createCharacter({
    name: "Aveline",
    className: "Knight",
    difficulty: "Normal",
    ...extra,
  });
for (const cl of CLASSES)
  test(`${cl.name} begins with valid attributes and usable equipment`, () => {
    const s = character({ className: cl.name });
    const w = WEAPONS.find((w) => w.name === s.weapon);
    assert.equal(s.hp, limits(s).hp);
    assert.equal(s.focus, limits(s).focus);
    assert.equal(ATTRS.length, Object.keys(s.attrs).length);
    assert.ok(s.inventory.includes(s.weapon));
    assert.ok(s.attrs[w.scaling] >= w.requirement);
  });
test("every region has reciprocal roads and the entire realm is reachable", () => {
  const seen = new Set([0]),
    q = [0];
  for (const i of q)
    for (const j of REGIONS[i].links) {
      assert.ok(REGIONS[j].links.includes(i), `${i} to ${j}`);
      if (!seen.has(j)) {
        seen.add(j);
        q.push(j);
      }
    }
  assert.equal(seen.size, 13);
  assert.equal(new Set(REGIONS.map((r) => r.boss)).size, 13);
});
test("difficulty fixes healing resources at creation and after death", () => {
  for (const d of Object.keys(DIFFICULTIES)) {
    const s = character({ difficulty: d });
    assert.equal(s.flasks, DIFFICULTIES[d].flasks);
    assert.equal(
      deathState({ ...s, flasks: 0 }, { x: 5, z: 7 }).flasks,
      DIFFICULTIES[d].flasks,
    );
  }
});
test("death drops only unspent essence and preserves permanent progress", () => {
  const s = {
    ...character(),
    essence: 400,
    region: 2,
    sanctuary: 1,
    bosses: [0],
    shards: 1,
    choices: { 0: "mercy" },
    level: 5,
    materials: 3,
  };
  const dead = deathState(s, { x: 2, z: -30 });
  assert.equal(dead.essence, 0);
  assert.deepEqual(dead.dropped, { amount: 400, region: 2, x: 2, z: -30 });
  assert.equal(dead.region, 1);
  for (const k of ["bosses", "shards", "choices", "level", "materials"])
    assert.deepEqual(dead[k], s[k]);
});
test("second death replaces a previous unrecovered drop", () => {
  const s = {
    ...character(),
    essence: 20,
    dropped: { amount: 500, region: 0, x: 1, z: 1 },
  };
  assert.equal(deathState(s, { x: 2, z: 2 }).dropped.amount, 20);
  assert.equal(deathState({ ...s, essence: 0 }, { x: 3, z: 3 }).dropped, null);
});
test("leveling consumes exact cost, increases chosen attribute, restores resources", () => {
  let s = { ...character(), essence: 300 };
  const cost = levelCost(s);
  const next = spendLevel(s, "Vigor");
  assert.equal(next.attrs.Vigor, s.attrs.Vigor + 1);
  assert.equal(next.level, 2);
  assert.equal(next.essence, 300 - cost);
  assert.equal(next.hp, limits(next).hp);
  assert.ok(levelCost(next) > cost);
  assert.equal(spendLevel({ ...s, essence: 0 }, "Vigor").level, 1);
  assert.equal(spendLevel(s, "Invalid"), s);
});
test("heavy attacks, upgrades and scaling increase damage with meaningful armour tradeoffs", () => {
  const s = character();
  assert.ok(damageFor(s, "heavy") > damageFor(s, "light"));
  assert.ok(damageFor({ ...s, upgrade: 2 }) > damageFor(s));
  assert.ok(
    damageFor({ ...s, attrs: { ...s.attrs, Strength: 30 } }) > damageFor(s),
  );
  assert.ok(
    receiveDamage(s, 50) <
      receiveDamage({ ...s, armour: "Pilgrim’s Shroud" }, 50),
  );
  assert.ok(receiveDamage(s, 50, true) < receiveDamage(s, 50));
  assert.ok(softCap(40) - softCap(30) < softCap(30) - softCap(20));
});
test("save round-trip retains narrative choices and inventory; malformed saves fail safely", () => {
  const memory = new Map();
  const storage = {
    getItem: (k) => memory.get(k),
    setItem: (k, v) => memory.set(k, v),
  };
  const s = { ...character(), choices: { 0: "mercy" }, bosses: [0], shards: 1 };
  assert.equal(saveGame(s, storage), true);
  assert.deepEqual(loadSave(storage), s);
  assert.equal(loadSave({ getItem: () => "{broken" }), null);
  assert.equal(
    loadSave({ getItem: () => JSON.stringify({ version: 1 }) }),
    null,
  );
  assert.equal(
    saveGame(s, {
      setItem: () => {
        throw Error("quota");
      },
    }),
    false,
  );
});
