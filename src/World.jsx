import React, { useEffect, useRef } from "react";
import * as T from "three";
import { SoftwareRenderer } from "./SoftwareRenderer";
import { REGIONS, WEAPONS, DIFFICULTIES, SPELLS, ARMOURS } from "./data";
import { limits, damageFor, receiveDamage, deathState } from "./state";
const terrain = (x, z) => Math.sin(x * 0.12) * Math.cos(z * 0.1) * 0.45;
function skyTexture(region) {
  const c = document.createElement("canvas");
  c.width = 1600;
  c.height = 850;
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 0, 850);
  grad.addColorStop(0, "#252f32");
  grad.addColorStop(0.52, region.sky);
  grad.addColorStop(1, "#c1b99a");
  g.fillStyle = grad;
  g.fillRect(0, 0, 1600, 850);
  let seed = 33;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 110; i++) {
    const x = rnd() * 1600,
      y = rnd() * 550,
      r = 80 + rnd() * 260;
    let a = g.createRadialGradient(x, y, 0, x, y, r);
    a.addColorStop(0, `rgba(213,211,188,${rnd() * 0.09})`);
    a.addColorStop(1, "rgba(130,140,130,0)");
    g.fillStyle = a;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.fillStyle = "#d2c39b";
  g.beginPath();
  g.arc(1080, 255, 64, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#828573";
  g.beginPath();
  g.arc(1101, 235, 61, 0, Math.PI * 2);
  g.fill();
  for (let layer = 0; layer < 4; layer++) {
    g.fillStyle = ["#65736c", "#626f64", "#59695d", "#526354"][layer];
    g.beginPath();
    g.moveTo(0, 850);
    for (let x = 0; x <= 1600; x += 25)
      g.lineTo(
        x,
        650 +
          layer * 40 -
          Math.sin(x * 0.008 + layer) * 65 -
          Math.sin(x * 0.027 + layer * 12) * 28 -
          rnd() * 20,
      );
    g.lineTo(1600, 850);
    g.fill();
  }
  return new T.CanvasTexture(c);
}
function makeKnight(color = "#777e72", enemy = false) {
  const root = new T.Group();
  const iron = new T.MeshStandardMaterial({
    color,
    roughness: 0.65,
    metalness: 0.55,
  });
  const dark = new T.MeshStandardMaterial({ color: "#303830", roughness: 1 });
  const cape = new T.MeshStandardMaterial({
    color: enemy ? "#493b35" : "#5b4538",
    side: T.DoubleSide,
    roughness: 1,
  });
  function mesh(geo, mat, x, y, z) {
    const m = new T.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    root.add(m);
    return m;
  }
  mesh(new T.CylinderGeometry(0.34, 0.28, 0.65, 7), iron, 0, 1.24, 0);
  mesh(new T.SphereGeometry(0.24, 8, 7), iron, 0, 1.92, 0);
  mesh(new T.BoxGeometry(0.32, 0.06, 0.16), dark, 0, 1.96, 0.2);
  const plume = mesh(new T.BoxGeometry(0.08, 0.19, 0.35), cape, 0, 2.16, -0.04);
  const legs = [];
  for (const x of [-0.18, 0.18]) {
    legs.push(
      mesh(new T.CylinderGeometry(0.12, 0.09, 0.75, 6), dark, x, 0.5, 0),
    );
    mesh(new T.SphereGeometry(0.2, 7, 6), iron, x * 2, 1.49, 0);
  }
  const cloth = mesh(new T.PlaneGeometry(0.8, 1.4, 2, 3), cape, 0, 1.05, -0.3);
  cloth.rotation.x = 0.2;
  const sword = new T.Group();
  const blade = new T.Mesh(
    new T.BoxGeometry(0.09, 1.1, 0.055),
    new T.MeshStandardMaterial({
      color: "#c4c5af",
      metalness: 0.8,
      roughness: 0.25,
    }),
  );
  blade.position.y = 0.5;
  sword.add(blade);
  const guard = new T.Mesh(new T.BoxGeometry(0.36, 0.07, 0.1), iron);
  sword.add(guard);
  sword.position.set(0.48, 1, 0.1);
  sword.rotation.x = 0.7;
  root.add(sword);
  mesh(
    new T.CylinderGeometry(0.34, 0.34, 0.09, 10),
    iron,
    -0.47,
    1.2,
    0.13,
  ).rotation.x = Math.PI / 2;
  root.userData = { sword, legs, cloth, plume };
  return root;
}
export default function World({
  state,
  stateRef,
  active,
  paused,
  onChange,
  onEvent,
  onTarget,
  onInteract,
  actionRef,
  epoch,
  cinematic = false,
}) {
  const mount = useRef();
  const handlers = useRef({
    onChange,
    onEvent,
    onTarget,
    onInteract,
    paused,
    active,
  });
  handlers.current = {
    onChange,
    onEvent,
    onTarget,
    onInteract,
    paused,
    active,
  };
  useEffect(() => {
    const el = mount.current;
    let disposed = false;
    const region = REGIONS[state?.region || 0];
    const scene = new T.Scene();
    scene.background = skyTexture(region);
    scene.fog = new T.FogExp2(region.fog, 0.018);
    const probe = document.createElement("canvas");
    let hasGL = false;
    try {
      hasGL = !!probe.getContext("webgl2");
    } catch {}
    const renderer = hasGL
      ? new T.WebGLRenderer({
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        })
      : new SoftwareRenderer();
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    el.appendChild(renderer.domElement);
    const camera = new T.PerspectiveCamera(43, 1, 0.1, 160);
    camera.position.set(16, 9, 24);
    camera.lookAt(0, 3, -8);
    scene.add(new T.HemisphereLight("#d9dbc0", "#3b4031", 2));
    const sun = new T.DirectionalLight("#ffe2a0", 3);
    sun.position.set(-18, 30, -20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -35;
    sun.shadow.camera.right = 35;
    sun.shadow.camera.top = 35;
    sun.shadow.camera.bottom = -35;
    sun.shadow.normalBias = 0.06;
    scene.add(sun);
    let seed = 66 + (state?.region || 0) * 41;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const stone = new T.MeshStandardMaterial({
      color: "#666957",
      roughness: 1,
    });
    const pale = new T.MeshStandardMaterial({
      color: "#929482",
      roughness: 0.95,
    });
    const moss = new T.MeshStandardMaterial({
      color: region.color,
      roughness: 1,
    });
    const bark = new T.MeshStandardMaterial({ color: "#3c4034", roughness: 1 });
    function add(geo, mat, x, y, z, sx = 1, sy = 1, sz = 1) {
      const m = new T.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.scale.set(sx, sy, sz);
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
      return m;
    }
    const groundGeo = new T.PlaneGeometry(190, 190, 70, 70);
    groundGeo.rotateX(-Math.PI / 2);
    const a = groundGeo.attributes.position;
    for (let i = 0; i < a.count; i++)
      a.setY(i, terrain(a.getX(i), a.getZ(i)) - 0.15);
    groundGeo.computeVertexNormals();
    add(groundGeo, moss, 0, 0, 0).renderOrder = -10;
    // The pilgrim road: irregular slabs, ruined walls, and weathered masonry.
    for (let i = 0; i < 70; i++) {
      const z = 24 - i * 1.3,
        x = Math.sin(z * 0.09) * 2;
      for (let j = 0; j < 3; j++) {
        const xx = x + (j - 1) * 1.1;
        const slab = add(
          new T.BoxGeometry(1, 0.12, 1.05),
          rnd() > 0.5 ? stone : pale,
          xx,
          terrain(xx, z) - 0.1,
          z,
        );
        slab.rotation.y = rnd() * 0.12;
      }
    }
    const obstacles = [];
    function pillar(x, z, h = 7) {
      add(new T.BoxGeometry(1.5, 0.35, 1.7), stone, x, 0.1, z);
      add(new T.BoxGeometry(1, h, 1.2), stone, x, h / 2, z);
      for (let y = 1; y < h; y += 1.3)
        add(new T.BoxGeometry(1.06, 0.08, 1.26), pale, x, y, z);
      add(new T.BoxGeometry(1.6, 0.3, 1.8), pale, x, h, z);
      obstacles.push({ x, z, r: 0.8 });
    }
    function arch(x, z, h = 7, w = 5) {
      pillar(x - w / 2, z, h);
      pillar(x + w / 2, z, h);
      const arc = add(
        new T.TorusGeometry(w / 2, 0.52, 7, 28, Math.PI),
        stone,
        x,
        h,
        z,
      );
      arc.rotation.z = 0;
      for (let j = 0; j < 11; j++) {
        const t = (j * Math.PI) / 10;
        const v = add(
          new T.BoxGeometry(0.57, 0.75, 1.3),
          pale,
          x + (Math.cos(t) * w) / 2,
          h + (Math.sin(t) * w) / 2,
          z,
        );
        v.rotation.z = t - Math.PI / 2;
      }
    }
    arch(-0.8, -10, 6.6, 5.5);
    arch(-10, -19, 5, 4);
    pillar(8, -13, 5.3);
    pillar(8, -21, 7);
    for (let i = 0; i < 20; i++) {
      const z = -12 - i * 1.35;
      add(new T.BoxGeometry(1.4, 1 + rnd() * 2, 1.1), stone, 9, 1, z);
      add(new T.BoxGeometry(1.4, 0.5, 1.1), pale, -7, 0.25, z);
    }
    // A distant cathedral dominates the old kingdom.
    for (let i = 0; i < 5; i++) {
      let x = -16 + i * 6;
      const h = 15 + rnd() * 10;
      add(new T.CylinderGeometry(2.2, 2.8, h, 8), stone, x, h / 2, -53);
      add(new T.ConeGeometry(3, 8, 8), bark, x, h + 3.5, -53);
      for (let j = 0; j < 4; j++)
        add(
          new T.BoxGeometry(0.5, 1.2, 0.5),
          pale,
          x + Math.cos((j * Math.PI) / 2) * 2,
          h,
          -52 + Math.sin((j * Math.PI) / 2) * 2,
        );
    }
    add(new T.BoxGeometry(29, 13, 4), stone, -4, 5, -55);
    for (let i = 0; i < 12; i++)
      add(new T.BoxGeometry(0.7, 1.3, 1), pale, -18 + i * 2.5, 12, -52.5);
    for (let i = 0; i < 8; i++)
      add(new T.BoxGeometry(0.6, 3, 0.3), bark, -14 + i * 3.1, 8, -52.8);
    function branch(x, y, z, dx, dy, dz, r) {
      const start = new T.Vector3(x, y, z),
        end = new T.Vector3(x + dx, y + dy, z + dz),
        dir = end.clone().sub(start);
      const m = add(
        new T.CylinderGeometry(r * 0.3, r, dir.length(), 5),
        bark,
        ...start.clone().add(end).multiplyScalar(0.5).toArray(),
      );
      m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
    }
    for (let i = 0; i < 35; i++) {
      let x = (rnd() - 0.5) * 95,
        z = -55 + rnd() * 52;
      if (Math.abs(x) < 9) x += x > 0 ? 12 : -12;
      let h = 5 + rnd() * 9;
      branch(x, 0, z, 0.5, h, 0, 0.45);
      for (let j = 0; j < 5; j++) {
        let ang = rnd() * 6.28;
        let y = h * (0.4 + rnd() * 0.5);
        let dx = Math.cos(ang) * (2 + rnd() * 3),
          dz = Math.sin(ang) * 3;
        branch(x, y, z, dx, 2 + rnd() * 2, dz, 0.16);
        branch(x + dx, y + 2, z + dz, dx * 0.6, 2, dz * 0.5, 0.07);
      }
      if ([1, 3, 4].includes(state?.region))
        for (let j = 0; j < 3; j++)
          add(
            new T.IcosahedronGeometry(3, 1),
            new T.MeshStandardMaterial({
              color: state.region === 4 ? "#b8c7c7" : "#4b5840",
              roughness: 1,
            }),
            x + rnd() * 2,
            h - 2 + j,
            z,
            1,
            0.6,
            1,
          );
    }
    for (let i = 0; i < 110; i++) {
      let x = (rnd() - 0.5) * 85,
        z = (rnd() - 0.5) * 90;
      if (Math.abs(x) < 4) continue;
      const r = 0.2 + rnd() * 0.8;
      const rock = add(
        new T.DodecahedronGeometry(r, 0),
        rnd() > 0.5 ? stone : pale,
        x,
        terrain(x, z) + r * 0.3,
        z,
        1,
        0.6 + rnd(),
        1,
      );
      rock.rotation.set(rnd(), rnd(), rnd());
      if (i % 7 === 0) {
        add(new T.BoxGeometry(0.65, 1.3, 0.22), pale, x, 0.65, z);
        add(new T.BoxGeometry(1.2, 0.24, 0.25), pale, x, 1, z);
      }
    }
    const grassGeo = new T.ConeGeometry(0.12, 0.7, 3);
    grassGeo.translate(0, 0.3, 0);
    const grass = new T.InstancedMesh(
      grassGeo,
      new T.MeshStandardMaterial({
        color: state?.region === 4 ? "#bdc5b0" : "#5f6546",
        side: T.DoubleSide,
      }),
      2200,
    );
    const dummy = new T.Object3D();
    for (let i = 0; i < 2200; i++) {
      const x = (rnd() - 0.5) * 100,
        z = (rnd() - 0.5) * 100;
      dummy.position.set(x, terrain(x, z), z);
      dummy.rotation.y = rnd() * 6.3;
      dummy.scale.setScalar(
        Math.abs(x - Math.sin(z * 0.09) * 2) < 2 ? 0.04 : 0.4 + rnd(),
      );
      dummy.updateMatrix();
      grass.setMatrixAt(i, dummy.matrix);
    }
    scene.add(grass);
    // Sanctuary fire, floating cinders and a sword driven into the ash.
    const firePos = new T.Vector3(-3.5, 0, 6);
    for (let i = 0; i < 9; i++) {
      let t = (i * 6.28) / 9;
      add(
        new T.DodecahedronGeometry(0.35),
        stone,
        firePos.x + Math.cos(t) * 0.8,
        0.2,
        firePos.z + Math.sin(t) * 0.8,
        1,
        0.6,
        1,
      );
    }
    const flameMat = new T.MeshBasicMaterial({
      color: "#ffb750",
      transparent: true,
      opacity: 0.85,
    });
    const flame = add(
      new T.ConeGeometry(0.38, 1.4, 7),
      flameMat,
      firePos.x,
      0.9,
      firePos.z,
    );
    const fireLight = new T.PointLight("#ff9a31", 16, 13, 1.5);
    fireLight.position.set(firePos.x, 1.5, firePos.z);
    scene.add(fireLight);
    add(new T.BoxGeometry(0.09, 2, 0.06), pale, firePos.x, 0.9, firePos.z);
    add(new T.BoxGeometry(0.6, 0.1, 0.12), stone, firePos.x, 1.7, firePos.z);
    const moteGeo = new T.BufferGeometry();
    const motes = new Float32Array(240 * 3);
    for (let i = 0; i < 240; i++) {
      motes[i * 3] = (rnd() - 0.5) * 60;
      motes[i * 3 + 1] = rnd() * 17;
      motes[i * 3 + 2] = (rnd() - 0.5) * 60;
    }
    moteGeo.setAttribute("position", new T.BufferAttribute(motes, 3));
    const particles = new T.Points(
      moteGeo,
      new T.PointsMaterial({
        size: 0.055,
        color: "#edcd87",
        transparent: true,
        opacity: 0.65,
      }),
    );
    scene.add(particles);
    const hero = makeKnight(
      state?.appearance === "Ember"
        ? "#9d7961"
        : state?.appearance === "Frost"
          ? "#8b9ba6"
          : "#8b8e7b",
    );
    hero.position.set(state?.position?.x || 0, 0, state?.position?.z || 9);
    scene.add(hero);
    const npc = makeKnight("#a49b76");
    npc.position.set(-6, 0, 2);
    scene.add(npc);
    npc.rotation.y = 1;
    const bossDead = state?.bosses?.includes(state.region);
    const enemies = [];
    const enemyPositions = [
      [-3, -15],
      [5, -22],
      [-6, -28],
      [1, -37],
    ];
    enemyPositions.forEach(([x, z], i) => {
      if (i === 3 && bossDead) return;
      const boss = i === 3;
      const mesh = makeKnight(boss ? "#5c5550" : "#6d7566", true);
      if (boss) mesh.scale.setScalar(1.7);
      mesh.position.set(x, 0, z);
      scene.add(mesh);
      const health =
        (boss
          ? 280 + (state?.region || 0) * 75
          : 80 + (state?.region || 0) * 22) *
        DIFFICULTIES[state?.difficulty || "Normal"].health;
      const ring = add(
        new T.RingGeometry(boss ? 2.8 : 1.5, boss ? 3 : 1.65, 40),
        new T.MeshBasicMaterial({
          color: "#d14931",
          side: T.DoubleSide,
          transparent: true,
          opacity: 0,
        }),
        x,
        0.09,
        z,
      );
      ring.rotation.x = -Math.PI / 2;
      enemies.push({
        mesh,
        x,
        z,
        homeX: x,
        homeZ: z,
        hp: health,
        max: health,
        boss,
        name: boss
          ? region.boss
          : ["Ashen Wanderer", "Grave Warden", "Hollow Sentinel"][i],
        phase: 1,
        personality: boss
          ? "boss"
          : i === 1
            ? "caster"
            : i === 2
              ? "sentinel"
              : "hunter",
        aim: null,
        introduced: false,
        mode: "idle",
        timer: 1 + i * 0.3,
        ring,
        stagger: 0,
        repeats: 0,
      });
    });

    const rid = state?.region || 0;
    const waterMat = new T.MeshStandardMaterial({
      color: rid === 6 ? "#a54825" : "#334c50",
      roughness: 0.3,
      metalness: 0.3,
      transparent: true,
      opacity: 0.88,
    });
    if ([3, 6, 8].includes(rid)) {
      for (const side of [-1, 1]) {
        const pool = add(
          new T.PlaneGeometry(22, 80, 1, 1),
          waterMat,
          side * 25,
          -0.05,
          -13,
        );
        pool.rotation.x = -Math.PI / 2;
        pool.renderOrder = -9;
      }
      for (let i = 0; i < 12; i++) {
        const x = (i % 2 ? 1 : -1) * (17 + rnd() * 12),
          z = -40 + rnd() * 60;
        add(new T.CylinderGeometry(0.15, 0.3, 2, 5), bark, x, 0.9, z);
        if (rid === 8)
          add(
            new T.SphereGeometry(0.45, 7, 6),
            new T.MeshBasicMaterial({ color: "#76a6a2" }),
            x,
            2,
            z,
          );
      }
    }
    if ([4, 7].includes(rid)) {
      for (let i = 0; i < 12; i++) {
        const x = (i % 2 ? 1 : -1) * (15 + rnd() * 35),
          z = -35 - rnd() * 30;
        add(
          new T.ConeGeometry(6 + rnd() * 6, 10 + rnd() * 16, 4),
          new T.MeshStandardMaterial({
            color: rid === 4 ? "#b6bdb0" : "#b19b70",
            roughness: 1,
          }),
          x,
          5,
          z,
        );
      }
    }
    if ([5, 10, 12].includes(rid)) {
      const crystalMat = new T.MeshStandardMaterial({
        color: rid === 5 ? "#7bafaa" : rid === 10 ? "#9983b2" : "#c1b278",
        metalness: 0.5,
        roughness: 0.3,
      });
      for (let i = 0; i < 25; i++) {
        const x = (i % 2 ? 1 : -1) * (9 + rnd() * 20),
          z = -40 + rnd() * 55,
          h = 1 + rnd() * 5;
        const crystal = add(
          new T.OctahedronGeometry(1),
          crystalMat,
          x,
          h * 0.7,
          z,
          0.7,
          h,
          0.7,
        );
        crystal.rotation.z = (rnd() - 0.5) * 0.7;
      }
    }
    if ([2, 9, 11, 12].includes(rid)) {
      for (let i = 0; i < 6; i++) {
        const z = -4 - i * 6;
        pillar(-12, z, 8);
        pillar(12, z, 8);
      }
      if (rid === 2 || rid === 11) {
        for (let i = 0; i < 8; i++) {
          const x = i % 2 ? -21 : 21,
            z = -6 - Math.floor(i / 2) * 12;
          add(new T.BoxGeometry(5, 5, 7), stone, x, 2.5, z);
          const roof = add(new T.ConeGeometry(4.5, 3, 4), bark, x, 6.3, z);
          roof.rotation.y = Math.PI / 4;
          add(
            new T.BoxGeometry(0.8, 1.2, 0.15),
            new T.MeshBasicMaterial({ color: "#a58c51" }),
            x,
            3,
            z + 3.6,
          );
        }
      }
    }
    // A lost soul leaves a visible light at the exact place of death.
    let lostSoul = null;
    if (state?.dropped && state.dropped.region === state.region) {
      lostSoul = add(
        new T.OctahedronGeometry(0.35),
        new T.MeshBasicMaterial({ color: "#b9d4a0" }),
        state.dropped.x,
        0.9,
        state.dropped.z,
      );
    }
    const loot = [];
    for (let i = 0; i < 4; i++) {
      const x = [7, -11, 12, -10][i],
        z = [4, -7, -20, -35][i];
      const m = add(
        new T.OctahedronGeometry(0.22),
        new T.MeshBasicMaterial({ color: i === 3 ? "#bda0de" : "#ddc17c" }),
        x,
        0.8,
        z,
      );
      const light = new T.PointLight("#ddbc72", 2, 3);
      light.position.copy(m.position);
      scene.add(light);
      loot.push({
        mesh: m,
        light,
        x,
        z,
        id: `${state?.region || 0}-${i}`,
        secret: i === 3,
      });
      if (state?.secret?.includes(loot[i].id)) {
        m.visible = false;
        light.visible = false;
      }
    }
    const clock = new T.Clock();
    const keys = {};
    const input = { x: 0, z: 0 };
    let cooldown = 0,
      invulnerable = 0,
      parry = 0,
      attackTime = 0,
      guard = false,
      dodge = null,
      locked = false,
      elapsed = 0,
      lastHud = 0,
      lastTime = 0,
      deathTimer = 0,
      holding = 0;
    const effects = [];
    let repeated = "";
    let repeatCount = 0;
    let lastInteract = "";
    const patch = (change) => {
      if (!stateRef.current) return;
      stateRef.current = { ...stateRef.current, ...change };
      handlers.current.onChange(stateRef.current);
    };
    const event = (text, type = "info") => handlers.current.onEvent(text, type);
    const nearest = () =>
      enemies
        .filter((e) => e.hp > 0)
        .sort(
          (a, b) =>
            hero.position.distanceTo(a.mesh.position) -
            hero.position.distanceTo(b.mesh.position),
        )[0];
    function burst(pos, color = "#f2c97b", size = 1) {
      const mesh = new T.Mesh(
        new T.RingGeometry(0.3, 0.5, 24),
        new T.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 1,
          side: T.DoubleSide,
        }),
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.copy(pos);
      mesh.position.y = 0.3;
      scene.add(mesh);
      effects.push({ mesh, life: 0.5, size });
    }
    function strike(kind) {
      const s = stateRef.current;
      if (!s || cooldown > 0 || deathTimer > 0) return;
      const w = WEAPONS.find((x) => x.name === s.weapon) || WEAPONS[0];
      const load =
        (ARMOURS.find((a) => a.name === s.armour)?.weight || 0) > 20 ? 1.15 : 1;
      const cost = Math.round(
        w.stamina *
          load *
          ({
            heavy: 1.7,
            charged: 2,
            skill: 2,
            jump: 1.4,
            backstab: 1.3,
            riposte: 1.5,
          }[kind] || 1),
      );
      if (s.stamina < cost) {
        event("Your stamina is spent. Create some distance.");
        return;
      }
      if (kind === "skill" && s.focus < 12) {
        event("Not enough focus.");
        return;
      }
      patch({
        stamina: s.stamina - cost,
        ...(kind === "skill" ? { focus: s.focus - 12 } : {}),
      });
      cooldown =
        (kind === "heavy" || kind === "charged" ? 0.85 : 0.47) *
        (1 - Math.min(0.18, s.attrs.Dexterity * 0.004));
      attackTime = cooldown;
      lastTime = elapsed;
      burst(hero.position, "#dec491", w.reach);
      const target = nearest();
      if (!target) return;
      const dist = hero.position.distanceTo(target.mesh.position);
      if (locked)
        hero.rotation.y = Math.atan2(
          target.mesh.position.x - hero.position.x,
          target.mesh.position.z - hero.position.z,
        );
      if (kind === "light" && keys.shift) kind = "sprint";
      if (kind === repeated) repeatCount++;
      else {
        repeatCount = 0;
        repeated = kind;
      }
      const isBack =
        Math.cos(hero.rotation.y - target.mesh.rotation.y) > 0.65 && dist < 2.5;
      const actual =
        target.stagger > 0 ? "riposte" : isBack ? "backstab" : kind;
      const range = w.reach + (target.boss ? 1.2 : 0.4);
      const delay = kind === "heavy" || kind === "charged" ? 220 : 120;
      setTimeout(() => {
        if (disposed || target.hp <= 0 || handlers.current.paused) return;
        if (hero.position.distanceTo(target.mesh.position) > range) {
          event("Your blade finds only ash.");
          return;
        }
        let dmg = damageFor(stateRef.current, actual);
        if (
          target.mode === "guard" &&
          actual !== "heavy" &&
          actual !== "charged"
        )
          dmg = Math.round(dmg * 0.3);
        if (repeatCount > 3 && target.boss) {
          dmg = Math.round(dmg * 0.5);
          target.timer = 0.1;
          event("The enemy has learned your rhythm.");
        }
        target.hp = Math.max(0, target.hp - dmg);
        burst(target.mesh.position, "#df8b60", 1.4);
        if (["heavy", "charged", "riposte"].includes(actual)) {
          target.stagger = 1.4;
          target.mode = "staggered";
        }
        event(
          `${actual === "riposte" ? "Critical riposte" : actual === "backstab" ? "Backstab" : "Strike"} · ${dmg} damage`,
          "combat",
        );
        if (target.hp === 0) kill(target);
      }, delay);
    }
    function kill(e) {
      e.mesh.visible = false;
      e.ring.visible = false;
      const s = stateRef.current;
      const reward = e.boss ? 450 + s.region * 100 : 40 + s.region * 15;
      const update = {
        essence: s.essence + reward,
        materials: s.materials + (e.boss ? 3 : 1),
      };
      if (e.boss) {
        update.bosses = [...s.bosses, s.region];
        update.shards = Math.min(7, s.shards + 1);
        const item = region.reward;
        update.inventory = [...new Set([...s.inventory, item])];
        update.spells = [
          ...new Set([...s.spells, SPELLS[Math.min(s.region + 1, 9)].name]),
        ];
        event(
          `${region.boss} has fallen. A Soul Shard answers. +${reward} essence`,
          "victory",
        );
      } else event(`Enemy felled · +${reward} Soul Essence`, "reward");
      patch(update);
    }
    function action(name) {
      if (!handlers.current.active || handlers.current.paused) return;
      const s = stateRef.current;
      if (!s || deathTimer > 0) return;
      const max = limits(s);
      if (["light", "heavy", "charged", "skill", "jump"].includes(name)) {
        strike(name);
        return;
      }
      if (name === "block-on") {
        guard = true;
        return;
      }
      if (name === "block-off") {
        guard = false;
        return;
      }
      if (name === "lock") {
        locked = !locked;
        event(locked ? "Target locked." : "Target released.");
        return;
      }
      if (name === "dodge" || name === "backstep") {
        if (cooldown > 0 || s.stamina < 22) return;
        const weight = ARMOURS.find((a) => a.name === s.armour)?.weight || 0;
        patch({ stamina: s.stamina - 22 });
        invulnerable = weight > 20 ? 0.3 : 0.46;
        cooldown = 0.6;
        lastTime = elapsed;
        const len = Math.hypot(input.x, input.z);
        dodge = {
          x: len ? input.x / len : -Math.sin(hero.rotation.y),
          z: len ? input.z / len : -Math.cos(hero.rotation.y),
          time: 0.27,
        };
        return;
      }
      if (name === "parry") {
        if (s.stamina < 18 || cooldown > 0) return;
        patch({ stamina: s.stamina - 18 });
        parry = 0.3;
        cooldown = 0.55;
        lastTime = elapsed;
        burst(hero.position, "#d9e7f4", 2);
        return;
      }
      if (name === "heal") {
        if (!s.flasks) {
          event("Your flask is empty. Rest at a sanctuary.");
          return;
        }
        if (s.hp >= max.hp) {
          event("Your vitality is already full.");
          return;
        }
        patch({
          hp: Math.min(max.hp, s.hp + Math.round(max.hp * 0.55)),
          flasks: s.flasks - 1,
        });
        burst(hero.position, "#e8b755", 2);
        event("Cinder flask · vitality restored.");
        return;
      }
      if (name === "magic") {
        const spell = SPELLS.find((x) => x.name === s.spell) || SPELLS[0];
        if (cooldown > 0 || s.focus < spell.cost) {
          event("Not enough focus, or still recovering.");
          return;
        }
        patch({ focus: s.focus - spell.cost });
        cooldown = 0.9;
        burst(hero.position, "#a1cbd5", 4);
        if (spell.name === "Sacred mending") {
          patch({ hp: Math.min(max.hp, s.hp + 80 + s.attrs.Faith * 3) });
          return;
        }
        const e = nearest();
        if (e && hero.position.distanceTo(e.mesh.position) < 17) {
          e.hp = Math.max(
            0,
            e.hp -
              Math.round(
                (spell.damage + s.attrs[spell.scaling] * 2) *
                  (s.region === 1 && spell.type === "Pyromancy" ? 1.4 : 1),
              ),
          );
          e.stagger = spell.type === "Time" ? 3 : 0.5;
          burst(e.mesh.position, "#a1cbd5", 3);
          event(`${spell.name} strikes ${e.name}.`, "combat");
          if (e.hp === 0) kill(e);
        } else event("The spell dissolves beyond its range.");
        return;
      }
      if (name === "interact") {
        const near = getInteraction();
        if (near.kind === "loot") {
          const l = near.loot;
          if (!s.secret.includes(l.id)) {
            patch({
              secret: [...s.secret, l.id],
              materials: s.materials + (l.secret ? 4 : 1),
              essence: s.essence + (l.secret ? 100 : 30),
            });
            l.mesh.visible = false;
            l.light.visible = false;
            event(
              l.secret
                ? "A hidden cache. The inscription reads: “Creation was not the seventh.”"
                : "Found a soul remnant and a smithing ember.",
              "reward",
            );
          }
        } else if (near.kind === "recover") {
          patch({ essence: s.essence + s.dropped.amount, dropped: null });
          event("Lost essence reclaimed.", "reward");
        } else if (near.kind !== "none") handlers.current.onInteract(near.kind);
      }
    }
    function getInteraction() {
      const s = stateRef.current;
      if (
        s?.dropped?.region === s.region &&
        Math.hypot(
          hero.position.x - s.dropped.x,
          hero.position.z - s.dropped.z,
        ) < 3
      )
        return { kind: "recover", text: "Reclaim lost essence" };
      for (const l of loot)
        if (
          l.mesh.visible &&
          Math.hypot(hero.position.x - l.x, hero.position.z - l.z) < 2.8
        )
          return {
            kind: "loot",
            text: l.secret ? "Search the hidden cache" : "Gather soul remnant",
            loot: l,
          };
      if (hero.position.distanceTo(firePos) < 4)
        return { kind: "sanctuary", text: "Rest at the sanctuary" };
      if (hero.position.distanceTo(npc.position) < 3.5)
        return { kind: "npc", text: `Speak to ${region.npc}` };
      if (hero.position.z < -43)
        return { kind: "travel", text: "Follow the road · Open realm map" };
      return { kind: "none", text: "Explore the old pilgrim road" };
    }
    actionRef.current = {
      action,
      move: (x, z) => {
        input.x = x;
        input.z = z;
      },
    };
    const down = (e) => {
      if (!handlers.current.active || handlers.current.paused) return;
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)
      )
        return;
      const k = e.key.toLowerCase();
      if (
        [
          " ",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
          "tab",
        ].includes(k)
      )
        e.preventDefault();
      keys[k] = true;
      if (e.repeat) return;
      const binds = {
        " ": "dodge",
        j: "light",
        k: "heavy",
        q: "heal",
        e: "interact",
        r: "magic",
        f: "parry",
        c: "skill",
        tab: "lock",
        b: "block-on",
        v: "backstep",
        x: "jump",
      };
      if (k === "j") holding = elapsed;
      if (binds[k]) action(binds[k]);
    };
    const up = (e) => {
      const k = e.key.toLowerCase();
      keys[k] = false;
      if (k === "b") guard = false;
      if (k === "j" && elapsed - holding > 0.6) action("charged");
    };
    const blur = () => {
      Object.keys(keys).forEach((k) => (keys[k] = false));
      input.x = 0;
      input.z = 0;
      guard = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    const resize = () => {
      const w = el.clientWidth,
        h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    let frame;
    let lastDraw = -1;
    function animate() {
      frame = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;
      flame.scale.set(
        0.8 + Math.sin(elapsed * 14) * 0.15,
        1 + Math.sin(elapsed * 11) * 0.2,
        0.8,
      );
      fireLight.intensity = 15 + Math.sin(elapsed * 15) * 3;
      for (let i = 0; i < 240; i++) {
        motes[i * 3 + 1] += dt * 0.3;
        if (motes[i * 3 + 1] > 18) motes[i * 3 + 1] = 0;
        motes[i * 3] += Math.sin(elapsed + i) * dt * 0.08;
      }
      moteGeo.attributes.position.needsUpdate = true;
      loot.forEach((l) => {
        l.mesh.rotation.y += dt;
        l.mesh.position.y = 0.8 + Math.sin(elapsed * 2 + l.x) * 0.15;
      });
      for (let i = effects.length - 1; i >= 0; i--) {
        const fx = effects[i];
        fx.life -= dt;
        fx.mesh.scale.setScalar(1 + (1 - fx.life * 2) * fx.size);
        fx.mesh.material.opacity = fx.life * 2;
        if (fx.life <= 0) {
          scene.remove(fx.mesh);
          fx.mesh.geometry.dispose();
          fx.mesh.material.dispose();
          effects.splice(i, 1);
        }
      }
      const s = stateRef.current;
      const h = handlers.current;
      if (h.paused) blur();
      if (lostSoul) {
        lostSoul.visible = !!s?.dropped;
        lostSoul.rotation.y += dt;
      }
      if (h.active && !h.paused && s) {
        if (deathTimer > 0) {
          deathTimer -= dt;
          if (deathTimer <= 0) {
            patch(deathState(s, { x: hero.position.x, z: hero.position.z }));
            h.onInteract("respawn");
          }
          renderer.render(scene, camera);
          return;
        }
        cooldown = Math.max(0, cooldown - dt);
        invulnerable = Math.max(0, invulnerable - dt);
        parry = Math.max(0, parry - dt);
        attackTime = Math.max(0, attackTime - dt);
        let mx =
            (keys.d || keys.arrowright ? 1 : 0) -
            (keys.a || keys.arrowleft ? 1 : 0) +
            input.x,
          mz =
            (keys.s || keys.arrowdown ? 1 : 0) -
            (keys.w || keys.arrowup ? 1 : 0) +
            input.z;
        const len = Math.hypot(mx, mz);
        if (len > 0) {
          mx /= len;
          mz /= len;
        }
        if (dodge) {
          mx = dodge.x;
          mz = dodge.z;
          dodge.time -= dt;
          if (dodge.time <= 0) dodge = null;
        }
        const sprint = keys.shift && s.stamina > 3 && len > 0;
        const speed = dodge ? 15 : sprint ? 7 : 4;
        let nx = hero.position.x + mx * speed * dt,
          nz = hero.position.z + mz * speed * dt;
        if (
          !obstacles.some((o) => Math.hypot(nx - o.x, nz - o.z) < o.r + 0.4)
        ) {
          hero.position.x = T.MathUtils.clamp(nx, -27, 27);
          hero.position.z = T.MathUtils.clamp(nz, -48, 22);
        }
        hero.position.y = terrain(hero.position.x, hero.position.z);
        if (len > 0 || dodge) {
          if (!locked) hero.rotation.y = Math.atan2(mx, mz);
          hero.userData.legs.forEach(
            (leg, i) =>
              (leg.rotation.x = Math.sin(elapsed * 11 + i * Math.PI) * 0.4),
          );
        } else hero.userData.legs.forEach((l) => (l.rotation.x = 0));
        hero.userData.sword.rotation.z =
          attackTime > 0 ? Math.sin(attackTime * 8) * 1.4 : guard ? -1 : 0;
        hero.rotation.z = dodge
          ? Math.sin((dodge.time / 0.27) * Math.PI) * 0.7
          : 0;
        const max = limits(s);
        let stamina = s.stamina;
        if (sprint) {
          stamina = Math.max(0, stamina - dt * 15);
          lastTime = elapsed;
        } else if (elapsed - lastTime > 0.65)
          stamina = Math.min(
            max.stamina,
            stamina + dt * (s.region === 4 ? 15 : 26) * (guard ? 0.35 : 1),
          );
        let hp = s.hp;
        let focus = s.focus;
        for (const e of enemies) {
          if (e.hp <= 0) continue;
          const dist = e.mesh.position.distanceTo(hero.position);
          e.stagger = Math.max(0, e.stagger - dt);
          e.ring.position.set(
            e.mesh.position.x,
            hero.position.y + 0.08,
            e.mesh.position.z,
          );
          if (e.personality === "caster" && e.mode === "windup" && e.aim) {
            e.ring.position.copy(e.aim);
            e.ring.position.y += 0.1;
          }
          if (e.mode === "recovery" && e.timer > 0) {
            e.timer -= dt;
            continue;
          }
          if (e.mode === "recovery" && e.timer <= 0) {
            e.mode = "idle";
            if (e.boss && e.phase === 3) {
              e.mesh.position.x += Math.sin(elapsed) * 3;
              burst(e.mesh.position, "#a999c2", 3);
            }
          }
          if (e.stagger > 0) {
            e.ring.material.opacity = 0;
            continue;
          }
          if (e.boss && dist < 23 && !e.introduced) {
            e.introduced = true;
            event(`${e.name} stirs. The old road falls silent.`, "combat");
          }
          const desiredRange = e.personality === "caster" ? 10 : 2.3;
          if (
            e.personality === "sentinel" &&
            e.mode !== "windup" &&
            e.mode !== "recovery" &&
            dist < 4 &&
            e.timer > 0.2
          )
            e.mode = "guard";
          if (
            e.hp < e.max * 0.2 &&
            !e.boss &&
            e.mode !== "windup" &&
            dist < 4
          ) {
            const retreat = e.mesh.position
              .clone()
              .sub(hero.position)
              .normalize();
            e.mesh.position.addScaledVector(retreat, dt * 1.6);
          }
          if (
            dist < 22 &&
            dist > desiredRange &&
            e.mode !== "windup" &&
            e.mode !== "recovery"
          ) {
            e.mode = "chasing";
            const dir = hero.position.clone().sub(e.mesh.position).normalize();
            const sp = e.boss ? (e.hp < e.max * 0.4 ? 3.4 : 2.3) : 1.8;
            e.mesh.position.addScaledVector(dir, dt * sp);
          }
          e.mesh.position.y = terrain(e.mesh.position.x, e.mesh.position.z);
          e.mesh.rotation.y = Math.atan2(
            hero.position.x - e.mesh.position.x,
            hero.position.z - e.mesh.position.z,
          );
          e.timer -= dt;
          if (e.mode === "windup") {
            e.ring.material.opacity = 0.25 + Math.sin(elapsed * 15) * 0.12;
            if (e.timer <= 0) {
              const radius =
                e.boss && e.phase >= 2
                  ? 5
                  : e.personality === "caster"
                    ? 2
                    : 3.3;
              const hit =
                (e.personality === "caster" && e.aim
                  ? e.aim
                  : e.mesh.position
                ).distanceTo(hero.position) < radius;
              if (hit && invulnerable <= 0) {
                if (parry > 0) {
                  e.stagger = 2.8;
                  e.mode = "staggered";
                  event("PARRY · The enemy is open to a riposte.", "reward");
                } else {
                  const raw = (e.boss ? 45 : 19) + s.region * 3;
                  const dmg = receiveDamage(
                    s,
                    raw * DIFFICULTIES[s.difficulty].damage,
                    guard && stamina > 0,
                  );
                  hp = Math.max(0, hp - dmg);
                  if (guard) {
                    stamina = Math.max(0, stamina - 23);
                    if (stamina === 0) {
                      cooldown = 1.1;
                      event("Your guard breaks.");
                    }
                  }
                  burst(hero.position, "#bb6652", 1);
                }
              }
              e.mode = "recovery";
              e.timer = e.boss ? 0.9 : 1.3;
              e.ring.material.opacity = 0;
            }
          } else if (
            dist < (e.boss ? 5 : e.personality === "caster" ? 17 : 3.3) &&
            e.timer <= 0
          ) {
            e.mode = "windup";
            e.timer = e.boss ? 0.9 : e.personality === "caster" ? 1.2 : 0.8;
            if (e.personality === "caster") {
              e.aim = hero.position.clone();
              e.ring.position.copy(e.aim);
              e.ring.position.y += 0.1;
              event("A soul sigil forms beneath your feet.", "combat");
            }
            if (e.boss) {
              const phase =
                e.hp < e.max * 0.35 ? 3 : e.hp < e.max * 0.65 ? 2 : 1;
              if (phase !== e.phase) {
                e.phase = phase;
                event(
                  `${e.name} · Phase ${phase}. The ground begins to fracture.`,
                  "combat",
                );
              }
              e.ring.scale.setScalar(e.phase >= 2 ? 1.6 : 1);
            }
          }
          if (locked && e === nearest())
            hero.rotation.y = Math.atan2(
              e.mesh.position.x - hero.position.x,
              e.mesh.position.z - hero.position.z,
            );
        }
        if (s.region === 3 && Math.abs(hero.position.x) > 18)
          hp = Math.max(0, hp - dt * 3);
        if (s.region === 6 && hero.position.x > 20)
          hp = Math.max(0, hp - dt * 8);
        if (s.region === 11) focus = Math.max(0, focus - dt * 0.4);
        if (hp <= 0 && deathTimer === 0) {
          deathTimer = 2.3;
          event("YOU DIED · The sanctuary calls you home.", "death");
        }
        const nextTime = (s.time + dt * 0.12) % 24;
        const night = nextTime >= 18 || nextTime < 6;
        sun.intensity = night ? 0.9 : 3;
        scene.userData.lightFactor = night ? 0.65 : 1;
        if (nextTime < s.time) {
          stateRef.current = {
            ...stateRef.current,
            worldDay: s.worldDay + 1,
            events: [
              ...s.events.slice(-15),
              s.worldDay % 2
                ? "The Crownfall militia has withdrawn to the inner walls."
                : "A caravan has vanished beneath the Hollowwood.",
            ],
          };
        }
        stateRef.current = {
          ...stateRef.current,
          hp,
          stamina,
          focus,
          time: (s.time + dt * 0.12) % 24,
        };
        if (elapsed - lastHud > 0.12) {
          lastHud = elapsed;
          patch({
            hp,
            stamina,
            focus,
            position: { x: hero.position.x, z: hero.position.z },
            time: stateRef.current.time,
          });
          const near = getInteraction();
          if (near.text !== lastInteract) {
            lastInteract = near.text;
            h.onTarget({ interaction: near.text });
          }
          const e = nearest();
          h.onTarget({
            enemy:
              e && hero.position.distanceTo(e.mesh.position) < 21
                ? {
                    name: e.name,
                    hp: e.hp,
                    max: e.max,
                    boss: e.boss,
                    phase: e.phase,
                    stance: e.mode,
                    distance: Math.round(
                      hero.position.distanceTo(e.mesh.position),
                    ),
                  }
                : null,
          });
        }
        const desired = hero.position.clone().add(new T.Vector3(10, 10, 15));
        camera.position.lerp(desired, dt * 2);
        camera.lookAt(
          hero.position.x,
          hero.position.y + 1.1,
          hero.position.z - 3,
        );
      } else if (!h.active) {
        camera.position.x = 15;
        camera.lookAt(-1, 3, -12);
        hero.rotation.y = -2.6;
      }
      if (
        (h.active &&
          !h.paused &&
          elapsed - lastDraw > (hasGL ? 1 / 60 : 1 / 30)) ||
        lastDraw < 0
      ) {
        renderer.render(scene, camera);
        lastDraw = elapsed;
      }
    }
    animate();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      scene.traverse((o) => {
        o.geometry?.dispose();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => m.dispose());
        }
      });
      scene.background?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      actionRef.current = null;
    };
  }, [state?.region, epoch]);
  return (
    <div
      className="world-canvas"
      ref={mount}
      aria-label="Interactive 3D world of Soul Land"
    />
  );
}
