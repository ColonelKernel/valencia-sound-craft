import { useState } from "react";
import { Guitar, Music, ToggleLeft, ToggleRight } from "lucide-react";
import { useFadeIn } from "@/hooks/useFadeIn";
import {
  ALL_ROOTS,
  MODE_CATEGORIES,
  getScaleNotes,
  isSharp,
  isFlat,
  MODE_INTERVAL_NAMES,
  MODE_CHORDS,
  TUNING_PRESETS,
  getChordSpellings,
  type ChordSpelling,
} from "./scaleData";
import Fretboard from "./Fretboard";
import SheetMusic from "./SheetMusic";
import ModeReference from "./ModeReference";

const ModeVisualizer = () => {
  const ref = useFadeIn();
  const [root, setRoot] = useState("C");
  const [mode, setMode] = useState("Ionian");
  const [lefty, setLefty] = useState(false);
  const [showIntervals, setShowIntervals] = useState(false);
  const [showFingers, setShowFingers] = useState(false);
  const [tuningIdx, setTuningIdx] = useState(0);
  const [hoveredNote, setHoveredNote] = useState<string | null>(null);
  const [hoveredChord, setHoveredChord] = useState<ChordSpelling | null>(null);
  const [chordDisplay, setChordDisplay] = useState<'notes' | 'intervals'>('notes');

  const scaleNotes = getScaleNotes(root, mode);
  const intervals = MODE_INTERVAL_NAMES[mode] || [];
  const chordSpellings = getChordSpellings(scaleNotes, mode);
  const tuning = TUNING_PRESETS[tuningIdx];

  const getNoteStyle = (note: string, isRoot: boolean) => {
    if (isRoot) return "bg-amber-500 text-black border-yellow-300 border-2";
    if (isSharp(note)) return "bg-blue-600 text-white border-blue-500";
    if (isFlat(note)) return "bg-orange-500 text-white border-orange-400";
    return "bg-stone-500 text-white border-stone-400";
  };

  const tuningLabel = (notes: { note: string }[]) =>
    notes.map((s) => s.note).join(" ");

  return (
    <section id="mode-visualizer" className="section-padding bg-secondary/50" ref={ref}>
      <div className="container mx-auto">
        <div className="fade-up mb-10">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">
            Interactive Tool
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Musical Mode Visualizer
          </h2>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Explore modes across every key — major, melodic minor, harmonic minor, pentatonic, and more.
          </p>
        </div>

        {/* Control Panel */}
        <div className="fade-up flex flex-wrap items-center gap-3 mb-8 p-4 rounded-lg border border-border bg-card">
          {/* Root */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">Root</label>
            <select
              value={root}
              onChange={(e) => setRoot(e.target.value)}
              className="bg-secondary border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {ALL_ROOTS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Mode — grouped */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="bg-secondary border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {MODE_CATEGORIES.map((cat) => (
                <optgroup key={cat.label} label={cat.label}>
                  {cat.modes.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Tuning */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">Tuning</label>
            <select
              value={tuningIdx}
              onChange={(e) => setTuningIdx(Number(e.target.value))}
              className="bg-secondary border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {TUNING_PRESETS.map((t, i) => (
                <option key={t.label} value={i}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Toggles */}
          <button
            onClick={() => setLefty(!lefty)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border border-border hover:bg-accent transition-colors"
          >
            {lefty ? <ToggleRight className="w-4 h-4 text-amber-400" /> : <ToggleLeft className="w-4 h-4" />}
            Lefty
          </button>

          <button
            onClick={() => { setShowIntervals(!showIntervals); if (!showIntervals) setShowFingers(false); }}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border border-border hover:bg-accent transition-colors"
          >
            {showIntervals ? <ToggleRight className="w-4 h-4 text-blue-400" /> : <ToggleLeft className="w-4 h-4" />}
            Intervals
          </button>

          <button
            onClick={() => { setShowFingers(!showFingers); if (!showFingers) setShowIntervals(false); }}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border border-border hover:bg-accent transition-colors"
          >
            {showFingers ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4" />}
            Fingers
          </button>
        </div>

        {/* Scale Display */}
        <div className="fade-up mb-8">
          <h3 className="text-lg font-semibold mb-3">
            {root} {mode}
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {scaleNotes.map((note, i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all ${getNoteStyle(note, note === root)} ${
                  hoveredNote === note ? "scale-125 ring-2 ring-white" : "hover:scale-110"
                }`}
                onMouseEnter={() => setHoveredNote(note)}
                onMouseLeave={() => setHoveredNote(null)}
              >
                {showIntervals ? intervals[i] : note}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-yellow-300 inline-block" /> Root
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-stone-500 inline-block" /> Natural
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Sharp
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> Flat
            </span>
          </div>

          {/* Chords */}
          {chordSpellings.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Associated Chords</p>
                <button
                  onClick={() => setChordDisplay(chordDisplay === 'notes' ? 'intervals' : 'notes')}
                  className="text-[10px] px-2 py-0.5 rounded border border-border hover:bg-accent transition-colors text-muted-foreground"
                >
                  Show: {chordDisplay === 'notes' ? 'Notes' : 'Intervals'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {chordSpellings.map((cs, i) => (
                  <div
                    key={i}
                    className="relative group"
                    onMouseEnter={() => setHoveredChord(cs)}
                    onMouseLeave={() => setHoveredChord(null)}
                  >
                    <div className={`px-3 py-1.5 text-xs font-mono rounded border transition-all cursor-pointer ${
                      hoveredChord?.symbol === cs.symbol
                        ? 'border-amber-500 bg-amber-500/10 text-foreground'
                        : 'border-border bg-card text-foreground hover:border-muted-foreground'
                    }`}>
                      <div className="font-bold">{cs.symbol}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {chordDisplay === 'notes'
                          ? cs.notes.join(' – ')
                          : cs.intervals.join(' – ')}
                      </div>
                    </div>

                    {/* Hover tooltip with full spelling */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                      <div className="bg-stone-900 border border-stone-600 rounded-lg px-3 py-2 shadow-xl min-w-[140px] text-center">
                        <p className="text-xs font-bold text-foreground mb-1">{cs.name}</p>
                        <div className="flex justify-center gap-1.5 mb-1">
                          {cs.notes.map((n, ni) => {
                            const noteStyle = n === cs.rootNote
                              ? 'bg-amber-500 text-black border-yellow-300'
                              : isSharp(n) ? 'bg-blue-600 text-white' : isFlat(n) ? 'bg-orange-500 text-white' : 'bg-stone-500 text-white';
                            return (
                              <span key={ni} className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border ${noteStyle}`}>
                                {n}
                              </span>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {cs.intervals.join(' – ')}
                        </p>
                      </div>
                      <div className="w-2 h-2 bg-stone-900 border-r border-b border-stone-600 rotate-45 mx-auto -mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sheet Music */}
        <div className="fade-up mb-8">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Music className="w-5 h-5" /> Staff Notation
          </h3>
          <SheetMusic scaleNotes={scaleNotes} hoveredNote={hoveredNote} />
        </div>

        {/* Guitar Fretboard */}
        <div className="fade-up mb-8">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Guitar className="w-5 h-5" /> Guitar ({tuningLabel(tuning.guitar)})
          </h3>
          <Fretboard
            scaleNotes={scaleNotes}
            root={root}
            mode={mode}
            tuning={tuning.guitar}
            label="Guitar"
            lefty={lefty}
            showIntervals={showIntervals}
            showFingers={showFingers}
            hoveredNote={hoveredNote}
            onNoteHover={setHoveredNote}
          />
        </div>

        {/* Bass Fretboard */}
        <div className="fade-up">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Guitar className="w-5 h-5" /> Bass ({tuningLabel(tuning.bass)})
          </h3>
          <Fretboard
            scaleNotes={scaleNotes}
            root={root}
            mode={mode}
            tuning={tuning.bass}
            label="Bass"
            lefty={lefty}
            showIntervals={showIntervals}
            showFingers={showFingers}
            hoveredNote={hoveredNote}
            onNoteHover={setHoveredNote}
          />
        </div>

        {/* Mode Reference Table */}
        <div className="fade-up mt-10">
          <ModeReference rootNote={root} />
        </div>
      </div>
    </section>
  );
};

export default ModeVisualizer;
