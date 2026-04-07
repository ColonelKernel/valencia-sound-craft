// Tonnetz utilities: Neo-Riemannian transforms, harmonic systems, suggestions

export const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ENHARMONIC: Record<string, string> = {
  'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B',
};

export function normalize(note: string): string {
  return ENHARMONIC[note] || note;
}

export function noteIndex(note: string): number {
  return ALL_NOTES.indexOf(normalize(note));
}

// ─── Triad Types ────────────────────────────────────────────
export interface TonnetzTriadData {
  root: number;       // pitch class 0-11
  type: 'major' | 'minor';
  notes: [number, number, number]; // pitch classes
}

export function triadLabel(t: TonnetzTriadData): string {
  return `${ALL_NOTES[t.root]}${t.type === 'minor' ? 'm' : ''}`;
}

export function triadNotes(root: number, type: 'major' | 'minor'): [number, number, number] {
  if (type === 'major') return [root, (root + 4) % 12, (root + 7) % 12];
  return [root, (root + 3) % 12, (root + 7) % 12];
}

export function makeTriad(root: number, type: 'major' | 'minor'): TonnetzTriadData {
  return { root, type, notes: triadNotes(root, type) };
}

// ─── Neo-Riemannian Transformations ─────────────────────────
// P (Parallel): C major ↔ C minor — change quality, keep root
export function transformP(t: TonnetzTriadData): TonnetzTriadData {
  return makeTriad(t.root, t.type === 'major' ? 'minor' : 'major');
}

// R (Relative): C major → A minor, A minor → C major
export function transformR(t: TonnetzTriadData): TonnetzTriadData {
  if (t.type === 'major') {
    return makeTriad((t.root + 9) % 12, 'minor'); // down m3
  }
  return makeTriad((t.root + 3) % 12, 'major'); // up m3
}

// L (Leading-tone exchange): C major → E minor, E minor → C major
export function transformL(t: TonnetzTriadData): TonnetzTriadData {
  if (t.type === 'major') {
    return makeTriad((t.root + 4) % 12, 'minor'); // up M3
  }
  return makeTriad((t.root + 8) % 12, 'major'); // down M3
}

// Compound transforms
export function transformN(t: TonnetzTriadData): TonnetzTriadData {
  return transformR(transformL(transformP(t))); // Nebenverwandt
}

export function transformS(t: TonnetzTriadData): TonnetzTriadData {
  return transformL(transformP(transformR(t))); // Slide
}

export function transformH(t: TonnetzTriadData): TonnetzTriadData {
  return transformL(transformP(transformL(t))); // Hexatonic pole
}

export type TransformType = 'P' | 'L' | 'R' | 'N' | 'S' | 'H';

export const TRANSFORMS: { id: TransformType; label: string; desc: string }[] = [
  { id: 'P', label: 'P', desc: 'Parallel — flip major/minor' },
  { id: 'L', label: 'L', desc: 'Leading-tone — move by M3' },
  { id: 'R', label: 'R', desc: 'Relative — move by m3' },
  { id: 'N', label: 'N', desc: 'Nebenverwandt — RLP compound' },
  { id: 'S', label: 'S', desc: 'Slide — LPR compound' },
  { id: 'H', label: 'H', desc: 'Hexatonic pole — LPL compound' },
];

export function applyTransform(t: TonnetzTriadData, type: TransformType): TonnetzTriadData {
  switch (type) {
    case 'P': return transformP(t);
    case 'L': return transformL(t);
    case 'R': return transformR(t);
    case 'N': return transformN(t);
    case 'S': return transformS(t);
    case 'H': return transformH(t);
  }
}

// ─── Harmonic Systems ───────────────────────────────────────
export interface HarmonicSystem {
  id: string;
  label: string;
  description: string;
  // Which pitch classes are "in system" for highlighting
  getScaleNotes: (root: number) => number[];
}

export const HARMONIC_SYSTEMS: HarmonicSystem[] = [
  {
    id: 'chromatic',
    label: 'Chromatic',
    description: 'All 12 tones equally',
    getScaleNotes: () => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  },
  {
    id: 'flamenco',
    label: 'Flamenco (Phrygian Dominant)',
    description: '1 ♭2 3 4 5 ♭6 ♭7 — Andalusian cadence',
    getScaleNotes: (root) => [0, 1, 4, 5, 7, 8, 10].map(i => (root + i) % 12),
  },
  {
    id: 'maqam-hijaz',
    label: 'Maqam Hijaz',
    description: '1 ♭2 3 4 5 ♭6 ♭7 — Arabic double harmonic',
    getScaleNotes: (root) => [0, 1, 4, 5, 7, 8, 11].map(i => (root + i) % 12),
  },
  {
    id: 'maqam-bayati',
    label: 'Maqam Bayati',
    description: '1 ♭2(¾) ♭3 4 5 6 ♭7 — approximated in 12-TET',
    getScaleNotes: (root) => [0, 1, 3, 5, 7, 9, 10].map(i => (root + i) % 12),
  },
  {
    id: 'whole-tone',
    label: 'Whole Tone',
    description: 'Symmetrical 6-note scale — Debussy',
    getScaleNotes: (root) => [0, 2, 4, 6, 8, 10].map(i => (root + i) % 12),
  },
  {
    id: 'octatonic',
    label: 'Octatonic (Dim)',
    description: 'Half-whole diminished — Messiaen Mode 2',
    getScaleNotes: (root) => [0, 1, 3, 4, 6, 7, 9, 10].map(i => (root + i) % 12),
  },
];

// ─── Suggestion Engine ──────────────────────────────────────
export type SuggestionFlavor = 'safe' | 'colorful' | 'dark' | 'bright' | 'distant';

export interface ChordSuggestion {
  triad: TonnetzTriadData;
  transforms: TransformType[];
  flavor: SuggestionFlavor;
  reason: string;
}

export function suggestNextChords(current: TonnetzTriadData | null, scaleSet: Set<number>): ChordSuggestion[] {
  if (!current) return [];
  const suggestions: ChordSuggestion[] = [];

  // Safe: diatonic neighbors
  for (const t of ['P', 'R', 'L'] as TransformType[]) {
    const result = applyTransform(current, t);
    const inScale = result.notes.every(n => scaleSet.has(n));
    suggestions.push({
      triad: result,
      transforms: [t],
      flavor: inScale ? 'safe' : 'colorful',
      reason: `${t} transform → ${triadLabel(result)}`,
    });
  }

  // Darker: minor-ward moves
  const slide = applyTransform(current, 'S');
  suggestions.push({
    triad: slide,
    transforms: ['S'],
    flavor: 'dark',
    reason: `Slide → ${triadLabel(slide)} (chromatic shift)`,
  });

  // Brighter: move up by M3
  const hexPole = applyTransform(current, 'H');
  suggestions.push({
    triad: hexPole,
    transforms: ['H'],
    flavor: 'distant',
    reason: `Hexatonic pole → ${triadLabel(hexPole)} (maximally distant)`,
  });

  return suggestions;
}

export function modulateTo(current: TonnetzTriadData, direction: 'darker' | 'brighter' | 'distant'): TonnetzTriadData {
  switch (direction) {
    case 'darker':
      // Move to minor subdominant region
      return current.type === 'major'
        ? makeTriad((current.root + 5) % 12, 'minor')
        : makeTriad((current.root + 5) % 12, 'minor');
    case 'brighter':
      // Move to major dominant region
      return makeTriad((current.root + 7) % 12, 'major');
    case 'distant':
      // Tritone away
      return makeTriad((current.root + 6) % 12, current.type === 'major' ? 'minor' : 'major');
  }
}

// ─── Grid Geometry ──────────────────────────────────────────
export interface TonnetzNode {
  q: number;
  r: number;
  noteIdx: number;
  note: string;
  x: number;
  y: number;
}

export interface GridTriad {
  notes: [number, number, number];
  nodes: [TonnetzNode, TonnetzNode, TonnetzNode];
  type: 'major' | 'minor';
  root: number;
  label: string;
}

export function buildGrid(cols: number, rows: number, hexRadius: number): TonnetzNode[] {
  const nodes: TonnetzNode[] = [];
  const dx = hexRadius * 1.85;
  const dy = hexRadius * 1.6;
  for (let r = 0; r < rows; r++) {
    for (let q = 0; q < cols; q++) {
      // Convert offset hex coords to axial so diagonals stay consistent:
      // Horizontal (axial q) = Perfect 5th (+7)
      // Diagonal (axial r)   = Major 3rd (+4)
      // Derived diagonal     = Minor 3rd (+3) via P5 − M3
      const axialQ = q - Math.floor(r / 2);
      const noteIdx = ((7 * axialQ + 4 * r) % 12 + 12) % 12;
      const x = q * dx + (r % 2 === 1 ? dx / 2 : 0) + hexRadius + 10;
      const y = (rows - 1 - r) * dy + hexRadius + 10;
      nodes.push({ q, r, noteIdx, note: ALL_NOTES[noteIdx], x, y });
    }
  }
  return nodes;
}

export function findGridTriads(nodes: TonnetzNode[]): GridTriad[] {
  const triads: GridTriad[] = [];
  const nodeMap = new Map<string, TonnetzNode>();
  nodes.forEach(n => nodeMap.set(`${n.q},${n.r}`, n));

  for (const n of nodes) {
    const right = nodeMap.get(`${n.q + 1},${n.r}`);
    const upKey = n.r % 2 === 0 ? `${n.q},${n.r + 1}` : `${n.q + 1},${n.r + 1}`;
    const up = nodeMap.get(upKey);

    if (right && up) {
      const rootIdx = n.noteIdx;
      const thirdIdx = up.noteIdx;
      const fifthIdx = right.noteIdx;
      const i1 = ((thirdIdx - rootIdx) % 12 + 12) % 12;
      const i2 = ((fifthIdx - rootIdx) % 12 + 12) % 12;

      if (i1 === 4 && i2 === 7) {
        triads.push({ notes: [rootIdx, thirdIdx, fifthIdx], nodes: [n, up, right], type: 'major', root: rootIdx, label: ALL_NOTES[rootIdx] });
      }
      if (i1 === 3 && i2 === 7) {
        triads.push({ notes: [rootIdx, thirdIdx, fifthIdx], nodes: [n, up, right], type: 'minor', root: rootIdx, label: `${ALL_NOTES[rootIdx]}m` });
      }
    }

    const upLeftKey = n.r % 2 === 0 ? `${n.q - 1},${n.r + 1}` : `${n.q},${n.r + 1}`;
    const upLeft = nodeMap.get(upLeftKey);
    if (up && upLeft) {
      // Downward-pointing triangle: upLeft is the root of the minor triad
      // upLeft → n = +3 (minor 3rd), upLeft → up = +7 (perfect 5th)
      const rootIdx = upLeft.noteIdx;
      const thirdIdx = n.noteIdx;
      const fifthIdx = up.noteIdx;
      const i1 = ((thirdIdx - rootIdx) % 12 + 12) % 12;
      const i2 = ((fifthIdx - rootIdx) % 12 + 12) % 12;

      if (i1 === 3 && i2 === 7) {
        triads.push({ notes: [rootIdx, thirdIdx, fifthIdx], nodes: [upLeft, n, up], type: 'minor', root: rootIdx, label: `${ALL_NOTES[rootIdx]}m` });
      }
    }
  }

  const seen = new Set<string>();
  return triads.filter(t => {
    const key = [...t.notes].sort().join(',') + t.type;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Heatmap ────────────────────────────────────────────────
export function computeHeatmap(progression: TonnetzTriadData[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const t of progression) {
    for (const n of t.notes) {
      map.set(n, (map.get(n) || 0) + 1);
    }
  }
  return map;
}

// ─── Pitch class colors ─────────────────────────────────────
export const NOTE_COLORS: Record<number, string> = {
  0: '#ef4444', 1: '#f97316', 2: '#eab308', 3: '#84cc16',
  4: '#22c55e', 5: '#14b8a6', 6: '#06b6d4', 7: '#3b82f6',
  8: '#6366f1', 9: '#8b5cf6', 10: '#d946ef', 11: '#ec4899',
};

// ─── Preset Progressions for Tonnetz ────────────────────────
export const TONNETZ_PRESETS = [
  { label: 'Pop (I–V–vi–IV)', triads: [makeTriad(0, 'major'), makeTriad(7, 'major'), makeTriad(9, 'minor'), makeTriad(5, 'major')] },
  { label: 'Jazz ii–V–I', triads: [makeTriad(2, 'minor'), makeTriad(7, 'major'), makeTriad(0, 'major')] },
  { label: 'Cinematic (i–VI–III–VII)', triads: [makeTriad(0, 'minor'), makeTriad(8, 'major'), makeTriad(3, 'major'), makeTriad(10, 'major')] },
  { label: 'PLR Cycle', triads: [makeTriad(0, 'major'), makeTriad(0, 'minor'), makeTriad(4, 'minor'), makeTriad(4, 'major')] },
  { label: 'Hexatonic (P–L chain)', triads: [makeTriad(0, 'major'), makeTriad(0, 'minor'), makeTriad(8, 'major'), makeTriad(8, 'minor'), makeTriad(4, 'major'), makeTriad(4, 'minor')] },
];
