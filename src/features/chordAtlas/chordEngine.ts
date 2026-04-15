/**
 * Chord Atlas Engine
 * Generates diatonic and extended chord data for any key/mode combination.
 * Reuses scaleData for note generation and chord formulas.
 */

import {
  getScaleNotes,
  getChordSpellings,
  MODE_INTERVALS,
  type ChordSpelling,
} from "@/components/ModeVisualizer/scaleData";

// ─── Chord Voicing Types ────────────────────────────────────
export interface ChordVoicing {
  label: string;
  frets: (number | "x")[];
}

export interface ChordAtlasEntry {
  /** e.g. "Cmaj7" */
  name: string;
  /** Roman numeral e.g. "Imaj7" */
  symbol: string;
  /** Root note e.g. "C" */
  root: string;
  /** e.g. "maj7" */
  quality: string;
  /** Chord tones e.g. ["C","E","G","B"] */
  notes: string[];
  /** Interval labels e.g. ["1","3","5","7"] */
  intervals: string[];
  /** Degree index (0-based) */
  degree: number;
  /** Harmonic function label */
  function: string;
  /** Suggested voicings */
  voicings: ChordVoicing[];
  /** Related scale names */
  relatedScales: string[];
  /** Substitution suggestions */
  substitutions: string[];
}

// ─── Harmonic function labels ───────────────────────────────
const FUNCTION_LABELS: Record<number, string> = {
  0: "Tonic",
  1: "Supertonic",
  2: "Mediant",
  3: "Subdominant",
  4: "Dominant",
  5: "Submediant",
  6: "Leading",
};

// ─── Quality to related scales ──────────────────────────────
const QUALITY_SCALES: Record<string, string[]> = {
  "maj7": ["Ionian", "Lydian"],
  "m7": ["Dorian", "Aeolian", "Phrygian"],
  "7": ["Mixolydian", "Lydian Dominant"],
  "m7b5": ["Locrian", "Aeolian b5 (Locrian #2)"],
  "dim7": ["Diminished (HW)", "Ultra Locrian"],
  "m(maj7)": ["Melodic Minor", "Harmonic Minor"],
  "maj7#5": ["Lydian Augmented", "Ionian #5"],
  "aug": ["Whole Tone"],
  "": ["Ionian"],
  "m": ["Dorian", "Aeolian"],
  "dim": ["Locrian"],
};

// ─── Substitution logic ─────────────────────────────────────
function getSubstitutions(degree: number, quality: string, totalDegrees: number): string[] {
  const subs: string[] = [];
  // Tritone sub for dominant (degree 4 = V)
  if (degree === 4 && (quality === "7" || quality === "")) {
    subs.push("Tritone substitution (bII7)");
  }
  // Relative minor/major swap
  if (degree === 0) subs.push("vi (relative minor)");
  if (degree === 5) subs.push("I (relative major)");
  // iii for I
  if (degree === 0) subs.push("iii (mediant)");
  if (degree === 2) subs.push("I (tonic)");
  // ii for IV
  if (degree === 3) subs.push("ii (supertonic)");
  if (degree === 1) subs.push("IV (subdominant)");
  return subs;
}

// ─── Common voicings by quality ─────────────────────────────
const COMMON_VOICINGS: Record<string, ChordVoicing[]> = {
  "maj7": [
    { label: "Open", frets: ["x", 3, 2, 0, 0, 0] },
    { label: "Barre", frets: ["x", 3, 5, 4, 5, 3] },
  ],
  "m7": [
    { label: "Open", frets: ["x", "x", 0, 2, 1, 1] },
    { label: "Barre", frets: ["x", 1, 3, 1, 2, 1] },
  ],
  "7": [
    { label: "Open", frets: ["x", "x", 0, 2, 1, 2] },
    { label: "Barre", frets: ["x", 1, 3, 1, 3, 1] },
  ],
  "m7b5": [
    { label: "Root pos", frets: ["x", "x", 1, 2, 1, 2] },
  ],
  "dim7": [
    { label: "Root pos", frets: ["x", "x", 1, 2, 1, 2] },
  ],
  "m(maj7)": [
    { label: "Root pos", frets: ["x", 3, 1, 0, 0, 0] },
  ],
  "": [
    { label: "Open", frets: ["x", 3, 2, 0, 1, 0] },
    { label: "Barre", frets: ["x", 3, 5, 5, 5, 3] },
  ],
  "m": [
    { label: "Open", frets: ["x", 3, 5, 5, 4, 3] },
    { label: "Barre", frets: ["x", 1, 3, 3, 2, 1] },
  ],
};

// ─── Main chord generation ──────────────────────────────────
export function generateChordAtlas(
  key: string,
  mode: string
): ChordAtlasEntry[] {
  const scaleNotes = getScaleNotes(key, mode);
  const spellings = getChordSpellings(scaleNotes, mode);

  if (spellings.length === 0) return [];

  return spellings.map((spelling, degree) => {
    const quality = spelling.name.replace(spelling.rootNote, "");

    return {
      name: spelling.name,
      symbol: spelling.symbol,
      root: spelling.rootNote,
      quality,
      notes: spelling.notes,
      intervals: spelling.intervals,
      degree,
      function: FUNCTION_LABELS[degree] || `Degree ${degree + 1}`,
      voicings: COMMON_VOICINGS[quality] || COMMON_VOICINGS[""] || [],
      relatedScales: QUALITY_SCALES[quality] || [],
      substitutions: getSubstitutions(degree, quality, spellings.length),
    };
  });
}

// ─── Chord filter categories ────────────────────────────────
export type ChordFilterCategory =
  | "all"
  | "triads"
  | "seventh"
  | "extended"
  | "diminished"
  | "augmented";

export function filterChords(
  chords: ChordAtlasEntry[],
  filter: ChordFilterCategory
): ChordAtlasEntry[] {
  switch (filter) {
    case "triads":
      return chords.filter((c) => c.intervals.length <= 3);
    case "seventh":
      return chords.filter((c) => c.intervals.length === 4);
    case "diminished":
      return chords.filter(
        (c) => c.quality.includes("dim") || c.quality.includes("m7b5")
      );
    case "augmented":
      return chords.filter(
        (c) => c.quality.includes("aug") || c.quality.includes("#5")
      );
    default:
      return chords;
  }
}

// ─── Interval color mapping ─────────────────────────────────
export function getIntervalColor(interval: string): string {
  switch (interval) {
    case "1":
      return "bg-amber-500 text-black";
    case "3":
    case "b3":
      return "bg-blue-500 text-white";
    case "5":
    case "b5":
    case "#5":
      return "bg-emerald-500 text-white";
    case "7":
    case "b7":
    case "bb7":
      return "bg-violet-500 text-white";
    default:
      return "bg-stone-500 text-white";
  }
}
