import { campaignState } from "./campaign.js";
export const SECRET_GATES = [
  {
    kind: "flames",
    title: "Three pilgrim lights",
    clue: "Three lights must remember the road.",
  },
  {
    kind: "heavy",
    title: "A pale, hollow tree",
    clue: "The bark gives a hollow answer. A heavy strike might break it.",
  },
  {
    kind: "heavy",
    title: "A wall without mortar",
    clue: "Fresh stone covers older writing. Strike it with weight.",
  },
  {
    kind: "night",
    title: "Lanterns on the water",
    clue: "The drowned lanterns reveal their road after sunset.",
  },
  {
    kind: "charged",
    title: "Ice around a heartbeat",
    clue: "A patient, charged strike could break the frozen seal.",
  },
  {
    kind: "pillars",
    title: "The oracle’s three pillars",
    clue: "Kindle the three crystal pillars. Each is an unspoken word.",
  },
  {
    kind: "touch",
    title: "A stone without warmth",
    clue: "One stone has never felt the fire. Touch the cold seal.",
  },
  {
    kind: "dusk",
    title: "A stair made of shadow",
    clue: "The buried stair appears between the seventeenth and twentieth hour.",
  },
  {
    kind: "ferryman",
    title: "A door beneath the tide",
    clue: "The ferryman of the Mire knows who may cross.",
  },
  {
    kind: "kneel",
    title: "An altar without a god",
    clue: "The prayer is not a word. Kneel before what is missing.",
  },
  {
    kind: "silence",
    title: "The archive asks your name",
    clue: "Some doors open only when their question is left unanswered.",
  },
  {
    kind: "touch",
    title: "A reflection without a face",
    clue: "The mirrored stone shows a road the world has forgotten. Touch it.",
  },
  {
    kind: "mercy",
    title: "The eighth shadow",
    clue: "Seven acts of mercy make a space that power cannot fill.",
  },
];
export function secretOpen(s) {
  const p = campaignState(s),
    kind = SECRET_GATES[s.region].kind;
  return (
    p.seals.includes(s.region) ||
    (kind === "flames" && p.braziers.length === 3) ||
    (kind === "night" && (s.time >= 18 || s.time < 6)) ||
    (kind === "dusk" && s.time >= 17 && s.time < 20) ||
    (kind === "ferryman" && !!s.choices[3]) ||
    (kind === "mercy" && s.mercy >= 7) ||
    (kind === "pillars" && p.pillars.length === 3)
  );
}
export function unseal(s, action) {
  if (secretOpen(s) || SECRET_GATES[s.region].kind !== action) return s;
  if (!["heavy", "charged", "touch", "kneel", "silence"].includes(action))
    return s;
  const p = campaignState(s);
  return {
    ...s,
    campaign: { ...p, seals: [...p.seals, s.region] },
    events: [
      ...s.events.slice(-30),
      `A hidden way opened: ${SECRET_GATES[s.region].title}.`,
    ],
  };
}
export function lightPillar(s, id) {
  const p = campaignState(s);
  if (s.region !== 5 || ![0, 1, 2].includes(id) || p.pillars.includes(id))
    return s;
  return { ...s, campaign: { ...p, pillars: [...p.pillars, id] } };
}
export function weatherAt(s) {
  const harsh = s.worldDay % 3 === 0;
  const density = [
    0.018, 0.035, 0.025, 0.04, 0.025, 0.025, 0.03, 0.045, 0.03, 0.02, 0.026,
    0.04, 0.025,
  ][s.region];
  return {
    fog: density * (harsh ? 1.3 : 1),
    rain: [1, 3, 9].includes(s.region),
    snow: s.region === 4,
    ash: [0, 6].includes(s.region),
    storm: harsh,
  };
}
