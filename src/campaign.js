import content from "./content/campaign.json" with { type: "json" };
export const CHAPTERS = content.CHAPTERS;
export const ECHOES = content.ECHOES;
export function campaignState(s) {
  const p = s?.campaign;
  const valid = (key, max) => [
    ...new Set(
      Array.isArray(p?.[key])
        ? p[key].filter((x) => Number.isInteger(x) && x >= 0 && x <= max)
        : [],
    ),
  ];
  return {
    echoes: valid("echoes", 12),
    claimed: valid("claimed", 12).filter((x) =>
      CHAPTERS.some((c) => c.region === x),
    ),
    braziers: valid("braziers", 2),
    seals: valid("seals", 12),
    pillars: valid("pillars", 2),
  };
}
export function chapterReady(s, c) {
  const p = campaignState(s);
  return (
    !!c &&
    CHAPTERS.slice(0, CHAPTERS.indexOf(c)).every((previous) =>
      p.claimed.includes(previous.region),
    ) &&
    !!s.choices[c.region] &&
    s.bosses.includes(c.region) &&
    p.echoes.includes(c.region) &&
    !p.claimed.includes(c.region) &&
    (c.region !== 12 || s.shards >= 7)
  );
}
export function currentChapter(s) {
  if (!s) return CHAPTERS[0];
  const p = campaignState(s);
  return CHAPTERS.find((c) => !p.claimed.includes(c.region)) || CHAPTERS.at(-1);
}
export function chapterObjective(s, c = currentChapter(s)) {
  if (!s) return "Meet Sister Vael beside the sanctuary.";
  const p = campaignState(s);
  if (p.claimed.includes(c.region))
    return "Choose the future at the final sanctuary.";
  if (!s.choices[c.region])
    return `Speak to ${["Sister Vael", "The Antlered Child", "Captain Edrin", null, null, "Scholar Orren", null, null, "The Drowned Prince", null, null, null, "The Last Witness"][c.region]}.`;
  if (!p.echoes.includes(c.region))
    return `Read the memorial east of the pilgrim road in ${c.subtitle.split(" ·")[0]}.`;
  if (!s.bosses.includes(c.region))
    return `Confront the guardian of ${c.subtitle.split(" ·")[0]}.`;
  return "Return to the region’s witness and hear the rest of the story.";
}
export function rememberEcho(s, region) {
  if (region !== s.region || !ECHOES[region]) return s;
  const p = campaignState(s);
  if (p.echoes.includes(region)) return s;
  return {
    ...s,
    campaign: { ...p, echoes: [...p.echoes, region] },
    events: [
      ...s.events.slice(-30),
      `A memory recovered: ${ECHOES[region][0]}.`,
    ],
  };
}
export function claimChapter(s) {
  const c = CHAPTERS.find((c) => c.region === s.region);
  if (!c || !chapterReady(s, c)) return s;
  const p = campaignState(s);
  return {
    ...s,
    essence: s.essence + c.reward,
    materials: s.materials + 2,
    campaign: { ...p, claimed: [...p.claimed, s.region] },
    relics: [...new Set([...s.relics, c.item])],
    events: [
      ...s.events.slice(-30),
      `${c.title}: testimony entrusted to ${s.name}.`,
    ],
  };
}
export function lightBrazier(s, id) {
  if (s.region !== 0 || ![0, 1, 2].includes(id)) return s;
  const p = campaignState(s);
  return p.braziers.includes(id)
    ? s
    : { ...s, campaign: { ...p, braziers: [...p.braziers, id] } };
}
export const NPC_TOPICS = content.NPC_TOPICS;

export function chapterConclusion(s, c) {
  const mercy = s.choices[c.region] === "mercy";
  const branches = {
    0: mercy
      ? "Vael places the toy in your hand willingly. “Do not let them use his name to make another war.”"
      : "Vael keeps the toy. “You asked for truth, not forgiveness. Be certain you know the difference.”",
    1: mercy
      ? "You are entrusted with the names, not their ownership. The child asks only that they be spoken somewhere the sun still reaches."
      : "The child scratches a warning beneath the name: “People who collect answers eventually forget to ask permission.”",
    2: mercy
      ? "Edrin opens a narrow gate. Living prisoners emerge among the hollow. Their families send a spare flask to every sanctuary you kindle."
      : "Edrin nails his confession above the sealed gates. He teaches you the iron guard before turning to face the citizens he condemned.",
  };
  return c.conclusion + (branches[c.region] ? " " + branches[c.region] : "");
}
