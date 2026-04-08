import { REGION_LABELS, RHYTHM_PATTERNS, type InstrumentRole, type Region } from "@/components/DrumMachine/rhythmData";

export interface MusicRhythmRecord {
  id: string;
  name: string;
  country: string;
  region: Region;
  regionLabel: string;
  timeSignature: string;
  bpmRange: [number, number];
  instruments: Array<{
    id: string;
    name: string;
    instrument: string;
    role: InstrumentRole;
    midiNote: number;
  }>;
  pattern: Array<{
    instrumentId: string;
    role: InstrumentRole;
    steps: number[];
  }>;
  source: string;
}

export const MUSIC_RHYTHM_DATASET: MusicRhythmRecord[] = RHYTHM_PATTERNS.map((pattern) => ({
  id: pattern.id,
  name: pattern.name,
  country: pattern.country || "Global",
  region: pattern.region,
  regionLabel: REGION_LABELS[pattern.region],
  timeSignature: pattern.meter,
  bpmRange: pattern.tempoRange,
  instruments: pattern.instruments.map((instrument) => ({
    id: instrument.id,
    name: instrument.name,
    instrument: instrument.instrument,
    role: instrument.role,
    midiNote: instrument.midiNote,
  })),
  pattern: pattern.instruments.map((instrument) => ({
    instrumentId: instrument.id,
    role: instrument.role,
    steps: [...(pattern.pattern[instrument.id] || [])],
  })),
  source: pattern.source || `${pattern.name} rhythm reference`,
}));

export function getMusicRhythmById(id: string) {
  return MUSIC_RHYTHM_DATASET.find((rhythm) => rhythm.id === id) || null;
}

export function getMusicRhythmsByRegion(region: Region) {
  return MUSIC_RHYTHM_DATASET.filter((rhythm) => rhythm.region === region);
}

