import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Play, Pause, X, Download, Sparkles, Sun, Moon, Maximize2, Minimize2, RotateCcw, Plus, ChevronDown, ChevronUp, Zap, Usb, Radio } from "lucide-react";
import {
  requestMidiAccess, selectOutput, isConnected, getActiveOutput, disconnect as midiDisconnect,
  sendChord as midiSendChord, sendSingleNote as midiSendNote, sendAllNotesOff,
  type MidiOutputDevice,
} from "./webMidiOut";
import { playChord, playNote, type InstrumentTimbre } from "./audioSynth";
import {
  ALL_NOTES, noteIndex, normalize,
  type TonnetzTriadData, type GridTriad, type TonnetzNode, type TransformType,
  triadLabel, makeTriad, applyTransform,
  TRANSFORMS, HARMONIC_SYSTEMS, TONNETZ_PRESETS,
  suggestNextChords, modulateTo, computeHeatmap,
  buildGrid, findGridTriads, NOTE_COLORS,
  type SuggestionFlavor,
} from "./tonnetzUtils";
import { downloadMidi } from "./chordProgressionUtils";

// ─── Config ─────────────────────────────────────────────────
const COLS = 12;
const ROWS = 6;
const HEX_RADIUS_NORMAL = 28;
const HEX_RADIUS_PERF = 42;

interface TonnetzProps {
  scaleNotes?: string[];
  root?: string;
  timbre?: InstrumentTimbre;
  onAddToProgression?: (notes: string[], symbol: string) => void;
  highlightedChordNotes?: number[] | null;
}

const Tonnetz = ({ scaleNotes = [], root = 'C', timbre = 'piano', onAddToProgression, highlightedChordNotes }: TonnetzProps) => {
  // ─── State ──────────────────────────────────────────────
  const [hoveredTriad, setHoveredTriad] = useState<GridTriad | null>(null);
  const [activeTriad, setActiveTriad] = useState<TonnetzTriadData | null>(null);
  const [showTriads, setShowTriads] = useState(true);
  const [colorMode, setColorMode] = useState<'scale' | 'pitch' | 'heatmap'>('scale');
  const [performanceMode, setPerformanceMode] = useState(false);
  const [harmonicSystem, setHarmonicSystem] = useState('none');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showTransforms, setShowTransforms] = useState(true);
  const [animatingTransform, setAnimatingTransform] = useState<{ from: TonnetzTriadData; to: TonnetzTriadData; type: TransformType } | null>(null);

  // Progression sidebar
  const [progression, setProgression] = useState<TonnetzTriadData[]>([]);
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [looping, setLooping] = useState(false);
  const [bpm, setBpm] = useState(100);
  const [showProgPanel, setShowProgPanel] = useState(true);
  const timeoutRef = useRef<number[]>([]);

  // MIDI output
  const [midiEnabled, setMidiEnabled] = useState(false);
  const [midiDevices, setMidiDevices] = useState<MidiOutputDevice[]>([]);
  const [midiChannel, setMidiChannel] = useState(0);
  const [midiError, setMidiError] = useState<string | null>(null);

  const hexRadius = performanceMode ? HEX_RADIUS_PERF : HEX_RADIUS_NORMAL;

  // ─── MIDI init ──────────────────────────────────────────
  const initMidi = useCallback(async () => {
    try {
      setMidiError(null);
      const devices = await requestMidiAccess();
      setMidiDevices(devices);
      if (devices.length > 0) {
        selectOutput(devices[0].id);
        setMidiEnabled(true);
      } else {
        setMidiError('No MIDI output devices found');
      }
    } catch (err) {
      setMidiError(err instanceof Error ? err.message : 'MIDI not available');
    }
  }, []);

  const handleMidiDeviceChange = useCallback((deviceId: string) => {
    selectOutput(deviceId);
  }, []);

  const handleMidiDisconnect = useCallback(() => {
    midiDisconnect();
    setMidiEnabled(false);
    setMidiDevices([]);
  }, []);
  const rootIdx = noteIndex(root);

  const systemScale = useMemo(() => {
    if (harmonicSystem === 'none') return null;
    const sys = HARMONIC_SYSTEMS.find(s => s.id === harmonicSystem);
    return sys ? new Set(sys.getScaleNotes(rootIdx)) : null;
  }, [harmonicSystem, rootIdx]);

  const scaleSet = useMemo(() => {
    if (systemScale) return systemScale;
    return new Set(scaleNotes.map(n => noteIndex(n)));
  }, [scaleNotes, systemScale]);

  const nodes = useMemo(() => buildGrid(COLS, ROWS, hexRadius), [hexRadius]);
  const gridTriads = useMemo(() => findGridTriads(nodes), [nodes]);
  const scaleTriads = useMemo(() => {
    if (!showTriads) return [];
    return gridTriads.filter(t => t.notes.every(n => scaleSet.has(n)));
  }, [gridTriads, showTriads, scaleSet]);

  const heatmap = useMemo(() => computeHeatmap(progression), [progression]);
  const maxHeat = useMemo(() => Math.max(1, ...heatmap.values()), [heatmap]);

  const suggestions = useMemo(() => {
    if (!showSuggestions || !activeTriad) return [];
    return suggestNextChords(activeTriad, scaleSet);
  }, [showSuggestions, activeTriad, scaleSet]);

  // External highlighted chord (from progression builder)
  const externalHighlight = useMemo(() => {
    if (!highlightedChordNotes) return new Set<number>();
    return new Set(highlightedChordNotes);
  }, [highlightedChordNotes]);

  const svgWidth = COLS * hexRadius * 1.85 + hexRadius + 20;
  const svgHeight = ROWS * hexRadius * 1.6 + hexRadius + 20;

  // ─── Helpers ────────────────────────────────────────────
  const isInScale = useCallback((idx: number) => scaleSet.has(idx), [scaleSet]);

  const hexPath = (cx: number, cy: number, r: number) => {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return `M${pts.join('L')}Z`;
  };

  // ─── Node colors ───────────────────────────────────────
  const getNodeFill = useCallback((node: TonnetzNode) => {
    const inScale = isInScale(node.noteIdx);
    const isRoot = node.noteIdx === rootIdx;
    const isHovered = hoveredTriad?.notes.includes(node.noteIdx);
    const isActive = activeTriad?.notes.includes(node.noteIdx);
    const isExtHighlight = externalHighlight.has(node.noteIdx);

    if (colorMode === 'heatmap') {
      const heat = heatmap.get(node.noteIdx) || 0;
      if (heat === 0) return 'hsl(var(--muted))';
      const intensity = heat / maxHeat;
      return `hsl(${30 - intensity * 30}, ${60 + intensity * 40}%, ${25 + intensity * 35}%)`;
    }

    if (isExtHighlight) return NOTE_COLORS[node.noteIdx];
    if (isHovered || isActive) return NOTE_COLORS[node.noteIdx];

    if (colorMode === 'pitch') {
      return inScale ? NOTE_COLORS[node.noteIdx] : 'hsl(var(--muted))';
    }

    if (isRoot) return 'hsl(var(--primary))';
    if (inScale) return 'hsl(var(--accent))';
    return 'hsl(var(--muted))';
  }, [isInScale, rootIdx, hoveredTriad, activeTriad, colorMode, heatmap, maxHeat, externalHighlight]);

  const getNodeTextColor = useCallback((node: TonnetzNode) => {
    const inScale = isInScale(node.noteIdx);
    const isRoot = node.noteIdx === rootIdx;
    const isHovered = hoveredTriad?.notes.includes(node.noteIdx);
    const isActive = activeTriad?.notes.includes(node.noteIdx);
    const isExtHighlight = externalHighlight.has(node.noteIdx);

    if (isExtHighlight || isHovered || isActive || (colorMode === 'pitch' && inScale) || colorMode === 'heatmap') return '#fff';
    if (isRoot) return 'hsl(var(--primary-foreground))';
    if (inScale) return 'hsl(var(--accent-foreground))';
    return 'hsl(var(--muted-foreground))';
  }, [isInScale, rootIdx, hoveredTriad, activeTriad, colorMode, externalHighlight]);

  // ─── Interactions ──────────────────────────────────────
  const handleNodeClick = useCallback((node: TonnetzNode) => {
    playNote(node.note, 0, 0.5, timbre);
    if (midiEnabled && isConnected()) midiSendNote(node.note, 500, 100, midiChannel);
  }, [timbre, midiEnabled, midiChannel]);

  const handleTriadClick = useCallback((triad: GridTriad) => {
    const chordNotes = triad.notes.map(i => ALL_NOTES[i]);
    playChord(chordNotes, 0.6, timbre);
    const td: TonnetzTriadData = { root: triad.root, type: triad.type, notes: triad.notes };
    setActiveTriad(td);
  }, [timbre]);

  const addTriadToProgression = useCallback((td: TonnetzTriadData) => {
    setProgression(prev => [...prev, td]);
    // Also notify parent if available
    if (onAddToProgression) {
      const notes = td.notes.map(i => ALL_NOTES[i]);
      onAddToProgression(notes, triadLabel(td));
    }
  }, [onAddToProgression]);

  const handleTransform = useCallback((type: TransformType) => {
    if (!activeTriad) return;
    const result = applyTransform(activeTriad, type);
    setAnimatingTransform({ from: activeTriad, to: result, type });
    // Play the result
    const chordNotes = result.notes.map(i => ALL_NOTES[i]);
    playChord(chordNotes, 0.6, timbre);
    setTimeout(() => {
      setActiveTriad(result);
      setAnimatingTransform(null);
    }, 400);
  }, [activeTriad, timbre]);

  const handleModulate = useCallback((direction: 'darker' | 'brighter' | 'distant') => {
    if (!activeTriad) return;
    const result = modulateTo(activeTriad, direction);
    const chordNotes = result.notes.map(i => ALL_NOTES[i]);
    playChord(chordNotes, 0.6, timbre);
    setActiveTriad(result);
  }, [activeTriad, timbre]);

  // ─── Playback ─────────────────────────────────────────
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
    const chordDuration = (60 / bpm) * 4 * 1000;
    const ids: number[] = [];
    progression.forEach((td, i) => {
      ids.push(window.setTimeout(() => {
        setCurrentIdx(i);
        const notes = td.notes.map(n => ALL_NOTES[n]);
        playChord(notes, (chordDuration / 1000) * 0.9, timbre);
      }, i * chordDuration));
    });
    ids.push(window.setTimeout(() => {
      if (looping) playProgression();
      else { setPlaying(false); setCurrentIdx(-1); }
    }, progression.length * chordDuration));
    timeoutRef.current = ids;
  }, [progression, bpm, stop, timbre, looping]);

  useEffect(() => { return () => { timeoutRef.current.forEach(clearTimeout); }; }, []);

  const handleExportMidi = useCallback(() => {
    if (progression.length === 0) return;
    const chords = progression.map(td => ({
      symbol: triadLabel(td),
      notes: td.notes.map(i => ALL_NOTES[i]),
      rootNote: ALL_NOTES[td.root],
      name: triadLabel(td),
      intervals: [],
    }));
    const progChords = chords.map(c => ({ chord: c, source: 'diatonic' as const }));
    downloadMidi(progChords, bpm, 4, ALL_NOTES[rootIdx], 'tonnetz');
  }, [progression, bpm]);

  const loadPreset = useCallback((triads: TonnetzTriadData[]) => {
    // Transpose preset to current root
    const offset = rootIdx;
    const transposed = triads.map(t => makeTriad((t.root + offset) % 12, t.type));
    setProgression(transposed);
    if (transposed.length > 0) setActiveTriad(transposed[0]);
  }, [rootIdx]);

  const flavorColors: Record<SuggestionFlavor, string> = {
    safe: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',
    colorful: 'border-amber-500/50 bg-amber-500/10 text-amber-300',
    dark: 'border-violet-500/50 bg-violet-500/10 text-violet-300',
    bright: 'border-sky-500/50 bg-sky-500/10 text-sky-300',
    distant: 'border-rose-500/50 bg-rose-500/10 text-rose-300',
  };

  return (
    <div className="space-y-4">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <h3 className="text-lg font-semibold text-foreground">Tonnetz — Harmonic Navigation</h3>
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          <button onClick={() => setPerformanceMode(!performanceMode)}
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded border transition-colors ${performanceMode ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
            {performanceMode ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
            {performanceMode ? 'Standard' : 'Performance'}
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
        A <strong>playable harmonic navigation system</strong>. Click triads to hear and select them,
        apply Neo-Riemannian transforms (P, L, R) to explore harmonic space, and build progressions by adding chords.
      </p>

      {/* ═══ CONTROLS BAR ═══ */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg border border-border bg-card text-xs">
        <label className="flex items-center gap-1.5 text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={showTriads} onChange={(e) => setShowTriads(e.target.checked)} className="rounded border-border" />
          Triads
        </label>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Color:</span>
          <select value={colorMode} onChange={(e) => setColorMode(e.target.value as typeof colorMode)}
            className="bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground">
            <option value="scale">Scale</option>
            <option value="pitch">Pitch class</option>
            <option value="heatmap">Heatmap</option>
          </select>
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">System:</span>
          <select value={harmonicSystem} onChange={(e) => setHarmonicSystem(e.target.value)}
            className="bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground">
            <option value="none">From scale</option>
            {HARMONIC_SYSTEMS.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ═══ MAIN LAYOUT: SVG + Sidebar ═══ */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* ── SVG Grid ── */}
        <div className="flex-1 min-w-0">
          <div className="overflow-x-auto rounded-lg border border-border bg-card p-2">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full mx-auto"
              style={{ minWidth: performanceMode ? 700 : 500 }}
            >
              {/* Triad triangles */}
              {scaleTriads.map((triad, i) => {
                const [a, b, c] = triad.nodes;
                const isHovered = hoveredTriad === triad;
                const isActiveTriadMatch = activeTriad && triad.root === activeTriad.root && triad.type === activeTriad.type;
                const isAnimTarget = animatingTransform?.to && triad.root === animatingTransform.to.root && triad.type === animatingTransform.to.type;
                const isExtMatch = externalHighlight.size > 0 && triad.notes.every(n => externalHighlight.has(n));

                return (
                  <polygon
                    key={`triad-${i}`}
                    points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}`}
                    fill={
                      isAnimTarget ? 'rgba(250,204,21,0.35)' :
                      isActiveTriadMatch ? (triad.type === 'major' ? 'rgba(59,130,246,0.3)' : 'rgba(244,63,94,0.3)') :
                      isExtMatch ? 'rgba(250,204,21,0.25)' :
                      triad.type === 'major' ? 'rgba(59,130,246,0.12)' : 'rgba(244,63,94,0.12)'
                    }
                    stroke={
                      isAnimTarget ? '#facc15' :
                      isActiveTriadMatch ? (triad.type === 'major' ? '#3b82f6' : '#f43f5e') :
                      isExtMatch ? '#facc15' :
                      triad.type === 'major' ? '#3b82f6' : '#f43f5e'
                    }
                    strokeWidth={isHovered || isActiveTriadMatch || isAnimTarget ? 2.5 : 1}
                    opacity={isHovered || isActiveTriadMatch || isAnimTarget || isExtMatch ? 1 : 0.4}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredTriad(triad)}
                    onMouseLeave={() => setHoveredTriad(null)}
                    onClick={() => handleTriadClick(triad)}
                  />
                );
              })}

              {/* Connection lines */}
              {nodes.map((node) => {
                const right = nodes.find(n => n.q === node.q + 1 && n.r === node.r);
                if (!right) return null;
                const both = isInScale(node.noteIdx) && isInScale(right.noteIdx);
                return (
                  <line key={`h-${node.q}-${node.r}`}
                    x1={node.x} y1={node.y} x2={right.x} y2={right.y}
                    stroke={both ? 'hsl(var(--border))' : 'hsl(var(--border) / 0.3)'} strokeWidth={0.8} />
                );
              })}
              {nodes.map((node) => {
                const up = node.r % 2 === 0
                  ? nodes.find(n => n.q === node.q && n.r === node.r + 1)
                  : nodes.find(n => n.q === node.q + 1 && n.r === node.r + 1);
                const upLeft = node.r % 2 === 0
                  ? nodes.find(n => n.q === node.q - 1 && n.r === node.r + 1)
                  : nodes.find(n => n.q === node.q && n.r === node.r + 1);
                const lines = [];
                if (up) {
                  const both = isInScale(node.noteIdx) && isInScale(up.noteIdx);
                  lines.push(<line key={`ur-${node.q}-${node.r}`} x1={node.x} y1={node.y} x2={up.x} y2={up.y}
                    stroke={both ? 'hsl(var(--border))' : 'hsl(var(--border) / 0.3)'} strokeWidth={0.8} />);
                }
                if (upLeft) {
                  const both = isInScale(node.noteIdx) && isInScale(upLeft.noteIdx);
                  lines.push(<line key={`ul-${node.q}-${node.r}`} x1={node.x} y1={node.y} x2={upLeft.x} y2={upLeft.y}
                    stroke={both ? 'hsl(var(--border))' : 'hsl(var(--border) / 0.3)'} strokeWidth={0.8} />);
                }
                return lines;
              })}

              {/* Nodes */}
              {nodes.map((node) => {
                const inScale = isInScale(node.noteIdx);
                return (
                  <g key={`n-${node.q}-${node.r}`} className="cursor-pointer" onClick={() => handleNodeClick(node)}>
                    <path
                      d={hexPath(node.x, node.y, hexRadius * 0.82)}
                      fill={getNodeFill(node)}
                      stroke={inScale ? 'hsl(var(--border))' : 'transparent'}
                      strokeWidth={1}
                      opacity={inScale ? 1 : 0.35}
                      className="transition-all duration-150"
                    />
                    <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="central"
                      fill={getNodeTextColor(node)}
                      fontSize={performanceMode ? (inScale ? 14 : 11) : (inScale ? 11 : 9)}
                      fontWeight={node.noteIdx === rootIdx ? 700 : inScale ? 500 : 400}
                      opacity={inScale ? 1 : 0.5}
                      className="pointer-events-none select-none">
                      {node.note}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Active triad info */}
          {(activeTriad || hoveredTriad) && (
            <div className="flex items-center gap-2 px-3 py-2 mt-2 rounded-lg bg-accent/50 text-sm">
              <span className={`font-semibold ${(activeTriad || hoveredTriad)!.type === 'major' ? 'text-blue-400' : 'text-rose-400'}`}>
                {activeTriad ? triadLabel(activeTriad) : hoveredTriad?.label}
              </span>
              <span className="text-muted-foreground">
                ({(activeTriad?.notes || hoveredTriad?.notes || []).map(i => ALL_NOTES[i]).join(' – ')})
              </span>
              {activeTriad && (
                <button onClick={() => addTriadToProgression(activeTriad)}
                  className="ml-auto flex items-center gap-1 text-xs px-2 py-1 rounded border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  <Plus size={10} /> Add
                </button>
              )}
            </div>
          )}

          {/* ═══ NEO-RIEMANNIAN TRANSFORMS ═══ */}
          {showTransforms && activeTriad && (
            <div className="mt-3 p-3 rounded-lg border border-border bg-card space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Neo-Riemannian Transforms</p>
              <div className="flex flex-wrap gap-2">
                {TRANSFORMS.map(t => {
                  const result = applyTransform(activeTriad, t.id);
                  return (
                    <button key={t.id} onClick={() => handleTransform(t.id)}
                      className="group flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-center min-w-[60px]">
                      <span className="text-sm font-bold text-foreground">{t.label}</span>
                      <span className="text-[10px] text-primary">{triadLabel(result)}</span>
                      <span className="text-[9px] text-muted-foreground">{t.desc.split('—')[0].trim()}</span>
                    </button>
                  );
                })}
              </div>

              {/* Modulation buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                <button onClick={() => handleModulate('darker')}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-colors">
                  <Moon size={10} /> Darker
                </button>
                <button onClick={() => handleModulate('brighter')}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors">
                  <Sun size={10} /> Brighter
                </button>
                <button onClick={() => handleModulate('distant')}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-colors">
                  <Zap size={10} /> Distant
                </button>
                <button onClick={() => setShowSuggestions(!showSuggestions)}
                  className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded border transition-colors ${showSuggestions ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
                  <Sparkles size={10} /> Suggest
                </button>
              </div>
            </div>
          )}

          {/* ═══ SUGGESTIONS ═══ */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="mt-2 p-3 rounded-lg border border-border bg-card">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Suggested Next Chords</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button key={i}
                    onClick={() => {
                      const notes = s.triad.notes.map(n => ALL_NOTES[n]);
                      playChord(notes, 0.6, timbre);
                      setActiveTriad(s.triad);
                    }}
                    className={`flex flex-col items-start px-3 py-2 rounded-lg border transition-all text-left ${flavorColors[s.flavor]}`}>
                    <span className="text-sm font-bold">{triadLabel(s.triad)}</span>
                    <span className="text-[9px] opacity-80">{s.reason}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── PROGRESSION SIDEBAR ── */}
        <div className="lg:w-72 shrink-0">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <button onClick={() => setShowProgPanel(!showProgPanel)}
              className="w-full flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/20 text-sm font-semibold">
              <span>Progression ({progression.length})</span>
              {showProgPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showProgPanel && (
              <div className="p-3 space-y-3">
                {/* Presets */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Presets</p>
                  <div className="flex flex-wrap gap-1">
                    {TONNETZ_PRESETS.map((p, i) => (
                      <button key={i} onClick={() => loadPreset(p.triads)}
                        className="text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chord list */}
                {progression.length > 0 ? (
                  <div className="space-y-1">
                    {progression.map((td, i) => (
                      <div key={i}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-all ${
                          currentIdx === i ? 'bg-primary/20 border border-primary/50' : 'bg-secondary/30 border border-transparent hover:bg-secondary/50'
                        }`}>
                        <span className="text-[10px] text-muted-foreground w-4">{i + 1}</span>
                        <span className={`font-semibold ${td.type === 'major' ? 'text-blue-400' : 'text-rose-400'}`}>
                          {triadLabel(td)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {td.notes.map(n => ALL_NOTES[n]).join('–')}
                        </span>
                        <button onClick={() => setProgression(prev => prev.filter((_, j) => j !== i))}
                          className="ml-auto text-muted-foreground hover:text-destructive transition-colors">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Click a triad on the grid, then press <strong>Add</strong> to build a progression
                  </p>
                )}

                {/* Playback controls */}
                {progression.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <button onClick={playing ? stop : playProgression}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                        {playing ? <Pause size={10} /> : <Play size={10} />}
                        {playing ? 'Stop' : 'Play'}
                      </button>
                      <button onClick={() => setLooping(!looping)}
                        className={`text-xs px-2 py-1.5 rounded border transition-colors ${looping ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
                        <RotateCcw size={10} />
                      </button>
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-[10px] text-muted-foreground">BPM</span>
                        <input type="number" value={bpm} min={40} max={300}
                          onChange={(e) => setBpm(Math.max(40, Math.min(300, Number(e.target.value) || 100)))}
                          className="w-12 bg-secondary border border-border rounded px-1 py-0.5 text-xs text-foreground text-center" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleExportMidi}
                        className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:bg-accent transition-colors">
                        <Download size={10} /> MIDI
                      </button>
                      <button onClick={() => setProgression([])}
                        className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors">
                        <X size={10} /> Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ LEGEND + AXIS ═══ */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block" style={{ background: 'hsl(var(--primary))' }} /> Root
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block" style={{ background: 'hsl(var(--accent))' }} /> Scale
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block bg-blue-500/30 border border-blue-500" /> Major
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block bg-rose-500/30 border border-rose-500" /> Minor
        </span>
        {activeTriad && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block bg-yellow-500/30 border border-yellow-500" /> Active
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
        <div className="bg-secondary/50 rounded-lg p-2">
          <div className="font-medium text-foreground">→ Horizontal</div>
          <div>Perfect 5th (+7)</div>
        </div>
        <div className="bg-secondary/50 rounded-lg p-2">
          <div className="font-medium text-foreground">↗ Diagonal</div>
          <div>Major 3rd (+4)</div>
        </div>
        <div className="bg-secondary/50 rounded-lg p-2">
          <div className="font-medium text-foreground">↖ Diagonal</div>
          <div>Minor 3rd (+3)</div>
        </div>
      </div>
    </div>
  );
};

export default Tonnetz;
