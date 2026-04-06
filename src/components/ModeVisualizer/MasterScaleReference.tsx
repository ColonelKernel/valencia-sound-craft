import { useState, useMemo } from "react";
import { getScaleNotes, isSharp, isFlat, MODE_CATEGORIES, MODE_INTERVAL_NAMES } from "./scaleData";

// All keys ordered by circle of fifths
const KEYS_BY_SIGNATURE = [
  { key: 'Gb', sig: '6♭' },
  { key: 'Db', sig: '5♭' },
  { key: 'Ab', sig: '4♭' },
  { key: 'Eb', sig: '3♭' },
  { key: 'Bb', sig: '2♭' },
  { key: 'F',  sig: '1♭' },
  { key: 'C',  sig: '—' },
  { key: 'G',  sig: '1♯' },
  { key: 'D',  sig: '2♯' },
  { key: 'A',  sig: '3♯' },
  { key: 'E',  sig: '4♯' },
  { key: 'B',  sig: '5♯' },
  { key: 'F#', sig: '6♯' },
];

const getNoteClass = (note: string, isRoot: boolean) => {
  if (isRoot) return "bg-amber-500 text-black font-bold";
  if (isSharp(note)) return "bg-blue-600/80 text-white";
  if (isFlat(note)) return "bg-orange-500/80 text-white";
  return "bg-stone-500/80 text-white";
};

const MasterScaleReference = () => {
  const [selectedMode, setSelectedMode] = useState("Ionian");
  const [showType, setShowType] = useState<'notes' | 'intervals'>('notes');
  const [selectedCategory, setSelectedCategory] = useState(MODE_CATEGORIES[0].label);

  const currentModes = useMemo(() => {
    return MODE_CATEGORIES.find(c => c.label === selectedCategory)?.modes || [];
  }, [selectedCategory]);

  // Build the data grid: keys × current mode
  const gridData = useMemo(() => {
    return KEYS_BY_SIGNATURE.map(({ key, sig }) => {
      const notes = getScaleNotes(key, selectedMode);
      const intervals = MODE_INTERVAL_NAMES[selectedMode] || [];
      return { key, sig, notes, intervals };
    });
  }, [selectedMode]);

  // Build the all-modes-for-all-keys grid
  const allModesData = useMemo(() => {
    return currentModes.map(modeName => ({
      mode: modeName,
      keys: KEYS_BY_SIGNATURE.map(({ key, sig }) => ({
        key,
        sig,
        notes: getScaleNotes(key, modeName),
        intervals: MODE_INTERVAL_NAMES[modeName] || [],
      })),
    }));
  }, [currentModes]);

  return (
    <div className="rounded-lg border border-border bg-card p-4 md:p-6">
      <h3 className="text-lg font-semibold mb-2">Master Scale Reference</h3>
      <p className="text-xs text-muted-foreground mb-5">
        Every mode in every key — organized by the circle of fifths.
      </p>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-5">
        {/* Category selector */}
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            const cat = MODE_CATEGORIES.find(c => c.label === e.target.value);
            if (cat && cat.modes.length > 0) setSelectedMode(cat.modes[0]);
          }}
          className="bg-secondary border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {MODE_CATEGORIES.map(cat => (
            <option key={cat.label} value={cat.label}>{cat.label}</option>
          ))}
        </select>

        {/* Mode selector */}
        <select
          value={selectedMode}
          onChange={(e) => setSelectedMode(e.target.value)}
          className="bg-secondary border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {currentModes.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* Toggle notes/intervals */}
        <button
          onClick={() => setShowType(showType === 'notes' ? 'intervals' : 'notes')}
          className="text-xs px-3 py-1.5 rounded border border-border hover:bg-accent transition-colors text-muted-foreground"
        >
          {showType === 'notes' ? '♪ Notes' : '# Intervals'}
        </button>
      </div>

      {/* Single Mode × All Keys Table */}
      <div className="mb-8">
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">
          {selectedMode} — All Keys
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-2 text-muted-foreground font-medium text-xs w-12">Key</th>
                <th className="text-left py-2 pr-2 text-muted-foreground font-medium text-xs w-10">Sig</th>
                <th className="text-left py-2 text-muted-foreground font-medium text-xs">
                  {showType === 'notes' ? 'Scale Notes' : 'Intervals'}
                </th>
              </tr>
            </thead>
            <tbody>
              {gridData.map(({ key, sig, notes, intervals }) => (
                <tr key={key} className="border-b border-border/30 hover:bg-accent/20 transition-colors">
                  <td className="py-2 pr-2 font-bold text-sm whitespace-nowrap">{key}</td>
                  <td className="py-2 pr-2 text-xs text-muted-foreground whitespace-nowrap">{sig}</td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-1">
                      {showType === 'notes'
                        ? [...notes, notes[0]].map((note, i) => (
                            <span
                              key={i}
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold ${getNoteClass(note, i === 0 || i === notes.length)}`}
                            >
                              {note}
                            </span>
                          ))
                        : [...intervals, '1'].map((interval, i) => (
                            <span
                              key={i}
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                interval === '1' ? 'bg-amber-500 text-black' :
                                interval.startsWith('#') ? 'bg-blue-600/80 text-white' :
                                interval.startsWith('b') ? 'bg-orange-500/80 text-white' :
                                'bg-stone-500/80 text-white'
                              }`}
                            >
                              {interval}
                            </span>
                          ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Modes in Category × All Keys */}
      <div>
        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-widest">
          All {selectedCategory} — Every Key
        </p>
        <div className="space-y-6">
          {allModesData.map(({ mode, keys }) => (
            <div key={mode}>
              <p className="text-sm font-semibold mb-2 text-foreground">{mode}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <tbody>
                    {keys.map(({ key, sig, notes, intervals: ints }) => (
                      <tr key={key} className="border-b border-border/20 hover:bg-accent/10 transition-colors">
                        <td className="py-1.5 pr-2 font-bold text-xs whitespace-nowrap w-10">{key}</td>
                        <td className="py-1.5 pr-2 text-[10px] text-muted-foreground whitespace-nowrap w-8">{sig}</td>
                        <td className="py-1.5">
                          <div className="flex flex-wrap gap-0.5">
                            {showType === 'notes'
                              ? [...notes, notes[0]].map((note, i) => (
                                  <span
                                    key={i}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold ${getNoteClass(note, i === 0 || i === notes.length)}`}
                                  >
                                    {note}
                                  </span>
                                ))
                              : [...ints, '1'].map((interval, i) => (
                                  <span
                                    key={i}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold ${
                                      interval === '1' ? 'bg-amber-500 text-black' :
                                      interval.startsWith('#') ? 'bg-blue-600/80 text-white' :
                                      interval.startsWith('b') ? 'bg-orange-500/80 text-white' :
                                      'bg-stone-500/80 text-white'
                                    }`}
                                  >
                                    {interval}
                                  </span>
                                ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500" /> Root</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-stone-500" /> Natural</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-600" /> Sharp</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500" /> Flat</span>
      </div>
    </div>
  );
};

export default MasterScaleReference;
