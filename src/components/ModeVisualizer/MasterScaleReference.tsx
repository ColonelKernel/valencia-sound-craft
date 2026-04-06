import { useState, useMemo } from "react";
import { getScaleNotes, isSharp, isFlat, MODE_CATEGORIES, ALL_ROOTS } from "./scaleData";

// The 7 modes of the major scale in order of degrees
const MAJOR_MODES = ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'];
const DEGREE_LABELS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];

// Mode families for the dropdown
const MODE_FAMILIES: { label: string; modes: string[]; degrees: string[] }[] = [
  { label: 'Major Modes', modes: MAJOR_MODES, degrees: DEGREE_LABELS },
  {
    label: 'Melodic Minor Modes',
    modes: ['Melodic Minor', 'Dorian b2', 'Lydian Augmented', 'Lydian Dominant', 'Mixolydian b6', 'Aeolian b5 (Locrian #2)', 'Altered (Super Locrian)'],
    degrees: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii'],
  },
  {
    label: 'Harmonic Minor Modes',
    modes: ['Harmonic Minor', 'Locrian #6', 'Ionian #5', 'Dorian #4', 'Phrygian Dominant', 'Lydian #2', 'Ultra Locrian'],
    degrees: ['I', 'ii', 'III', 'iv', 'V', 'VI', 'vii°'],
  },
];

const getNoteClass = (note: string, isRoot: boolean) => {
  if (isRoot) return "bg-amber-500 text-black font-bold";
  if (isSharp(note)) return "bg-blue-600/80 text-white";
  if (isFlat(note)) return "bg-orange-500/80 text-white";
  return "bg-stone-500/80 text-white";
};

// Common roots (hide enharmonics for cleaner UI)
const COMMON_ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const MasterScaleReference = () => {
  const [root, setRoot] = useState("C");
  const [familyIdx, setFamilyIdx] = useState(0);

  const family = MODE_FAMILIES[familyIdx];

  // Get the parent scale notes (mode 1 of the family from the selected root)
  const parentNotes = useMemo(() => getScaleNotes(root, family.modes[0]), [root, family]);

  // For each mode/degree, get the scale starting from that degree's root
  const modeRows = useMemo(() => {
    return family.modes.map((modeName, i) => {
      // The root of this mode is the (i)th note of the parent scale
      const modeRoot = parentNotes[i] || parentNotes[0];
      const notes = getScaleNotes(modeRoot, modeName);
      return {
        degree: family.degrees[i],
        modeName,
        root: modeRoot,
        notes,
      };
    });
  }, [parentNotes, family]);

  return (
    <div className="rounded-lg border border-border bg-card p-4 md:p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Master Scale Reference</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Select a root to see all modes derived from the same parent scale — each starting on a different degree.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Root</label>
          <select
            value={root}
            onChange={e => setRoot(e.target.value)}
            className="bg-secondary border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {COMMON_ROOTS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Family</label>
          <select
            value={familyIdx}
            onChange={e => setFamilyIdx(Number(e.target.value))}
            className="bg-secondary border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {MODE_FAMILIES.map((f, i) => (
              <option key={f.label} value={i}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mode Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs text-muted-foreground font-medium px-2 py-2 w-16">Mode</th>
              <th className="text-left text-xs text-muted-foreground font-medium px-2 py-2 w-10">Deg</th>
              {Array.from({ length: (parentNotes.length || 7) + 1 }).map((_, i) => (
                <th key={i} className="text-center text-[10px] text-muted-foreground font-medium px-1 py-2 w-9">
                  {i < (parentNotes.length || 7) ? (i + 1) : '8'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modeRows.map((row, rowIdx) => (
              <tr key={row.modeName}
                className={`border-b border-border/30 transition-colors hover:bg-accent/20 ${
                  rowIdx === 0 ? 'bg-primary/5' : ''
                }`}
              >
                <td className="px-2 py-2.5">
                  <span className="text-xs font-semibold">{row.modeName}</span>
                </td>
                <td className="px-2 py-2.5">
                  <span className="text-xs text-muted-foreground font-medium">{row.degree}</span>
                </td>
                {[...row.notes, row.notes[0]].map((note, i) => (
                  <td key={i} className="px-1 py-2.5 text-center">
                    <span
                      className={`inline-flex w-8 h-8 rounded-full items-center justify-center text-[10px] font-bold ${
                        getNoteClass(note, i === 0 || i === row.notes.length)
                      }`}
                    >
                      {note}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground pt-2 border-t border-border">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500" /> Root</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-stone-500" /> Natural</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-600" /> Sharp</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500" /> Flat</span>
        <span className="ml-auto">All modes share the same notes — each starts on a different degree</span>
      </div>
    </div>
  );
};

export default MasterScaleReference;
