// A bounded pool prevents repeated combat bursts from growing GPU allocations.
export class EffectPool {
  constructor(factory, limit = 16) {
    this.factory = factory;
    this.limit = limit;
    this.free = [];
    this.active = new Set();
    this.created = 0;
  }
  acquire() {
    const item =
      this.free.pop() ||
      (this.created < this.limit ? (this.created++, this.factory()) : null);
    if (item) this.active.add(item);
    return item;
  }
  release(item) {
    if (!this.active.delete(item)) return;
    item.visible = false;
    this.free.push(item);
  }
}
