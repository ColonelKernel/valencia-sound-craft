import { mapGroove } from "../Blipblox/rhythmTranslator";
import type { PatternPreset } from "./drumPresets";

const ROLE_WEIGHTS: Record<PatternPreset["tracks"][number]["role"], number> = {
  timeline: 1,
  pulse: 0.9,
  bass: 0.88,
  lead: 0.72,
  slap: 0.7,
  texture: 0.56,
};

const PROTECTED_ROLES = new Set<PatternPreset["tracks"][number]["role"]>([
  "timeline",
  "pulse",
  "bass",
]);

function mapIndex(index: number, sourceLength: number, targetLength: number) {
  if (sourceLength <= 1 || targetLength <= 1) {
    return 0;
  }

  return Math.min(
    targetLength - 1,
    Math.round((index / (sourceLength - 1)) * (targetLength - 1))
  );
}

export interface CompositeGroove {
  rawPattern: number[];
  midiPattern: number[];
  velocityPattern: number[];
  protectedSteps: number[];
}

export function buildCompositeGroove(preset: PatternPreset): CompositeGroove {
  const length = preset.tracks[0]?.subdivisions ?? 0;
  const rawPattern = new Array(length).fill(0);
  const protectedSteps = new Set<number>();

  preset.tracks.forEach((track) => {
    const weight = ROLE_WEIGHTS[track.role] ?? 0.65;

    track.steps.forEach((step, index) => {
      if (step <= 0) {
        return;
      }

      rawPattern[index] = Math.min(1, Math.max(rawPattern[index], step * weight));

      if (PROTECTED_ROLES.has(track.role)) {
        protectedSteps.add(index);
      }
    });
  });

  let offset = 0;
  preset.pulseGrouping.forEach((groupSize) => {
    protectedSteps.add(Math.min(length - 1, offset));
    offset += groupSize;
  });

  const groove = mapGroove(rawPattern);

  return {
    rawPattern,
    midiPattern: groove.midiPattern,
    velocityPattern: groove.velocityPattern,
    protectedSteps: [...protectedSteps].sort((left, right) => left - right),
  };
}

export function resamplePatternValues(values: number[], targetLength: number) {
  if (targetLength <= 0) {
    return [];
  }

  if (values.length === targetLength) {
    return [...values];
  }

  const result = new Array(targetLength).fill(0);

  values.forEach((value, index) => {
    if (value <= 0) {
      return;
    }

    const targetIndex = mapIndex(index, values.length, targetLength);
    result[targetIndex] = Math.max(result[targetIndex], value);
  });

  return result;
}

export function resamplePatternIndices(indices: number[], sourceLength: number, targetLength: number) {
  return [...new Set(indices.map((index) => mapIndex(index, sourceLength, targetLength)))].sort(
    (left, right) => left - right
  );
}

export function buildSubdivisionMarkers(grouping: number[], targetLength: number) {
  const result = new Array(targetLength).fill(0);
  const totalUnits = grouping.reduce((sum, value) => sum + value, 0);

  if (targetLength <= 0 || totalUnits <= 0) {
    return result;
  }

  let consumed = 0;
  grouping.forEach((groupSize) => {
    const marker = Math.min(
      targetLength - 1,
      Math.round((consumed / totalUnits) * targetLength)
    );
    result[marker] = 1;
    consumed += groupSize;
  });

  return result;
}
