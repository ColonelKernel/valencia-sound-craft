import { getAudioContext } from "@/music-core/audioContext";
import type { NormalizedGroove } from "./types";

// ─── Audio Context ───
function getCtx() {
  return getAudioContext();
}

// ─── Pattern Generation ───
// Generate a 16-step drum pattern from groove parameters
export interface DrumPattern {
  kick:   { step: number; vel: number }[];
  snare:  { step: number; vel: number }[];
  hihat:  { step: number; vel: number }[];
  perc:   { step: number; vel: number }[];
}

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

export function generatePattern(g: NormalizedGroove): DrumPattern {
  const rand = seededRandom(hashId(g.id));
  const steps = 16;
  const baseVel = 0.5 + g.norm_velocity * 0.4;

  // Kick: strong beats + density-based fills
  const kick: DrumPattern["kick"] = [];
  kick.push({ step: 0, vel: baseVel + 0.15 });
  kick.push({ step: 8, vel: baseVel + 0.1 });
  if (g.norm_density > 0.3) kick.push({ step: 4, vel: baseVel * 0.7 });
  if (g.norm_density > 0.6) kick.push({ step: 10, vel: baseVel * 0.6 });
  // Syncopation: add off-beat kicks
  if (g.norm_syncopation > 0.3) kick.push({ step: 3, vel: baseVel * 0.5 });
  if (g.norm_syncopation > 0.6) kick.push({ step: 11, vel: baseVel * 0.45 });

  // Snare: backbeats
  const snare: DrumPattern["snare"] = [];
  snare.push({ step: 4, vel: baseVel + 0.1 });
  snare.push({ step: 12, vel: baseVel + 0.05 });
  if (g.norm_syncopation > 0.4) snare.push({ step: 7, vel: baseVel * 0.4 });
  if (g.norm_density > 0.7) {
    snare.push({ step: 14, vel: baseVel * 0.35 });
  }

  // Hi-hat: density determines pattern
  const hihat: DrumPattern["hihat"] = [];
  const hhInterval = g.norm_density > 0.5 ? 1 : g.norm_density > 0.25 ? 2 : 4;
  for (let i = 0; i < steps; i += hhInterval) {
    const accent = i % 4 === 0 ? 0.15 : 0;
    const ghosting = g.norm_velocity * (rand() * 0.3 - 0.15);
    hihat.push({ step: i, vel: Math.max(0.15, 0.4 + accent + ghosting) });
  }

  // Perc: syncopation-driven ghost notes
  const perc: DrumPattern["perc"] = [];
  const percCount = Math.floor(g.norm_syncopation * 6);
  const usedSteps = new Set([...kick, ...snare, ...hihat].map(h => h.step));
  for (let i = 0; i < percCount; i++) {
    let s: number;
    do { s = Math.floor(rand() * steps); } while (usedSteps.has(s));
    usedSteps.add(s);
    perc.push({ step: s, vel: 0.2 + rand() * 0.25 });
  }

  return { kick, snare, hihat, perc };
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ─── Drum Synthesis ───

function synthKick(ac: AudioContext, time: number, vel: number) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);
  g.gain.setValueAtTime(vel * 0.6, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
  osc.connect(g).connect(ac.destination);
  osc.start(time);
  osc.stop(time + 0.4);

  // Sub click
  const click = ac.createOscillator();
  const cg = ac.createGain();
  click.type = "triangle";
  click.frequency.setValueAtTime(4000, time);
  click.frequency.exponentialRampToValueAtTime(100, time + 0.015);
  cg.gain.setValueAtTime(vel * 0.15, time);
  cg.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
  click.connect(cg).connect(ac.destination);
  click.start(time);
  click.stop(time + 0.03);
}

function synthSnare(ac: AudioContext, time: number, vel: number) {
  // Tone body
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(200, time);
  osc.frequency.exponentialRampToValueAtTime(120, time + 0.05);
  g.gain.setValueAtTime(vel * 0.35, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
  osc.connect(g).connect(ac.destination);
  osc.start(time);
  osc.stop(time + 0.2);

  // Noise burst
  const buf = ac.createBuffer(1, ac.sampleRate * 0.12, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
  const noise = ac.createBufferSource();
  noise.buffer = buf;
  const bpf = ac.createBiquadFilter();
  bpf.type = "bandpass";
  bpf.frequency.value = 4000;
  bpf.Q.value = 1.5;
  const ng = ac.createGain();
  ng.gain.setValueAtTime(vel * 0.3, time);
  ng.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
  noise.connect(bpf).connect(ng).connect(ac.destination);
  noise.start(time);
  noise.stop(time + 0.15);
}

function synthHihat(ac: AudioContext, time: number, vel: number, open = false) {
  const buf = ac.createBuffer(1, ac.sampleRate * (open ? 0.15 : 0.04), ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
  const noise = ac.createBufferSource();
  noise.buffer = buf;
  const hpf = ac.createBiquadFilter();
  hpf.type = "highpass";
  hpf.frequency.value = 7000;
  const g = ac.createGain();
  const dur = open ? 0.15 : 0.04;
  g.gain.setValueAtTime(vel * 0.18, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + dur);
  noise.connect(hpf).connect(g).connect(ac.destination);
  noise.start(time);
  noise.stop(time + dur + 0.01);
}

function synthPerc(ac: AudioContext, time: number, vel: number) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(800, time);
  osc.frequency.exponentialRampToValueAtTime(300, time + 0.04);
  g.gain.setValueAtTime(vel * 0.2, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
  osc.connect(g).connect(ac.destination);
  osc.start(time);
  osc.stop(time + 0.1);
}

// ─── Playback Engine ───

export interface PlaybackState {
  playing: boolean;
  currentStep: number;
  pattern: DrumPattern | null;
  grooveId: string | null;
}

let _loopTimer: number | null = null;
let _currentStep = -1;
let _currentPattern: DrumPattern | null = null;
let _currentGrooveId: string | null = null;
let _onStepChange: ((step: number) => void) | null = null;
const _stepListeners = new Set<(step: number) => void>();
const _stateListeners = new Set<(state: PlaybackState) => void>();

function emitStep(step: number) {
  _onStepChange?.(step);
  for (const listener of _stepListeners) listener(step);
}

function emitState() {
  const snapshot: PlaybackState = {
    playing: _loopTimer !== null,
    currentStep: _currentStep,
    pattern: _currentPattern,
    grooveId: _currentGrooveId,
  };

  for (const listener of _stateListeners) listener(snapshot);
}

export function subscribePlaybackSteps(listener: (step: number) => void) {
  _stepListeners.add(listener);
  listener(_currentStep);
  return () => {
    _stepListeners.delete(listener);
  };
}

export function subscribePlaybackState(listener: (state: PlaybackState) => void) {
  _stateListeners.add(listener);
  listener(getPlaybackState());
  return () => {
    _stateListeners.delete(listener);
  };
}

export function getPlaybackState(): PlaybackState {
  return {
    playing: _loopTimer !== null,
    currentStep: _currentStep,
    pattern: _currentPattern,
    grooveId: _currentGrooveId,
  };
}

export function stopPlayback() {
  if (_loopTimer !== null) {
    clearInterval(_loopTimer);
    _loopTimer = null;
  }
  _currentStep = -1;
  _currentPattern = null;
  _currentGrooveId = null;
  emitStep(-1);
  emitState();
}

export function startPlayback(
  groove: NormalizedGroove,
  pattern: DrumPattern,
  onStep?: (step: number) => void
) {
  stopPlayback();
  const ac = getCtx();
  _onStepChange = onStep ?? null;
  _currentPattern = pattern;
  _currentGrooveId = groove.id;

  const bpm = groove.bpm;
  // 16th note interval: 60 / bpm / 4
  const stepMs = (60 / bpm / 4) * 1000;
  const swingAmount = groove.norm_swing * 0.06; // max 60ms swing

  _currentStep = 0;
  emitState();

  const tick = () => {
    const step = _currentStep % 16;
    const now = ac.currentTime;

    // Apply swing to even-numbered 8th-note offbeats (steps 1, 3, 5, 7, 9, 11, 13, 15)
    const swingOffset = (step % 2 === 1) ? swingAmount : 0;
    const schedTime = now + swingOffset;

    // Play hits at this step
    for (const h of pattern.kick)   if (h.step === step) synthKick(ac, schedTime, h.vel);
    for (const h of pattern.snare)  if (h.step === step) synthSnare(ac, schedTime, h.vel);
    for (const h of pattern.hihat)  if (h.step === step) synthHihat(ac, schedTime, h.vel);
    for (const h of pattern.perc)   if (h.step === step) synthPerc(ac, schedTime, h.vel);

    emitStep(step);
    _currentStep++;
  };

  tick(); // immediate first hit
  _loopTimer = window.setInterval(tick, stepMs);
}

// ─── One-shot selection sound (legacy compat) ───
export function playGrooveSequence(density: number, swing: number, velocity: number) {
  const ac = getCtx();
  const now = ac.currentTime;
  synthKick(ac, now, 0.3 + velocity * 0.3);
  synthHihat(ac, now + 0.01, 0.15 + density * 0.15);
}

// ─── MIDI Export ───

export function generateMidiFile(groove: NormalizedGroove, pattern: DrumPattern): Uint8Array {
  const bpm = groove.bpm;
  const ppq = 480; // ticks per quarter note
  const ticksPerStep = ppq / 4; // 16th note = quarter / 4

  const events: { tick: number; channel: number; note: number; vel: number; dur: number }[] = [];

  const KICK_NOTE = 36, SNARE_NOTE = 38, HH_NOTE = 42, PERC_NOTE = 56;

  for (const h of pattern.kick)  events.push({ tick: h.step * ticksPerStep, channel: 9, note: KICK_NOTE, vel: Math.round(h.vel * 127), dur: ticksPerStep });
  for (const h of pattern.snare) events.push({ tick: h.step * ticksPerStep, channel: 9, note: SNARE_NOTE, vel: Math.round(h.vel * 127), dur: ticksPerStep });
  for (const h of pattern.hihat) events.push({ tick: h.step * ticksPerStep, channel: 9, note: HH_NOTE, vel: Math.round(h.vel * 127), dur: ticksPerStep });
  for (const h of pattern.perc)  events.push({ tick: h.step * ticksPerStep, channel: 9, note: PERC_NOTE, vel: Math.round(h.vel * 127), dur: ticksPerStep });

  events.sort((a, b) => a.tick - b.tick);

  // Build MIDI bytes
  const trackData: number[] = [];

  // Tempo meta event
  const uspqn = Math.round(60000000 / bpm);
  trackData.push(0x00, 0xFF, 0x51, 0x03,
    (uspqn >> 16) & 0xFF, (uspqn >> 8) & 0xFF, uspqn & 0xFF);

  // Track name
  const name = `${groove.genre} ${groove.bpm}bpm`;
  const nameBytes = Array.from(name).map(c => c.charCodeAt(0));
  trackData.push(0x00, 0xFF, 0x03, nameBytes.length, ...nameBytes);

  // Note events
  let prevTick = 0;
  for (const ev of events) {
    // Note on
    const delta1 = ev.tick - prevTick;
    trackData.push(...vlq(delta1));
    trackData.push(0x90 | ev.channel, ev.note, ev.vel);
    prevTick = ev.tick;

    // Note off
    trackData.push(...vlq(ev.dur));
    trackData.push(0x80 | ev.channel, ev.note, 0);
    prevTick = ev.tick + ev.dur;
  }

  // End of track
  trackData.push(0x00, 0xFF, 0x2F, 0x00);

  // Header chunk
  const header = [
    0x4D, 0x54, 0x68, 0x64, // MThd
    0x00, 0x00, 0x00, 0x06, // chunk length
    0x00, 0x00,             // format 0
    0x00, 0x01,             // 1 track
    (ppq >> 8) & 0xFF, ppq & 0xFF,
  ];

  // Track chunk
  const trackLen = trackData.length;
  const track = [
    0x4D, 0x54, 0x72, 0x6B, // MTrk
    (trackLen >> 24) & 0xFF, (trackLen >> 16) & 0xFF,
    (trackLen >> 8) & 0xFF, trackLen & 0xFF,
    ...trackData,
  ];

  return new Uint8Array([...header, ...track]);
}

function vlq(value: number): number[] {
  if (value < 0) value = 0;
  const bytes: number[] = [];
  bytes.unshift(value & 0x7F);
  value >>= 7;
  while (value > 0) {
    bytes.unshift((value & 0x7F) | 0x80);
    value >>= 7;
  }
  return bytes;
}

export function downloadMidi(groove: NormalizedGroove, pattern: DrumPattern) {
  const data = generateMidiFile(groove, pattern);
  const blob = new Blob([data.buffer as ArrayBuffer], { type: "audio/midi" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `groove_${groove.genre}_${groove.bpm}bpm.mid`;
  a.click();
  URL.revokeObjectURL(url);
}
