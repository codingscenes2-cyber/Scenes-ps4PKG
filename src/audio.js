// Original, locally synthesized score. No audio downloads or autoplay.
export class SoulAudio {
  constructor(Context, getMood) {
    this.ctx = new Context();
    this.mood = getMood;
    this.beat = 0;
    this.closed = false;
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.18;
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
    this.wet.connect(this.master);
    this.timer = setInterval(() => this.tick(), 650);
    this.tick();
  }
  tone(freq, length, volume = 0.12, type = "sine", when = 0) {
    if (this.closed || this.ctx.state === "suspended") return;
    const t = this.ctx.currentTime + when,
      o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volume, t + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, t + length);
    o.connect(g);
    g.connect(this.master);
    g.connect(this.wet);
    o.start(t);
    o.stop(t + length + 0.03);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  tick() {
    const m = this.mood();
    if (m.paused) return;
    const roots = [55, 65.406, 61.735, 48.999, 73.416, 58.27];
    const root = roots[(m.region || 0) % roots.length];
    const b = this.beat++;
    const chords = [
      1,
      Math.pow(2, 3 / 12),
      Math.pow(2, 7 / 12),
      Math.pow(2, 10 / 12),
    ];
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
    } else if (b % 8 === 5) this.tone(root * 8, 3, 0.018);
  }
  cue(type, text = "") {
    if (type === "victory") {
      [1, 1.2, 1.5, 2].forEach((n, i) =>
        this.tone(220 * n, 2, 0.13, "sine", i * 0.18),
      );
      return;
    }
    if (type === "death") {
      this.tone(44, 2.5, 0.25, "triangle");
      this.tone(47, 2.5, 0.09);
      return;
    }
    if (type === "reward") {
      this.tone(440, 1, 0.08);
      this.tone(660, 1.3, 0.06, "sine", 0.12);
      return;
    }
    if (type === "combat") {
      if (/Strike|Backstab|riposte/.test(text)) {
        this.tone(110, 0.09, 0.2, "triangle");
        this.tone(930, 0.075, 0.04, "sawtooth");
      } else if (/PARRY/.test(text)) this.tone(880, 0.6, 0.16, "triangle");
      else if (/prepares/.test(text)) this.tone(82.4, 0.6, 0.11, "triangle");
      else if (/spell|strikes|sigil/.test(text)) this.tone(330, 0.5, 0.07);
    }
  }
  close() {
    this.closed = true;
    clearInterval(this.timer);
    return this.ctx.close();
  }
}
