// Rhythm Translation Engine — meter normalization, groove mapping, polyrhythm splitting

import type { StepPattern } from './blipbloxEngine';

// ─── Meter Normalization ─────────────────────────────────────

export interface MeterInfo {
  numerator: number;
  denominator: number;
  cycleLength: number;
}

/**
 * Convert a time signature to a step grid size.
 * 7/8 → 14, 6/8 → 12, 4/4 → 16, 12-beat → 12 or 16 approx
 */
export function normalizeMeter(
  timeSignature: [number, number],
  targetGrid?: 16 | 32
): { steps: number; subdivisionPerBeat: number } {
  const [num, denom] = timeSignature;

  if (targetGrid) {
    return { steps: targetGrid, subdivisionPerBeat: Math.round(targetGrid / num) };
  }

  // Natural step counts based on meter
  if (denom === 8) {
    // Compound / odd meters in 8ths
    const steps = num * 2; // each 8th = 2 subdivisions
    return { steps: Math.min(steps, 32), subdivisionPerBeat: 2 };
  }

  if (denom === 4) {
    const steps = num * 4; // 16th note grid
    return { steps: Math.min(steps, 32), subdivisionPerBeat: 4 };
  }

  // Fallback
  return { steps: 16, subdivisionPerBeat: 4 };
}

// ─── Groove Mapping ──────────────────────────────────────────

export interface GrooveOptions {
  swingAmount?: number; // 0-100
  humanize?: boolean;
  accentHigh?: number; // MIDI velocity for accents (default 110)
  accentLow?: number;  // MIDI velocity for ghost notes (default 40)
}

/**
 * Maps raw step velocities to MIDI-friendly velocity values
 * with optional swing and humanization.
 */
export function mapGroove(
  steps: number[],
  options: GrooveOptions = {}
): { midiPattern: number[]; velocityPattern: number[] } {
  const {
    accentHigh = 110,
    accentLow = 40,
    humanize = false,
  } = options;

  const midiPattern: number[] = [];
  const velocityPattern: number[] = [];

  for (let i = 0; i < steps.length; i++) {
    const vel = steps[i];
    if (vel <= 0) {
      midiPattern.push(0);
      velocityPattern.push(0);
    } else {
      midiPattern.push(1);
      // Map velocity ranges
      let midiVel: number;
      if (vel >= 0.9) {
        midiVel = accentHigh + Math.round((vel - 0.9) * 170); // 110-127
      } else if (vel < 0.5) {
        midiVel = accentLow + Math.round(vel * 60); // 40-70
      } else {
        midiVel = 70 + Math.round((vel - 0.5) * 80); // 70-110
      }

      if (humanize) {
        midiVel += Math.round((Math.random() - 0.5) * 10);
      }

      velocityPattern.push(Math.max(1, Math.min(127, midiVel)));
    }
  }

  return { midiPattern, velocityPattern };
}

// ─── Polyrhythm Splitting ────────────────────────────────────

export interface PolyLayer {
  channel: number;
  midiPattern: number[];
  velocityPattern: number[];
  label: string;
}

/**
 * Split a pattern with multiple tracks into separate MIDI channels
 * for polyrhythmic playback.
 */
export function splitPolyrhythm(
  tracks: { instrumentId: string; steps: number[]; subdivisions: number }[],
  baseChannel: number = 0
): PolyLayer[] {
  return tracks.map((track, idx) => {
    const groove = mapGroove(track.steps);
    return {
      channel: (baseChannel + idx) % 16,
      midiPattern: groove.midiPattern,
      velocityPattern: groove.velocityPattern,
      label: track.instrumentId,
    };
  });
}

// ─── Pattern Morphing ────────────────────────────────────────

export function morphPatterns(
  patternA: number[],
  patternB: number[],
  amount: number // 0 = all A, 1 = all B
): number[] {
  const maxLen = Math.max(patternA.length, patternB.length);
  return Array.from({ length: maxLen }, (_, i) => {
    const a = patternA[i % patternA.length] || 0;
    const b = patternB[i % patternB.length] || 0;
    return Math.random() < amount ? b : a;
  });
}

export function velocityMorph(
  vA: number[],
  vB: number[],
  amount: number
): number[] {
  const maxLen = Math.max(vA.length, vB.length);
  return Array.from({ length: maxLen }, (_, i) => {
    const a = vA[i % vA.length] || 0;
    const b = vB[i % vB.length] || 100;
    return Math.round(a * (1 - amount) + b * amount);
  });
}

export function fuseRhythms(
  patternA: { name: string; midiPattern: number[]; velocityPattern?: number[] },
  patternB: { name: string; midiPattern: number[]; velocityPattern?: number[] }
): { name: string; midiPattern: number[]; velocityPattern: number[] } {
  const maxLen = Math.max(patternA.midiPattern.length, patternB.midiPattern.length);
  const midiPattern: number[] = [];
  const velocityPattern: number[] = [];

  for (let i = 0; i < maxLen; i++) {
    const a = patternA.midiPattern[i % patternA.midiPattern.length] || 0;
    const b = patternB.midiPattern[i % patternB.midiPattern.length] || 0;
    midiPattern.push(a || b ? 1 : 0);

    const va = patternA.velocityPattern?.[i % (patternA.velocityPattern?.length || 1)] || 0;
    const vb = patternB.velocityPattern?.[i % (patternB.velocityPattern?.length || 1)] || 0;
    velocityPattern.push(Math.max(va, vb));
  }

  return {
    name: `${patternA.name} × ${patternB.name}`,
    midiPattern,
    velocityPattern,
  };
}
