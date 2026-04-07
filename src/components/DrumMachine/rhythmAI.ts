import {
  REGION_LABELS,
  RHYTHM_PATTERNS,
  filterRhythms,
  type InstrumentRole,
  type Region,
  type RhythmPattern,
  type Timbre,
} from "./rhythmData";
import { RhythmPatternSchema } from "./rhythmValidation";

export type { InstrumentRole, Region, RhythmPattern, Timbre } from "./rhythmData";

export type RhythmRules = {
  requiredRoles: InstrumentRole[];
  maxDensity: number;
  minDensity: number;
  syncopationBias: number;
  allowedSubdivisions: number[][];
  claveRequired?: boolean;
};

export interface GrooveMetrics {
  density: number;
  syncopation: number;
  hits: number;
  accents: number;
}

export interface RhythmValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
  groove: Record<string, GrooveMetrics>;
}

export interface GenerateRhythmOptions {
  seed?: number;
  maxAttempts?: number;
}

export const RHYTHM_RULES: Record<Region, RhythmRules> = {
  afro_cuban: {
    requiredRoles: ["timeline", "bass"],
    maxDensity: 0.6,
    minDensity: 0.2,
    syncopationBias: 0.7,
    allowedSubdivisions: [[2, 2, 2, 2]],
    claveRequired: true,
  },
  flamenco: {
    requiredRoles: ["timeline", "slap"],
    maxDensity: 0.7,
    minDensity: 0.3,
    syncopationBias: 0.8,
    allowedSubdivisions: [[3, 3, 2, 2, 2]],
  },
  west_africa: {
    requiredRoles: ["timeline", "bass"],
    maxDensity: 0.8,
    minDensity: 0.3,
    syncopationBias: 0.9,
    allowedSubdivisions: [[3, 2], [2, 3]],
  },
  balkans: {
    requiredRoles: ["pulse"],
    maxDensity: 0.7,
    minDensity: 0.3,
    syncopationBias: 0.6,
    allowedSubdivisions: [[2, 2, 3], [3, 2, 2]],
  },
  brazil: {
    requiredRoles: ["bass", "timeline"],
    maxDensity: 0.6,
    minDensity: 0.3,
    syncopationBias: 0.5,
    allowedSubdivisions: [[2, 2]],
  },
  india: {
    requiredRoles: ["lead"],
    maxDensity: 0.9,
    minDensity: 0.4,
    syncopationBias: 0.8,
    allowedSubdivisions: [[3], [4], [5]],
  },
  argentina: {
    requiredRoles: ["bass"],
    maxDensity: 0.6,
    minDensity: 0.3,
    syncopationBias: 0.6,
    allowedSubdivisions: [[3, 3, 2]],
  },
  middle_east: {
    requiredRoles: ["timeline"],
    maxDensity: 0.7,
    minDensity: 0.3,
    syncopationBias: 0.7,
    allowedSubdivisions: [[2, 2, 2, 3]],
  },
};

const ROLE_DENSITY_OFFSETS: Record<InstrumentRole, number> = {
  pulse: 0.12,
  timeline: -0.06,
  bass: -0.1,
  slap: 0.04,
  lead: 0.08,
  texture: 0.14,
};

const ROLE_SYNC_OFFSETS: Record<InstrumentRole, number> = {
  pulse: 0.02,
  timeline: -0.04,
  bass: -0.1,
  slap: 0.12,
  lead: 0.12,
  texture: 0.08,
};

const CLAVE_PATTERNS: Record<NonNullable<RhythmPattern["clave"]>, number[]> = {
  "2-3": [0, 3, 6, 10, 12],
  "3-2": [0, 3, 7, 10, 13],
};

const FLAMENCO_TIMELINE = [0, 3, 6, 8, 10];

class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0 || 1;
  }

  next() {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 4294967296;
  }

  int(maxExclusive: number) {
    if (maxExclusive <= 1) return 0;
    return Math.floor(this.next() * maxExclusive);
  }

  pick<T>(values: T[]) {
    if (values.length === 0) return undefined;
    return values[this.int(values.length)];
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function uniq(values: number[]) {
  return [...new Set(values)].sort((left, right) => left - right);
}

function shuffle<T>(values: T[], rng: SeededRandom) {
  const next = values.slice();
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = rng.int(index + 1);
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function binary(steps: number[]) {
  return steps.map((step) => (step > 0 ? 1 : 0));
}

function emptyPattern(length: number) {
  return new Array(length).fill(0);
}

function sameSubdivision(left: number[], right: number[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function allowedSubdivision(region: Region, subdivision: number[]) {
  return RHYTHM_RULES[region].allowedSubdivisions.some((candidate) =>
    sameSubdivision(candidate, subdivision)
  );
}

function patternLength(rhythm: RhythmPattern) {
  const first = Object.values(rhythm.pattern)[0];
  return first ? first.length : 0;
}

function resamplePattern(steps: number[], targetLength: number) {
  const normalized = binary(steps);
  if (normalized.length === targetLength) {
    return normalized.slice();
  }

  const next = emptyPattern(targetLength);
  normalized.forEach((step, index) => {
    if (step !== 1) return;
    const mappedIndex = Math.min(
      targetLength - 1,
      Math.round((index / Math.max(1, normalized.length)) * targetLength)
    );
    next[mappedIndex] = 1;
  });

  if (next.every((step) => step === 0) && normalized.some((step) => step === 1)) {
    next[0] = 1;
  }

  return next;
}

function rotatePattern(steps: number[], offset: number) {
  const length = steps.length;
  if (length === 0) return [];
  const next = emptyPattern(length);
  steps.forEach((step, index) => {
    const target = (index + offset + length) % length;
    next[target] = step;
  });
  return next;
}

function mergePatterns(primary: number[], secondary: number[]) {
  return primary.map((step, index) => (step === 1 || secondary[index] === 1 ? 1 : 0));
}

function getSyncTarget(syncopationBias: number, role: InstrumentRole) {
  return clamp(syncopationBias / 2 + ROLE_SYNC_OFFSETS[role], 0, 0.5);
}

function getDensityTarget(rules: RhythmRules, role: InstrumentRole) {
  const midpoint = (rules.minDensity + rules.maxDensity) / 2;
  return clamp(
    midpoint + ROLE_DENSITY_OFFSETS[role],
    Math.max(0.1, rules.minDensity - 0.1),
    Math.min(0.95, rules.maxDensity + 0.18)
  );
}

function getSubdivisionStarts(length: number, subdivision: number[]) {
  if (length <= 0) return [];
  const total = Math.max(1, sum(subdivision));
  const starts: number[] = [];
  let offset = 0;

  subdivision.forEach((group) => {
    starts.push(Math.min(length - 1, Math.round((offset / total) * length)));
    offset += group;
  });

  return uniq(starts);
}

function getOffbeats(length: number) {
  const offbeats: number[] = [];
  for (let index = 1; index < length; index += 2) {
    offbeats.push(index);
  }
  return offbeats;
}

function getNeighborIndices(indices: number[], length: number, offset: number) {
  return uniq(
    indices.map((index) => {
      const next = (index + offset) % length;
      return next < 0 ? next + length : next;
    })
  );
}

function positionsToPattern(positions: number[], sourceLength: number, targetLength: number) {
  const next = emptyPattern(targetLength);
  positions.forEach((position) => {
    const mapped = Math.min(
      targetLength - 1,
      Math.round((position / Math.max(1, sourceLength)) * targetLength)
    );
    next[mapped] = 1;
  });
  return next;
}

function fallbackTimeline(
  region: Region,
  length: number,
  subdivision: number[],
  clave: RhythmPattern["clave"]
) {
  if (region === "afro_cuban") {
    return positionsToPattern(CLAVE_PATTERNS[clave ?? "2-3"], 16, length);
  }

  if (region === "flamenco") {
    return positionsToPattern(FLAMENCO_TIMELINE, 12, length);
  }

  const starts = getSubdivisionStarts(length, subdivision);
  const next = emptyPattern(length);
  starts.forEach((index) => {
    next[index] = 1;
  });
  return next;
}

function fallbackPattern(
  region: Region,
  role: InstrumentRole,
  length: number,
  subdivision: number[],
  rules: RhythmRules,
  clave: RhythmPattern["clave"],
  rng: SeededRandom
) {
  const starts = getSubdivisionStarts(length, subdivision);
  const offbeats = getOffbeats(length);
  const afterStarts = getNeighborIndices(starts, length, 1);
  const next = emptyPattern(length);

  if (role === "timeline") {
    return fallbackTimeline(region, length, subdivision, clave);
  }

  if (role === "bass") {
    starts.forEach((index, startIndex) => {
      if (startIndex === 0 || startIndex % 2 === 0) {
        next[index] = 1;
      }
    });
    if (next.every((step) => step === 0)) next[0] = 1;
    return next;
  }

  if (role === "pulse") {
    starts.forEach((index) => {
      next[index] = 1;
    });
    return next;
  }

  const targetDensity = getDensityTarget(rules, role);
  const syncTarget = getSyncTarget(rules.syncopationBias, role);
  const pool = syncTarget > 0.2 ? [...afterStarts, ...offbeats] : [...starts, ...afterStarts];

  shuffle(uniq(pool), rng)
    .slice(0, Math.max(2, Math.round(length * targetDensity * 0.8)))
    .forEach((index) => {
      next[index] = 1;
    });

  if (next.every((step) => step === 0) && starts[0] !== undefined) {
    next[starts[0]] = 1;
  }

  return next;
}

function roleTemplate(region: Region, role: InstrumentRole) {
  for (const rhythm of filterRhythms({ region })) {
    const timbre = rhythm.instruments.find((candidate) => candidate.role === role);
    if (timbre) return { ...timbre };
  }

  return {
    id: `${region}_${role}`,
    name: `${REGION_LABELS[region]} ${role}`,
    instrument: role,
    role,
    midiNote: role === "bass" ? 36 : role === "timeline" ? 56 : 39,
  } satisfies Timbre;
}

function rolePattern(
  rhythm: RhythmPattern,
  role: InstrumentRole,
  targetLength: number
) {
  const timbre = rhythm.instruments.find((candidate) => candidate.role === role);
  if (!timbre) return null;
  const steps = rhythm.pattern[timbre.id];
  return steps ? resamplePattern(steps, targetLength) : null;
}

function timbrePattern(
  rhythm: RhythmPattern,
  timbre: Timbre,
  targetLength: number
) {
  const direct = rhythm.pattern[timbre.id];
  if (direct) return resamplePattern(direct, targetLength);
  return rolePattern(rhythm, timbre.role, targetLength);
}

function closestAllowedSubdivision(region: Region, subdivision: number[]) {
  return (
    RHYTHM_RULES[region].allowedSubdivisions
      .slice()
      .sort((left, right) => {
        const leftDelta = Math.abs(sum(left) - sum(subdivision)) + Math.abs(left.length - subdivision.length);
        const rightDelta = Math.abs(sum(right) - sum(subdivision)) + Math.abs(right.length - subdivision.length);
        return leftDelta - rightDelta;
      })[0] ?? RHYTHM_RULES[region].allowedSubdivisions[0]
  ).slice();
}

function cloneRhythm(rhythm: RhythmPattern): RhythmPattern {
  return {
    ...rhythm,
    subdivision: rhythm.subdivision.slice(),
    tempoRange: [...rhythm.tempoRange] as [number, number],
    instruments: rhythm.instruments.map((timbre) => ({ ...timbre })),
    pattern: Object.fromEntries(
      Object.entries(rhythm.pattern).map(([key, steps]) => [key, binary(steps)])
    ),
    tags: rhythm.tags.slice(),
  };
}

function selectableSeeds(region: Region) {
  return filterRhythms({ region });
}

function selectSeed(region: Region, rng: SeededRandom, excludeId?: string) {
  const candidates = selectableSeeds(region).filter((rhythm) => rhythm.id !== excludeId);
  return rng.pick(candidates) ?? selectableSeeds(region)[0] ?? RHYTHM_PATTERNS[0];
}

function chooseSubdivision(region: Region, seed: RhythmPattern, rng: SeededRandom) {
  const rules = RHYTHM_RULES[region];
  const exact = rules.allowedSubdivisions.find((candidate) =>
    sameSubdivision(candidate, seed.subdivision)
  );
  return (exact ?? rng.pick(rules.allowedSubdivisions) ?? rules.allowedSubdivisions[0]).slice();
}

function pickEditableIndex(
  steps: number[],
  desiredValue: 0 | 1,
  candidates: number[],
  protectedIndices: Set<number>,
  rng: SeededRandom
) {
  const exact = shuffle(
    candidates.filter(
      (index) =>
        steps[index] === desiredValue &&
        (desiredValue === 0 || !protectedIndices.has(index))
    ),
    rng
  );

  if (exact[0] !== undefined) return exact[0];

  const fallback = shuffle(
    steps
      .map((step, index) => ({ step, index }))
      .filter(
        ({ step, index }) =>
          step === desiredValue &&
          (desiredValue === 0 || !protectedIndices.has(index))
      )
      .map(({ index }) => index),
    rng
  );

  return fallback[0];
}

function preferredAddOrder(role: InstrumentRole, subdivision: number[], length: number) {
  const starts = getSubdivisionStarts(length, subdivision);
  const offbeats = getOffbeats(length);
  const afterStarts = getNeighborIndices(starts, length, 1);
  const beforeStarts = getNeighborIndices(starts, length, -1);

  if (role === "timeline") return uniq([...starts, ...afterStarts]);
  if (role === "bass") return uniq([0, ...starts, ...beforeStarts]);
  if (role === "pulse") return uniq([...starts, ...offbeats]);
  return uniq([...afterStarts, ...offbeats, ...beforeStarts]);
}

function preferredRemoveOrder(role: InstrumentRole, subdivision: number[], length: number) {
  const starts = getSubdivisionStarts(length, subdivision);
  const offbeats = getOffbeats(length);
  const afterStarts = getNeighborIndices(starts, length, 1);

  if (role === "timeline" || role === "bass") return uniq([...offbeats, ...afterStarts]);
  if (role === "pulse") return uniq([...afterStarts, ...offbeats]);
  return uniq([...starts, ...afterStarts, ...offbeats]);
}

function protectedIndices(
  region: Region,
  role: InstrumentRole,
  subdivision: number[],
  length: number,
  clave: RhythmPattern["clave"]
) {
  if (role === "timeline") {
    return fallbackTimeline(region, length, subdivision, clave)
      .map((step, index) => (step === 1 ? index : -1))
      .filter((index) => index >= 0);
  }

  if (role === "bass") {
    return uniq([0, ...getSubdivisionStarts(length, subdivision).filter((_, index) => index % 2 === 0)]);
  }

  if (role === "pulse") {
    return getSubdivisionStarts(length, subdivision);
  }

  return [];
}

function nudgeDensity(
  steps: number[],
  targetDensity: number,
  region: Region,
  role: InstrumentRole,
  subdivision: number[],
  clave: RhythmPattern["clave"],
  rng: SeededRandom
) {
  const next = steps.slice();
  const locked = new Set(protectedIndices(region, role, subdivision, next.length, clave));
  const addOrder = preferredAddOrder(role, subdivision, next.length);
  const removeOrder = preferredRemoveOrder(role, subdivision, next.length);
  const tolerance = 1 / Math.max(8, next.length);
  let guard = next.length * 8;

  while (calculateDensity(next) + tolerance < targetDensity && guard > 0) {
    const index = pickEditableIndex(next, 0, addOrder, locked, rng);
    if (index === undefined) break;
    next[index] = 1;
    guard -= 1;
  }

  while (calculateDensity(next) - tolerance > targetDensity && guard > 0) {
    const index = pickEditableIndex(next, 1, removeOrder, locked, rng);
    if (index === undefined) break;
    next[index] = 0;
    guard -= 1;
  }

  return next;
}

function nudgeSync(
  steps: number[],
  targetSync: number,
  region: Region,
  role: InstrumentRole,
  subdivision: number[],
  clave: RhythmPattern["clave"],
  rng: SeededRandom
) {
  const next = steps.slice();
  const locked = new Set(protectedIndices(region, role, subdivision, next.length, clave));
  const offbeats = getOffbeats(next.length);
  const onbeats = next.map((_, index) => index).filter((index) => index % 2 === 0);
  const tolerance = 1 / Math.max(8, next.length);
  let guard = next.length * 6;

  while (calculateSyncopation(next) + tolerance < targetSync && guard > 0) {
    const index = pickEditableIndex(next, 0, offbeats, locked, rng);
    if (index === undefined) break;
    next[index] = 1;
    guard -= 1;
  }

  while (calculateSyncopation(next) - tolerance > targetSync && guard > 0) {
    const index = pickEditableIndex(next, 1, offbeats, locked, rng);
    if (index !== undefined) {
      next[index] = 0;
      guard -= 1;
      continue;
    }

    const onbeat = pickEditableIndex(next, 0, onbeats, locked, rng);
    if (onbeat === undefined) break;
    next[onbeat] = 1;
    guard -= 1;
  }

  return next;
}

function enforceRoleCharacter(
  steps: number[],
  region: Region,
  role: InstrumentRole,
  subdivision: number[],
  clave: RhythmPattern["clave"]
) {
  const next = steps.slice();
  const starts = getSubdivisionStarts(next.length, subdivision);
  const offbeats = getOffbeats(next.length);

  if (role === "timeline") {
    return mergePatterns(next, fallbackTimeline(region, next.length, subdivision, clave));
  }

  if (role === "bass") {
    next[0] = 1;
    return next;
  }

  if ((role === "slap" || role === "lead" || role === "texture") && !offbeats.some((index) => next[index] === 1)) {
    const candidate = offbeats[0] ?? 1;
    if (candidate < next.length) next[candidate] = 1;
  }

  if (role === "pulse") {
    starts.forEach((index) => {
      next[index] = 1;
    });
  }

  return next;
}

function blendPatterns(
  primary: number[],
  secondary: number[],
  role: InstrumentRole,
  rng: SeededRandom
) {
  const shifted = role === "lead" || role === "slap"
    ? rotatePattern(secondary, 1)
    : secondary;

  return primary.map((step, index) => {
    const alternate = shifted[index];
    if (step === 1 && alternate === 1) return 1;
    if (step === 1 || alternate === 1) {
      if (role === "timeline" || role === "bass" || role === "pulse") return 1;
      return rng.next() < 0.68 ? 1 : 0;
    }
    return 0;
  });
}

function generateTrack(
  region: Region,
  timbre: Timbre,
  subdivision: number[],
  primary: RhythmPattern,
  secondary: RhythmPattern,
  clave: RhythmPattern["clave"],
  rng: SeededRandom
) {
  const rules = RHYTHM_RULES[region];
  const targetLength = patternLength(primary);
  const basePattern =
    timbrePattern(primary, timbre, targetLength) ??
    fallbackPattern(region, timbre.role, targetLength, subdivision, rules, clave, rng);
  const alternatePattern =
    timbrePattern(secondary, timbre, targetLength) ??
    rolePattern(secondary, timbre.role, targetLength) ??
    basePattern;
  let next = blendPatterns(basePattern, alternatePattern, timbre.role, rng);
  next = nudgeDensity(
    next,
    getDensityTarget(rules, timbre.role),
    region,
    timbre.role,
    subdivision,
    clave,
    rng
  );
  next = nudgeSync(
    next,
    getSyncTarget(rules.syncopationBias, timbre.role),
    region,
    timbre.role,
    subdivision,
    clave,
    rng
  );
  return enforceRoleCharacter(next, region, timbre.role, subdivision, clave);
}

function timelineSimilarity(steps: number[]) {
  return Math.max(
    ...Object.values(CLAVE_PATTERNS).map((positions) => {
      const skeleton = positionsToPattern(positions, 16, steps.length);
      const matched = skeleton.filter((step, index) => step === 1 && steps[index] === 1).length;
      return matched / Math.max(1, skeleton.filter((step) => step === 1).length);
    })
  );
}

export function calculateDensity(pattern: number[]) {
  if (pattern.length === 0) return 0;
  const hits = pattern.filter((step) => step === 1).length;
  return hits / pattern.length;
}

export function calculateSyncopation(pattern: number[]) {
  if (pattern.length === 0) return 0;
  let offbeatHits = 0;

  for (let index = 1; index < pattern.length; index += 2) {
    if (pattern[index] === 1) offbeatHits += 1;
  }

  return offbeatHits / pattern.length;
}

export function analyzeRhythm(rhythm: RhythmPattern) {
  return Object.fromEntries(
    rhythm.instruments.map((timbre) => {
      const steps = binary(rhythm.pattern[timbre.id] ?? []);
      const accents = getSubdivisionStarts(steps.length, rhythm.subdivision).filter(
        (index) => steps[index] === 1
      ).length;
      return [
        timbre.id,
        {
          density: calculateDensity(steps),
          syncopation: calculateSyncopation(steps),
          hits: steps.filter((step) => step === 1).length,
          accents,
        },
      ];
    })
  ) as Record<string, GrooveMetrics>;
}

export function scoreRhythm(rhythm: RhythmPattern): number {
  const rules = RHYTHM_RULES[rhythm.region];
  const groove = analyzeRhythm(rhythm);
  const roleSet = new Set(rhythm.instruments.map((timbre) => timbre.role));
  const starts = getSubdivisionStarts(patternLength(rhythm), rhythm.subdivision);
  let score = 0;
  let maxScore = 0;

  rhythm.instruments.forEach((timbre) => {
    const metrics = groove[timbre.id];
    const densityTarget = getDensityTarget(rules, timbre.role);
    const syncTarget = getSyncTarget(rules.syncopationBias, timbre.role);
    const densityScore = Math.max(
      0,
      1 - Math.abs(metrics.density - densityTarget) / Math.max(0.08, rules.maxDensity - rules.minDensity + 0.08)
    );
    const syncScore = Math.max(0, 1 - Math.abs(metrics.syncopation - syncTarget) / 0.28);
    const accentScore = Math.min(1, metrics.accents / Math.max(1, starts.length));

    score += densityScore * 2;
    score += syncScore * 2;
    score += accentScore;
    maxScore += 5;
  });

  rules.requiredRoles.forEach((role) => {
    score += roleSet.has(role) ? 2 : 0;
    maxScore += 2;
  });

  if (rules.claveRequired) {
    const timeline = rhythm.instruments.find((timbre) => timbre.role === "timeline");
    const timelinePattern = timeline ? binary(rhythm.pattern[timeline.id] ?? []) : [];
    score += timelinePattern.length > 0
      ? Math.max(timelineSimilarity(timelinePattern), rhythm.clave ? 0.8 : 0) * 2
      : 0;
    maxScore += 2;
  }

  if (allowedSubdivision(rhythm.region, rhythm.subdivision)) {
    score += 1;
  }
  maxScore += 1;

  return Number(((score / Math.max(1, maxScore)) * 10).toFixed(2));
}

export function validateRhythm(rhythm: RhythmPattern): RhythmValidationResult {
  const parsed = RhythmPatternSchema.safeParse(rhythm);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!parsed.success) {
    parsed.error.issues.forEach((issue) => {
      errors.push(issue.message);
    });

    return {
      valid: false,
      errors,
      warnings,
      score: 0,
      groove: {},
    };
  }

  const rules = RHYTHM_RULES[rhythm.region];
  const groove = analyzeRhythm(rhythm);
  const roles = new Set(rhythm.instruments.map((timbre) => timbre.role));
  const starts = getSubdivisionStarts(patternLength(rhythm), rhythm.subdivision);
  const lengths = Object.values(rhythm.pattern).map((steps) => steps.length);

  if (new Set(lengths).size > 1) {
    errors.push("All instrument patterns must have the same length");
  }

  if (!allowedSubdivision(rhythm.region, rhythm.subdivision)) {
    errors.push(`Subdivision ${rhythm.subdivision.join("+")} is not allowed for ${rhythm.region}`);
  }

  rules.requiredRoles.forEach((role) => {
    if (!roles.has(role)) {
      errors.push(`Missing required role: ${role}`);
    }
  });

  rhythm.instruments.forEach((timbre) => {
    const metrics = groove[timbre.id];
    const densityWindow = timbre.role === "texture" ? 0.22 : 0.18;
    const syncTarget = getSyncTarget(rules.syncopationBias, timbre.role);

    if (metrics.density < Math.max(0.05, rules.minDensity - densityWindow)) {
      errors.push(`${timbre.id} is too sparse`);
    } else if (metrics.density < rules.minDensity) {
      warnings.push(`${timbre.id} is below the target density`);
    }

    if (metrics.density > Math.min(0.98, rules.maxDensity + densityWindow)) {
      errors.push(`${timbre.id} is too dense`);
    } else if (metrics.density > rules.maxDensity && timbre.role !== "texture") {
      warnings.push(`${timbre.id} is above the target density`);
    }

    if (Math.abs(metrics.syncopation - syncTarget) > 0.26) {
      warnings.push(`${timbre.id} is rhythmically misaligned for ${timbre.role}`);
    }

    if ((timbre.role === "timeline" || timbre.role === "pulse" || timbre.role === "bass") && metrics.accents === 0) {
      errors.push(`${timbre.id} is missing structural accents`);
    }

    if (timbre.role === "bass") {
      const steps = binary(rhythm.pattern[timbre.id] ?? []);
      if (steps[0] !== 1) {
        warnings.push("Bass should ground beat 1");
      }
    }

    if (timbre.role === "timeline" && starts.length > 0) {
      const steps = binary(rhythm.pattern[timbre.id] ?? []);
      const accentCoverage = starts.filter((index) => steps[index] === 1).length / starts.length;
      if (accentCoverage < 0.5) {
        warnings.push("Timeline should articulate the cycle more clearly");
      }
    }
  });

  if (rules.claveRequired) {
    const timeline = rhythm.instruments.find((timbre) => timbre.role === "timeline");
    const steps = timeline ? binary(rhythm.pattern[timeline.id] ?? []) : [];
    if (steps.length === 0 || Math.max(timelineSimilarity(steps), rhythm.clave ? 0.8 : 0) < 0.6) {
      errors.push("Timeline does not clearly express clave");
    }
  }

  const score = scoreRhythm(rhythm);
  if (score < 5.5) {
    warnings.push(`Groove score ${score} is weak`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    score,
    groove,
  };
}

function ensureRequiredRoles(
  rhythm: RhythmPattern,
  subdivision: number[],
  clave: RhythmPattern["clave"],
  rng: SeededRandom
) {
  const next = cloneRhythm(rhythm);
  const rules = RHYTHM_RULES[next.region];
  const roles = new Set(next.instruments.map((timbre) => timbre.role));
  const length = patternLength(next);

  rules.requiredRoles.forEach((role) => {
    if (roles.has(role)) return;
    const timbre = roleTemplate(next.region, role);
    next.instruments.push(timbre);
    next.pattern[timbre.id] = fallbackPattern(
      next.region,
      role,
      length,
      subdivision,
      rules,
      clave,
      rng
    );
  });

  return next;
}

export function correctRhythm(
  rhythm: RhythmPattern,
  options: GenerateRhythmOptions = {}
): RhythmPattern {
  const seed = options.seed ?? Date.now();
  const rng = new SeededRandom(seed + 17);
  const next = cloneRhythm(rhythm);
  const subdivision = allowedSubdivision(next.region, next.subdivision)
    ? next.subdivision.slice()
    : closestAllowedSubdivision(next.region, next.subdivision);
  const clave =
    next.region === "afro_cuban" ? next.clave ?? (rng.next() < 0.5 ? "2-3" : "3-2") : next.clave ?? null;

  next.subdivision = subdivision;
  next.clave = clave;

  const ensured = ensureRequiredRoles(next, subdivision, clave, rng);
  const rules = RHYTHM_RULES[next.region];
  const canonicalLength = patternLength(ensured);

  ensured.instruments.forEach((timbre) => {
    const current = ensured.pattern[timbre.id];
    let steps =
      current && current.length > 0
        ? resamplePattern(current, canonicalLength)
        : fallbackPattern(
            next.region,
            timbre.role,
            canonicalLength,
            subdivision,
            rules,
            clave,
            rng
          );

    if (timbre.role === "timeline") {
      steps = mergePatterns(steps, fallbackTimeline(next.region, steps.length, subdivision, clave));
    }

    steps = nudgeDensity(
      steps,
      getDensityTarget(rules, timbre.role),
      next.region,
      timbre.role,
      subdivision,
      clave,
      rng
    );
    steps = nudgeSync(
      steps,
      getSyncTarget(rules.syncopationBias, timbre.role),
      next.region,
      timbre.role,
      subdivision,
      clave,
      rng
    );
    ensured.pattern[timbre.id] = enforceRoleCharacter(
      steps,
      next.region,
      timbre.role,
      subdivision,
      clave
    );
  });

  ensured.tags = [...new Set([...ensured.tags, "generated", "corrected"])];
  ensured.source = ensured.source ?? "AI corrected";
  return ensured;
}

export function generateRhythm(
  region: Region,
  options: GenerateRhythmOptions = {}
): RhythmPattern {
  const seed = options.seed ?? Date.now();
  const rng = new SeededRandom(seed);
  const primary = selectSeed(region, rng);
  const secondary = selectSeed(region, rng, primary.id);
  const subdivision = chooseSubdivision(region, primary, rng);
  const clave =
    region === "afro_cuban"
      ? primary.clave ?? secondary.clave ?? (rng.next() < 0.5 ? "2-3" : "3-2")
      : null;
  const instruments = primary.instruments.map((timbre) => ({ ...timbre }));
  const pattern = Object.fromEntries(
    instruments.map((timbre) => [
      timbre.id,
      generateTrack(region, timbre, subdivision, primary, secondary, clave, rng),
    ])
  ) as Record<string, number[]>;

  const rhythm: RhythmPattern = {
    id: `gen_${region}_${seed}`,
    name: `Generated ${REGION_LABELS[region]}`,
    region,
    country: primary.country,
    meter: primary.meter,
    subdivision,
    tempoRange: [...primary.tempoRange] as [number, number],
    clave,
    instruments,
    pattern,
    feel: primary.feel,
    tags: [...new Set(["generated", "ai", region, ...primary.tags.slice(0, 2)])],
    source: `AI hybrid of ${primary.name}${secondary.id !== primary.id ? ` + ${secondary.name}` : ""}`,
  };

  return correctRhythm(rhythm, { seed: seed + 1 });
}

export function generateValidRhythm(
  region: Region,
  options: GenerateRhythmOptions = {}
) {
  const seed = options.seed ?? Date.now();
  const maxAttempts = Math.max(3, options.maxAttempts ?? 10);
  let best = generateRhythm(region, { seed });
  let bestScore = scoreRhythm(best);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const attemptSeed = seed + attempt * 97;
    const rhythm = generateRhythm(region, { seed: attemptSeed });
    const validation = validateRhythm(rhythm);

    if (validation.score > bestScore) {
      best = rhythm;
      bestScore = validation.score;
    }

    if (validation.valid && validation.score >= 6) {
      return rhythm;
    }
  }

  return correctRhythm(best, { seed: seed + 997 });
}
