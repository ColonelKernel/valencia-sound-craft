import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { getScaleNotes, isSharp, isFlat, MODE_CATEGORIES, MODE_INTERVAL_NAMES } from "./scaleData";

const KEYS_BY_SIGNATURE = [
  { key: 'C',  sig: '—' },
  { key: 'G',  sig: '1♯' },
  { key: 'D',  sig: '2♯' },
  { key: 'A',  sig: '3♯' },
  { key: 'E',  sig: '4♯' },
  { key: 'B',  sig: '5♯' },
  { key: 'F#', sig: '6♯' },
  { key: 'F',  sig: '1♭' },
  { key: 'Bb', sig: '2♭' },
  { key: 'Eb', sig: '3♭' },
  { key: 'Ab', sig: '4♭' },
  { key: 'Db', sig: '5♭' },
  { key: 'Gb', sig: '6♭' },
];

const getNoteClass = (note: string, isRoot: boolean) => {
  if (isRoot) return "bg-amber-500 text-black font-bold";
  if (isSharp(note)) return "bg-blue-600/80 text-white";
  if (isFlat(note)) return "bg-orange-500/80 text-white";
  return "bg-stone-500/80 text-white";
};

const ScaleRow = ({
  keyName,
  sig,
  notes,
  intervals,
  showType,
}: {
  keyName: string;
  sig: string;
  notes: string[];
  intervals: string[];
  showType: 'notes' | 'intervals';
}) => (
  <div className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-accent/20 transition-colors">
    <span className="w-8 font-bold text-sm shrink-0">{keyName}</span>
    <span className="w-8 text-[10px] text-muted-foreground shrink-0">{sig}</span>
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
  </div>
);

const CollapsibleSection = ({
  title,
  defaultOpen = false,
  children,
  badge,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border/40 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-accent/10 transition-colors"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="text-sm font-semibold">{title}</span>
        {badge && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground ml-auto">
            {badge}
          </span>
        )}
      </button>
      {open && <div className="px-2 pb-3">{children}</div>}
    </div>
  );
};

const MasterScaleReference = () => {
  const [selectedCategory, setSelectedCategory] = useState(MODE_CATEGORIES[0].label);
  const [selectedMode, setSelectedMode] = useState("Ionian");
  const [showType, setShowType] = useState<'notes' | 'intervals'>('notes');
  const [keyFilter, setKeyFilter] = useState("");

  const currentModes = useMemo(() => {
    return MODE_CATEGORIES.find(c => c.label === selectedCategory)?.modes || [];
  }, [selectedCategory]);

  const filteredKeys = useMemo(() => {
    if (!keyFilter.trim()) return KEYS_BY_SIGNATURE;
    const q = keyFilter.trim().toLowerCase();
    return KEYS_BY_SIGNATURE.filter(k => k.key.toLowerCase().includes(q));
  }, [keyFilter]);

  return (
    <div className="rounded-lg border border-border bg-card p-4 md:p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Master Scale Reference</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Browse modes across every key. Expand sections to explore.
        </p>
      </div>

      {/* Compact controls */}
      <div className="flex flex-wrap items-center gap-2">
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

        <select
          value={selectedMode}
          onChange={(e) => setSelectedMode(e.target.value)}
          className="bg-secondary border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {currentModes.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <button
          onClick={() => setShowType(showType === 'notes' ? 'intervals' : 'notes')}
          className="text-xs px-3 py-1.5 rounded border border-border hover:bg-accent transition-colors text-muted-foreground"
        >
          {showType === 'notes' ? '♪ Notes' : '# Intervals'}
        </button>

        <div className="relative ml-auto">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter key…"
            value={keyFilter}
            onChange={(e) => setKeyFilter(e.target.value)}
            className="bg-secondary border border-border rounded pl-7 pr-3 py-1.5 text-sm text-foreground w-28 focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Selected mode — all keys (open by default) */}
      <CollapsibleSection
        title={`${selectedMode} — All Keys`}
        defaultOpen={true}
        badge={`${filteredKeys.length} keys`}
      >
        <div className="divide-y divide-border/20">
          {filteredKeys.map(({ key, sig }) => {
            const notes = getScaleNotes(key, selectedMode);
            const intervals = MODE_INTERVAL_NAMES[selectedMode] || [];
            return (
              <ScaleRow
                key={key}
                keyName={key}
                sig={sig}
                notes={notes}
                intervals={intervals}
                showType={showType}
              />
            );
          })}
        </div>
      </CollapsibleSection>

      {/* Other modes in the category — collapsed by default */}
      {currentModes
        .filter(m => m !== selectedMode)
        .map(modeName => (
          <CollapsibleSection
            key={modeName}
            title={`${modeName} — All Keys`}
            badge={`${filteredKeys.length} keys`}
          >
            <div className="divide-y divide-border/20">
              {filteredKeys.map(({ key, sig }) => {
                const notes = getScaleNotes(key, modeName);
                const intervals = MODE_INTERVAL_NAMES[modeName] || [];
                return (
                  <ScaleRow
                    key={key}
                    keyName={key}
                    sig={sig}
                    notes={notes}
                    intervals={intervals}
                    showType={showType}
                  />
                );
              })}
            </div>
          </CollapsibleSection>
        ))}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground pt-2">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500" /> Root</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-stone-500" /> Natural</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-600" /> Sharp</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500" /> Flat</span>
      </div>
    </div>
  );
};

export default MasterScaleReference;
