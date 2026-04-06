// MIDI Export Engine
// Generates Standard MIDI File (SMF) format 0

export type MidiMapping = 'general-midi' | 'ableton' | 'battery' | 'superior-drummer' | 'addictive-drums' | 'custom';

export interface MidiMapEntry {
  instrumentId: string;
  note: number;
  name: string;
}

// General MIDI Drum Map (Channel 10)
const GM_MAP: Record<string, number> = {
  'kick': 36,        // C1
  '808-kick': 36,
  'snare': 38,       // D1
  '808-snare': 38,
  'rimshot': 37,     // C#1
  'clap': 39,        // D#1
  'hh-closed': 42,   // F#1
  'hh-open': 46,     // A#1
  'tom-low': 45,     // A1
  'tom-high': 50,    // D2
  'crash': 49,       // C#2
  'ride': 51,        // D#2
  'cowbell': 56,     // G#2
  'clave': 75,       // D#3
  'conga-low': 64,   // E2
  'conga-high': 63,  // D#2
  'conga-slap': 62,  // D2
  'bongo': 60,       // C2
  'cajon': 36,       // mapped to kick
  'shaker': 70,      // Maracas
  'agogo': 67,       // High Agogo
  'surdo': 36,       // mapped to kick (low)
  'repique': 50,     // High Tom
};

// Ableton Drum Rack (C1 = 36 start, sequential)
const ABLETON_MAP: Record<string, number> = {
  'kick': 36, '808-kick': 36,
  'snare': 38, '808-snare': 38,
  'rimshot': 37, 'clap': 39,
  'hh-closed': 42, 'hh-open': 46,
  'tom-low': 43, 'tom-high': 47,
  'crash': 49, 'ride': 51,
  'cowbell': 56, 'clave': 75,
  'conga-low': 64, 'conga-high': 63,
  'conga-slap': 62, 'bongo': 61,
  'cajon': 36, 'shaker': 70,
  'agogo': 67, 'surdo': 35, 'repique': 50,
};

// Superior Drummer (similar to GM with some differences)
const SD_MAP: Record<string, number> = { ...GM_MAP, 'kick': 36, 'snare': 38 };

// Battery (NI) - uses GM as base
const BATTERY_MAP: Record<string, number> = { ...GM_MAP };

// Addictive Drums
const AD_MAP: Record<string, number> = { ...GM_MAP };

const MAPPING_TABLES: Record<MidiMapping, Record<string, number>> = {
  'general-midi': GM_MAP,
  'ableton': ABLETON_MAP,
  'battery': BATTERY_MAP,
  'superior-drummer': SD_MAP,
  'addictive-drums': AD_MAP,
  'custom': GM_MAP,
};

export const MIDI_MAPPINGS: { id: MidiMapping; label: string }[] = [
  { id: 'general-midi', label: 'General MIDI' },
  { id: 'ableton', label: 'Ableton Drum Rack' },
  { id: 'battery', label: 'NI Battery' },
  { id: 'superior-drummer', label: 'Superior Drummer' },
  { id: 'addictive-drums', label: 'Addictive Drums' },
  { id: 'custom', label: 'Custom' },
];

export function getMidiNote(instrumentId: string, mapping: MidiMapping): number {
  const table = MAPPING_TABLES[mapping] || GM_MAP;
  return table[instrumentId] ?? 36;
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
  bars: number = 4
): Uint8Array {
  const ppq = 480; // pulses per quarter note
  const channel = 9; // MIDI channel 10 (0-indexed = 9) for drums

  const events: MidiEvent[] = [];

  for (let bar = 0; bar < bars; bar++) {
    tracks.forEach(track => {
      const midiNote = getMidiNote(track.instrumentId, mapping);
      const ticksPerStep = (ppq * 4) / track.subdivisions; // 4 = beats per bar
      const barOffset = bar * ppq * 4;

      track.steps.forEach((velocity, stepIdx) => {
        if (velocity <= 0) return;

        let tick = barOffset + Math.round(stepIdx * ticksPerStep);

        // Apply swing to even-indexed steps (off-beats)
        if (swing > 0 && stepIdx % 2 === 1) {
          tick += Math.round(ticksPerStep * swing / 100);
        }

        // Humanization: slight random timing offset
        if (includeHumanization) {
          tick += Math.round((Math.random() - 0.5) * ticksPerStep * 0.08);
        }

        const midiVel = Math.max(1, Math.min(127, Math.round(velocity * 127)));

        events.push({ tick, type: 'noteOn', note: midiNote, velocity: midiVel, channel });
        events.push({ tick: tick + Math.round(ticksPerStep * 0.5), type: 'noteOff', note: midiNote, velocity: 0, channel });
      });
    });
  }

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

  // Time signature meta event (4/4)
  trackData.push(0x00, 0xFF, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08);

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
  const blob = new Blob([data], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
