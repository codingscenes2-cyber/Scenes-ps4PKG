import { WEAPONS, REGIONS } from "./data.js";
import SKILLS from "./content/skills.json" with { type: "json" };
import { storyState } from "./story.js";
export { SKILLS };
export function knownSkills(s) {
  return [
    ...new Set(
      (s?.skills || []).filter((id) => SKILLS.some((n) => n.id === id)),
    ),
  ];
}
export function canLearn(s, node) {
  return (
    !!node &&
    !knownSkills(s).includes(node.id) &&
    s.essence >= node.cost &&
    node.requires.every((id) => knownSkills(s).includes(id))
  );
}
export function learnSkill(s, id) {
  const node = SKILLS.find((n) => n.id === id);
  return canLearn(s, node)
    ? {
        ...s,
        essence: s.essence - node.cost,
        skills: [...knownSkills(s), id],
        events: [...s.events, `Learned ${node.name}.`],
      }
    : s;
}
export function bonuses(s) {
  const result = {
    hp: 0,
    stamina: 0,
    focus: 0,
    damage: 0,
    defence: 0,
    regen: 0,
    dodgeCost: 0,
    focusCost: 0,
    healing: 0,
  };
  for (const n of SKILLS)
    if (knownSkills(s).includes(n.id))
      for (const [k, v] of Object.entries(n.effect)) result[k] += v;
  const t = storyState(s).thrones;
  if (t.life) result.hp += 24;
  if (t.death) result.defence += 0.04;
  if (t.time) result.regen += 0.08;
  if (t.flame) result.damage += 0.04;
  if (t.void) result.defence += 0.04;
  if (t.memory) result.focus += 15;
  if (t.creation) {
    result.focus += 10;
    result.stamina += 10;
  }
  return result;
}
// Rarity communicates origin; it never silently changes existing weapon damage.
export function gearRarity(name, regions) {
  const index = regions.findIndex((r) => r.reward === name);
  return index >= 9
    ? "Legendary"
    : index >= 4
      ? "Epic"
      : index >= 0
        ? "Rare"
        : "Common";
}
export function spellFocusCost(s, spell) {
  return Math.ceil(
    spell.cost * (1 + (spell.damage > 0 ? bonuses(s).focusCost : 0)),
  );
}
export function bossEquipment(s, reward) {
  const weapon = WEAPONS.some((w) => w.name === reward);
  return {
    inventory: weapon ? [...new Set([...s.inventory, reward])] : s.inventory,
    relics: weapon ? s.relics : [...new Set([...s.relics, reward])],
  };
}
export function recoveredRelics(s) {
  const names = REGIONS.map((r) => r.reward).filter(
    (name) => !WEAPONS.some((w) => w.name === name),
  );
  return [
    ...new Set([
      ...s.relics,
      ...s.inventory.filter((name) => names.includes(name)),
    ]),
  ];
}
