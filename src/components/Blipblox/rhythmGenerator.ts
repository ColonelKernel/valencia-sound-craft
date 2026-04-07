import { mapGroove } from "./rhythmTranslator";
import { REGIONS, type Region } from "../DrumMachine/rhythmData";
import { DRUM_PRESETS, formatRegion, type PatternPreset } from "../DrumMachine/drumPresets";
import {
  buildCompositeGroove,
  buildSubdivisionMarkers,
  resamplePatternIndices,
  resamplePatternValues,
} from "../DrumMachine/rhythmComposition";

export type RegionType = Region | "general";

export interface GenerateOptions {
  region: RegionType;
  meter: [number, number];
  density: number;
  complexity: number;
  swing: number;
  steps?: number;
  seed?: number;
  subStyle?: string;
}

export interface GeneratedRhythm {
  midiPattern: number[];
  velocityPattern: number[];
  subdivision: number[];
  region: string;
  meter: string;
}

class SeededRandom {
  private s: number;

  constructor(seed: number) {
    this.s = seed >>> 0 || 1;
  }

  next(): number {
    this.s = (this.s * 1664525 + 1013904223) >>> 0;
    return this.s / 0xffffffff;
  }

  pick<T>(values: T[]) {
    if (values.length === 0) {
      return undefined;
    }

    const index = Math.floor(this.next() * values.length);
    return values[Math.max(0, Math.min(values.length - 1, index))];
  }
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getStepCount(meter: [number, number], override?: number) {
  if (override) {
    return override;
  }

  const [numerator, denominator] = meter;
  return denominator === 8 ? numerator * 2 : numerator * 4;
}

function sameMeter(left: [number, number], right: [number, number]) {
  return left[0] === right[0] && left[1] === right[1];
}

const PRESET_BY_ID = new Map(DRUM_PRESETS.map((preset) => [preset.presetKey, preset]));

function getPresetCandidates(region: RegionType, meter: [number, number]) {
  const pool = region === "general"
    ? DRUM_PRESETS
    : DRUM_PRESETS.filter((preset) => preset.region === region);

  const exactMeter = pool.filter((preset) => sameMeter(preset.timeSignature, meter));
  return exactMeter.length > 0 ? exactMeter : pool;
}

function selectBasePreset(region: RegionType, meter: [number, number], subStyle: string | undefined, rng: SeededRandom) {
  if (subStyle) {
    const direct = PRESET_BY_ID.get(subStyle);
    if (direct) {
      return direct;
    }
  }

  const candidates = getPresetCandidates(region, meter);
  return rng.pick(candidates) ?? DRUM_PRESETS[0];
}

function removeHits(rawPattern: number[], protectedSteps: Set<number>, targetHits: number) {
  const result = [...rawPattern];
  const removable = result
    .map((value, index) => ({ index, value }))
    .filter((entry) => entry.value > 0 && !protectedSteps.has(entry.index))
    .sort((left, right) => left.value - right.value);

  let activeHits = result.filter((value) => value > 0).length;

  while (activeHits > targetHits && removable.length > 0) {
    const next = removable.shift();
    if (!next) {
      break;
    }

    if (result[next.index] > 0) {
      result[next.index] = 0;
      activeHits -= 1;
    }
  }

  return result;
}

function addHits(rawPattern: number[], targetHits: number, complexity: number, rng: SeededRandom) {
  const result = [...rawPattern];
  const activeSet = new Set<number>();
  result.forEach((value, index) => {
    if (value > 0) {
      activeSet.add(index);
    }
  });

  let activeHits = activeSet.size;
  const candidateScores: Array<{ index: number; score: number }> = [];

  for (let index = 0; index < result.length; index += 1) {
    if (result[index] > 0) {
      continue;
    }

    const before = (index - 1 + result.length) % result.length;
    const after = (index + 1) % result.length;
    const nearHit = activeSet.has(before) || activeSet.has(after);
    const offbeat = index % 2 === 1;
    const score =
      (nearHit ? 0.9 : 0.2) +
      (offbeat ? 0.25 : 0.05) +
      complexity * 0.2 +
      rng.next() * 0.2;

    candidateScores.push({ index, score });
  }

  candidateScores.sort((left, right) => right.score - left.score);

  while (activeHits < targetHits && candidateScores.length > 0) {
    const next = candidateScores.shift();
    if (!next) {
      break;
    }

    result[next.index] = clamp(0.38 + complexity * 0.3, 0.3, 0.78);
    activeHits += 1;
  }

  return result;
}

function addGhostNotes(rawPattern: number[], complexity: number, rng: SeededRandom) {
  if (complexity < 0.6) {
    return rawPattern;
  }

  const result = [...rawPattern];

  result.forEach((value, index) => {
    if (value < 0.72 || rng.next() > complexity * 0.18) {
      return;
    }

    const ghostIndex = (index + 1) % result.length;
    if (result[ghostIndex] === 0) {
      result[ghostIndex] = 0.28 + complexity * 0.18;
    }
  });

  return result;
}

function shapeRawPattern(rawPattern: number[], protectedIndices: number[], density: number, complexity: number, rng: SeededRandom) {
  const protectedSteps = new Set(protectedIndices.filter((index) => rawPattern[index] > 0));
  const minHits = Math.max(1, protectedSteps.size);
  const targetHits = clamp(
    Math.round(rawPattern.length * (0.18 + density * 0.54)),
    minHits,
    rawPattern.length
  );

  let result = rawPattern.filter((value) => value > 0).length > targetHits
    ? removeHits(rawPattern, protectedSteps, targetHits)
    : [...rawPattern];

  if (result.filter((value) => value > 0).length < targetHits) {
    result = addHits(result, targetHits, complexity, rng);
  }

  result = addGhostNotes(result, complexity, rng);

  protectedSteps.forEach((index) => {
    result[index] = Math.max(result[index], 0.78);
  });

  return result.map((value) => clamp(value, 0, 1));
}

function applySwing(velocityPattern: number[], swing: number, rng: SeededRandom) {
  const next = [...velocityPattern];

  if (swing <= 0) {
    return next;
  }

  for (let index = 1; index < next.length; index += 2) {
    if (next[index] <= 0) {
      continue;
    }

    next[index] = clamp(
      next[index] + Math.round((rng.next() - 0.5) * swing * 18),
      1,
      127
    );
  }

  return next;
}

function buildPresetSubdivision(preset: PatternPreset, targetLength: number) {
  return buildSubdivisionMarkers(preset.pulseGrouping, targetLength);
}

export function generateRhythm(options: GenerateOptions): GeneratedRhythm {
  const { region, meter, density, complexity, swing, seed, subStyle } = options;
  const rng = new SeededRandom(seed ?? Date.now());
  const steps = getStepCount(meter, options.steps);
  const preset = selectBasePreset(region, meter, subStyle, rng);
  const composite = buildCompositeGroove(preset);
  const resizedRaw = resamplePatternValues(composite.rawPattern, steps);
  const resizedProtected = resamplePatternIndices(
    composite.protectedSteps,
    composite.rawPattern.length,
    steps
  );
  const shapedRaw = shapeRawPattern(resizedRaw, resizedProtected, density, complexity, rng);
  const groove = mapGroove(shapedRaw, {
    accentHigh: 114 + Math.round(complexity * 10),
    accentLow: 34 + Math.round(complexity * 12),
  });

  return {
    midiPattern: groove.midiPattern,
    velocityPattern: applySwing(groove.velocityPattern, swing, rng),
    subdivision: buildPresetSubdivision(preset, steps),
    region: region === "general" ? preset.region : region,
    meter: `${meter[0]}/${meter[1]}`,
  };
}

export const REGION_SUB_STYLES: Record<string, { value: string; label: string }[]> = Object.fromEntries(
  [
    ...REGIONS.map((region) => [
      region,
      DRUM_PRESETS
        .filter((preset) => preset.region === region)
        .map((preset) => ({
          value: preset.presetKey,
          label: `${preset.name} (${preset.country})`,
        })),
    ]),
    ["general", []],
  ]
) as Record<string, { value: string; label: string }[]>;

export const REGION_OPTIONS: { value: GenerateOptions["region"]; label: string }[] = [
  ...REGIONS.map((region) => ({
    value: region,
    label: formatRegion(region),
  })),
  { value: "general", label: "General" },
];

export const METER_OPTIONS: { value: [number, number]; label: string }[] = [
  { value: [4, 4], label: "4/4" },
  { value: [3, 4], label: "3/4" },
  { value: [5, 8], label: "5/8" },
  { value: [6, 8], label: "6/8" },
  { value: [7, 8], label: "7/8" },
  { value: [8, 8], label: "8/8" },
  { value: [9, 8], label: "9/8" },
  { value: [10, 8], label: "10/8" },
  { value: [11, 8], label: "11/8" },
  { value: [12, 8], label: "12/8" },
  { value: [13, 8], label: "13/8" },
  { value: [15, 8], label: "15/8" },
];
