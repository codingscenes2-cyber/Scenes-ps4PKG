import TIMING from "./content/combat.json" with { type: "json" };
export { TIMING };
export class ActionBuffer {
  constructor() {
    this.entry = null;
  }
  push(action, now) {
    this.entry = { action, expires: now + TIMING.bufferSeconds };
  }
  take(now, ready) {
    if (!this.entry) return null;
    if (now > this.entry.expires) {
      this.entry = null;
      return null;
    }
    if (!ready) return null;
    const action = this.entry.action;
    this.entry = null;
    return action;
  }
  clear() {
    this.entry = null;
  }
}
export function canDodgeCancel(cooldown, total, pending, attacking = false) {
  return (
    attacking &&
    total > 0 &&
    pending === 0 &&
    cooldown <= total * TIMING.cancelRemainder
  );
}
export function meleeConnects(from, to, facing, reach) {
  const dx = to.x - from.x,
    dz = to.z - from.z;
  return (
    Math.hypot(dx, dz) <= reach &&
    (Math.hypot(dx, dz) < 0.15 ||
      Math.cos(Math.atan2(dx, dz) - facing) >= Math.cos(TIMING.meleeArc / 2))
  );
}
