// Generative ambient sound: a slow filtered drone with reverb, plus pentatonic chimes for interactions.
// Created only after a user gesture (the Sound toggle), and silent until switched on.
export function createAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  // Synthetic reverb: decaying stereo noise impulse.
  const reverb = ctx.createConvolver();
  const len = ctx.sampleRate * 4;
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  reverb.buffer = ir;
  const wet = ctx.createGain();
  wet.gain.value = 0.55;
  reverb.connect(wet).connect(master);

  // Drone: three detuned voices through a lowpass whose cutoff breathes with an LFO.
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = 520; filter.Q.value = 0.7;
  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.32;
  filter.connect(droneGain);
  droneGain.connect(master);
  droneGain.connect(reverb);
  const lfo = ctx.createOscillator(), lfoAmt = ctx.createGain();
  lfo.frequency.value = 0.06; lfoAmt.gain.value = 260;
  lfo.connect(lfoAmt).connect(filter.frequency);
  lfo.start();
  const voices = [[55, 'sine', 0], [82.41, 'triangle', 4], [110, 'sine', -3], [164.81, 'sine', 2]].map(([f, type, detune]) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f; o.detune.value = detune;
    g.gain.value = type === 'triangle' ? 0.18 : 0.26;
    o.connect(g).connect(filter);
    o.start();
    return o;
  });

  // A-minor pentatonic chimes.
  const SCALE = [440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5];
  function chime(index, vol = 0.12) {
    if (master.gain.value < 0.001) return;
    const f = SCALE[((index % SCALE.length) + SCALE.length) % SCALE.length];
    const now = ctx.currentTime;
    [1, 2.01].forEach((mult, k) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f * mult;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(vol / (k + 1), now + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
      o.connect(g); g.connect(master); g.connect(reverb);
      o.start(now); o.stop(now + 3);
    });
  }

  // Each section shifts the drone's root slightly: the mood follows the page.
  const ROOTS = [55, 49, 58.27, 55, 61.74, 55];
  function setMood(i) {
    const r = ROOTS[i] ?? 55, now = ctx.currentTime;
    voices.forEach((o, k) => o.frequency.setTargetAtTime(r * [1, 1.498, 2, 2.996][k], now, 2.5));
  }

  let on = false;
  return {
    get on() { return on; },
    async toggle() {
      on = !on;
      if (ctx.state === 'suspended') await ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(on ? 0.22 : 0, ctx.currentTime, on ? 1.2 : 0.3);
      return on;
    },
    mute(m) { if (on) master.gain.setTargetAtTime(m ? 0 : 0.22, ctx.currentTime, 0.4); },
    chime, setMood,
  };
}
