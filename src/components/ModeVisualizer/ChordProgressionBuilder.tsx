import { useState, useRef, useCallback, useMemo } from "react";
import {
  Play, Pause, X, RotateCcw, Sparkles, ArrowRightLeft,
  Music2, ChevronDown, ChevronUp, Download, ArrowLeft, ArrowRight,
  Lock, Unlock, Wand2, Globe2, Lightbulb, GripVertical,
  Undo2, Music, Settings2, ChevronRight, Sliders,
} from "lucide-react";
import { type ChordSpelling, getScaleNotes, getChordSpellings, MODE_INTERVALS, ALL_ROOTS, MODE_CATEGORIES } from "./scaleData";
import { type InstrumentTimbre, INSTRUMENT_TIMBRES } from "./audioSynth";
import {
  type ProgressionChord, type ChordSource, type RhythmicFeel, type HarmonicStyle,
  type ViewMode, type ChordFunction, type ExtensionLevel, type VoicingType, type ExpressiveParams,
  PROGRESSION_TEMPLATES, STYLE_PRESETS, RHYTHMIC_FEELS,
  EXTENSION_LEVELS, VOICING_TYPES, DEFAULT_EXPRESSIVE,
  sourceColors, sourceActiveColors, sourceDotColors, functionColors, functionDotColors,
  getSecondaryDominants, getTritoneSubs, getBorrowedChords, createIIV,
  transformProgression, getNextChordSuggestions,
  getRomanNumeral, getNashvilleNumber, getChordFunction,
  transposeChord, useFlatsForKey, applyExtensionLevel,
  playChordTonesExpressive, downloadMidi, getStyleSuggestions,
  NOTES_SHARP, NOTES_FLAT,
} from "./chordProgressionUtils";

interface ChordProgressionBuilderProps {
  chordSpellings: ChordSpelling[];
  root: string;
  mode: string;
}

const ChordProgressionBuilder = ({
  chordSpellings: _initialChordSpellings,
  root: initialRoot,
  mode: initialMode,
}: ChordProgressionBuilderProps) => {
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

  const [lockProgression, setLockProgression] = useState(false);
  const [lockRoots, setLockRoots] = useState(false);
  const [lockVoicing, setLockVoicing] = useState(false);

  const [showBorrowed, setShowBorrowed] = useState(false);
  const [showSecondaryDoms, setShowSecondaryDoms] = useState(false);
  const [showTritoneSubs, setShowTritoneSubs] = useState(false);
  const [expandedBorrowMode, setExpandedBorrowMode] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<'harmonic' | 'transform' | 'style' | 'suggest'>('harmonic');
  const [viewMode, setViewMode] = useState<ViewMode>('standard');
  const [showSettings, setShowSettings] = useState(false);
  const [showToolsPanel, setShowToolsPanel] = useState(false);
  const [centerTab, setCenterTab] = useState<'chords' | 'templates'>('chords');

  const [rhythmicFeel, setRhythmicFeel] = useState<RhythmicFeel>('straight');
  const [harmonicStyle, setHarmonicStyle] = useState<HarmonicStyle>('neutral');
  const [extensionLevel, setExtensionLevel] = useState<ExtensionLevel>('triad');
  const [voicingType, setVoicingType] = useState<VoicingType>('close');
  const [expressive, setExpressive] = useState<ExpressiveParams>(DEFAULT_EXPRESSIVE);
  const [showExpressive, setShowExpressive] = useState(false);

  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const root = localRoot;
  const mode = localMode;
  const localScaleNotes = useMemo(() => getScaleNotes(root, mode), [root, mode]);
  const chordSpellings = useMemo(() => getChordSpellings(localScaleNotes, mode), [localScaleNotes, mode]);
  const secondaryDoms = useMemo(() => getSecondaryDominants(root, mode, chordSpellings), [root, mode, chordSpellings]);
  const tritoneSubs = useMemo(() => getTritoneSubs(secondaryDoms), [secondaryDoms]);
  const borrowedGroups = useMemo(() => getBorrowedChords(root, mode, chordSpellings), [root, mode, chordSpellings]);
  const suggestions = useMemo(() => getNextChordSuggestions(progression, chordSpellings, root, mode), [progression, chordSpellings, root, mode]);
  const has7Notes = (MODE_INTERVALS[mode]?.length ?? 0) >= 7;

  const pushUndo = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-19), progression]);
  }, [progression]);

  const undo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      setProgression(prev[prev.length - 1]);
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
      ids.push(window.setTimeout(() => {
        setCurrentIdx(i);
        playChordTonesExpressive(pc.chord.notes, (chordDuration / 1000) * 0.9, timbre, voicingType, expressive);
      }, i * chordDuration));
    });
    ids.push(window.setTimeout(() => {
      if (looping) playProgression();
      else { setPlaying(false); setCurrentIdx(-1); }
    }, progression.length * chordDuration));
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
      const t = idx + direction;
      if (t < 0 || t >= next.length) return prev;
      [next[idx], next[t]] = [next[t], next[idx]];
      return next;
    });
  };

  const loadTemplate = (degrees: number[]) => {
    if (lockProgression) return;
    pushUndo();
    stop();
    setProgression(degrees.map(d => {
      const chord = chordSpellings[Math.min(d, chordSpellings.length - 1)];
      return { chord, source: 'diatonic' as ChordSource, function: getChordFunction(d, mode) };
    }));
  };

  const handleTranspose = (newRoot: string) => {
    if (newRoot === localRoot) return;
    if (progression.length > 0) {
      const oldIdx = NOTES_SHARP.indexOf(localRoot) !== -1 ? NOTES_SHARP.indexOf(localRoot) : NOTES_FLAT.indexOf(localRoot);
      const newIdx = NOTES_SHARP.indexOf(newRoot) !== -1 ? NOTES_SHARP.indexOf(newRoot) : NOTES_FLAT.indexOf(newRoot);
      const semitones = ((newIdx - oldIdx) % 12 + 12) % 12;
      const flats = useFlatsForKey(newRoot);
      pushUndo();
      stop();
      setProgression(prev => prev.map(pc => ({ ...pc, chord: transposeChord(pc.chord, semitones, flats) })));
    }
    setLocalRoot(newRoot);
  };

  const handleModeChange = (newMode: string) => {
    stop();
    setLocalMode(newMode);
    if (!lockProgression && progression.length > 0) {
      const newScale = getScaleNotes(root, newMode);
      const newChords = getChordSpellings(newScale, newMode);
      if (newChords.length > 0) {
        pushUndo();
        setProgression(prev => prev.map(pc => {
          const matchIdx = chordSpellings.findIndex(c => c.rootNote === pc.chord.rootNote);
          if (matchIdx !== -1 && matchIdx < newChords.length) {
            return { ...pc, chord: newChords[matchIdx], function: getChordFunction(matchIdx, newMode) };
          }
          return pc;
        }));
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
    const iiV = createIIV(progression[targetIdx].chord.rootNote, root);
    if (iiV.length === 0) return;
    pushUndo();
    setProgression(prev => { const n = [...prev]; n.splice(targetIdx, 0, ...iiV); return n; });
  };

  const handleDragStart = (idx: number) => { if (!lockProgression) setDragIdx(idx); };
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return; }
    pushUndo();
    setProgression(prev => { const n = [...prev]; const [m] = n.splice(dragIdx, 1); n.splice(idx, 0, m); return n; });
    setDragIdx(null); setDragOverIdx(null);
  };

  const getChordLabel = (pc: ProgressionChord, _idx: number) => {
    const di = chordSpellings.findIndex(c => c.rootNote === pc.chord.rootNote);
    if (viewMode === 'roman') return di >= 0 ? getRomanNumeral(pc.chord, di) : pc.chord.symbol;
    if (viewMode === 'nashville') return di >= 0 ? getNashvilleNumber(di, pc.chord) : pc.chord.symbol;
    return pc.chord.symbol;
  };

  const getSubLabel = (pc: ProgressionChord) => {
    const di = chordSpellings.findIndex(c => c.rootNote === pc.chord.rootNote);
    if (viewMode !== 'standard') return pc.chord.name;
    return di >= 0 ? getRomanNumeral(pc.chord, di) : '';
  };

  if (chordSpellings.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-1">Chord Progression Builder</h3>
        <p className="text-xs text-muted-foreground">No chords available for this scale. Try a 7-note mode.</p>
      </div>
    );
  }

  const styleInfo = STYLE_PRESETS.find(s => s.id === harmonicStyle);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* ═══ COMPACT HEADER BAR ═══ */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-border bg-secondary/20">
        <Music size={14} className="text-primary shrink-0" />
        <span className="text-sm font-semibold mr-auto">Chord Progression</span>

        {/* Key + Mode inline */}
        <select value={localRoot} onChange={(e) => handleTranspose(e.target.value)}
          className="bg-background border border-border rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-12">
          {ALL_ROOTS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {progression.length > 0 && (
          <>
            <button onClick={() => { const ci = ALL_ROOTS.indexOf(localRoot); handleTranspose(ALL_ROOTS[(ci - 1 + ALL_ROOTS.length) % ALL_ROOTS.length]); }} className="w-5 h-5 flex items-center justify-center rounded border border-border bg-background text-foreground hover:bg-accent text-[10px] font-bold">−</button>
            <button onClick={() => { const ci = ALL_ROOTS.indexOf(localRoot); handleTranspose(ALL_ROOTS[(ci + 1) % ALL_ROOTS.length]); }} className="w-5 h-5 flex items-center justify-center rounded border border-border bg-background text-foreground hover:bg-accent text-[10px] font-bold">+</button>
          </>
        )}
        <select value={localMode} onChange={(e) => handleModeChange(e.target.value)}
          className="bg-background border border-border rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring max-w-[130px]">
          {MODE_CATEGORIES.map(cat => (
            <optgroup key={cat.label} label={cat.label}>
              {cat.modes.map(m => <option key={m} value={m}>{m}</option>)}
            </optgroup>
          ))}
        </select>

        {/* View toggle */}
        <div className="flex items-center gap-0.5">
          {(['standard', 'roman', 'nashville'] as ViewMode[]).map(vm => (
            <button key={vm} onClick={() => setViewMode(vm)}
              className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${viewMode === vm ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
              {vm === 'standard' ? 'Name' : vm === 'roman' ? 'ⅣⅤ' : '#'}
            </button>
          ))}
        </div>

        {/* Settings gear */}
        <button onClick={() => setShowSettings(!showSettings)}
          className={`w-6 h-6 flex items-center justify-center rounded border transition-colors ${showSettings ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
          <Settings2 size={12} />
        </button>
      </div>

      {/* ═══ COLLAPSIBLE SETTINGS ROW ═══ */}
      {showSettings && (
        <div className="flex flex-wrap items-center gap-3 px-3 py-2 border-b border-border bg-secondary/10 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground text-[10px]">Sound</span>
            <select value={timbre} onChange={(e) => setTimbre(e.target.value as InstrumentTimbre)}
              className="bg-background border border-border rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none">
              {INSTRUMENT_TIMBRES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground text-[10px]">BPM</span>
            <input type="number" value={bpm} min={40} max={300}
              onChange={(e) => setBpm(Math.min(300, Math.max(40, Number(e.target.value) || 40)))}
              className="w-12 bg-background border border-border rounded px-1 py-0.5 text-xs text-foreground text-center focus:outline-none" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground text-[10px]">Feel</span>
            <select value={rhythmicFeel} onChange={(e) => {
                const feel = e.target.value as RhythmicFeel;
                setRhythmicFeel(feel);
                const fd = RHYTHMIC_FEELS.find(f => f.id === feel);
                if (fd) setBeatsPerChord(fd.beats);
              }}
              className="bg-background border border-border rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none">
              {RHYTHMIC_FEELS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
          <div className="h-4 w-px bg-border" />
          {[
            { l: 'Prog', v: lockProgression, s: setLockProgression },
            { l: 'Root', v: lockRoots, s: setLockRoots },
            { l: 'Voice', v: lockVoicing, s: setLockVoicing },
          ].map(lk => (
            <button key={lk.l} onClick={() => lk.s(!lk.v)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] transition-colors ${lk.v ? 'border-amber-500/50 bg-amber-500/10 text-amber-300' : 'border-border text-muted-foreground hover:bg-accent'}`}>
              {lk.v ? <Lock size={8} /> : <Unlock size={8} />} {lk.l}
            </button>
          ))}
        </div>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex flex-col lg:flex-row">
        {/* ── CENTER: Progression + Chords ── */}
        <div className="flex-1 min-w-0 p-3">
          {/* Progression Timeline */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Progression</p>
              <div className="flex items-center gap-1">
                {undoStack.length > 0 && (
                  <button onClick={undo} className="text-[9px] px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:bg-accent flex items-center gap-0.5">
                    <Undo2 size={8} /> Undo
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[52px] p-2 rounded-lg border border-dashed border-border bg-secondary/30">
              {progression.length === 0 ? (
                <p className="text-[10px] text-muted-foreground italic self-center">Click chords below to build…</p>
              ) : (
                progression.map((pc, i) => {
                  const cf = pc.function || (chordSpellings.findIndex(c => c.rootNote === pc.chord.rootNote) >= 0
                    ? getChordFunction(chordSpellings.findIndex(c => c.rootNote === pc.chord.rootNote), mode) : 'other');
                  return (
                    <div key={i} draggable={!lockProgression}
                      onDragStart={() => handleDragStart(i)} onDragOver={(e) => handleDragOver(e, i)}
                      onDrop={() => handleDrop(i)} onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                      onClick={() => setEditingIdx(editingIdx === i ? null : i)}
                      className={`relative group flex flex-col items-center px-2.5 py-1.5 rounded border text-xs transition-all cursor-pointer select-none ${
                        dragOverIdx === i ? 'ring-1 ring-primary' : ''} ${dragIdx === i ? 'opacity-40' : ''} ${
                        currentIdx === i ? `${sourceActiveColors[pc.source]} scale-105 shadow-md`
                          : `border-border bg-card hover:border-muted-foreground ${functionColors[cf]}`}`}>
                      <div className={`absolute top-0.5 right-0.5 w-1 h-1 rounded-full ${functionDotColors[cf]}`} />
                      {!lockProgression && (
                        <div className="absolute -top-1.5 left-0 right-0 flex items-center justify-center gap-px opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          {i > 0 && <button onClick={(e) => { e.stopPropagation(); moveChord(i, -1); }} className="w-3.5 h-3.5 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-accent"><ArrowLeft size={6} /></button>}
                          <button onClick={(e) => { e.stopPropagation(); removeChord(i); }} className="w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"><X size={6} /></button>
                          {i < progression.length - 1 && <button onClick={(e) => { e.stopPropagation(); moveChord(i, 1); }} className="w-3.5 h-3.5 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-accent"><ArrowRight size={6} /></button>}
                          {has7Notes && <button onClick={(e) => { e.stopPropagation(); insertIIV(i); }} className="w-3.5 h-3.5 rounded-full bg-pink-500/80 text-white flex items-center justify-center text-[6px] font-bold" title="Insert ii-V">ii</button>}
                        </div>
                      )}
                      <div className="flex items-center gap-0.5">
                        <span className={`w-1 h-1 rounded-full ${sourceDotColors[pc.source]}`} />
                        <span className="font-bold text-xs">{getChordLabel(pc, i)}</span>
                      </div>
                      <span className="text-[8px] text-muted-foreground leading-tight">{getSubLabel(pc)}</span>
                      {pc.source !== 'diatonic' && <span className="text-[7px] text-muted-foreground/50 italic">{pc.sourceLabel}</span>}
                    </div>
                  );
                })
              )}
            </div>
            {/* Compact legend */}
            {progression.some(p => p.source !== 'diatonic') && (
              <div className="flex flex-wrap gap-2 mt-1 text-[8px] text-muted-foreground">
                {progression.some(p => p.source === 'borrowed') && <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-violet-500" />Borrowed</span>}
                {progression.some(p => p.source === 'secondary-dom') && <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-sky-500" />Sec.Dom</span>}
                {progression.some(p => p.source === 'tritone-sub') && <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />TT Sub</span>}
                {progression.some(p => p.source === 'inserted') && <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-pink-500" />ii-V</span>}
                {progression.some(p => p.source === 'transformed') && <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" />Trans.</span>}
              </div>
            )}
          </div>

          {/* Chord Edit Popup (inline, compact) */}
          {editingIdx !== null && editingIdx < progression.length && (
            <div className="mb-3 p-2 rounded border border-primary/30 bg-primary/5 flex flex-wrap items-center gap-3 text-xs">
              <span className="font-semibold">{progression[editingIdx].chord.symbol}</span>
              <span className="text-muted-foreground">{progression[editingIdx].chord.notes.join('-')}</span>
              <span className="text-muted-foreground capitalize">{progression[editingIdx].function || 'other'}</span>
              <div className="flex gap-1 ml-auto">
                <button onClick={() => playChordTonesExpressive(progression[editingIdx].chord.notes, 0.8, timbre, voicingType, expressive)} className="px-1.5 py-0.5 rounded border border-border hover:bg-accent text-[10px]">▶</button>
                <button onClick={() => removeChord(editingIdx)} className="px-1.5 py-0.5 rounded border border-destructive/50 text-destructive hover:bg-destructive/10 text-[10px]">Del</button>
                {has7Notes && <button onClick={() => { insertIIV(editingIdx); setEditingIdx(null); }} className="px-1.5 py-0.5 rounded border border-pink-500/50 text-pink-400 hover:bg-pink-500/10 text-[10px]">ii-V</button>}
                <button onClick={() => setEditingIdx(null)} className="text-muted-foreground hover:text-foreground"><X size={12} /></button>
              </div>
            </div>
          )}

          {/* Tabbed: Diatonic / Templates */}
          <div className="mb-3">
            <div className="flex items-center gap-1 mb-1.5">
              {([
                { id: 'chords' as const, label: 'Diatonic' },
                { id: 'templates' as const, label: 'Templates' },
              ]).map(t => (
                <button key={t.id} onClick={() => setCenterTab(t.id)}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${centerTab === t.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {centerTab === 'chords' && (
              <div className="flex flex-wrap gap-1">
                {chordSpellings.map((chord, i) => {
                  const func = getChordFunction(i, mode);
                  return (
                    <button key={i} onClick={() => addChord({ chord, source: 'diatonic', function: func })}
                      disabled={lockProgression}
                      className={`flex flex-col items-center px-2 py-1 rounded border transition-colors text-xs ${sourceColors['diatonic']} ${lockProgression ? 'opacity-40 cursor-not-allowed' : ''}`}>
                      <span className="text-[8px] text-muted-foreground/60">{getRomanNumeral(chord, i)}</span>
                      <span className="font-bold text-[11px]">{chord.symbol}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {centerTab === 'templates' && (
              <div className="flex flex-wrap gap-1">
                {PROGRESSION_TEMPLATES.filter(t => t.degrees.every(d => d < chordSpellings.length)).map(t => (
                  <button key={t.label} onClick={() => loadTemplate(t.degrees)} disabled={lockProgression}
                    className={`text-[10px] px-2 py-1 rounded border border-border hover:bg-accent text-muted-foreground ${lockProgression ? 'opacity-40' : ''}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Playback Controls — compact row */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border">
            <button onClick={() => (playing ? stop() : playProgression())} disabled={progression.length === 0}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-40 ${playing ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}`}>
              {playing ? <Pause size={12} /> : <Play size={12} />}
              {playing ? 'Stop' : 'Play'}
            </button>
            <button onClick={() => setLooping(!looping)}
              className={`text-[10px] px-2 py-1 rounded border transition-colors ${looping ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground'}`}>
              🔁
            </button>
            <button onClick={() => { stop(); pushUndo(); setProgression([]); }} disabled={lockProgression || progression.length === 0}
              className="text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:bg-accent disabled:opacity-40">
              <RotateCcw size={10} />
            </button>
            <button onClick={() => downloadMidi(progression, bpm, beatsPerChord, root, mode)} disabled={progression.length === 0}
              className="flex items-center gap-0.5 text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:bg-accent disabled:opacity-40">
              <Download size={10} /> MIDI
            </button>
            <div className="ml-auto">
              <button onClick={() => setShowToolsPanel(!showToolsPanel)}
                className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded border transition-colors ${showToolsPanel ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
                <Sparkles size={10} /> Tools
                <ChevronRight size={10} className={`transition-transform ${showToolsPanel ? 'rotate-90' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: Collapsible Tools ── */}
        {showToolsPanel && (
          <div className="w-full lg:w-64 shrink-0 border-t lg:border-t-0 lg:border-l border-border bg-secondary/10">
            <div className="flex border-b border-border">
              {([
                { id: 'harmonic' as const, icon: Sparkles, label: '♯' },
                { id: 'transform' as const, icon: Wand2, label: '✦' },
                { id: 'style' as const, icon: Globe2, label: '🌍' },
                { id: 'suggest' as const, icon: Lightbulb, label: '💡' },
              ]).map(tab => (
                <button key={tab.id} onClick={() => setRightTab(tab.id)}
                  className={`flex-1 text-center text-[10px] py-1.5 border-b-2 transition-colors ${
                    rightTab === tab.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-2 max-h-[360px] overflow-y-auto space-y-2 text-xs">
              {/* Harmonic */}
              {rightTab === 'harmonic' && (
                <>
                  {has7Notes && borrowedGroups.length > 0 && (
                    <div>
                      <button onClick={() => { setShowBorrowed(!showBorrowed); if (showBorrowed) setExpandedBorrowMode(null); }}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded border text-[10px] ${showBorrowed ? 'border-violet-500 bg-violet-500/15 text-violet-300' : 'border-border text-muted-foreground'}`}>
                        <span className="flex items-center gap-1"><Music2 size={10} /> Borrowed</span>
                        {showBorrowed ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                      </button>
                      {showBorrowed && (
                        <div className="mt-1 space-y-1">
                          <div className="flex flex-wrap gap-0.5">
                            {borrowedGroups.map(g => (
                              <button key={g.mode} onClick={() => setExpandedBorrowMode(expandedBorrowMode === g.mode ? null : g.mode)}
                                className={`text-[9px] px-1.5 py-0.5 rounded border ${expandedBorrowMode === g.mode ? 'border-violet-500/60 bg-violet-500/10 text-violet-300' : 'border-border text-muted-foreground'}`}>
                                {g.mode} ({g.chords.length})
                              </button>
                            ))}
                          </div>
                          {expandedBorrowMode && (
                            <div className="flex flex-wrap gap-1 p-1.5 rounded bg-violet-500/5 border border-violet-500/20">
                              {borrowedGroups.find(g => g.mode === expandedBorrowMode)?.chords.map((pc, i) => (
                                <button key={i} onClick={() => addChord(pc)} disabled={lockProgression}
                                  className={`flex flex-col items-center px-2 py-1 rounded border ${sourceColors['borrowed']} text-[10px] ${lockProgression ? 'opacity-40' : ''}`}>
                                  <span className="font-bold">{pc.chord.symbol}</span>
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
                      <button onClick={() => setShowSecondaryDoms(!showSecondaryDoms)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded border text-[10px] ${showSecondaryDoms ? 'border-sky-500 bg-sky-500/15 text-sky-300' : 'border-border text-muted-foreground'}`}>
                        <span className="flex items-center gap-1"><ArrowRightLeft size={10} /> Sec. Dom.</span>
                        {showSecondaryDoms ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                      </button>
                      {showSecondaryDoms && (
                        <div className="mt-1 flex flex-wrap gap-1 p-1.5 rounded bg-sky-500/5 border border-sky-500/20">
                          {secondaryDoms.map((pc, i) => (
                            <button key={i} onClick={() => addChord(pc)} disabled={lockProgression}
                              className={`flex flex-col items-center px-2 py-1 rounded border ${sourceColors['secondary-dom']} text-[10px] ${lockProgression ? 'opacity-40' : ''}`}>
                              <span className="font-bold">{pc.chord.symbol}</span>
                              <span className="text-[7px] text-sky-400/60">{pc.sourceLabel}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {has7Notes && tritoneSubs.length > 0 && (
                    <div>
                      <button onClick={() => setShowTritoneSubs(!showTritoneSubs)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded border text-[10px] ${showTritoneSubs ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300' : 'border-border text-muted-foreground'}`}>
                        <span className="flex items-center gap-1"><Sparkles size={10} /> Tritone Subs</span>
                        {showTritoneSubs ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                      </button>
                      {showTritoneSubs && (
                        <div className="mt-1 flex flex-wrap gap-1 p-1.5 rounded bg-emerald-500/5 border border-emerald-500/20">
                          {tritoneSubs.map((pc, i) => (
                            <button key={i} onClick={() => addChord(pc)} disabled={lockProgression}
                              className={`flex flex-col items-center px-2 py-1 rounded border ${sourceColors['tritone-sub']} text-[10px] ${lockProgression ? 'opacity-40' : ''}`}>
                              <span className="font-bold">{pc.chord.symbol}</span>
                              <span className="text-[7px] text-emerald-400/60">{pc.sourceLabel}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {!has7Notes && <p className="text-[10px] text-muted-foreground/60 italic">Use 7-note scales for harmonic tools.</p>}
                </>
              )}

              {/* Transform */}
              {rightTab === 'transform' && (
                <>
                  {progression.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground/60 italic">Add chords first.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: 'jazzy', label: 'Jazzy', icon: '🎷' },
                        { id: 'modal', label: 'Modal', icon: '🌀' },
                        { id: 'dark', label: 'Dark', icon: '🌑' },
                        { id: 'tension', label: 'Tension', icon: '⚡' },
                        { id: 'simplify', label: 'Simple', icon: '✨' },
                        { id: 'expand', label: 'Expand', icon: '🎆' },
                      ].map(t => (
                        <button key={t.id} onClick={() => applyTransform(t.id)} disabled={lockProgression}
                          className={`flex flex-col items-center gap-0.5 p-1.5 rounded border border-border hover:border-orange-500/50 hover:bg-orange-500/5 text-[10px] ${lockProgression ? 'opacity-40' : ''}`}>
                          <span>{t.icon}</span>
                          <span className="text-foreground">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {undoStack.length > 0 && (
                    <button onClick={undo} className="w-full flex items-center justify-center gap-1 text-[10px] px-2 py-1 rounded border border-border hover:bg-accent text-muted-foreground">
                      <Undo2 size={10} /> Undo
                    </button>
                  )}
                </>
              )}

              {/* Style */}
              {rightTab === 'style' && (
                <div className="space-y-1">
                  {STYLE_PRESETS.map(style => (
                    <button key={style.id} onClick={() => setHarmonicStyle(style.id)}
                      className={`w-full text-left px-2 py-1.5 rounded border text-[10px] transition-colors ${harmonicStyle === style.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'}`}>
                      <span className="font-medium text-foreground">{style.label}</span>
                      <span className="text-muted-foreground ml-1">{style.rhythmFeel}</span>
                    </button>
                  ))}
                  {harmonicStyle !== 'neutral' && (
                    <div className="p-1.5 rounded bg-primary/5 border border-primary/20 text-[9px] text-primary">
                      {getStyleSuggestions(harmonicStyle, root, mode)}
                    </div>
                  )}
                </div>
              )}

              {/* Suggest */}
              {rightTab === 'suggest' && (
                <>
                  {progression.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground/60 italic">Add chords for suggestions.</p>
                  ) : (
                    <div className="space-y-2">
                      {(['safe', 'colorful', 'experimental'] as const).map(cat => {
                        const cs = suggestions.filter(s => s.category === cat);
                        if (cs.length === 0) return null;
                        return (
                          <div key={cat}>
                            <p className={`text-[9px] font-semibold mb-1 ${cat === 'safe' ? 'text-green-400' : cat === 'colorful' ? 'text-violet-400' : 'text-orange-400'}`}>
                              {cat === 'safe' ? '🟢' : cat === 'colorful' ? '🟣' : '🟠'} {cat}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {cs.map((s, i) => (
                                <button key={i} onClick={() => addChord(s.chord)} disabled={lockProgression}
                                  className={`flex flex-col items-center px-2 py-1 rounded border ${sourceColors[s.chord.source]} text-[10px] ${lockProgression ? 'opacity-40' : ''}`}>
                                  <span className="font-bold">{s.chord.chord.symbol}</span>
                                  <span className="text-[7px] text-muted-foreground/60">{s.reason}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChordProgressionBuilder;
