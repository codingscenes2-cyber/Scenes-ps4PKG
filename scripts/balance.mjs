import {
  createCharacter,
  damageFor,
  receiveDamage,
  limits,
  levelCost,
} from "../src/state.js";
import { CLASSES, DIFFICULTIES, WEAPONS } from "../src/data.js";
import { SKILLS, bonuses } from "../src/progression.js";
import { THRONES } from "../src/story.js";
export function simulate() {
  const rows = [];
  for (const cl of CLASSES)
    for (const difficulty of Object.keys(DIFFICULTIES))
      for (const level of [1, 5, 10, 20]) {
        const s = createCharacter({ className: cl.name, difficulty });
        let spent = 0;
        const scaling = WEAPONS.find((w) => w.name === s.weapon).scaling;
        for (let n = 1; n < level; n++) {
          spent += levelCost({ ...s, level: n });
          s.attrs[["Vigor", "Endurance", scaling][(n - 1) % 3]]++;
        }
        s.level = level;
        s.upgrade = Math.min(5, Math.floor(level / 4));
        const region = Math.min(12, Math.floor((level - 1) * 0.65));
        const bossHP = Math.round(
          (280 + region * 75) * DIFFICULTIES[difficulty].health,
        );
        const weapon = WEAPONS.find((w) => w.name === s.weapon);
        const hit = damageFor(s),
          incoming = receiveDamage(
            s,
            (45 + region * 3) * DIFFICULTIES[difficulty].damage,
          );
        const max = limits(s),
          baseDamage = hit;
        const end = {
          ...s,
          skills: SKILLS.map((n) => n.id),
          story: {
            thrones: Object.fromEntries(THRONES.map((t) => [t.id, "free"])),
          },
        };
        const poweredDamage = damageFor(end),
          bonus = bonuses(end);
        if (
          poweredDamage / baseDamage > 1.15 ||
          bonus.defence > 0.15 ||
          !Number.isFinite(incoming) ||
          incoming <= 0
        )
          throw Error(`Power budget exceeded: ${cl.name}`);
        rows.push({
          class: cl.name,
          difficulty,
          level,
          region,
          levelEssence: spent,
          hp: max.hp,
          stamina: max.stamina,
          damage: hit,
          bossHP,
          hitsToWin: Math.ceil(bossHP / hit),
          hitsToDie: Math.ceil(max.hp / incoming),
          attacksPerBar: Math.floor(max.stamina / weapon.stamina),
          skillEssence: SKILLS.reduce((n, s) => n + s.cost, 0),
          maxPowerDamage: poweredDamage,
          generated_by: "CodeRabbit",
        });
      }
  return rows;
}
if (
  process.argv[1] &&
  import.meta.url === new URL(process.argv[1], "file:").href
) {
  const rows = simulate();
  console.log(Object.keys(rows[0]).join(","));
  for (const row of rows) console.log(Object.values(row).join(","));
}
