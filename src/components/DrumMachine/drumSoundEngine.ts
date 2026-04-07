// Professional drum sound engine using Web Audio API
// Supports multiple kits with realistic synthesis

export type DrumKitType = 'acoustic' | 'latin' | 'afro' | '808' | '909' | 'electronic';

export interface DrumSound {
  name: string;
  play: (ctx: AudioContext, time: number, velocity: number, pitch: number, decay: number) => void;
}

// ─── Acoustic Kit ──────────────────────────────────────────────────────────

function playKick(ctx: AudioContext, time: number, vel: number, pitch: number, decay: number) {
  const g = ctx.createGain();
  g.connect(ctx.destination);
  g.gain.setValueAtTime(vel * 0.8, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.5);

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150 * pitch, time);
  osc.frequency.exponentialRampToValueAtTime(40 * pitch, time + 0.07);
  osc.connect(g);
  osc.start(time);
  osc.stop(time + decay * 0.5);

  // Click transient
  const click = ctx.createOscillator();
  const cg = ctx.createGain();
  click.type = 'sine';
  click.frequency.setValueAtTime(4000, time);
  cg.gain.setValueAtTime(vel * 0.3, time);
  cg.gain.exponentialRampToValueAtTime(0.001, time + 0.01);
  click.connect(cg);
  cg.connect(ctx.destination);
  click.start(time);
  click.stop(time + 0.02);
}

function playSnare(ctx: AudioContext, time: number, vel: number, pitch: number, decay: number) {
  // Body
  const osc = ctx.createOscillator();
  const og = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(200 * pitch, time);
  osc.frequency.exponentialRampToValueAtTime(100 * pitch, time + 0.05);
  og.gain.setValueAtTime(vel * 0.5, time);
  og.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.3);
  osc.connect(og);
  og.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + decay * 0.3);

  // Noise
  const bufLen = ctx.sampleRate * decay * 0.4;
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(vel * 0.4, time);
  ng.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.4);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 2000;
  noise.connect(hp);
  hp.connect(ng);
  ng.connect(ctx.destination);
  noise.start(time);
  noise.stop(time + decay * 0.4);
}

function playHiHatClosed(ctx: AudioContext, time: number, vel: number, _p: number, _d: number) {
  const bufLen = ctx.sampleRate * 0.05;
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
  const n = ctx.createBufferSource();
  n.buffer = buf;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vel * 0.3, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 10000;
  bp.Q.value = 1;
  n.connect(bp);
  bp.connect(g);
  g.connect(ctx.destination);
  n.start(time);
  n.stop(time + 0.06);
}

function playHiHatOpen(ctx: AudioContext, time: number, vel: number, _p: number, decay: number) {
  const bufLen = ctx.sampleRate * decay * 0.6;
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
  const n = ctx.createBufferSource();
  n.buffer = buf;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vel * 0.3, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.6);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 10000;
  bp.Q.value = 0.5;
  n.connect(bp);
  bp.connect(g);
  g.connect(ctx.destination);
  n.start(time);
  n.stop(time + decay * 0.6 + 0.01);
}

function playClave(ctx: AudioContext, time: number, vel: number, pitch: number, _d: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(2500 * pitch, time);
  g.gain.setValueAtTime(vel * 0.4, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.04);
}

function playCowbell(ctx: AudioContext, time: number, vel: number, pitch: number, decay: number) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const g = ctx.createGain();
  osc1.type = 'square';
  osc2.type = 'square';
  osc1.frequency.setValueAtTime(560 * pitch, time);
  osc2.frequency.setValueAtTime(845 * pitch, time);
  g.gain.setValueAtTime(vel * 0.25, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.3);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 800;
  bp.Q.value = 3;
  osc1.connect(bp);
  osc2.connect(bp);
  bp.connect(g);
  g.connect(ctx.destination);
  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + decay * 0.3);
  osc2.stop(time + decay * 0.3);
}

function playRimshot(ctx: AudioContext, time: number, vel: number, pitch: number, _d: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(800 * pitch, time);
  g.gain.setValueAtTime(vel * 0.4, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.03);
}

function playClap(ctx: AudioContext, time: number, vel: number, _p: number, _d: number) {
  // Multiple short noise bursts
  for (let b = 0; b < 3; b++) {
    const len = ctx.sampleRate * 0.01;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const n = ctx.createBufferSource();
    n.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel * 0.3, time + b * 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, time + b * 0.01 + 0.03);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2500;
    bp.Q.value = 0.5;
    n.connect(bp);
    bp.connect(g);
    g.connect(ctx.destination);
    n.start(time + b * 0.01);
    n.stop(time + b * 0.01 + 0.04);
  }
}

function playCongaLow(ctx: AudioContext, time: number, vel: number, pitch: number, decay: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200 * pitch, time);
  osc.frequency.exponentialRampToValueAtTime(120 * pitch, time + 0.05);
  g.gain.setValueAtTime(vel * 0.5, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.5);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + decay * 0.5);
}

function playCongaHigh(ctx: AudioContext, time: number, vel: number, pitch: number, decay: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(340 * pitch, time);
  osc.frequency.exponentialRampToValueAtTime(200 * pitch, time + 0.03);
  g.gain.setValueAtTime(vel * 0.5, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.35);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + decay * 0.35);
}

function playCongaSlap(ctx: AudioContext, time: number, vel: number, pitch: number, _d: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(500 * pitch, time);
  g.gain.setValueAtTime(vel * 0.5, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.05);

  // Noise attack
  const len = ctx.sampleRate * 0.015;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const n = ctx.createBufferSource();
  n.buffer = buf;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(vel * 0.3, time);
  ng.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
  n.connect(ng);
  ng.connect(ctx.destination);
  n.start(time);
  n.stop(time + 0.03);
}

function playTomLow(ctx: AudioContext, time: number, vel: number, pitch: number, decay: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(120 * pitch, time);
  osc.frequency.exponentialRampToValueAtTime(80 * pitch, time + 0.08);
  g.gain.setValueAtTime(vel * 0.6, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.5);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + decay * 0.5);
}

function playTomHigh(ctx: AudioContext, time: number, vel: number, pitch: number, decay: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(250 * pitch, time);
  osc.frequency.exponentialRampToValueAtTime(180 * pitch, time + 0.05);
  g.gain.setValueAtTime(vel * 0.5, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.4);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + decay * 0.4);
}

function playCrash(ctx: AudioContext, time: number, vel: number, _p: number, decay: number) {
  const len = ctx.sampleRate * decay;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const n = ctx.createBufferSource();
  n.buffer = buf;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vel * 0.3, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + decay);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 5000;
  bp.Q.value = 0.3;
  n.connect(bp);
  bp.connect(g);
  g.connect(ctx.destination);
  n.start(time);
  n.stop(time + decay + 0.01);
}

function playRide(ctx: AudioContext, time: number, vel: number, pitch: number, decay: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(400 * pitch, time);
  g.gain.setValueAtTime(vel * 0.15, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.6);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + decay * 0.6);

  // Shimmer noise
  const len = ctx.sampleRate * decay * 0.4;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const dd = buf.getChannelData(0);
  for (let i = 0; i < len; i++) dd[i] = Math.random() * 2 - 1;
  const n = ctx.createBufferSource();
  n.buffer = buf;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(vel * 0.1, time);
  ng.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.4);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 8000;
  n.connect(hp);
  hp.connect(ng);
  ng.connect(ctx.destination);
  n.start(time);
  n.stop(time + decay * 0.4 + 0.01);
}

function playCajon(ctx: AudioContext, time: number, vel: number, pitch: number, decay: number) {
  // Combination of low thud + noise slap
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(100 * pitch, time);
  osc.frequency.exponentialRampToValueAtTime(60 * pitch, time + 0.05);
  g.gain.setValueAtTime(vel * 0.6, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.4);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + decay * 0.4);

  const len = ctx.sampleRate * 0.06;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const n = ctx.createBufferSource();
  n.buffer = buf;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(vel * 0.25, time);
  ng.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
  n.connect(ng);
  ng.connect(ctx.destination);
  n.start(time);
  n.stop(time + 0.07);
}

function playShaker(ctx: AudioContext, time: number, vel: number, _p: number, _d: number) {
  const len = ctx.sampleRate * 0.04;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const n = ctx.createBufferSource();
  n.buffer = buf;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vel * 0.15, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 6000;
  n.connect(hp);
  hp.connect(g);
  g.connect(ctx.destination);
  n.start(time);
  n.stop(time + 0.05);
}

function playBongo(ctx: AudioContext, time: number, vel: number, pitch: number, _d: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(450 * pitch, time);
  osc.frequency.exponentialRampToValueAtTime(300 * pitch, time + 0.02);
  g.gain.setValueAtTime(vel * 0.45, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.09);
}

function playAgogo(ctx: AudioContext, time: number, vel: number, pitch: number, decay: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(700 * pitch, time);
  g.gain.setValueAtTime(vel * 0.3, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.25);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + decay * 0.25);
}

function playSurdo(ctx: AudioContext, time: number, vel: number, pitch: number, decay: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(80 * pitch, time);
  osc.frequency.exponentialRampToValueAtTime(50 * pitch, time + 0.1);
  g.gain.setValueAtTime(vel * 0.7, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.6);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + decay * 0.6);
}

function playRepique(ctx: AudioContext, time: number, vel: number, pitch: number, _d: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400 * pitch, time);
  osc.frequency.exponentialRampToValueAtTime(280 * pitch, time + 0.02);
  g.gain.setValueAtTime(vel * 0.4, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.13);
}

function withTuning(
  play: (ctx: AudioContext, time: number, velocity: number, pitch: number, decay: number) => void,
  pitchMultiplier: number,
  decayMultiplier: number
) {
  return (ctx: AudioContext, time: number, velocity: number, pitch: number, decay: number) =>
    play(ctx, time, velocity, pitch * pitchMultiplier, Math.max(0.05, decay * decayMultiplier));
}

function playPalmas(ctx: AudioContext, time: number, vel: number, _p: number, _d: number) {
  for (let burst = 0; burst < 2; burst++) {
    const start = time + burst * 0.012;
    const len = Math.max(1, Math.round(ctx.sampleRate * 0.028));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);

    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 0.7;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vel * 0.25, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.05);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(start);
    noise.stop(start + 0.06);
  }
}

function playTriangle(ctx: AudioContext, time: number, vel: number, pitch: number, decay: number) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc1.type = 'triangle';
  osc2.type = 'sine';
  osc1.frequency.setValueAtTime(1600 * pitch, time);
  osc2.frequency.setValueAtTime(2275 * pitch, time);
  filter.type = 'bandpass';
  filter.frequency.value = 2200;
  filter.Q.value = 5;
  gain.gain.setValueAtTime(vel * 0.22, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + Math.max(0.12, decay * 0.7));

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + Math.max(0.14, decay * 0.75));
  osc2.stop(time + Math.max(0.14, decay * 0.75));
}

function playKonnakol(ctx: AudioContext, time: number, vel: number, pitch: number, decay: number) {
  const osc = ctx.createOscillator();
  const formant = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(280 * pitch, time);
  osc.frequency.exponentialRampToValueAtTime(210 * pitch, time + 0.04);
  formant.type = 'bandpass';
  formant.frequency.value = 1100;
  formant.Q.value = 4;
  gain.gain.setValueAtTime(vel * 0.24, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + Math.max(0.08, decay * 0.35));

  osc.connect(formant);
  formant.connect(gain);
  gain.connect(ctx.destination);

  osc.start(time);
  osc.stop(time + Math.max(0.09, decay * 0.4));
}

function playRiq(ctx: AudioContext, time: number, vel: number, pitch: number, decay: number) {
  playShaker(ctx, time, vel, pitch, decay);
  playTriangle(ctx, time, vel * 0.6, pitch * 0.9, Math.max(0.1, decay * 0.4));
}

const playCajonLow = withTuning(playCajon, 0.9, 1.2);
const playCajonHigh = withTuning(playCongaSlap, 1.15, 0.8);
const playCampana = withTuning(playCowbell, 1.05, 1);
const playDjembeBass = withTuning(playCongaLow, 0.85, 1.15);
const playDjembeSlap = withTuning(playCongaSlap, 1.1, 0.9);
const playDununBell = withTuning(playCowbell, 0.95, 1);
const playTupanLow = withTuning(playSurdo, 0.9, 1.15);
const playTupanHigh = withTuning(playSnare, 0.95, 0.85);
const playZabumbaLow = withTuning(playSurdo, 0.88, 1.1);
const playZabumbaHigh = withTuning(playRimshot, 0.92, 1);
const playTablaBayan = withTuning(playCongaLow, 0.8, 1.1);
const playTablaDayan = withTuning(playBongo, 0.95, 0.9);
const playDarbukaDum = withTuning(playCongaLow, 0.9, 1);
const playDarbukaTek = withTuning(playCongaSlap, 1.18, 0.8);
const playFrameDrum = withTuning(playCajon, 0.82, 1.05);
const playBomboLegueroLow = withTuning(playSurdo, 0.78, 1.2);
const playBomboLegueroHigh = withTuning(playRimshot, 0.82, 1);
const playBomboLegueroRim = withTuning(playRimshot, 1.02, 1);

function play808Kick(ctx: AudioContext, time: number, vel: number, pitch: number, decay: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200 * pitch, time);
  osc.frequency.exponentialRampToValueAtTime(30 * pitch, time + 0.15);
  g.gain.setValueAtTime(vel * 0.9, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + decay);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + decay);
}

function play808Snare(ctx: AudioContext, time: number, vel: number, pitch: number, decay: number) {
  // Body
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180 * pitch, time);
  g.gain.setValueAtTime(vel * 0.4, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.3);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + decay * 0.3);

  // Noise
  const len = ctx.sampleRate * decay * 0.5;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const n = ctx.createBufferSource();
  n.buffer = buf;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(vel * 0.5, time);
  ng.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.5);
  n.connect(ng);
  ng.connect(ctx.destination);
  n.start(time);
  n.stop(time + decay * 0.5);
}

// ─── Instrument Registry ───────────────────────────────────────────────────

export interface DrumInstrument {
  id: string;
  name: string;
  shortName: string;
  category: 'kick' | 'snare' | 'hihat' | 'tom' | 'cymbal' | 'percussion' | 'latin';
  defaultVelocity: number;
  defaultPitch: number;
  defaultDecay: number;
  color: string;
  play: (ctx: AudioContext, time: number, velocity: number, pitch: number, decay: number) => void;
}

export const DRUM_INSTRUMENTS: DrumInstrument[] = [
  // Acoustic
  { id: 'kick', name: 'Kick', shortName: 'KD', category: 'kick', defaultVelocity: 0.9, defaultPitch: 1, defaultDecay: 0.5, color: 'bg-amber-500', play: playKick },
  { id: 'snare', name: 'Snare', shortName: 'SN', category: 'snare', defaultVelocity: 0.85, defaultPitch: 1, defaultDecay: 0.3, color: 'bg-blue-500', play: playSnare },
  { id: 'hh-closed', name: 'Hi-Hat Closed', shortName: 'CH', category: 'hihat', defaultVelocity: 0.6, defaultPitch: 1, defaultDecay: 0.1, color: 'bg-yellow-400', play: playHiHatClosed },
  { id: 'hh-open', name: 'Hi-Hat Open', shortName: 'OH', category: 'hihat', defaultVelocity: 0.6, defaultPitch: 1, defaultDecay: 0.4, color: 'bg-yellow-500', play: playHiHatOpen },
  { id: 'rimshot', name: 'Rimshot', shortName: 'RS', category: 'snare', defaultVelocity: 0.7, defaultPitch: 1, defaultDecay: 0.1, color: 'bg-blue-400', play: playRimshot },
  { id: 'clap', name: 'Clap', shortName: 'CP', category: 'snare', defaultVelocity: 0.7, defaultPitch: 1, defaultDecay: 0.15, color: 'bg-pink-500', play: playClap },
  { id: 'tom-low', name: 'Tom Low', shortName: 'LT', category: 'tom', defaultVelocity: 0.7, defaultPitch: 1, defaultDecay: 0.4, color: 'bg-orange-600', play: playTomLow },
  { id: 'tom-high', name: 'Tom High', shortName: 'HT', category: 'tom', defaultVelocity: 0.7, defaultPitch: 1, defaultDecay: 0.3, color: 'bg-orange-400', play: playTomHigh },
  { id: 'crash', name: 'Crash', shortName: 'CR', category: 'cymbal', defaultVelocity: 0.7, defaultPitch: 1, defaultDecay: 1.5, color: 'bg-cyan-400', play: playCrash },
  { id: 'ride', name: 'Ride', shortName: 'RD', category: 'cymbal', defaultVelocity: 0.6, defaultPitch: 1, defaultDecay: 1.0, color: 'bg-cyan-500', play: playRide },
  { id: 'cowbell', name: 'Cowbell', shortName: 'CB', category: 'percussion', defaultVelocity: 0.6, defaultPitch: 1, defaultDecay: 0.2, color: 'bg-emerald-400', play: playCowbell },
  { id: 'shaker', name: 'Shaker', shortName: 'SK', category: 'percussion', defaultVelocity: 0.5, defaultPitch: 1, defaultDecay: 0.1, color: 'bg-lime-400', play: playShaker },
  // Latin
  { id: 'clave', name: 'Clave', shortName: 'CL', category: 'latin', defaultVelocity: 0.65, defaultPitch: 1, defaultDecay: 0.1, color: 'bg-rose-400', play: playClave },
  { id: 'conga-low', name: 'Conga Low', shortName: 'CL', category: 'latin', defaultVelocity: 0.7, defaultPitch: 1, defaultDecay: 0.4, color: 'bg-red-500', play: playCongaLow },
  { id: 'conga-high', name: 'Conga High', shortName: 'CH', category: 'latin', defaultVelocity: 0.7, defaultPitch: 1, defaultDecay: 0.3, color: 'bg-red-400', play: playCongaHigh },
  { id: 'conga-slap', name: 'Conga Slap', shortName: 'CS', category: 'latin', defaultVelocity: 0.75, defaultPitch: 1, defaultDecay: 0.15, color: 'bg-red-300', play: playCongaSlap },
  { id: 'bongo', name: 'Bongo', shortName: 'BG', category: 'latin', defaultVelocity: 0.65, defaultPitch: 1, defaultDecay: 0.15, color: 'bg-fuchsia-400', play: playBongo },
  { id: 'cajon', name: 'Cajón', shortName: 'CJ', category: 'latin', defaultVelocity: 0.8, defaultPitch: 1, defaultDecay: 0.4, color: 'bg-stone-500', play: playCajon },
  { id: 'agogo', name: 'Agogô', shortName: 'AG', category: 'latin', defaultVelocity: 0.5, defaultPitch: 1, defaultDecay: 0.2, color: 'bg-teal-400', play: playAgogo },
  { id: 'surdo', name: 'Surdo', shortName: 'SD', category: 'latin', defaultVelocity: 0.8, defaultPitch: 1, defaultDecay: 0.6, color: 'bg-violet-500', play: playSurdo },
  { id: 'repique', name: 'Repique', shortName: 'RP', category: 'latin', defaultVelocity: 0.7, defaultPitch: 1, defaultDecay: 0.2, color: 'bg-violet-400', play: playRepique },
  // Region-specific timbres and compatibility aliases
  { id: 'hihat', name: 'Hi-Hat', shortName: 'HH', category: 'hihat', defaultVelocity: 0.6, defaultPitch: 1, defaultDecay: 0.1, color: 'bg-yellow-300', play: playHiHatClosed },
  { id: 'tambourine', name: 'Tambourine', shortName: 'TB', category: 'percussion', defaultVelocity: 0.55, defaultPitch: 1.15, defaultDecay: 0.12, color: 'bg-amber-300', play: playShaker },
  { id: 'guiro', name: 'Guiro', shortName: 'GR', category: 'percussion', defaultVelocity: 0.45, defaultPitch: 1, defaultDecay: 0.1, color: 'bg-lime-500', play: playShaker },
  { id: 'conga_high', name: 'Conga High', shortName: 'CH', category: 'latin', defaultVelocity: 0.7, defaultPitch: 1, defaultDecay: 0.3, color: 'bg-red-400', play: playCongaHigh },
  { id: 'palmas', name: 'Palmas', shortName: 'PA', category: 'percussion', defaultVelocity: 0.7, defaultPitch: 1, defaultDecay: 0.15, color: 'bg-orange-300', play: playPalmas },
  { id: 'cajon_low', name: 'Cajón Low', shortName: 'CL', category: 'latin', defaultVelocity: 0.82, defaultPitch: 1, defaultDecay: 0.42, color: 'bg-stone-600', play: playCajonLow },
  { id: 'cajon_high', name: 'Cajón High', shortName: 'CH', category: 'latin', defaultVelocity: 0.76, defaultPitch: 1, defaultDecay: 0.18, color: 'bg-stone-400', play: playCajonHigh },
  { id: 'campana', name: 'Campana', shortName: 'CA', category: 'latin', defaultVelocity: 0.62, defaultPitch: 1, defaultDecay: 0.22, color: 'bg-amber-300', play: playCampana },
  { id: 'djembe_bass', name: 'Djembe Bass', shortName: 'DB', category: 'percussion', defaultVelocity: 0.8, defaultPitch: 1, defaultDecay: 0.38, color: 'bg-orange-500', play: playDjembeBass },
  { id: 'djembe_tone', name: 'Djembe Tone', shortName: 'DT', category: 'percussion', defaultVelocity: 0.72, defaultPitch: 1.05, defaultDecay: 0.3, color: 'bg-orange-400', play: playCongaHigh },
  { id: 'djembe_slap', name: 'Djembe Slap', shortName: 'DS', category: 'percussion', defaultVelocity: 0.78, defaultPitch: 1, defaultDecay: 0.18, color: 'bg-orange-300', play: playDjembeSlap },
  { id: 'dunun_bell', name: 'Dunun Bell', shortName: 'DL', category: 'percussion', defaultVelocity: 0.58, defaultPitch: 1, defaultDecay: 0.22, color: 'bg-yellow-300', play: playDununBell },
  { id: 'tupan_low', name: 'Tupan Low', shortName: 'TL', category: 'percussion', defaultVelocity: 0.86, defaultPitch: 1, defaultDecay: 0.5, color: 'bg-sky-600', play: playTupanLow },
  { id: 'tupan_high', name: 'Tupan High', shortName: 'TH', category: 'percussion', defaultVelocity: 0.74, defaultPitch: 1, defaultDecay: 0.24, color: 'bg-sky-400', play: playTupanHigh },
  { id: 'zabumba_low', name: 'Zabumba Low', shortName: 'ZL', category: 'percussion', defaultVelocity: 0.84, defaultPitch: 1, defaultDecay: 0.52, color: 'bg-emerald-600', play: playZabumbaLow },
  { id: 'zabumba_high', name: 'Zabumba High', shortName: 'ZH', category: 'percussion', defaultVelocity: 0.72, defaultPitch: 1, defaultDecay: 0.18, color: 'bg-emerald-400', play: playZabumbaHigh },
  { id: 'triangle', name: 'Triangle', shortName: 'TR', category: 'percussion', defaultVelocity: 0.5, defaultPitch: 1, defaultDecay: 0.35, color: 'bg-cyan-300', play: playTriangle },
  { id: 'tabla_bayan', name: 'Tabla Bayan', shortName: 'TB', category: 'percussion', defaultVelocity: 0.78, defaultPitch: 1, defaultDecay: 0.32, color: 'bg-indigo-500', play: playTablaBayan },
  { id: 'tabla_dayan', name: 'Tabla Dayan', shortName: 'TD', category: 'percussion', defaultVelocity: 0.72, defaultPitch: 1, defaultDecay: 0.18, color: 'bg-indigo-300', play: playTablaDayan },
  { id: 'tabla_ge', name: 'Tabla Ge', shortName: 'TG', category: 'percussion', defaultVelocity: 0.7, defaultPitch: 1, defaultDecay: 0.28, color: 'bg-fuchsia-300', play: playTablaBayan },
  { id: 'tabla_na', name: 'Tabla Na', shortName: 'TN', category: 'percussion', defaultVelocity: 0.68, defaultPitch: 1.2, defaultDecay: 0.2, color: 'bg-fuchsia-200', play: playTablaDayan },
  { id: 'konnakol', name: 'Konnakol', shortName: 'KO', category: 'percussion', defaultVelocity: 0.5, defaultPitch: 1, defaultDecay: 0.16, color: 'bg-fuchsia-300', play: playKonnakol },
  { id: 'darbuka_dum', name: 'Darbuka Dum', shortName: 'DD', category: 'percussion', defaultVelocity: 0.78, defaultPitch: 1, defaultDecay: 0.3, color: 'bg-cyan-300', play: playDarbukaDum },
  { id: 'darbuka_tek', name: 'Darbuka Tek', shortName: 'DK', category: 'percussion', defaultVelocity: 0.72, defaultPitch: 1, defaultDecay: 0.14, color: 'bg-cyan-200', play: playDarbukaTek },
  { id: 'riq', name: 'Riq', shortName: 'RQ', category: 'percussion', defaultVelocity: 0.58, defaultPitch: 1, defaultDecay: 0.18, color: 'bg-pink-300', play: playRiq },
  { id: 'frame_drum', name: 'Frame Drum', shortName: 'FD', category: 'percussion', defaultVelocity: 0.74, defaultPitch: 1, defaultDecay: 0.34, color: 'bg-stone-400', play: playFrameDrum },
  { id: 'bombo_leguero_low', name: 'Bombo Legüero Low', shortName: 'BL', category: 'percussion', defaultVelocity: 0.86, defaultPitch: 1, defaultDecay: 0.56, color: 'bg-lime-600', play: playBomboLegueroLow },
  { id: 'bombo_leguero_high', name: 'Bombo Legüero High', shortName: 'BH', category: 'percussion', defaultVelocity: 0.74, defaultPitch: 1, defaultDecay: 0.18, color: 'bg-lime-400', play: playBomboLegueroHigh },
  { id: 'bombo_leguero_rim', name: 'Bombo Legüero Rim', shortName: 'BR', category: 'percussion', defaultVelocity: 0.68, defaultPitch: 1, defaultDecay: 0.12, color: 'bg-lime-300', play: playBomboLegueroRim },
  // 808
  { id: '808-kick', name: '808 Kick', shortName: '8K', category: 'kick', defaultVelocity: 0.9, defaultPitch: 1, defaultDecay: 0.8, color: 'bg-red-600', play: play808Kick },
  { id: '808-snare', name: '808 Snare', shortName: '8S', category: 'snare', defaultVelocity: 0.8, defaultPitch: 1, defaultDecay: 0.35, color: 'bg-red-400', play: play808Snare },
];

export function getInstrument(id: string): DrumInstrument | undefined {
  return DRUM_INSTRUMENTS.find(i => i.id === id);
}
