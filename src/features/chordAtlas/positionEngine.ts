/**
 * Position Zone Engine
 * CAGED system, 3-note-per-string, and pentatonic box positions
 * for the Biomechanical Intelligence Layer.
 */

// ─── Position Zone Types ────────────────────────────────────
export type PositionSystemType = "caged" | "3nps" | "pentatonic";

export interface PositionZone {
  id: string;
  label: string;
  /** Starting fret (inclusive) */
  startFret: number;
  /** Ending fret (inclusive) */
  endFret: number;
  system: PositionSystemType;
  /** Brief description */
  description: string;
}

// ─── CAGED Shape Offsets (relative to root fret) ────────────
// Each CAGED shape has a characteristic fret span relative to
// where the root note falls on the low E string.
const CAGED_SHAPES: Omit<PositionZone, "startFret" | "endFret">[] = [
  { id: "caged-c", label: "C Shape", system: "caged", description: "Open C voicing shape" },
  { id: "caged-a", label: "A Shape", system: "caged", description: "Open A voicing shape" },
  { id: "caged-g", label: "G Shape", system: "caged", description: "Open G voicing shape" },
  { id: "caged-e", label: "E Shape", system: "caged", description: "Open E voicing shape (barre)" },
  { id: "caged-d", label: "D Shape", system: "caged", description: "Open D voicing shape" },
];

// Offsets from root note on low E string for each CAGED shape
// These define where each shape "lives" relative to the root
const CAGED_OFFSETS = [
  { offset: -3, span: 4 }, // C shape: 3 frets before root
  { offset: 0, span: 4 },  // A shape: starts at root
  { offset: 2, span: 4 },  // G shape: 2 frets above root
  { offset: 5, span: 4 },  // E shape: 5 frets above (octave area)
  { offset: 7, span: 4 },  // D shape: 7 frets above
];

const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const ENHARMONIC: Record<string, string> = {
  Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#",
};

function rootFret(rootNote: string): number {
  const normalized = ENHARMONIC[rootNote] || rootNote;
  const eIdx = CHROMATIC.indexOf("E"); // low E = 0 on open string
  const rootIdx = CHROMATIC.indexOf(normalized);
  if (rootIdx === -1) return 0;
  return (rootIdx - eIdx + 12) % 12;
}

/** Generate CAGED position zones for a given root note */
export function getCAGEDPositions(root: string): PositionZone[] {
  const rf = rootFret(root);
  return CAGED_SHAPES.map((shape, i) => {
    const start = Math.max(0, rf + CAGED_OFFSETS[i].offset);
    return {
      ...shape,
      startFret: start,
      endFret: start + CAGED_OFFSETS[i].span,
    };
  });
}

/** Generate 3-note-per-string positions (7 positions for 7-note scales) */
export function get3NPSPositions(root: string): PositionZone[] {
  const rf = rootFret(root);
  return Array.from({ length: 5 }, (_, i) => {
    const start = Math.max(1, rf + i * 2);
    return {
      id: `3nps-${i + 1}`,
      label: `Position ${i + 1}`,
      startFret: start,
      endFret: start + 4,
      system: "3nps" as PositionSystemType,
      description: `3-note-per-string position ${i + 1}`,
    };
  });
}

/** Generate pentatonic box positions */
export function getPentatonicPositions(root: string): PositionZone[] {
  const rf = rootFret(root);
  const boxLabels = ["Box 1 (Root)", "Box 2", "Box 3", "Box 4", "Box 5 (Extended)"];
  const offsets = [0, 3, 5, 7, 10];
  return boxLabels.map((label, i) => {
    const start = Math.max(0, rf + offsets[i]);
    return {
      id: `penta-${i + 1}`,
      label,
      startFret: start,
      endFret: start + 3,
      system: "pentatonic" as PositionSystemType,
      description: `Pentatonic ${label.toLowerCase()}`,
    };
  });
}

/** Get all position zones for a given system and root */
export function getPositionZones(system: PositionSystemType, root: string): PositionZone[] {
  switch (system) {
    case "caged": return getCAGEDPositions(root);
    case "3nps": return get3NPSPositions(root);
    case "pentatonic": return getPentatonicPositions(root);
  }
}

// ─── Finger Cost Model ─────────────────────────────────────
export interface FingerAssignment {
  string: number;
  fret: number;
  finger: 0 | 1 | 2 | 3 | 4; // 0 = open
  note: string;
}

/**
 * Score a fingering assignment: lower = better.
 * Penalties for stretch, crossing, awkward shapes.
 */
export function fingeringCost(assignments: FingerAssignment[]): number {
  let cost = 0;
  const fretted = assignments.filter((a) => a.finger > 0);
  if (fretted.length === 0) return 0;

  // Stretch penalty
  const frets = fretted.map((a) => a.fret);
  const span = Math.max(...frets) - Math.min(...frets);
  if (span > 4) cost += (span - 4) * 10;
  else if (span > 3) cost += 3;

  // Finger crossing penalty (higher finger on lower fret on adjacent string)
  for (let i = 0; i < fretted.length - 1; i++) {
    const a = fretted[i], b = fretted[i + 1];
    if (a.finger > b.finger && a.fret < b.fret) cost += 5;
    if (a.finger < b.finger && a.fret > b.fret) cost += 5;
  }

  return cost;
}

/** Compare two chord fingerings for transition smoothness */
export interface TransitionAnalysis {
  anchors: FingerAssignment[];  // fingers that stay
  movers: { from: FingerAssignment; to: FingerAssignment; distance: number }[];
  totalMovement: number;
  positionShift: number;
}

export function analyzeTransition(
  from: FingerAssignment[],
  to: FingerAssignment[]
): TransitionAnalysis {
  const anchors: FingerAssignment[] = [];
  const movers: TransitionAnalysis["movers"] = [];

  for (const tf of to) {
    if (tf.finger === 0) continue;
    const match = from.find((ff) => ff.finger === tf.finger);
    if (match && match.string === tf.string && match.fret === tf.fret) {
      anchors.push(tf);
    } else if (match) {
      const dist = Math.abs(match.fret - tf.fret) + Math.abs(match.string - tf.string);
      movers.push({ from: match, to: tf, distance: dist });
    }
  }

  const totalMovement = movers.reduce((s, m) => s + m.distance, 0);
  const fromCenter = from.length > 0 ? Math.round(from.reduce((s, f) => s + f.fret, 0) / from.length) : 0;
  const toCenter = to.length > 0 ? Math.round(to.reduce((s, f) => s + f.fret, 0) / to.length) : 0;

  return { anchors, movers, totalMovement, positionShift: Math.abs(toCenter - fromCenter) };
}
