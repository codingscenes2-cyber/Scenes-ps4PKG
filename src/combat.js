// The visible ground shapes and damage queries share this definition.
const sweep = {
  name: "Grave sweep",
  shape: "cone",
  radius: 4.2,
  arc: Math.PI * 1.2,
  windup: 1,
  recovery: 1.15,
  power: 1,
};
const slam = {
  name: "Oathbreaker",
  shape: "circle",
  radius: 4.6,
  windup: 1.3,
  recovery: 1.7,
  power: 1.3,
};
const toll = {
  name: "The hollow toll",
  shape: "ring",
  radius: 7,
  inner: 2.8,
  windup: 1.55,
  recovery: 1.3,
  power: 1.15,
};
const mark = {
  name: "A name in the ash",
  shape: "mark",
  radius: 2.7,
  windup: 1.35,
  recovery: 1.4,
  power: 0.95,
};
const themes = [
  ["Clapper’s sweep", "The silent weight", "Remember the bell"],
  ["Widow’s reach", "The grieving root", "A cradle of thorns"],
  ["Royal sentence", "The final decree", "Kneel before nothing"],
  ["Mercy’s price", "A saint’s embrace", "The garden of rot"],
  ["Glacier’s edge", "Avalanche", "Winter’s breath"],
  ["Unseen hand", "The oracle’s answer", "A future denied"],
  ["Cinder blade", "Furnace heart", "The fire remembers"],
  ["Glass horizon", "A pilgrim’s burden", "Mirage"],
  ["The mother’s reach", "The undertow", "Shoreward promise"],
  ["Broken wing", "Dawnfall", "Unanswered prayer"],
  ["Your first mistake", "Your last regret", "An unwritten memory"],
  ["Eclipse crescent", "The regent’s decree", "A sun extinguished"],
  ["The unmaking", "An empty throne", "A world unfinished"],
];
export function bossMove(region, phase, turn) {
  const pattern =
    phase === 1
      ? [sweep, slam]
      : phase === 2
        ? [sweep, mark, slam]
        : [mark, sweep, toll, slam];
  const source = pattern[turn % pattern.length];
  const names = themes[region] || themes[0];
  return {
    ...source,
    name: names[source === sweep ? 0 : source === slam ? 1 : 2],
    windup: source.windup * (phase === 3 ? 0.87 : 1),
    power: source.power * (1 + (phase - 1) * 0.1),
  };
}
export function attackConnects(point, origin, facing, move) {
  const dx = point.x - origin.x,
    dz = point.z - origin.z,
    dist = Math.hypot(dx, dz);
  if (dist > move.radius) return false;
  if (move.shape === "ring") return dist >= move.inner;
  if (move.shape === "cone" && dist > 0.01) {
    const angle = Math.atan2(dx, dz) - facing;
    return Math.cos(angle) >= Math.cos(move.arc / 2);
  }
  return true;
}
