export const CHAPTERS = [
  {
    region: 0,
    title: "A Bell Without a Voice",
    subtitle: "The Ashen Veil · Chapter I",
    intro:
      "Sister Vael has spent nine hundred years keeping a bell silent. The cord around her wrist is tied to something beneath the sanctuary.",
    objective:
      "Read the memorial east of the pilgrim road, face the Bellkeeper, then return to Vael.",
    reward: 180,
    item: "Bellkeeper’s Testament",
    conclusion:
      "Vael unties the cord. A small wooden toy falls from her sleeve: a bell with its clapper carefully removed. “My son made it before he became the thing you faced. He was not guarding the throne. He was keeping the children asleep.” She asks you to carry his testimony to the Hollowwood.",
  },
  {
    region: 1,
    title: "The Children in the Trees",
    subtitle: "The Hollowwood · Chapter II",
    intro:
      "The Antlered Child knows the Bellkeeper’s song. Each time the child sings it, one of the trees begins to breathe.",
    objective:
      "Read the root-bound memorial, defeat the Rootbound Widow, and hear the child’s account.",
    reward: 240,
    item: "A Name Cut from Bark",
    conclusion:
      "The antlers loosen and fall. Beneath them is an ordinary child with a very old voice. “They told Mother the thrones would bring us back. They did. But not together.” On the bark is a name: Edrin. A Crownfall captain paid for the first resurrection.",
  },
  {
    region: 2,
    title: "The Cost of a Crown",
    subtitle: "Crownfall · Chapter III",
    intro:
      "Edrin’s hands shake when he sees the carved name. Behind him, the city gates hold back an army of citizens who have forgotten they are dead.",
    objective:
      "Discover the king’s last decree, defeat the Hollow King, then decide what Edrin must carry.",
    reward: 330,
    item: "The King’s Unsent Letter",
    conclusion:
      "The letter is addressed to no god. “We were promised one more morning,” it reads. “I did not ask what would have to end to make room for it.” Edrin admits the king never ordered the sacrifice. He signed the decree himself. The original contract lies beneath Nacreth.",
  },
  {
    region: 5,
    title: "An Eighth Place at the Table",
    subtitle: "Nacreth · Chapter IV",
    intro:
      "Orren finds a word scratched out of every surviving account: consent. The people of the Below remember a history the surface was made to forget.",
    objective:
      "Recover the archive memorial, confront the Blind Oracle, then return to Orren.",
    reward: 450,
    item: "The Unedited Account",
    conclusion:
      "“Creation was a person,” Orren says. “Not a god. The first person who refused to die for them.” The prophecy is a summons written by the jailers. Its author left an escape route beneath the Sunless Sea, if anyone ever learned to read the omissions.",
  },
  {
    region: 8,
    title: "The Mother Who Stayed",
    subtitle: "The Sunless Sea · Chapter V",
    intro:
      "The drowned prince has spent centuries asking the sea to give his mother back. The sea has been answering in her voice.",
    objective:
      "Read the drowned memorial, face Mother of the Deep, and return to the prince.",
    reward: 600,
    item: "The Last Witness’s Name",
    conclusion:
      "The prince sets a single cup on the shore. “She could have left. They all could. She stayed because we had nobody else.” The water retreats from a staircase that points upward through solid stone. At its top waits the one who signed every version of the prophecy.",
  },
  {
    region: 12,
    title: "The Right to an Ending",
    subtitle: "The Fractured Throne · Final chapter",
    intro:
      "The Last Witness has rehearsed this meeting in a thousand possible worlds. In every version, you ask the wrong question.",
    objective:
      "Read the final memorial, defeat the Unmade, and return to the Witness with seven shards.",
    reward: 900,
    item: "A Blank Page",
    conclusion:
      "The Witness lays down the pen. “I wrote that you would save us. I never wrote what from.” Beyond the thrones there is no enemy waiting to be named. There is only the possibility of a world that no longer needs permission to begin.",
  },
];
export const ECHOES = [
  [
    "The Names Beneath the Bell",
    "The stone lists thirty-seven children. Beside each name is the same date. At the bottom, in a different hand: “If the bell rings, they will remember what we did to bring them home.” One name has been polished by a thumb: Ilyen.",
  ],
  [
    "A Mother’s Inventory",
    "Bread: two loaves. Winter coats: three. Returned children: thirty-six. The last line has been rewritten until the bark splits. “He still answers to his name. That must be enough.”",
  ],
  [
    "The Decree Without a Seal",
    "The king’s seal has been carved into the stone, then crossed out. A signature remains beneath it: Captain Edrin, acting in the interest of a kingdom that did not know it had already died.",
  ],
  [
    "Mercy, Measured",
    "Every basin is marked with the name of a person the saint healed. Turn one over and you find the name of the person who paid for it.",
  ],
  [
    "The Mountain’s Wound",
    "A miner’s final note: “The thing inside the mountain is not trying to wake. It is trying to remember how to stop breathing.”",
  ],
  [
    "The Eighth Signature",
    "Seven names authorize the containment of Creation. An eighth refuses. The refusal is not a signature. It is a handprint small enough to belong to a child.",
  ],
  [
    "An Unsent Apology",
    "The pyromancer wrote this letter before inventing fire. The ink has not dried. “If you are reading this, I have done it again.”",
  ],
  [
    "What the Sand Keeps",
    "A thousand glass jars contain the same memory: a door opening. The inscription beneath them reads: “No one has yet volunteered to remember what came through.”",
  ],
  [
    "The Shoreward Promise",
    "“I will stay until the last child has crossed.” The mother’s oath continues below the waterline. The prince has added a new mark for every year she kept it.",
  ],
  [
    "A Prayer in the Margin",
    "The angel’s wings were bound with pages from a hymn book. Someone has circled the only line that is not a command: “You may leave.”",
  ],
  [
    "A Book That Refuses Its Ending",
    "The last page describes a stranger reading the last page. Beneath it, a second hand has written: “Close the book. We can still surprise them.”",
  ],
  [
    "The Price of Shade",
    "The Regent offered darkness to everyone who could not bear another morning. The first petition is signed by the sun.",
  ],
  [
    "The Empty Seat",
    "The seat has no name. It never did. Creation was the space they left for a choice nobody had yet made. The fracture began when someone tried to fill it permanently.",
  ],
];
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
export const NPC_TOPICS = {
  0: [
    [
      "The pilgrim lights",
      "Three stone braziers have gone cold. Wake them along the western graves, the eastern watch, and the old wall. The pilgrims used to leave a gift where all three lights could be seen.",
    ],
    [
      "The Bellkeeper",
      "Ilyen was a carpenter before he was a guardian. He made toys that rang because he thought every child deserved to make a little noise. Now he keeps the world quiet.",
    ],
    [
      "My awakening",
      "The fire did not choose you. Someone carried you here. I found wet footprints beside the ashes, though the sea is a world away.",
    ],
    [
      "The memorial",
      "East of the road. Look for the stone with the empty circle. Read the names before you draw your weapon.",
    ],
  ],
  1: [
    [
      "The song",
      "There used to be words. Mother forgot them first. Then she forgot what words were. I kept the tune because it was the only thing that still made her stop.",
    ],
    [
      "Crownfall",
      "A man in iron came with a ledger. He said grief was a debt the thrones could settle. I think he meant well. I think that is why it worked.",
    ],
  ],
  2: [
    [
      "Your signature",
      "The king had been dead for six days when the order came. We needed someone to blame. A dead king does not deny a signature.",
    ],
    [
      "The gates",
      "Open them, and the hollow will walk into the countryside. Seal them, and they will spend eternity knocking on doors that no longer have rooms behind them.",
    ],
  ],
};

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
