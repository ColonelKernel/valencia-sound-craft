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
              <div className="overflow-x-auto mt-2">
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
            )}
          </div>
        );
      })}

      {/* Quick comparison */}
      <div className="mt-4 p-3 rounded bg-secondary/50 border border-border">
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">Quick Comparison — what makes each mode unique</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs">
          <div><span className="font-bold">Dorian</span> = Aeolian + <span className="text-blue-400">raised 6th</span></div>
          <div><span className="font-bold">Phrygian</span> = Aeolian + <span className="text-orange-400">lowered 2nd</span></div>
          <div><span className="font-bold">Lydian</span> = Ionian + <span className="text-blue-400">raised 4th</span></div>
          <div><span className="font-bold">Mixolydian</span> = Ionian + <span className="text-orange-400">lowered 7th</span></div>
          <div><span className="font-bold">Locrian</span> = Aeolian + <span className="text-orange-400">lowered 2nd & 5th</span></div>
          <div><span className="font-bold">Melodic Minor</span> = Aeolian + <span className="text-blue-400">raised 6th & 7th</span></div>
          <div><span className="font-bold">Harmonic Minor</span> = Aeolian + <span className="text-blue-400">raised 7th</span></div>
          <div><span className="font-bold">Phrygian Dominant</span> = Phrygian + <span className="text-blue-400">raised 3rd</span></div>
        </div>
      </div>
    </div>
  );
};

export default ModeReference;
