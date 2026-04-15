/**
 * Progression Analyzer — Key Detection, Functional Analysis, Mode Assignment,
 * and Position-Constrained Mode Mapping for improvisation.
 */

import { getScaleNotes, MODE_INTERVALS } from "@/components/ModeVisualizer/scaleData";
import { getPositionZones, type PositionZone, type PositionSystemType } from "./positionEngine";

// ─── Types ──────────────────────────────────────────────────

export interface ProgressionChord {
  name: string;
  root: string;
  quality: string;
  notes: string[];
}

export interface KeyCandidate {
  key: string;
  mode: string;
  confidence: number;
  matchedChords: number;
  totalChords: number;
}

export interface FunctionalLabel {
  degree: number;
  roman: string;
  functionName: string;
}

export interface ModeAssignment {
  chord: ProgressionChord;
  functional: FunctionalLabel;
  primaryMode: { name: string; notes: string[] };
  secondaryModes: { name: string; notes: string[] }[];
}

export interface PositionRecommendation {
  zone: PositionZone;
  coverage: number; // 0-1 how many chord tones fit
  score: number;    // combined quality score (higher = better)
}

export interface ModeTransitionInfo {
  fromChord: string;
  toChord: string;
  fromMode: string;
  toMode: string;
  sharedNotes: string[];
  movingNotes: { from: string; to: string }[];
}

export interface ImprovInstruction {
  chordName: string;
  mode: string;
  startOn: string;
  focusNotes: string[];
  colorNotes: string[];
  tip: string;
}

export interface ProgressionAnalysis {
  keyCandidates: KeyCandidate[];
  bestKey: KeyCandidate;
  assignments: ModeAssignment[];
  transitions: ModeTransitionInfo[];
  improvPlan: ImprovInstruction[];
  recommendedPositions: PositionRecommendation[];
}

// ─── Chromatic Helpers ──────────────────────────────────────

const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const ENHARMONIC: Record<string, string> = {
  Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#",
};

function normalize(note: string): string {
  return ENHARMONIC[note] || note;
}

function noteIndex(note: string): number {
  return CHROMATIC.indexOf(normalize(note));
}

function noteFromIndex(idx: number): string {
  return CHROMATIC[((idx % 12) + 12) % 12];
}

function interval(from: string, to: string): number {
  const f = noteIndex(from);
  const t = noteIndex(to);
  if (f === -1 || t === -1) return -1;
  return ((t - f) + 12) % 12;
}

// ─── Parse Chord String ─────────────────────────────────────

export function parseProgression(input: string): ProgressionChord[] {
  const tokens = input.trim().split(/[\s→|,]+/).filter(Boolean);
  return tokens.map(token => {
    const match = token.match(/^([A-G][#b]?)(.*)/);
    if (!match) return { name: token, root: "C", quality: "", notes: ["C"] };
    const root = match[1];
    const quality = match[2] || "";
    const notes = buildChordNotes(root, quality);
    return { name: token, root, quality, notes };
  });
}

function buildChordNotes(root: string, quality: string): string[] {
  const ri = noteIndex(root);
  if (ri === -1) return [root];
  
  // Interval sets for common qualities
  const q = quality.toLowerCase().replace(/\s/g, "");
  let intervals: number[];
  
  if (q.includes("maj7")) intervals = [0, 4, 7, 11];
  else if (q.includes("m7b5") || q.includes("ø")) intervals = [0, 3, 6, 10];
  else if (q.includes("dim7") || q === "o7") intervals = [0, 3, 6, 9];
  else if (q.includes("m7") || q === "min7") intervals = [0, 3, 7, 10];
  else if (q.includes("7#9")) intervals = [0, 4, 7, 10, 3];
  else if (q.includes("7")) intervals = [0, 4, 7, 10];
  else if (q.includes("dim") || q === "o") intervals = [0, 3, 6];
  else if (q.includes("aug") || q === "+") intervals = [0, 4, 8];
  else if (q.includes("m") || q.includes("min")) intervals = [0, 3, 7];
  else if (q.includes("sus4")) intervals = [0, 5, 7];
  else if (q.includes("sus2")) intervals = [0, 2, 7];
  else intervals = [0, 4, 7]; // major triad default
  
  return [...new Set(intervals.map(i => noteFromIndex(ri + i)))];
}

// ─── Key Detection ──────────────────────────────────────────

const MAJOR_MODES = ["Ionian", "Dorian", "Phrygian", "Lydian", "Mixolydian", "Aeolian", "Locrian"];

// Quality → expected degree positions in major scale
const QUALITY_DEGREE_MAP: Record<string, number[]> = {
  "maj7": [0, 3],       // I or IV
  "m7": [1, 2, 5],      // ii, iii, vi
  "7": [4],             // V
  "m7b5": [6],          // vii
  "": [0, 3, 4],        // I, IV, V (major triads)
  "m": [1, 2, 5],       // ii, iii, vi
  "dim": [6],           // vii
};

// Major scale intervals for building diatonic chords
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const DIATONIC_QUALITIES = ["maj7", "m7", "m7", "maj7", "7", "m7", "m7b5"];
const ROMAN_NUMERALS = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
const FUNCTION_NAMES = ["Tonic", "Supertonic", "Mediant", "Subdominant", "Dominant", "Submediant", "Leading Tone"];

export function detectKey(chords: ProgressionChord[]): KeyCandidate[] {
  const candidates: KeyCandidate[] = [];
  
  for (let keyIdx = 0; keyIdx < 12; keyIdx++) {
    const keyNote = CHROMATIC[keyIdx];
    const scaleNotes = MAJOR_SCALE.map(i => noteFromIndex(keyIdx + i));
    
    let matchCount = 0;
    
    for (const chord of chords) {
      const rootNorm = normalize(chord.root);
      const rootInScale = scaleNotes.some(n => normalize(n) === rootNorm);
      if (!rootInScale) continue;
      
      // Check if chord tones fit the scale
      const chordFit = chord.notes.every(n => 
        scaleNotes.some(sn => normalize(sn) === normalize(n))
      );
      
      if (chordFit) {
        // Check if quality matches expected degree
        const degreeIdx = scaleNotes.findIndex(n => normalize(n) === rootNorm);
        const expectedQuality = DIATONIC_QUALITIES[degreeIdx];
        const qualityNorm = chord.quality || "";
        const qualityMatch = qualityNorm === expectedQuality || 
                            qualityNorm === "" ||
                            (qualityNorm.includes("m7") && expectedQuality.includes("m7")) ||
                            (qualityNorm.includes("7") && expectedQuality === "7");
        
        matchCount += qualityMatch ? 1 : 0.5;
      }
    }
    
    if (matchCount > 0) {
      candidates.push({
        key: keyNote,
        mode: "Ionian",
        confidence: matchCount / chords.length,
        matchedChords: Math.round(matchCount),
        totalChords: chords.length,
      });
    }
  }
  
  // Sort by confidence descending
  candidates.sort((a, b) => b.confidence - a.confidence);
  return candidates.slice(0, 3);
}

// ─── Functional Analysis ────────────────────────────────────

function getFunctionalLabel(chordRoot: string, keyRoot: string): FunctionalLabel {
  const deg = interval(keyRoot, chordRoot);
  const degreeIdx = MAJOR_SCALE.indexOf(deg);
  
  if (degreeIdx === -1) {
    // Chromatic chord — find closest
    const closest = MAJOR_SCALE.reduce((best, s, i) => 
      Math.abs(s - deg) < Math.abs(MAJOR_SCALE[best] - deg) ? i : best, 0);
    return {
      degree: closest,
      roman: `♭${ROMAN_NUMERALS[closest]}`,
      functionName: "Chromatic",
    };
  }
  
  return {
    degree: degreeIdx,
    roman: ROMAN_NUMERALS[degreeIdx],
    functionName: FUNCTION_NAMES[degreeIdx],
  };
}

// ─── Mode Assignment ────────────────────────────────────────

// Quality → primary mode mapping (from chord root)
const QUALITY_MODE_MAP: Record<string, { primary: string; secondary: string[] }> = {
  "maj7":    { primary: "Ionian",     secondary: ["Lydian"] },
  "m7":      { primary: "Dorian",     secondary: ["Aeolian", "Phrygian"] },
  "7":       { primary: "Mixolydian", secondary: ["Lydian Dominant", "Blues"] },
  "m7b5":    { primary: "Locrian",    secondary: ["Aeolian"] },
  "dim7":    { primary: "Locrian",    secondary: ["Diminished (HW)"] },
  "dim":     { primary: "Locrian",    secondary: [] },
  "m":       { primary: "Dorian",     secondary: ["Aeolian"] },
  "":        { primary: "Ionian",     secondary: ["Mixolydian"] },
  "m(maj7)": { primary: "Melodic Minor", secondary: ["Harmonic Minor"] },
  "aug":     { primary: "Lydian",     secondary: ["Whole Tone"] },
};

function assignModes(chords: ProgressionChord[], bestKey: KeyCandidate): ModeAssignment[] {
  return chords.map(chord => {
    const functional = getFunctionalLabel(chord.root, bestKey.key);
    const mapping = QUALITY_MODE_MAP[chord.quality] || QUALITY_MODE_MAP[""];
    
    const primaryNotes = getScaleNotes(chord.root, mapping.primary);
    const secondaryModes = mapping.secondary.map(name => ({
      name,
      notes: getScaleNotes(chord.root, name),
    })).filter(m => m.notes.length > 0);
    
    return {
      chord,
      functional,
      primaryMode: { name: mapping.primary, notes: primaryNotes },
      secondaryModes,
    };
  });
}

// ─── Mode Transitions ───────────────────────────────────────

function analyzeTransitions(assignments: ModeAssignment[]): ModeTransitionInfo[] {
  const transitions: ModeTransitionInfo[] = [];
  
  for (let i = 0; i < assignments.length - 1; i++) {
    const from = assignments[i];
    const to = assignments[i + 1];
    
    const fromNotes = new Set(from.primaryMode.notes.map(normalize));
    const toNotes = new Set(to.primaryMode.notes.map(normalize));
    
    const shared: string[] = [];
    const moving: { from: string; to: string }[] = [];
    
    for (const n of fromNotes) {
      if (toNotes.has(n)) {
        shared.push(n);
      }
    }
    
    // Find notes that change (closest semitone movement)
    const fromOnly = [...fromNotes].filter(n => !toNotes.has(n));
    const toOnly = [...toNotes].filter(n => !fromNotes.has(n));
    
    for (let fi = 0; fi < Math.min(fromOnly.length, toOnly.length); fi++) {
      moving.push({ from: fromOnly[fi], to: toOnly[fi] });
    }
    
    transitions.push({
      fromChord: from.chord.name,
      toChord: to.chord.name,
      fromMode: `${from.chord.root} ${from.primaryMode.name}`,
      toMode: `${to.chord.root} ${to.primaryMode.name}`,
      sharedNotes: shared,
      movingNotes: moving,
    });
  }
  
  return transitions;
}

// ─── Improv Plan ────────────────────────────────────────────

function buildImprovPlan(assignments: ModeAssignment[]): ImprovInstruction[] {
  return assignments.map((a, i) => {
    const guideTones = a.chord.notes.slice(1, 3); // 3rd and 5th
    const third = a.chord.notes[1] || a.chord.root;
    
    // Color notes: tensions from the mode not in the chord
    const colorNotes = a.primaryMode.notes
      .filter(n => !a.chord.notes.some(cn => normalize(cn) === normalize(n)))
      .slice(0, 2);
    
    const tips = [
      `Start on the ${third === a.chord.notes[1] ? "3rd" : "root"} for melodic entry`,
      `Target the 3rd and 7th on strong beats`,
      `Use ${colorNotes[0] || "9th"} as a color tone for interest`,
      `Voice-lead into the next chord's guide tones`,
    ];
    
    return {
      chordName: a.chord.name,
      mode: `${a.chord.root} ${a.primaryMode.name}`,
      startOn: third,
      focusNotes: guideTones,
      colorNotes,
      tip: tips[i % tips.length],
    };
  });
}

// ─── Position Optimizer ─────────────────────────────────────

export function findOptimalPositions(
  assignments: ModeAssignment[],
  system: PositionSystemType,
  rootKey: string
): PositionRecommendation[] {
  const zones = getPositionZones(system, rootKey);
  
  // Collect all chord tones across the progression
  const allChordTones = new Set<string>();
  for (const a of assignments) {
    for (const n of a.chord.notes) allChordTones.add(normalize(n));
    for (const n of a.primaryMode.notes) allChordTones.add(normalize(n));
  }
  
  // Score each zone by how many notes it can reach
  // Use standard guitar tuning to check which notes fall in each zone
  const TUNING = [4, 9, 2, 7, 11, 4]; // E A D G B E as semitone indices
  
  return zones.map(zone => {
    let notesInZone = 0;
    let totalNotes = allChordTones.size;
    
    const reachableNotes = new Set<string>();
    for (let stringIdx = 0; stringIdx < 6; stringIdx++) {
      for (let fret = zone.startFret; fret <= zone.endFret; fret++) {
        const pitch = (TUNING[stringIdx] + fret) % 12;
        const note = CHROMATIC[pitch];
        if (allChordTones.has(note)) {
          reachableNotes.add(note);
        }
      }
    }
    
    notesInZone = reachableNotes.size;
    const coverage = totalNotes > 0 ? notesInZone / totalNotes : 0;
    
    // Prefer positions in the middle of the neck (comfortable)
    const centerFret = (zone.startFret + zone.endFret) / 2;
    const comfortBonus = centerFret >= 3 && centerFret <= 9 ? 0.1 : 0;
    
    return {
      zone,
      coverage,
      score: coverage + comfortBonus,
    };
  }).sort((a, b) => b.score - a.score);
}

// ─── Main Analysis ──────────────────────────────────────────

export function analyzeProgression(
  input: string,
  positionSystem: PositionSystemType = "caged"
): ProgressionAnalysis {
  const chords = parseProgression(input);
  if (chords.length === 0) {
    const empty: ProgressionAnalysis = {
      keyCandidates: [],
      bestKey: { key: "C", mode: "Ionian", confidence: 0, matchedChords: 0, totalChords: 0 },
      assignments: [],
      transitions: [],
      improvPlan: [],
      recommendedPositions: [],
    };
    return empty;
  }
  
  const keyCandidates = detectKey(chords);
  const bestKey = keyCandidates[0] || { key: "C", mode: "Ionian", confidence: 0, matchedChords: 0, totalChords: 0 };
  
  const assignments = assignModes(chords, bestKey);
  const transitions = analyzeTransitions(assignments);
  const improvPlan = buildImprovPlan(assignments);
  const recommendedPositions = findOptimalPositions(assignments, positionSystem, bestKey.key);
  
  return {
    keyCandidates,
    bestKey,
    assignments,
    transitions,
    improvPlan,
    recommendedPositions,
  };
}
