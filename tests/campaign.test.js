import test from "node:test";
import assert from "node:assert/strict";
import {
  createCharacter,
  deathState,
  loadSave,
  saveGame,
  flaskCount,
  receiveDamage,
} from "../src/state.js";
import {
  CHAPTERS,
  campaignState,
  currentChapter,
  chapterReady,
  rememberEcho,
  claimChapter,
  lightBrazier,
  chapterConclusion,
} from "../src/campaign.js";
const fresh = () =>
  createCharacter({
    name: "Witness",
    className: "Knight",
    difficulty: "Veteran",
  });
test("testimony requires a conversation, a recovered memory and a defeated guardian", () => {
  const c = CHAPTERS[0],
    s = fresh();
  for (const partial of [
    s,
    { ...s, choices: { 0: "mercy" } },
    { ...s, choices: { 0: "mercy" }, bosses: [0] },
  ]) {
    assert.equal(chapterReady(partial, c), false);
    assert.equal(claimChapter(partial), partial);
  }
  const ready = rememberEcho({ ...s, choices: { 0: "mercy" }, bosses: [0] }, 0);
  assert.equal(chapterReady(ready, c), true);
  const next = claimChapter(ready);
  assert.equal(next.essence, c.reward);
  assert.equal(next.materials, 2);
  assert.ok(next.relics.includes(c.item));
  assert.equal(currentChapter(next), CHAPTERS[1]);
  assert.equal(claimChapter(next), next);
  assert.notEqual(
    chapterConclusion(ready, c),
    chapterConclusion({ ...ready, choices: { 0: "knowledge" } }, c),
  );
});
test("chapters preserve order while allowing exploration and memories in any order", () => {
  let s = {
    ...fresh(),
    region: 5,
    choices: { 5: "knowledge" },
    bosses: [5],
    campaign: { echoes: [5], claimed: [], braziers: [] },
  };
  assert.equal(claimChapter(s), s);
  s = fresh();
  let expected = 0;
  for (const c of CHAPTERS) {
    s = {
      ...s,
      region: c.region,
      choices: { ...s.choices, [c.region]: "mercy" },
      bosses: [...s.bosses, c.region],
      shards: 7,
    };
    s = rememberEcho(s, c.region);
    assert.equal(chapterReady(s, c), true);
    s = claimChapter(s);
    expected += c.reward;
  }
  assert.equal(s.essence, expected);
  assert.equal(s.campaign.claimed.length, 6);
  assert.equal(claimChapter(s), s);
});
test("final testimony requires seven shards, and death keeps all campaign discoveries", () => {
  let s = {
    ...fresh(),
    region: 12,
    choices: { 12: "mercy" },
    bosses: [12],
    shards: 6,
    campaign: {
      echoes: [12],
      claimed: CHAPTERS.slice(0, -1).map((c) => c.region),
      braziers: [0, 1, 2],
    },
  };
  assert.equal(chapterReady(s, CHAPTERS.at(-1)), false);
  s = { ...s, shards: 7 };
  assert.equal(chapterReady(s, CHAPTERS.at(-1)), true);
  assert.deepEqual(deathState(s, { x: 1, z: 2 }).campaign, s.campaign);
});
test("memorial and brazier actions are local, idempotent and saved through reload", () => {
  let s = fresh();
  assert.equal(rememberEcho(s, 1), s);
  assert.equal(lightBrazier(s, 3), s);
  for (let i = 0; i < 3; i++) s = lightBrazier(s, i);
  assert.equal(lightBrazier(s, 0), s);
  assert.deepEqual(s.campaign.braziers, [0, 1, 2]);
  s = rememberEcho(s, 0);
  assert.equal(rememberEcho(s, 0), s);
  let encoded;
  const storage = {
    setItem: (key, value) => (encoded = value),
    getItem: () => encoded,
  };
  saveGame(s, storage);
  assert.deepEqual(loadSave(storage), s);
});
test("pre-upgrade saves migrate without losing progression, and malformed campaign arrays normalize", () => {
  const old = {
    ...fresh(),
    level: 8,
    essence: 480,
    choices: { 2: "knowledge" },
    bosses: [0, 1, 2],
    shards: 3,
  };
  delete old.campaign;
  delete old.defeatedCounts;
  const migrated = loadSave({ getItem: () => JSON.stringify(old) });
  assert.equal(migrated.level, 8);
  assert.equal(migrated.essence, 480);
  assert.deepEqual(migrated.bosses, [0, 1, 2]);
  assert.deepEqual(migrated.campaign, {
    echoes: [],
    claimed: [],
    braziers: [],
    seals: [],
    pillars: [],
  });
  assert.deepEqual(
    campaignState({
      campaign: { echoes: [0, 0, 13, "2"], claimed: [0, 3], braziers: "bad" },
    }),
    { echoes: [0], claimed: [0], braziers: [], seals: [], pillars: [] },
  );
});
test("Crownfall choices provide the stated distinct sanctuary or guard benefit", () => {
  const s = fresh(),
    refuge = { ...s, choices: { 2: "mercy" } },
    confession = { ...s, choices: { 2: "knowledge" } };
  assert.equal(flaskCount(refuge), flaskCount(s) + 1);
  assert.equal(deathState(refuge, { x: 0, z: 0 }).flasks, flaskCount(refuge));
  assert.ok(receiveDamage(confession, 100, true) < receiveDamage(s, 100, true));
  assert.equal(
    receiveDamage(confession, 100, false),
    receiveDamage(s, 100, false),
  );
});

test("import rejects broken item records and normalizes invalid bestiary counters", () => {
  const s = fresh();
  assert.equal(
    loadSave({
      getItem: () => JSON.stringify({ ...s, relics: [{ bad: "data" }] }),
    }),
    null,
  );
  assert.equal(
    loadSave({
      getItem: () =>
        JSON.stringify({
          ...s,
          dropped: { region: 0, amount: 4, x: "bad", z: 0 },
        }),
    }),
    null,
  );
  const restored = loadSave({
    getItem: () =>
      JSON.stringify({
        ...s,
        defeatedCounts: { Hollow: 3, Bad: { count: 1 }, Negative: -1 },
      }),
  });
  assert.deepEqual(restored.defeatedCounts, { Hollow: 3 });
});
