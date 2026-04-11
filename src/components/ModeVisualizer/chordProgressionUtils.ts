import { type ChordSpelling, getScaleNotes, getChordSpellings, MODE_INTERVALS, ALL_ROOTS, MODE_CATEGORIES } from "./scaleData";
import { type InstrumentTimbre, getAudioContext } from "./audioSynth";

// ─── Constants ──────────────────────────────────────────────
export const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// ─── Types ──────────────────────────────────────────────────
export type ChordSource = 'diatonic' | 'borrowed' | 'secondary-dom' | 'tritone-sub' | 'inserted' | 'transformed';
export type ExtensionLevel = 'triad' | '7th' | '9th' | '11th' | '13th';
export type VoicingType = 'close' | 'open' | 'drop2' | 'drop3' | 'quartal' | 'guitar';
export type RhythmicFeel = 'straight' | 'swing' | 'clave' | '6/8' | '5/8' | '7/8' | 'free';
export type HarmonicStyle = 'neutral' | 'flamenco' | 'afro-cuban' | 'argentine' | 'balkan' | 'west-african';
export type SuggestionCategory = 'safe' | 'colorful' | 'experimental';
export type ViewMode = 'standard' | 'roman' | 'nashville';
export type ChordFunction = 'tonic' | 'subdominant' | 'dominant' | 'other';

export interface DegreeBasedChord {
  degree: number; // scale degree index (0-6)
  quality: string; // chord quality symbol e.g. 'm7', 'maj7', '7'
  source: ChordSource;
  sourceLabel?: string;
  rootSemitone?: number; // absolute semitone from C for non-diatonic
  notes?: string[]; // explicit notes for non-diatonic
  extension: ExtensionLevel;
  voicing: VoicingType;
  alterations: string[]; // e.g. ['b9', '#11']
}

export interface ProgressionChord {
  chord: ChordSpelling;
  source: ChordSource;
  sourceLabel?: string;
  degreeRef?: DegreeBasedChord;
  function?: ChordFunction;
}

export interface TransformResult {
  name: string;
  before: ProgressionChord[];
  after: ProgressionChord[];
}

export interface StylePreset {
  id: HarmonicStyle;
  label: string;
  description: string;
  preferredModes: string[];
  chordTendencies: string;
  rhythmFeel: RhythmicFeel;
}

export interface ChordSuggestion {
  chord: ProgressionChord;
  category: SuggestionCategory;
  reason: string;
}

// ─── Parallel Borrow Modes ──────────────────────────────────
export const PARALLEL_BORROW_MODES: Record<string, string[]> = {
  'Ionian': ['Aeolian', 'Dorian', 'Mixolydian', 'Phrygian', 'Lydian'],
  'Dorian': ['Ionian', 'Aeolian', 'Mixolydian'],
  'Phrygian': ['Aeolian', 'Phrygian Dominant'],
  'Lydian': ['Ionian', 'Mixolydian'],
  'Mixolydian': ['Ionian', 'Dorian', 'Aeolian'],
  'Aeolian': ['Ionian', 'Dorian', 'Mixolydian', 'Harmonic Minor'],
  'Locrian': ['Aeolian', 'Phrygian'],
  'Harmonic Minor': ['Aeolian', 'Ionian'],
  'Melodic Minor': ['Aeolian', 'Ionian', 'Dorian'],
};

// ─── Progression Templates ─────────────────────────────────
export const PROGRESSION_TEMPLATES = [
  { label: 'I – V – vi – IV', degrees: [0, 4, 5, 3], desc: 'Pop classic' },
  { label: 'I – IV – V – I', degrees: [0, 3, 4, 0], desc: 'Blues/rock' },
  { label: 'ii – V – I', degrees: [1, 4, 0], desc: 'Jazz standard' },
  { label: 'I – vi – IV – V', degrees: [0, 5, 3, 4], desc: '50s progression' },
  { label: 'vi – IV – I – V', degrees: [5, 3, 0, 4], desc: 'Axis of awesome' },
  { label: 'I – IV – vi – V', degrees: [0, 3, 5, 4], desc: 'Modern pop' },
  { label: 'i – bVI – bIII – bVII', degrees: [0, 5, 2, 6], desc: 'Andalusian' },
  { label: 'I – V – vi – iii – IV', degrees: [0, 4, 5, 2, 3], desc: 'Canon in D' },
];

// ─── Style Presets ──────────────────────────────────────────
export const STYLE_PRESETS: StylePreset[] = [
  { id: 'neutral', label: 'Neutral', description: 'Standard diatonic harmony', preferredModes: ['Ionian', 'Aeolian'], chordTendencies: 'Balanced functional harmony', rhythmFeel: 'straight' },
  { id: 'flamenco', label: 'Flamenco', description: 'Andalusian cadence, Phrygian color', preferredModes: ['Phrygian', 'Phrygian Dominant'], chordTendencies: 'iv-III-II-I descending, altered dominants', rhythmFeel: 'free' },
  { id: 'afro-cuban', label: 'Afro-Cuban', description: 'Clave-based harmonic rhythm', preferredModes: ['Ionian', 'Mixolydian', 'Dorian'], chordTendencies: 'Dominant 7th chains, montunos', rhythmFeel: 'clave' },
  { id: 'argentine', label: 'Argentine', description: 'Tango harmony: diminished passing, chromaticism', preferredModes: ['Aeolian', 'Harmonic Minor'], chordTendencies: 'Diminished passing, dramatic V-i', rhythmFeel: 'straight' },
  { id: 'balkan', label: 'Balkan', description: 'Asymmetric meters, harmonic minor flavors', preferredModes: ['Harmonic Minor', 'Phrygian Dominant'], chordTendencies: 'Augmented seconds, modal clusters', rhythmFeel: '7/8' },
  { id: 'west-african', label: 'West African', description: 'Pentatonic layering, cyclic patterns', preferredModes: ['Major Pentatonic', 'Dorian'], chordTendencies: 'Cyclic I-IV, quartal voicings', rhythmFeel: '6/8' },
];

// ─── Source Colors ──────────────────────────────────────────
export const sourceColors: Record<ChordSource, string> = {
  'diatonic': 'border-border hover:border-amber-500/50 hover:bg-amber-500/5',
  'borrowed': 'border-violet-500/40 hover:border-violet-500/70 hover:bg-violet-500/10',
  'secondary-dom': 'border-sky-500/40 hover:border-sky-500/70 hover:bg-sky-500/10',
  'tritone-sub': 'border-emerald-500/40 hover:border-emerald-500/70 hover:bg-emerald-500/10',
  'inserted': 'border-pink-500/40 hover:border-pink-500/70 hover:bg-pink-500/10',
  'transformed': 'border-orange-500/40 hover:border-orange-500/70 hover:bg-orange-500/10',
};

export const sourceActiveColors: Record<ChordSource, string> = {
  'diatonic': 'border-amber-500 bg-amber-500/15 text-amber-300',
  'borrowed': 'border-violet-500 bg-violet-500/15 text-violet-300',
  'secondary-dom': 'border-sky-500 bg-sky-500/15 text-sky-300',
  'tritone-sub': 'border-emerald-500 bg-emerald-500/15 text-emerald-300',
  'inserted': 'border-pink-500 bg-pink-500/15 text-pink-300',
  'transformed': 'border-orange-500 bg-orange-500/15 text-orange-300',
};

export const sourceDotColors: Record<ChordSource, string> = {
  'diatonic': 'bg-amber-500',
  'borrowed': 'bg-violet-500',
  'secondary-dom': 'bg-sky-500',
  'tritone-sub': 'bg-emerald-500',
  'inserted': 'bg-pink-500',
  'transformed': 'bg-orange-500',
};

export const functionColors: Record<ChordFunction, string> = {
  'tonic': 'bg-blue-500/20 border-blue-500/40',
  'subdominant': 'bg-green-500/20 border-green-500/40',
  'dominant': 'bg-red-500/20 border-red-500/40',
  'other': 'bg-muted/20 border-border',
};

export const functionDotColors: Record<ChordFunction, string> = {
  'tonic': 'bg-blue-500',
  'subdominant': 'bg-green-500',
  'dominant': 'bg-red-500',
  'other': 'bg-muted-foreground',
};

// ─── Note Helpers ───────────────────────────────────────────
export function shouldUseFlatsForKey(root: string): boolean {
  return root.includes('b') || ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'].includes(root);
}

export function getChromatic(root: string): string[] {
  return shouldUseFlatsForKey(root) ? NOTES_FLAT : NOTES_SHARP;
}

export function transposeNote(note: string, semitones: number, useFlats: boolean): string {
  const chromatic = useFlats ? NOTES_FLAT : NOTES_SHARP;
  let idx = chromatic.indexOf(note);
  if (idx === -1) {
    const alt = useFlats ? NOTES_SHARP : NOTES_FLAT;
    idx = alt.indexOf(note);
    if (idx === -1) return note;
  }
  return chromatic[((idx + semitones) % 12 + 12) % 12];
}

export function transposeChord(chord: ChordSpelling, semitones: number, useFlats: boolean): ChordSpelling {
  return {
    ...chord,
    rootNote: transposeNote(chord.rootNote, semitones, useFlats),
    notes: chord.notes.map(n => transposeNote(n, semitones, useFlats)),
    name: chord.name.replace(/^[A-G][#b]?/, transposeNote(chord.rootNote, semitones, useFlats)),
  };
}

export function getNoteIndex(note: string): number {
  let idx = NOTES_SHARP.indexOf(note);
  if (idx === -1) idx = NOTES_FLAT.indexOf(note);
  return idx;
}

// ─── Chord Function Analysis ────────────────────────────────
export function getChordFunction(degreeIndex: number, mode: string): ChordFunction {
  // In major/ionian context:
  // Tonic: I, iii, vi  (0, 2, 5)
  // Subdominant: ii, IV (1, 3)
  // Dominant: V, vii° (4, 6)
  const majorFunctions: ChordFunction[] = ['tonic', 'subdominant', 'tonic', 'subdominant', 'dominant', 'tonic', 'dominant'];
  
  if (mode === 'Aeolian' || mode === 'Harmonic Minor' || mode === 'Melodic Minor') {
    const minorFunctions: ChordFunction[] = ['tonic', 'subdominant', 'tonic', 'subdominant', 'dominant', 'subdominant', 'dominant'];
    return minorFunctions[degreeIndex] || 'other';
  }
  
  return majorFunctions[degreeIndex] || 'other';
}

// ─── Roman Numeral Generation ───────────────────────────────
export function getRomanNumeral(chord: ChordSpelling, degreeIndex: number): string {
  const numeral = ROMAN_NUMERALS[degreeIndex] || `${degreeIndex + 1}`;
  const isMinor = chord.symbol.includes('m') && !chord.symbol.includes('maj');
  const isDim = chord.symbol.includes('dim') || chord.symbol.includes('°');
  const isAug = chord.symbol.includes('aug') || chord.symbol.includes('+');
  
  let roman = isMinor || isDim ? numeral.toLowerCase() : numeral;
  if (isDim) roman += '°';
  if (isAug) roman += '+';
  
  // Add extension
  if (chord.symbol.includes('maj7')) roman += 'maj7';
  else if (chord.symbol.includes('7')) roman += '7';
  
  return roman;
}

// ─── Nashville Number ───────────────────────────────────────
export function getNashvilleNumber(degreeIndex: number, chord: ChordSpelling): string {
  const num = degreeIndex + 1;
  const isMinor = chord.symbol.includes('m') && !chord.symbol.includes('maj');
  return isMinor ? `${num}m` : `${num}`;
}

// ─── Secondary Dominants ────────────────────────────────────
export function getSecondaryDominants(root: string, mode: string, diatonicChords: ChordSpelling[]): ProgressionChord[] {
  const intervals = MODE_INTERVALS[mode];
  if (!intervals || intervals.length < 7) return [];
  
  const results: ProgressionChord[] = [];
  const flats = shouldUseFlatsForKey(root);
  const chromatic = getChromatic(root);
  const rootIdx = chromatic.indexOf(root);
  if (rootIdx === -1) return results;

  diatonicChords.forEach((target, i) => {
    if (i === 0) return;
    const targetRoot = target.rootNote;
    let targetIdx = chromatic.indexOf(targetRoot);
    if (targetIdx === -1) {
      const alt = flats ? NOTES_SHARP : NOTES_FLAT;
      targetIdx = alt.indexOf(targetRoot);
      if (targetIdx === -1) return;
    }
    const domRoot = chromatic[(targetIdx + 7) % 12];
    const alreadyDiatonic = diatonicChords.some(c => c.rootNote === domRoot && c.symbol.includes('7') && !c.symbol.includes('m'));
    if (alreadyDiatonic) return;

    const domNotes = [
      domRoot,
      chromatic[(chromatic.indexOf(domRoot) + 4) % 12],
      chromatic[(chromatic.indexOf(domRoot) + 7) % 12],
      chromatic[(chromatic.indexOf(domRoot) + 10) % 12],
    ];

    results.push({
      chord: {
        symbol: `V7/${ROMAN_NUMERALS[i] || (i + 1).toString()}`,
        rootNote: domRoot,
        name: `${domRoot}7 → ${target.symbol}`,
        notes: domNotes,
        intervals: ['1', '3', '5', 'b7'],
      },
      source: 'secondary-dom',
      sourceLabel: `resolves to ${target.symbol}`,
      function: 'dominant',
    });
  });

  return results;
}

// ─── Tritone Substitutions ──────────────────────────────────
export function getTritoneSubs(secondaryDoms: ProgressionChord[]): ProgressionChord[] {
  const results: ProgressionChord[] = [];
  secondaryDoms.forEach(sd => {
    const domRoot = sd.chord.rootNote;
    const flats = shouldUseFlatsForKey(domRoot);
    const chromatic = getChromatic(domRoot);
    let idx = chromatic.indexOf(domRoot);
    if (idx === -1) {
      const alt = flats ? NOTES_SHARP : NOTES_FLAT;
      idx = alt.indexOf(domRoot);
      if (idx === -1) return;
    }
    const subRoot = chromatic[(idx + 6) % 12];
    const subNotes = [
      subRoot,
      chromatic[(chromatic.indexOf(subRoot) + 4) % 12],
      chromatic[(chromatic.indexOf(subRoot) + 7) % 12],
      chromatic[(chromatic.indexOf(subRoot) + 10) % 12],
    ];

    results.push({
      chord: {
        symbol: `sub(${sd.chord.symbol})`,
        rootNote: subRoot,
        name: `${subRoot}7 (tritone sub of ${sd.chord.rootNote}7)`,
        notes: subNotes,
        intervals: ['1', '3', '5', 'b7'],
      },
      source: 'tritone-sub',
      sourceLabel: `tritone sub of ${sd.chord.rootNote}7`,
      function: 'dominant',
    });
  });
  return results;
}

// ─── Borrowed Chords ────────────────────────────────────────
export function getBorrowedChords(root: string, currentMode: string, diatonicChords: ChordSpelling[]): { mode: string; chords: ProgressionChord[] }[] {
  const borrowModes = PARALLEL_BORROW_MODES[currentMode] || [];
  const diatonicSymbols = new Set(diatonicChords.map(c => `${c.rootNote}-${c.notes.join(',')}`));
  
  return borrowModes.map(borrowMode => {
    const borrowScale = getScaleNotes(root, borrowMode);
    const borrowChords = getChordSpellings(borrowScale, borrowMode);
    
    const unique = borrowChords
      .filter(c => !diatonicSymbols.has(`${c.rootNote}-${c.notes.join(',')}`))
      .map(c => ({
        chord: c,
        source: 'borrowed' as const,
        sourceLabel: borrowMode,
      }));

    return { mode: borrowMode, chords: unique };
  }).filter(g => g.chords.length > 0);
}

// ─── Insert ii-V ────────────────────────────────────────────
export function createIIV(targetRoot: string, root: string): ProgressionChord[] {
  const flats = shouldUseFlatsForKey(root);
  const chromatic = flats ? NOTES_FLAT : NOTES_SHARP;
  const targetIdx = chromatic.indexOf(targetRoot);
  if (targetIdx === -1) return [];
  
  // ii of target = 2 semitones above target's V = target - 5 semitones
  const vRoot = chromatic[(targetIdx + 7) % 12];
  const iiRoot = chromatic[(targetIdx + 5) % 12];
  
  const iiNotes = [iiRoot, chromatic[(chromatic.indexOf(iiRoot) + 3) % 12], chromatic[(chromatic.indexOf(iiRoot) + 7) % 12], chromatic[(chromatic.indexOf(iiRoot) + 10) % 12]];
  const vNotes = [vRoot, chromatic[(chromatic.indexOf(vRoot) + 4) % 12], chromatic[(chromatic.indexOf(vRoot) + 7) % 12], chromatic[(chromatic.indexOf(vRoot) + 10) % 12]];
  
  return [
    {
      chord: { symbol: 'ii', rootNote: iiRoot, name: `${iiRoot}m7`, notes: iiNotes, intervals: ['1', 'b3', '5', 'b7'] },
      source: 'inserted',
      sourceLabel: `ii of ${targetRoot}`,
      function: 'subdominant',
    },
    {
      chord: { symbol: 'V7', rootNote: vRoot, name: `${vRoot}7`, notes: vNotes, intervals: ['1', '3', '5', 'b7'] },
      source: 'inserted',
      sourceLabel: `V of ${targetRoot}`,
      function: 'dominant',
    },
  ];
}

// ─── Transformation Engine ──────────────────────────────────
export function transformProgression(
  progression: ProgressionChord[],
  transform: string,
  root: string,
  mode: string,
  chordSpellings: ChordSpelling[]
): ProgressionChord[] {
  if (progression.length === 0) return progression;
  const flats = shouldUseFlatsForKey(root);
  const chromatic = flats ? NOTES_FLAT : NOTES_SHARP;

  switch (transform) {
    case 'jazzy': {
      // Add 7ths to triads, convert dom7 to 9ths concept, add ii-V approaches
      return progression.map(pc => {
        const notes = [...pc.chord.notes];
        if (notes.length === 3) {
          // Add 7th
          const rootIdx = chromatic.indexOf(pc.chord.rootNote);
          if (rootIdx === -1) return pc;
          const isMinor = pc.chord.symbol.includes('m') && !pc.chord.symbol.includes('maj');
          const seventh = isMinor ? chromatic[(rootIdx + 10) % 12] : chromatic[(rootIdx + 11) % 12];
          notes.push(seventh);
          return {
            ...pc,
            chord: { ...pc.chord, notes, symbol: pc.chord.symbol + (isMinor ? '7' : 'maj7'), name: pc.chord.name + (isMinor ? '7' : 'maj7') },
            source: 'transformed',
            sourceLabel: 'jazzified',
          };
        }
        return pc;
      });
    }
    case 'modal': {
      // Replace V with bVII, add sus chords feel
      return progression.map(pc => {
        if (pc.function === 'dominant' && chordSpellings.length >= 7) {
          const bVII = chordSpellings[6];
          if (bVII) return { chord: bVII, source: 'transformed', sourceLabel: 'modal replacement', function: 'other' as ChordFunction };
        }
        return pc;
      });
    }
    case 'dark': {
      // Lower 3rds where possible, prefer minor
      return progression.map(pc => {
        const rootIdx = chromatic.indexOf(pc.chord.rootNote);
        if (rootIdx === -1) return pc;
        const isMinor = pc.chord.symbol.includes('m');
        if (!isMinor && !pc.chord.symbol.includes('dim')) {
          const notes = [...pc.chord.notes];
          // Lower the 3rd by a semitone
          const thirdIdx = notes.findIndex(n => {
            const ni = chromatic.indexOf(n);
            return ni !== -1 && ((ni - rootIdx + 12) % 12) === 4;
          });
          if (thirdIdx !== -1) {
            notes[thirdIdx] = chromatic[(chromatic.indexOf(notes[thirdIdx]) - 1 + 12) % 12];
            return {
              ...pc,
              chord: { ...pc.chord, notes, symbol: pc.chord.symbol.replace(/^([A-G][#b]?)/, '$1m'), name: pc.chord.name + ' (dark)' },
              source: 'transformed',
              sourceLabel: 'darkened',
            };
          }
        }
        return pc;
      });
    }
    case 'tension': {
      // Add b9 or #11 to dominant chords, add 7ths
      return progression.map(pc => {
        const rootIdx = chromatic.indexOf(pc.chord.rootNote);
        if (rootIdx === -1) return pc;
        if (pc.function === 'dominant' || pc.chord.symbol.includes('7')) {
          const notes = [...pc.chord.notes];
          const b9 = chromatic[(rootIdx + 1) % 12];
          if (!notes.includes(b9)) {
            notes.push(b9);
            return {
              ...pc,
              chord: { ...pc.chord, notes, symbol: pc.chord.symbol + '(b9)', name: pc.chord.name + '(b9)' },
              source: 'transformed',
              sourceLabel: 'added tension',
            };
          }
        }
        return pc;
      });
    }
    case 'simplify': {
      // Reduce to triads
      return progression.map(pc => {
        if (pc.chord.notes.length > 3) {
          const notes = pc.chord.notes.slice(0, 3);
          const symbol = pc.chord.symbol.replace(/maj7|m7|7|9|11|13|\(.*\)/g, '');
          return {
            ...pc,
            chord: { ...pc.chord, notes, symbol: symbol || pc.chord.symbol, name: notes.join('-') },
            source: 'transformed',
            sourceLabel: 'simplified',
          };
        }
        return pc;
      });
    }
    case 'expand': {
      // Add extensions
      return progression.map(pc => {
        const rootIdx = chromatic.indexOf(pc.chord.rootNote);
        if (rootIdx === -1) return pc;
        const notes = [...pc.chord.notes];
        if (notes.length <= 4) {
          const ninth = chromatic[(rootIdx + 14) % 12];
          if (!notes.includes(ninth)) {
            notes.push(ninth);
            return {
              ...pc,
              chord: { ...pc.chord, notes, symbol: pc.chord.symbol + 'add9', name: pc.chord.name + ' (expanded)' },
              source: 'transformed',
              sourceLabel: 'expanded',
            };
          }
        }
        return pc;
      });
    }
    default:
      return progression;
  }
}

// ─── Style-Based Suggestions ────────────────────────────────
export function getStyleSuggestions(style: HarmonicStyle, root: string, mode: string): string {
  switch (style) {
    case 'flamenco': return 'Try Phrygian mode with Am-G-F-E cadence patterns';
    case 'afro-cuban': return 'Use Mixolydian with dominant 7th chains over clave rhythm';
    case 'argentine': return 'Harmonic minor with diminished passing chords and dramatic V-i';
    case 'balkan': return 'Phrygian Dominant with augmented seconds and asymmetric meters';
    case 'west-african': return 'Pentatonic layering with cyclic I-IV patterns';
    default: return '';
  }
}

// ─── Smart Suggestions ──────────────────────────────────────
export function getNextChordSuggestions(
  progression: ProgressionChord[],
  chordSpellings: ChordSpelling[],
  root: string,
  mode: string,
): ChordSuggestion[] {
  if (chordSpellings.length === 0) return [];
  
  const lastChord = progression[progression.length - 1];
  const suggestions: ChordSuggestion[] = [];
  const flats = shouldUseFlatsForKey(root);
  const chromatic = flats ? NOTES_FLAT : NOTES_SHARP;
  
  // Safe: diatonic chords that commonly follow
  const safeTargets = lastChord ? getSafeFollowups(lastChord, chordSpellings, mode) : [0, 3, 4];
  safeTargets.forEach(idx => {
    if (idx < chordSpellings.length) {
      suggestions.push({
        chord: { chord: chordSpellings[idx], source: 'diatonic', function: getChordFunction(idx, mode) },
        category: 'safe',
        reason: `Common diatonic follow-up (${getRomanNumeral(chordSpellings[idx], idx)})`,
      });
    }
  });
  
  // Colorful: borrowed chords
  const borrowedGroups = getBorrowedChords(root, mode, chordSpellings);
  borrowedGroups.slice(0, 2).forEach(g => {
    if (g.chords.length > 0) {
      suggestions.push({
        chord: g.chords[0],
        category: 'colorful',
        reason: `Borrowed from ${g.mode}`,
      });
    }
  });
  
  // Experimental: tritone sub or secondary dom
  const secDoms = getSecondaryDominants(root, mode, chordSpellings);
  if (secDoms.length > 0) {
    const randomIdx = Math.min(1, secDoms.length - 1);
    suggestions.push({
      chord: secDoms[randomIdx],
      category: 'experimental',
      reason: secDoms[randomIdx].sourceLabel || 'Secondary dominant',
    });
  }
  
  return suggestions;
}

function getSafeFollowups(lastChord: ProgressionChord, chordSpellings: ChordSpelling[], mode: string): number[] {
  const lastRoot = lastChord.chord.rootNote;
  const lastIdx = chordSpellings.findIndex(c => c.rootNote === lastRoot);
  
  if (lastIdx === -1) return [0, 3, 4];
  
  // Common voice leading tendencies
  const func = getChordFunction(lastIdx, mode);
  switch (func) {
    case 'tonic': return [3, 1, 4]; // move to subdominant area
    case 'subdominant': return [4, 0, 6]; // move to dominant or resolve
    case 'dominant': return [0, 5]; // resolve to tonic area
    default: return [0, 3, 4];
  }
}

// ─── MIDI Export ────────────────────────────────────────────
const NOTE_MIDI: Record<string, number> = {
  'C': 60, 'C#': 61, 'Db': 61, 'D': 62, 'D#': 63, 'Eb': 63,
  'E': 64, 'F': 65, 'F#': 66, 'Gb': 66, 'G': 67, 'G#': 68, 'Ab': 68,
  'A': 69, 'A#': 70, 'Bb': 70, 'B': 71,
};

function writeVarLen(value: number): number[] {
  const bytes: number[] = [];
  let v = value;
  bytes.unshift(v & 0x7f);
  while ((v >>= 7) > 0) {
    bytes.unshift((v & 0x7f) | 0x80);
  }
  return bytes;
}

export function buildMidiFile(chords: ProgressionChord[], bpm: number, beatsPerChord: number): Uint8Array {
  const ticksPerBeat = 480;
  const chordTicks = ticksPerBeat * beatsPerChord;
  const velocity = 100;
  const trackEvents: number[] = [];

  const usPerBeat = Math.round(60_000_000 / bpm);
  trackEvents.push(0x00, 0xff, 0x51, 0x03,
    (usPerBeat >> 16) & 0xff, (usPerBeat >> 8) & 0xff, usPerBeat & 0xff);

  chords.forEach((pc) => {
    const midiNotes = pc.chord.notes
      .map(n => NOTE_MIDI[n])
      .filter((n): n is number => n !== undefined);

    midiNotes.forEach((note, i) => {
      trackEvents.push(...writeVarLen(i === 0 ? 0 : 0));
      trackEvents.push(0x90, note, velocity);
    });

    midiNotes.forEach((note, i) => {
      trackEvents.push(...writeVarLen(i === 0 ? chordTicks : 0));
      trackEvents.push(0x80, note, 0);
    });
  });

  trackEvents.push(0x00, 0xff, 0x2f, 0x00);

  const header = [
    0x4d, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06,
    0x00, 0x00, 0x00, 0x01,
    (ticksPerBeat >> 8) & 0xff, ticksPerBeat & 0xff,
  ];

  const trackHeader = [
    0x4d, 0x54, 0x72, 0x6b,
    (trackEvents.length >> 24) & 0xff,
    (trackEvents.length >> 16) & 0xff,
    (trackEvents.length >> 8) & 0xff,
    trackEvents.length & 0xff,
  ];

  return new Uint8Array([...header, ...trackHeader, ...trackEvents]);
}

export function downloadMidi(chords: ProgressionChord[], bpm: number, beatsPerChord: number, root: string, mode: string) {
  const data = buildMidiFile(chords, bpm, beatsPerChord);
  const blob = new Blob([data.buffer as ArrayBuffer], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${root}_${mode}_progression.mid`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Audio Playback ─────────────────────────────────────────
export function playChordTones(notes: string[], duration = 0.8, timbre: InstrumentTimbre = 'piano') {
  const ctx = getAudioContext();
  const NOTE_FREQ: Record<string, number> = {
    'C': 261.63, 'C#': 277.18, 'Db': 277.18,
    'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
    'E': 329.63, 'F': 349.23, 'F#': 369.99, 'Gb': 369.99,
    'G': 392.00, 'G#': 415.30, 'Ab': 415.30,
    'A': 440.00, 'A#': 466.16, 'Bb': 466.16, 'B': 493.88,
  };

  const volume = 0.08;

  notes.forEach((note, i) => {
    const freq = NOTE_FREQ[note];
    if (!freq) return;
    const startTime = ctx.currentTime + i * 0.03;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    switch (timbre) {
      case 'guitar': osc.type = 'triangle'; break;
      case 'organ': osc.type = 'sine'; break;
      case 'synth-pad': osc.type = 'sawtooth'; break;
      case 'bright-lead': osc.type = 'square'; break;
      case 'warm-bass': osc.type = 'sine'; break;
      default: osc.type = 'triangle'; break;
    }
    osc.frequency.value = timbre === 'warm-bass' ? freq / 2 : freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.stop(startTime + duration + 0.05);
  });
}

// ─── Rhythmic Feel Data ─────────────────────────────────────
export const RHYTHMIC_FEELS: { id: RhythmicFeel; label: string; beats: number }[] = [
  { id: 'straight', label: 'Straight', beats: 4 },
  { id: 'swing', label: 'Swing', beats: 4 },
  { id: 'clave', label: 'Clave', beats: 4 },
  { id: '6/8', label: '6/8 Feel', beats: 6 },
  { id: '5/8', label: '5/8 Odd', beats: 5 },
  { id: '7/8', label: '7/8 Odd', beats: 7 },
  { id: 'free', label: 'Free', beats: 4 },
];

// ─── Extension Level ────────────────────────────────────────
export const EXTENSION_LEVELS: { id: ExtensionLevel; label: string }[] = [
  { id: 'triad', label: 'Triad' },
  { id: '7th', label: '7th' },
  { id: '9th', label: '9th' },
  { id: '11th', label: '11th' },
  { id: '13th', label: '13th' },
];

export function applyExtensionLevel(chord: ChordSpelling, level: ExtensionLevel, root: string): ChordSpelling {
  const flats = shouldUseFlatsForKey(root);
  const chromatic = flats ? NOTES_FLAT : NOTES_SHARP;
  const rootIdx = chromatic.indexOf(chord.rootNote);
  if (rootIdx === -1 || level === 'triad') {
    // Strip to triad
    if (level === 'triad' && chord.notes.length > 3) {
      const notes = chord.notes.slice(0, 3);
      const symbol = chord.symbol.replace(/maj7|m7|7|9|11|13|add9|\(.*\)/g, '');
      return { ...chord, notes, symbol: symbol || chord.rootNote, name: `${chord.rootNote}${symbol ? symbol.replace(chord.rootNote, '') : ''}` };
    }
    return chord;
  }

  const isMinor = chord.symbol.includes('m') && !chord.symbol.includes('maj');
  const isDim = chord.symbol.includes('dim') || chord.symbol.includes('°');
  const baseNotes = chord.notes.slice(0, 3);
  const sym = chord.symbol.replace(/maj7|m7|7|9|11|13|add9|\(.*\)/g, '') || chord.rootNote;

  // triad already handled above

  // 7th
  const seventh = isDim
    ? chromatic[(rootIdx + 9) % 12]   // dim7
    : isMinor
      ? chromatic[(rootIdx + 10) % 12]  // m7
      : chromatic[(rootIdx + 11) % 12]; // maj7
  const notes7 = [...baseNotes, seventh];
  const sym7 = isDim ? `${sym}dim7` : isMinor ? `${sym}7` : `${sym}maj7`;
  if (level === '7th') return { ...chord, notes: notes7, symbol: sym7, name: `${chord.rootNote} ${sym7.replace(chord.rootNote, '')}`.trim() };

  // 9th
  const ninth = chromatic[(rootIdx + 2) % 12];
  const notes9 = [...notes7, ninth];
  const sym9 = isDim ? `${sym}dim9` : isMinor ? `${sym}9` : `${sym}maj9`;
  if (level === '9th') return { ...chord, notes: notes9, symbol: sym9, name: `${chord.rootNote} ${sym9.replace(chord.rootNote, '')}`.trim() };

  // 11th
  const eleventh = chromatic[(rootIdx + 5) % 12];
  const notes11 = [...notes9, eleventh];
  const sym11 = isDim ? `${sym}dim11` : isMinor ? `${sym}11` : `${sym}maj11`;
  if (level === '11th') return { ...chord, notes: notes11, symbol: sym11, name: `${chord.rootNote} ${sym11.replace(chord.rootNote, '')}`.trim() };

  // 13th
  const thirteenth = chromatic[(rootIdx + 9) % 12];
  const notes13 = [...notes11, thirteenth];
  const sym13 = isDim ? `${sym}dim13` : isMinor ? `${sym}13` : `${sym}maj13`;
  return { ...chord, notes: notes13, symbol: sym13, name: `${chord.rootNote} ${sym13.replace(chord.rootNote, '')}`.trim() };
}

// ─── Voicing Engine ─────────────────────────────────────────
export const VOICING_TYPES: { id: VoicingType; label: string; desc: string }[] = [
  { id: 'close', label: 'Close', desc: 'Root position, tightest spacing' },
  { id: 'open', label: 'Open', desc: 'Spread across octaves' },
  { id: 'drop2', label: 'Drop 2', desc: 'Jazz piano voicing' },
  { id: 'drop3', label: 'Drop 3', desc: 'Wide jazz voicing' },
  { id: 'quartal', label: 'Quartal', desc: 'Stacked 4ths, modal sound' },
  { id: 'guitar', label: 'Guitar', desc: 'Open string-friendly' },
];

export function applyVoicing(notes: string[], voicing: VoicingType): string[] {
  if (notes.length < 3) return notes;
  switch (voicing) {
    case 'close': return notes;
    case 'open': {
      // Spread: root, skip, 3rd up octave, skip, 5th up octave
      const result = [notes[0]];
      for (let i = 1; i < notes.length; i++) {
        result.push(notes[i]); // just label-wise same, but playback will spread
      }
      return result;
    }
    case 'drop2': {
      if (notes.length < 4) return notes;
      // Drop the 2nd-from-top voice down an octave
      const arr = [...notes];
      const dropped = arr.splice(arr.length - 2, 1)[0];
      return [dropped, ...arr];
    }
    case 'drop3': {
      if (notes.length < 4) return notes;
      const arr = [...notes];
      const dropped = arr.splice(arr.length - 3, 1)[0];
      return [dropped, ...arr];
    }
    case 'quartal': {
      // Revoice in 4ths from root
      const chromatic = NOTES_SHARP;
      const rootIdx = chromatic.indexOf(notes[0]);
      if (rootIdx === -1) return notes;
      return notes.map((_, i) => chromatic[(rootIdx + i * 5) % 12]);
    }
    case 'guitar': {
      // Guitar-friendly: root on bottom, open spacing
      return notes.length > 4 ? [notes[0], notes[2], notes[1], ...notes.slice(3)] : notes;
    }
    default: return notes;
  }
}

// ─── Expressive Controls ────────────────────────────────────
export interface ExpressiveParams {
  tension: number;    // 0-100
  density: number;    // 0-100
  movement: number;   // 0-100
  brightness: number; // 0-100
}

export const DEFAULT_EXPRESSIVE: ExpressiveParams = { tension: 50, density: 50, movement: 50, brightness: 50 };

export function getExpressivePlaybackParams(params: ExpressiveParams) {
  return {
    velocityMultiplier: 0.5 + (params.density / 200),
    detuneRange: (params.tension / 100) * 15,
    attackSpeed: 0.01 + ((100 - params.brightness) / 100) * 0.1,
    sustainMultiplier: 0.5 + (params.movement / 200),
  };
}

export function playChordTonesExpressive(
  notes: string[], duration: number, timbre: InstrumentTimbre,
  voicing: VoicingType, params: ExpressiveParams
) {
  const voiced = applyVoicing(notes, voicing);
  const ep = getExpressivePlaybackParams(params);
  const ctx = getAudioContext();
  const NOTE_FREQ: Record<string, number> = {
    'C': 261.63, 'C#': 277.18, 'Db': 277.18,
    'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
    'E': 329.63, 'F': 349.23, 'F#': 369.99, 'Gb': 369.99,
    'G': 392.00, 'G#': 415.30, 'Ab': 415.30,
    'A': 440.00, 'A#': 466.16, 'Bb': 466.16, 'B': 493.88,
  };
  const PITCH_INDEX: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
    'A#': 10, 'Bb': 10, 'B': 11,
  };

  const volume = 0.08 * ep.velocityMultiplier;

  // Build ascending frequencies
  let octaveShift = 0;
  let prevPitch = -1;
  const freqList: number[] = [];
  for (const note of voiced) {
    let freq = NOTE_FREQ[note];
    if (!freq) { freqList.push(0); continue; }
    const pitch = PITCH_INDEX[note] ?? 0;
    if (prevPitch >= 0 && pitch <= prevPitch) octaveShift++;
    prevPitch = pitch;
    freq = freq * Math.pow(2, octaveShift);
    freq += (Math.random() - 0.5) * ep.detuneRange;
    if (timbre === 'warm-bass') freq /= 2;
    freqList.push(freq);
  }

  freqList.forEach((freq, i) => {
    if (freq <= 0) return;
    const startTime = ctx.currentTime + i * 0.03;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    switch (timbre) {
      case 'guitar': osc.type = 'triangle'; break;
      case 'organ': osc.type = 'sine'; break;
      case 'synth-pad': osc.type = 'sawtooth'; break;
      case 'bright-lead': osc.type = 'square'; break;
      case 'warm-bass': osc.type = 'sine'; break;
      default: osc.type = 'triangle'; break;
    }
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + ep.attackSpeed);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    const end = startTime + duration * ep.sustainMultiplier;
    gain.gain.exponentialRampToValueAtTime(0.001, end);
    osc.stop(end + 0.05);
  });
}
