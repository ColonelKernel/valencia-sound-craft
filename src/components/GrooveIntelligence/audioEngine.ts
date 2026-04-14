let ctx: AudioContext | null = null;

function getCtx() {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export function playGrooveHit(density: number, swing: number, velocity: number) {
  const ac = getCtx();
  const now = ac.currentTime;

  // Kick-like hit
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const filter = ac.createBiquadFilter();

  osc.type = "sine";
  osc.frequency.setValueAtTime(80 + density * 60, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

  filter.type = "lowpass";
  filter.frequency.value = 300 + swing * 400;

  const vol = 0.15 + velocity * 0.2;
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);

  osc.start(now);
  osc.stop(now + 0.3);

  // Hi-hat click
  const noise = ac.createBufferSource();
  const buf = ac.createBuffer(1, ac.sampleRate * 0.05, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
  noise.buffer = buf;

  const hpf = ac.createBiquadFilter();
  hpf.type = "highpass";
  hpf.frequency.value = 6000 + swing * 2000;

  const ng = ac.createGain();
  ng.gain.setValueAtTime(0.08 + velocity * 0.12, now + 0.02);
  ng.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  noise.connect(hpf);
  hpf.connect(ng);
  ng.connect(ac.destination);
  noise.start(now + 0.01 + swing * 0.02); // swing offsets timing
}

// Rhythmic pulse sequence on selection
export function playGrooveSequence(density: number, swing: number, velocity: number) {
  const steps = Math.round(3 + density * 5);
  const interval = 0.08 + (1 - density) * 0.06;

  for (let i = 0; i < steps; i++) {
    setTimeout(() => {
      playGrooveHit(
        density,
        swing,
        velocity * (0.6 + Math.random() * 0.4)
      );
    }, i * interval * 1000);
  }
}
