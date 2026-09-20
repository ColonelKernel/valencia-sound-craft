import {
  REGIONS,
  REGION_LABELS,
  RHYTHM_PATTERNS,
  filterRhythms as filterNormalizedRhythms,
  formatRegion,
  type InstrumentRole,
  type Region,
  type RhythmPattern,
  type Timbre,
} from "./rhythmData";
import {
  getLessonsByIds,
  getPatternResearchIds,
  getSourcesByIds,
  type RhythmLessonMaterial,
  type RhythmReferenceSource,
} from "./rhythmResearch";
import { parseMeter, type TimeSignature } from "./rhythmUtils";
import {
  ATLAS_COUNTRY_CENTROIDS,
  type CountryCentroid,
} from "../Blipblox/atlasCountryCentroids";

export type { InstrumentRole, Region, RhythmPattern, Timbre } from "./rhythmData";

export interface TrackPreset {
  instrumentId: string;
  steps: number[];
  subdivisions: number;
  midiNote: number;
  instrument: string;
  role: InstrumentRole;
}

export type TimeFeel =
  | "straight"
  | "swing"
  | "compound"
  | "asymmetric"
  | "polyrhythmic";

export type Complexity = "beginner" | "intermediate" | "advanced";
export type RhythmType = "groove" | "odd-meter" | "tala" | "trance";

export interface TalaStructure {
  name: string;
  beats: number;
  vibhags: number[];
  sam: number;
  khali: number;
}

export interface PatternPreset extends RhythmPattern {
  presetKey: string;
  country: string;
  category: string;
  description: string;
  bpm: number;
  swing: number;
  timeSignature: TimeSignature;
  clavePattern?: "2-3" | "3-2";
  tracks: TrackPreset[];
  variationTracks?: TrackPreset[];
  timeFeel: TimeFeel;
  pulseGrouping: number[];
  complexity: Complexity;
  rhythmType?: RhythmType;
  regionLabel: string;
  countryCode: string;
  instrumentRoles: {
    timeline?: string;
    groove?: string;
    bass?: string;
    pulse?: string;
    ornament?: string;
  };
  culturalDescription?: string;
  artists?: string[];
  subdivisionType?: string;
  regional?: boolean;
  konnakol?: boolean;
  talaStructure?: TalaStructure;
  lessonIds: string[];
  referenceSourceIds: string[];
  lessons: RhythmLessonMaterial[];
  referenceSources: RhythmReferenceSource[];
}

export interface CountryMapData {
  code: string;
  name: string;
  lat: number;
  lng: number;
  region: Region;
  rhythmCount: number;
  lessonCount: number;
  sourceCount: number;
  lessonIds: string[];
  referenceSourceIds: string[];
}

const COUNTRY_CODES: Record<string, string> = {
  Guinea: "GN",
  Ghana: "GH",
  Bulgaria: "BG",
  "North Macedonia": "MK",
  Spain: "ES",
  Cuba: "CU",
  "Puerto Rico": "PR",
  Brazil: "BR",
  India: "IN",
  Egypt: "EG",
  Lebanon: "LB",
  Turkey: "TR",
  Argentina: "AR",
  Peru: "PE",
  Uruguay: "UY",
};

const COUNTRY_CENTROID_FALLBACKS: Partial<Record<string, CountryCentroid>> = {
  "Puerto Rico": { lat: 18.220833, lng: -66.590149 },
};

const TALA_STRUCTURES: Record<string, TalaStructure> = {
  india_teentaal: { name: "Teentaal", beats: 16, vibhags: [4, 4, 4, 4], sam: 1, khali: 9 },
  india_keharwa: { name: "Keharwa", beats: 8, vibhags: [4, 4], sam: 1, khali: 5 },
  india_rupak: { name: "Rupak", beats: 7, vibhags: [3, 2, 2], sam: 1, khali: 1 },
  india_jhaptaal: { name: "Jhaptaal", beats: 10, vibhags: [2, 3, 2, 3], sam: 1, khali: 6 },
  india_adi_tala: { name: "Adi Tala", beats: 8, vibhags: [4, 2, 2], sam: 1, khali: 5 },
};

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function defaultBpm(tempoRange: [number, number]): number {
  return Math.round((tempoRange[0] + tempoRange[1]) / 2);
}

function mapFeel(feel: RhythmPattern["feel"]): TimeFeel {
  switch (feel) {
    case "swing":
      return "swing";
    case "ternary":
      return "compound";
    case "additive":
      return "asymmetric";
    default:
      return "straight";
  }
}

function defaultSwing(feel: RhythmPattern["feel"]): number {
  if (feel === "swing") {
    return 18;
  }

  if (feel === "ternary") {
    return 4;
  }

  return 0;
}

function inferComplexity(tags: string[]): Complexity {
  if (tags.includes("advanced")) {
    return "advanced";
  }

  if (tags.includes("intermediate")) {
    return "intermediate";
  }

  return "beginner";
}

function inferRhythmType(pattern: RhythmPattern): RhythmType {
  if (pattern.region === "india") {
    return "tala";
  }

  if (pattern.feel === "additive") {
    return "odd-meter";
  }

  return "groove";
}

function buildInstrumentRoles(instruments: Timbre[]): PatternPreset["instrumentRoles"] {
  const roles: PatternPreset["instrumentRoles"] = {};

  for (const instrument of instruments) {
    if (instrument.role === "timeline" && !roles.timeline) {
      roles.timeline = instrument.name;
      continue;
    }

    if ((instrument.role === "lead" || instrument.role === "slap") && !roles.groove) {
      roles.groove = instrument.name;
      continue;
    }

    if (instrument.role === "bass" && !roles.bass) {
      roles.bass = instrument.name;
      continue;
    }

    if (instrument.role === "pulse" && !roles.pulse) {
      roles.pulse = instrument.name;
      continue;
    }

    if (instrument.role === "texture" && !roles.ornament) {
      roles.ornament = instrument.name;
    }
  }

  return roles;
}

function validateRhythmPattern(pattern: RhythmPattern): string[] {
  const errors: string[] = [];
  const totalSteps = sum(pattern.subdivision);
  const instrumentIds = pattern.instruments.map((instrument) => instrument.id);
  const uniqueIds = new Set(instrumentIds);

  if (pattern.tempoRange[0] > pattern.tempoRange[1]) {
    errors.push(`${pattern.id}: invalid tempo range`);
  }

  if (uniqueIds.size !== instrumentIds.length) {
    errors.push(`${pattern.id}: duplicate timbre ids`);
  }

  for (const instrument of pattern.instruments) {
    if (instrument.midiNote < 0 || instrument.midiNote > 127) {
      errors.push(`${pattern.id}: ${instrument.id} has invalid MIDI note`);
    }

    const steps = pattern.pattern[instrument.id];

    if (!steps) {
      errors.push(`${pattern.id}: missing pattern for ${instrument.id}`);
      continue;
    }

    if (steps.length !== totalSteps) {
      errors.push(`${pattern.id}: ${instrument.id} has ${steps.length} steps, expected ${totalSteps}`);
    }
  }

  for (const timbreId of Object.keys(pattern.pattern)) {
    if (!uniqueIds.has(timbreId)) {
      errors.push(`${pattern.id}: pattern references unknown timbre ${timbreId}`);
    }
  }

  return errors;
}

function validateDataset(patterns: RhythmPattern[]): string[] {
  const errors: string[] = [];
  const counts = Object.fromEntries(
    REGIONS.map((region) => [region, 0])
  ) as Record<Region, number>;

  for (const pattern of patterns) {
    counts[pattern.region] += 1;
    errors.push(...validateRhythmPattern(pattern));
  }

  if (patterns.length < 20) {
    errors.push("Dataset must contain at least 20 rhythms");
  }

  for (const region of REGIONS) {
    if (counts[region] < 3) {
      errors.push(`${region} must contain at least 3 rhythms`);
    }
  }

  return errors;
}

function createTrackPreset(
  pattern: RhythmPattern,
  instrument: Timbre
): TrackPreset {
  const totalSteps = sum(pattern.subdivision);

  return {
    instrumentId: instrument.id,
    steps: [...pattern.pattern[instrument.id]],
    subdivisions: totalSteps,
    midiNote: instrument.midiNote,
    instrument: instrument.instrument,
    role: instrument.role,
  };
}

function createPatternPreset(pattern: RhythmPattern): PatternPreset {
  const timeSignature = parseMeter(pattern.meter);
  const country = pattern.country || formatRegion(pattern.region);
  const rhythmType = inferRhythmType(pattern);
  const research = getPatternResearchIds(pattern.id);
  const lessons = getLessonsByIds(research.lessonIds);
  const referenceSources = getSourcesByIds(research.sourceIds);

  return {
    ...pattern,
    presetKey: pattern.id,
    country,
    category: country,
    description: pattern.source || `${formatRegion(pattern.region)} rhythm`,
    bpm: defaultBpm(pattern.tempoRange),
    swing: defaultSwing(pattern.feel),
    timeSignature,
    clavePattern: pattern.clave || undefined,
    tracks: pattern.instruments.map((instrument) => createTrackPreset(pattern, instrument)),
    timeFeel: mapFeel(pattern.feel),
    pulseGrouping: [...pattern.subdivision],
    complexity: inferComplexity(pattern.tags),
    rhythmType,
    regionLabel: REGION_LABELS[pattern.region],
    countryCode: COUNTRY_CODES[country] || "UN",
    instrumentRoles: buildInstrumentRoles(pattern.instruments),
    konnakol: pattern.instruments.some((instrument) => instrument.id === "konnakol"),
    talaStructure: TALA_STRUCTURES[pattern.id],
    lessonIds: research.lessonIds,
    referenceSourceIds: research.sourceIds,
    lessons,
    referenceSources,
  };
}

const DATASET_ERRORS = validateDataset(RHYTHM_PATTERNS);

if (DATASET_ERRORS.length > 0) {
  throw new Error(DATASET_ERRORS.join("\n"));
}

export const DRUM_PRESETS: PatternPreset[] = RHYTHM_PATTERNS.map(createPatternPreset);

export function filterRhythms(args: {
  region: Region;
  bpm?: number | null;
  tags?: string[] | null;
}): RhythmPattern[] {
  return filterNormalizedRhythms(args);
}

export function getCountryMapData(): CountryMapData[] {
  const countryMap = new Map<
    string,
    {
      name: string;
      region: Region;
      count: number;
      lessonIds: Set<string>;
      referenceSourceIds: Set<string>;
    }
  >();

  for (const preset of DRUM_PRESETS) {
    const code = preset.countryCode;
    if (code === "UN") {
      continue;
    }

    const existing = countryMap.get(code);
    if (existing) {
      existing.count += 1;
      preset.lessonIds.forEach((lessonId) => existing.lessonIds.add(lessonId));
      preset.referenceSourceIds.forEach((sourceId) => existing.referenceSourceIds.add(sourceId));
      continue;
    }

    countryMap.set(code, {
      name: preset.country || preset.regionLabel,
      region: preset.region,
      count: 1,
      lessonIds: new Set(preset.lessonIds),
      referenceSourceIds: new Set(preset.referenceSourceIds),
    });
  }

  const countries: CountryMapData[] = [];

  countryMap.forEach((value, code) => {
    const position = ATLAS_COUNTRY_CENTROIDS[value.name]
      ?? COUNTRY_CENTROID_FALLBACKS[value.name]
      ?? { lat: 0, lng: 0 };
    countries.push({
      code,
      name: value.name,
      lat: position.lat,
      lng: position.lng,
      region: value.region,
      rhythmCount: value.count,
      lessonCount: value.lessonIds.size,
      sourceCount: value.referenceSourceIds.size,
      lessonIds: [...value.lessonIds],
      referenceSourceIds: [...value.referenceSourceIds],
    });
  });

  return countries;
}

export interface GrooveValidation {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export { formatRegion };
