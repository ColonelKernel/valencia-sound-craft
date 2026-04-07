// MIDI Export Engine
// Generates Standard MIDI File (SMF) format 0
// Comprehensive VST drum mappings for professional production workflows

import { getTimeSignatureMetaValue, type TimeSignature } from "./rhythmUtils";

export type MidiMapping =
  | 'general-midi'
  | 'ableton'
  | 'battery'
  | 'superior-drummer'
  | 'addictive-drums'
  | 'ezdrummer'
  | 'bfd'
  | 'slate-ssd'
  | 'xln-xo'
  | 'kontakt-studio'
  | 'logic-drummer'
  | 'maschine'
  | 'mpc'
  | 'reason-kong'
  | 'fl-fpc'
  | 'hydrogen'
  | 'mt-power'
  | 'getgood-drums'
  | 'ugritone'
  | 'modo-drum'
  | 'custom';

export interface MidiMapEntry {
  instrumentId: string;
  note: number;
  name: string;
}

// ─── General MIDI Drum Map (Channel 10) ─────────────────────────────────────
// Reference: GM Level 1 specification (notes 35-81)
const GM_MAP: Record<string, number> = {
  // Kicks
  'kick':         36,  // C1 - Bass Drum 1
  '808-kick':     36,
  'cajon':        36,
  'cajon_low':    36,
  'surdo':        35,  // B0 - Acoustic Bass Drum (lower)
  'zabumba_low':  36,
  'tupan_low':    36,
  'bombo_leguero_low': 36,
  'djembe_bass':  36,
  'darbuka_dum':  36,
  'frame_drum':   36,
  'riq_dum':      36,
  'dhol_bass':    36,
  'cajon_bass':   36,
  'tabla_bayan':  36,
  // Snares / Rimshots
  'snare':        38,  // D1 - Acoustic Snare
  '808-snare':    40,  // E1 - Electric Snare
  'rimshot':      37,  // C#1 - Side Stick
  'repique':      50,  // D2 - High Tom
  'cajon_slap':   38,
  'cajon_high':   38,
  'cajon_ghost':  38,
  'djembe_slap':  39,
  'djembe_tone':  38,
  'tupan_high':   38,
  'zabumba_high': 37,
  'bombo_leguero_high': 38,
  'bombo_leguero_rim': 37,
  'dhol_tilli':   38,
  'repinique':    50,
  // Claps
  'clap':         39,  // D#1 - Hand Clap
  'palmas':       39,
  'konnakol':     39,
  // Hi-hats
  'hh-closed':    42,  // F#1 - Closed Hi-Hat
  'hh-open':      46,  // A#1 - Open Hi-Hat
  'hihat':        42,
  'hihat-closed': 42,
  'hihat-open':   46,
  // Toms
  'tom-low':      45,  // A1 - Low Tom
  'tom-high':     50,  // D2 - High Tom
  'tom1':         50,
  'tom2':         47,  // B1 - Low-Mid Tom
  'tom3':         43,  // G1 - High Floor Tom
  'floor_tom':    41,  // F1 - Low Floor Tom
  // Cymbals
  'crash':        49,  // C#2 - Crash Cymbal 1
  'ride':         51,  // D#2 - Ride Cymbal 1
  // Percussion
  'cowbell':      56,  // G#2
  'clave':        75,  // D#4 - Claves
  'campana':      56,
  'dunun_bell':   56,
  'tambourine':   54,  // F#2
  'shaker':       70,  // A#3 - Maracas
  'guiro':        73,  // C#4 - Short Guiro
  'agogo':        67,  // G3 - High Agogo
  'agogo_high':   67,
  'agogo_low':    68,  // G#3 - Low Agogo
  'triangle':     81,
  'riq':          54,
  // Congas
  'conga-low':    64,  // E3 - Low Conga
  'conga-high':   63,  // D#3 - Open High Conga
  'conga-slap':   62,  // D3 - Mute High Conga
  'conga_high':   63,
  'conga_low':    64,
  'conga_slap':   62,
  // Bongos
  'bongo':        61,  // C#3 - High Bongo
  'bongo_high':   60,  // C3 - High Bongo
  'bongo_low':    61,  // C#3 - Low Bongo
  // Timbales
  'timbale_high': 65,  // F3 - High Timbale
  'timbale_low':  66,  // F#3 - Low Timbale
  // World percussion
  'tabla_na':     67,
  'tabla_dayan':  68,
  'tabla_tin':    68,
  'tabla_tun':    64,
  'tabla_ge':     36,
  'tabla_ke':     38,
  'darbuka_tek':  42,
  'darbuka_ka':   44,  // G#1 - Pedal Hi-Hat
  'riq_tek':      42,
  'riq_tik':      44,
  'ganza':        70,
};

// ─── Ableton Drum Rack ──────────────────────────────────────────────────────
// Default Drum Rack layout (C1=36 start, sequential pads)
const ABLETON_MAP: Record<string, number> = {
  ...GM_MAP,
  'kick': 36, '808-kick': 36, 'surdo': 35,
  'snare': 38, '808-snare': 40, 'rimshot': 37,
  'clap': 39, 'hh-closed': 42, 'hh-open': 46,
  'tom-low': 43, 'tom-high': 47, 'crash': 49, 'ride': 51,
  'cowbell': 56, 'clave': 75,
  'conga-low': 64, 'conga-high': 63, 'conga-slap': 62,
  'bongo': 61, 'cajon': 36, 'shaker': 70,
  'agogo': 67, 'repique': 50, 'tambourine': 54,
};

// ─── Superior Drummer 3 ─────────────────────────────────────────────────────
// SD3 uses extended GM with articulation layers
const SD_MAP: Record<string, number> = {
  ...GM_MAP,
  'kick':         36,  // C1
  'snare':        38,  // D1 - Center hit
  'rimshot':      40,  // E1 - Rimshot in SD3
  'clap':         39,
  'hh-closed':    42,  // F#1 - Tight
  'hh-open':      46,  // A#1 - Open
  'tom-high':     48,  // C2
  'tom-low':      45,  // A1
  'crash':        49,
  'ride':         51,  // D#2 - Bow
};

// ─── EZdrummer / EZdrummer 3 ────────────────────────────────────────────────
// Toontrack EZdrummer mapping (close to GM with some key differences)
const EZDRUMMER_MAP: Record<string, number> = {
  ...GM_MAP,
  'kick':         36,  // C1
  'snare':        38,  // D1 - Center
  'rimshot':      37,  // C#1 - Sidestick
  '808-snare':    40,  // E1 - Rimshot
  'clap':         39,
  'hh-closed':    42,  // F#1 - Closed edge
  'hh-open':      46,  // A#1 - Open
  'tom-high':     48,  // C2 - Rack Tom 1
  'tom-low':      45,  // A1 - Floor Tom 1
  'crash':        49,  // C#2
  'ride':         51,  // D#2 - Bow
  'cowbell':      56,
  'tambourine':   54,
  'shaker':       70,
};

// ─── BFD3 ───────────────────────────────────────────────────────────────────
// FXpansion BFD3 uses a slightly shifted mapping
const BFD_MAP: Record<string, number> = {
  ...GM_MAP,
  'kick':         36,  // C1
  'snare':        38,  // D1 - Center
  'rimshot':      37,  // C#1 - Cross stick
  'clap':         39,
  'hh-closed':    42,  // F#1
  'hh-open':      46,  // A#1
  'tom-high':     50,  // D2
  'tom-low':      47,  // B1
  'crash':        49,  // C#2
  'ride':         51,  // D#2
};

// ─── Steven Slate Drums (SSD5) ──────────────────────────────────────────────
const SLATE_MAP: Record<string, number> = {
  ...GM_MAP,
  'kick':         36,  // C1
  'snare':        38,  // D1 - Center
  'rimshot':      37,  // C#1 - Sidestick
  '808-snare':    40,
  'clap':         39,
  'hh-closed':    42,
  'hh-open':      46,
  'tom-high':     48,  // C2
  'tom-low':      45,  // A1
  'crash':        49,
  'ride':         51,
};

// ─── XLN Audio XO ───────────────────────────────────────────────────────────
// XO uses C1-based sequential mapping similar to Ableton
const XO_MAP: Record<string, number> = {
  'kick':         36, '808-kick': 36,
  'snare':        37, '808-snare': 38,
  'rimshot':      39, 'clap': 40,
  'hh-closed':    41, 'hh-open': 42,
  'tom-low':      43, 'tom-high': 44,
  'crash':        45, 'ride': 46,
  'cowbell':      47, 'clave': 48,
  'conga-low':    49, 'conga-high': 50, 'conga-slap': 51,
  'bongo':        52, 'shaker': 53, 'tambourine': 54,
  'cajon':        36, 'surdo': 36,
  'agogo':        55, 'repique': 44,
  'hihat':        41, 'hihat-closed': 41, 'hihat-open': 42,
  'guiro':        56, 'djembe_bass': 36, 'djembe_tone': 37,
  'djembe_slap':  40, 'tabla_na': 57, 'tabla_ge': 36,
  'darbuka_dum':  36, 'darbuka_tek': 41, 'frame_drum': 36,
};

// ─── Kontakt Studio Drummer ─────────────────────────────────────────────────
const KONTAKT_MAP: Record<string, number> = {
  ...GM_MAP,
  'kick':         36,
  'snare':        38,
  'rimshot':      37,  // Cross stick
  'clap':         39,
  'hh-closed':    42,  // Tight
  'hh-open':      46,
  'tom-high':     48,
  'tom-low':      45,
  'crash':        49,
  'ride':         51,
  'cowbell':      56,
  'tambourine':   54,
  'shaker':       82,  // Shaker in Kontakt
};

// ─── Logic Pro Drummer ──────────────────────────────────────────────────────
const LOGIC_MAP: Record<string, number> = {
  ...GM_MAP,
  'kick':         36,
  'snare':        38,
  'rimshot':      37,
  'clap':         39,
  'hh-closed':    42,
  'hh-open':      46,
  'tom-high':     48,
  'tom-low':      43,
  'crash':        49,
  'ride':         51,
  'cowbell':      56,
  'tambourine':   54,
  'shaker':       70,
};

// ─── NI Maschine ────────────────────────────────────────────────────────────
// Maschine pads map from C1 (36) in groups of 4x4
const MASCHINE_MAP: Record<string, number> = {
  'kick':         36,  // Pad 1
  '808-kick':     36,
  'snare':        37,  // Pad 2
  '808-snare':    37,
  'rimshot':      38,  // Pad 3
  'clap':         39,  // Pad 4
  'hh-closed':    40,  // Pad 5
  'hh-open':      41,  // Pad 6
  'tom-low':      42,  // Pad 7
  'tom-high':     43,  // Pad 8
  'crash':        44,  // Pad 9
  'ride':         45,  // Pad 10
  'conga-low':    46,  // Pad 11
  'conga-high':   47,  // Pad 12
  'conga-slap':   48,  // Pad 13
  'cowbell':      49,  // Pad 14
  'shaker':       50,  // Pad 15
  'tambourine':   51,  // Pad 16
  'hihat':        40, 'hihat-closed': 40, 'hihat-open': 41,
  'cajon':        36, 'surdo': 36, 'bongo': 47,
  'clave':        49, 'agogo': 50, 'repique': 43,
  'guiro':        51, 'djembe_bass': 36, 'djembe_tone': 37,
  'djembe_slap':  39,
};

// ─── Akai MPC ───────────────────────────────────────────────────────────────
// MPC maps pads from C1 (37) in bank layout
const MPC_MAP: Record<string, number> = {
  'kick':         37,  // Pad A01
  '808-kick':     37,
  'snare':        38,  // Pad A02
  '808-snare':    38,
  'rimshot':      39,  // Pad A03
  'clap':         40,  // Pad A04
  'hh-closed':    42,  // Pad A06
  'hh-open':      46,  // Pad A10
  'tom-low':      43,  // Pad A07
  'tom-high':     45,  // Pad A09
  'crash':        49,  // Pad A13
  'ride':         51,  // Pad A15
  'conga-low':    64,
  'conga-high':   63,
  'conga-slap':   62,
  'cowbell':      56,
  'shaker':       70,
  'tambourine':   54,
  'hihat':        42, 'hihat-closed': 42, 'hihat-open': 46,
  'cajon':        37, 'surdo': 35, 'bongo': 61,
  'clave':        75, 'agogo': 67,
};

// ─── Reason Kong ────────────────────────────────────────────────────────────
const KONG_MAP: Record<string, number> = {
  'kick':         36,  // C1 - Pad 1
  '808-kick':     36,
  'snare':        37,  // C#1 - Pad 2
  '808-snare':    37,
  'rimshot':      38,
  'clap':         39,
  'hh-closed':    40,
  'hh-open':      41,
  'tom-low':      42,
  'tom-high':     43,
  'crash':        44,
  'ride':         45,
  'conga-low':    46,
  'conga-high':   47,
  'conga-slap':   48,
  'cowbell':      49,
  'hihat':        40, 'hihat-closed': 40, 'hihat-open': 41,
  'shaker':       50, 'tambourine': 51, 'bongo': 47,
  'cajon':        36, 'surdo': 36, 'clave': 49,
};

// ─── FL Studio FPC ──────────────────────────────────────────────────────────
const FPC_MAP: Record<string, number> = {
  'kick':         36,  // C5 mapped to GM
  '808-kick':     36,
  'snare':        38,
  '808-snare':    40,
  'rimshot':      37,
  'clap':         39,
  'hh-closed':    42,
  'hh-open':      46,
  'tom-low':      41,
  'tom-high':     48,
  'crash':        49,
  'ride':         51,
  'cowbell':      56,
  'conga-low':    64,
  'conga-high':   63,
  'conga-slap':   62,
  'hihat':        42, 'hihat-closed': 42, 'hihat-open': 46,
  'shaker':       70, 'tambourine': 54, 'bongo': 61,
  'cajon':        36, 'surdo': 35, 'clave': 75,
  'agogo':        67, 'repique': 50,
};

// ─── Hydrogen Drum Machine ──────────────────────────────────────────────────
const HYDROGEN_MAP: Record<string, number> = {
  'kick':         36,
  'snare':        38,
  'rimshot':      37,
  'clap':         39,
  'hh-closed':    42,
  'hh-open':      46,
  'tom-low':      45,
  'tom-high':     50,
  'crash':        49,
  'ride':         51,
  'cowbell':      56,
  'hihat':        42, 'hihat-closed': 42, 'hihat-open': 46,
  'conga-low':    64, 'conga-high': 63, 'conga-slap': 62,
  'shaker':       70, 'tambourine': 54,
  'cajon':        36, 'surdo': 35,
};

// ─── MT Power DrumKit ───────────────────────────────────────────────────────
const MT_POWER_MAP: Record<string, number> = {
  ...GM_MAP,
  'kick':         36,
  'snare':        38,  // Center
  'rimshot':      37,  // Cross stick
  'clap':         39,
  'hh-closed':    42,  // Tight
  'hh-open':      46,
  'tom-high':     48,
  'tom-low':      45,
  'crash':        49,
  'ride':         51,
};

// ─── GetGood Drums ──────────────────────────────────────────────────────────
const GGD_MAP: Record<string, number> = {
  ...GM_MAP,
  'kick':         36,  // C1
  'snare':        38,  // D1 - Center
  'rimshot':      37,  // C#1 - Sidestick
  'clap':         39,
  'hh-closed':    42,  // F#1 - Tight
  'hh-open':      46,  // A#1
  'tom-high':     48,  // C2
  'tom-low':      45,  // A1
  'crash':        49,
  'ride':         51,
};

// ─── Ugritone ───────────────────────────────────────────────────────────────
const UGRITONE_MAP: Record<string, number> = {
  ...GM_MAP,
  'kick':         36,
  'snare':        38,
  'rimshot':      37,
  'clap':         39,
  'hh-closed':    42,
  'hh-open':      46,
  'tom-high':     50,
  'tom-low':      47,
  'crash':        49,
  'ride':         51,
};

// ─── IK Multimedia MODO Drum ────────────────────────────────────────────────
const MODO_MAP: Record<string, number> = {
  ...GM_MAP,
  'kick':         36,
  'snare':        38,
  'rimshot':      37,
  'clap':         39,
  'hh-closed':    42,
  'hh-open':      46,
  'tom-high':     48,
  'tom-low':      45,
  'crash':        49,
  'ride':         51,
  'cowbell':      56,
  'tambourine':   54,
};

// ─── NI Battery 4 ───────────────────────────────────────────────────────────
// Battery allows custom cells; this is the default factory kit layout
const BATTERY_MAP: Record<string, number> = {
  'kick':         36,  // Cell A1
  '808-kick':     36,
  'snare':        38,  // Cell A3
  '808-snare':    40,
  'rimshot':      37,
  'clap':         39,
  'hh-closed':    42,
  'hh-open':      46,
  'tom-low':      43,
  'tom-high':     47,
  'crash':        49,
  'ride':         51,
  'cowbell':      56,
  'clave':        75,
  'conga-low':    64,
  'conga-high':   63,
  'conga-slap':   62,
  'bongo':        61,
  'shaker':       70,
  'tambourine':   54,
  'hihat':        42, 'hihat-closed': 42, 'hihat-open': 46,
  'cajon':        36, 'surdo': 35, 'agogo': 67,
  'repique':      50, 'guiro': 73,
};

// ─── Addictive Drums 2 ─────────────────────────────────────────────────────
const AD_MAP: Record<string, number> = {
  ...GM_MAP,
  'kick':         36,
  'snare':        38,  // Center
  'rimshot':      37,  // Sidestick
  '808-snare':    40,  // Rimshot
  'clap':         39,
  'hh-closed':    42,  // Closed tight
  'hh-open':      46,  // Open
  'tom-high':     48,  // Tom 1
  'tom-low':      45,  // Tom 4 (floor)
  'crash':        49,  // Crash L
  'ride':         51,  // Ride bow
};

const MAPPING_TABLES: Record<MidiMapping, Record<string, number>> = {
  'general-midi':       GM_MAP,
  'ableton':            ABLETON_MAP,
  'battery':            BATTERY_MAP,
  'superior-drummer':   SD_MAP,
  'addictive-drums':    AD_MAP,
  'ezdrummer':          EZDRUMMER_MAP,
  'bfd':                BFD_MAP,
  'slate-ssd':          SLATE_MAP,
  'xln-xo':             XO_MAP,
  'kontakt-studio':     KONTAKT_MAP,
  'logic-drummer':      LOGIC_MAP,
  'maschine':           MASCHINE_MAP,
  'mpc':                MPC_MAP,
  'reason-kong':        KONG_MAP,
  'fl-fpc':             FPC_MAP,
  'hydrogen':           HYDROGEN_MAP,
  'mt-power':           MT_POWER_MAP,
  'getgood-drums':      GGD_MAP,
  'ugritone':           UGRITONE_MAP,
  'modo-drum':          MODO_MAP,
  'custom':             GM_MAP,
};

export const MIDI_MAPPINGS: { id: MidiMapping; label: string; category: string }[] = [
  // DAW Built-in
  { id: 'general-midi',     label: 'General MIDI',          category: 'Standard' },
  { id: 'ableton',          label: 'Ableton Drum Rack',     category: 'DAW' },
  { id: 'logic-drummer',    label: 'Logic Pro Drummer',     category: 'DAW' },
  { id: 'fl-fpc',           label: 'FL Studio FPC',         category: 'DAW' },
  { id: 'reason-kong',      label: 'Reason Kong',           category: 'DAW' },
  // Professional Drum VSTs
  { id: 'superior-drummer', label: 'Superior Drummer 3',    category: 'VST' },
  { id: 'ezdrummer',        label: 'EZdrummer 3',           category: 'VST' },
  { id: 'addictive-drums',  label: 'Addictive Drums 2',     category: 'VST' },
  { id: 'bfd',              label: 'BFD3',                  category: 'VST' },
  { id: 'slate-ssd',        label: 'Steven Slate SSD5',     category: 'VST' },
  { id: 'getgood-drums',    label: 'GetGood Drums',         category: 'VST' },
  { id: 'modo-drum',        label: 'MODO Drum',             category: 'VST' },
  { id: 'mt-power',         label: 'MT Power DrumKit',      category: 'VST' },
  { id: 'ugritone',         label: 'Ugritone KVLT/KSHMR',   category: 'VST' },
  // Hardware / Samplers
  { id: 'battery',          label: 'NI Battery 4',          category: 'Sampler' },
  { id: 'maschine',         label: 'NI Maschine',           category: 'Sampler' },
  { id: 'mpc',              label: 'Akai MPC',              category: 'Sampler' },
  { id: 'kontakt-studio',   label: 'Kontakt Studio Drummer', category: 'Sampler' },
  { id: 'xln-xo',           label: 'XLN Audio XO',          category: 'Sampler' },
  // Open Source
  { id: 'hydrogen',         label: 'Hydrogen',              category: 'Free' },
  // Custom
  { id: 'custom',           label: 'Custom (GM base)',       category: 'Custom' },
];

export function getMidiNote(instrumentId: string, mapping: MidiMapping): number {
  const table = MAPPING_TABLES[mapping] || GM_MAP;
  return table[instrumentId] ?? GM_MAP[instrumentId] ?? 36;
}

// ─── MIDI File Generation ────────────────────────────────────────────────────

function writeVarLen(value: number): number[] {
  const bytes: number[] = [];
  let v = value;
  bytes.push(v & 0x7F);
  while ((v >>= 7) > 0) {
    bytes.push((v & 0x7F) | 0x80);
  }
  return bytes.reverse();
}

function writeInt16(v: number): number[] {
  return [(v >> 8) & 0xFF, v & 0xFF];
}

function writeInt32(v: number): number[] {
  return [(v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
}

interface MidiEvent {
  tick: number;
  type: 'noteOn' | 'noteOff';
  note: number;
  velocity: number;
  channel: number;
}

export interface ExportTrack {
  instrumentId: string;
  steps: number[]; // velocity array
  subdivisions: number;
}

export function generateMidiFile(
  tracks: ExportTrack[],
  bpm: number,
  mapping: MidiMapping,
  swing: number = 0,
  includeHumanization: boolean = false,
  bars: number = 4,
  timeSignature: TimeSignature = [4, 4],
  phraseMode: boolean = false,
): Uint8Array {
  const ppq = 480; // pulses per quarter note
  const channel = 9; // MIDI channel 10 (0-indexed = 9) for drums
  const [numerator, denominator] = timeSignature;
  const barTicks = Math.round((ppq * numerator * 4) / denominator);

  const events: MidiEvent[] = [];

  tracks.forEach(track => {
    const midiNote = getMidiNote(track.instrumentId, mapping);
    const phraseTicks = phraseMode ? barTicks * Math.max(1, bars) : barTicks;
    const ticksPerStep = phraseTicks / Math.max(1, track.subdivisions);
    const repetitions = phraseMode ? 1 : Math.max(1, bars);

    for (let bar = 0; bar < repetitions; bar += 1) {
      const barOffset = phraseMode ? 0 : bar * barTicks;

      track.steps.forEach((velocity, stepIdx) => {
        if (velocity <= 0) return;

        let tick = barOffset + Math.round(stepIdx * ticksPerStep);

        // Apply swing to even-indexed steps (off-beats)
        if (swing > 0 && stepIdx % 2 === 1) {
          tick += Math.round(ticksPerStep * swing / 100);
        }

        // Humanization: velocity-aware timing offsets
        if (includeHumanization) {
          // Ghost notes get more timing variation (feels more human)
          const timingAmount = velocity < 0.5 ? 0.15 : velocity < 0.8 ? 0.08 : 0.04;
          tick += Math.round((Math.random() - 0.5) * ticksPerStep * timingAmount);
          // Slight push/pull based on position in beat (rushing tendency on upbeats)
          if (stepIdx % 2 === 1) {
            tick += Math.round(ticksPerStep * 0.02 * (Math.random() - 0.3));
          }
        }

        // Velocity mapping: accents get boosted, ghosts get compressed
        let midiVel: number;
        if (velocity >= 0.9) {
          // Accent: 100-127 range
          midiVel = Math.round(100 + velocity * 27);
        } else if (velocity < 0.5) {
          // Ghost note: 30-60 range
          midiVel = Math.round(30 + velocity * 60);
        } else {
          // Normal hit: 70-100 range
          midiVel = Math.round(70 + (velocity - 0.5) * 75);
        }
        midiVel = Math.max(1, Math.min(127, midiVel));

        // Add velocity humanization
        if (includeHumanization) {
          midiVel += Math.round((Math.random() - 0.5) * 8);
          midiVel = Math.max(1, Math.min(127, midiVel));
        }

        events.push({ tick, type: 'noteOn', note: midiNote, velocity: midiVel, channel });
        // Note-off duration varies by instrument role
        const noteLen = velocity >= 0.9 ? 0.6 : velocity < 0.5 ? 0.3 : 0.5;
        events.push({ tick: tick + Math.round(ticksPerStep * noteLen), type: 'noteOff', note: midiNote, velocity: 0, channel });
      });
    }
  });

  // Sort by tick
  events.sort((a, b) => a.tick - b.tick || (a.type === 'noteOff' ? -1 : 1));

  // Build track data
  const trackData: number[] = [];

  // Tempo meta event
  const microsecondsPerBeat = Math.round(60000000 / bpm);
  trackData.push(0x00, 0xFF, 0x51, 0x03,
    (microsecondsPerBeat >> 16) & 0xFF,
    (microsecondsPerBeat >> 8) & 0xFF,
    microsecondsPerBeat & 0xFF
  );

  // Time signature meta event
  trackData.push(
    0x00,
    0xFF,
    0x58,
    0x04,
    numerator & 0xFF,
    getTimeSignatureMetaValue(denominator) & 0xFF,
    0x18,
    0x08
  );

  // Track name
  const name = 'Drum Machine Export';
  trackData.push(0x00, 0xFF, 0x03, name.length);
  for (let i = 0; i < name.length; i++) trackData.push(name.charCodeAt(i));

  // Note events
  let lastTick = 0;
  events.forEach(ev => {
    const delta = ev.tick - lastTick;
    trackData.push(...writeVarLen(delta));

    const status = ev.type === 'noteOn' ? (0x90 | ev.channel) : (0x80 | ev.channel);
    trackData.push(status, ev.note, ev.velocity);
    lastTick = ev.tick;
  });

  // End of track
  trackData.push(0x00, 0xFF, 0x2F, 0x00);

  // Build full MIDI file
  const header = [
    0x4D, 0x54, 0x68, 0x64, // MThd
    ...writeInt32(6),        // header length
    ...writeInt16(0),        // format 0
    ...writeInt16(1),        // 1 track
    ...writeInt16(ppq),      // ticks per quarter
  ];

  const trackHeader = [
    0x4D, 0x54, 0x72, 0x6B, // MTrk
    ...writeInt32(trackData.length),
  ];

  return new Uint8Array([...header, ...trackHeader, ...trackData]);
}

export function downloadMidiFile(data: Uint8Array, filename: string) {
  const blob = new Blob([data.buffer as ArrayBuffer], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
