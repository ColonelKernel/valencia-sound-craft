import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Play, Square, RotateCcw, Download, ChevronDown, ChevronRight,
  Volume2, VolumeX, Plus, Globe, Music, Sliders, Zap, FileAudio
} from "lucide-react";
import { DRUM_INSTRUMENTS, getInstrument, type DrumInstrument } from "./drumSoundEngine";
import { DRUM_PRESETS, getPresetsByRegion, type PatternPreset } from "./drumPresets";
import { generateMidiFile, downloadMidiFile, MIDI_MAPPINGS, type MidiMapping } from "./midiExport";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TrackState {
  id: string;
  instrumentId: string;
  steps: number[]; // velocity values
  subdivisions: number;
  volume: number;
  pitch: number;
  decay: number;
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
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [midiMapping, setMidiMapping] = useState<MidiMapping>('general-midi');
  const [humanize, setHumanize] = useState(false);
  const [exportBars, setExportBars] = useState(4);
  const [groove, setGroove] = useState(50); // 0=quantized, 50=natural, 100=loose

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

  // Preset regions
  const presetsByRegion = useMemo(() => getPresetsByRegion(), []);
  const regions = useMemo(() => Object.keys(presetsByRegion), [presetsByRegion]);

  // Solo logic: if any track is soloed, only soloed tracks play
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

        if (velocity > 0) {
          const inst = getInstrument(track.instrumentId);
          if (inst) {
            let time = nextNoteTimeRef.current;

            // Swing on off-beats
            if (swing > 0 && currentStep % 2 === 1) {
              time += stepDuration * swing / 100;
            }

            // Groove/humanization
            if (groove !== 50) {
              const humanFactor = (groove - 50) / 50; // -1 to 1
              time += (Math.random() - 0.5) * stepDuration * 0.1 * Math.abs(humanFactor);
            }

            const finalVel = velocity * track.volume;
            inst.play(ctx, time, finalVel, track.pitch, track.decay);
          }
        }

        stepRef.current[track.id] = (currentStep + 1) % track.subdivisions;
      });

      // Find smallest step duration
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
      // Cycle: off -> full -> accent -> ghost -> off
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
    <div className="rounded-xl border border-border bg-card p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Global Rhythm Engine
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-lg">
            Culturally authentic drum patterns from around the world. Click cells to cycle: off → hit → accent → ghost.
          </p>
        </div>
        {claveInfo && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20">
            <Music className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] text-primary font-medium">Clave: {claveInfo}</span>
          </div>
        )}
      </div>

      {/* Transport */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setPlaying(!playing)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
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
          <RotateCcw size={14} /> Clear
        </button>

        {/* BPM */}
        <div className="flex items-center gap-2 ml-2">
          <span className="text-xs text-muted-foreground font-medium">BPM</span>
          <input type="range" min={40} max={280} value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            className="w-20 accent-primary" />
          <input type="number" min={40} max={280} value={bpm}
            onChange={e => setBpm(Math.max(40, Math.min(280, Number(e.target.value))))}
            className="w-14 bg-secondary border border-border rounded px-2 py-1 text-sm text-foreground text-center" />
        </div>

        {/* Swing */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Swing</span>
          <input type="range" min={0} max={50} value={swing}
            onChange={e => setSwing(Number(e.target.value))}
            className="w-16 accent-primary" />
          <span className="text-xs text-muted-foreground w-8">{swing}%</span>
        </div>

        {/* Groove */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Feel</span>
          <input type="range" min={0} max={100} value={groove}
            onChange={e => setGroove(Number(e.target.value))}
            className="w-16 accent-primary" />
          <span className="text-[10px] text-muted-foreground w-14">
            {groove < 30 ? 'Tight' : groove < 70 ? 'Natural' : 'Loose'}
          </span>
        </div>

        {currentPreset && (
          <div className="ml-auto text-xs text-muted-foreground">
            <span className="text-foreground font-medium">{currentPreset.name}</span>
            <span className="mx-1">·</span>
            <span>{currentPreset.region}</span>
            {currentPreset.timeSignature && (
              <span className="ml-1">({currentPreset.timeSignature[0]}/{currentPreset.timeSignature[1]})</span>
            )}
          </div>
        )}
      </div>

      {/* Panel Toggles */}
      <div className="flex gap-1.5 border-b border-border pb-0">
        {[
          { id: 'presets' as const, label: 'Presets', icon: <Globe className="w-3.5 h-3.5" /> },
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

      {/* Presets Panel */}
      {showPanel === 'presets' && (
        <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-3">
          {/* Region filters */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedRegion(null)}
              className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                !selectedRegion ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-accent'
              }`}
            >
              All
            </button>
            {regions.map(r => (
              <button key={r}
                onClick={() => setSelectedRegion(r)}
                className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                  selectedRegion === r ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-accent'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Presets grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {(selectedRegion ? presetsByRegion[selectedRegion] || [] : DRUM_PRESETS).map(p => (
              <button key={p.name}
                onClick={() => loadPreset(p)}
                className={`text-left p-2.5 rounded-lg border transition-all hover:shadow-sm ${
                  activePreset === p.name
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-foreground/20 hover:bg-accent'
                }`}
              >
                <div className="text-xs font-medium truncate">{p.name}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{p.region} · {p.bpm} BPM</div>
              </button>
            ))}
          </div>

          {/* Preset description */}
          {currentPreset && (
            <p className="text-[11px] text-muted-foreground italic">{currentPreset.description}</p>
          )}
        </div>
      )}

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
                    {[4,6,8,12,16,24,32].map(n => (
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
                {MIDI_MAPPINGS.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
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
      <div className="space-y-1.5 overflow-x-auto">
        {tracks.map(track => {
          const inst = getInstrument(track.instrumentId);
          const current = currentSteps[track.id] ?? -1;
          const prev = (current - 1 + track.subdivisions) % track.subdivisions;
          const shouldPlay = hasSolo ? track.solo : !track.muted;

          return (
            <div key={track.id} className={`flex items-center gap-2 min-w-fit ${!shouldPlay ? 'opacity-30' : ''}`}>
              {/* Track controls */}
              <div className="flex items-center gap-1 w-28 shrink-0">
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
                <span className="text-[11px] font-medium truncate">{inst?.name || track.instrumentId}</span>
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
                        w-7 h-7 md:w-8 md:h-8 rounded-sm transition-all text-[8px] font-bold
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

        {/* Quick-add popular instruments */}
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
