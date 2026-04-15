/**
 * Improvisation Engine — Theory & Analysis
 * Generates scale recommendations, target tones, tensions, and play strategies per chord.
 */

import { getScaleNotes, MODE_INTERVALS } from "@/components/ModeVisualizer/scaleData";

// ─── Types ──────────────────────────────────────────────────

export interface ImprovChord {
  name: string;
  root: string;
  quality: string;
  notes: string[];
}

export interface ScaleRecommendation {
  name: string;
  type: "primary" | "alternative" | "safe";
  notes: string[];
}

export interface PlayStrategy {
  entryNotes: string[];
  exitNotes: string[];
  avoidNotes: string[];
  emphasis: string;
}

export interface ChordAnalysis {
  chord: ImprovChord;
  scales: ScaleRecommendation[];
  guideTones: string[];
  tensions: { note: string; label: string }[];
  strategy: PlayStrategy;
  safetyLevel: { safe: string[]; color: string[]; outside: string[] };
}

export type ImprovStyle = "jazz" | "blues" | "rock" | "neo-soul" | "flamenco";

export interface StyleProfile {
  id: ImprovStyle;
  label: string;
  description: string;
  preferredScales: string[];
  noteDensity: number; // 0-1
  swingAmount: number; // 0-1
  phraseLength: [number, number]; // min/max notes
}

export interface ArtistProfile {
  id: string;
  label: string;
  style: string;
  traits: string[];
}

// ─── Constants ──────────────────────────────────────────────

const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const ENHARMONIC: Record<string, string> = {
  Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#",
  "C#": "Db", "D#": "Eb", "F#": "Gb", "G#": "Ab", "A#": "Bb",
};

function noteIndex(note: string): number {
  let idx = CHROMATIC.indexOf(note);
  if (idx === -1) {
    const enh = ENHARMONIC[note];
    if (enh) idx = CHROMATIC.indexOf(enh);
  }
  return idx;
}

function noteFromRoot(root: string, semitones: number): string {
  const idx = noteIndex(root);
  if (idx === -1) return root;
  return CHROMATIC[(idx + semitones) % 12];
}

// ─── Style Profiles ─────────────────────────────────────────

export const STYLE_PROFILES: StyleProfile[] = [
  {
    id: "jazz",
    label: "Jazz",
    description: "Bebop enclosures, chromatic approach, altered dominants",
    preferredScales: ["Dorian", "Mixolydian", "Altered (Super Locrian)", "Lydian Dominant"],
    noteDensity: 0.7,
    swingAmount: 0.6,
    phraseLength: [4, 12],
  },
  {
    id: "blues",
    label: "Blues",
    description: "Minor pentatonic base, blue notes, expressive bends",
    preferredScales: ["Minor Pentatonic", "Blues", "Mixolydian"],
    noteDensity: 0.4,
    swingAmount: 0.4,
    phraseLength: [3, 8],
  },
  {
    id: "rock",
    label: "Rock",
    description: "Pentatonic power, strong root emphasis, high energy",
    preferredScales: ["Minor Pentatonic", "Major Pentatonic", "Mixolydian"],
    noteDensity: 0.5,
    swingAmount: 0.1,
    phraseLength: [4, 10],
  },
  {
    id: "neo-soul",
    label: "Neo Soul",
    description: "Extended harmony, smooth voice leading, space between phrases",
    preferredScales: ["Dorian", "Lydian", "Melodic Minor"],
    noteDensity: 0.35,
    swingAmount: 0.3,
    phraseLength: [3, 7],
  },
  {
    id: "flamenco",
    label: "Flamenco",
    description: "Phrygian dominance, harmonic minor, rhythmic precision",
    preferredScales: ["Phrygian Dominant", "Harmonic Minor", "Phrygian"],
    noteDensity: 0.65,
    swingAmount: 0.0,
    phraseLength: [5, 16],
  },
];

export const ARTIST_PROFILES: ArtistProfile[] = [
  { id: "knopfler", label: "Mark Knopfler", style: "Fingerstyle melodic storytelling", traits: ["Major pentatonic + Mixolydian", "Space between phrases", "Melodic motifs"] },
  { id: "wes", label: "Wes Montgomery", style: "Octave playing, swing phrasing", traits: ["Chord-tone emphasis", "Octave melodies", "Swing feel"] },
  { id: "bbking", label: "B.B. King", style: "Call-and-response, vibrato", traits: ["Minor pentatonic box 1", "Vibrato emphasis", "Vocal-like phrasing"] },
  { id: "mayer", label: "John Mayer", style: "Blues-pop fusion, tasteful bends", traits: ["Pentatonic + Dorian mix", "Dynamic control", "Rhythmic variety"] },
];

// ─── Quality → Scale mapping ────────────────────────────────

const QUALITY_SCALE_MAP: Record<string, { primary: string; alternatives: string[]; safe: string }> = {
  "maj7":    { primary: "Ionian",     alternatives: ["Lydian"],                      safe: "Major Pentatonic" },
  "m7":      { primary: "Dorian",     alternatives: ["Aeolian", "Phrygian"],         safe: "Minor Pentatonic" },
  "7":       { primary: "Mixolydian", alternatives: ["Lydian Dominant", "Blues"],     safe: "Minor Pentatonic" },
  "m7b5":    { primary: "Locrian",    alternatives: ["Aeolian b5 (Locrian #2)"],     safe: "Minor Pentatonic" },
  "dim7":    { primary: "Diminished (HW)", alternatives: ["Ultra Locrian"],          safe: "Minor Pentatonic" },
  "m(maj7)": { primary: "Melodic Minor", alternatives: ["Harmonic Minor"],           safe: "Minor Pentatonic" },
  "":        { primary: "Ionian",     alternatives: ["Mixolydian"],                  safe: "Major Pentatonic" },
  "m":       { primary: "Dorian",     alternatives: ["Aeolian"],                     safe: "Minor Pentatonic" },
};

// ─── Tension calculation ────────────────────────────────────

function getTensions(root: string, quality: string): { note: string; label: string }[] {
  const tensions: { note: string; label: string }[] = [];
  // 9th
  tensions.push({ note: noteFromRoot(root, 2), label: "9" });
  // For dominant chords, add altered tensions
  if (quality === "7") {
    tensions.push({ note: noteFromRoot(root, 1), label: "b9" });
    tensions.push({ note: noteFromRoot(root, 3), label: "#9" });
    tensions.push({ note: noteFromRoot(root, 6), label: "#11" });
    tensions.push({ note: noteFromRoot(root, 8), label: "b13" });
  }
  // 11th for minor chords
  if (quality.includes("m") && !quality.includes("maj")) {
    tensions.push({ note: noteFromRoot(root, 5), label: "11" });
  }
  // #11 for major chords
  if (quality === "maj7") {
    tensions.push({ note: noteFromRoot(root, 6), label: "#11" });
    tensions.push({ note: noteFromRoot(root, 9), label: "13" });
  }
  return tensions;
}

// ─── Guide tones (3rd + 7th) ────────────────────────────────

function getGuideTones(root: string, quality: string): string[] {
  const tones: string[] = [];
  // 3rd
  if (quality.includes("m") && !quality.includes("maj")) {
    tones.push(noteFromRoot(root, 3)); // minor 3rd
  } else {
    tones.push(noteFromRoot(root, 4)); // major 3rd
  }
  // 7th
  if (quality.includes("maj7") || quality === "m(maj7)") {
    tones.push(noteFromRoot(root, 11)); // major 7th
  } else if (quality.includes("7") || quality.includes("m7")) {
    tones.push(noteFromRoot(root, 10)); // minor 7th
  } else if (quality.includes("dim7")) {
    tones.push(noteFromRoot(root, 9)); // diminished 7th
  }
  return tones;
}

// ─── Play strategy ──────────────────────────────────────────

function getPlayStrategy(root: string, quality: string, nextChord?: ImprovChord): PlayStrategy {
  const guideTones = getGuideTones(root, quality);
  const entryNotes = [root, ...guideTones.slice(0, 1)];
  
  // Exit notes: voice-lead to next chord's guide tones
  let exitNotes: string[] = [];
  if (nextChord) {
    const nextGuide = getGuideTones(nextChord.root, nextChord.quality);
    exitNotes = nextGuide;
  } else {
    exitNotes = guideTones;
  }

  // Avoid notes: generally the 4th for major, the b6 for dominant
  const avoidNotes: string[] = [];
  if (quality === "maj7" || quality === "") {
    avoidNotes.push(noteFromRoot(root, 5)); // avoid 4th
  }

  return {
    entryNotes,
    exitNotes,
    avoidNotes,
    emphasis: quality.includes("7") ? "Target 3rd & 7th on beats 1 & 3" : "Emphasize root & 5th",
  };
}

// ─── Safety ladder ──────────────────────────────────────────

function getSafetyLadder(root: string, quality: string): { safe: string[]; color: string[]; outside: string[] } {
  const mapping = QUALITY_SCALE_MAP[quality] || QUALITY_SCALE_MAP[""];
  
  const safeNotes = getScaleNotes(root, mapping.safe);
  const primaryNotes = getScaleNotes(root, mapping.primary);
  
  // Color = notes in primary scale but not in safe
  const color = primaryNotes.filter(n => !safeNotes.includes(n));
  
  // Outside = chromatic tones not in primary
  const outside = CHROMATIC.filter(n => {
    const idx = noteIndex(n);
    return !primaryNotes.some(pn => noteIndex(pn) === idx);
  }).slice(0, 3);

  return { safe: safeNotes, color, outside };
}

// ─── Main analysis function ─────────────────────────────────

export function analyzeChordForImprov(
  chord: ImprovChord,
  nextChord?: ImprovChord,
  style?: ImprovStyle
): ChordAnalysis {
  const mapping = QUALITY_SCALE_MAP[chord.quality] || QUALITY_SCALE_MAP[""];
  const profile = style ? STYLE_PROFILES.find(s => s.id === style) : undefined;

  // Build scale recommendations
  const scales: ScaleRecommendation[] = [
    { name: mapping.primary, type: "primary", notes: getScaleNotes(chord.root, mapping.primary) },
    ...mapping.alternatives.map(alt => ({
      name: alt,
      type: "alternative" as const,
      notes: getScaleNotes(chord.root, alt),
    })),
    { name: mapping.safe, type: "safe", notes: getScaleNotes(chord.root, mapping.safe) },
  ];

  // If style has preferred scales, reorder
  if (profile) {
    const preferredMatch = profile.preferredScales.find(ps => 
      scales.some(s => s.name === ps)
    );
    if (preferredMatch) {
      const idx = scales.findIndex(s => s.name === preferredMatch);
      if (idx > 0) {
        const [moved] = scales.splice(idx, 1);
        scales.unshift({ ...moved, type: "primary" });
        scales[1] = { ...scales[1], type: "alternative" };
      }
    }
  }

  return {
    chord,
    scales,
    guideTones: getGuideTones(chord.root, chord.quality),
    tensions: getTensions(chord.root, chord.quality),
    strategy: getPlayStrategy(chord.root, chord.quality, nextChord),
    safetyLevel: getSafetyLadder(chord.root, chord.quality),
  };
}

// ─── Parse chord string ─────────────────────────────────────

export function parseChordString(input: string): ImprovChord[] {
  const tokens = input.trim().split(/[\s|,]+/).filter(Boolean);
  return tokens.map(token => {
    // Match root (with optional # or b) + quality
    const match = token.match(/^([A-G][#b]?)(.*)/);
    if (!match) return { name: token, root: "C", quality: "", notes: [] };
    const root = match[1];
    const quality = match[2] || "";
    // Simplified note generation
    const notes = [root];
    return { name: token, root, quality, notes };
  });
}

// ─── Preset progressions ────────────────────────────────────

export interface PresetProgression {
  id: string;
  label: string;
  style: ImprovStyle;
  chords: string;
}

export const PRESET_PROGRESSIONS: PresetProgression[] = [
  { id: "jazz-251", label: "Jazz ii–V–I", style: "jazz", chords: "Dm7 G7 Cmaj7" },
  { id: "jazz-251-minor", label: "Jazz ii–V–i (minor)", style: "jazz", chords: "Dm7b5 G7 Cm7" },
  { id: "blues-12", label: "12-Bar Blues", style: "blues", chords: "A7 A7 A7 A7 D7 D7 A7 A7 E7 D7 A7 E7" },
  { id: "neosoul-1", label: "Neo Soul Loop", style: "neo-soul", chords: "Dmaj7 Dbmaj7 Cm7 Bm7" },
  { id: "neosoul-2", label: "Erykah Badu Vibe", style: "neo-soul", chords: "Am7 D7 Gmaj7 Cmaj7" },
  { id: "flamenco-cadence", label: "Flamenco Cadence", style: "flamenco", chords: "Am G F E7" },
  { id: "rock-pop", label: "Pop-Rock I–V–vi–IV", style: "rock", chords: "C G Am F" },
  { id: "coltrane", label: "Coltrane Changes", style: "jazz", chords: "Cmaj7 Ab7 Dbmaj7 A7 Dmaj7 Bb7 Ebmaj7 B7" },
];
