// Rule-based Rhythm Generation Engine
// Generates culturally-informed rhythms from parameters

export type RegionType = 'african' | 'balkan' | 'flamenco' | 'indian' | 'latin' | 'general';
export type FlamencoSubStyle = 'buleria' | 'solea';
export type LatinClaveType = '2-3' | '3-2' | 'rumba';

export interface GenerateOptions {
  region: RegionType;
  meter: [number, number];
  density: number;
  complexity: number;
  swing: number;
  steps?: number;
  seed?: number;
  subStyle?: string; // e.g. 'buleria', 'solea', '2-3', '3-2', 'rumba', 'teentaal', 'jhaptaal', 'rupak'
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

// Euclidean rhythm distribution — E(k, n)
function euclidean(hits: number, steps: number): number[] {
  const pattern = new Array(steps).fill(0);
  if (hits <= 0) return pattern;
  if (hits >= steps) return new Array(steps).fill(1);
  for (let i = 0; i < hits; i++) {
    pattern[Math.floor((i * steps) / hits)] = 1;
  }
  return pattern;
}

// ─── Region-Specific Generators ──────────────────────────────────────────

function generateAfrican(steps: number, density: number, complexity: number, rng: SeededRandom): { midi: number[]; vel: number[] } {
  const midi = new Array(steps).fill(0);
  const vel = new Array(steps).fill(0);

  // Layer 1: 3:2 polyrhythm using Euclidean distribution
  const layer1 = euclidean(3, Math.min(steps, 8));
  const layer2 = euclidean(2, Math.min(steps, 8));

  // Apply layer 1 across full pattern
  for (let i = 0; i < steps; i++) {
    const l1idx = i % layer1.length;
    if (layer1[l1idx] === 1) {
      midi[i] = 1;
      vel[i] = 100 + Math.round(rng.next() * 27);
    }
  }

  // Layer 2: interlocking pattern offset by half
  const offset = Math.floor(layer2.length / 2);
  for (let i = 0; i < steps; i++) {
    const l2idx = (i + offset) % layer2.length;
    if (layer2[l2idx] === 1 && (midi[i] === 0 || rng.next() < 0.3)) {
      midi[i] = 1;
      vel[i] = 80 + Math.round(rng.next() * 20);
    }
  }

  // Call-and-response: second half echoes first with offset
  if (complexity > 0.4 && steps >= 8) {
    const half = Math.floor(steps / 2);
    const responseOffset = 1 + Math.floor(rng.next() * 2);
    for (let i = 0; i < half; i++) {
      const src = i;
      const dst = half + ((i + responseOffset) % half);
      if (midi[src] === 1 && midi[dst] === 0 && rng.next() < complexity * 0.5) {
        midi[dst] = 1;
        vel[dst] = Math.max(40, vel[src] - 15 - Math.round(rng.next() * 10));
      }
    }
  }

  // Density-based fills
  for (let i = 0; i < steps; i++) {
    if (midi[i] === 0 && rng.next() < density * 0.5) {
      midi[i] = 1;
      vel[i] = complexity > 0.5 ? 40 + Math.round(rng.next() * 30) : 60 + Math.round(rng.next() * 20);
    }
  }

  return { midi, vel };
}

// Balkan grouping presets by meter
const BALKAN_GROUPINGS: Record<string, number[][]> = {
  '5/8':  [[2, 3], [3, 2]],
  '7/8':  [[2, 2, 3], [3, 2, 2], [2, 3, 2]],
  '9/8':  [[2, 2, 2, 3], [3, 2, 2, 2], [2, 3, 2, 2]],
  '11/8': [[2, 2, 3, 2, 2], [3, 2, 2, 2, 2], [2, 3, 2, 2, 2]],
};

function getBalkanGrouping(meter: [number, number] | undefined, steps: number, complexity: number): number[] {
  const meterKey = meter ? `${meter[0]}/${meter[1]}` : '';
  const groupOptions = BALKAN_GROUPINGS[meterKey];

  if (groupOptions && groupOptions.length > 0) {
    const idx = Math.min(groupOptions.length - 1, Math.floor(complexity * groupOptions.length));
    return groupOptions[idx];
  }

  return steps <= 14 ? [2, 2, 3, 2, 2, 3] : [3, 2, 2, 3, 2, 2, 2];
}

function generateBalkan(steps: number, density: number, complexity: number, rng: SeededRandom, meter?: [number, number]): { midi: number[]; vel: number[] } {
  const midi = new Array(steps).fill(0);
  const vel = new Array(steps).fill(0);
  const groupings = getBalkanGrouping(meter, steps, complexity);

  let pos = 0;
  for (const group of groupings) {
    if (pos >= steps) break;
    // Accent on group start
    midi[pos] = 1;
    vel[pos] = 110 + Math.round(rng.next() * 17);

    // Inner subdivisions based on density
    for (let j = 1; j < group && pos + j < steps; j++) {
      if (rng.next() < density * 0.5) {
        midi[pos + j] = 1;
        vel[pos + j] = 50 + Math.round(rng.next() * 30);
      }
    }
    pos += group;
  }

  // Fill remaining steps if groupings didn't cover all
  while (pos < steps) {
    if (rng.next() < density * 0.3) {
      midi[pos] = 1;
      vel[pos] = 45 + Math.round(rng.next() * 25);
    }
    pos++;
  }

  return { midi, vel };
}

// Flamenco compás patterns
const FLAMENCO_ACCENTS: Record<string, { accents: number[]; density_mod: number }> = {
  buleria: { accents: [0, 3, 6, 8, 10], density_mod: 1.0 },
  solea:   { accents: [0, 3, 6, 8, 10], density_mod: 0.6 },
};

function generateFlamenco(steps: number, density: number, _complexity: number, rng: SeededRandom, subStyle?: string): { midi: number[]; vel: number[] } {
  const midi = new Array(steps).fill(0);
  const vel = new Array(steps).fill(0);

  const style = FLAMENCO_ACCENTS[subStyle || 'buleria'] || FLAMENCO_ACCENTS.buleria;
  const ratio = steps / 12;

  for (const accent of style.accents) {
    const idx = Math.min(steps - 1, Math.round(accent * ratio));
    midi[idx] = 1;
    vel[idx] = 110 + Math.round(rng.next() * 17);
  }

  // Fill based on density (modulated by sub-style)
  const effectiveDensity = density * style.density_mod;
  for (let i = 0; i < steps; i++) {
    if (midi[i] === 0 && rng.next() < effectiveDensity * 0.4) {
      midi[i] = 1;
      vel[i] = 60 + Math.round(rng.next() * 25);
    }
  }

  return { midi, vel };
}

// Indian tala structures
const TALA_STRUCTURES: Record<string, number[]> = {
  teentaal: [4, 4, 4, 4],      // 16 beats
  jhaptaal: [2, 3, 2, 3],      // 10 beats
  rupak:    [3, 2, 2],          // 7 beats
};

function generateIndian(steps: number, density: number, complexity: number, rng: SeededRandom, subStyle?: string): { midi: number[]; vel: number[] } {
  const midi = new Array(steps).fill(0);
  const vel = new Array(steps).fill(0);

  const tala = TALA_STRUCTURES[subStyle || ''] || null;

  if (tala) {
    // Use tala structure
    let pos = 0;
    const totalBeats = tala.reduce((a, b) => a + b, 0);
    const scale = steps / totalBeats;

    for (let vibhag = 0; vibhag < tala.length; vibhag++) {
      const beatCount = tala[vibhag];
      const startStep = Math.round(pos * scale);

      // Sam (first beat of first vibhag) is strongest
      if (startStep < steps) {
        midi[startStep] = 1;
        vel[startStep] = vibhag === 0 ? 127 : 100 + Math.round(rng.next() * 20);
      }

      // Subdivisions within vibhag
      for (let b = 1; b < beatCount; b++) {
        const subStep = Math.round((pos + b) * scale);
        if (subStep < steps && rng.next() < density * 0.6) {
          midi[subStep] = 1;
          // Map syllabic density to velocity variation
          const syllables = complexity > 0.7 ? 5 : complexity > 0.4 ? 4 : 3;
          vel[subStep] = 40 + Math.round(rng.next() * (syllables * 8));
        }
      }
      pos += beatCount;
    }
  } else {
    // Generic Indian subdivision
    const subdivs = complexity > 0.7 ? 5 : complexity > 0.4 ? 4 : 3;
    const groupSize = Math.max(2, Math.round(steps / subdivs));

    for (let g = 0; g < subdivs; g++) {
      const start = g * groupSize;
      if (start >= steps) break;
      midi[start] = 1;
      vel[start] = g === 0 ? 127 : 100 + Math.round(rng.next() * 20);

      for (let j = 1; j < groupSize && start + j < steps; j++) {
        if (rng.next() < density * 0.5) {
          midi[start + j] = 1;
          vel[start + j] = 40 + Math.round(rng.next() * 40);
        }
      }
    }
  }

  return { midi, vel };
}

// Latin clave variants
const CLAVE_PATTERNS: Record<string, number[]> = {
  '2-3': [0, 3, 7, 10, 12],   // 2-3 son clave (16th note positions)
  '3-2': [0, 3, 6, 10, 12],   // 3-2 son clave
  'rumba': [0, 3, 7, 10, 13], // Rumba clave
};

function generateLatin(steps: number, density: number, _complexity: number, rng: SeededRandom, subStyle?: string): { midi: number[]; vel: number[] } {
  const midi = new Array(steps).fill(0);
  const vel = new Array(steps).fill(0);

  const claveType = subStyle || '2-3';
  const claveBase = CLAVE_PATTERNS[claveType] || CLAVE_PATTERNS['2-3'];

  // Scale clave positions to current step count
  const clavePositions = steps === 16
    ? claveBase
    : claveBase.map(p => Math.min(steps - 1, Math.round(p * steps / 16)));

  for (const pos of clavePositions) {
    if (pos < steps) {
      midi[pos] = 1;
      vel[pos] = 105 + Math.round(rng.next() * 22);
    }
  }

  // Tumbao bass layer (on the "and" beats)
  if (density > 0.3) {
    for (let i = 2; i < steps; i += 4) {
      if (midi[i] === 0 && rng.next() < 0.5) {
        midi[i] = 1;
        vel[i] = 70 + Math.round(rng.next() * 20);
      }
    }
  }

  // Density fills
  for (let i = 0; i < steps; i++) {
    if (midi[i] === 0 && rng.next() < density * 0.35) {
      midi[i] = 1;
      vel[i] = 55 + Math.round(rng.next() * 30);
    }
  }

  return { midi, vel };
}

function generateGeneral(steps: number, density: number, complexity: number, rng: SeededRandom): { midi: number[]; vel: number[] } {
  const midi = new Array(steps).fill(0);
  const vel = new Array(steps).fill(0);

  const beatInterval = Math.max(2, Math.round(steps / 4));
  for (let i = 0; i < steps; i += beatInterval) {
    midi[i] = 1;
    vel[i] = 100 + Math.round(rng.next() * 27);
  }

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

type GenFn = (steps: number, density: number, complexity: number, rng: SeededRandom, extra?: string, meter?: [number, number]) => { midi: number[]; vel: number[] };

function wrappedBalkan(steps: number, density: number, complexity: number, rng: SeededRandom, _sub?: string, meter?: [number, number]) {
  return generateBalkan(steps, density, complexity, rng, meter);
}
function wrappedFlamenco(steps: number, density: number, complexity: number, rng: SeededRandom, sub?: string) {
  return generateFlamenco(steps, density, complexity, rng, sub);
}
function wrappedIndian(steps: number, density: number, complexity: number, rng: SeededRandom, sub?: string) {
  return generateIndian(steps, density, complexity, rng, sub);
}
function wrappedLatin(steps: number, density: number, complexity: number, rng: SeededRandom, sub?: string) {
  return generateLatin(steps, density, complexity, rng, sub);
}
function wrappedAfrican(steps: number, density: number, complexity: number, rng: SeededRandom) {
  return generateAfrican(steps, density, complexity, rng);
}
function wrappedGeneral(steps: number, density: number, complexity: number, rng: SeededRandom) {
  return generateGeneral(steps, density, complexity, rng);
}

function buildSubdivisionFromGroups(steps: number, groups: number[]): number[] {
  const subdivision = new Array(steps).fill(0);
  const totalUnits = groups.reduce((sum, group) => sum + group, 0);

  if (steps === 0) return subdivision;
  if (totalUnits <= 0) {
    subdivision[0] = 1;
    return subdivision;
  }

  let position = 0;
  groups.forEach((group) => {
    const index = Math.min(steps - 1, Math.round((position / totalUnits) * steps));
    subdivision[index] = 1;
    position += group;
  });

  return subdivision;
}

function getSubdivisionPattern(
  region: RegionType,
  meter: [number, number],
  steps: number,
  subStyle: string | undefined,
  complexity: number
): number[] {
  if (region === 'balkan') {
    return buildSubdivisionFromGroups(steps, getBalkanGrouping(meter, steps, complexity));
  }

  if (region === 'flamenco') {
    return buildSubdivisionFromGroups(steps, [3, 3, 2, 2, 2]);
  }

  if (region === 'indian' && subStyle && TALA_STRUCTURES[subStyle]) {
    return buildSubdivisionFromGroups(steps, TALA_STRUCTURES[subStyle]);
  }

  const beatGroups = new Array(Math.max(1, meter[0])).fill(1);
  return buildSubdivisionFromGroups(steps, beatGroups);
}

const generators: Record<string, GenFn> = {
  african: wrappedAfrican,
  balkan: wrappedBalkan,
  flamenco: wrappedFlamenco,
  indian: wrappedIndian,
  latin: wrappedLatin,
  general: wrappedGeneral,
};

export function generateRhythm(options: GenerateOptions): GeneratedRhythm {
  const { region, meter, density, complexity, swing, seed, subStyle } = options;
  const rng = new SeededRandom(seed ?? Date.now());
  const steps = getStepCount(meter, options.steps);

  const gen = generators[region] || generators.general;
  const { midi, vel } = gen(steps, density, complexity, rng, subStyle, meter);

  // Apply swing to velocity
  if (swing > 0) {
    for (let i = 1; i < steps; i += 2) {
      if (vel[i] > 0) {
        vel[i] = Math.max(1, Math.min(127, vel[i] + Math.round((rng.next() - 0.5) * swing * 20)));
      }
    }
  }

  const subdivision = getSubdivisionPattern(region, meter, steps, subStyle, complexity);

  return {
    midiPattern: midi,
    velocityPattern: vel,
    subdivision,
    region,
    meter: `${meter[0]}/${meter[1]}`,
  };
}

// ─── Sub-style options per region ────────────────────────────────────────

export const REGION_SUB_STYLES: Record<string, { value: string; label: string }[]> = {
  african: [],
  balkan: [],
  flamenco: [
    { value: 'buleria', label: 'Bulería' },
    { value: 'solea', label: 'Soleá' },
  ],
  indian: [
    { value: 'teentaal', label: 'Teentaal (4+4+4+4)' },
    { value: 'jhaptaal', label: 'Jhaptaal (2+3+2+3)' },
    { value: 'rupak', label: 'Rupak (3+2+2)' },
  ],
  latin: [
    { value: '2-3', label: '2-3 Son Clave' },
    { value: '3-2', label: '3-2 Son Clave' },
    { value: 'rumba', label: 'Rumba Clave' },
  ],
  general: [],
};

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
  { value: [5, 8], label: '5/8' },
  { value: [6, 8], label: '6/8' },
  { value: [7, 8], label: '7/8' },
  { value: [9, 8], label: '9/8' },
  { value: [11, 8], label: '11/8' },
  { value: [5, 4], label: '5/4' },
  { value: [12, 8], label: '12/8' },
];
