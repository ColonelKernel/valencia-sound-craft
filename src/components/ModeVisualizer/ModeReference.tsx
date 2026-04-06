import { useState } from "react";
import { getScaleNotes, isSharp, isFlat, MODE_INTERVAL_NAMES, MODE_CATEGORIES } from "./scaleData";

interface ModeReferenceProps {
  rootNote?: string;
}

const MODE_DESCRIPTIONS: Record<string, string> = {
  Ionian: 'Happy, bright — the major scale',
  Dorian: 'Smooth, jazzy minor',
  Phrygian: 'Dark, Spanish/metal flavour',
  Lydian: 'Dreamy, floating, ethereal',
  Mixolydian: 'Bluesy, classic rock dominant',
  Aeolian: 'Sad, natural minor',
  Locrian: 'Unstable, dissonant, diminished',
  'Melodic Minor': 'Jazz minor — minor with major 6 & 7',
  'Dorian b2': 'Phrygian + natural 6th',
  'Lydian Augmented': 'Lydian with raised 5th — lush',
  'Lydian Dominant': 'Lydian + b7 — Simpsons theme',
  'Mixolydian b6': 'Hindu scale — dominant + minor 6',
  'Aeolian b5 (Locrian #2)': 'Half-diminished sound',
  'Altered (Super Locrian)': 'All tensions altered — jazz dominant',
  'Harmonic Minor': 'Classical minor — raised 7th',
  'Locrian #6': 'Locrian with natural 6th',
  'Ionian #5': 'Major with augmented 5th',
  'Dorian #4': 'Dorian with raised 4th — exotic',
  'Phrygian Dominant': 'Spanish/Middle Eastern — b2 + major 3',
  'Lydian #2': 'Lydian with augmented 2nd',
  'Ultra Locrian': 'Diminished dominant — very dissonant',
  'Major Pentatonic': 'Universal — bright, open, simple',
  'Minor Pentatonic': 'Rock/blues workhorse',
  'Blues': 'Minor pentatonic + blue note (b5)',
  'Whole Tone': 'Dreamy, ambiguous — no resolution',
  'Diminished (HW)': 'Symmetric — jazz dominant chord scale',
  'Diminished (WH)': 'Symmetric — over diminished chords',
  'Chromatic': 'All 12 notes — no tonal center',
};

// Quick comparisons per category
const CATEGORY_COMPARISONS: Record<string, { mode: string; base: string; change: string; type: 'raised' | 'lowered' }[]> = {
  'Major Modes': [
    { mode: 'Dorian', base: 'Aeolian', change: 'raised 6th', type: 'raised' },
    { mode: 'Phrygian', base: 'Aeolian', change: 'lowered 2nd', type: 'lowered' },
    { mode: 'Lydian', base: 'Ionian', change: 'raised 4th', type: 'raised' },
    { mode: 'Mixolydian', base: 'Ionian', change: 'lowered 7th', type: 'lowered' },
    { mode: 'Locrian', base: 'Aeolian', change: 'lowered 2nd & 5th', type: 'lowered' },
  ],
  'Melodic Minor Modes': [
    { mode: 'Melodic Minor', base: 'Aeolian', change: 'raised 6th & 7th', type: 'raised' },
    { mode: 'Dorian b2', base: 'Dorian', change: 'lowered 2nd', type: 'lowered' },
    { mode: 'Lydian Augmented', base: 'Lydian', change: 'raised 5th', type: 'raised' },
    { mode: 'Lydian Dominant', base: 'Lydian', change: 'lowered 7th', type: 'lowered' },
    { mode: 'Mixolydian b6', base: 'Mixolydian', change: 'lowered 6th', type: 'lowered' },
    { mode: 'Altered (Super Locrian)', base: 'Locrian', change: 'lowered 4th', type: 'lowered' },
  ],
  'Harmonic Minor Modes': [
    { mode: 'Harmonic Minor', base: 'Aeolian', change: 'raised 7th', type: 'raised' },
    { mode: 'Phrygian Dominant', base: 'Phrygian', change: 'raised 3rd', type: 'raised' },
    { mode: 'Dorian #4', base: 'Dorian', change: 'raised 4th', type: 'raised' },
    { mode: 'Lydian #2', base: 'Lydian', change: 'raised 2nd', type: 'raised' },
    { mode: 'Ionian #5', base: 'Ionian', change: 'raised 5th', type: 'raised' },
  ],
  'Pentatonic & Blues': [
    { mode: 'Minor Pentatonic', base: 'Major Pentatonic', change: 'minor tonality (b3, b7)', type: 'lowered' },
    { mode: 'Blues', base: 'Minor Pentatonic', change: 'added b5 (blue note)', type: 'lowered' },
  ],
  'Other Scales': [
    { mode: 'Diminished (WH)', base: 'Diminished (HW)', change: 'starts whole step', type: 'raised' },
  ],
};

const ModeReference = ({ rootNote = 'C' }: ModeReferenceProps) => {
  const [selectedRoot, setSelectedRoot] = useState(rootNote);
  const [showType, setShowType] = useState<'notes' | 'intervals'>('notes');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Major Modes']));

  const roots = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];

  const toggleCategory = (label: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  };

  const getNoteStyle = (note: string, isRoot: boolean) => {
    if (isRoot) return "bg-amber-500 text-black";
    if (isSharp(note)) return "bg-blue-600 text-white";
    if (isFlat(note)) return "bg-orange-500 text-white";
    return "bg-stone-500 text-white";
  };

  const getIntervalStyle = (interval: string) => {
    if (interval === '1') return "bg-amber-500 text-black";
    if (interval.startsWith('#')) return "bg-blue-600 text-white";
    if (interval.startsWith('b')) return "bg-orange-500 text-white";
    return "bg-stone-500 text-white";
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h3 className="text-lg font-semibold">Mode Reference</h3>
        <select
          value={selectedRoot}
          onChange={(e) => setSelectedRoot(e.target.value)}
          className="bg-secondary border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {roots.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <button
          onClick={() => setShowType(showType === 'notes' ? 'intervals' : 'notes')}
          className="text-xs px-3 py-1.5 rounded border border-border hover:bg-accent transition-colors text-muted-foreground"
        >
          {showType === 'notes' ? '♪ Notes' : '# Intervals'}
        </button>
      </div>

      {MODE_CATEGORIES.map((cat) => {
        const isExpanded = expandedCategories.has(cat.label);
        const comparisons = CATEGORY_COMPARISONS[cat.label];
        return (
          <div key={cat.label} className="mb-4">
            <button
              onClick={() => toggleCategory(cat.label)}
              className="w-full flex items-center justify-between py-2 px-3 rounded bg-secondary/50 hover:bg-secondary transition-colors text-sm font-semibold text-foreground"
            >
              <span>{cat.label}</span>
              <span className="text-muted-foreground text-xs">{isExpanded ? '▲' : '▼'} {cat.modes.length} modes</span>
            </button>

            {isExpanded && (
              <div className="mt-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 text-muted-foreground font-medium whitespace-nowrap">Mode</th>
                        <th className="text-left py-2 pr-2 text-muted-foreground font-medium">Formula / Notes</th>
                        <th className="text-left py-2 text-muted-foreground font-medium whitespace-nowrap">Character</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cat.modes.map((modeName) => {
                        const notes = getScaleNotes(selectedRoot, modeName);
                        const intervals = MODE_INTERVAL_NAMES[modeName] || [];
                        const displayNotes = [...notes, notes[0]];
                        const displayIntervals = [...intervals, '1'];

                        return (
                          <tr key={modeName} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                            <td className="py-3 pr-4 font-semibold whitespace-nowrap text-xs md:text-sm">{modeName}</td>
                            <td className="py-3 pr-2">
                              <div className="flex flex-wrap gap-1">
                                {showType === 'notes'
                                  ? displayNotes.map((note, i) => (
                                      <span
                                        key={i}
                                        className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-bold ${getNoteStyle(note, i === 0 || i === displayNotes.length - 1)}`}
                                      >
                                        {note}
                                      </span>
                                    ))
                                  : displayIntervals.map((interval, i) => (
                                      <span
                                        key={i}
                                        className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-bold ${getIntervalStyle(interval)}`}
                                      >
                                        {interval}
                                      </span>
                                    ))}
                              </div>
                            </td>
                            <td className="py-3 text-xs text-muted-foreground whitespace-nowrap">{MODE_DESCRIPTIONS[modeName] || ''}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Quick comparison inside each dropdown */}
                {comparisons && comparisons.length > 0 && (
                  <div className="mt-3 p-3 rounded bg-secondary/50 border border-border">
                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">Quick Comparison</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs">
                      {comparisons.map((c) => (
                        <div key={c.mode}>
                          <span className="font-bold">{c.mode}</span> = {c.base} +{' '}
                          <span className={c.type === 'raised' ? 'text-blue-400' : 'text-orange-400'}>
                            {c.change}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ModeReference;
