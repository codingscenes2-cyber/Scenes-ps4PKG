import {
  CLASSES,
  WEAPONS,
  ARMOURS,
  DIFFICULTIES,
  ATTRS,
  REGIONS,
} from "./data.js";
import { campaignState } from "./campaign.js";
export const SAVE_KEY = "soul-land-save-v1";
export const softCap = (v) => (v <= 30 ? v : 30 + (v - 30) * 0.45);
export const limits = (s) => ({
  hp: 100 + softCap(s.attrs.Vigor) * 8,
  stamina: 70 + softCap(s.attrs.Endurance) * 3,
  focus: 45 + softCap(s.attrs.Mind) * 5,
});
export const flaskCount = (s) =>
  DIFFICULTIES[s.difficulty].flasks + (s.choices?.[2] === "mercy" ? 1 : 0);
export const levelCost = (s) => Math.floor(80 * Math.pow(1.17, s.level - 1));
export function createCharacter(c) {
  const cl = CLASSES.find((x) => x.name === c.className) || CLASSES[0];
  const s = {
    version: 1,
    campaign: campaignState(null),
    defeatedCounts: {},
    name: c.name?.trim().slice(0, 24) || "The Unnamed",
    className: cl.name,
    gender: c.gender || "Unbound",
    origin: c.origin || "Ashen Exile",
    history: c.history || "",
    appearance: c.appearance || "Ash",
    difficulty: c.difficulty || "Normal",
    attrs: Object.fromEntries(ATTRS.map((n, i) => [n, cl.stats[i]])),
    level: 1,
    essence: 0,
    region: 0,
    sanctuary: 0,
    discovered: [0],
    bosses: [],
    shards: 0,
    mercy: 0,
    choices: {},
    quests: {},
    inventory: [
      cl.weapon,
      "Pilgrim’s Bow",
      "Exile’s Iron",
      "Wanderer’s Leathers",
      "Pilgrim’s Shroud",
    ],
    weapon: cl.weapon,
    armour: cl.armour,
    upgrade: 0,
    weaponUpgrades: {},
    infusion: "Physical",
    spell: "Soul lance",
    spells: ["Soul lance", "Cinder bolt", "Sacred mending"],
    flasks: DIFFICULTIES[c.difficulty || "Normal"].flasks,
    materials: 0,
    antidotes: 2,
    relics: [],
    secret: [],
    dropped: null,
    position: { x: 0, z: 9 },
    time: 8,
    worldDay: 1,
    events: [],
    ending: null,
  };
  return {
    ...s,
    ...limits(s),
    hp: limits(s).hp,
    stamina: limits(s).stamina,
    focus: limits(s).focus,
  };
}
export function loadSave(storage = globalThis.localStorage) {
  try {
    const s = JSON.parse(storage.getItem(SAVE_KEY));
    if (
      s?.version !== 1 ||
      !CLASSES.some((c) => c.name === s.className) ||
      !REGIONS[s.region] ||
      !DIFFICULTIES[s.difficulty] ||
      !s.attrs ||
      !ATTRS.every((a) => Number.isFinite(s.attrs[a])) ||
      !Array.isArray(s.inventory) ||
      !s.inventory.every((v) => typeof v === "string") ||
      !["events", "secret", "spells", "relics"].every(
        (k) => Array.isArray(s[k]) && s[k].every((v) => typeof v === "string"),
      ) ||
      !["bosses", "discovered"].every(
        (k) =>
          Array.isArray(s[k]) &&
          s[k].every((v) => Number.isInteger(v) && !!REGIONS[v]),
      ) ||
      !["gender", "appearance", "origin", "history"].every(
        (k) => s[k] === undefined || typeof s[k] === "string",
      ) ||
      (s.dropped !== null &&
        s.dropped !== undefined &&
        (!REGIONS[s.dropped.region] ||
          !["x", "z", "amount"].every((k) => Number.isFinite(s.dropped[k])))) ||
      !["bosses", "discovered", "events", "secret", "spells", "relics"].every(
        (k) => Array.isArray(s[k]),
      ) ||
      ![
        "hp",
        "stamina",
        "focus",
        "essence",
        "level",
        "flasks",
        "materials",
        "time",
        "worldDay",
        "mercy",
        "shards",
        "upgrade",
      ].every((k) => Number.isFinite(s[k]) && s[k] >= 0) ||
      typeof s.name !== "string" ||
      !s.choices ||
      !s.quests ||
      !REGIONS[s.sanctuary] ||
      !s.position ||
      !Number.isFinite(s.position.x) ||
      !Number.isFinite(s.position.z)
    )
      return null;
    return {
      ...s,
      campaign: campaignState(s),
      defeatedCounts: Object.fromEntries(
        Object.entries(
          s.defeatedCounts && typeof s.defeatedCounts === "object"
            ? s.defeatedCounts
            : {},
        ).filter(
          ([name, count]) =>
            name.length <= 100 && Number.isInteger(count) && count >= 0,
        ),
      ),
    };
  } catch {
    return null;
  }
}
export function saveGame(s, storage = globalThis.localStorage) {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}
export function damageFor(s, kind = "light") {
  const w = WEAPONS.find((w) => w.name === s.weapon) || WEAPONS[0];
  const infusionAttr = {
    Flame: "Intelligence",
    Sacred: "Faith",
    Occult: "Arcana",
  }[s.infusion];
  const scale = softCap(s.attrs[infusionAttr || w.scaling]);
  let dmg = (w.damage + scale * 0.9) * (1 + s.upgrade * 0.15);
  return Math.round(
    dmg *
      ({
        light: 1,
        heavy: 1.8,
        charged: 2.3,
        skill: 2.1,
        riposte: 3,
        guardcounter: 2.1,
        backstab: 2.6,
        jump: 1.5,
        sprint: 1.4,
      }[kind] || 1),
  );
}
export function receiveDamage(s, raw, blocking = false) {
  const armour = ARMOURS.find((a) => a.name === s.armour) || ARMOURS[2];
  const resist = Math.min(0.15, s.attrs.Endurance * 0.003);
  return Math.max(
    1,
    Math.round(
      raw *
        (1 - armour.defence - resist) *
        (blocking ? (s.choices?.[2] === "knowledge" ? 0.2 : 0.25) : 1),
    ),
  );
}
export function deathState(s, position) {
  const max = limits(s);
  return {
    ...s,
    hp: max.hp,
    stamina: max.stamina,
    focus: max.focus,
    flasks: flaskCount(s),
    dropped:
      s.essence > 0
        ? { amount: s.essence, region: s.region, ...position }
        : null,
    essence: 0,
    region: s.sanctuary,
    position: { x: 0, z: 9 },
  };
}
export function spendLevel(s, attribute) {
  if (!ATTRS.includes(attribute) || s.essence < levelCost(s)) return s;
  const next = {
    ...s,
    essence: s.essence - levelCost(s),
    level: s.level + 1,
    attrs: { ...s.attrs, [attribute]: s.attrs[attribute] + 1 },
  };
  return {
    ...next,
    hp: limits(next).hp,
    stamina: limits(next).stamina,
    focus: limits(next).focus,
  };
}
