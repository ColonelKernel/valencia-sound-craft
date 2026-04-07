import { z } from "zod";

import { DRUM_INSTRUMENTS, getInstrument } from "./drumSoundEngine";
import type { PatternPreset, Region } from "./drumPresets";

export const RegionEnum = z.enum([
  "west_africa",
  "balkans",
  "flamenco",
  "afro_cuban",
  "brazil",
  "india",
  "middle_east",
  "argentina",
]);

export const InstrumentRoleEnum = z.enum([
  "pulse",
  "timeline",
  "bass",
  "slap",
  "lead",
  "texture",
]);

export const TimbreSchema = z.object({
  id: z.string(),
  name: z.string(),
  instrument: z.string(),
  role: InstrumentRoleEnum,
  midiNote: z.number().min(0).max(127),
});

export const RhythmPatternSchema = z.object({
  id: z.string(),
  name: z.string(),
  region: RegionEnum,
  country: z.string().optional(),
  meter: z.string(),
  subdivision: z.array(z.number()).min(1),
  tempoRange: z.tuple([z.number(), z.number()]),
  clave: z.enum(["2-3", "3-2"]).nullable().optional(),
  instruments: z.array(TimbreSchema).min(1),
  pattern: z.record(z.array(z.number())),
  feel: z.enum(["binary", "ternary", "swing", "additive"]),
  tags: z.array(z.string()),
  source: z.string().optional(),
});

const PLAYABLE_INSTRUMENT_IDS = new Set(DRUM_INSTRUMENTS.map((instrument) => instrument.id));

const TrackPresetSchema = z.object({
  instrumentId: z.string().min(1).refine((instrumentId) => PLAYABLE_INSTRUMENT_IDS.has(instrumentId), {
    message: "Unknown instrument id",
  }),
  steps: z.array(z.number().min(0).max(1)).min(1),
  subdivisions: z.number().int().positive(),
});

const InstrumentRolesSchema = z.object({
  timeline: z.string().optional(),
  groove: z.string().optional(),
  bass: z.string().optional(),
  pulse: z.string().optional(),
  ornament: z.string().optional(),
});

const TalaStructureSchema = z.object({
  name: z.string(),
  beats: z.number().int().positive(),
  vibhags: z.array(z.number().int().positive()).min(1),
  sam: z.number().int().nonnegative(),
  khali: z.number().int().nonnegative(),
});

export const PatternPresetSchema = RhythmPatternSchema.extend({
  country: z.string().min(1),
  category: z.string().min(1),
  region: RegionEnum,
  regionLabel: z.string().min(1),
  countryCode: z.string().length(2),
  description: z.string().min(1),
  bpm: z.number().positive(),
  swing: z.number().min(0).max(100),
  timeSignature: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  clavePattern: z.string().optional(),
  tracks: z.array(TrackPresetSchema).min(1),
  variationTracks: z.array(TrackPresetSchema).optional(),
  timeFeel: z.enum(["straight", "swing", "compound", "asymmetric", "polyrhythmic"]),
  pulseGrouping: z.array(z.number().int().positive()).min(1),
  instrumentRoles: InstrumentRolesSchema.optional(),
  culturalDescription: z.string().optional(),
  artists: z.array(z.string()).optional(),
  complexity: z.enum(["beginner", "intermediate", "advanced"]),
  subdivisionType: z.string().optional(),
  regional: z.boolean().optional(),
  rhythmType: z.enum(["groove", "odd-meter", "tala", "trance"]).optional(),
  konnakol: z.boolean().optional(),
  talaStructure: TalaStructureSchema.optional(),
}).refine((preset) => preset.tempoRange[0] <= preset.tempoRange[1], {
  message: "Invalid tempo range",
  path: ["tempoRange"],
});

export type ValidatedPatternPreset = z.infer<typeof PatternPresetSchema>;

const AFRICAN_REGION_LABELS = new Set([
  "west_africa",
  "east_africa",
  "north_africa",
  "central_africa",
  "southern_africa",
]);

const BALKAN_REGION_LABELS = new Set([
  "eastern_europe",
  "central_asia",
]);

const AFRO_CUBAN_COUNTRIES = new Set([
  "cuba",
  "puerto_rico",
  "dominican_republic",
  "trinidad_&_tobago",
  "jamaica",
]);

const ARGENTINA_COUNTRIES = new Set([
  "argentina",
  "uruguay",
  "peru",
  "colombia",
  "mexico",
  "chile",
  "bolivia",
  "ecuador",
  "paraguay",
  "venezuela",
]);

function validateTrackCollection(
  rhythm: PatternPreset,
  tracks: PatternPreset["tracks"],
  label: string,
): void {
  let cycleUnits: number | null = null;

  tracks.forEach((track) => {
    if (track.steps.length !== track.subdivisions) {
      throw new Error(`${label} length mismatch in ${rhythm.name} (${track.instrumentId})`);
    }

    if (!getInstrument(track.instrumentId)) {
      throw new Error(`Missing timbre ${track.instrumentId} in ${rhythm.name}`);
    }

    const nextCycleUnits = track.steps.length / track.subdivisions;
    if (cycleUnits === null) {
      cycleUnits = nextCycleUnits;
      return;
    }

    if (nextCycleUnits !== cycleUnits) {
      throw new Error(`Cycle mismatch in ${rhythm.name}`);
    }
  });
}

export function validateRhythms(data: unknown[]): ValidatedPatternPreset[] {
  return data.map((rhythm, index) => {
    const result = PatternPresetSchema.safeParse(rhythm);

    if (!result.success) {
      console.error("Invalid rhythm at index", index, result.error);
      throw new Error("Rhythm validation failed");
    }

    return result.data;
  });
}

export function getRhythmRegionLabel(
  rhythm: { region: Region; category?: string; country?: string },
): Region {
  return rhythm.region;
}

export function getRhythmRegionAliases(
  rhythm: { region: Region; category?: string; country?: string; countryCode?: string },
): string[] {
  return [getRhythmRegionLabel(rhythm)];
}

export function rhythmMatchesRegion(
  rhythm: { region: Region; category?: string; country?: string; countryCode?: string },
  region: Region,
): boolean {
  return getRhythmRegionLabel(rhythm) === region;
}

export function filterRhythmsByPreset<T extends Pick<PatternPreset, "category" | "country" | "countryCode" | "region" | "tempoRange">>(
  dataset: T[],
  opts: {
    region?: Region | null;
    bpm?: number | null;
  },
): T[] {
  return dataset.filter((rhythm) => {
    if (opts.region && !rhythmMatchesRegion(rhythm, opts.region)) {
      return false;
    }

    if (typeof opts.bpm === "number") {
      if (rhythm.tempoRange[0] > opts.bpm || rhythm.tempoRange[1] < opts.bpm) {
        return false;
      }
    }

    return true;
  });
}

export function validateMusicalIntegrity(rhythm: PatternPreset): true {
  validateTrackCollection(rhythm, rhythm.tracks, "Track");

  if (rhythm.variationTracks) {
    validateTrackCollection(rhythm, rhythm.variationTracks, "Variation track");
  }

  const totalSubdivision = rhythm.pulseGrouping.reduce((sum, value) => sum + value, 0);
  const stepLength = rhythm.tracks[0]?.subdivisions ?? 0;

  if (
    stepLength > 0 &&
    totalSubdivision !== stepLength &&
    totalSubdivision !== stepLength / 2
  ) {
    console.warn(`Subdivision mismatch in ${rhythm.name}`);
  }

  if (rhythm.bpm < rhythm.tempoRange[0] || rhythm.bpm > rhythm.tempoRange[1]) {
    throw new Error(`Default BPM outside tempo range in ${rhythm.name}`);
  }

  return true;
}
