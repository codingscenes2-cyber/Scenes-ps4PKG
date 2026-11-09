export const PREF_KEY = "soul-land-preferences-v1";
export const DEFAULT_BINDINGS = {
  up: "w",
  down: "s",
  left: "a",
  right: "d",
  sprint: "shift",
  light: "j",
  heavy: "k",
  dodge: " ",
  backstep: "v",
  block: "b",
  parry: "f",
  magic: "r",
  heal: "q",
  interact: "e",
  skill: "c",
  jump: "x",
  lock: "tab",
};
export const DEFAULT_PREFERENCES = {
  master: 0.8,
  music: 0.65,
  effects: 0.9,
  brightness: 1,
  shake: true,
  reducedMotion: false,
  highContrast: false,
  subtitles: true,
  colorblind: "none",
  quality: "auto",
  bindings: DEFAULT_BINDINGS,
};
export function normalizePreferences(p) {
  const result = { ...DEFAULT_PREFERENCES, bindings: { ...DEFAULT_BINDINGS } };
  for (const key of ["master", "music", "effects"])
    if (Number.isFinite(p?.[key]))
      result[key] = Math.max(0, Math.min(1, p[key]));
  if (Number.isFinite(p?.brightness))
    result.brightness = Math.max(0.8, Math.min(1.5, p.brightness));
  for (const key of ["shake", "reducedMotion", "highContrast", "subtitles"])
    if (typeof p?.[key] === "boolean") result[key] = p[key];
  if (
    ["none", "deuteranopia", "protanopia", "tritanopia"].includes(p?.colorblind)
  )
    result.colorblind = p.colorblind;
  if (["auto", "low", "high"].includes(p?.quality)) result.quality = p.quality;
  // Only accept a complete unique binding table; partial/tampered settings reset safely.
  if (
    p?.bindings &&
    Object.keys(DEFAULT_BINDINGS).every(
      (k) =>
        typeof p.bindings[k] === "string" &&
        p.bindings[k].length > 0 &&
        p.bindings[k].length <= 16 &&
        p.bindings[k] !== "escape",
    ) &&
    new Set(Object.values(p.bindings)).size ===
      Object.keys(DEFAULT_BINDINGS).length
  )
    result.bindings = { ...p.bindings };
  return result;
}
export function loadPreferences(storage = globalThis.localStorage) {
  try {
    return normalizePreferences(JSON.parse(storage.getItem(PREF_KEY)));
  } catch {
    return normalizePreferences(null);
  }
}
export function savePreferences(p, storage = globalThis.localStorage) {
  try {
    storage.setItem(PREF_KEY, JSON.stringify(normalizePreferences(p)));
    return true;
  } catch {
    return false;
  }
}
export function bindKey(p, action, key) {
  if (!(action in DEFAULT_BINDINGS) || !key || key === "escape") return p;
  const bindings = { ...p.bindings };
  const conflict = Object.keys(bindings).find((k) => bindings[k] === key);
  if (conflict) bindings[conflict] = bindings[action];
  bindings[action] = key;
  return normalizePreferences({ ...p, bindings });
}
export function keyAction(key, bindings) {
  return (
    Object.keys(bindings).find((k) => bindings[k] === key) ||
    {
      arrowup: "up",
      arrowdown: "down",
      arrowleft: "left",
      arrowright: "right",
    }[key]
  );
}
export class GamepadInput {
  constructor() {
    this.buttons = [];
  }
  poll(pad, now = performance.now() / 1000) {
    if (!pad) {
      this.buttons = [];
      return { x: 0, z: 0, actions: [], block: false, sprint: false };
    }
    const dead = (v) =>
      Math.abs(v) < 0.18
        ? 0
        : Math.sign(v) * Math.min(1, (Math.abs(v) - 0.18) / 0.82);
    const map = {
      0: "dodge",
      1: "backstep",
      2: "light",
      3: "heavy",
      5: "skill",
      6: "parry",
      7: "magic",
      8: "jump",
      9: "pause",
      11: "lock",
      12: "heal",
      13: "interact",
    };
    const actions = [];
    pad.buttons.forEach((b, i) => {
      if (b.pressed && !this.buttons[i] && map[i]) actions.push(map[i]);
    });
    if (pad.buttons[2]?.pressed && !this.buttons[2]) this.chargeStart = now;
    if (
      !pad.buttons[2]?.pressed &&
      this.buttons[2] &&
      now - (this.chargeStart ?? now) > 0.6
    )
      actions.push("charged");
    this.buttons = pad.buttons.map((b) => b.pressed);
    return {
      x: dead(pad.axes[0] || 0),
      z: dead(pad.axes[1] || 0),
      actions,
      block: !!pad.buttons[4]?.pressed,
      sprint: !!pad.buttons[10]?.pressed,
    };
  }
}
