import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Guitar, Music, Volume2, ToggleLeft, ToggleRight, Settings2, Timer, ListMusic, Piano, BookOpen, Drum, Globe, ChevronDown, ChevronUp } from "lucide-react";
import { useFadeIn } from "@/hooks/useFadeIn";
import {
  ALL_ROOTS,
  MODE_CATEGORIES,
  getScaleNotes,
  isSharp,
  isFlat,
  MODE_INTERVAL_NAMES,
  TUNING_PRESETS,
  getChordSpellings,
  FRETTED_INSTRUMENTS,
  type ChordSpelling,
  type StringTuning,
  type TuningPreset,
} from "./scaleData";
import type { ProgressionChord } from "./chordProgressionUtils";
import { playNote, playChord, playScale, playNoteAtOctave, type InstrumentTimbre, INSTRUMENT_TIMBRES } from "./audioSynth";

const Fretboard = lazy(() => import("./Fretboard"));
const SheetMusic = lazy(() => import("./SheetMusic"));
const Metronome = lazy(() => import("./Metronome"));
const ChordProgressionBuilder = lazy(() => import("./ChordProgressionBuilder"));
const KeyboardVisualizer = lazy(() => import("./KeyboardVisualizer"));
const MasterScaleReference = lazy(() => import("./MasterScaleReference"));
const DrumMachine = lazy(() => import("../DrumMachine"));
const Tonnetz = lazy(() => import("./Tonnetz"));
const CircleOfFifths = lazy(() => import("./CircleOfFifths"));
const GlobalRhythmEngine = lazy(() => import("../Blipblox/GlobalRhythmEngine"));

export type ModeVisualizerTab =
  | "visualizer"
  | "metronome"
  | "progression"
  | "reference"
  | "polyrhythm"
  | "rhythmmap"
  | "tonnetz"
  | "circleof5";

interface ModeVisualizerProps {
  root?: string;
  mode?: string;
  tempo?: number;
  playing?: boolean;
  chordProgression?: ProgressionChord[];
  embeddedPreset?: never;
  onRootChange?: (root: string) => void;
  onModeChange?: (mode: string) => void;
  onTempoChange?: (tempo: number) => void;
  onPlayingChange?: (playing: boolean) => void;
  onChordProgressionChange?: (progression: ProgressionChord[]) => void;
  initialTab?: ModeVisualizerTab;
  showOnlyTabs?: ModeVisualizerTab[];
  defaultExpanded?: boolean;
  hideToolSelector?: boolean;
  hideShellHeading?: boolean;
  disableToolPreload?: boolean;
}

const TOOL_OPTIONS: Array<{ value: ModeVisualizerTab; label: string }> = [
  { value: "rhythmmap", label: "Rhythm Atlas Engine" },
  { value: "polyrhythm", label: "Rhythm Engine" },
  { value: "visualizer", label: "Mode Visualizer" },
  { value: "progression", label: "Chord Progressions" },
  { value: "metronome", label: "Metronome" },
  { value: "reference", label: "Scale Reference" },
  { value: "tonnetz", label: "Tonnetz" },
  { value: "circleof5", label: "Circle of Fifths" },
];

const ModeVisualizer = ({
  root: controlledRoot,
  mode: controlledMode,
  tempo,
  playing,
  chordProgression,
  onRootChange,
  onModeChange,
  onTempoChange,
  onPlayingChange,
  onChordProgressionChange,
  initialTab,
  showOnlyTabs,
  defaultExpanded = true,
  hideToolSelector = false,
  hideShellHeading = false,
  disableToolPreload = false,
}: ModeVisualizerProps) => {
  const ref = useFadeIn();
  const [root, setRoot] = useState(controlledRoot ?? "C");
  const [mode, setMode] = useState(controlledMode ?? "Ionian");
  const [lefty, setLefty] = useState(false);
  const [showIntervals, setShowIntervals] = useState(false);
  const [showFingers, setShowFingers] = useState(false);
  const [tuningIdx, setTuningIdx] = useState(0);
  const [isCustomTuning, setIsCustomTuning] = useState(false);
  const [customGuitar, setCustomGuitar] = useState<StringTuning[]>(TUNING_PRESETS[0].guitar);
  const [customBass, setCustomBass] = useState<StringTuning[]>(TUNING_PRESETS[0].bass);
  const [hoveredNote, setHoveredNote] = useState<string | null>(null);
  const [hoveredChord, setHoveredChord] = useState<ChordSpelling | null>(null);
  const [selectedChord, setSelectedChord] = useState<ChordSpelling | null>(null);
  const [chordDisplay, setChordDisplay] = useState<'notes' | 'intervals'>('notes');
  const initialActiveTab = initialTab || showOnlyTabs?.[0] || "rhythmmap";
  const [activeTab, setActiveTab] = useState<ModeVisualizerTab>(initialActiveTab);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [instrument, setInstrument] = useState<'guitar' | 'bass' | 'keyboard' | 'other'>('guitar');
  const [guitarStrings, setGuitarStrings] = useState<6 | 7 | 8>(6);
  const [bassStrings, setBassStrings] = useState<4 | 5 | 6>(4);
  const [otherInstrument, setOtherInstrument] = useState(FRETTED_INSTRUMENTS[0].key);
  const [timbre, setTimbre] = useState<InstrumentTimbre>('piano');
  const availableTabs = useMemo(
    () => TOOL_OPTIONS.filter((tool) => !showOnlyTabs || showOnlyTabs.includes(tool.value)),
    [showOnlyTabs],
  );

  const scaleNotes = getScaleNotes(root, mode);
  const intervals = MODE_INTERVAL_NAMES[mode] || [];
  const chordSpellings = getChordSpellings(scaleNotes, mode);
  const tuning: TuningPreset = isCustomTuning
    ? { label: 'Custom', guitar: customGuitar, guitar7: customGuitar, guitar8: customGuitar, bass: customBass, bass5: customBass, bass6: customBass }
    : TUNING_PRESETS[tuningIdx];

  const activeGuitarTuning = guitarStrings === 7 ? tuning.guitar7 : guitarStrings === 8 ? tuning.guitar8 : tuning.guitar;
  const activeBassTuning = bassStrings === 5 ? tuning.bass5 : bassStrings === 6 ? tuning.bass6 : tuning.bass;

  // Active chord filter for fretboard
  const chordFilter = selectedChord ? selectedChord.notes : null;

  const getNoteStyle = (note: string, isRoot: boolean) => {
    if (isRoot) return "bg-amber-500 text-black border-yellow-300 border-2";
    if (isSharp(note)) return "bg-blue-600 text-white border-blue-500";
    if (isFlat(note)) return "bg-orange-500 text-white border-orange-400";
    return "bg-stone-500 text-white border-stone-400";
  };

  const tuningLabel = (notes: { note: string }[]) =>
    notes.map((s) => s.note).join(" ");

  const handleChordClick = (cs: ChordSpelling) => {
    if (selectedChord?.symbol === cs.symbol) {
      setSelectedChord(null);
    } else {
      setSelectedChord(cs);
      playChord(cs.notes, 0.8, timbre);
    }
  };

  const handleNoteClick = (note: string, octave?: number) => {
    if (octave !== undefined) {
      playNoteAtOctave(note, octave, 0.4, timbre);
    } else {
      playNote(note, 0, 0.4, timbre);
    }
  };

  const handlePlayScale = () => {
    playScale([...scaleNotes, scaleNotes[0]], 200, timbre);
  };

  // Clear selected chord when mode/root changes
  const handleRootChange = (r: string) => {
    setRoot(r);
    setSelectedChord(null);
    onRootChange?.(r);
  };
  const handleModeChange = (m: string) => {
    setMode(m);
    setSelectedChord(null);
    onModeChange?.(m);
  };
  const toolFallback = <div className="rounded-2xl border border-border/70 bg-card/60 p-4 text-sm text-muted-foreground">Loading system…</div>;

  useEffect(() => {
    if (!disableToolPreload) {
      void import("../Blipblox/GlobalRhythmEngine");
    }
  }, [disableToolPreload]);

  useEffect(() => {
    if (controlledRoot && controlledRoot !== root) {
      setRoot(controlledRoot);
      setSelectedChord(null);
    }
  }, [controlledRoot, root]);

  useEffect(() => {
    if (controlledMode && controlledMode !== mode) {
      setMode(controlledMode);
      setSelectedChord(null);
    }
  }, [controlledMode, mode]);

  useEffect(() => {
    if (!availableTabs.some((tool) => tool.value === activeTab)) {
      setActiveTab(availableTabs[0]?.value || "visualizer");
    }
  }, [activeTab, availableTabs]);

  return (
    <section id="mode-visualizer" className="section-padding !pb-8 bg-secondary/50 scroll-mt-24" ref={ref}>
      <div className="container mx-auto">
        {!hideShellHeading && (
          <button
            onClick={() => setExpanded(prev => !prev)}
            className="fade-up mb-6 w-full flex items-center justify-between gap-6 rounded-[1.75rem] border border-border/70 bg-card/75 px-5 py-5 text-left shadow-[0_18px_50px_-34px_rgba(0,0,0,0.75)] backdrop-blur-sm group sm:px-6"
          >
            <div className="text-left">
              <p className="text-xs tracking-[0.32em] uppercase text-muted-foreground mb-3">
                Systems
              </p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Interactive Systems
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-2xl">
                Start with the rhythm engine, then move into harmony, practice, and production tools without leaving the page.
              </p>
            </div>
            <div className="shrink-0 ml-4 flex h-11 w-11 items-center justify-center rounded-full border border-border text-muted-foreground group-hover:bg-accent">
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>
        )}

        {expanded && (
          <>
            {/* Tool Selector Dropdown */}
            <div className="mb-6 rounded-[1.5rem] border border-border/70 bg-card/70 p-4 shadow-[0_18px_45px_-36px_rgba(0,0,0,0.75)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <label className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground mb-2 block">
                    Start Here
                  </label>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    The rhythm engine opens first so you can hear and shape the system immediately.
                  </p>
                </div>
                {activeTab === "rhythmmap" && (
                  <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-foreground">
                    Featured System
                  </span>
                )}
              </div>

              {hideToolSelector ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {availableTabs.map((tool) => (
                    <button
                      key={tool.value}
                      type="button"
                      onClick={() => setActiveTab(tool.value)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === tool.value
                          ? "border-primary/30 bg-primary/10 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      {tool.label}
                    </button>
                  ))}
                </div>
              ) : (
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as ModeVisualizerTab)}
                  className="mt-4 w-full sm:w-auto min-w-[260px] bg-background border border-border rounded-2xl px-4 py-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {availableTabs.map((tool) => (
                    <option key={tool.value} value={tool.value}>
                      {tool.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {availableTabs.some((tool) => tool.value === 'tonnetz') && activeTab === 'tonnetz' && (
              <Suspense fallback={toolFallback}>
                <div>
                  <Tonnetz
                    scaleNotes={scaleNotes}
                    root={root}
                    timbre={timbre}
                    tempo={tempo}
                    playing={playing}
                    onTempoChange={onTempoChange}
                    onPlayingChange={onPlayingChange}
                  />
                </div>
              </Suspense>
            )}

            {availableTabs.some((tool) => tool.value === 'circleof5') && activeTab === 'circleof5' && (
              <Suspense fallback={toolFallback}>
                <div>
                  <CircleOfFifths
                    scaleNotes={scaleNotes}
                    root={root}
                    timbre={timbre}
                    onSelectKey={(nextRoot, nextMode) => {
                      setRoot(nextRoot);
                      setMode(nextMode);
                      setSelectedChord(null);
                    }}
                  />
                </div>
              </Suspense>
            )}

            {availableTabs.some((tool) => tool.value === 'reference') && activeTab === 'reference' && (
              <Suspense fallback={toolFallback}>
                <div>
                  <MasterScaleReference />
                </div>
              </Suspense>
            )}

            {availableTabs.some((tool) => tool.value === 'polyrhythm') && activeTab === 'polyrhythm' && (
              <Suspense fallback={toolFallback}>
                <div>
                  <DrumMachine
                    tempo={tempo}
                    playing={playing}
                    onTempoChange={onTempoChange}
                    onPlayingChange={onPlayingChange}
                  />
                </div>
              </Suspense>
            )}

            {availableTabs.some((tool) => tool.value === 'rhythmmap') && activeTab === 'rhythmmap' && (
              <Suspense fallback={toolFallback}>
                <GlobalRhythmEngine
                  root={root}
                  mode={mode}
                  tempo={tempo}
                  playing={playing}
                  onTempoChange={onTempoChange}
                  onPlayingChange={onPlayingChange}
                />
              </Suspense>
            )}

            {availableTabs.some((tool) => tool.value === 'metronome') && activeTab === 'metronome' && (
              <Suspense fallback={toolFallback}>
                <div>
                  <Metronome
                    tempo={tempo}
                    playing={playing}
                    onTempoChange={onTempoChange}
                    onPlayingChange={onPlayingChange}
                  />
                </div>
              </Suspense>
            )}

            {availableTabs.some((tool) => tool.value === 'progression') && activeTab === 'progression' && (
              <Suspense fallback={toolFallback}>
                <div>
                  <ChordProgressionBuilder
                    chordSpellings={chordSpellings}
                    root={root}
                    mode={mode}
                    tempo={tempo}
                    playing={playing}
                    chordProgression={chordProgression}
                    onRootChange={onRootChange}
                    onModeChange={onModeChange}
                    onTempoChange={onTempoChange}
                    onPlayingChange={onPlayingChange}
                    onProgressionChange={onChordProgressionChange}
                  />
                </div>
              </Suspense>
            )}

            {availableTabs.some((tool) => tool.value === 'visualizer') && activeTab === 'visualizer' && (
            <Suspense fallback={toolFallback}>
            <>
        {/* Control Panel */}
        <div className="flex flex-wrap items-center gap-2 mb-6 p-3 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">Root</label>
            <select
              value={root}
              onChange={(e) => handleRootChange(e.target.value)}
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
              onChange={(e) => handleModeChange(e.target.value)}
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

          {instrument !== 'keyboard' && (
          <>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">Tuning</label>
            <select
              value={isCustomTuning ? 'custom' : String(tuningIdx)}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setIsCustomTuning(true);
                  setCustomGuitar([...TUNING_PRESETS[tuningIdx].guitar]);
                  setCustomBass([...TUNING_PRESETS[tuningIdx].bass]);
                } else {
                  setIsCustomTuning(false);
                  setTuningIdx(Number(e.target.value));
                }
              }}
              className="bg-secondary border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {TUNING_PRESETS.map((t, i) => (
                <option key={t.label} value={i}>{t.label}</option>
              ))}
              <option value="custom">✏️ Custom</option>
            </select>
          </div>

          <button
            onClick={() => setLefty(!lefty)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border border-border hover:bg-accent transition-colors"
          >
            {lefty ? <ToggleRight className="w-4 h-4 text-amber-400" /> : <ToggleLeft className="w-4 h-4" />}
            Lefty
          </button>
          </>
          )}

          <button
            onClick={() => { setShowIntervals(!showIntervals); if (!showIntervals) setShowFingers(false); }}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border border-border hover:bg-accent transition-colors"
          >
            {showIntervals ? <ToggleRight className="w-4 h-4 text-blue-400" /> : <ToggleLeft className="w-4 h-4" />}
            Intervals
          </button>

          {instrument !== 'keyboard' && (
          <button
            onClick={() => { setShowFingers(!showFingers); if (!showFingers) setShowIntervals(false); }}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border border-border hover:bg-accent transition-colors"
          >
            {showFingers ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4" />}
            Fingers
          </button>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
            <label className="text-sm font-medium text-muted-foreground">Sound</label>
            <select
              value={timbre}
              onChange={(e) => setTimbre(e.target.value as InstrumentTimbre)}
              className="bg-secondary border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {INSTRUMENT_TIMBRES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Tuning Editor */}
        {isCustomTuning && (
          <div className="flex flex-wrap items-start gap-6 mb-8 p-4 rounded-lg border border-border bg-card">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5" /> Guitar Strings (low → high)
              </p>
              <div className="flex flex-wrap gap-2">
                {customGuitar.map((s, i) => (
                  <select
                    key={i}
                    value={s.note}
                    onChange={(e) => {
                      const next = [...customGuitar];
                      next[i] = { ...next[i], note: e.target.value };
                      setCustomGuitar(next);
                    }}
                    className="bg-secondary border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-16"
                  >
                    {ALL_ROOTS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                ))}
                <button
                  onClick={() => setCustomGuitar([...customGuitar, { note: 'B', octave: 3 }])}
                  className="text-xs px-2 py-1 rounded border border-dashed border-border hover:bg-accent transition-colors text-muted-foreground"
                  title="Add string"
                >+</button>
                {customGuitar.length > 4 && (
                  <button
                    onClick={() => setCustomGuitar(customGuitar.slice(0, -1))}
                    className="text-xs px-2 py-1 rounded border border-dashed border-border hover:bg-destructive/20 transition-colors text-muted-foreground"
                    title="Remove last string"
                  >−</button>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5" /> Bass Strings (low → high)
              </p>
              <div className="flex flex-wrap gap-2">
                {customBass.map((s, i) => (
                  <select
                    key={i}
                    value={s.note}
                    onChange={(e) => {
                      const next = [...customBass];
                      next[i] = { ...next[i], note: e.target.value };
                      setCustomBass(next);
                    }}
                    className="bg-secondary border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-16"
                  >
                    {ALL_ROOTS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                ))}
                <button
                  onClick={() => setCustomBass([...customBass, { note: 'G', octave: 2 }])}
                  className="text-xs px-2 py-1 rounded border border-dashed border-border hover:bg-accent transition-colors text-muted-foreground"
                  title="Add string"
                >+</button>
                {customBass.length > 3 && (
                  <button
                    onClick={() => setCustomBass(customBass.slice(0, -1))}
                    className="text-xs px-2 py-1 rounded border border-dashed border-border hover:bg-destructive/20 transition-colors text-muted-foreground"
                    title="Remove last string"
                  >−</button>
                )}
              </div>
            </div>
          </div>
        )}


        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-lg font-semibold">
              {root} {mode}
            </h3>
            <button
              onClick={handlePlayScale}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <Volume2 className="w-3.5 h-3.5" /> Play Scale
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {scaleNotes.map((note, i) => (
              <div
                key={i}
                className={`w-10 h-10 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold cursor-pointer transition-all touch-manipulation ${getNoteStyle(note, note === root)} ${
                  hoveredNote === note ? "scale-125 ring-2 ring-white" : "hover:scale-110 active:scale-95"
                }`}
                onMouseEnter={() => setHoveredNote(note)}
                onMouseLeave={() => setHoveredNote(null)}
                onClick={() => playNote(note, 0, 0.4, timbre)}
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
                <span className="text-[10px] text-muted-foreground hidden sm:inline">(click to isolate on fretboard)</span>
                <button
                  onClick={() => setChordDisplay(chordDisplay === 'notes' ? 'intervals' : 'notes')}
                  className="text-[10px] px-2 py-0.5 rounded border border-border hover:bg-accent transition-colors text-muted-foreground"
                >
                  Show: {chordDisplay === 'notes' ? 'Notes' : 'Intervals'}
                </button>
                {selectedChord && (
                  <button
                    onClick={() => setSelectedChord(null)}
                    className="text-[10px] px-2 py-0.5 rounded border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 transition-colors text-amber-400"
                  >
                    ✕ Clear filter
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {chordSpellings.map((cs, i) => {
                  const isSelected = selectedChord?.symbol === cs.symbol;
                  const isHoveredChordItem = hoveredChord?.symbol === cs.symbol;
                  return (
                    <div
                      key={i}
                      className="relative group"
                      onMouseEnter={() => setHoveredChord(cs)}
                      onMouseLeave={() => setHoveredChord(null)}
                    >
                      <div
                        className={`px-3 py-1.5 text-xs font-mono rounded border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/20 text-foreground ring-1 ring-amber-500/50'
                            : isHoveredChordItem
                            ? 'border-amber-500 bg-amber-500/10 text-foreground'
                            : 'border-border bg-card text-foreground hover:border-muted-foreground'
                        }`}
                        onClick={() => handleChordClick(cs)}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold">{cs.symbol}</span>
                          <Volume2 className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {chordDisplay === 'notes'
                            ? cs.notes.join(' – ')
                            : cs.intervals.join(' – ')}
                        </div>
                      </div>

                      {/* Hover tooltip */}
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
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sheet Music */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Music className="w-5 h-5" /> Staff Notation
            </h3>
          </div>
          <SheetMusic scaleNotes={scaleNotes} hoveredNote={hoveredNote} />
        </div>

        {/* Instrument Selector */}
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {([
              { key: 'guitar' as const, label: 'Guitar', shortLabel: 'Gtr', icon: <Guitar className="w-4 h-4" /> },
              { key: 'bass' as const, label: 'Bass', shortLabel: 'Bass', icon: <Guitar className="w-4 h-4" /> },
              { key: 'other' as const, label: 'Other', shortLabel: 'Other', icon: <Music className="w-4 h-4" /> },
              { key: 'keyboard' as const, label: 'Keyboard', shortLabel: 'Keys', icon: <Piano className="w-4 h-4" /> },
            ]).map((inst) => (
              <button
                key={inst.key}
                onClick={() => setInstrument(inst.key)}
                className={`flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-lg border transition-colors ${
                  instrument === inst.key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:bg-accent'
                }`}
              >
                {inst.icon} <span className="hidden sm:inline">{inst.label}</span><span className="sm:hidden">{inst.shortLabel}</span>
              </button>
            ))}
            {instrument === 'other' && (
              <select
                value={otherInstrument}
                onChange={(e) => setOtherInstrument(e.target.value)}
                className="bg-secondary border border-border rounded px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {FRETTED_INSTRUMENTS.map((fi) => (
                  <option key={fi.key} value={fi.key}>{fi.label}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Guitar Fretboard */}
        {instrument === 'guitar' && (
          <div className="mb-8">
            <h3 className="text-base sm:text-lg font-semibold mb-3 flex flex-wrap items-center gap-2">
              <Guitar className="w-5 h-5" /> Guitar ({tuningLabel(activeGuitarTuning)})
              <div className="flex items-center gap-1 ml-2">
                {([6, 7, 8] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => setGuitarStrings(n)}
                    className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                      guitarStrings === n
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {n}-str
                  </button>
                ))}
              </div>
              {selectedChord && <span className="text-xs text-amber-400 font-normal ml-2">Showing: {selectedChord.name}</span>}
            </h3>
            <Fretboard
              scaleNotes={scaleNotes}
              root={root}
              mode={mode}
              tuning={activeGuitarTuning}
              label="Guitar"
              lefty={lefty}
              showIntervals={showIntervals}
              showFingers={showFingers}
              hoveredNote={hoveredNote}
              onNoteHover={setHoveredNote}
              chordFilter={chordFilter}
              onNoteClick={handleNoteClick}
              timbre={timbre}
            />
          </div>
        )}

        {/* Bass Fretboard */}
        {instrument === 'bass' && (
          <div className="mb-8">
            <h3 className="text-base sm:text-lg font-semibold mb-3 flex flex-wrap items-center gap-2">
              <Guitar className="w-5 h-5" /> Bass ({tuningLabel(activeBassTuning)})
              <div className="flex items-center gap-1 ml-2">
                {([4, 5, 6] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => setBassStrings(n)}
                    className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                      bassStrings === n
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {n}-str
                  </button>
                ))}
              </div>
              {selectedChord && <span className="text-xs text-amber-400 font-normal ml-2">Showing: {selectedChord.name}</span>}
            </h3>
            <Fretboard
              scaleNotes={scaleNotes}
              root={root}
              mode={mode}
              tuning={activeBassTuning}
              label="Bass"
              lefty={lefty}
              showIntervals={showIntervals}
              showFingers={showFingers}
              hoveredNote={hoveredNote}
              onNoteHover={setHoveredNote}
              chordFilter={chordFilter}
              onNoteClick={handleNoteClick}
              timbre={timbre}
            />
          </div>
        )}

        {/* Other Fretted Instruments */}
        {instrument === 'other' && (() => {
          const fi = FRETTED_INSTRUMENTS.find(f => f.key === otherInstrument) || FRETTED_INSTRUMENTS[0];
          return (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Music className="w-5 h-5" /> {fi.label} ({tuningLabel(fi.tuning)})
                {selectedChord && <span className="text-xs text-amber-400 font-normal ml-2">Showing: {selectedChord.name}</span>}
              </h3>
              <Fretboard
                scaleNotes={scaleNotes}
                root={root}
                mode={mode}
                tuning={fi.tuning}
                label={fi.label}
                lefty={lefty}
                showIntervals={showIntervals}
                showFingers={showFingers}
                hoveredNote={hoveredNote}
                onNoteHover={setHoveredNote}
                chordFilter={chordFilter}
                onNoteClick={handleNoteClick}
                timbre={timbre}
              />
            </div>
          );
        })()}

        {/* Keyboard */}
        {instrument === 'keyboard' && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Piano className="w-5 h-5" /> Keyboard
              {selectedChord && <span className="text-xs text-amber-400 font-normal ml-2">Showing: {selectedChord.name}</span>}
            </h3>
            <KeyboardVisualizer
              scaleNotes={scaleNotes}
              root={root}
              hoveredNote={hoveredNote}
              onNoteHover={setHoveredNote}
              onNoteClick={handleNoteClick}
              chordFilter={chordFilter}
              showIntervals={showIntervals}
              intervals={intervals}
              timbre={timbre}
            />
          </div>
        )}
        </>
            </Suspense>
            )}
        </>
        )}
      </div>
    </section>
  );
};

export default ModeVisualizer;
