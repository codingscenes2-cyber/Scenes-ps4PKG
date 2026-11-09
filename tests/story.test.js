import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createCharacter,
  saveGame,
  loadSave,
  damageFor,
  limits,
} from "../src/state.js";
import {
  THRONES,
  throneStage,
  resolveThrone,
  storyFlags,
  endingCoda,
} from "../src/story.js";
import { SKILLS, learnSkill, bonuses } from "../src/progression.js";
import {
  spellFocusCost,
  bossEquipment,
  recoveredRelics,
} from "../src/progression.js";
import { REGIONS, WEAPONS, SPELLS } from "../src/data.js";
import { simulate } from "../scripts/balance.mjs";
const hero = () =>
  createCharacter({ className: "Knight", difficulty: "Normal" });
test("all seven throne arcs require local combat, memory and witness before irreversible choices", () => {
  for (const t of THRONES) {
    let s = hero();
    assert.equal(throneStage(s, t), "sealed");
    assert.equal(resolveThrone(s, t.id, "free"), s);
    s = { ...s, region: t.region, bosses: [t.region] };
    assert.equal(throneStage(s, t), "witnessed");
    s = {
      ...s,
      choices: { [t.region]: "mercy" },
      campaign: { ...s.campaign, echoes: [t.region] },
    };
    assert.equal(throneStage(s, t), "awakened");
    assert.equal(
      resolveThrone({ ...s, region: 0 }, t.id, "free").story.thrones[t.id],
      undefined,
    );
    for (const choice of t.choices) {
      const next = resolveThrone(s, t.id, choice.id);
      assert.equal(throneStage(next, t), "resolved");
      assert.equal(next.story.thrones[t.id], choice.id);
      assert.equal(resolveThrone(next, t.id, "claim"), next);
      assert.equal(next.events.length, s.events.length + 1);
    }
    assert.equal(resolveThrone(s, t.id, "invalid"), s);
  }
});
test("flags are derived, invalid story data normalizes and save round trip retains fates", () => {
  const s = {
    ...hero(),
    story: { thrones: { life: "free", death: "bad", unknown: "claim" } },
    skills: ["iron-root", "unknown", "iron-root"],
  };
  let raw;
  const store = {
    getItem: () => raw,
    setItem: (_, v) => {
      raw = v;
    },
  };
  saveGame(s, store);
  const loaded = loadSave(store);
  assert.deepEqual(loaded.story.thrones, { life: "free" });
  assert.deepEqual(loaded.skills, ["iron-root"]);
  assert.equal(storyFlags(loaded)["throne.life.stage"], "resolved");
  assert.match(
    endingCoda({
      ...s,
      story: {
        thrones: { life: "free", death: "free", time: "free", flame: "free" },
      },
    }),
    /consent/,
  );
});
test("skill costs and prerequisites cannot be bypassed or paid twice", () => {
  let s = { ...hero(), essence: 1000 };
  assert.equal(learnSkill(s, "measured-edge"), s);
  assert.equal(learnSkill({ ...s, essence: 0 }, "iron-root").skills.length, 0);
  const next = learnSkill(s, "iron-root");
  assert.equal(next.essence, 880);
  assert.equal(limits(next).hp, limits(s).hp + 24);
  assert.equal(learnSkill(next, "iron-root"), next);
  assert.ok(damageFor(learnSkill(next, "measured-edge")) > damageFor(next));
});
test("deterministic balance sweep covers all classes, difficulties and progression bands within power budget", () => {
  const rows = simulate();
  assert.equal(rows.length, 128);
  assert.deepEqual(rows, simulate());
  for (const row of rows) {
    assert.ok(row.hitsToWin > 0 && row.hitsToWin < 80);
    assert.ok(row.hitsToDie >= 1);
    assert.ok(row.attacksPerBar >= 2);
    assert.equal(row.skillEssence, 2160);
  }
  assert.ok(bonuses({ skills: SKILLS.map((n) => n.id) }).defence < 0.15);
});

test("Deep Well discounts only offensive magic, preserving the stated healing cost", () => {
  const s = { ...hero(), skills: ["open-mind", "deep-well"] };
  for (const spell of SPELLS)
    assert.equal(
      spellFocusCost(s, spell),
      spell.damage > 0 ? Math.ceil(spell.cost * 0.9) : spell.cost,
    );
});
test("every guardian reward is visible, and legacy hidden relics migrate without removing earned items", () => {
  const s = hero();
  for (const r of REGIONS) {
    const reward = bossEquipment(s, r.reward);
    assert.ok(
      (WEAPONS.some((w) => w.name === r.reward)
        ? reward.inventory
        : reward.relics
      ).includes(r.reward),
    );
    assert.deepEqual(bossEquipment({ ...s, ...reward }, r.reward), reward);
  }
  const legacy = {
    ...s,
    inventory: [
      ...s.inventory,
      "Cinderheart",
      "Oracle’s Eye",
      "Creator’s Relic",
    ],
  };
  assert.deepEqual(recoveredRelics(legacy), [
    "Cinderheart",
    "Oracle’s Eye",
    "Creator’s Relic",
  ]);
  const loaded = loadSave({ getItem: () => JSON.stringify(legacy) });
  assert.deepEqual(loaded.inventory, legacy.inventory);
  assert.equal(loaded.relics.length, 3);
});
