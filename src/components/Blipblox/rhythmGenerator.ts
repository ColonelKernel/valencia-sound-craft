// Rule-based Rhythm Generation Engine
// Generates culturally-informed rhythms from parameters

export interface GenerateOptions {
  region: 'african' | 'balkan' | 'flamenco' | 'indian' | 'latin' | 'general';
  meter: [number, number]; // e.g. [4,4], [7,8], [6,8]
  density: number;    // 0-1
  complexity: number; // 0-1
  swing: number;      // 0-1
  steps?: number;     // override step count (default: derived from meter)
  seed?: number;      // for reproducibility
}

export interface GeneratedRhythm {
  midiPattern: number[];
  velocityPattern: number[];
  subdivision: number[];
  region: string;
  meter: string;
}

// Seeded PRNG for reproducible generation
class SeededRandom {
  private s: number;
  constructor(seed: number) { this.s = seed; }
  next(): number {
    this.s = (this.s * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (this.s >>> 0) / 0xFFFFFFFF;
  }
}

function getStepCount(meter: [number, number], override?: number): number {
  if (override) return override;
  const [num, denom] = meter;
  if (denom === 8) return num * 2;
  return num * 4;
}

// ─── Region-Specific Generators ──────────────────────────────────────────

function generateAfrican(steps: number, density: number, complexity: number, rng: SeededRandom): { midi: number[]; vel: number[] } {
  const midi = new Array(steps).fill(0);
  const vel = new Array(steps).fill(0);

  // 3:2 polyrhythmic base
  const layer1Interval = Math.max(2, Math.round(steps / 4));
  const layer2Interval = Math.max(3, Math.round(steps / 3));

  // Layer 1: main pulse
  for (let i = 0; i < steps; i += layer1Interval) {
    midi[i] = 1;
    vel[i] = 100 + Math.round(rng.next() * 27);
  }

  // Layer 2: interlocking
  for (let i = Math.round(layer2Interval / 2); i < steps; i += layer2Interval) {
    if (midi[i] === 0 || rng.next() < 0.3) {
      midi[i] = 1;
      vel[i] = 80 + Math.round(rng.next() * 20);
    }
  }

  // Add density-based fills
  for (let i = 0; i < steps; i++) {
    if (midi[i] === 0 && rng.next() < density * 0.6) {
      midi[i] = 1;
      vel[i] = complexity > 0.5 ? 40 + Math.round(rng.next() * 30) : 60 + Math.round(rng.next() * 20);
    }
  }

  return { midi, vel };
}

function generateBalkan(steps: number, density: number, complexity: number, rng: SeededRandom): { midi: number[]; vel: number[] } {
  const midi = new Array(steps).fill(0);
  const vel = new Array(steps).fill(0);

  // Asymmetric groupings
  const groupings = steps <= 14
    ? [2, 2, 3, 2, 2, 3] // 7/8-style
    : [3, 2, 2, 3, 2, 2, 2]; // generic asymmetric

  let pos = 0;
  for (const group of groupings) {
    if (pos >= steps) break;
    // Accent on group start
    midi[pos] = 1;
    vel[pos] = 110 + Math.round(rng.next() * 17);

    // Add subdivisions based on density
    for (let j = 1; j < group && pos + j < steps; j++) {
      if (rng.next() < density * 0.5) {
        midi[pos + j] = 1;
        vel[pos + j] = 50 + Math.round(rng.next() * 30);
      }
    }
    pos += group;
  }

  return { midi, vel };
}

function generateFlamenco(steps: number, density: number, _complexity: number, rng: SeededRandom): { midi: number[]; vel: number[] } {
  const midi = new Array(steps).fill(0);
  const vel = new Array(steps).fill(0);

  // 12-beat compás accents: 3, 6, 8, 10, 12 (0-indexed: 2, 5, 7, 9, 11)
  const compasAccents = [2, 5, 7, 9, 11];
  const ratio = steps / 12;

  for (const accent of compasAccents) {
    const idx = Math.min(steps - 1, Math.round(accent * ratio));
    midi[idx] = 1;
    vel[idx] = 110 + Math.round(rng.next() * 17);
  }

  // Fill based on density
  for (let i = 0; i < steps; i++) {
    if (midi[i] === 0 && rng.next() < density * 0.4) {
      midi[i] = 1;
      vel[i] = 60 + Math.round(rng.next() * 25);
    }
  }

  return { midi, vel };
}

function generateIndian(steps: number, density: number, complexity: number, rng: SeededRandom): { midi: number[]; vel: number[] } {
  const midi = new Array(steps).fill(0);
  const vel = new Array(steps).fill(0);

  // Subdivision patterns: ta-ki-ta (3), ta-ka-di-mi (4), ta-din-gi-na-tom (5)
  const subdivs = complexity > 0.7 ? 5 : complexity > 0.4 ? 4 : 3;
  const groupSize = Math.max(2, Math.round(steps / subdivs));

  for (let g = 0; g < subdivs; g++) {
    const start = g * groupSize;
    if (start >= steps) break;

    // Sam (first beat) is strongest
    midi[start] = 1;
    vel[start] = g === 0 ? 127 : 100 + Math.round(rng.next() * 20);

    // Inner subdivisions
    for (let j = 1; j < groupSize && start + j < steps; j++) {
      if (rng.next() < density * 0.5) {
        midi[start + j] = 1;
        vel[start + j] = 40 + Math.round(rng.next() * 40);
      }
    }
  }

  return { midi, vel };
}

function generateLatin(steps: number, density: number, _complexity: number, rng: SeededRandom): { midi: number[]; vel: number[] } {
  const midi = new Array(steps).fill(0);
  const vel = new Array(steps).fill(0);

  // Son clave 3:2 base
  const clavePositions = steps === 16
    ? [0, 3, 6, 10, 12]  // 3:2 son clave
    : [0, Math.round(steps * 0.2), Math.round(steps * 0.375), Math.round(steps * 0.625), Math.round(steps * 0.75)];

  for (const pos of clavePositions) {
    if (pos < steps) {
      midi[pos] = 1;
      vel[pos] = 105 + Math.round(rng.next() * 22);
    }
  }

  // Density fills
  for (let i = 0; i < steps; i++) {
    if (midi[i] === 0 && rng.next() < density * 0.45) {
      midi[i] = 1;
      vel[i] = 55 + Math.round(rng.next() * 30);
    }
  }

  return { midi, vel };
}

function generateGeneral(steps: number, density: number, complexity: number, rng: SeededRandom): { midi: number[]; vel: number[] } {
  const midi = new Array(steps).fill(0);
  const vel = new Array(steps).fill(0);

  // Downbeats
  const beatInterval = Math.max(2, Math.round(steps / 4));
  for (let i = 0; i < steps; i += beatInterval) {
    midi[i] = 1;
    vel[i] = 100 + Math.round(rng.next() * 27);
  }

  // Density-weighted fills
  for (let i = 0; i < steps; i++) {
    if (midi[i] === 0 && rng.next() < density) {
      midi[i] = 1;
      const isOffbeat = i % beatInterval !== 0;
      vel[i] = isOffbeat
        ? (complexity > 0.5 ? 40 + Math.round(rng.next() * 30) : 70 + Math.round(rng.next() * 20))
        : 90 + Math.round(rng.next() * 20);
    }
  }

  return { midi, vel };
}

// ─── Main Generator ──────────────────────────────────────────────────────

const generators: Record<string, typeof generateAfrican> = {
  african: generateAfrican,
  balkan: generateBalkan,
  flamenco: generateFlamenco,
  indian: generateIndian,
  latin: generateLatin,
  general: generateGeneral,
};

export function generateRhythm(options: GenerateOptions): GeneratedRhythm {
  const { region, meter, density, complexity, swing, seed } = options;
  const rng = new SeededRandom(seed ?? Date.now());
  const steps = getStepCount(meter, options.steps);

  const gen = generators[region] || generators.general;
  const { midi, vel } = gen(steps, density, complexity, rng);

  // Apply swing to velocity (shift offbeats slightly louder/softer)
  if (swing > 0) {
    for (let i = 1; i < steps; i += 2) {
      if (vel[i] > 0) {
        vel[i] = Math.max(1, Math.min(127, vel[i] + Math.round((rng.next() - 0.5) * swing * 20)));
      }
    }
  }

  // Build subdivision array
  const subdivision = Array.from({ length: steps }, (_, i) => i % Math.max(1, Math.round(steps / meter[0])) === 0 ? 1 : 0);

  return {
    midiPattern: midi,
    velocityPattern: vel,
    subdivision,
    region,
    meter: `${meter[0]}/${meter[1]}`,
  };
}

export const REGION_OPTIONS: { value: GenerateOptions['region']; label: string }[] = [
  { value: 'african', label: 'African' },
  { value: 'balkan', label: 'Balkan' },
  { value: 'flamenco', label: 'Flamenco' },
  { value: 'indian', label: 'Indian' },
  { value: 'latin', label: 'Latin' },
  { value: 'general', label: 'General' },
];

export const METER_OPTIONS: { value: [number, number]; label: string }[] = [
  { value: [4, 4], label: '4/4' },
  { value: [3, 4], label: '3/4' },
  { value: [6, 8], label: '6/8' },
  { value: [7, 8], label: '7/8' },
  { value: [5, 4], label: '5/4' },
  { value: [12, 8], label: '12/8' },
];
