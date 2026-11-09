import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_PREFERENCES,
  normalizePreferences,
  bindKey,
  keyAction,
  GamepadInput,
  savePreferences,
  loadPreferences,
} from "../src/preferences.js";
import { EffectPool } from "../src/effectPool.js";
import { SoulAudio } from "../src/audio.js";
test("settings clamp invalid values, preserve accessible defaults and swap conflicting bindings", () => {
  const p = normalizePreferences({
    master: 99,
    music: -1,
    brightness: 9,
    colorblind: "bad",
    bindings: { up: "z" },
  });
  assert.equal(p.master, 1);
  assert.equal(p.music, 0);
  assert.equal(p.brightness, 1.5);
  assert.equal(p.colorblind, "none");
  assert.equal(p.bindings.up, "w");
  const next = bindKey(p, "light", "k");
  assert.equal(next.bindings.light, "k");
  assert.equal(next.bindings.heavy, "j");
  assert.equal(keyAction("k", next.bindings), "light");
  assert.equal(keyAction("arrowup", next.bindings), "up");
  assert.equal(bindKey(p, "light", "escape"), p);
  let raw;
  const store = { getItem: () => raw, setItem: (_, v) => (raw = v) };
  assert.equal(savePreferences(next, store), true);
  assert.deepEqual(loadPreferences(store), next);
  assert.deepEqual(
    loadPreferences({ getItem: () => "broken" }),
    DEFAULT_PREFERENCES,
  );
});
test("standard controller uses deadzone and rising edges, releases guard and resets on disconnect", () => {
  const c = new GamepadInput();
  const pad = {
    axes: [0.1, -1],
    buttons: Array.from({ length: 16 }, () => ({ pressed: false })),
  };
  pad.buttons[0].pressed = true;
  pad.buttons[4].pressed = true;
  const first = c.poll(pad);
  assert.equal(first.x, 0);
  assert.equal(first.z, -1);
  assert.deepEqual(first.actions, ["dodge"]);
  assert.equal(first.block, true);
  assert.deepEqual(c.poll(pad).actions, []);
  assert.equal(c.poll(null).block, false);
  assert.deepEqual(c.poll(pad).actions, ["dodge"]);
});
test("effect pool remains bounded and reuses released geometry without double release", () => {
  const pool = new EffectPool(() => ({ visible: true }), 2);
  const a = pool.acquire(),
    b = pool.acquire();
  assert.equal(pool.acquire(), null);
  pool.release(a);
  pool.release(a);
  assert.equal(pool.free.length, 1);
  assert.equal(pool.acquire(), a);
  assert.equal(pool.created, 2);
  assert.equal(pool.active.size, 2);
  pool.release(b);
  assert.equal(b.visible, false);
});
test("music and spatial effects route through separate controllable buses", () => {
  const nodes = [];
  function node() {
    const n = {
      connections: [],
      gain: {
        value: 1,
        setValueAtTime() {},
        exponentialRampToValueAtTime() {},
        setTargetAtTime(v) {
          this.value = v;
        },
      },
      frequency: { setValueAtTime() {} },
      pan: { value: 0 },
      connect(to) {
        this.connections.push(to);
        return to;
      },
      disconnect() {},
      start() {},
      stop() {},
    };
    nodes.push(n);
    return n;
  }
  class Context {
    constructor() {
      this.currentTime = 0;
      this.sampleRate = 10;
      this.state = "running";
      this.destination = node();
    }
    createGain() {
      return node();
    }
    createDynamicsCompressor() {
      return node();
    }
    createConvolver() {
      return node();
    }
    createBuffer() {
      return { getChannelData: () => new Float32Array(16) };
    }
    createOscillator() {
      return node();
    }
    createStereoPanner() {
      return node();
    }
    close() {
      return Promise.resolve();
    }
  }
  const audio = new SoulAudio(Context, () => ({ region: 0, paused: true }));
  audio.setMix({ ...DEFAULT_PREFERENCES, master: 0, music: 0.4, effects: 0.7 });
  assert.equal(audio.master.gain.value, 0);
  assert.equal(audio.music.gain.value, 0.4);
  assert.equal(audio.effects.gain.value, 0.7);
  audio.cue("combat", "Strike", { pan: -0.8, distance: 10 });
  assert.ok(
    nodes.some(
      (n) => n.pan.value === -0.8 && n.connections.includes(audio.effects),
    ),
  );
  assert.ok(audio.music.connections.includes(audio.master));
  audio.close();
});
