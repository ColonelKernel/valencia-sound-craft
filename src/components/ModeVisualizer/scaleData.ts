// All 12 chromatic notes in order (using flats for flat keys, sharps for sharp keys)
const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const FLAT_KEYS = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'];

// ─── Mode Categories ────────────────────────────────────────
export interface ModeCategory {
  label: string;
  modes: string[];
}

export const MODE_CATEGORIES: ModeCategory[] = [
  { label: 'Major Modes', modes: ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'] },
  { label: 'Melodic Minor Modes', modes: ['Melodic Minor', 'Dorian b2', 'Lydian Augmented', 'Lydian Dominant', 'Mixolydian b6', 'Aeolian b5 (Locrian #2)', 'Altered (Super Locrian)'] },
  { label: 'Harmonic Minor Modes', modes: ['Harmonic Minor', 'Locrian #6', 'Ionian #5', 'Dorian #4', 'Phrygian Dominant', 'Lydian #2', 'Ultra Locrian'] },
  { label: 'Pentatonic & Blues', modes: ['Major Pentatonic', 'Minor Pentatonic', 'Blues'] },
  { label: 'Other Scales', modes: ['Whole Tone', 'Diminished (HW)', 'Diminished (WH)', 'Chromatic'] },
];

// ─── Intervals (semitones from root) ────────────────────────
export const MODE_INTERVALS: Record<string, number[]> = {
  // Major modes
  Ionian:     [0,2,4,5,7,9,11],
  Dorian:     [0,2,3,5,7,9,10],
  Phrygian:   [0,1,3,5,7,8,10],
  Lydian:     [0,2,4,6,7,9,11],
  Mixolydian: [0,2,4,5,7,9,10],
  Aeolian:    [0,2,3,5,7,8,10],
  Locrian:    [0,1,3,5,6,8,10],
  // Melodic minor modes
  'Melodic Minor':          [0,2,3,5,7,9,11],
  'Dorian b2':              [0,1,3,5,7,9,10],
  'Lydian Augmented':       [0,2,4,6,8,9,11],
  'Lydian Dominant':        [0,2,4,6,7,9,10],
  'Mixolydian b6':          [0,2,4,5,7,8,10],
  'Aeolian b5 (Locrian #2)':[0,2,3,5,6,8,10],
  'Altered (Super Locrian)':[0,1,3,4,6,8,10],
  // Harmonic minor modes
  'Harmonic Minor':   [0,2,3,5,7,8,11],
  'Locrian #6':       [0,1,3,5,6,9,10],
  'Ionian #5':        [0,2,4,5,8,9,11],
  'Dorian #4':        [0,2,3,6,7,9,10],
  'Phrygian Dominant':[0,1,4,5,7,8,10],
  'Lydian #2':        [0,3,4,6,7,9,11],
  'Ultra Locrian':    [0,1,3,4,6,8,9],
  // Pentatonic & Blues
  'Major Pentatonic': [0,2,4,7,9],
  'Minor Pentatonic': [0,3,5,7,10],
  'Blues':            [0,3,5,6,7,10],
  // Other
  'Whole Tone':       [0,2,4,6,8,10],
  'Diminished (HW)':  [0,1,3,4,6,7,9,10],
  'Diminished (WH)':  [0,2,3,5,6,8,9,11],
  'Chromatic':        [0,1,2,3,4,5,6,7,8,9,10,11],
};

// ─── Interval Names ─────────────────────────────────────────
export const MODE_INTERVAL_NAMES: Record<string, string[]> = {
  Ionian:     ['1','2','3','4','5','6','7'],
  Dorian:     ['1','2','b3','4','5','6','b7'],
  Phrygian:   ['1','b2','b3','4','5','b6','b7'],
  Lydian:     ['1','2','3','#4','5','6','7'],
  Mixolydian: ['1','2','3','4','5','6','b7'],
  Aeolian:    ['1','2','b3','4','5','b6','b7'],
  Locrian:    ['1','b2','b3','4','b5','b6','b7'],
  'Melodic Minor':          ['1','2','b3','4','5','6','7'],
  'Dorian b2':              ['1','b2','b3','4','5','6','b7'],
  'Lydian Augmented':       ['1','2','3','#4','#5','6','7'],
  'Lydian Dominant':        ['1','2','3','#4','5','6','b7'],
  'Mixolydian b6':          ['1','2','3','4','5','b6','b7'],
  'Aeolian b5 (Locrian #2)':['1','2','b3','4','b5','b6','b7'],
  'Altered (Super Locrian)':['1','b2','b3','b4','b5','b6','b7'],
  'Harmonic Minor':   ['1','2','b3','4','5','b6','7'],
  'Locrian #6':       ['1','b2','b3','4','b5','6','b7'],
  'Ionian #5':        ['1','2','3','4','#5','6','7'],
  'Dorian #4':        ['1','2','b3','#4','5','6','b7'],
  'Phrygian Dominant':['1','b2','3','4','5','b6','b7'],
  'Lydian #2':        ['1','#2','3','#4','5','6','7'],
  'Ultra Locrian':    ['1','b2','b3','b4','b5','b6','bb7'],
  'Major Pentatonic': ['1','2','3','5','6'],
  'Minor Pentatonic': ['1','b3','4','5','b7'],
  'Blues':            ['1','b3','4','b5','5','b7'],
  'Whole Tone':       ['1','2','3','#4','#5','b7'],
  'Diminished (HW)':  ['1','b2','b3','3','#4','5','6','b7'],
  'Diminished (WH)':  ['1','2','b3','4','b5','b6','6','7'],
  'Chromatic':        ['1','b2','2','b3','3','4','b5','5','b6','6','b7','7'],
};

// ─── Chord Associations ─────────────────────────────────────
export const MODE_CHORDS: Record<string, string[]> = {
  Ionian:     ['Imaj7','IIm7','IIIm7','IVmaj7','V7','VIm7','VIIm7b5'],
  Dorian:     ['Im7','IIm7','bIIImaj7','IV7','Vm7','VIm7b5','bVIImaj7'],
  Phrygian:   ['Im7','bII7','bIIImaj7','IVm7','Vm7b5','bVImaj7','bVIIm7'],
  Lydian:     ['Imaj7','II7','IIIm7','#IVm7b5','Vmaj7','VIm7','VIIm7'],
  Mixolydian: ['I7','IIm7','IIIm7b5','IVmaj7','Vm7','VIm7','bVIImaj7'],
  Aeolian:    ['Im7','IIm7b5','bIIImaj7','IVm7','Vm7','bVImaj7','bVII7'],
  Locrian:    ['Im7b5','bIImaj7','bIIIm7','IVm7','bVmaj7','bVI7','bVIIm7'],
  'Melodic Minor':          ['Im(maj7)','IIm7','bIIImaj7#5','IV7','V7','VIm7b5','VIIm7b5'],
  'Dorian b2':              ['Im7','bIImaj7#5','bIII7','IV7','Vm7b5','VIm7b5','bVIImaj7'],
  'Lydian Augmented':       ['Imaj7#5','II7','IIIm7','#IVm7b5','Vmaj7','#Vm7b5','VIIm7'],
  'Lydian Dominant':        ['I7','IIm7','IIIm7b5','#IVmaj7','Vm7','VIm7','bVIImaj7'],
  'Mixolydian b6':          ['I7','IIm7b5','bIIImaj7','IVm7','Vm7','bVImaj7','bVII7'],
  'Aeolian b5 (Locrian #2)':['Im7b5','IIm7','bIIImaj7','IVm7','bVmaj7','bVI7','bVIIm7'],
  'Altered (Super Locrian)':['Im7b5','bIImaj7','bIIm7','bIV7','bVmaj7','bVI7','bVIIm7'],
  'Harmonic Minor':   ['Im(maj7)','IIm7b5','bIIImaj7#5','IVm7','V7','bVImaj7','VIIdim7'],
  'Locrian #6':       ['Im7b5','bIImaj7','bIIIm7','IVm7','bVmaj7#5','VI7','bVIIm7'],
  'Ionian #5':        ['Imaj7#5','IIm7','IIIm7','IVmaj7','#Vdim7','VIm7','VII7'],
  'Dorian #4':        ['Im7','II7','bIIImaj7#5','#IVdim7','Vm7','VIm7b5','bVIImaj7'],
  'Phrygian Dominant':['I7','bIImaj7','bIIIm7b5','IVm7','bVmaj7','bVIm7','bVIIdim7'],
  'Lydian #2':        ['Imaj7','#IIdim7','IIIm7','#IVm7','Vmaj7#5','VIm7','VII7'],
  'Ultra Locrian':    ['Idim7','bIIm7b5','bIIm7','bIV7','bVm7','bVImaj7','bVIm(maj7)'],
  'Major Pentatonic': ['I','IIm','IIIm','V','VIm'],
  'Minor Pentatonic': ['Im','bIII','IVm','Vm','bVII'],
  'Blues':            ['I7','IV7','V7'],
  'Whole Tone':       ['Iaug','IIaug','IIIaug'],
  'Diminished (HW)':  ['Idim7','bIIdim7','bIIIdim7','IIIdim7'],
  'Diminished (WH)':  ['I7','bIII7','bV7','VI7'],
  'Chromatic':        [],
};

export const ALL_ROOTS = ['C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B'];
export const MODE_NAMES = Object.keys(MODE_INTERVALS);

const ENHARMONIC: Record<string, string> = {
  'C#':'Db','Db':'C#','D#':'Eb','Eb':'D#','F#':'Gb','Gb':'F#','G#':'Ab','Ab':'G#','A#':'Bb','Bb':'A#',
};

function useFlats(root: string): boolean {
  return FLAT_KEYS.includes(root) || root.includes('b');
}

export function getScaleNotes(root: string, mode: string): string[] {
  const intervals = MODE_INTERVALS[mode];
  if (!intervals) return [];

  // Try both sharp and flat spellings, pick the one with fewer accidentals
  // (or use flat-preference for flat keys)
  const trySpelling = (chromatic: string[]): string[] | null => {
    let idx = chromatic.indexOf(root);
    if (idx === -1) return null;
    return intervals.map(i => chromatic[(idx + i) % 12]);
  };

  const sharpResult = trySpelling(NOTES_SHARP);
  const flatResult = trySpelling(NOTES_FLAT);

  if (sharpResult && !flatResult) return sharpResult;
  if (flatResult && !sharpResult) return flatResult;
  if (!sharpResult && !flatResult) {
    // Try enharmonic
    const enh = ENHARMONIC[root];
    if (enh) {
      const enhSharp = NOTES_SHARP.indexOf(enh) >= 0 ? intervals.map(i => NOTES_SHARP[(NOTES_SHARP.indexOf(enh) + i) % 12]) : null;
      const enhFlat = NOTES_FLAT.indexOf(enh) >= 0 ? intervals.map(i => NOTES_FLAT[(NOTES_FLAT.indexOf(enh) + i) % 12]) : null;
      return enhFlat || enhSharp || [];
    }
    return [];
  }

  // Both exist — prefer flats for flat keys, otherwise count accidentals
  if (useFlats(root)) return flatResult!;

  const countAccidentals = (notes: string[]) => notes.filter(n => n.includes('#') || n.includes('b')).length;
  const sharpCount = countAccidentals(sharpResult!);
  const flatCount = countAccidentals(flatResult!);

  if (flatCount < sharpCount) return flatResult!;
  if (sharpCount < flatCount) return sharpResult!;

  // Tie — sharp keys (A, B, D, E, G, C#, F#, G#) prefer sharps; C and F prefer flats for minor modes
  const sharpRoots = ['A', 'B', 'D', 'E', 'G', 'C#', 'F#', 'G#', 'D#', 'A#'];
  if (sharpRoots.includes(root)) return sharpResult!;
  return flatResult!;
}

export function isSharp(note: string): boolean { return note.includes('#'); }
export function isFlat(note: string): boolean { return note.includes('b'); }

// ─── Tunings ─────────────────────────────────────────────────
export interface StringTuning { note: string; octave: number; }

export interface TuningPreset {
  label: string;
  guitar: StringTuning[];
  guitar7: StringTuning[];
  guitar8: StringTuning[];
  bass: StringTuning[];
  bass5: StringTuning[];
  bass6: StringTuning[];
}

export const TUNING_PRESETS: TuningPreset[] = [
  {
    label: 'Standard',
    guitar: [{ note:'E',octave:2 },{ note:'A',octave:2 },{ note:'D',octave:3 },{ note:'G',octave:3 },{ note:'B',octave:3 },{ note:'E',octave:4 }],
    guitar7: [{ note:'B',octave:1 },{ note:'E',octave:2 },{ note:'A',octave:2 },{ note:'D',octave:3 },{ note:'G',octave:3 },{ note:'B',octave:3 },{ note:'E',octave:4 }],
    guitar8: [{ note:'F#',octave:1 },{ note:'B',octave:1 },{ note:'E',octave:2 },{ note:'A',octave:2 },{ note:'D',octave:3 },{ note:'G',octave:3 },{ note:'B',octave:3 },{ note:'E',octave:4 }],
    bass:   [{ note:'E',octave:1 },{ note:'A',octave:1 },{ note:'D',octave:2 },{ note:'G',octave:2 }],
    bass5:  [{ note:'B',octave:0 },{ note:'E',octave:1 },{ note:'A',octave:1 },{ note:'D',octave:2 },{ note:'G',octave:2 }],
    bass6:  [{ note:'B',octave:0 },{ note:'E',octave:1 },{ note:'A',octave:1 },{ note:'D',octave:2 },{ note:'G',octave:2 },{ note:'C',octave:3 }],
  },
  {
    label: 'Half Step Down',
    guitar: [{ note:'Eb',octave:2 },{ note:'Ab',octave:2 },{ note:'Db',octave:3 },{ note:'Gb',octave:3 },{ note:'Bb',octave:3 },{ note:'Eb',octave:4 }],
    guitar7: [{ note:'Bb',octave:1 },{ note:'Eb',octave:2 },{ note:'Ab',octave:2 },{ note:'Db',octave:3 },{ note:'Gb',octave:3 },{ note:'Bb',octave:3 },{ note:'Eb',octave:4 }],
    guitar8: [{ note:'F',octave:1 },{ note:'Bb',octave:1 },{ note:'Eb',octave:2 },{ note:'Ab',octave:2 },{ note:'Db',octave:3 },{ note:'Gb',octave:3 },{ note:'Bb',octave:3 },{ note:'Eb',octave:4 }],
    bass:   [{ note:'Eb',octave:1 },{ note:'Ab',octave:1 },{ note:'Db',octave:2 },{ note:'Gb',octave:2 }],
    bass5:  [{ note:'Bb',octave:0 },{ note:'Eb',octave:1 },{ note:'Ab',octave:1 },{ note:'Db',octave:2 },{ note:'Gb',octave:2 }],
    bass6:  [{ note:'Bb',octave:0 },{ note:'Eb',octave:1 },{ note:'Ab',octave:1 },{ note:'Db',octave:2 },{ note:'Gb',octave:2 },{ note:'B',octave:2 }],
  },
  {
    label: 'Full Step Down',
    guitar: [{ note:'D',octave:2 },{ note:'G',octave:2 },{ note:'C',octave:3 },{ note:'F',octave:3 },{ note:'A',octave:3 },{ note:'D',octave:4 }],
    guitar7: [{ note:'A',octave:1 },{ note:'D',octave:2 },{ note:'G',octave:2 },{ note:'C',octave:3 },{ note:'F',octave:3 },{ note:'A',octave:3 },{ note:'D',octave:4 }],
    guitar8: [{ note:'E',octave:1 },{ note:'A',octave:1 },{ note:'D',octave:2 },{ note:'G',octave:2 },{ note:'C',octave:3 },{ note:'F',octave:3 },{ note:'A',octave:3 },{ note:'D',octave:4 }],
    bass:   [{ note:'D',octave:1 },{ note:'G',octave:1 },{ note:'C',octave:2 },{ note:'F',octave:2 }],
    bass5:  [{ note:'A',octave:0 },{ note:'D',octave:1 },{ note:'G',octave:1 },{ note:'C',octave:2 },{ note:'F',octave:2 }],
    bass6:  [{ note:'A',octave:0 },{ note:'D',octave:1 },{ note:'G',octave:1 },{ note:'C',octave:2 },{ note:'F',octave:2 },{ note:'Bb',octave:2 }],
  },
  {
    label: 'Drop D',
    guitar: [{ note:'D',octave:2 },{ note:'A',octave:2 },{ note:'D',octave:3 },{ note:'G',octave:3 },{ note:'B',octave:3 },{ note:'E',octave:4 }],
    guitar7: [{ note:'A',octave:1 },{ note:'D',octave:2 },{ note:'A',octave:2 },{ note:'D',octave:3 },{ note:'G',octave:3 },{ note:'B',octave:3 },{ note:'E',octave:4 }],
    guitar8: [{ note:'E',octave:1 },{ note:'A',octave:1 },{ note:'D',octave:2 },{ note:'A',octave:2 },{ note:'D',octave:3 },{ note:'G',octave:3 },{ note:'B',octave:3 },{ note:'E',octave:4 }],
    bass:   [{ note:'D',octave:1 },{ note:'A',octave:1 },{ note:'D',octave:2 },{ note:'G',octave:2 }],
    bass5:  [{ note:'B',octave:0 },{ note:'D',octave:1 },{ note:'A',octave:1 },{ note:'D',octave:2 },{ note:'G',octave:2 }],
    bass6:  [{ note:'B',octave:0 },{ note:'D',octave:1 },{ note:'A',octave:1 },{ note:'D',octave:2 },{ note:'G',octave:2 },{ note:'C',octave:3 }],
  },
  {
    label: 'Drop C',
    guitar: [{ note:'C',octave:2 },{ note:'G',octave:2 },{ note:'C',octave:3 },{ note:'F',octave:3 },{ note:'A',octave:3 },{ note:'D',octave:4 }],
    guitar7: [{ note:'G',octave:1 },{ note:'C',octave:2 },{ note:'G',octave:2 },{ note:'C',octave:3 },{ note:'F',octave:3 },{ note:'A',octave:3 },{ note:'D',octave:4 }],
    guitar8: [{ note:'D',octave:1 },{ note:'G',octave:1 },{ note:'C',octave:2 },{ note:'G',octave:2 },{ note:'C',octave:3 },{ note:'F',octave:3 },{ note:'A',octave:3 },{ note:'D',octave:4 }],
    bass:   [{ note:'C',octave:1 },{ note:'G',octave:1 },{ note:'C',octave:2 },{ note:'F',octave:2 }],
    bass5:  [{ note:'B',octave:0 },{ note:'C',octave:1 },{ note:'G',octave:1 },{ note:'C',octave:2 },{ note:'F',octave:2 }],
    bass6:  [{ note:'B',octave:0 },{ note:'C',octave:1 },{ note:'G',octave:1 },{ note:'C',octave:2 },{ note:'F',octave:2 },{ note:'Bb',octave:2 }],
  },
  {
    label: 'Open G',
    guitar: [{ note:'D',octave:2 },{ note:'G',octave:2 },{ note:'D',octave:3 },{ note:'G',octave:3 },{ note:'B',octave:3 },{ note:'D',octave:4 }],
    guitar7: [{ note:'G',octave:1 },{ note:'D',octave:2 },{ note:'G',octave:2 },{ note:'D',octave:3 },{ note:'G',octave:3 },{ note:'B',octave:3 },{ note:'D',octave:4 }],
    guitar8: [{ note:'D',octave:1 },{ note:'G',octave:1 },{ note:'D',octave:2 },{ note:'G',octave:2 },{ note:'D',octave:3 },{ note:'G',octave:3 },{ note:'B',octave:3 },{ note:'D',octave:4 }],
    bass:   [{ note:'D',octave:1 },{ note:'G',octave:1 },{ note:'D',octave:2 },{ note:'G',octave:2 }],
    bass5:  [{ note:'G',octave:0 },{ note:'D',octave:1 },{ note:'G',octave:1 },{ note:'D',octave:2 },{ note:'G',octave:2 }],
    bass6:  [{ note:'G',octave:0 },{ note:'D',octave:1 },{ note:'G',octave:1 },{ note:'D',octave:2 },{ note:'G',octave:2 },{ note:'B',octave:2 }],
  },
  {
    label: 'Open D',
    guitar: [{ note:'D',octave:2 },{ note:'A',octave:2 },{ note:'D',octave:3 },{ note:'F#',octave:3 },{ note:'A',octave:3 },{ note:'D',octave:4 }],
    guitar7: [{ note:'A',octave:1 },{ note:'D',octave:2 },{ note:'A',octave:2 },{ note:'D',octave:3 },{ note:'F#',octave:3 },{ note:'A',octave:3 },{ note:'D',octave:4 }],
    guitar8: [{ note:'D',octave:1 },{ note:'A',octave:1 },{ note:'D',octave:2 },{ note:'A',octave:2 },{ note:'D',octave:3 },{ note:'F#',octave:3 },{ note:'A',octave:3 },{ note:'D',octave:4 }],
    bass:   [{ note:'D',octave:1 },{ note:'A',octave:1 },{ note:'D',octave:2 },{ note:'F#',octave:2 }],
    bass5:  [{ note:'A',octave:0 },{ note:'D',octave:1 },{ note:'A',octave:1 },{ note:'D',octave:2 },{ note:'F#',octave:2 }],
    bass6:  [{ note:'A',octave:0 },{ note:'D',octave:1 },{ note:'A',octave:1 },{ note:'D',octave:2 },{ note:'F#',octave:2 },{ note:'A',octave:2 }],
  },
  {
    label: 'Open E',
    guitar: [{ note:'E',octave:2 },{ note:'B',octave:2 },{ note:'E',octave:3 },{ note:'G#',octave:3 },{ note:'B',octave:3 },{ note:'E',octave:4 }],
    guitar7: [{ note:'B',octave:1 },{ note:'E',octave:2 },{ note:'B',octave:2 },{ note:'E',octave:3 },{ note:'G#',octave:3 },{ note:'B',octave:3 },{ note:'E',octave:4 }],
    guitar8: [{ note:'E',octave:1 },{ note:'B',octave:1 },{ note:'E',octave:2 },{ note:'B',octave:2 },{ note:'E',octave:3 },{ note:'G#',octave:3 },{ note:'B',octave:3 },{ note:'E',octave:4 }],
    bass:   [{ note:'E',octave:1 },{ note:'B',octave:1 },{ note:'E',octave:2 },{ note:'G#',octave:2 }],
    bass5:  [{ note:'B',octave:0 },{ note:'E',octave:1 },{ note:'B',octave:1 },{ note:'E',octave:2 },{ note:'G#',octave:2 }],
    bass6:  [{ note:'B',octave:0 },{ note:'E',octave:1 },{ note:'B',octave:1 },{ note:'E',octave:2 },{ note:'G#',octave:2 },{ note:'B',octave:2 }],
  },
  {
    label: 'Open A',
    guitar: [{ note:'E',octave:2 },{ note:'A',octave:2 },{ note:'E',octave:3 },{ note:'A',octave:3 },{ note:'C#',octave:3 },{ note:'E',octave:4 }],
    guitar7: [{ note:'A',octave:1 },{ note:'E',octave:2 },{ note:'A',octave:2 },{ note:'E',octave:3 },{ note:'A',octave:3 },{ note:'C#',octave:3 },{ note:'E',octave:4 }],
    guitar8: [{ note:'E',octave:1 },{ note:'A',octave:1 },{ note:'E',octave:2 },{ note:'A',octave:2 },{ note:'E',octave:3 },{ note:'A',octave:3 },{ note:'C#',octave:3 },{ note:'E',octave:4 }],
    bass:   [{ note:'E',octave:1 },{ note:'A',octave:1 },{ note:'E',octave:2 },{ note:'A',octave:2 }],
    bass5:  [{ note:'A',octave:0 },{ note:'E',octave:1 },{ note:'A',octave:1 },{ note:'E',octave:2 },{ note:'A',octave:2 }],
    bass6:  [{ note:'A',octave:0 },{ note:'E',octave:1 },{ note:'A',octave:1 },{ note:'E',octave:2 },{ note:'A',octave:2 },{ note:'C#',octave:3 }],
  },
  {
    label: 'DADGAD',
    guitar: [{ note:'D',octave:2 },{ note:'A',octave:2 },{ note:'D',octave:3 },{ note:'G',octave:3 },{ note:'A',octave:3 },{ note:'D',octave:4 }],
    guitar7: [{ note:'A',octave:1 },{ note:'D',octave:2 },{ note:'A',octave:2 },{ note:'D',octave:3 },{ note:'G',octave:3 },{ note:'A',octave:3 },{ note:'D',octave:4 }],
    guitar8: [{ note:'D',octave:1 },{ note:'A',octave:1 },{ note:'D',octave:2 },{ note:'A',octave:2 },{ note:'D',octave:3 },{ note:'G',octave:3 },{ note:'A',octave:3 },{ note:'D',octave:4 }],
    bass:   [{ note:'D',octave:1 },{ note:'A',octave:1 },{ note:'D',octave:2 },{ note:'G',octave:2 }],
    bass5:  [{ note:'A',octave:0 },{ note:'D',octave:1 },{ note:'A',octave:1 },{ note:'D',octave:2 },{ note:'G',octave:2 }],
    bass6:  [{ note:'A',octave:0 },{ note:'D',octave:1 },{ note:'A',octave:1 },{ note:'D',octave:2 },{ note:'G',octave:2 },{ note:'C',octave:3 }],
  },
  {
    label: 'Half Step Up',
    guitar: [{ note:'F',octave:2 },{ note:'A#',octave:2 },{ note:'D#',octave:3 },{ note:'G#',octave:3 },{ note:'C',octave:4 },{ note:'F',octave:4 }],
    guitar7: [{ note:'C',octave:2 },{ note:'F',octave:2 },{ note:'A#',octave:2 },{ note:'D#',octave:3 },{ note:'G#',octave:3 },{ note:'C',octave:4 },{ note:'F',octave:4 }],
    guitar8: [{ note:'G',octave:1 },{ note:'C',octave:2 },{ note:'F',octave:2 },{ note:'A#',octave:2 },{ note:'D#',octave:3 },{ note:'G#',octave:3 },{ note:'C',octave:4 },{ note:'F',octave:4 }],
    bass:   [{ note:'F',octave:1 },{ note:'A#',octave:1 },{ note:'D#',octave:2 },{ note:'G#',octave:2 }],
    bass5:  [{ note:'C',octave:1 },{ note:'F',octave:1 },{ note:'A#',octave:1 },{ note:'D#',octave:2 },{ note:'G#',octave:2 }],
    bass6:  [{ note:'C',octave:1 },{ note:'F',octave:1 },{ note:'A#',octave:1 },{ note:'D#',octave:2 },{ note:'G#',octave:2 },{ note:'C',octave:3 }],
  },
];

// ─── Fretboard helpers ──────────────────────────────────────
export function getNoteAtFret(openNote: string, fret: number): string {
  let idx = NOTES_SHARP.indexOf(openNote);
  if (idx === -1) {
    const flatIdx = NOTES_FLAT.indexOf(openNote);
    if (flatIdx === -1) return '';
    return NOTES_SHARP[(flatIdx + fret) % 12];
  }
  return NOTES_SHARP[(idx + fret) % 12];
}

export function getScaleNote(note: string, scaleNotes: string[]): string | null {
  if (scaleNotes.includes(note)) return note;
  const enh = ENHARMONIC[note];
  if (enh && scaleNotes.includes(enh)) return enh;
  return null;
}

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

// ─── Finger positions (basic open-position pattern) ─────────
// Returns suggested finger (0=open, 1-4) for a fret relative to a position
export function getFingerForFret(fret: number, lowestFretInPosition: number): number {
  if (fret === 0) return 0;
  const rel = fret - lowestFretInPosition;
  if (rel < 0) return 1;
  return Math.min(rel + 1, 4);
}

// ─── ABC notation ───────────────────────────────────────────
export function scaleToAbc(scaleNotes: string[]): string {
  const abcMap: Record<string, string> = {
    'C':'C','C#':'^C','Db':'_D','D':'D','D#':'^D','Eb':'_E',
    'E':'E','F':'F','F#':'^F','Gb':'_G','G':'G','G#':'^G','Ab':'_A',
    'A':'A','A#':'^A','Bb':'_B','B':'B',
  };
  const chromaticIndex: Record<string, number> = {
    'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,
    'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11,
  };

  let octave = 0;
  let prevPitch = -1;
  const abcNotes: string[] = [];

  for (const n of scaleNotes) {
    const base = abcMap[n] || n;
    const pitch = chromaticIndex[n] ?? 0;
    if (prevPitch >= 0 && pitch <= prevPitch) octave++;
    prevPitch = pitch;

    if (octave === 0) abcNotes.push(base);
    else if (octave === 1) abcNotes.push(base.toLowerCase());
    else abcNotes.push(base.toLowerCase() + "'".repeat(octave - 1));
  }

  // High root — always one octave above the last note
  const rootBase = abcMap[scaleNotes[0]] || scaleNotes[0];
  const finalOctave = octave + 1;
  if (finalOctave === 1) abcNotes.push(rootBase.toLowerCase());
  else abcNotes.push(rootBase.toLowerCase() + "'".repeat(finalOctave - 1));

  const noteCount = abcNotes.length;
  return `X:1\nT:\nM:${noteCount}/8\nL:1/8\nK:C clef=treble\n${abcNotes.join(' ')} |]\n`;
}

// ─── Chord Spelling ─────────────────────────────────────────
const CHORD_FORMULAS: Record<string, { semitones: number[]; intervals: string[] }> = {
  'maj7':     { semitones: [0,4,7,11],   intervals: ['1','3','5','7'] },
  'm7':       { semitones: [0,3,7,10],   intervals: ['1','b3','5','b7'] },
  '7':        { semitones: [0,4,7,10],   intervals: ['1','3','5','b7'] },
  'm7b5':     { semitones: [0,3,6,10],   intervals: ['1','b3','b5','b7'] },
  'dim7':     { semitones: [0,3,6,9],    intervals: ['1','b3','b5','bb7'] },
  'm(maj7)':  { semitones: [0,3,7,11],   intervals: ['1','b3','5','7'] },
  'maj7#5':   { semitones: [0,4,8,11],   intervals: ['1','3','#5','7'] },
  'aug':      { semitones: [0,4,8],      intervals: ['1','3','#5'] },
  '':         { semitones: [0,4,7],      intervals: ['1','3','5'] },
  'm':        { semitones: [0,3,7],      intervals: ['1','b3','5'] },
  'dim':      { semitones: [0,3,6],      intervals: ['1','b3','b5'] },
};

// Map roman numeral to semitones from root (diatonic reference)
const ROMAN_SEMITONES: Record<string, number> = {
  'I': 0, 'II': 2, 'III': 4, 'IV': 5, 'V': 7, 'VI': 9, 'VII': 11,
};

function parseRomanChord(symbol: string): { semitonesFromRoot: number; quality: string } | null {
  const match = symbol.match(/^([b#]*)([IViv]+)(.*)/);
  if (!match) return null;
  const accidentals = match[1];
  const roman = match[2].toUpperCase();
  const quality = match[3];
  let semitones = ROMAN_SEMITONES[roman];
  if (semitones === undefined) return null;
  // Apply accidentals
  for (const ch of accidentals) {
    if (ch === 'b') semitones--;
    if (ch === '#') semitones++;
  }
  semitones = ((semitones % 12) + 12) % 12;
  return { semitonesFromRoot: semitones, quality };
}

export interface ChordSpelling {
  symbol: string;
  rootNote: string;
  name: string;
  notes: string[];
  intervals: string[];
}

export function getChordSpellings(scaleNotes: string[], mode: string): ChordSpelling[] {
  const chordSymbols = MODE_CHORDS[mode] || [];
  if (chordSymbols.length === 0 || scaleNotes.length === 0) return [];
  const flats = useFlats(scaleNotes[0]);
  const chromatic = flats ? NOTES_FLAT : NOTES_SHARP;

  return chordSymbols.map((symbol) => {
    const parsed = parseRomanChord(symbol);
    if (!parsed) return { symbol, rootNote: '?', name: symbol, notes: [], intervals: [] };
    const { semitonesFromRoot, quality } = parsed;

    // Find chord root by applying semitone offset from scale root
    const scaleRoot = scaleNotes[0];
    const rootIdx = chromatic.indexOf(scaleRoot);
    let actualRootIdx = rootIdx;
    let actualChromatic = chromatic;
    if (rootIdx === -1) {
      const alt = flats ? NOTES_SHARP : NOTES_FLAT;
      actualRootIdx = alt.indexOf(scaleRoot);
      actualChromatic = alt;
    }
    if (actualRootIdx === -1) return { symbol, rootNote: '?', name: symbol, notes: [], intervals: [] };

    const chordRootIdx = (actualRootIdx + semitonesFromRoot) % 12;
    const chordRoot = actualChromatic[chordRootIdx];

    const formula = CHORD_FORMULAS[quality] || CHORD_FORMULAS[''];
    const chordNotes = formula.semitones.map(s => actualChromatic[(chordRootIdx + s) % 12]);
    return { symbol, rootNote: chordRoot, name: chordRoot + quality, notes: chordNotes, intervals: formula.intervals };
  });
}

