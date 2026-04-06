// All 12 chromatic notes in order (using flats for flat keys, sharps for sharp keys)
const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Keys that use flats in their spelling
const FLAT_KEYS = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'];

// Mode intervals (semitones from root)
export const MODE_INTERVALS: Record<string, number[]> = {
  Ionian:     [0, 2, 4, 5, 7, 9, 11],
  Dorian:     [0, 2, 3, 5, 7, 9, 10],
  Phrygian:   [0, 1, 3, 5, 7, 8, 10],
  Lydian:     [0, 2, 4, 6, 7, 9, 11],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10],
  Aeolian:    [0, 2, 3, 5, 7, 8, 10],
  Locrian:    [0, 1, 3, 5, 6, 8, 10],
};

// Interval names for each mode
export const MODE_INTERVAL_NAMES: Record<string, string[]> = {
  Ionian:     ['1', '2', '3', '4', '5', '6', '7'],
  Dorian:     ['1', '2', 'b3', '4', '5', '6', 'b7'],
  Phrygian:   ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'],
  Lydian:     ['1', '2', '3', '#4', '5', '6', '7'],
  Mixolydian: ['1', '2', '3', '4', '5', '6', 'b7'],
  Aeolian:    ['1', '2', 'b3', '4', '5', 'b6', 'b7'],
  Locrian:    ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'],
};

export const ALL_ROOTS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
export const MODE_NAMES = Object.keys(MODE_INTERVALS);

// Enharmonic equivalents
const ENHARMONIC: Record<string, string> = {
  'C#': 'Db', 'Db': 'C#',
  'D#': 'Eb', 'Eb': 'D#',
  'F#': 'Gb', 'Gb': 'F#',
  'G#': 'Ab', 'Ab': 'G#',
  'A#': 'Bb', 'Bb': 'A#',
};

function useFlats(root: string): boolean {
  return FLAT_KEYS.includes(root) || root.includes('b');
}

export function getScaleNotes(root: string, mode: string): string[] {
  const intervals = MODE_INTERVALS[mode];
  if (!intervals) return [];

  const flats = useFlats(root);
  const chromatic = flats ? NOTES_FLAT : NOTES_SHARP;
  const rootIndex = chromatic.indexOf(root);

  // Handle enharmonic root
  let actualRootIndex = rootIndex;
  let actualChromatic = chromatic;
  if (rootIndex === -1) {
    const alt = flats ? NOTES_SHARP : NOTES_FLAT;
    actualRootIndex = alt.indexOf(root);
    actualChromatic = alt;
    if (actualRootIndex === -1) {
      // Try enharmonic
      const enh = ENHARMONIC[root];
      if (enh) {
        actualRootIndex = chromatic.indexOf(enh);
        actualChromatic = chromatic;
      }
    }
  }

  if (actualRootIndex === -1) return [];

  return intervals.map(i => actualChromatic[(actualRootIndex + i) % 12]);
}

export function isSharp(note: string): boolean {
  return note.includes('#');
}

export function isFlat(note: string): boolean {
  return note.includes('b');
}

export function isNatural(note: string): boolean {
  return !isSharp(note) && !isFlat(note);
}

// Guitar standard tuning (low to high): E2, A2, D3, G3, B3, E4
export const GUITAR_TUNING = [
  { note: 'E', octave: 2 },
  { note: 'A', octave: 2 },
  { note: 'D', octave: 3 },
  { note: 'G', octave: 3 },
  { note: 'B', octave: 3 },
  { note: 'E', octave: 4 },
];

// Bass standard tuning: E1, A1, D2, G2
export const BASS_TUNING = [
  { note: 'E', octave: 1 },
  { note: 'A', octave: 1 },
  { note: 'D', octave: 2 },
  { note: 'G', octave: 2 },
];

// Get note at a specific fret on a string
export function getNoteAtFret(openNote: string, fret: number): string {
  // Always use sharps for fretboard mapping, then we'll match against scale
  const idx = NOTES_SHARP.indexOf(openNote);
  if (idx === -1) {
    // Try flat
    const flatIdx = NOTES_FLAT.indexOf(openNote);
    if (flatIdx === -1) return '';
    return NOTES_SHARP[(flatIdx + fret) % 12];
  }
  return NOTES_SHARP[(idx + fret) % 12];
}

// Check if a note matches any note in the scale (considering enharmonics)
export function noteInScale(note: string, scaleNotes: string[]): boolean {
  if (scaleNotes.includes(note)) return true;
  const enh = ENHARMONIC[note];
  if (enh && scaleNotes.includes(enh)) return true;
  return false;
}

// Get the matching scale note (for display with correct spelling)
export function getScaleNote(note: string, scaleNotes: string[]): string | null {
  if (scaleNotes.includes(note)) return note;
  const enh = ENHARMONIC[note];
  if (enh && scaleNotes.includes(enh)) return enh;
  return null;
}

// Get interval name for a note in the scale
export function getIntervalName(note: string, scaleNotes: string[], mode: string): string {
  const intervals = MODE_INTERVAL_NAMES[mode];
  if (!intervals) return '';
  const idx = scaleNotes.indexOf(note);
  if (idx !== -1) return intervals[idx];
  const enh = ENHARMONIC[note];
  if (enh) {
    const enhIdx = scaleNotes.indexOf(enh);
    if (enhIdx !== -1) return intervals[enhIdx];
  }
  return '';
}

// Convert scale to ABC notation — always ascending
export function scaleToAbc(scaleNotes: string[]): string {
  const abcMap: Record<string, string> = {
    'C': 'C', 'C#': '^C', 'Db': '_D',
    'D': 'D', 'D#': '^D', 'Eb': '_E',
    'E': 'E', 'F': 'F', 'F#': '^F', 'Gb': '_G',
    'G': 'G', 'G#': '^G', 'Ab': '_A',
    'A': 'A', 'A#': '^A', 'Bb': '_B',
    'B': 'B',
  };

  // Chromatic index for pitch comparison
  const chromaticIndex: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1,
    'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'F': 5, 'F#': 6, 'Gb': 6,
    'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10,
    'B': 11,
  };

  // Build notes with correct octave so pitch always ascends
  // ABC default octave: C-B is middle octave (C4). Lowercase = octave up.
  let octave = 0; // 0 = default (C4-B4), 1 = up one octave (lowercase)
  let prevPitch = -1;
  const abcNotes: string[] = [];

  for (const n of scaleNotes) {
    const base = abcMap[n] || n;
    const pitch = chromaticIndex[n] ?? 0;

    if (prevPitch >= 0 && pitch <= prevPitch) {
      octave++; // wrapped around, go up an octave
    }
    prevPitch = pitch;

    if (octave === 0) {
      abcNotes.push(base);
    } else if (octave === 1) {
      abcNotes.push(base.toLowerCase());
    } else {
      abcNotes.push(base.toLowerCase() + "'".repeat(octave - 1));
    }
  }

  // Add the high root (one octave above last note's octave)
  const rootBase = abcMap[scaleNotes[0]] || scaleNotes[0];
  const finalOctave = octave + 1;
  if (finalOctave === 1) {
    abcNotes.push(rootBase.toLowerCase());
  } else {
    abcNotes.push(rootBase.toLowerCase() + "'".repeat(finalOctave - 1));
  }

  return `X:1\nT:\nM:4/4\nL:1/4\nK:C clef=treble\n${abcNotes.join(' ')} |]\n`;
}
