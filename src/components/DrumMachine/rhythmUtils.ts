export type TimeSignature = [number, number];

export function parseMeter(meter: string): TimeSignature {
  const parts = meter.split("/");
  if (parts.length !== 2) {
    return [4, 4];
  }

  const numerator = Number(parts[0]);
  const denominator = Number(parts[1]);

  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
    return [4, 4];
  }

  if (numerator <= 0 || denominator <= 0) {
    return [4, 4];
  }

  return [numerator, denominator];
}

export function getBarDurationSeconds(
  bpm: number,
  timeSignature: TimeSignature
): number {
  const safeBpm = Math.max(1, bpm);
  const [numerator, denominator] = timeSignature;
  return (60 / safeBpm) * numerator * (4 / denominator);
}

export function getStepDurationSeconds(
  bpm: number,
  timeSignature: TimeSignature,
  subdivisions: number
): number {
  const safeSubdivisions = Math.max(1, subdivisions);
  return getBarDurationSeconds(bpm, timeSignature) / safeSubdivisions;
}

export function getSubdivisionBoundaries(grouping: number[]): Set<number> {
  const boundaries = new Set<number>();
  let offset = 0;

  for (const group of grouping) {
    boundaries.add(offset);
    offset += group;
  }

  return boundaries;
}

export function sanitizeFileStem(value: string): string {
  let result = "";
  let previousWasSeparator = false;

  for (const character of value) {
    const code = character.charCodeAt(0);
    const isUppercase = code >= 65 && code <= 90;
    const isLowercase = code >= 97 && code <= 122;
    const isDigit = code >= 48 && code <= 57;

    if (isUppercase || isLowercase || isDigit) {
      result += character.toLowerCase();
      previousWasSeparator = false;
      continue;
    }

    if (!previousWasSeparator && result.length > 0) {
      result += "_";
      previousWasSeparator = true;
    }
  }

  while (result.endsWith("_")) {
    result = result.slice(0, result.length - 1);
  }

  return result || "rhythm";
}

export function getTimeSignatureMetaValue(denominator: number): number {
  let power = 0;
  let current = 1;

  while (current < denominator) {
    current *= 2;
    power += 1;
  }

  return power;
}
