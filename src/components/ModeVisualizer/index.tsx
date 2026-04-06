import { useState } from "react";
import { Guitar, Music, ToggleLeft, ToggleRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFadeIn } from "@/hooks/useFadeIn";
import {
  ALL_ROOTS,
  MODE_NAMES,
  getScaleNotes,
  isSharp,
  isFlat,
  MODE_INTERVAL_NAMES,
} from "./scaleData";
import Fretboard from "./Fretboard";
import SheetMusic from "./SheetMusic";

const ModeVisualizer = () => {
  const ref = useFadeIn();
  const [root, setRoot] = useState("C");
  const [mode, setMode] = useState("Ionian");
  const [lefty, setLefty] = useState(false);
  const [showIntervals, setShowIntervals] = useState(false);
  const [hoveredNote, setHoveredNote] = useState<string | null>(null);

  const scaleNotes = getScaleNotes(root, mode);
  const intervals = MODE_INTERVAL_NAMES[mode] || [];

  const getNoteStyle = (note: string, isRoot: boolean) => {
    if (isRoot) return "bg-amber-500 text-black border-yellow-300 border-2";
    if (isSharp(note)) return "bg-blue-600 text-white border-blue-500";
    if (isFlat(note)) return "bg-orange-500 text-white border-orange-400";
    return "bg-stone-500 text-white border-stone-400";
  };

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
            Explore all 7 modes across every key. See scales on guitar &amp; bass fretboards with color-coded notes.
          </p>
        </div>

        {/* Control Panel */}
        <div className="fade-up flex flex-wrap items-center gap-4 mb-8 p-4 rounded-lg border border-border bg-card">
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

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="bg-secondary border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {MODE_NAMES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setLefty(!lefty)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border border-border hover:bg-accent transition-colors"
          >
            {lefty ? <ToggleRight className="w-4 h-4 text-amber-400" /> : <ToggleLeft className="w-4 h-4" />}
            Lefty
          </button>

          <button
            onClick={() => setShowIntervals(!showIntervals)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border border-border hover:bg-accent transition-colors"
          >
            {showIntervals ? <ToggleRight className="w-4 h-4 text-blue-400" /> : <ToggleLeft className="w-4 h-4" />}
            Intervals
          </button>
        </div>

        {/* Scale Display */}
        <div className="fade-up mb-8">
          <h3 className="text-lg font-semibold mb-3">
            {root} {mode} Scale
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
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
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
            <Guitar className="w-5 h-5" /> Guitar (EADGBE)
          </h3>
          <Fretboard
            scaleNotes={scaleNotes}
            root={root}
            mode={mode}
            type="guitar"
            lefty={lefty}
            showIntervals={showIntervals}
            hoveredNote={hoveredNote}
            onNoteHover={setHoveredNote}
          />
        </div>

        {/* Bass Fretboard */}
        <div className="fade-up">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Guitar className="w-5 h-5" /> Bass (EADG)
          </h3>
          <Fretboard
            scaleNotes={scaleNotes}
            root={root}
            mode={mode}
            type="bass"
            lefty={lefty}
            showIntervals={showIntervals}
            hoveredNote={hoveredNote}
            onNoteHover={setHoveredNote}
          />
        </div>
      </div>
    </section>
  );
};

export default ModeVisualizer;
