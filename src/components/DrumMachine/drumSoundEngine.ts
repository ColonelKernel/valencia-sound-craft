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
  // 808
  { id: '808-kick', name: '808 Kick', shortName: '8K', category: 'kick', defaultVelocity: 0.9, defaultPitch: 1, defaultDecay: 0.8, color: 'bg-red-600', play: play808Kick },
  { id: '808-snare', name: '808 Snare', shortName: '8S', category: 'snare', defaultVelocity: 0.8, defaultPitch: 1, defaultDecay: 0.35, color: 'bg-red-400', play: play808Snare },
];

export function getInstrument(id: string): DrumInstrument | undefined {
  return DRUM_INSTRUMENTS.find(i => i.id === id);
}
