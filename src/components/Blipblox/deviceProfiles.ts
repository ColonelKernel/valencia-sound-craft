// Device-specific translation profiles for Blipblox hardware

import type { StepPattern } from './blipbloxEngine';

// ─── MIDI Note Maps ──────────────────────────────────────────

// Standard GM drum map used by MyTracks
const MYTRACKS_DRUM_MAP: Record<string, number> = {
  kick: 36, snare: 38, rim: 37, clap: 39,
  'hh-closed': 42, 'hh-open': 46, 'hh-pedal': 44,
  'crash': 49, 'ride': 51, 'ride-bell': 53,
  'tom-high': 50, 'tom-mid': 47, 'tom-low': 45, 'tom-floor': 43,
  'conga-high': 62, 'conga-low': 63, 'conga-slap': 61,
  'bongo-high': 60, 'bongo-low': 61,
  'timbale-high': 65, 'timbale-low': 66,
  'cowbell': 56, 'clave': 75, 'guiro': 73, 'shaker': 70,
  'tambourine': 54, 'bell': 56, 'woodblock': 76,
  'agogo-high': 67, 'agogo-low': 68,
};

// Scale degree to MIDI note (relative to root)
const SCALE_INTERVALS: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  pentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10],
};

const ROOT_MIDI: Record<string, number> = {
  'C': 60, 'C#': 61, 'Db': 61, 'D': 62, 'D#': 63, 'Eb': 63,
  'E': 64, 'F': 65, 'F#': 66, 'Gb': 66, 'G': 67, 'G#': 68,
  'Ab': 68, 'A': 69, 'A#': 70, 'Bb': 70, 'B': 71,
};

// ─── MyTracks Profile ────────────────────────────────────────

export interface MyTracksOptions {
  stepMode: 16 | 32;
  instrumentId?: string;
}

export function translateForMyTracks(
  midiPattern: number[],
  velocityPattern: number[] | undefined,
  bpm: number,
  options: MyTracksOptions = { stepMode: 16 }
): { pattern: StepPattern; note: number } {
  const targetSteps = options.stepMode;
  const note = MYTRACKS_DRUM_MAP[options.instrumentId || 'kick'] || 36;

  // Resize pattern to target step count
  const resized = resizePattern(midiPattern, targetSteps);
  const resizedVel = velocityPattern ? resizeVelocity(velocityPattern, targetSteps) : undefined;

  return {
    pattern: { midiPattern: resized, velocityPattern: resizedVel, bpm },
    note,
  };
}

// ─── SK2 Profile ─────────────────────────────────────────────

export interface SK2Options {
  root: string;
  scale: string;
  octave?: number;
  chordNotes?: number[]; // MIDI notes for chord injection
}

export function translateForSK2(
  midiPattern: number[],
  velocityPattern: number[] | undefined,
  bpm: number,
  options: SK2Options
): { patterns: { note: number; pattern: StepPattern }[] } {
  const rootMidi = ROOT_MIDI[options.root] || 60;
  const octaveOffset = ((options.octave ?? 4) - 4) * 12;
  const intervals = SCALE_INTERVALS[options.scale.toLowerCase()] || SCALE_INTERVALS.major;

  // Generate melodic pattern from rhythm
  const scaleNotes = intervals.map(i => rootMidi + octaveOffset + i);

  // If chord notes provided, use those; otherwise arpeggiate through scale
  const notePool = options.chordNotes && options.chordNotes.length > 0
    ? options.chordNotes
    : scaleNotes;

  // Create arpeggiated patterns — one note per active step
  const patterns: { note: number; pattern: StepPattern }[] = [];
  let noteIdx = 0;

  // Group active steps into a single melodic line
  const melodicPattern = midiPattern.map(step => {
    if (step === 1) {
      const note = notePool[noteIdx % notePool.length];
      noteIdx++;
      return note;
    }
    return -1;
  });

  // Create one pattern per unique note
  const uniqueNotes = [...new Set(melodicPattern.filter(n => n >= 0))];
  for (const note of uniqueNotes) {
    const stepPattern = melodicPattern.map(n => n === note ? 1 : 0);
    const velPattern = velocityPattern
      ? melodicPattern.map((n, i) => n === note ? (velocityPattern[i] || 100) : 0)
      : undefined;
    patterns.push({
      note,
      pattern: { midiPattern: stepPattern, velocityPattern: velPattern, bpm },
    });
  }

  return { patterns };
}

// ─── After Dark Profile ──────────────────────────────────────

export interface AfterDarkOptions {
  ccNumber?: number; // default CC 1 (mod wheel)
  evolve?: boolean;
}

export function translateForAfterDark(
  midiPattern: number[],
  velocityPattern: number[] | undefined,
  bpm: number,
  options: AfterDarkOptions = {}
): { ccMessages: { step: number; cc: number; value: number }[]; pattern: StepPattern } {
  const cc = options.ccNumber ?? 1;
  const ccMessages: { step: number; cc: number; value: number }[] = [];

  const evolvedPattern = [...midiPattern];
  const evolvedVelocity = velocityPattern ? [...velocityPattern] : midiPattern.map(s => s ? 100 : 0);

  midiPattern.forEach((step, i) => {
    if (step === 1) {
      let value = velocityPattern ? velocityPattern[i] : 100;
      // Evolving: add gradual intensity shift
      if (options.evolve) {
        const phase = (i / midiPattern.length) * Math.PI * 2;
        const modulation = Math.sin(phase) * 20;
        value = Math.max(0, Math.min(127, Math.round(value + modulation)));
      }
      ccMessages.push({ step: i, cc, value });
    }
  });

  return {
    ccMessages,
    pattern: { midiPattern: evolvedPattern, velocityPattern: evolvedVelocity, bpm },
  };
}

// ─── Utilities ───────────────────────────────────────────────

function resizePattern(pattern: number[], targetLength: number): number[] {
  if (pattern.length === targetLength) return [...pattern];
  const result = new Array(targetLength).fill(0);
  const ratio = pattern.length / targetLength;
  for (let i = 0; i < targetLength; i++) {
    const srcIdx = Math.floor(i * ratio);
    result[i] = pattern[srcIdx] || 0;
  }
  return result;
}

function resizeVelocity(velocity: number[], targetLength: number): number[] {
  if (velocity.length === targetLength) return [...velocity];
  const result = new Array(targetLength).fill(0);
  const ratio = velocity.length / targetLength;
  for (let i = 0; i < targetLength; i++) {
    const srcIdx = Math.floor(i * ratio);
    result[i] = velocity[srcIdx] || 0;
  }
  return result;
}

export function getDeviceNote(deviceType: string, instrumentId?: string): number {
  if (deviceType === 'mytracks') return MYTRACKS_DRUM_MAP[instrumentId || 'kick'] || 36;
  if (deviceType === 'sk2') return ROOT_MIDI['C'] || 60;
  return 60;
}
