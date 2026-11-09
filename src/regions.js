import PROFILES from "./content/regions.json" with { type: "json" };
export { PROFILES };
export const regionProfile = (id) => PROFILES[id] || PROFILES[0];
export function regionalResources(s, position, dt, max) {
  const next = { hp: s.hp, stamina: s.stamina, focus: s.focus };
  for (const h of regionProfile(s.region).hazards) {
    const active =
      h.zone === "all" ||
      (h.zone === "edge"
        ? Math.abs(position.x) > h.threshold
        : position.x > h.threshold);
    if (active)
      for (const key of ["hp", "stamina", "focus"])
        if (h[key])
          next[key] = Math.max(0, Math.min(max[key], next[key] + h[key] * dt));
  }
  return next;
}
// Priority selector: committed attacks/recovery cannot be overridden by chase logic.
export function enemyBehavior(e, distance, homeDistance) {
  if (e.hp <= 0) return "dead";
  if (e.stagger > 0) return "staggered";
  if (e.mode === "windup") return "windup";
  if (e.mode === "recovery" && e.timer > 0) return "recovery";
  if (e.mode === "returning") return homeDistance > 1 ? "return" : "reset";
  if (homeDistance > (e.leash || (e.boss ? 23 : 30))) return "return";
  if (!e.boss && e.hp < e.max * 0.2 && distance < 4) return "retreat";
  if (e.personality === "sentinel" && distance < 4 && e.timer > 0.2)
    return "guard";
  if (distance < 22 && distance > (e.personality === "caster" ? 10 : 2.3))
    return "chasing";
  return "ready";
}
export function signatureEffect(id) {
  return (
    {
      life: { heal: 20 },
      death: { flaskSeal: 4 },
      time: { slow: 2.5 },
      flame: { echo: true },
      void: { focus: 12 },
      memory: { echo: true },
      creation: { stamina: 14 },
    }[id] || {}
  );
}
