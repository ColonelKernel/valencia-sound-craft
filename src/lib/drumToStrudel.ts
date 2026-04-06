/**
 * Convert DrumMachine TrackState[] into Strudel mini-notation patterns.
 */

import type { RhythmLayer, RhythmPayload } from '@/lib/rhythmBus';

// Map drum instrument IDs to Strudel sound names
const INSTRUMENT_SOUND_MAP: Record<string, string> = {
  kick: 'bd',
  snare: 'sn',
  hihat: 'hh',
  'hihat-open': 'oh',
  'hihat-closed': 'hh',
  tom1: 'ht',
  tom2: 'mt',
  tom3: 'lt',
  floor_tom: 'lt',
  crash: 'cr',
  ride: 'rd',
  clap: 'cp',
  rim: 'rm',
  cowbell: 'cb',
  conga_high: 'congas:0',
  conga_low: 'congas:1',
  conga_slap: 'congas:2',
  bongo_high: 'congas:3',
  bongo_low: 'congas:4',
  shaker: 'shaker',
  tambourine: 'tamb',
  clave: 'cl',
  guiro: 'guiro',
  timbale_high: 'timbal:0',
  timbale_low: 'timbal:1',
  agogo_high: 'agogo:0',
  agogo_low: 'agogo:1',
  surdo: 'bd:3',
  repinique: 'sn:3',
  ganza: 'shaker:1',
  cajon_bass: 'bd:2',
  cajon_slap: 'sn:2',
  cajon_ghost: 'sn:4',
  djembe_bass: 'bd:1',
  djembe_tone: 'sn:1',
  djembe_slap: 'cp:1',
  darbuka_dum: 'bd:4',
  darbuka_tek: 'hh:2',
  darbuka_ka: 'hh:3',
  frame_drum: 'bd:5',
  riq_dum: 'bd:6',
  riq_tek: 'hh:4',
  riq_tik: 'hh:5',
  tabla_na: 'tabla:0',
  tabla_tin: 'tabla:1',
  tabla_tun: 'tabla:2',
  tabla_ge: 'tabla:3',
  tabla_ke: 'tabla:4',
  dhol_bass: 'bd:7',
  dhol_tilli: 'sn:5',
};

interface SimpleTrack {
  instrumentId: string;
  steps: number[];
  subdivisions: number;
  volume: number;
  muted: boolean;
}

/** Convert a single track's step array to Strudel mini-notation */
function trackToMini(track: SimpleTrack): string {
  const sound = INSTRUMENT_SOUND_MAP[track.instrumentId] || 'bd';
  // steps: 0 = off, 1+ = velocity level
  const cells = track.steps.map(v => (v > 0 ? `sound("${sound}")` : '~'));
  return `[${cells.join(' ')}]`;
}

/** Convert full drum machine state to a RhythmPayload */
export function drumTracksToPayload(
  tracks: SimpleTrack[],
  bpm: number,
  swing: number,
  presetName?: string
): RhythmPayload {
  const activeTracks = tracks.filter(t => !t.muted && t.steps.some(s => s > 0));

  if (activeTracks.length === 0) {
    return { pattern: 'silence', tempo: bpm, name: presetName };
  }

  const layers: RhythmLayer[] = activeTracks.map(track => ({
    pattern: trackToMini(track),
    volume: track.volume,
    label: track.instrumentId,
  }));

  // Build a single stacked pattern
  const stackedPattern = activeTracks.length === 1
    ? layers[0].pattern
    : `stack(\n${layers.map(l => `  ${l.pattern}.gain(${l.volume.toFixed(2)})`).join(',\n')}\n)`;

  return {
    pattern: stackedPattern,
    layers,
    tempo: bpm,
    swing: swing / 100,
    source: 'drum-machine',
    name: presetName || 'Custom Pattern',
  };
}

/** Generate a simple example pattern string for a given instrument combo */
export function generateExamplePattern(style: string): string {
  const patterns: Record<string, string> = {
    rock: `stack(
  sound("bd ~ bd ~"),
  sound("~ sn ~ sn"),
  sound("hh hh hh hh")
)`,
    jazz: `stack(
  sound("bd ~ ~ bd ~ ~ bd ~"),
  sound("~ ~ sn ~ ~ sn ~ ~"),
  sound("hh*3").gain(0.6)
)`,
    latin: `stack(
  sound("bd ~ ~ bd ~ bd ~ ~"),
  sound("~ ~ cp ~ ~ ~ cp ~"),
  sound("hh*4").gain(0.5),
  sound("cl ~ cl ~ cl ~ cl ~").gain(0.4)
)`,
    electronic: `stack(
  sound("bd bd ~ bd"),
  sound("~ cp ~ ~"),
  sound("hh*8").gain(0.3)
)`,
  };
  return patterns[style] || patterns.rock;
}
