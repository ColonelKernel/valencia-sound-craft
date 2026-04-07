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
import { parseMeter, type TimeSignature } from "./rhythmUtils";

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
}

export interface CountryMapData {
  code: string;
  name: string;
  lat: number;
  lng: number;
  region: Region;
  rhythmCount: number;
}

const COUNTRY_CODES: Record<string, string> = {
  Guinea: "GN",
  Ghana: "GH",
  Bulgaria: "BG",
  "North Macedonia": "MK",
  Spain: "ES",
  Cuba: "CU",
  Brazil: "BR",
  India: "IN",
  Egypt: "EG",
  Lebanon: "LB",
  Turkey: "TR",
  Argentina: "AR",
};

const TALA_STRUCTURES: Record<string, TalaStructure> = {
  india_teentaal: { name: "Teentaal", beats: 16, vibhags: [4, 4, 4, 4], sam: 1, khali: 9 },
  india_keharwa: { name: "Keharwa", beats: 8, vibhags: [4, 4], sam: 1, khali: 5 },
  india_rupak: { name: "Rupak", beats: 7, vibhags: [3, 2, 2], sam: 1, khali: 1 },
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
  const counts: Record<Region, number> = {
    west_africa: 0,
    balkans: 0,
    flamenco: 0,
    afro_cuban: 0,
    brazil: 0,
    india: 0,
    middle_east: 0,
    argentina: 0,
  };

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

  return {
    ...pattern,
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
  };
}

const DATASET_ERRORS = validateDataset(RHYTHM_PATTERNS);

if (DATASET_ERRORS.length > 0) {
  throw new Error(DATASET_ERRORS.join("\n"));
}

export const DRUM_PRESETS: PatternPreset[] = RHYTHM_PATTERNS.map(createPatternPreset);
export const rhythmDataset: PatternPreset[] = DRUM_PRESETS;

export function getPresetsByRegion(): Record<Region, PatternPreset[]> {
  const grouped = {
    west_africa: [],
    balkans: [],
    flamenco: [],
    afro_cuban: [],
    brazil: [],
    india: [],
    middle_east: [],
    argentina: [],
  } as Record<Region, PatternPreset[]>;

  for (const preset of DRUM_PRESETS) {
    grouped[preset.region].push(preset);
  }

  return grouped;
}

export function getPresetsByCountry(): Record<string, PatternPreset[]> {
  const grouped: Record<string, PatternPreset[]> = {};

  for (const preset of DRUM_PRESETS) {
    if (!grouped[preset.country || preset.regionLabel]) {
      grouped[preset.country || preset.regionLabel] = [];
    }

    grouped[preset.country || preset.regionLabel].push(preset);
  }

  return grouped;
}

export function getPresetsByFeel(): Record<TimeFeel, PatternPreset[]> {
  const grouped: Record<TimeFeel, PatternPreset[]> = {
    straight: [],
    swing: [],
    compound: [],
    asymmetric: [],
    polyrhythmic: [],
  };

  for (const preset of DRUM_PRESETS) {
    grouped[preset.timeFeel].push(preset);
  }

  return grouped;
}

export function getPresetsByComplexity(): Record<Complexity, PatternPreset[]> {
  const grouped: Record<Complexity, PatternPreset[]> = {
    beginner: [],
    intermediate: [],
    advanced: [],
  };

  for (const preset of DRUM_PRESETS) {
    grouped[preset.complexity].push(preset);
  }

  return grouped;
}

export function getAllRegions(): Region[] {
  return [...REGIONS];
}

export function getAllCountries(region?: Region | null): string[] {
  const source = region
    ? DRUM_PRESETS.filter((preset) => preset.region === region)
    : DRUM_PRESETS;

  return [...new Set(source.map((preset) => preset.country || preset.regionLabel))].sort();
}

export function getAllCategories(region?: Region | null): string[] {
  return getAllCountries(region);
}

export function getAllRhythmTypes(): RhythmType[] {
  return [...new Set(DRUM_PRESETS.map((preset) => preset.rhythmType).filter(Boolean))] as RhythmType[];
}

export function filterRhythms(args: {
  region: Region;
  bpm?: number | null;
  tags?: string[] | null;
}): RhythmPattern[] {
  return filterNormalizedRhythms(args);
}

export function filterPresets(opts: {
  category?: string | null;
  region?: Region | null;
  timeFeel?: TimeFeel | null;
  complexity?: Complexity | null;
  rhythmType?: RhythmType | null;
  bpmRange?: [number, number] | null;
  country?: string | null;
  search?: string;
}): PatternPreset[] {
  return DRUM_PRESETS.filter((preset) => {
    if (opts.region && preset.region !== opts.region) {
      return false;
    }

    if (opts.category && preset.category !== opts.category) {
      return false;
    }

    if (opts.timeFeel && preset.timeFeel !== opts.timeFeel) {
      return false;
    }

    if (opts.complexity && preset.complexity !== opts.complexity) {
      return false;
    }

    if (opts.rhythmType && preset.rhythmType !== opts.rhythmType) {
      return false;
    }

    if (opts.country && preset.country !== opts.country) {
      return false;
    }

    if (opts.bpmRange) {
      const [minimum, maximum] = opts.bpmRange;
      if (preset.tempoRange[1] < minimum || preset.tempoRange[0] > maximum) {
        return false;
      }
    }

    if (opts.search) {
      const searchValue = opts.search.toLowerCase();
      const searchableValues = [
        preset.name,
        preset.country || "",
        preset.description,
        preset.source || "",
        ...preset.tags,
      ];

      let matches = false;

      for (const value of searchableValues) {
        if (value.toLowerCase().includes(searchValue)) {
          matches = true;
          break;
        }
      }

      if (!matches) {
        return false;
      }
    }

    return true;
  });
}

export function getCountryMapData(): CountryMapData[] {
  const countryMap = new Map<string, { name: string; region: Region; count: number }>();

  for (const preset of DRUM_PRESETS) {
    const code = preset.countryCode;
    if (code === "UN") {
      continue;
    }

    const existing = countryMap.get(code);
    if (existing) {
      existing.count += 1;
      continue;
    }

    countryMap.set(code, {
      name: preset.country || preset.regionLabel,
      region: preset.region,
      count: 1,
    });
  }

  const positions: Record<string, [number, number]> = {
    GN: [9.9, -11.6],
    GH: [7.9, -1.0],
    BG: [42.7, 25.5],
    MK: [41.6, 21.7],
    ES: [40.5, -3.7],
    CU: [21.5, -80.0],
    BR: [-14.2, -51.9],
    IN: [20.6, 79.0],
    EG: [26.8, 30.8],
    LB: [33.9, 35.8],
    TR: [39.0, 35.2],
    AR: [-38.4, -63.6],
  };

  const countries: CountryMapData[] = [];

  countryMap.forEach((value, code) => {
    const position = positions[code] || [0, 0];
    countries.push({
      code,
      name: value.name,
      lat: position[0],
      lng: position[1],
      region: value.region,
      rhythmCount: value.count,
    });
  });

  return countries;
}

export interface GrooveValidation {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export function validateGroove(preset: PatternPreset): GrooveValidation {
  const warnings: string[] = [];
  const errors: string[] = [];
  const totalSteps = sum(preset.pulseGrouping);
  const timbreIds = new Set(preset.instruments.map((instrument) => instrument.id));

  for (const track of preset.tracks) {
    if (track.steps.length !== track.subdivisions) {
      errors.push(`${track.instrumentId}: step count does not match subdivisions`);
    }

    if (!timbreIds.has(track.instrumentId)) {
      errors.push(`${track.instrumentId}: missing timbre definition`);
    }
  }

  if (preset.tracks.length !== preset.instruments.length) {
    errors.push("Track and timbre counts are out of sync");
  }

  if (preset.tracks[0] && preset.tracks[0].subdivisions !== totalSteps) {
    errors.push(`Subdivision mismatch: expected ${totalSteps}, received ${preset.tracks[0].subdivisions}`);
  }

  if (preset.bpm < preset.tempoRange[0] || preset.bpm > preset.tempoRange[1]) {
    warnings.push(`Default BPM ${preset.bpm} is outside ${preset.tempoRange[0]}-${preset.tempoRange[1]}`);
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

export function getGrooveType(preset: PatternPreset): string {
  if (preset.rhythmType === "tala" && preset.talaStructure) {
    return `Tala (${preset.talaStructure.name})`;
  }

  if (preset.clavePattern) {
    return `Clave (${preset.clavePattern})`;
  }

  if (preset.region === "flamenco") {
    return "Compas";
  }

  if (preset.timeFeel === "asymmetric") {
    return "Odd Meter";
  }

  if (preset.timeFeel === "compound") {
    return "Compound";
  }

  if (preset.timeFeel === "swing") {
    return "Groove (Swing)";
  }

  return "Groove";
}

export function formatPulseGrouping(grouping: number[]): string {
  return grouping.join(" + ");
}

export { formatRegion };
