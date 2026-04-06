import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Play, Square, RotateCcw, Download, ChevronDown, ChevronRight,
  Volume2, VolumeX, Plus, Globe, Music, Sliders, Zap, FileAudio, Search, Filter
} from "lucide-react";
import { DRUM_INSTRUMENTS, getInstrument, type DrumInstrument } from "./drumSoundEngine";
import {
  DRUM_PRESETS, getPresetsByRegion, filterPresets, getAllCategories, getAllRegions, getAllRhythmTypes,
  formatPulseGrouping,
  type PatternPreset, type TimeFeel, type Complexity, type RhythmType,
} from "./drumPresets";
import { generateMidiFile, downloadMidiFile, MIDI_MAPPINGS, type MidiMapping } from "./midiExport";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TrackState {
  id: string;
  instrumentId: string;
  steps: number[];
  subdivisions: number;
  volume: number;
  pitch: number;
  decay: number;
  swing: number | null; // null = use global swing, 0-50 = per-track override
  probability: number; // 0-100, chance each hit actually plays
  muted: boolean;
  solo: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _uid = 0;
const uid = () => `dm-${++_uid}`;

function createTrackFromPreset(
  instrumentId: string,
  steps: number[],
  subdivisions: number
): TrackState {
  const inst = getInstrument(instrumentId);
  return {
    id: uid(),
    instrumentId,
    steps,
    subdivisions,
    volume: inst?.defaultVelocity ?? 0.8,
    pitch: inst?.defaultPitch ?? 1,
    decay: inst?.defaultDecay ?? 0.3,
    swing: null,
    probability: 100,
    muted: false,
    solo: false,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

const DrumMachine = () => {
  // State
  const [bpm, setBpm] = useState(120);
  const [swing, setSwing] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [tracks, setTracks] = useState<TrackState[]>(() => {
    const preset = DRUM_PRESETS.find(p => p.name === 'Basic Rock')!;
    return preset.tracks.map(t => createTrackFromPreset(t.instrumentId, t.steps, t.subdivisions));
  });
  const [currentSteps, setCurrentSteps] = useState<Record<string, number>>({});
  const [activePreset, setActivePreset] = useState<string>('Basic Rock');
  const [showPanel, setShowPanel] = useState<'presets' | 'advanced' | 'midi' | null>('presets');
  const [showBrowser, setShowBrowser] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [midiMapping, setMidiMapping] = useState<MidiMapping>('general-midi');
  const [humanize, setHumanize] = useState(false);
  const [exportBars, setExportBars] = useState(4);
  const [groove, setGroove] = useState(50);

  // Filters
  const [filterRegion, setFilterRegion] = useState<string | null>(null);
  const [filterFeel, setFilterFeel] = useState<TimeFeel | null>(null);
  const [filterComplexity, setFilterComplexity] = useState<Complexity | null>(null);
  const [filterRhythmType, setFilterRhythmType] = useState<RhythmType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showKonnakol, setShowKonnakol] = useState(false);
  const [complexityLevel, setComplexityLevel] = useState<number>(2); // 1=beginner, 2=intermediate, 3=advanced

  // Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0);
  const playingRef = useRef(false);
  const stepRef = useRef<Record<string, number>>({});
  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  // Computed
  const categories = useMemo(() => getAllCategories(), []);
  const regions = useMemo(() => getAllRegions(), []);
  const rhythmTypes = useMemo(() => getAllRhythmTypes(), []);
  const presetsByCategory = useMemo(() => getPresetsByRegion(), []);

  const filteredPresets = useMemo(() => {
    return filterPresets({
      category: selectedCategory,
      region: filterRegion,
      timeFeel: filterFeel,
      complexity: filterComplexity,
      rhythmType: filterRhythmType,
      search: searchQuery || undefined,
    });
  }, [selectedCategory, filterRegion, filterFeel, filterComplexity, filterRhythmType, searchQuery]);

  const hasSolo = tracks.some(t => t.solo);

  // ─── Scheduler ──────────────────────────────────────────────────────────────

  const scheduleNote = useCallback(() => {
    const ctx = getCtx();
    const lookAhead = 0.1;
    const currentTracks = tracksRef.current;

    while (nextNoteTimeRef.current < ctx.currentTime + lookAhead) {
      currentTracks.forEach(track => {
        const shouldPlay = hasSolo ? track.solo : !track.muted;
        if (!shouldPlay) return;

        const stepDuration = (60 / bpm) * (4 / track.subdivisions);
        const currentStep = stepRef.current[track.id] ?? 0;
        const velocity = track.steps[currentStep];

        if (velocity > 0 && (track.probability >= 100 || Math.random() * 100 < track.probability)) {
          const inst = getInstrument(track.instrumentId);
          if (inst) {
            let time = nextNoteTimeRef.current;
            // Per-track swing overrides global
            const effectiveSwing = track.swing !== null ? track.swing : swing;
            if (effectiveSwing > 0 && currentStep % 2 === 1) {
              time += stepDuration * effectiveSwing / 100;
            }
            if (groove !== 50) {
              const humanFactor = (groove - 50) / 50;
              time += (Math.random() - 0.5) * stepDuration * 0.1 * Math.abs(humanFactor);
            }
            const finalVel = velocity * track.volume;
            inst.play(ctx, time, finalVel, track.pitch, track.decay);
          }
        }

        stepRef.current[track.id] = (currentStep + 1) % track.subdivisions;
      });

      let minStep = Infinity;
      currentTracks.forEach(track => {
        const sd = (60 / bpm) * (4 / track.subdivisions);
        if (sd < minStep) minStep = sd;
      });

      nextNoteTimeRef.current += minStep;
      setCurrentSteps({ ...stepRef.current });
    }
  }, [bpm, swing, groove, hasSolo, getCtx]);

  useEffect(() => {
    if (playing) {
      playingRef.current = true;
      const ctx = getCtx();
      nextNoteTimeRef.current = ctx.currentTime;
      stepRef.current = {};
      tracks.forEach(t => { stepRef.current[t.id] = 0; });

      const loop = () => {
        if (!playingRef.current) return;
        scheduleNote();
        timerRef.current = window.setTimeout(loop, 25);
      };
      loop();
    } else {
      playingRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      stepRef.current = {};
      setCurrentSteps({});
    }
    return () => {
      playingRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, scheduleNote, getCtx, tracks]);

  // ─── Track Actions ──────────────────────────────────────────────────────────

  const toggleStep = (trackId: string, stepIdx: number) => {
    setTracks(prev => prev.map(t => {
      if (t.id !== trackId) return t;
      const newSteps = [...t.steps];
      if (newSteps[stepIdx] === 0) newSteps[stepIdx] = 0.7;
      else if (newSteps[stepIdx] < 0.6) newSteps[stepIdx] = 0;
      else if (newSteps[stepIdx] < 0.9) newSteps[stepIdx] = 1.0;
      else newSteps[stepIdx] = 0.4;
      return { ...t, steps: newSteps };
    }));
  };

  const addTrack = (instrumentId?: string) => {
    const instId = instrumentId || 'kick';
    const inst = getInstrument(instId);
    const subs = 16;
    setTracks(prev => [...prev, {
      id: uid(),
      instrumentId: instId,
      steps: Array(subs).fill(0),
      subdivisions: subs,
      volume: inst?.defaultVelocity ?? 0.8,
      pitch: inst?.defaultPitch ?? 1,
      decay: inst?.defaultDecay ?? 0.3,
      swing: null,
      probability: 100,
      muted: false,
      solo: false,
    }]);
  };

  const removeTrack = (id: string) => setTracks(prev => prev.filter(t => t.id !== id));

  const updateTrack = (id: string, updates: Partial<TrackState>) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const changeSubdivisions = (id: string, newSub: number) => {
    setTracks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const newSteps = Array(newSub).fill(0).map((_, i) =>
        i < t.steps.length ? t.steps[i] : 0
      );
      return { ...t, subdivisions: newSub, steps: newSteps };
    }));
  };

  const loadPreset = (preset: PatternPreset) => {
    setPlaying(false);
    setBpm(preset.bpm);
    setSwing(preset.swing);
    setActivePreset(preset.name);
    setTracks(preset.tracks.map(t => createTrackFromPreset(t.instrumentId, t.steps, t.subdivisions)));
  };

  const clearAll = () => {
    setPlaying(false);
    setTracks(prev => prev.map(t => ({ ...t, steps: Array(t.subdivisions).fill(0) })));
  };

  // ─── MIDI Export ────────────────────────────────────────────────────────────

  const handleExport = () => {
    const exportTracks = tracks.map(t => ({
      instrumentId: t.instrumentId,
      steps: t.steps,
      subdivisions: t.subdivisions,
    }));
    const data = generateMidiFile(exportTracks, bpm, midiMapping, swing, humanize, exportBars);
    const safeName = activePreset.replace(/[^a-zA-Z0-9]/g, '_');
    downloadMidiFile(data, `${safeName}_${bpm}bpm.mid`);
  };

  // ─── Get step visual style ─────────────────────────────────────────────────

  const getStepClass = (velocity: number, color: string, isCurrent: boolean, isDownbeat: boolean) => {
    if (velocity > 0) {
      const opacity = velocity >= 0.9 ? '' : velocity >= 0.6 ? 'opacity-80' : 'opacity-50';
      return `${color} text-white ${opacity} ${isCurrent ? 'scale-110 ring-2 ring-white/60' : ''}`;
    }
    return `${isDownbeat ? 'bg-secondary/80' : 'bg-secondary/40'} hover:bg-accent ${isCurrent ? 'ring-1 ring-primary/40' : ''}`;
  };

  // ─── Clave overlay ─────────────────────────────────────────────────────────

  const currentPreset = DRUM_PRESETS.find(p => p.name === activePreset);
  const claveInfo = currentPreset?.clavePattern;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Global Rhythm Engine
          </h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 max-w-lg">
            {DRUM_PRESETS.length} culturally authentic patterns from {new Set(DRUM_PRESETS.filter(p => p.countryCode !== 'UN').map(p => p.country)).size} countries.
            <span className="hidden sm:inline"> Click cells to cycle: off → hit → accent → ghost.</span>
            <span className="sm:hidden"> Tap cells to toggle.</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {claveInfo && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 border border-primary/20">
              <Music className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] sm:text-[11px] text-primary font-medium">Clave: {claveInfo}</span>
            </div>
          )}
          {currentPreset && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary border border-border">
              <span className="text-[10px] sm:text-[11px] font-medium">{currentPreset.country}</span>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                {formatPulseGrouping(currentPreset.pulseGrouping)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Transport */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          onClick={() => setPlaying(!playing)}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-all ${
            playing
              ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20'
          }`}
        >
          {playing ? <Square size={14} /> : <Play size={14} />}
          {playing ? 'Stop' : 'Play'}
        </button>

        <button onClick={clearAll}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:bg-accent transition-colors">
          <RotateCcw size={14} /> <span className="hidden xs:inline">Clear</span>
        </button>


        {/* BPM */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-xs text-muted-foreground font-medium">BPM</span>
          <input type="range" min={40} max={400} value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            className="w-16 sm:w-20 accent-primary" />
          <input type="number" min={40} max={400} value={bpm}
            onChange={e => setBpm(Math.max(40, Math.min(400, Number(e.target.value))))}
            className="w-12 sm:w-14 bg-secondary border border-border rounded px-1.5 py-1 text-xs sm:text-sm text-foreground text-center" />
        </div>

        {/* Swing + Groove - collapse on very small screens */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sw</span>
          <input type="range" min={0} max={50} value={swing}
            onChange={e => setSwing(Number(e.target.value))}
            className="w-12 sm:w-16 accent-primary" />
          <span className="text-[10px] text-muted-foreground w-6 sm:w-8">{swing}%</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Feel</span>
          <input type="range" min={0} max={100} value={groove}
            onChange={e => setGroove(Number(e.target.value))}
            className="w-12 sm:w-16 accent-primary" />
          <span className="text-[9px] sm:text-[10px] text-muted-foreground w-10 sm:w-14">
            {groove < 30 ? 'Tight' : groove < 70 ? 'Natural' : 'Loose'}
          </span>
        </div>

        {currentPreset && (
          <div className="w-full sm:w-auto sm:ml-auto text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-0">
            <span className="text-foreground font-medium">{currentPreset.name}</span>
            <span className="mx-1">·</span>
            <span>{currentPreset.country}</span>
            {currentPreset.timeSignature && (
              <span className="ml-1">({currentPreset.timeSignature[0]}/{currentPreset.timeSignature[1]})</span>
            )}
            <span className="ml-1 text-primary/70">{currentPreset.timeFeel}</span>
          </div>
        )}
      </div>

      {/* Panel Toggles */}
      <div className="flex gap-1.5 border-b border-border pb-0">
        {[
          { id: 'advanced' as const, label: 'Sound', icon: <Sliders className="w-3.5 h-3.5" /> },
          { id: 'midi' as const, label: 'MIDI Export', icon: <FileAudio className="w-3.5 h-3.5" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setShowPanel(showPanel === tab.id ? null : tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md transition-colors border-b-2 ${
              showPanel === tab.id
                ? 'border-primary text-foreground bg-secondary/50'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Advanced Sound Panel */}
      {showPanel === 'advanced' && (
        <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Per-Track Sound Controls</p>
          {tracks.map(track => {
            const inst = getInstrument(track.instrumentId);
            return (
              <div key={track.id} className="flex flex-wrap items-center gap-3 p-3 rounded-md bg-card border border-border">
                <select
                  value={track.instrumentId}
                  onChange={e => {
                    const newInst = getInstrument(e.target.value);
                    if (newInst) {
                      updateTrack(track.id, {
                        instrumentId: e.target.value,
                        pitch: newInst.defaultPitch,
                        decay: newInst.defaultDecay,
                      });
                    }
                  }}
                  className="bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground w-28"
                >
                  {DRUM_INSTRUMENTS.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">Steps</span>
                  <select value={track.subdivisions}
                    onChange={e => changeSubdivisions(track.id, Number(e.target.value))}
                    className="bg-secondary border border-border rounded px-1.5 py-0.5 text-xs text-foreground w-14"
                  >
                    {[4,6,7,8,9,10,11,12,16,20,24,32].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">Vol</span>
                  <input type="range" min={0} max={100} value={track.volume * 100}
                    onChange={e => updateTrack(track.id, { volume: Number(e.target.value) / 100 })}
                    className="w-14 accent-primary" />
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">Pitch</span>
                  <input type="range" min={50} max={200} value={track.pitch * 100}
                    onChange={e => updateTrack(track.id, { pitch: Number(e.target.value) / 100 })}
                    className="w-14 accent-primary" />
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">Decay</span>
                  <input type="range" min={5} max={150} value={track.decay * 100}
                    onChange={e => updateTrack(track.id, { decay: Number(e.target.value) / 100 })}
                    className="w-14 accent-primary" />
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">Swing</span>
                  <input type="range" min={0} max={50}
                    value={track.swing !== null ? track.swing : swing}
                    onChange={e => updateTrack(track.id, { swing: Number(e.target.value) })}
                    className="w-14 accent-primary" />
                  <span className="text-[9px] text-muted-foreground w-8">
                    {track.swing !== null ? `${track.swing}%` : 'G'}
                  </span>
                  {track.swing !== null && (
                    <button
                      onClick={() => updateTrack(track.id, { swing: null })}
                      className="text-[8px] px-1 py-0.5 rounded border border-border text-muted-foreground hover:bg-accent"
                      title="Reset to global swing"
                    >
                      ↺
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">Prob</span>
                  <input type="range" min={0} max={100}
                    value={track.probability}
                    onChange={e => updateTrack(track.id, { probability: Number(e.target.value) })}
                    className="w-14 accent-primary" />
                  <span className={`text-[9px] w-8 ${track.probability < 100 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                    {track.probability}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MIDI Export Panel */}
      {showPanel === 'midi' && (
        <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">VST Mapping</label>
              <select value={midiMapping}
                onChange={e => setMidiMapping(e.target.value as MidiMapping)}
                className="bg-secondary border border-border rounded px-2 py-1.5 text-xs text-foreground"
              >
                {Object.entries(
                  MIDI_MAPPINGS.reduce((acc, m) => {
                    if (!acc[m.category]) acc[m.category] = [];
                    acc[m.category].push(m);
                    return acc;
                  }, {} as Record<string, typeof MIDI_MAPPINGS>)
                ).map(([cat, items]) => (
                  <optgroup key={cat} label={cat}>
                    {items.map(m => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Bars</label>
              <select value={exportBars}
                onChange={e => setExportBars(Number(e.target.value))}
                className="bg-secondary border border-border rounded px-2 py-1.5 text-xs text-foreground"
              >
                {[1,2,4,8,16].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={humanize}
                onChange={e => setHumanize(e.target.checked)}
                className="accent-primary" />
              <span className="text-xs text-muted-foreground">Humanize timing</span>
            </label>

            <button onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Download size={14} /> Export .mid
            </button>
          </div>

          {/* MIDI mapping preview */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5">Mapping Preview</p>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-1.5">
              {tracks.map(t => {
                const inst = getInstrument(t.instrumentId);
                return (
                  <div key={t.id} className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-card rounded px-2 py-1 border border-border">
                    <span className={`w-2 h-2 rounded-full ${inst?.color || 'bg-muted'}`} />
                    <span className="truncate">{inst?.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step Sequencer Grid */}
      <div className="space-y-1 sm:space-y-1.5 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
        {tracks.map(track => {
          const inst = getInstrument(track.instrumentId);
          const current = currentSteps[track.id] ?? -1;
          const prev = (current - 1 + track.subdivisions) % track.subdivisions;
          const shouldPlay = hasSolo ? track.solo : !track.muted;

          return (
            <div key={track.id} className={`flex items-center gap-1.5 sm:gap-2 min-w-fit ${!shouldPlay ? 'opacity-30' : ''}`}>
              {/* Track controls */}
              <div className="flex items-center gap-0.5 sm:gap-1 w-20 sm:w-28 shrink-0">
                <button onClick={() => updateTrack(track.id, { muted: !track.muted })}
                  className={`p-0.5 rounded transition-colors ${track.muted ? 'text-muted-foreground/40' : 'text-foreground'}`}
                  title={track.muted ? 'Unmute' : 'Mute'}>
                  {track.muted ? <VolumeX size={11} /> : <Volume2 size={11} />}
                </button>
                <button onClick={() => updateTrack(track.id, { solo: !track.solo })}
                  className={`text-[9px] px-1 py-0.5 rounded font-bold transition-colors ${
                    track.solo ? 'bg-amber-500 text-black' : 'text-muted-foreground/50 hover:text-foreground'
                  }`}
                  title="Solo">
                  S
                </button>
                <span className={`w-2 h-2 rounded-full shrink-0 ${inst?.color || 'bg-muted'}`} />
                <span className="text-[9px] sm:text-[11px] font-medium truncate">{inst?.shortName || inst?.name || track.instrumentId}</span>
              </div>

              {/* Steps */}
              <div className="flex gap-[2px]">
                {track.steps.map((vel, i) => {
                  const isCurrent = playing && prev === i;
                  const isDownbeat = track.subdivisions >= 8
                    ? i % (track.subdivisions >= 16 ? 4 : track.subdivisions >= 12 ? 3 : 2) === 0
                    : i === 0;
                  const isBeatBoundary = track.subdivisions >= 16 && i % 4 === 0;

                  return (
                    <button key={i} onClick={() => toggleStep(track.id, i)}
                      className={`
                        w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-sm transition-all text-[7px] sm:text-[8px] font-bold
                        ${getStepClass(vel, inst?.color || 'bg-muted', isCurrent, isDownbeat)}
                        ${isBeatBoundary && i > 0 ? 'ml-1' : ''}
                      `}
                      title={vel > 0 ? `Vel: ${Math.round(vel * 100)}%` : 'Off'}
                    >
                      {vel >= 0.9 ? '▉' : vel >= 0.6 ? '●' : vel > 0 ? '·' : ''}
                    </button>
                  );
                })}
              </div>

              {/* Remove */}
              {tracks.length > 1 && (
                <button onClick={() => removeTrack(track.id)}
                  className="text-muted-foreground/30 hover:text-rose-500 text-xs transition-colors shrink-0"
                  title="Remove track">✕</button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Track */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => addTrack()}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-dashed border-border hover:bg-accent hover:border-foreground/20 transition-colors text-muted-foreground">
          <Plus size={12} /> Add Track
        </button>

        {['kick', 'snare', 'hh-closed', 'clave', 'conga-low', 'cowbell', 'cajon', 'shaker'].map(instId => {
          const inst = getInstrument(instId);
          if (!inst) return null;
          return (
            <button key={instId} onClick={() => addTrack(instId)}
              className="text-[10px] px-2 py-1 rounded border border-border hover:bg-accent transition-colors text-muted-foreground"
              title={`Add ${inst.name}`}>
              + {inst.name}
            </button>
          );
        })}
      </div>

      {/* ─── Rhythm Browser (below tracks) ──────────────────────────── */}
      <div className="rounded-lg border border-border bg-secondary/20">
        <button
          onClick={() => setShowBrowser(!showBrowser)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Search size={12} />
            Rhythm Browser
            <span className="text-[9px] text-muted-foreground/60">({filteredPresets.length} patterns)</span>
          </span>
          {showBrowser ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {showBrowser && <div className="px-3 pb-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search rhythms…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded pl-6 pr-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            value={filterRegion || ''}
            onChange={e => setFilterRegion(e.target.value || null)}
            className="bg-card border border-border rounded px-1.5 py-1 text-[10px] text-foreground"
          >
            <option value="">All Regions</option>
            {regions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            value={filterFeel || ''}
            onChange={e => setFilterFeel((e.target.value || null) as TimeFeel | null)}
            className="bg-card border border-border rounded px-1.5 py-1 text-[10px] text-foreground"
          >
            <option value="">All Feels</option>
            <option value="straight">Straight</option>
            <option value="swing">Swing</option>
            <option value="compound">Compound</option>
            <option value="asymmetric">Asymmetric</option>
            <option value="polyrhythmic">Polyrhythmic</option>
          </select>
          <select
            value={filterRhythmType || ''}
            onChange={e => setFilterRhythmType((e.target.value || null) as RhythmType | null)}
            className="bg-card border border-border rounded px-1.5 py-1 text-[10px] text-foreground"
          >
            <option value="">All Types</option>
            <option value="groove">Groove</option>
            <option value="odd-meter">Odd Meter</option>
            <option value="tala">Tala</option>
            <option value="trance">Trance</option>
          </select>
          <select
            value={filterComplexity || ''}
            onChange={e => setFilterComplexity((e.target.value || null) as Complexity | null)}
            className="bg-card border border-border rounded px-1.5 py-1 text-[10px] text-foreground"
          >
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <span className="text-[9px] text-muted-foreground ml-auto">{filteredPresets.length} patterns</span>
        </div>

        {/* Konnakol + Complexity controls */}
        <div className="flex flex-wrap items-center gap-3">
          {currentPreset?.konnakol && (
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={showKonnakol}
                onChange={e => setShowKonnakol(e.target.checked)}
                className="accent-primary" />
              <span className="text-[10px] text-muted-foreground">Konnakol</span>
            </label>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Complexity</span>
            <input type="range" min={1} max={3} value={complexityLevel}
              onChange={e => setComplexityLevel(Number(e.target.value))}
              className="w-14 accent-primary" />
            <span className="text-[9px] text-muted-foreground w-16">
              {complexityLevel === 1 ? 'Simple' : complexityLevel === 2 ? 'Medium' : 'Full'}
            </span>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
              !selectedCategory ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-accent'
            }`}
          >All</button>
          {categories.map(r => (
            <button key={r}
              onClick={() => setSelectedCategory(selectedCategory === r ? null : r)}
              className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                selectedCategory === r ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-accent'
              }`}
            >{r}</button>
          ))}
        </div>

        {/* Compact preset list */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 max-h-[240px] overflow-y-auto">
          {filteredPresets.map(p => (
            <button key={p.name}
              onClick={() => loadPreset(p)}
              className={`text-left px-2 py-1.5 rounded border transition-all ${
                activePreset === p.name
                  ? 'border-primary bg-primary/5'
                  : 'border-border/50 hover:border-foreground/20 hover:bg-accent'
              }`}
            >
              <div className="text-[11px] font-medium truncate">{p.name}</div>
              <div className="text-[9px] text-muted-foreground truncate">
                {p.country} · {p.bpm} · {p.timeSignature[0]}/{p.timeSignature[1]} · {p.timeFeel}
              </div>
            </button>
          ))}
        </div>

        {/* Active preset info */}
        {currentPreset && (
          <div className="space-y-1.5 pt-1 border-t border-border/50">
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
              <span className="font-medium text-foreground">{currentPreset.name}</span>
              <span>{currentPreset.country} · {formatPulseGrouping(currentPreset.pulseGrouping)}</span>
              {currentPreset.rhythmType && (
                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px]">{currentPreset.rhythmType}</span>
              )}
              {currentPreset.artists && currentPreset.artists.length > 0 && (
                <span className="truncate max-w-[200px]">♪ {currentPreset.artists.join(', ')}</span>
              )}
              <span className="italic truncate max-w-xs">{currentPreset.description}</span>
            </div>

            {/* Tala cycle visualization */}
            {currentPreset.talaStructure && (
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-muted-foreground font-medium">{currentPreset.talaStructure.name}:</span>
                <div className="flex gap-0.5">
                  {currentPreset.talaStructure.vibhags.map((v, vi) => (
                    <div key={vi} className="flex gap-0.5">
                      {Array.from({ length: v }).map((_, bi) => {
                        const beatNum = currentPreset.talaStructure!.vibhags.slice(0, vi).reduce((a, b) => a + b, 0) + bi + 1;
                        const isSam = beatNum === currentPreset.talaStructure!.sam;
                        const isKhali = beatNum === currentPreset.talaStructure!.khali;
                        return (
                          <span key={bi} className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold ${
                            isSam ? 'bg-primary text-primary-foreground' :
                            isKhali ? 'bg-destructive/20 text-destructive' :
                            'bg-secondary text-muted-foreground'
                          }`}>
                            {isSam ? 'X' : isKhali ? '0' : beatNum}
                          </span>
                        );
                      })}
                      {vi < currentPreset.talaStructure!.vibhags.length - 1 && (
                        <span className="text-muted-foreground/30 mx-0.5">|</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Konnakol display */}
            {showKonnakol && currentPreset.konnakol && (
              <div className="flex flex-wrap gap-1 text-[9px] font-mono">
                {currentPreset.pulseGrouping.map((g, i) => {
                  const syllables = g === 1 ? 'TA' : g === 2 ? 'TA-KA' : g === 3 ? 'TA-KI-TA' : g === 4 ? 'TA-KA-DI-MI' : `(${g})`;
                  return (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
                      {syllables}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>}
      </div>

      {/* Velocity Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground pt-2 border-t border-border">
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded-sm bg-amber-500 flex items-center justify-center text-white text-[7px]">▉</span>
          Accent
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded-sm bg-amber-500 opacity-80 flex items-center justify-center text-white text-[7px]">●</span>
          Normal
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded-sm bg-amber-500 opacity-50 flex items-center justify-center text-white text-[7px]">·</span>
          Ghost
        </span>
        <span className="ml-auto">Click cells to cycle velocity</span>
      </div>
    </div>
  );
};

export default DrumMachine;
