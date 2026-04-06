import { useState, useRef, useCallback, useMemo } from "react";
import {
  Play, Pause, Plus, X, Volume2, RotateCcw, Sparkles, ArrowRightLeft,
  Music2, ChevronDown, ChevronUp, Download, ArrowLeft, ArrowRight,
  Lock, Unlock, Eye, Wand2, Globe2, Sliders, Lightbulb, GripVertical,
  Undo2, Hash, Music, Palette,
} from "lucide-react";
import { type ChordSpelling, getScaleNotes, getChordSpellings, MODE_INTERVALS, ALL_ROOTS, MODE_CATEGORIES } from "./scaleData";
import { type InstrumentTimbre, INSTRUMENT_TIMBRES } from "./audioSynth";
import {
  type ProgressionChord, type ChordSource, type RhythmicFeel, type HarmonicStyle,
  type ViewMode, type ChordFunction, type ChordSuggestion,
  PROGRESSION_TEMPLATES, STYLE_PRESETS, RHYTHMIC_FEELS,
  sourceColors, sourceActiveColors, sourceDotColors, functionColors, functionDotColors,
  getSecondaryDominants, getTritoneSubs, getBorrowedChords, createIIV,
  transformProgression, getNextChordSuggestions,
  getRomanNumeral, getNashvilleNumber, getChordFunction,
  transposeChord, transposeNote, useFlatsForKey,
  playChordTones, downloadMidi, getStyleSuggestions,
  NOTES_SHARP, NOTES_FLAT,
} from "./chordProgressionUtils";

interface ChordProgressionBuilderProps {
  chordSpellings: ChordSpelling[];
  root: string;
  mode: string;
}

// ─── Main Component ─────────────────────────────────────────
const ChordProgressionBuilder = ({
  chordSpellings: initialChordSpellings,
  root: initialRoot,
  mode: initialMode,
}: ChordProgressionBuilderProps) => {
  // Core state
  const [progression, setProgression] = useState<ProgressionChord[]>([]);
  const [undoStack, setUndoStack] = useState<ProgressionChord[][]>([]);
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [bpm, setBpm] = useState(100);
  const [beatsPerChord, setBeatsPerChord] = useState(4);
  const [timbre, setTimbre] = useState<InstrumentTimbre>('piano');
  const [localRoot, setLocalRoot] = useState(initialRoot);
  const [localMode, setLocalMode] = useState(initialMode);
  const timeoutRef = useRef<number[]>([]);
  const [looping, setLooping] = useState(false);

  // Lock system
  const [lockProgression, setLockProgression] = useState(false);
  const [lockRoots, setLockRoots] = useState(false);
  const [lockVoicing, setLockVoicing] = useState(false);

  // UI panels
  const [showBorrowed, setShowBorrowed] = useState(false);
  const [showSecondaryDoms, setShowSecondaryDoms] = useState(false);
  const [showTritoneSubs, setShowTritoneSubs] = useState(false);
  const [expandedBorrowMode, setExpandedBorrowMode] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<'harmonic' | 'transform' | 'style' | 'suggest'>('harmonic');
  const [viewMode, setViewMode] = useState<ViewMode>('standard');

  // Rhythm & Style
  const [rhythmicFeel, setRhythmicFeel] = useState<RhythmicFeel>('straight');
  const [harmonicStyle, setHarmonicStyle] = useState<HarmonicStyle>('neutral');

  // Expressive sliders
  const [tension, setTension] = useState(50);
  const [density, setDensity] = useState(50);
  const [movement, setMovement] = useState(50);
  const [brightness, setBrightness] = useState(50);

  // Chord edit popup
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  // Drag state
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Derived data
  const root = localRoot;
  const mode = localMode;
  const localScaleNotes = useMemo(() => getScaleNotes(root, mode), [root, mode]);
  const chordSpellings = useMemo(() => getChordSpellings(localScaleNotes, mode), [localScaleNotes, mode]);
  const allModes = useMemo(() => MODE_CATEGORIES.flatMap(c => c.modes), []);
  const secondaryDoms = useMemo(() => getSecondaryDominants(root, mode, chordSpellings), [root, mode, chordSpellings]);
  const tritoneSubs = useMemo(() => getTritoneSubs(secondaryDoms), [secondaryDoms]);
  const borrowedGroups = useMemo(() => getBorrowedChords(root, mode, chordSpellings), [root, mode, chordSpellings]);
  const suggestions = useMemo(() => getNextChordSuggestions(progression, chordSpellings, root, mode), [progression, chordSpellings, root, mode]);
  const has7Notes = (MODE_INTERVALS[mode]?.length ?? 0) >= 7;

  // ─── Actions ────────────────────────────────────────────
  const pushUndo = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-19), progression]);
  }, [progression]);

  const undo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setProgression(last);
      return prev.slice(0, -1);
    });
  }, []);

  const stop = useCallback(() => {
    timeoutRef.current.forEach(clearTimeout);
    timeoutRef.current = [];
    setPlaying(false);
    setCurrentIdx(-1);
  }, []);

  const playProgression = useCallback(() => {
    if (progression.length === 0) return;
    stop();
    setPlaying(true);

    const chordDuration = (60 / bpm) * beatsPerChord * 1000;
    const ids: number[] = [];

    progression.forEach((pc, i) => {
      const id = window.setTimeout(() => {
        setCurrentIdx(i);
        playChordTones(pc.chord.notes, (chordDuration / 1000) * 0.9, timbre);
      }, i * chordDuration);
      ids.push(id);
    });

    const endId = window.setTimeout(() => {
      if (looping) {
        playProgression();
      } else {
        setPlaying(false);
        setCurrentIdx(-1);
      }
    }, progression.length * chordDuration);
    ids.push(endId);
    timeoutRef.current = ids;
  }, [progression, bpm, beatsPerChord, stop, timbre, looping]);

  const addChord = (pc: ProgressionChord) => {
    if (lockProgression) return;
    pushUndo();
    setProgression(prev => [...prev, pc]);
  };

  const removeChord = (idx: number) => {
    if (lockProgression) return;
    pushUndo();
    setProgression(prev => prev.filter((_, i) => i !== idx));
    setEditingIdx(null);
  };

  const moveChord = (idx: number, direction: -1 | 1) => {
    if (lockProgression) return;
    pushUndo();
    setProgression(prev => {
      const next = [...prev];
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= next.length) return prev;
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next;
    });
  };

  const loadTemplate = (degrees: number[]) => {
    if (lockProgression) return;
    pushUndo();
    stop();
    setProgression(degrees.map(d => {
      const chord = chordSpellings[Math.min(d, chordSpellings.length - 1)];
      return {
        chord,
        source: 'diatonic' as ChordSource,
        function: getChordFunction(d, mode),
      };
    }));
  };

  const handleTranspose = (newRoot: string) => {
    if (newRoot === localRoot) return;
    if (progression.length === 0 || lockRoots) {
      setLocalRoot(newRoot);
      if (!lockProgression && progression.length > 0) {
        // Re-map progression to new key
        const oldIdx = NOTES_SHARP.indexOf(localRoot) !== -1 ? NOTES_SHARP.indexOf(localRoot) : NOTES_FLAT.indexOf(localRoot);
        const newIdx = NOTES_SHARP.indexOf(newRoot) !== -1 ? NOTES_SHARP.indexOf(newRoot) : NOTES_FLAT.indexOf(newRoot);
        const semitones = ((newIdx - oldIdx) % 12 + 12) % 12;
        const flats = useFlatsForKey(newRoot);
        pushUndo();
        setProgression(prev => prev.map(pc => ({
          ...pc,
          chord: transposeChord(pc.chord, semitones, flats),
        })));
      }
      return;
    }
    const oldIdx = NOTES_SHARP.indexOf(localRoot) !== -1 ? NOTES_SHARP.indexOf(localRoot) : NOTES_FLAT.indexOf(localRoot);
    const newIdx = NOTES_SHARP.indexOf(newRoot) !== -1 ? NOTES_SHARP.indexOf(newRoot) : NOTES_FLAT.indexOf(newRoot);
    const semitones = ((newIdx - oldIdx) % 12 + 12) % 12;
    const flats = useFlatsForKey(newRoot);
    pushUndo();
    stop();
    setProgression(prev => prev.map(pc => ({
      ...pc,
      chord: transposeChord(pc.chord, semitones, flats),
    })));
    setLocalRoot(newRoot);
  };

  const handleModeChange = (newMode: string) => {
    stop();
    setLocalMode(newMode);
    // Preserve progression when lock is on - don't clear
    if (!lockProgression) {
      // Re-derive progression using new mode's chords where possible
      if (progression.length > 0) {
        const newScale = getScaleNotes(root, newMode);
        const newChords = getChordSpellings(newScale, newMode);
        if (newChords.length > 0) {
          pushUndo();
          setProgression(prev => prev.map(pc => {
            // Try to find matching degree
            const matchIdx = chordSpellings.findIndex(c => c.rootNote === pc.chord.rootNote);
            if (matchIdx !== -1 && matchIdx < newChords.length) {
              return { ...pc, chord: newChords[matchIdx], function: getChordFunction(matchIdx, newMode) };
            }
            return pc; // keep non-diatonic chords as-is
          }));
        }
      }
    }
  };

  const applyTransform = (type: string) => {
    if (progression.length === 0) return;
    pushUndo();
    setProgression(prev => transformProgression(prev, type, root, mode, chordSpellings));
  };

  const insertIIV = (targetIdx: number) => {
    if (lockProgression || targetIdx >= progression.length) return;
    const target = progression[targetIdx];
    const iiV = createIIV(target.chord.rootNote, root);
    if (iiV.length === 0) return;
    pushUndo();
    setProgression(prev => {
      const next = [...prev];
      next.splice(targetIdx, 0, ...iiV);
      return next;
    });
  };

  // Drag handlers
  const handleDragStart = (idx: number) => {
    if (lockProgression) return;
    setDragIdx(idx);
  };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    pushUndo();
    setProgression(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDragIdx(null);
    setDragOverIdx(null);
  };

  // ─── Chord Display Helpers ──────────────────────────────
  const getChordLabel = (pc: ProgressionChord, idx: number) => {
    const degreeIdx = chordSpellings.findIndex(c => c.rootNote === pc.chord.rootNote);
    switch (viewMode) {
      case 'roman':
        return degreeIdx >= 0 ? getRomanNumeral(pc.chord, degreeIdx) : pc.chord.symbol;
      case 'nashville':
        return degreeIdx >= 0 ? getNashvilleNumber(degreeIdx, pc.chord) : pc.chord.symbol;
      default:
        return pc.chord.symbol;
    }
  };

  const getSecondaryLabel = (pc: ProgressionChord) => {
    const degreeIdx = chordSpellings.findIndex(c => c.rootNote === pc.chord.rootNote);
    switch (viewMode) {
      case 'roman':
        return pc.chord.name;
      case 'nashville':
        return pc.chord.name;
      default:
        return degreeIdx >= 0 ? getRomanNumeral(pc.chord, degreeIdx) : '';
    }
  };

  if (chordSpellings.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-2">Chord Progression Builder</h3>
        <p className="text-sm text-muted-foreground">No chords available for this scale. Try a 7-note mode.</p>
      </div>
    );
  }

  const styleInfo = STYLE_PRESETS.find(s => s.id === harmonicStyle);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* ═══ HEADER ═══ */}
      <div className="p-4 border-b border-border bg-secondary/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Music size={18} className="text-primary" />
            Chord Progression Builder
          </h3>
          <div className="flex items-center gap-1">
            {(['standard', 'roman', 'nashville'] as ViewMode[]).map(vm => (
              <button
                key={vm}
                onClick={() => setViewMode(vm)}
                className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                  viewMode === vm ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:bg-accent'
                }`}
              >
                {vm === 'standard' ? 'Name' : vm === 'roman' ? 'Roman' : 'Nashville'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ 3-PANEL LAYOUT ═══ */}
      <div className="flex flex-col lg:flex-row">
        {/* ── LEFT PANEL: Controls ── */}
        <div className="w-full lg:w-56 shrink-0 p-4 border-b lg:border-b-0 lg:border-r border-border bg-secondary/10 space-y-4">
          {/* Harmonic Context */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-semibold">🎼 Context</p>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-muted-foreground">Key</label>
                <div className="flex items-center gap-1">
                  <select
                    value={localRoot}
                    onChange={(e) => handleTranspose(e.target.value)}
                    className="flex-1 bg-background border border-border rounded px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {ALL_ROOTS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {progression.length > 0 && (
                    <div className="flex gap-0.5">
                      <button onClick={() => { const allRoots = ALL_ROOTS; const ci = allRoots.indexOf(localRoot); handleTranspose(allRoots[(ci - 1 + allRoots.length) % allRoots.length]); }} className="w-6 h-6 flex items-center justify-center rounded border border-border bg-background text-foreground hover:bg-accent text-xs font-bold">−</button>
                      <button onClick={() => { const allRoots = ALL_ROOTS; const ci = allRoots.indexOf(localRoot); handleTranspose(allRoots[(ci + 1) % allRoots.length]); }} className="w-6 h-6 flex items-center justify-center rounded border border-border bg-background text-foreground hover:bg-accent text-xs font-bold">+</button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Mode</label>
                <select
                  value={localMode}
                  onChange={(e) => handleModeChange(e.target.value)}
                  className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {MODE_CATEGORIES.map(cat => (
                    <optgroup key={cat.label} label={cat.label}>
                      {cat.modes.map(m => <option key={m} value={m}>{m}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sound */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-semibold">🔊 Sound</p>
            <select
              value={timbre}
              onChange={(e) => setTimbre(e.target.value as InstrumentTimbre)}
              className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {INSTRUMENT_TIMBRES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>

          {/* Rhythm */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-semibold">🥁 Rhythm</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-muted-foreground w-8">BPM</label>
                <input
                  type="number" value={bpm} min={40} max={300}
                  onChange={(e) => setBpm(Math.min(300, Math.max(40, Number(e.target.value) || 40)))}
                  className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm text-foreground text-center focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Feel</label>
                <select
                  value={rhythmicFeel}
                  onChange={(e) => {
                    const feel = e.target.value as RhythmicFeel;
                    setRhythmicFeel(feel);
                    const feelData = RHYTHMIC_FEELS.find(f => f.id === feel);
                    if (feelData) setBeatsPerChord(feelData.beats);
                  }}
                  className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {RHYTHMIC_FEELS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Locks */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-semibold">🔒 Locks</p>
            <div className="space-y-1">
              {[
                { label: 'Progression', value: lockProgression, set: setLockProgression },
                { label: 'Roots', value: lockRoots, set: setLockRoots },
                { label: 'Voicing', value: lockVoicing, set: setLockVoicing },
              ].map(lock => (
                <button
                  key={lock.label}
                  onClick={() => lock.set(!lock.value)}
                  className={`w-full flex items-center gap-2 text-xs px-2 py-1.5 rounded border transition-colors ${
                    lock.value ? 'border-amber-500/50 bg-amber-500/10 text-amber-300' : 'border-border text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {lock.value ? <Lock size={10} /> : <Unlock size={10} />}
                  {lock.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── CENTER PANEL: Progression (Primary) ── */}
        <div className="flex-1 p-4 min-w-0">
          {/* Progression Timeline */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Your Progression</p>
              <div className="flex items-center gap-1">
                {undoStack.length > 0 && (
                  <button onClick={undo} className="text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:bg-accent flex items-center gap-1">
                    <Undo2 size={10} /> Undo
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[72px] p-3 rounded-lg border border-dashed border-border bg-secondary/30">
              {progression.length === 0 ? (
                <p className="text-xs text-muted-foreground italic self-center">Click chords below or use templates to build your progression…</p>
              ) : (
                progression.map((pc, i) => {
                  const chordFunc = pc.function || (chordSpellings.findIndex(c => c.rootNote === pc.chord.rootNote) >= 0
                    ? getChordFunction(chordSpellings.findIndex(c => c.rootNote === pc.chord.rootNote), mode)
                    : 'other');
                  return (
                    <div
                      key={i}
                      draggable={!lockProgression}
                      onDragStart={() => handleDragStart(i)}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDrop={() => handleDrop(i)}
                      onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                      onClick={() => setEditingIdx(editingIdx === i ? null : i)}
                      className={`relative group flex flex-col items-center justify-center px-4 py-2.5 rounded-lg border text-sm transition-all cursor-pointer select-none ${
                        dragOverIdx === i ? 'ring-2 ring-primary' : ''
                      } ${dragIdx === i ? 'opacity-40' : ''} ${
                        currentIdx === i
                          ? `${sourceActiveColors[pc.source]} scale-105 shadow-lg`
                          : `border-border bg-card hover:border-muted-foreground ${functionColors[chordFunc]}`
                      }`}
                    >
                      {/* Function dot */}
                      <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${functionDotColors[chordFunc]}`} title={chordFunc} />
                      
                      {/* Drag handle */}
                      {!lockProgression && (
                        <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40">
                          <GripVertical size={10} />
                        </div>
                      )}

                      {/* Controls */}
                      <div className="absolute -top-2 left-0 right-0 flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {i > 0 && !lockProgression && (
                          <button onClick={(e) => { e.stopPropagation(); moveChord(i, -1); }} className="w-4 h-4 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-accent"><ArrowLeft size={8} /></button>
                        )}
                        {!lockProgression && (
                          <button onClick={(e) => { e.stopPropagation(); removeChord(i); }} className="w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"><X size={8} /></button>
                        )}
                        {i < progression.length - 1 && !lockProgression && (
                          <button onClick={(e) => { e.stopPropagation(); moveChord(i, 1); }} className="w-4 h-4 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-accent"><ArrowRight size={8} /></button>
                        )}
                        {has7Notes && !lockProgression && (
                          <button onClick={(e) => { e.stopPropagation(); insertIIV(i); }} className="w-4 h-4 rounded-full bg-pink-500/80 text-white flex items-center justify-center text-[7px] font-bold" title="Insert ii-V before">ii</button>
                        )}
                      </div>

                      {/* Chord display */}
                      <div className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${sourceDotColors[pc.source]}`} />
                        <span className="font-bold text-sm">{getChordLabel(pc, i)}</span>
                      </div>
                      <span className="text-[9px] text-muted-foreground">{getSecondaryLabel(pc)}</span>
                      <span className="text-[8px] text-muted-foreground/60">{pc.chord.notes.join(' ')}</span>
                      {pc.source !== 'diatonic' && (
                        <span className="text-[8px] text-muted-foreground/50 italic">{pc.sourceLabel}</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Legend */}
            {progression.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-2 text-[9px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Tonic</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Subdominant</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Dominant</span>
                {progression.some(p => p.source === 'borrowed') && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500" /> Borrowed</span>}
                {progression.some(p => p.source === 'secondary-dom') && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500" /> Sec. Dom.</span>}
                {progression.some(p => p.source === 'tritone-sub') && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Tritone Sub</span>}
                {progression.some(p => p.source === 'inserted') && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500" /> Inserted</span>}
                {progression.some(p => p.source === 'transformed') && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Transformed</span>}
              </div>
            )}
          </div>

          {/* Chord Edit Popup */}
          {editingIdx !== null && editingIdx < progression.length && (
            <div className="mb-4 p-3 rounded-lg border border-primary/30 bg-primary/5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold">Editing: {progression[editingIdx].chord.symbol}</p>
                <button onClick={() => setEditingIdx(null)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">Root</label>
                  <p className="text-sm font-bold">{progression[editingIdx].chord.rootNote}</p>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Quality</label>
                  <p className="text-sm">{progression[editingIdx].chord.symbol}</p>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Notes</label>
                  <p className="text-sm">{progression[editingIdx].chord.notes.join(' - ')}</p>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Function</label>
                  <p className="text-sm capitalize">{progression[editingIdx].function || 'other'}</p>
                </div>
              </div>
              <div className="flex gap-1 mt-2">
                <button onClick={() => { playChordTones(progression[editingIdx].chord.notes, 0.8, timbre); }} className="text-[10px] px-2 py-1 rounded border border-border hover:bg-accent">▶ Play</button>
                <button onClick={() => removeChord(editingIdx)} className="text-[10px] px-2 py-1 rounded border border-destructive/50 text-destructive hover:bg-destructive/10">Delete</button>
                {has7Notes && <button onClick={() => { insertIIV(editingIdx); setEditingIdx(null); }} className="text-[10px] px-2 py-1 rounded border border-pink-500/50 text-pink-400 hover:bg-pink-500/10">Insert ii-V</button>}
              </div>
            </div>
          )}

          {/* Diatonic Chords */}
          <div className="mb-4">
            <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-widest">Diatonic Chords</p>
            <div className="flex flex-wrap gap-1.5">
              {chordSpellings.map((chord, i) => {
                const func = getChordFunction(i, mode);
                return (
                  <button
                    key={i}
                    onClick={() => addChord({ chord, source: 'diatonic', function: func })}
                    className={`flex flex-col items-center px-3 py-2 rounded-lg border transition-colors text-sm ${sourceColors['diatonic']} ${lockProgression ? 'opacity-40 cursor-not-allowed' : ''}`}
                    disabled={lockProgression}
                  >
                    <span className="text-[9px] text-muted-foreground/60">{getRomanNumeral(chord, i)}</span>
                    <span className="font-bold">{chord.symbol}</span>
                    <span className="text-[9px] text-muted-foreground">{chord.notes.join('-')}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Templates */}
          <div className="mb-4">
            <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-widest">Common Progressions</p>
            <div className="flex flex-wrap gap-1.5">
              {PROGRESSION_TEMPLATES.filter(t => t.degrees.every(d => d < chordSpellings.length)).map((t) => (
                <button
                  key={t.label}
                  onClick={() => loadTemplate(t.degrees)}
                  disabled={lockProgression}
                  className={`text-[10px] px-2.5 py-1.5 rounded border border-border hover:bg-accent transition-colors text-muted-foreground ${lockProgression ? 'opacity-40 cursor-not-allowed' : ''}`}
                  title={t.desc}
                >
                  {t.label} <span className="text-muted-foreground/50">({t.desc})</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Playback Controls ── */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border">
            <button
              onClick={() => (playing ? stop() : playProgression())}
              disabled={progression.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                playing ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
              {playing ? 'Stop' : 'Play'}
            </button>
            <button
              onClick={() => setLooping(!looping)}
              className={`text-xs px-2.5 py-1.5 rounded border transition-colors ${
                looping ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:bg-accent'
              }`}
            >
              🔁 Loop
            </button>
            <button onClick={() => { stop(); pushUndo(); setProgression([]); }} disabled={lockProgression || progression.length === 0} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border border-border hover:bg-accent text-muted-foreground disabled:opacity-40">
              <RotateCcw size={10} /> Clear
            </button>
            <button
              onClick={() => downloadMidi(progression, bpm, beatsPerChord, root, mode)}
              disabled={progression.length === 0}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border border-border hover:bg-accent text-muted-foreground disabled:opacity-40"
            >
              <Download size={10} /> MIDI
            </button>
          </div>
        </div>

        {/* ── RIGHT PANEL: Tools & Exploration ── */}
        <div className="w-full lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l border-border bg-secondary/10">
          {/* Tabs */}
          <div className="flex border-b border-border overflow-x-auto">
            {([
              { id: 'harmonic' as const, icon: Sparkles, label: 'Harmonic' },
              { id: 'transform' as const, icon: Wand2, label: 'Transform' },
              { id: 'style' as const, icon: Globe2, label: 'Style' },
              { id: 'suggest' as const, icon: Lightbulb, label: 'Suggest' },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setRightTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1 text-[10px] py-2.5 px-2 border-b-2 transition-colors whitespace-nowrap ${
                  rightTab === tab.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-3 max-h-[500px] overflow-y-auto">
            {/* ── Harmonic Tools Tab ── */}
            {rightTab === 'harmonic' && (
              <div className="space-y-3">
                {has7Notes && borrowedGroups.length > 0 && (
                  <div>
                    <button
                      onClick={() => { setShowBorrowed(!showBorrowed); if (showBorrowed) setExpandedBorrowMode(null); }}
                      className={`w-full flex items-center justify-between gap-1.5 text-xs px-3 py-2 rounded border transition-colors ${
                        showBorrowed ? 'border-violet-500 bg-violet-500/15 text-violet-300' : 'border-border text-muted-foreground hover:border-violet-500/50'
                      }`}
                    >
                      <span className="flex items-center gap-1.5"><Music2 size={12} /> Borrowed Chords</span>
                      {showBorrowed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    {showBorrowed && (
                      <div className="mt-2 space-y-2">
                        <p className="text-[10px] text-violet-400/80">Borrow from parallel modes of {root}</p>
                        <div className="flex flex-wrap gap-1">
                          {borrowedGroups.map(g => (
                            <button key={g.mode} onClick={() => setExpandedBorrowMode(expandedBorrowMode === g.mode ? null : g.mode)} className={`text-[10px] px-2 py-1 rounded border transition-colors ${expandedBorrowMode === g.mode ? 'border-violet-500/60 bg-violet-500/10 text-violet-300' : 'border-border text-muted-foreground hover:border-violet-500/40'}`}>
                              {g.mode} ({g.chords.length})
                            </button>
                          ))}
                        </div>
                        {expandedBorrowMode && (
                          <div className="flex flex-wrap gap-1.5 p-2 rounded bg-violet-500/5 border border-violet-500/20">
                            {borrowedGroups.find(g => g.mode === expandedBorrowMode)?.chords.map((pc, i) => (
                              <button key={i} onClick={() => addChord(pc)} disabled={lockProgression} className={`flex flex-col items-center px-2.5 py-1.5 rounded border ${sourceColors['borrowed']} transition-colors text-xs ${lockProgression ? 'opacity-40' : ''}`}>
                                <span className="font-bold">{pc.chord.symbol}</span>
                                <span className="text-[8px] text-muted-foreground">{pc.chord.notes.join('-')}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {has7Notes && secondaryDoms.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowSecondaryDoms(!showSecondaryDoms)}
                      className={`w-full flex items-center justify-between gap-1.5 text-xs px-3 py-2 rounded border transition-colors ${
                        showSecondaryDoms ? 'border-sky-500 bg-sky-500/15 text-sky-300' : 'border-border text-muted-foreground hover:border-sky-500/50'
                      }`}
                    >
                      <span className="flex items-center gap-1.5"><ArrowRightLeft size={12} /> Secondary Dominants</span>
                      {showSecondaryDoms ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    {showSecondaryDoms && (
                      <div className="mt-2 flex flex-wrap gap-1.5 p-2 rounded bg-sky-500/5 border border-sky-500/20">
                        {secondaryDoms.map((pc, i) => (
                          <button key={i} onClick={() => addChord(pc)} disabled={lockProgression} className={`flex flex-col items-center px-2.5 py-1.5 rounded border ${sourceColors['secondary-dom']} transition-colors text-xs ${lockProgression ? 'opacity-40' : ''}`}>
                            <span className="font-bold">{pc.chord.symbol}</span>
                            <span className="text-[8px] text-muted-foreground">{pc.chord.notes.join('-')}</span>
                            <span className="text-[7px] text-sky-400/60 italic">{pc.sourceLabel}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {has7Notes && tritoneSubs.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowTritoneSubs(!showTritoneSubs)}
                      className={`w-full flex items-center justify-between gap-1.5 text-xs px-3 py-2 rounded border transition-colors ${
                        showTritoneSubs ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300' : 'border-border text-muted-foreground hover:border-emerald-500/50'
                      }`}
                    >
                      <span className="flex items-center gap-1.5"><Sparkles size={12} /> Tritone Substitutions</span>
                      {showTritoneSubs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    {showTritoneSubs && (
                      <div className="mt-2 flex flex-wrap gap-1.5 p-2 rounded bg-emerald-500/5 border border-emerald-500/20">
                        {tritoneSubs.map((pc, i) => (
                          <button key={i} onClick={() => addChord(pc)} disabled={lockProgression} className={`flex flex-col items-center px-2.5 py-1.5 rounded border ${sourceColors['tritone-sub']} transition-colors text-xs ${lockProgression ? 'opacity-40' : ''}`}>
                            <span className="font-bold">{pc.chord.symbol}</span>
                            <span className="text-[8px] text-muted-foreground">{pc.chord.notes.join('-')}</span>
                            <span className="text-[7px] text-emerald-400/60 italic">{pc.sourceLabel}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!has7Notes && (
                  <p className="text-[10px] text-muted-foreground/60 italic">Harmonic tools work best with 7-note scales.</p>
                )}
              </div>
            )}

            {/* ── Transform Tab ── */}
            {rightTab === 'transform' && (
              <div className="space-y-3">
                <p className="text-[10px] text-muted-foreground">Transform your current progression. Each action modifies — not replaces.</p>
                {progression.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground/60 italic">Add chords first to use transformations.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'jazzy', label: 'Make Jazzy', icon: '🎷', desc: 'Add 7ths & extensions' },
                      { id: 'modal', label: 'Make Modal', icon: '🌀', desc: 'Replace dominants with modal alternatives' },
                      { id: 'dark', label: 'Make Dark', icon: '🌑', desc: 'Lower 3rds to minor' },
                      { id: 'tension', label: 'Add Tension', icon: '⚡', desc: 'Add b9s to dominants' },
                      { id: 'simplify', label: 'Simplify', icon: '✨', desc: 'Reduce to triads' },
                      { id: 'expand', label: 'Expand', icon: '🎆', desc: 'Add 9ths and extensions' },
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => applyTransform(t.id)}
                        disabled={lockProgression}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border border-border hover:border-orange-500/50 hover:bg-orange-500/5 transition-colors text-xs ${lockProgression ? 'opacity-40 cursor-not-allowed' : ''}`}
                        title={t.desc}
                      >
                        <span className="text-base">{t.icon}</span>
                        <span className="font-medium text-foreground">{t.label}</span>
                        <span className="text-[8px] text-muted-foreground text-center leading-tight">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                )}
                {undoStack.length > 0 && (
                  <button onClick={undo} className="w-full flex items-center justify-center gap-1 text-xs px-3 py-2 rounded border border-border hover:bg-accent text-muted-foreground">
                    <Undo2 size={12} /> Undo Last Change
                  </button>
                )}
              </div>
            )}

            {/* ── Style Tab ── */}
            {rightTab === 'style' && (
              <div className="space-y-3">
                <p className="text-[10px] text-muted-foreground">Select a global style to influence chord suggestions and feel.</p>
                <div className="space-y-1.5">
                  {STYLE_PRESETS.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setHarmonicStyle(style.id)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                        harmonicStyle === style.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">{style.label}</span>
                        <span className="text-[9px] text-muted-foreground">{style.rhythmFeel}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{style.description}</p>
                    </button>
                  ))}
                </div>
                {harmonicStyle !== 'neutral' && (
                  <div className="p-2 rounded bg-primary/5 border border-primary/20">
                    <p className="text-[10px] text-primary">{getStyleSuggestions(harmonicStyle, root, mode)}</p>
                    <p className="text-[9px] text-muted-foreground mt-1">Preferred modes: {styleInfo?.preferredModes.join(', ')}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Suggestions Tab ── */}
            {rightTab === 'suggest' && (
              <div className="space-y-3">
                <p className="text-[10px] text-muted-foreground">Smart next-chord suggestions based on your progression.</p>
                {progression.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground/60 italic">Add at least one chord to get suggestions.</p>
                ) : (
                  <>
                    {(['safe', 'colorful', 'experimental'] as const).map(cat => {
                      const catSuggestions = suggestions.filter(s => s.category === cat);
                      if (catSuggestions.length === 0) return null;
                      return (
                        <div key={cat}>
                          <p className={`text-[10px] font-semibold mb-1.5 capitalize ${
                            cat === 'safe' ? 'text-green-400' : cat === 'colorful' ? 'text-violet-400' : 'text-orange-400'
                          }`}>
                            {cat === 'safe' ? '🟢' : cat === 'colorful' ? '🟣' : '🟠'} {cat}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {catSuggestions.map((s, i) => (
                              <button
                                key={i}
                                onClick={() => addChord(s.chord)}
                                disabled={lockProgression}
                                className={`flex flex-col items-center px-2.5 py-1.5 rounded-lg border transition-colors text-xs ${sourceColors[s.chord.source]} ${lockProgression ? 'opacity-40' : ''}`}
                              >
                                <span className="font-bold">{s.chord.chord.symbol}</span>
                                <span className="text-[8px] text-muted-foreground">{s.chord.chord.notes.join('-')}</span>
                                <span className="text-[7px] text-muted-foreground/60 italic">{s.reason}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM BAR: Expressive Controls ═══ */}
      <div className="border-t border-border bg-secondary/20 px-4 py-3">
        <div className="flex items-center gap-1 mb-2">
          <Sliders size={12} className="text-muted-foreground" />
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Expressive Controls</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Tension', value: tension, set: setTension, color: 'accent-red-500' },
            { label: 'Density', value: density, set: setDensity, color: 'accent-blue-500' },
            { label: 'Movement', value: movement, set: setMovement, color: 'accent-green-500' },
            { label: 'Brightness', value: brightness, set: setBrightness, color: 'accent-yellow-500' },
          ].map(slider => (
            <div key={slider.label} className="flex items-center gap-2">
              <label className="text-[10px] text-muted-foreground w-16 shrink-0">{slider.label}</label>
              <input
                type="range"
                min={0} max={100}
                value={slider.value}
                onChange={(e) => slider.set(Number(e.target.value))}
                className="flex-1 h-1 rounded-lg appearance-none bg-border cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
              />
              <span className="text-[10px] text-muted-foreground w-6 text-right">{slider.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChordProgressionBuilder;
