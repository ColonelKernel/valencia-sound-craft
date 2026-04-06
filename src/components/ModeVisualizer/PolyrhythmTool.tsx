import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Play, Square, RotateCcw, ChevronDown, ChevronRight, Volume2, VolumeX } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Track {
  id: string;
  name: string;
  steps: boolean[];
  subdivisions: number;
  volume: number;
  muted: boolean;
  color: string;
  frequency: number;
  decay: number;
  type: 'noise' | 'sine' | 'triangle';
}

interface Preset {
  name: string;
  category: string;
  bpm: number;
  swing: number;
  tracks: Omit<Track, 'id'>[];
}

// ─── Sound engine ────────────────────────────────────────────────────────────

const playDrumHit = (
  ctx: AudioContext,
  freq: number,
  decay: number,
  type: Track['type'],
  volume: number,
  time: number
) => {
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(volume * 0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

  if (type === 'noise') {
    const bufferSize = ctx.sampleRate * decay;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.connect(gain);
    noise.start(time);
    noise.stop(time + decay);
  } else {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.3, time + decay);
    osc.connect(gain);
    osc.start(time);
    osc.stop(time + decay);
  }
};

// ─── Constants ───────────────────────────────────────────────────────────────

const TRACK_COLORS = [
  'bg-amber-500', 'bg-blue-500', 'bg-emerald-500', 'bg-rose-500',
  'bg-violet-500', 'bg-cyan-500', 'bg-orange-500', 'bg-pink-500',
];

const INSTRUMENT_PRESETS: { name: string; frequency: number; decay: number; type: Track['type'] }[] = [
  { name: 'Kick', frequency: 80, decay: 0.3, type: 'sine' },
  { name: 'Snare', frequency: 200, decay: 0.15, type: 'noise' },
  { name: 'Hi-Hat', frequency: 800, decay: 0.05, type: 'noise' },
  { name: 'Open Hat', frequency: 800, decay: 0.2, type: 'noise' },
  { name: 'Tom High', frequency: 300, decay: 0.2, type: 'sine' },
  { name: 'Tom Low', frequency: 150, decay: 0.25, type: 'sine' },
  { name: 'Clap', frequency: 400, decay: 0.1, type: 'noise' },
  { name: 'Rim', frequency: 600, decay: 0.03, type: 'triangle' },
  { name: 'Cowbell', frequency: 560, decay: 0.1, type: 'triangle' },
  { name: 'Clave', frequency: 2500, decay: 0.02, type: 'sine' },
];

const makeTrack = (
  name: string,
  subdivisions: number,
  steps: boolean[],
  colorIdx: number,
  frequency: number,
  decay: number,
  type: Track['type']
): Omit<Track, 'id'> => ({
  name,
  subdivisions,
  steps,
  volume: 0.8,
  muted: false,
  color: TRACK_COLORS[colorIdx % TRACK_COLORS.length],
  frequency,
  decay,
  type,
});

const PRESETS: Preset[] = [
  {
    name: 'Basic Rock',
    category: 'Beginner',
    bpm: 120,
    swing: 0,
    tracks: [
      makeTrack('Kick', 8, [true,false,false,false,true,false,false,false], 0, 80, 0.3, 'sine'),
      makeTrack('Snare', 8, [false,false,true,false,false,false,true,false], 1, 200, 0.15, 'noise'),
      makeTrack('Hi-Hat', 8, [true,true,true,true,true,true,true,true], 2, 800, 0.05, 'noise'),
    ],
  },
  {
    name: 'Bossa Nova',
    category: 'Intermediate',
    bpm: 130,
    swing: 0,
    tracks: [
      makeTrack('Kick', 16, [true,false,false,false,false,false,true,false,false,true,false,false,false,false,false,false], 0, 80, 0.3, 'sine'),
      makeTrack('Rim', 16, [false,false,false,true,false,false,false,false,false,false,true,false,false,true,false,false], 7, 600, 0.03, 'triangle'),
      makeTrack('Hi-Hat', 16, [true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false], 2, 800, 0.05, 'noise'),
    ],
  },
  {
    name: '3 vs 4 Polyrhythm',
    category: 'Polyrhythm',
    bpm: 100,
    swing: 0,
    tracks: [
      makeTrack('Kick', 4, [true,false,false,false], 0, 80, 0.3, 'sine'),
      makeTrack('Cowbell', 3, [true,false,false], 8, 560, 0.1, 'triangle'),
    ],
  },
  {
    name: '5 vs 4 Polyrhythm',
    category: 'Polyrhythm',
    bpm: 90,
    swing: 0,
    tracks: [
      makeTrack('Kick', 4, [true,false,false,false], 0, 80, 0.3, 'sine'),
      makeTrack('Clave', 5, [true,false,false,false,false], 9, 2500, 0.02, 'sine'),
    ],
  },
  {
    name: '7 vs 4 Polyrhythm',
    category: 'Polyrhythm',
    bpm: 80,
    swing: 0,
    tracks: [
      makeTrack('Kick', 4, [true,false,false,false], 0, 80, 0.3, 'sine'),
      makeTrack('Rim', 7, [true,false,false,false,false,false,false], 7, 600, 0.03, 'triangle'),
    ],
  },
  {
    name: 'Funk',
    category: 'Intermediate',
    bpm: 105,
    swing: 15,
    tracks: [
      makeTrack('Kick', 16, [true,false,false,false,false,false,true,false,false,false,true,false,false,false,false,false], 0, 80, 0.3, 'sine'),
      makeTrack('Snare', 16, [false,false,false,false,true,false,false,false,false,false,false,false,true,false,false,true], 1, 200, 0.15, 'noise'),
      makeTrack('Hi-Hat', 16, [true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false], 2, 800, 0.05, 'noise'),
      makeTrack('Open Hat', 16, [false,false,false,false,false,false,false,false,false,false,false,false,false,true,false,false], 3, 800, 0.2, 'noise'),
    ],
  },
  {
    name: 'Hip Hop',
    category: 'Beginner',
    bpm: 90,
    swing: 20,
    tracks: [
      makeTrack('Kick', 16, [true,false,false,false,false,false,false,true,false,false,true,false,false,false,false,false], 0, 60, 0.35, 'sine'),
      makeTrack('Snare', 16, [false,false,false,false,true,false,false,false,false,false,false,false,true,false,false,false], 1, 200, 0.15, 'noise'),
      makeTrack('Hi-Hat', 16, [true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true], 2, 800, 0.04, 'noise'),
    ],
  },
];

// ─── Helper: generate a unique ID ────────────────────────────────────────────

let _id = 0;
const uid = () => `track-${++_id}`;

// ─── Component ───────────────────────────────────────────────────────────────

const PolyrhythmTool = () => {
  const [bpm, setBpm] = useState(120);
  const [swing, setSwing] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [tracks, setTracks] = useState<Track[]>(() =>
    PRESETS[0].tracks.map(t => ({ ...t, id: uid() }))
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentBeat, setCurrentBeat] = useState<Record<string, number>>({});

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const beatRef = useRef<Record<string, number>>({});
  const nextNoteTimeRef = useRef(0);
  const playingRef = useRef(false);

  // Ensure audioCtx exists
  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    return audioCtxRef.current;
  }, []);

  // Compute LCM for polyrhythm cycle length
  const cycleDuration = useMemo(() => {
    // One cycle = one bar = 4 beats at the given BPM
    return (60 / bpm) * 4;
  }, [bpm]);

  // Schedule loop
  const scheduleNote = useCallback(() => {
    const ctx = getCtx();
    const lookAhead = 0.1;

    while (nextNoteTimeRef.current < ctx.currentTime + lookAhead) {
      // For each track, check if this time aligns with one of its subdivisions
      tracks.forEach(track => {
        if (track.muted) return;
        const stepDuration = cycleDuration / track.subdivisions;
        const currentStep = beatRef.current[track.id] ?? 0;
        const stepTime = nextNoteTimeRef.current;

        if (track.steps[currentStep]) {
          playDrumHit(ctx, track.frequency, track.decay, track.type, track.volume, stepTime);
        }

        beatRef.current[track.id] = (currentStep + 1) % track.subdivisions;
      });

      // Find the smallest next step time across all tracks
      let minNext = Infinity;
      tracks.forEach(track => {
        const stepDuration = cycleDuration / track.subdivisions;
        const nextStep = beatRef.current[track.id] ?? 0;
        // Time until the next step for this track
        const nextTime = nextNoteTimeRef.current +
          (cycleDuration / track.subdivisions);

        // Apply swing to even-numbered steps
        let swingOffset = 0;
        if (swing > 0 && nextStep % 2 === 1) {
          swingOffset = (stepDuration * swing) / 100;
        }

        const candidate = stepDuration + swingOffset;
        if (candidate < minNext) minNext = candidate;
      });

      nextNoteTimeRef.current += minNext;
      setCurrentBeat({ ...beatRef.current });
    }
  }, [tracks, cycleDuration, swing, getCtx]);

  // Playback loop
  useEffect(() => {
    if (playing) {
      playingRef.current = true;
      const ctx = getCtx();
      if (ctx.state === 'suspended') ctx.resume();
      nextNoteTimeRef.current = ctx.currentTime;
      beatRef.current = {};
      tracks.forEach(t => { beatRef.current[t.id] = 0; });

      const loop = () => {
        if (!playingRef.current) return;
        scheduleNote();
        timerRef.current = window.setTimeout(loop, 25);
      };
      loop();
    } else {
      playingRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      beatRef.current = {};
      setCurrentBeat({});
    }

    return () => {
      playingRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, scheduleNote, getCtx, tracks]);

  // ─── Track management ───────────────────────────────────────────────────────

  const toggleStep = (trackId: string, stepIdx: number) => {
    setTracks(prev => prev.map(t =>
      t.id === trackId
        ? { ...t, steps: t.steps.map((s, i) => i === stepIdx ? !s : s) }
        : t
    ));
  };

  const addTrack = () => {
    const preset = INSTRUMENT_PRESETS[tracks.length % INSTRUMENT_PRESETS.length];
    setTracks(prev => [...prev, {
      id: uid(),
      name: preset.name,
      steps: Array(8).fill(false),
      subdivisions: 8,
      volume: 0.8,
      muted: false,
      color: TRACK_COLORS[prev.length % TRACK_COLORS.length],
      frequency: preset.frequency,
      decay: preset.decay,
      type: preset.type,
    }]);
  };

  const removeTrack = (id: string) => {
    setTracks(prev => prev.filter(t => t.id !== id));
  };

  const updateTrack = (id: string, updates: Partial<Track>) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const changeSubdivisions = (id: string, newSub: number) => {
    setTracks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const newSteps = Array(newSub).fill(false).map((_, i) =>
        i < t.steps.length ? t.steps[i] : false
      );
      return { ...t, subdivisions: newSub, steps: newSteps };
    }));
  };

  const loadPreset = (preset: Preset) => {
    setPlaying(false);
    setBpm(preset.bpm);
    setSwing(preset.swing);
    setTracks(preset.tracks.map(t => ({ ...t, id: uid() })));
  };

  const reset = () => {
    setPlaying(false);
    setTracks(prev => prev.map(t => ({
      ...t,
      steps: Array(t.subdivisions).fill(false),
    })));
  };

  // Group presets by category
  const presetCategories = useMemo(() => {
    const cats: Record<string, Preset[]> = {};
    PRESETS.forEach(p => {
      if (!cats[p.category]) cats[p.category] = [];
      cats[p.category].push(p);
    });
    return cats;
  }, []);

  return (
    <div className="rounded-lg border border-border bg-card p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Polyrhythm & Drum Machine</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Build beats, explore polyrhythms, and layer drum patterns. Click cells to toggle hits.
        </p>
      </div>

      {/* Transport & BPM */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setPlaying(!playing)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            playing
              ? 'bg-rose-500 text-white hover:bg-rose-600'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {playing ? <Square size={14} /> : <Play size={14} />}
          {playing ? 'Stop' : 'Play'}
        </button>

        <button
          onClick={reset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:bg-accent transition-colors"
        >
          <RotateCcw size={14} /> Clear
        </button>

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">BPM</label>
          <input
            type="range"
            min={40}
            max={220}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-24 accent-primary"
          />
          <input
            type="number"
            min={40}
            max={220}
            value={bpm}
            onChange={(e) => setBpm(Math.max(40, Math.min(220, Number(e.target.value))))}
            className="w-14 bg-secondary border border-border rounded px-2 py-1 text-sm text-foreground text-center"
          />
        </div>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Presets</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(presetCategories).map(([cat, presets]) => (
            <div key={cat} className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground/60 mr-1">{cat}:</span>
              {presets.map(p => (
                <button
                  key={p.name}
                  onClick={() => loadPreset(p)}
                  className="text-xs px-2.5 py-1 rounded border border-border hover:bg-accent hover:text-foreground transition-colors text-muted-foreground"
                >
                  {p.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Step sequencer grid */}
      <div className="space-y-2 overflow-x-auto">
        {tracks.map((track) => {
          const currentStep = currentBeat[track.id] ?? -1;
          const prevStep = (currentStep - 1 + track.subdivisions) % track.subdivisions;

          return (
            <div key={track.id} className="flex items-center gap-2 min-w-fit">
              {/* Track label */}
              <div className="flex items-center gap-1.5 w-24 shrink-0">
                <button
                  onClick={() => updateTrack(track.id, { muted: !track.muted })}
                  className={`p-1 rounded transition-colors ${track.muted ? 'text-muted-foreground/40' : 'text-foreground'}`}
                  title={track.muted ? 'Unmute' : 'Mute'}
                >
                  {track.muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                </button>
                <span className={`text-xs font-medium truncate ${track.muted ? 'text-muted-foreground/40 line-through' : 'text-foreground'}`}>
                  {track.name}
                </span>
              </div>

              {/* Steps */}
              <div className="flex gap-[2px]">
                {track.steps.map((active, i) => {
                  const isCurrent = playing && prevStep === i;
                  const isDownbeat = i % (track.subdivisions >= 8 ? 4 : track.subdivisions) === 0;

                  return (
                    <button
                      key={i}
                      onClick={() => toggleStep(track.id, i)}
                      className={`
                        w-8 h-8 md:w-9 md:h-9 rounded-sm transition-all text-[9px] font-bold
                        ${active
                          ? `${track.color} text-white shadow-sm ${isCurrent ? 'scale-110 ring-2 ring-white/50' : ''}`
                          : `${isDownbeat ? 'bg-secondary/80' : 'bg-secondary/40'} hover:bg-accent ${isCurrent ? 'ring-2 ring-primary/50' : ''}`
                        }
                        ${track.muted ? 'opacity-30' : ''}
                      `}
                    >
                      {active ? '●' : ''}
                    </button>
                  );
                })}
              </div>

              {/* Remove track */}
              {tracks.length > 1 && (
                <button
                  onClick={() => removeTrack(track.id)}
                  className="text-muted-foreground/40 hover:text-rose-500 text-xs px-1 transition-colors shrink-0"
                  title="Remove track"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add track */}
      <button
        onClick={addTrack}
        className="text-xs px-3 py-1.5 rounded border border-dashed border-border hover:bg-accent hover:border-foreground/20 transition-colors text-muted-foreground"
      >
        + Add Track
      </button>

      {/* Advanced options toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {showAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        Advanced Options
      </button>

      {showAdvanced && (
        <div className="space-y-4 border-t border-border pt-4">
          {/* Swing */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted-foreground w-16">Swing</label>
            <input
              type="range"
              min={0}
              max={50}
              value={swing}
              onChange={(e) => setSwing(Number(e.target.value))}
              className="w-32 accent-primary"
            />
            <span className="text-xs text-muted-foreground w-10">{swing}%</span>
          </div>

          {/* Per-track controls */}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Track Settings</p>
            {tracks.map(track => (
              <div key={track.id} className="flex flex-wrap items-center gap-3 p-3 rounded-md bg-secondary/30">
                {/* Instrument select */}
                <select
                  value={track.name}
                  onChange={(e) => {
                    const preset = INSTRUMENT_PRESETS.find(p => p.name === e.target.value);
                    if (preset) {
                      updateTrack(track.id, {
                        name: preset.name,
                        frequency: preset.frequency,
                        decay: preset.decay,
                        type: preset.type,
                      });
                    }
                  }}
                  className="bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground"
                >
                  {INSTRUMENT_PRESETS.map(p => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>

                {/* Subdivisions */}
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-muted-foreground">Steps</label>
                  <select
                    value={track.subdivisions}
                    onChange={(e) => changeSubdivisions(track.id, Number(e.target.value))}
                    className="bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground"
                  >
                    {[2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                {/* Volume */}
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-muted-foreground">Vol</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={track.volume * 100}
                    onChange={(e) => updateTrack(track.id, { volume: Number(e.target.value) / 100 })}
                    className="w-16 accent-primary"
                  />
                </div>

                {/* Pitch */}
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-muted-foreground">Pitch</label>
                  <input
                    type="range"
                    min={30}
                    max={2000}
                    value={track.frequency}
                    onChange={(e) => updateTrack(track.id, { frequency: Number(e.target.value) })}
                    className="w-16 accent-primary"
                  />
                </div>

                {/* Decay */}
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-muted-foreground">Decay</label>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={track.decay * 100}
                    onChange={(e) => updateTrack(track.id, { decay: Number(e.target.value) / 100 })}
                    className="w-16 accent-primary"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Polyrhythm tips */}
          <div className="text-xs text-muted-foreground bg-secondary/30 rounded-md p-3 space-y-1">
            <p className="font-medium text-foreground">💡 Polyrhythm Tips</p>
            <p>• Set different step counts per track (e.g. 3 vs 4) to create polyrhythms</p>
            <p>• Use the presets to hear classic polyrhythmic patterns</p>
            <p>• Adjust pitch and decay to shape each instrument's sound</p>
            <p>• Add swing for a more human, groovy feel</p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground pt-2 border-t border-border">
        <span>Click cells to toggle beats</span>
        <span>● = active hit</span>
        <span>Lighter cells = downbeats</span>
      </div>
    </div>
  );
};

export default PolyrhythmTool;
