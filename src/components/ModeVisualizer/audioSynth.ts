// Web Audio API synth for note/chord previews

const NOTE_FREQUENCIES: Record<string, number> = {
  'C': 261.63, 'C#': 277.18, 'Db': 277.18,
  'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
  'E': 329.63, 'F': 349.23, 'F#': 369.99, 'Gb': 369.99,
  'G': 392.00, 'G#': 415.30, 'Ab': 415.30,
  'A': 440.00, 'A#': 466.16, 'Bb': 466.16,
  'B': 493.88,
};

export type InstrumentTimbre = 'piano' | 'guitar' | 'organ' | 'synth-pad' | 'bright-lead' | 'warm-bass';

export const INSTRUMENT_TIMBRES: { id: InstrumentTimbre; label: string }[] = [
  { id: 'piano', label: 'Piano' },
  { id: 'guitar', label: 'Guitar' },
  { id: 'organ', label: 'Organ' },
  { id: 'synth-pad', label: 'Synth Pad' },
  { id: 'bright-lead', label: 'Bright Lead' },
  { id: 'warm-bass', label: 'Warm Bass' },
];

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function applyTimbre(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  volume: number,
  timbre: InstrumentTimbre
): void {
  const gain = ctx.createGain();
  gain.connect(ctx.destination);

  switch (timbre) {
    case 'piano': {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      // Add a harmonic
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, startTime);
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(volume * 0.15, startTime);
      g2.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.6);
      osc2.connect(g2);
      g2.connect(ctx.destination);
      osc2.start(startTime);
      osc2.stop(startTime + duration);

      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.setValueAtTime(volume * 0.8, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      osc.start(startTime);
      osc.stop(startTime + duration);
      break;
    }
    case 'guitar': {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      // Quick attack, moderate decay
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(volume * 0.4, startTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      osc.start(startTime);
      osc.stop(startTime + duration);
      break;
    }
    case 'organ': {
      // Multiple harmonics for organ-like timbre
      [1, 2, 3, 4].forEach((harmonic, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * harmonic, startTime);
        const g = ctx.createGain();
        const hVol = volume * (i === 0 ? 1 : 0.5 / harmonic);
        g.gain.setValueAtTime(hVol, startTime);
        g.gain.setValueAtTime(hVol, startTime + duration - 0.05);
        g.gain.linearRampToValueAtTime(0, startTime + duration);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      });
      break;
    }
    case 'synth-pad': {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, startTime);
      osc2.frequency.setValueAtTime(freq * 1.005, startTime); // slight detune
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume * 0.5, startTime + 0.15);
      gain.gain.setValueAtTime(volume * 0.5, startTime + duration - 0.1);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);
      // Low-pass filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      filter.Q.value = 1;
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + duration);
      osc2.stop(startTime + duration);
      break;
    }
    case 'bright-lead': {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(volume * 0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      osc.start(startTime);
      osc.stop(startTime + duration);
      break;
    }
    case 'warm-bass': {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq / 2, startTime); // octave down
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq / 2, startTime);
      gain.gain.setValueAtTime(volume * 0.6, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(volume * 0.3, startTime);
      g2.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      osc2.connect(g2);
      g2.connect(ctx.destination);
      osc.start(startTime);
      osc2.start(startTime);
      osc.stop(startTime + duration);
      osc2.stop(startTime + duration);
      break;
    }
  }
}

export function playNote(note: string, octaveOffset = 0, duration = 0.4, timbre: InstrumentTimbre = 'piano'): void {
  const ctx = getAudioContext();
  const freq = NOTE_FREQUENCIES[note];
  if (!freq) return;

  const adjustedFreq = freq * Math.pow(2, octaveOffset);
  applyTimbre(ctx, adjustedFreq, ctx.currentTime, duration, 0.25, timbre);
}

export function playChord(notes: string[], duration = 0.8, timbre: InstrumentTimbre = 'piano'): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const volume = 0.15 / Math.max(notes.length, 1);

  notes.forEach((note, i) => {
    const freq = NOTE_FREQUENCIES[note];
    if (!freq) return;
    const startTime = now + i * 0.03;
    applyTimbre(ctx, freq, startTime, duration, volume, timbre);
  });
}

export function playScale(notes: string[], tempo = 200, timbre: InstrumentTimbre = 'piano'): void {
  notes.forEach((note, i) => {
    setTimeout(() => playNote(note, 0, 0.35, timbre), i * tempo);
  });
}
