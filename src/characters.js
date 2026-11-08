import * as T from "three";
const mat = (color, metalness = 0.2) =>
  new T.MeshStandardMaterial({ color, metalness, roughness: 0.72 });
const PALETTES = {
  Knight: ["#7d8b8c", "#293b40", "#9d8b56"],
  Mercenary: ["#897559", "#493f32", "#b09b76"],
  Berserker: ["#7a6d60", "#45322d", "#bb8a5f"],
  Spellblade: ["#889ca9", "#34475b", "#aeb9c7"],
  Sorcerer: ["#607481", "#293d50", "#94bac6"],
  Assassin: ["#566261", "#252e30", "#8b9b8f"],
  Cleric: ["#acaa91", "#656448", "#d8c28a"],
  Wretch: ["#817b66", "#4b4335", "#a49370"],
};
export function createActor({
  className = "Knight",
  color,
  role = "hero",
  weapon = "Oathkeeper",
  bossIndex = 0,
  armour: equippedArmour,
} = {}) {
  const root = new T.Group(),
    body = new T.Group();
  root.add(body);
  const palette = PALETTES[className] || PALETTES.Knight;
  const armour = mat(
      color ||
        (equippedArmour === "Pilgrim’s Shroud" || className === "Wretch"
          ? palette[1]
          : palette[0]),
      0.65,
    ),
    cloth = mat(role === "enemy" ? "#5e3d39" : palette[1], 0),
    gold = mat(palette[2], 0.7),
    dark = mat("#232a2a"),
    skin = mat("#9d8e77", 0),
    soul = new T.MeshBasicMaterial({
      color: role === "enemy" ? "#df875e" : "#8ac9d5",
    });
  function mesh(parent, geo, material, x = 0, y = 0, z = 0) {
    const m = new T.Mesh(geo, material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function pivot(parent, x, y, z) {
    const g = new T.Group();
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  }
  mesh(body, new T.CylinderGeometry(0.34, 0.25, 0.66, 8), armour, 0, 1.28, 0);
  mesh(body, new T.BoxGeometry(0.5, 0.34, 0.16), armour, 0, 1.34, 0.19);
  mesh(
    body,
    new T.TorusGeometry(0.28, 0.055, 4, 8),
    gold,
    0,
    1.04,
    0,
  ).rotation.x = Math.PI / 2;
  mesh(body, new T.BoxGeometry(0.13, 0.13, 0.08), gold, 0, 1.04, 0.29);
  for (const side of [-1, 1]) {
    mesh(
      body,
      new T.BoxGeometry(0.18, 0.46, 0.06),
      cloth,
      side * 0.13,
      0.77,
      0.22,
    ).rotation.z = side * 0.08;
    mesh(
      body,
      new T.BoxGeometry(0.15, 0.08, 0.055),
      gold,
      side * 0.13,
      0.61,
      0.26,
    );
  }
  const head = pivot(body, 0, 1.85, 0),
    hood =
      ["Sorcerer", "Assassin", "Cleric"].includes(className) || role === "npc";
  mesh(head, new T.SphereGeometry(0.235, 8, 6), hood ? cloth : armour);
  if (hood) {
    mesh(head, new T.SphereGeometry(0.16, 7, 5), dark, 0, -0.025, 0.14);
    mesh(head, new T.BoxGeometry(0.22, 0.11, 0.04), skin, 0, -0.025, 0.235);
  } else {
    mesh(head, new T.BoxGeometry(0.34, 0.045, 0.05), dark, 0, 0.035, 0.215);
    mesh(head, new T.BoxGeometry(0.04, 0.26, 0.075), gold, 0, -0.02, 0.215);
    mesh(head, new T.BoxGeometry(0.08, 0.13, 0.34), cloth, 0, 0.22, -0.01);
  }
  const eyes = [];
  for (const side of [-1, 1])
    eyes.push(
      mesh(
        head,
        new T.BoxGeometry(0.055, 0.025, 0.025),
        soul,
        side * 0.08,
        0.04,
        0.244,
      ),
    );
  const legs = [],
    knees = [],
    arms = [],
    elbows = [];
  for (const side of [-1, 1]) {
    const hip = pivot(body, side * 0.17, 0.99, 0);
    legs.push(hip);
    mesh(hip, new T.CylinderGeometry(0.12, 0.105, 0.4, 6), dark, 0, -0.2, 0);
    mesh(hip, new T.BoxGeometry(0.19, 0.28, 0.17), armour, 0, -0.22, 0.055);
    const knee = pivot(hip, 0, -0.4, 0);
    knees.push(knee);
    mesh(knee, new T.SphereGeometry(0.14, 6, 4), gold, 0, 0, 0.04);
    mesh(
      knee,
      new T.CylinderGeometry(0.105, 0.08, 0.38, 6),
      armour,
      0,
      -0.19,
      0,
    );
    mesh(knee, new T.BoxGeometry(0.19, 0.14, 0.35), dark, 0, -0.41, 0.08);
    const shoulder = pivot(body, side * 0.4, 1.55, 0);
    arms.push(shoulder);
    mesh(shoulder, new T.SphereGeometry(0.19, 6, 4), armour);
    mesh(
      shoulder,
      new T.CylinderGeometry(0.105, 0.08, 0.32, 6),
      dark,
      0,
      -0.17,
      0,
    );
    const elbow = pivot(shoulder, 0, -0.32, 0);
    elbows.push(elbow);
    mesh(
      elbow,
      new T.CylinderGeometry(0.105, 0.07, 0.3, 6),
      armour,
      0,
      -0.15,
      0,
    );
    mesh(elbow, new T.SphereGeometry(0.085, 6, 4), dark, 0, -0.32, 0);
  }
  const hand = pivot(elbows[1], 0, -0.3, 0),
    sword = new T.Group();
  hand.add(sword);
  sword.rotation.x = -0.2;
  const isStaff = /Staff|Tidecaller/.test(weapon),
    isHeavy = /Grief|Sunbreaker|Club|Verdict|Lament|Mace/.test(weapon),
    isDagger = /Kiss|Fang/.test(weapon),
    isBow = /Bow|Gravebolt/.test(weapon);
  const bladeLength = isHeavy ? 1.35 : isDagger ? 0.55 : 1.05;
  if (isStaff) {
    mesh(sword, new T.CylinderGeometry(0.035, 0.045, 1.8, 6), gold, 0, 0.55, 0);
    mesh(sword, new T.OctahedronGeometry(0.18), soul, 0, 1.58, 0);
    mesh(sword, new T.TorusGeometry(0.23, 0.035, 4, 12), gold, 0, 1.58, 0);
  } else if (isBow) {
    const bow = mesh(
      sword,
      new T.TorusGeometry(0.55, 0.04, 4, 16, Math.PI),
      gold,
      0,
      0.5,
      0,
    );
    bow.rotation.z = -Math.PI / 2;
    mesh(
      sword,
      new T.CylinderGeometry(0.008, 0.008, 1.1, 3),
      cloth,
      0.0,
      0.5,
      0,
    );
  } else {
    mesh(
      sword,
      new T.BoxGeometry(isHeavy ? 0.17 : 0.075, bladeLength, 0.055),
      mat("#c0cbd0", 0.85),
      0,
      bladeLength * 0.5 + 0.12,
      0,
    );
    mesh(
      sword,
      new T.ConeGeometry(isHeavy ? 0.12 : 0.06, 0.22, 4),
      armour,
      0,
      bladeLength + 0.2,
      0,
    );
    mesh(sword, new T.BoxGeometry(0.35, 0.065, 0.09), gold, 0, 0.12, 0);
    mesh(sword, new T.CylinderGeometry(0.045, 0.045, 0.22, 6), dark, 0, 0, 0);
    if (/Mace|Club/.test(weapon))
      mesh(sword, new T.DodecahedronGeometry(0.22), gold, 0, bladeLength, 0);
  }
  const shield = pivot(elbows[0], 0, -0.22, 0.1);
  if (
    !["Sorcerer", "Assassin", "Mercenary", "Wretch"].includes(className) &&
    role !== "npc"
  ) {
    const s = mesh(
      shield,
      new T.CylinderGeometry(0.31, 0.31, 0.09, 8),
      armour,
      0,
      0,
      0.04,
    );
    s.rotation.x = Math.PI / 2;
    mesh(shield, new T.BoxGeometry(0.06, 0.45, 0.04), gold, 0, 0, 0.1);
    mesh(shield, new T.BoxGeometry(0.35, 0.06, 0.04), gold, 0, 0.05, 0.1);
  } else if (className === "Mercenary") {
    mesh(shield, new T.BoxGeometry(0.07, 0.65, 0.05), armour, 0, 0.25, 0);
  }
  const cape = pivot(body, 0, 1.6, -0.22);
  for (let i = 0; i < 5; i++) {
    const strip = mesh(
      cape,
      new T.BoxGeometry(0.14, 1.15, 0.035),
      cloth,
      (i - 2) * 0.145,
      -0.55,
      -0.1,
    );
    strip.rotation.x = -0.13;
    strip.userData.wave = i;
  }
  if (role === "npc") {
    mesh(
      elbows[0],
      new T.CylinderGeometry(0.04, 0.05, 1.6, 5),
      gold,
      0,
      -0.1,
      0.15,
    );
    mesh(
      elbows[0],
      new T.SphereGeometry(0.15, 6, 5),
      new T.MeshBasicMaterial({ color: "#f0c879" }),
      0,
      0.72,
      0.15,
    );
  }
  if (["Sorcerer", "Cleric"].includes(className)) {
    mesh(
      body,
      new T.CylinderGeometry(0.26, 0.49, 0.8, 8, 1, true),
      cloth,
      0,
      0.6,
      0,
    );
    mesh(body, new T.BoxGeometry(0.12, 0.7, 0.055), gold, 0, 1.27, 0.28);
  }
  if (className === "Berserker")
    for (const side of [-1, 1])
      mesh(
        arms[side === 1 ? 1 : 0],
        new T.ConeGeometry(0.11, 0.35, 4),
        gold,
        side * 0.12,
        0.2,
        0,
      );
  if (className === "Spellblade")
    mesh(head, new T.OctahedronGeometry(0.075), soul, 0, 0.12, 0.26);
  const ornaments = [];
  if (role === "npc") {
    if (bossIndex === 1) {
      root.scale.setScalar(0.7);
      for (const side of [-1, 1])
        mesh(
          head,
          new T.ConeGeometry(0.07, 0.65, 4),
          dark,
          side * 0.2,
          0.45,
          0,
        ).rotation.z = -side * 0.5;
    }
    if ([2, 11].includes(bossIndex)) {
      mesh(body, new T.BoxGeometry(0.13, 0.45, 0.04), gold, 0, 1.4, 0.3);
      cape.children.forEach((m) => m.material.color.set("#5f3733"));
    }
    if (bossIndex === 5) {
      const book = mesh(
        elbows[0],
        new T.BoxGeometry(0.32, 0.4, 0.1),
        gold,
        0,
        -0.3,
        0.14,
      );
      book.rotation.x = 0.6;
    }
    if (bossIndex === 6)
      mesh(body, new T.BoxGeometry(0.6, 0.65, 0.35), dark, 0, 1.1, -0.4);
    if (bossIndex === 8)
      for (let i = 0; i < 5; i++)
        mesh(
          head,
          new T.ConeGeometry(0.035, 0.22, 4),
          gold,
          (i - 2) * 0.09,
          0.25,
          0.07,
        );
    if (bossIndex === 12) {
      const halo = mesh(
        head,
        new T.TorusGeometry(0.4, 0.025, 4, 20),
        soul,
        0,
        0.12,
        -0.08,
      );
      ornaments.push(halo);
    }
  }
  if (role === "boss") {
    const archetype = [0, 1, 2, 4, 4, 4, 4, 4, 4, 3, 4, 2, 4][bossIndex] ?? 4;
    if (archetype === 0) {
      mesh(
        head,
        new T.CylinderGeometry(0.3, 0.42, 0.6, 8, 1, true),
        gold,
        0,
        0,
        0,
      );
      mesh(
        head,
        new T.TorusGeometry(0.42, 0.06, 5, 12),
        gold,
        0,
        -0.3,
        0,
      ).rotation.x = Math.PI / 2;
    }
    if (archetype === 1) {
      for (const side of [-1, 1])
        for (let j = 0; j < 3; j++) {
          const horn = mesh(
            head,
            new T.ConeGeometry(0.075, 0.75 + j * 0.2, 4),
            dark,
            side * (0.18 + j * 0.12),
            0.5,
            0,
          );
          horn.rotation.z = -side * (0.4 + j * 0.3);
        }
    }
    if (archetype === 2) {
      for (let j = 0; j < 7; j++) {
        const t = (j / 7) * Math.PI * 2;
        mesh(
          head,
          new T.ConeGeometry(0.05, 0.35, 4),
          gold,
          Math.cos(t) * 0.24,
          0.32,
          Math.sin(t) * 0.24,
        );
      }
    }
    if (archetype === 3) {
      for (const side of [-1, 1]) {
        const wing = pivot(body, side * 0.4, 1.65, -0.1);
        for (let j = 0; j < 7; j++) {
          const feather = mesh(
            wing,
            new T.BoxGeometry(0.13, 1.3 - j * 0.1, 0.08),
            armour,
            side * (0.2 + j * 0.16),
            -0.05 - j * 0.09,
            -0.05,
          );
          feather.rotation.z = -side * (0.5 + j * 0.12);
        }
        ornaments.push(wing);
      }
    }
    if (archetype === 4) {
      const halo = mesh(
        body,
        new T.TorusGeometry(0.65, 0.04, 4, 24),
        soul,
        0,
        2.1,
        -0.3,
      );
      ornaments.push(halo);
      for (const side of [-1, 1])
        mesh(
          arms[side === 1 ? 1 : 0],
          new T.ConeGeometry(0.17, 0.65, 5),
          gold,
          side * 0.15,
          0.2,
          0,
        );
    }
    // Regional silhouettes: grafted roots, winter crystals, ember spines,
    // glass petals, a drowned mantle, and the empty geometry of the Unmade.
    if ([1, 3, 8].includes(bossIndex))
      for (const side of [-1, 1])
        for (let j = 0; j < 3; j++) {
          const limb = pivot(body, side * 0.32, 1.2 - j * 0.22, -0.12);
          mesh(
            limb,
            new T.CylinderGeometry(0.06, 0.035, 0.9, 5),
            bossIndex === 8 ? soul : dark,
            side * 0.3,
            -0.18,
            0,
          ).rotation.z = side * 0.9;
          ornaments.push(limb);
        }
    if ([4, 6, 7, 12].includes(bossIndex))
      for (let j = 0; j < 7; j++) {
        const angle = (j / 7) * Math.PI * 2;
        const shard = mesh(
          body,
          new T.OctahedronGeometry(0.18),
          bossIndex === 6 ? gold : bossIndex === 12 ? soul : armour,
          Math.cos(angle) * 0.65,
          1.7 + Math.sin(angle) * 0.65,
          -0.25,
        );
        shard.scale.set(0.6, 2.5, 0.6);
        shard.rotation.z = -angle;
        ornaments.push(shard);
      }
    if (bossIndex === 5) {
      mesh(head, new T.BoxGeometry(0.46, 0.09, 0.09), cloth, 0, 0.04, 0.25);
      for (let i = 0; i < 3; i++) {
        const page = mesh(
          body,
          new T.BoxGeometry(0.3, 0.36, 0.04),
          gold,
          Math.cos(i * 2.1) * 0.9,
          1.5,
          Math.sin(i * 2.1) * 0.8,
        );
        ornaments.push(page);
      }
    }
    if (bossIndex === 8)
      mesh(
        body,
        new T.ConeGeometry(0.7, 1.8, 8, 1, true),
        cloth,
        0,
        0.9,
        -0.07,
      );
    if (bossIndex === 10) {
      armour.transparent = true;
      armour.opacity = 0.75;
      cloth.color.set("#222638");
    }
    root.scale.setScalar(bossIndex === 4 ? 2.5 : 1.9);
  }
  root.userData = {
    body,
    head,
    legs,
    knees,
    arms,
    elbows,
    sword,
    shield,
    cape,
    cloth: cape,
    ornaments,
    eyes,
    animation: { clip: "idle", time: 0, duration: 0 },
    weapon,
  };
  return root;
}
export function playClip(actor, clip, duration = 0.6) {
  actor.userData.animation = { clip, time: 0, duration };
}
export function animateActor(
  actor,
  dt,
  time,
  {
    moving = 0,
    sprint = false,
    guard = false,
    windup = false,
    stagger = false,
    dead = false,
  } = {},
) {
  const r = actor.userData;
  if (!r.body) return;
  const a = r.animation;
  a.time += dt;
  if (a.time > a.duration && a.duration) a.clip = "idle";
  const p = Math.min(1, a.duration ? a.time / a.duration : 0),
    swing = Math.sin(p * Math.PI),
    walk = time * (sprint ? 13 : 8),
    stride = moving * (sprint ? 0.8 : 0.52);
  r.body.position.y =
    Math.sin(time * 2) * 0.018 + Math.abs(Math.sin(walk)) * moving * 0.045;
  r.body.rotation.set(stagger ? -0.16 : 0, 0, 0);
  r.head.rotation.set(0, Math.sin(time * 0.7) * 0.055, 0);
  r.legs.forEach((leg, i) => {
    leg.rotation.x = Math.sin(walk + i * Math.PI) * stride;
    r.knees[i].rotation.x =
      Math.max(0, -Math.sin(walk + i * Math.PI)) * stride * 0.9;
  });
  r.arms.forEach((arm, i) => {
    arm.rotation.set(
      Math.sin(walk + (i + 1) * Math.PI) * stride * 0.45,
      0,
      (i ? 1 : -1) * 0.09,
    );
    r.elbows[i].rotation.x = -0.15;
  });
  r.cape.rotation.x = 0.15 + moving * 0.2 + Math.sin(time * 2.4) * 0.03;
  r.cape.children.forEach(
    (strip, i) =>
      (strip.rotation.x =
        -0.1 + Math.sin(time * 4 - i * 0.6) * (0.04 + moving * 0.1)),
  );
  if (guard) {
    r.arms[0].rotation.x = -1;
    r.elbows[0].rotation.x = -0.8;
    r.body.rotation.y = 0.2;
  }
  if (windup) {
    r.arms[1].rotation.x = -2.4;
    r.body.rotation.y = -0.5;
  }
  if (
    [
      "light",
      "heavy",
      "charged",
      "jump",
      "skill",
      "riposte",
      "backstab",
      "sprint",
    ].includes(a.clip)
  ) {
    r.arms[1].rotation.x = -2.6 + Math.min(1, p * 2) * 3.6;
    r.arms[1].rotation.z = -swing * 0.8;
    r.elbows[1].rotation.x = -0.4;
    r.body.rotation.y = Math.sin(p * Math.PI * 2) * 0.55;
    if (a.clip === "jump") r.body.position.y += swing * 0.8;
  }
  if (a.clip === "cast" || a.clip === "heal") {
    r.arms[0].rotation.x = -swing * 2;
    r.arms[1].rotation.x = -swing * 1.7;
    r.head.rotation.x = -swing * 0.2;
  }
  if (a.clip === "roll") {
    r.body.rotation.x = -p * Math.PI * 2;
    r.body.position.y += swing * 0.35;
    r.legs.forEach((l) => (l.rotation.x = -0.7));
    r.arms.forEach((l) => (l.rotation.x = -0.7));
  }
  if (a.clip === "parry") {
    r.arms[0].rotation.x = -1.6 * swing;
    r.body.rotation.y = -swing * 0.5;
  }
  if (a.clip === "hurt") r.body.rotation.z = Math.sin(p * Math.PI * 3) * 0.15;
  if (dead || a.clip === "death") {
    r.body.rotation.z = -Math.min(1, a.time / 1.2) * 1.4;
    r.body.position.y = -Math.min(1, a.time / 1.2) * 0.55;
  }
  r.ornaments.forEach((o, i) => {
    o.rotation.y = Math.sin(time + i) * 0.1;
    if (o.geometry?.type === "TorusGeometry") o.rotation.z = time * 0.25;
  });
}
export function disposeActor(actor) {
  actor.traverse((o) => {
    o.geometry?.dispose();
    if (o.material) o.material.dispose();
  });
}
