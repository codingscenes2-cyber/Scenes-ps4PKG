import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createCharacter,
  saveGame,
  loadSave,
  SAVE_KEY,
  BACKUP_KEY,
  saveHealth,
} from "../src/state.js";
import { encodeSave, decodeSave } from "../src/saveTransport.js";
const hero = () =>
  createCharacter({
    className: "Knight",
    difficulty: "Normal",
    name: "Keeper",
  });
const memory = () => {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) || null,
    setItem: (k, v) => map.set(k, v),
  };
};
test("format 2 round trip and raw version 1 migration preserve the character", () => {
  const s = hero();
  assert.deepEqual(decodeSave(encodeSave(s)), s);
  assert.deepEqual(loadSave({ getItem: () => JSON.stringify(s) }), s);
});
test("corruption, unsupported formats and checksum tampering are rejected", () => {
  const value = JSON.parse(encodeSave(hero()));
  value.payload.essence = 999;
  assert.equal(decodeSave(JSON.stringify(value)), null);
  value.format = 99;
  assert.equal(decodeSave(JSON.stringify(value)), null);
  assert.equal(decodeSave("{"), null);
});
test("corrupt primary recovers last validated snapshot and retains it on next save", () => {
  const store = memory(),
    s = hero();
  saveGame(s, store);
  saveGame({ ...s, essence: 100 }, store);
  store.setItem(SAVE_KEY, "broken");
  assert.deepEqual(loadSave(store), s);
  assert.equal(saveHealth(store), "recovered");
  saveGame({ ...s, essence: 25 }, store);
  assert.deepEqual(decodeSave(store.getItem(BACKUP_KEY)), s);
  assert.equal(loadSave(store).essence, 25);
});
test("invalid data cannot replace a valid primary or backup", () => {
  const store = memory(),
    s = hero();
  saveGame(s, store);
  assert.equal(saveGame({ ...s, hp: NaN }, store), false);
  assert.deepEqual(loadSave(store), s);
});
