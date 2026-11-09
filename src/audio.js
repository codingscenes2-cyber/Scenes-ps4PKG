import { regionProfile } from "./regions.js";
// Original, locally synthesized score. No audio downloads or autoplay.
export class SoulAudio {
  constructor(Context, getMood) {
    this.ctx = new Context();
    this.mood = getMood;
    this.beat = 0;
    this.closed = false;
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.24;
    this.music = this.ctx.createGain();
    this.effects = this.ctx.createGain();
    this.music.connect(this.master);
    this.effects.connect(this.master);
    const compressor = this.ctx.createDynamicsCompressor();
    this.master.connect(compressor).connect(this.ctx.destination);
    this.wet = this.ctx.createConvolver();
    const impulse = this.ctx.createBuffer(
      2,
      this.ctx.sampleRate * 1.6,
      this.ctx.sampleRate,
    );
    for (let ch = 0; ch < 2; ch++) {
      const a = impulse.getChannelData(ch);
      for (let i = 0; i < a.length; i++)
        a[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / a.length, 3) * 0.3;
    }
    this.wet.buffer = impulse;
    this.wet.connect(this.music);
    const step = () => {
      if (this.closed) return;
      this.tick();
      const mood = this.mood();
      this.timer = setTimeout(
        step,
        regionProfile(mood.region).music.pulse *
          (mood.boss ? 0.75 : mood.combat ? 0.9 : 1),
      );
    };
    step();
  }
  setMix(p) {
    const now = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(p.master * 0.3, now, 0.06);
    this.music.gain.setTargetAtTime(p.music, now, 0.06);
    this.effects.gain.setTargetAtTime(p.effects, now, 0.06);
  }
  sfx(freq, length, volume = 0.12, type = "sine", when = 0) {
    return this.tone(
      freq,
      length,
      volume,
      type,
      when,
      "effects",
      this.cueSpatial,
    );
  }
  tone(
    freq,
    length,
    volume = 0.12,
    type = "sine",
    when = 0,
    bus = "music",
    spatial = null,
  ) {
    if (this.closed || this.ctx.state === "suspended") return;
    const t = this.ctx.currentTime + when,
      o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    const attenuation =
      bus === "effects" && spatial
        ? 1 / (1 + Math.max(0, spatial.distance || 0) * 0.04)
        : 1;
    g.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, volume * attenuation),
      t + 0.025,
    );
    g.gain.exponentialRampToValueAtTime(0.0001, t + length);
    o.connect(g);
    let panner;
    if (bus === "effects") {
      panner = this.ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, spatial?.pan || 0));
      g.connect(panner);
      panner.connect(this.effects);
    } else {
      g.connect(this.music);
      g.connect(this.wet);
    }
    o.start(t);
    o.stop(t + length + 0.03);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
      panner?.disconnect();
    };
  }
  tick() {
    const m = this.mood();
    if (m.paused) return;
    const score = regionProfile(m.region).music;
    const root = score.root;
    const b = this.beat++;
    const chords = [1, ...score.interval.map((n) => Math.pow(2, n / 12))];
    if (b % 4 === 0) {
      this.tone(root, 3, 0.13);
      this.tone(
        root * 2 * chords[Math.floor(b / 4) % 4],
        3.8,
        0.045,
        "triangle",
      );
    }
    if (b % 2 === 0)
      this.tone(
        root * 4 * chords[[0, 2, 1, 3, 2, 0, 3, 1][Math.floor(b / 2) % 8]],
        2.5,
        0.045,
      );
    if (m.boss) {
      this.tone(root * 0.5, 0.3, 0.2, "triangle");
      if (b % 2) this.tone(root * 3, 0.12, 0.045, "triangle");
    } else if (m.combat && b % 2 === 0) this.tone(root, 0.2, 0.09, "triangle");
    else if (b % 8 === 5) this.tone(root * 8, 3, 0.018);
  }
  cue(type, text = "", spatial = null) {
    this.cueSpatial = spatial;
    if (type === "victory") {
      [1, 1.2, 1.5, 2].forEach((n, i) =>
        this.sfx(220 * n, 2, 0.13, "sine", i * 0.18),
      );
      return;
    }
    if (type === "death") {
      this.sfx(44, 2.5, 0.25, "triangle");
      this.sfx(47, 2.5, 0.09);
      return;
    }
    if (type === "reward") {
      this.sfx(440, 1, 0.08);
      this.sfx(660, 1.3, 0.06, "sine", 0.12);
      return;
    }
    if (type === "combat") {
      if (/Strike|Backstab|riposte/.test(text)) {
        this.sfx(110, 0.09, 0.2, "triangle");
        this.sfx(930, 0.075, 0.04, "sawtooth");
      } else if (/PARRY/.test(text)) this.sfx(880, 0.6, 0.16, "triangle");
      else if (/prepares/.test(text)) this.sfx(82.4, 0.6, 0.11, "triangle");
      else if (/spell|strikes|sigil/.test(text)) this.sfx(330, 0.5, 0.07);
    }
  }
  close() {
    this.closed = true;
    clearTimeout(this.timer);
    return this.ctx.close();
  }
}
