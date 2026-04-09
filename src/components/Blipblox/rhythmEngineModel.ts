import {
  GLOBAL_RHYTHM_ATLAS,
  getAtlasRhythmByCountry,
  type Rhythm,
  type RhythmContinent,
} from "./globalRhythmAtlas";
import {
  DRUM_PRESETS,
  type PatternPreset,
  type TimeFeel,
  type TrackPreset,
} from "../DrumMachine/drumPresets";
import { resamplePatternValues } from "../DrumMachine/rhythmComposition";
import { REGION_LABELS, type InstrumentRole, type Region } from "../DrumMachine/rhythmData";

export type RhythmBrowserRegion = Region | "global";
export type RhythmTempoBand = "slow" | "medium" | "fast";

export interface SequencerLayer {
  id: string;
  label: string;
  instrumentId: string;
  instrument: string;
  role: InstrumentRole;
  band: "low" | "mid" | "high";
  pattern: number[];
  velocity: number[];
  locked?: boolean;
}

export interface RhythmSourceReference {
  title: string;
  detail: string;
  url?: string;
}

export interface StructuredRhythmDefinition {
  id: string;
  rhythmId: string;
  atlasRhythmId: string;
  name: string;
  country: string;
  region: RhythmBrowserRegion;
  regionLabel: string;
  continent: RhythmContinent;
  meter: string;
  subdivision: number[];
  grouping: number[];
  cycleLength: number;
  tempoRange: [number, number];
  defaultTempo: number;
  feel: TimeFeel;
  classification: Rhythm["classification"];
  confidence: Rhythm["confidence"];
  timbreProfile: string;
  tradition: string;
  instruments: string[];
  layers: SequencerLayer[];
  pulse: number[];
  accentMap: number[];
  instrumentRoles: {
    low?: string;
    mid?: string;
    high?: string;
    timeline?: string;
    pulse?: string;
  };
  sources: RhythmSourceReference[];
  atlasRhythm: Rhythm;
  preset: PatternPreset | null;
}

export interface GlobalRhythmState {
  region: RhythmBrowserRegion;
  country: string;
  rhythmId: string;
  tempo: number;
  subdivision: number[];
  layers: SequencerLayer[];
}

export interface RhythmLibraryFilters {
  region?: RhythmBrowserRegion | "All";
  country?: string | "All";
  meter?: string | "All";
  feel?: TimeFeel | "All";
  tempoBand?: RhythmTempoBand | "All";
  search?: string;
}

const ROLE_ORDER: Record<InstrumentRole, number> = {
  bass: 0,
  pulse: 1,
  slap: 2,
  lead: 3,
  timeline: 4,
  texture: 5,
};

const REGION_SORT_ORDER: Record<RhythmBrowserRegion, number> = {
  west_africa: 0,
  balkans: 1,
  flamenco: 2,
  afro_cuban: 3,
  brazil: 4,
  india: 5,
  middle_east: 6,
  argentina: 7,
  afro_peruvian: 8,
  uruguay: 9,
  global: 10,
};

const DEFAULT_COUNTRY_PRESET_ID: Partial<Record<string, string>> = {
  Argentina: "argentina_chacarera",
  Brazil: "brazil_samba_de_roda",
  Bulgaria: "balkans_ruchenitsa",
  Cuba: "afro_cuban_son_32",
  Egypt: "middle_east_maqsum",
  Ghana: "west_africa_kpanlogo",
  Guinea: "west_africa_kuku",
  India: "india_teentaal",
  Lebanon: "middle_east_malfuf",
  Peru: "afro_peruvian_festejo",
  Spain: "flamenco_buleria",
  Turkey: "middle_east_samai",
  Uruguay: "uruguay_candombe_base",
};

const FALLBACK_LAYER_LIBRARY: Record<
  string,
  Array<Pick<SequencerLayer, "label" | "instrumentId" | "instrument" | "role" | "band">>
> = {
  djembe: [
    { label: "Low", instrumentId: "djembe_bass", instrument: "Djembe Bass", role: "bass", band: "low" },
    { label: "Mid", instrumentId: "djembe_slap", instrument: "Djembe Slap", role: "lead", band: "mid" },
    { label: "High", instrumentId: "dunun_bell", instrument: "Dunun Bell", role: "timeline", band: "high" },
  ],
  "conga/clave": [
    { label: "Low", instrumentId: "conga-low", instrument: "Conga Tumba", role: "bass", band: "low" },
    { label: "Mid", instrumentId: "conga-slap", instrument: "Conga Slap", role: "slap", band: "mid" },
    { label: "High", instrumentId: "clave", instrument: "Clave", role: "timeline", band: "high" },
  ],
  surdo: [
    { label: "Low", instrumentId: "surdo", instrument: "Surdo", role: "bass", band: "low" },
    { label: "Mid", instrumentId: "repique", instrument: "Repique", role: "lead", band: "mid" },
    { label: "High", instrumentId: "agogo", instrument: "Agogo", role: "timeline", band: "high" },
  ],
  "cajon-peru": [
    { label: "Low", instrumentId: "cajon_low", instrument: "Cajon Bass", role: "bass", band: "low" },
    { label: "Mid", instrumentId: "cajon_high", instrument: "Cajon High", role: "lead", band: "mid" },
    { label: "High", instrumentId: "cowbell", instrument: "Quijada", role: "timeline", band: "high" },
  ],
  "cajon-spain": [
    { label: "Low", instrumentId: "cajon_low", instrument: "Cajon Bass", role: "bass", band: "low" },
    { label: "Mid", instrumentId: "cajon_high", instrument: "Cajon High", role: "slap", band: "mid" },
    { label: "High", instrumentId: "palmas", instrument: "Palmas", role: "timeline", band: "high" },
  ],
  tupan: [
    { label: "Low", instrumentId: "tupan_low", instrument: "Tupan Low", role: "bass", band: "low" },
    { label: "Mid", instrumentId: "tupan_high", instrument: "Tupan High", role: "lead", band: "mid" },
    { label: "High", instrumentId: "cowbell", instrument: "Pulse Marker", role: "timeline", band: "high" },
  ],
  tabla: [
    { label: "Low", instrumentId: "tabla_bayan", instrument: "Tabla Bayan", role: "bass", band: "low" },
    { label: "Mid", instrumentId: "tabla_dayan", instrument: "Tabla Dayan", role: "lead", band: "mid" },
    { label: "High", instrumentId: "konnakol", instrument: "Konnakol", role: "timeline", band: "high" },
  ],
  darbuka: [
    { label: "Low", instrumentId: "darbuka_dum", instrument: "Darbuka Dum", role: "bass", band: "low" },
    { label: "Mid", instrumentId: "darbuka_tek", instrument: "Darbuka Tek", role: "lead", band: "mid" },
    { label: "High", instrumentId: "riq", instrument: "Riq", role: "timeline", band: "high" },
  ],
  taiko: [
    { label: "Low", instrumentId: "tom-low", instrument: "Taiko Pulse", role: "bass", band: "low" },
    { label: "Mid", instrumentId: "tom-high", instrument: "Taiko Cut", role: "lead", band: "mid" },
    { label: "High", instrumentId: "rimshot", instrument: "Shime Accent", role: "timeline", band: "high" },
  ],
  "log drum": [
    { label: "Low", instrumentId: "tom-low", instrument: "Log Drum", role: "bass", band: "low" },
    { label: "Mid", instrumentId: "rimshot", instrument: "Wood Accent", role: "lead", band: "mid" },
    { label: "High", instrumentId: "cowbell", instrument: "Pulse Bell", role: "timeline", band: "high" },
  ],
  "neutral kit": [
    { label: "Low", instrumentId: "kick", instrument: "Kick", role: "bass", band: "low" },
    { label: "Mid", instrumentId: "snare", instrument: "Snare", role: "lead", band: "mid" },
    { label: "High", instrumentId: "hh-closed", instrument: "Hi-Hat", role: "timeline", band: "high" },
  ],
};

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function midpoint([minimum, maximum]: [number, number]) {
  return Math.round((minimum + maximum) / 2);
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function normalizeLabel(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function inferTempoBand(range: [number, number]): RhythmTempoBand {
  const average = midpoint(range);

  if (average < 95) {
    return "slow";
  }

  if (average > 130) {
    return "fast";
  }

  return "medium";
}

function getTimbreProfileKey(rhythm: Pick<Rhythm, "timbreProfile" | "country">) {
  if (rhythm.timbreProfile === "cajón") {
    return rhythm.country === "Spain" ? "cajon-spain" : "cajon-peru";
  }

  return rhythm.timbreProfile;
}

function inferAtlasRegion(rhythm: Rhythm): RhythmBrowserRegion {
  if (rhythm.country === "Argentina") {
    return "argentina";
  }

  if (rhythm.country === "Brazil") {
    return "brazil";
  }

  if (rhythm.country === "Peru") {
    return "afro_peruvian";
  }

  if (rhythm.country === "Uruguay") {
    return "uruguay";
  }

  switch (getTimbreProfileKey(rhythm)) {
    case "djembe":
      return "west_africa";
    case "tupan":
      return "balkans";
    case "conga/clave":
      return "afro_cuban";
    case "tabla":
      return "india";
    case "darbuka":
      return "middle_east";
    case "surdo":
      return rhythm.country === "Uruguay" ? "uruguay" : "brazil";
    case "cajon-spain":
      return rhythm.country === "Spain" ? "flamenco" : "afro_peruvian";
    case "cajon-peru":
      return "afro_peruvian";
    default:
      return rhythm.country === "Spain" ? "flamenco" : "global";
  }
}

function inferFeel(grouping: number[], rhythm: Rhythm): TimeFeel {
  const uniqueGrouping = unique(grouping);

  if (rhythm.timbreProfile === "djembe") {
    return "polyrhythmic";
  }

  if (uniqueGrouping.length > 1) {
    return "asymmetric";
  }

  if (grouping.every((group) => group === 3)) {
    return "compound";
  }

  if (rhythm.timbreProfile === "conga/clave" || rhythm.timbreProfile === "surdo") {
    return "swing";
  }

  return "straight";
}

function getRegionLabel(region: RhythmBrowserRegion) {
  return region === "global" ? "Global Atlas" : REGION_LABELS[region];
}

function buildPulseIndices(grouping: number[]) {
  const result: number[] = [];
  let offset = 0;

  grouping.forEach((size) => {
    result.push(offset);
    offset += size;
  });

  return result;
}

function createVelocityPattern(values: number[]) {
  return values.map((value) => {
    if (value <= 0) {
      return 0;
    }

    return Math.max(34, Math.min(127, Math.round(value * 127)));
  });
}

function getBandFromRole(role: InstrumentRole): SequencerLayer["band"] {
  switch (role) {
    case "bass":
    case "pulse":
      return "low";
    case "lead":
    case "slap":
      return "mid";
    default:
      return "high";
  }
}

function cloneLayer(layer: SequencerLayer): SequencerLayer {
  return {
    ...layer,
    pattern: [...layer.pattern],
    velocity: [...layer.velocity],
  };
}

function cloneLayers(layers: SequencerLayer[]) {
  return layers.map(cloneLayer);
}

function getPresetFallbackProfile(preset: PatternPreset) {
  switch (preset.region) {
    case "west_africa":
      return "djembe";
    case "balkans":
      return "tupan";
    case "flamenco":
      return "cajon-spain";
    case "afro_cuban":
      return "conga/clave";
    case "brazil":
      return "surdo";
    case "india":
      return "tabla";
    case "middle_east":
      return "darbuka";
    case "argentina":
      return "neutral kit";
    case "afro_peruvian":
      return "cajon-peru";
    case "uruguay":
      return "surdo";
    default:
      return "neutral kit";
  }
}

function getInstrumentRoles(layers: SequencerLayer[]) {
  const roles: StructuredRhythmDefinition["instrumentRoles"] = {};

  layers.forEach((layer) => {
    if (layer.band === "low" && !roles.low) {
      roles.low = layer.instrument;
    }

    if (layer.band === "mid" && !roles.mid) {
      roles.mid = layer.instrument;
    }

    if (layer.band === "high" && !roles.high) {
      roles.high = layer.instrument;
    }

    if (layer.role === "timeline" && !roles.timeline) {
      roles.timeline = layer.instrument;
    }

    if (layer.role === "pulse" && !roles.pulse) {
      roles.pulse = layer.instrument;
    }
  });

  return roles;
}

function buildAccentMap(layers: SequencerLayer[], pulse: number[]) {
  const accentSet = new Set(pulse);

  layers.forEach((layer) => {
    layer.velocity.forEach((velocity, index) => {
      if (velocity >= 104) {
        accentSet.add(index);
      }
    });
  });

  return [...accentSet].sort((left, right) => left - right);
}

function getFallbackLayerTemplate(rhythm: Rhythm) {
  const timbreProfile = getTimbreProfileKey(rhythm);

  if (timbreProfile === "cajon-spain" || timbreProfile === "cajon-peru") {
    return rhythm.country === "Spain"
      ? FALLBACK_LAYER_LIBRARY["cajon-spain"]
      : FALLBACK_LAYER_LIBRARY["cajon-peru"];
  }

  if (timbreProfile === "surdo" && rhythm.country === "Uruguay") {
    return [
      { label: "Low", instrumentId: "surdo", instrument: "Tambor Piano", role: "bass" as const, band: "low" as const },
      { label: "Mid", instrumentId: "repique", instrument: "Tambor Repique", role: "lead" as const, band: "mid" as const },
      { label: "High", instrumentId: "conga-high", instrument: "Tambor Chico", role: "pulse" as const, band: "high" as const },
    ];
  }

  return FALLBACK_LAYER_LIBRARY[timbreProfile] || FALLBACK_LAYER_LIBRARY["neutral kit"];
}

function buildFallbackLayers(rhythm: Rhythm) {
  const stepCount = sum(rhythm.subdivision);
  const pulse = buildPulseIndices(rhythm.subdivision);
  const pulseSet = new Set(pulse);
  const hitValues = resamplePatternValues(rhythm.midiPattern, stepCount);
  const accentValues = resamplePatternValues(rhythm.accents, stepCount);
  const templates = getFallbackLayerTemplate(rhythm);

  const lowPattern = hitValues.map((hit, index) => (hit > 0 && (accentValues[index] > 0 || pulseSet.has(index)) ? 1 : 0));
  const midPattern = hitValues.map((hit, index) => (hit > 0 && !lowPattern[index] ? 1 : 0));
  const highPattern = hitValues.map((hit, index) => {
    if (hit <= 0) {
      return 0;
    }

    return midPattern[index] || lowPattern[index] ? 0.72 : 1;
  });

  const normalizedHighPattern = highPattern.some(Boolean)
    ? highPattern
    : pulse.map((index) => index).reduce((pattern, index) => {
      pattern[index] = 1;
      return pattern;
    }, new Array(stepCount).fill(0));

  const patternSets = [
    lowPattern,
    midPattern.some(Boolean) ? midPattern : pulseSetToPattern(stepCount, pulse),
    normalizedHighPattern,
  ];

  return templates.map((template, index) => {
    const currentPattern = patternSets[index] || new Array(stepCount).fill(0);
    const velocity = currentPattern.map((value, stepIndex) => {
      if (!value) {
        return 0;
      }

      if (index === 0) {
        return accentValues[stepIndex] > 0 ? 124 : 108;
      }

      if (index === 1) {
        return accentValues[stepIndex] > 0 ? 104 : 88;
      }

      return accentValues[stepIndex] > 0 ? 92 : 70;
    });

    return {
      id: `${slugify(rhythm.country)}-${template.instrumentId}`,
      label: template.label,
      instrumentId: template.instrumentId,
      instrument: template.instrument,
      role: template.role,
      band: template.band,
      pattern: currentPattern.map((value) => (value > 0 ? 1 : 0)),
      velocity,
    };
  });
}

function pulseSetToPattern(stepCount: number, pulse: number[]) {
  const result = new Array(stepCount).fill(0);
  pulse.forEach((index) => {
    result[index] = 1;
  });
  return result;
}

function buildLayersFromPreset(preset: PatternPreset) {
  const layers = [...preset.tracks]
    .sort((left, right) => {
      const roleDelta = ROLE_ORDER[left.role] - ROLE_ORDER[right.role];

      if (roleDelta !== 0) {
        return roleDelta;
      }

      return left.instrument.localeCompare(right.instrument);
    })
    .map((track) => buildLayerFromTrack(track, preset));

  return ensureMinimumBands(layers, preset);
}

function buildLayerFromTrack(track: TrackPreset, preset: PatternPreset): SequencerLayer {
  return {
    id: `${preset.id}-${track.instrumentId}`,
    label: getLayerLabel(track.role),
    instrumentId: track.instrumentId,
    instrument: track.instrument,
    role: track.role,
    band: getBandFromRole(track.role),
    pattern: track.steps.map((step) => (step > 0 ? 1 : 0)),
    velocity: createVelocityPattern(track.steps),
  };
}

function getLayerLabel(role: InstrumentRole) {
  switch (role) {
    case "bass":
      return "Low";
    case "pulse":
      return "Pulse";
    case "lead":
    case "slap":
      return "Mid";
    case "timeline":
      return "High";
    case "texture":
      return "Texture";
    default:
      return "Layer";
  }
}

function ensureMinimumBands(layers: SequencerLayer[], preset: PatternPreset) {
  const stepCount = preset.tracks[0]?.subdivisions ?? sum(preset.pulseGrouping);
  const pulsePattern = pulseSetToPattern(stepCount, buildPulseIndices(preset.pulseGrouping));
  const fallbackTemplates = FALLBACK_LAYER_LIBRARY[getPresetFallbackProfile(preset)] || FALLBACK_LAYER_LIBRARY["neutral kit"];
  const existingBands = new Set(layers.map((layer) => layer.band));

  (["low", "mid", "high"] as const).forEach((band) => {
    if (existingBands.has(band)) {
      return;
    }

    const fallback = fallbackTemplates.find((template) => template.band === band);

    if (!fallback) {
      return;
    }

    layers.push({
      id: `${preset.id}-${fallback.instrumentId}-support`,
      label: fallback.label,
      instrumentId: fallback.instrumentId,
      instrument: fallback.instrument,
      role: fallback.role,
      band,
      pattern: [...pulsePattern],
      velocity: pulsePattern.map((step) => (step ? (band === "low" ? 104 : band === "mid" ? 88 : 72) : 0)),
      locked: true,
    });
  });

  return layers.sort((left, right) => {
    const bandOrder = { low: 0, mid: 1, high: 2 };
    const bandDelta = bandOrder[left.band] - bandOrder[right.band];

    if (bandDelta !== 0) {
      return bandDelta;
    }

    return left.instrument.localeCompare(right.instrument);
  });
}

function buildSourcesFromPreset(preset: PatternPreset, atlasRhythm: Rhythm): RhythmSourceReference[] {
  const sources: RhythmSourceReference[] = [
    {
      title: atlasRhythm.source.title,
      detail: `${atlasRhythm.classification} atlas reference`,
    },
  ];

  preset.referenceSources.slice(0, 3).forEach((source) => {
    sources.push({
      title: source.title,
      detail: source.publisher,
      url: source.url,
    });
  });

  preset.lessons.slice(0, 2).forEach((lesson) => {
    sources.push({
      title: lesson.title,
      detail: lesson.summary,
    });
  });

  return sources;
}

function buildSourcesFromAtlas(rhythm: Rhythm): RhythmSourceReference[] {
  return [
    {
      title: rhythm.source.title,
      detail: `${rhythm.classification} atlas reference`,
    },
  ];
}

function buildDefinitionFromPreset(preset: PatternPreset, atlasRhythm: Rhythm): StructuredRhythmDefinition {
  const layers = buildLayersFromPreset(preset);
  const pulse = buildPulseIndices(preset.pulseGrouping);

  return {
    id: preset.id,
    rhythmId: preset.id,
    atlasRhythmId: atlasRhythm.id,
    name: preset.name,
    country: preset.country,
    region: preset.region,
    regionLabel: preset.regionLabel,
    continent: atlasRhythm.continent,
    meter: preset.meter,
    subdivision: [...preset.pulseGrouping],
    grouping: [...preset.pulseGrouping],
    cycleLength: preset.tracks[0]?.subdivisions ?? sum(preset.pulseGrouping),
    tempoRange: [...preset.tempoRange],
    defaultTempo: preset.bpm,
    feel: preset.timeFeel,
    classification: atlasRhythm.classification,
    confidence: atlasRhythm.confidence,
    timbreProfile: atlasRhythm.timbreProfile,
    tradition: preset.culturalDescription || atlasRhythm.tradition,
    instruments: preset.instruments.map((instrument) => instrument.name),
    layers,
    pulse,
    accentMap: buildAccentMap(layers, pulse),
    instrumentRoles: getInstrumentRoles(layers),
    sources: buildSourcesFromPreset(preset, atlasRhythm),
    atlasRhythm,
    preset,
  };
}

function buildDefinitionFromAtlas(rhythm: Rhythm): StructuredRhythmDefinition {
  const layers = buildFallbackLayers(rhythm);
  const region = inferAtlasRegion(rhythm);
  const pulse = buildPulseIndices(rhythm.subdivision);

  return {
    id: rhythm.id,
    rhythmId: rhythm.id,
    atlasRhythmId: rhythm.id,
    name: rhythm.name,
    country: rhythm.country,
    region,
    regionLabel: getRegionLabel(region),
    continent: rhythm.continent,
    meter: rhythm.meter,
    subdivision: [...rhythm.subdivision],
    grouping: [...rhythm.subdivision],
    cycleLength: sum(rhythm.subdivision),
    tempoRange: [...rhythm.bpmRange],
    defaultTempo: midpoint(rhythm.bpmRange),
    feel: inferFeel(rhythm.subdivision, rhythm),
    classification: rhythm.classification,
    confidence: rhythm.confidence,
    timbreProfile: rhythm.timbreProfile,
    tradition: rhythm.tradition,
    instruments: layers.map((layer) => layer.instrument),
    layers,
    pulse,
    accentMap: buildAccentMap(layers, pulse),
    instrumentRoles: getInstrumentRoles(layers),
    sources: buildSourcesFromAtlas(rhythm),
    atlasRhythm: rhythm,
    preset: null,
  };
}

function getDefaultPresetForCountry(country: string, rhythms: PatternPreset[], atlasRhythm: Rhythm) {
  const explicitMatch = DEFAULT_COUNTRY_PRESET_ID[country];

  if (explicitMatch) {
    const byId = rhythms.find((rhythm) => rhythm.id === explicitMatch);

    if (byId) {
      return byId;
    }
  }

  const exactNameMatch = rhythms.find(
    (rhythm) => normalizeLabel(rhythm.name) === normalizeLabel(atlasRhythm.name),
  );

  if (exactNameMatch) {
    return exactNameMatch;
  }

  return rhythms[0] || null;
}

function buildCountryDefinitions(rhythm: Rhythm) {
  const countryPresets = DRUM_PRESETS.filter((preset) => preset.country === rhythm.country);

  if (countryPresets.length === 0) {
    return [buildDefinitionFromAtlas(rhythm)];
  }

  const defaultPreset = getDefaultPresetForCountry(rhythm.country, countryPresets, rhythm);

  const definitions = countryPresets.map((preset) => buildDefinitionFromPreset(preset, rhythm));

  definitions.sort((left, right) => {
    if (left.id === defaultPreset?.id) {
      return -1;
    }

    if (right.id === defaultPreset?.id) {
      return 1;
    }

    return left.name.localeCompare(right.name);
  });

  return definitions;
}

function compareDefinitions(left: StructuredRhythmDefinition, right: StructuredRhythmDefinition) {
  const regionDelta = REGION_SORT_ORDER[left.region] - REGION_SORT_ORDER[right.region];

  if (regionDelta !== 0) {
    return regionDelta;
  }

  const countryDelta = left.country.localeCompare(right.country);

  if (countryDelta !== 0) {
    return countryDelta;
  }

  const classificationOrder: Record<Rhythm["classification"], number> = {
    documented: 0,
    regional: 1,
    proxy: 2,
  };
  const classificationDelta = classificationOrder[left.classification] - classificationOrder[right.classification];

  if (classificationDelta !== 0) {
    return classificationDelta;
  }

  return left.name.localeCompare(right.name);
}

export const RHYTHM_LIBRARY = GLOBAL_RHYTHM_ATLAS.flatMap(buildCountryDefinitions).sort(compareDefinitions);

export const RHYTHM_LIBRARY_BY_ID = new Map(
  RHYTHM_LIBRARY.map((definition) => [definition.id, definition] as const),
);

export const RHYTHM_LIBRARY_REGIONS = unique(
  RHYTHM_LIBRARY.map((definition) => definition.region),
).sort((left, right) => REGION_SORT_ORDER[left] - REGION_SORT_ORDER[right]);

export const RHYTHM_LIBRARY_METERS = unique(
  RHYTHM_LIBRARY.map((definition) => definition.meter),
).sort();

export const RHYTHM_LIBRARY_FEELS = unique(
  RHYTHM_LIBRARY.map((definition) => definition.feel),
);

export function getRhythmDefinitionById(rhythmId: string) {
  return RHYTHM_LIBRARY_BY_ID.get(rhythmId) || null;
}

export function getDefaultRhythmDefinitionForCountry(country: string) {
  const atlasRhythm = getAtlasRhythmByCountry(country);

  if (!atlasRhythm) {
    return RHYTHM_LIBRARY[0] || null;
  }

  return buildCountryDefinitions(atlasRhythm)[0] || null;
}

export function getCountryRhythmDefinitions(country: string) {
  return RHYTHM_LIBRARY.filter((definition) => definition.country === country);
}

export function getRegionCountries(region: RhythmBrowserRegion | "All" = "All") {
  const matchingDefinitions = RHYTHM_LIBRARY.filter((definition) => region === "All" || definition.region === region);

  return unique(matchingDefinitions.map((definition) => definition.country)).sort();
}

export function filterRhythmLibrary(filters: RhythmLibraryFilters = {}) {
  return RHYTHM_LIBRARY.filter((definition) => {
    if (filters.region && filters.region !== "All" && definition.region !== filters.region) {
      return false;
    }

    if (filters.country && filters.country !== "All" && definition.country !== filters.country) {
      return false;
    }

    if (filters.meter && filters.meter !== "All" && definition.meter !== filters.meter) {
      return false;
    }

    if (filters.feel && filters.feel !== "All" && definition.feel !== filters.feel) {
      return false;
    }

    if (filters.tempoBand && filters.tempoBand !== "All" && inferTempoBand(definition.tempoRange) !== filters.tempoBand) {
      return false;
    }

    if (filters.search) {
      const searchValue = filters.search.toLowerCase();
      const searchable = [
        definition.name,
        definition.country,
        definition.regionLabel,
        definition.tradition,
        ...definition.instruments,
      ];

      if (!searchable.some((value) => value.toLowerCase().includes(searchValue))) {
        return false;
      }
    }

    return true;
  });
}

export function createGlobalRhythmState(
  definition: StructuredRhythmDefinition,
  tempo = definition.defaultTempo,
): GlobalRhythmState {
  return {
    region: definition.region,
    country: definition.country,
    rhythmId: definition.id,
    tempo,
    subdivision: [...definition.grouping],
    layers: cloneLayers(definition.layers),
  };
}

export function validateStructuredRhythm(definition: StructuredRhythmDefinition) {
  const errors: string[] = [];
  const totalSteps = sum(definition.grouping);

  if (definition.layers.length < 3) {
    errors.push(`${definition.id}: expected at least three sequencer layers`);
  }

  if (definition.cycleLength !== totalSteps) {
    errors.push(`${definition.id}: cycle length does not match grouping`);
  }

  if (definition.pulse.length === 0) {
    errors.push(`${definition.id}: pulse map is missing`);
  }

  if (definition.accentMap.length === 0) {
    errors.push(`${definition.id}: accent map is missing`);
  }

  if (!definition.instrumentRoles.low || !definition.instrumentRoles.mid || !definition.instrumentRoles.high) {
    errors.push(`${definition.id}: low/mid/high roles must be defined`);
  }

  definition.layers.forEach((layer) => {
    if (layer.pattern.length !== totalSteps) {
      errors.push(`${definition.id}: ${layer.id} pattern length mismatch`);
    }

    if (layer.velocity.length !== totalSteps) {
      errors.push(`${definition.id}: ${layer.id} velocity length mismatch`);
    }
  });

  if (definition.sources.length === 0) {
    errors.push(`${definition.id}: source reference is required`);
  }

  return errors;
}

export function validateRhythmLibrary() {
  return RHYTHM_LIBRARY.flatMap(validateStructuredRhythm);
}

export function buildCompositePattern(layers: SequencerLayer[]) {
  const totalSteps = layers[0]?.pattern.length ?? 0;
  const pattern = new Array(totalSteps).fill(0);
  const velocity = new Array(totalSteps).fill(0);

  layers.forEach((layer) => {
    layer.pattern.forEach((step, index) => {
      if (!step) {
        return;
      }

      pattern[index] = 1;
      velocity[index] = Math.max(velocity[index], layer.velocity[index] ?? 0);
    });
  });

  return {
    pattern,
    velocity,
  };
}

export function buildMorphOverlayLayer(
  pattern: number[],
  velocity: number[],
  targetLength: number,
): SequencerLayer | null {
  if (!pattern.some((step) => step > 0)) {
    return null;
  }

  const resampledPattern = resamplePatternValues(pattern, targetLength).map((value) => (value > 0 ? 1 : 0));
  const resampledVelocity = resamplePatternValues(velocity, targetLength).map((value) =>
    value > 0 ? Math.max(52, Math.round(value)) : 0,
  );

  return {
    id: "morph-overlay",
    label: "Morph",
    instrumentId: "shaker",
    instrument: "Morph Overlay",
    role: "texture",
    band: "high",
    pattern: resampledPattern,
    velocity: resampledVelocity,
    locked: true,
  };
}

export function getQuickPlayRhythms(limit = 8) {
  return RHYTHM_LIBRARY.filter((definition) => definition.classification === "documented")
    .slice(0, limit);
}
