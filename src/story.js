import THRONES from "./content/thrones.json" with { type: "json" };
export { THRONES };
export function storyState(s) {
  const source = s?.story?.thrones || {};
  return {
    thrones: Object.fromEntries(
      THRONES.filter((t) => t.choices.some((c) => c.id === source[t.id])).map(
        (t) => [t.id, source[t.id]],
      ),
    ),
  };
}
export function throneStage(s, throne) {
  if (storyState(s).thrones[throne.id]) return "resolved";
  if (!s?.bosses?.includes(throne.region)) return "sealed";
  if (
    !s?.campaign?.echoes?.includes(throne.region) ||
    !s.choices?.[throne.region]
  )
    return "witnessed";
  return "awakened";
}
export function resolveThrone(s, id, choice) {
  const t = THRONES.find((t) => t.id === id);
  const c = t?.choices.find((c) => c.id === choice);
  // A choice is local, earned and irreversible. No remote resolution from the journal.
  if (!c || s.region !== t.region || throneStage(s, t) !== "awakened") return s;
  const story = storyState(s);
  return {
    ...s,
    story: { thrones: { ...story.thrones, [id]: choice } },
    events: [...s.events, `${t.name}: ${c.label}. ${c.epilogue}`],
  };
}
export function storyFlags(s) {
  return Object.fromEntries([
    ...THRONES.flatMap((t) => [
      [`throne.${t.id}.stage`, throneStage(s, t)],
      [`throne.${t.id}.fate`, storyState(s).thrones[t.id] || "undecided"],
    ]),
    ...Object.entries(s?.choices || {}).map(([k, v]) => [`npc.${k}`, v]),
    ...Array.from({ length: 13 }, (_, i) => [
      `guardian.${i}.defeated`,
      !!s?.bosses?.includes(i),
    ]),
    ...Array.from({ length: 13 }, (_, i) => [
      `memory.${i}.read`,
      !!s?.campaign?.echoes?.includes(i),
    ]),
    ["campaign.claimed", s?.campaign?.claimed || []],
    ["ending", s?.ending || null],
  ]);
}
export function endingCoda(s) {
  const votes = Object.values(storyState(s).thrones);
  const count = (id) => votes.filter((v) => v === id).length;
  if (!votes.length)
    return "The thrones keep their silence. Their unfinished questions remain in the roads you can still walk.";
  if (count("free") >= 4)
    return "Four seats stand empty by consent. The new age has no prophecy to hide behind; its people will have to listen to one another.";
  if (count("claim") >= 4)
    return "The powers gather around a single name. At the far edge of the realm, a child begins a story in which you are the warning.";
  if (count("restore") >= 4)
    return "The old boundaries return, but their keepers now remember what obedience cost. The first new law permits a throne to remain empty.";
  return "The seven powers disagree. Their borders become places of negotiation, and no single history can call this age its own.";
}
