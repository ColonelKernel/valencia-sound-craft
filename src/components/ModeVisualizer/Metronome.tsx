import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { getAudioContext } from "@/music-core/audioContext";
import {
  Play, Pause, Minus, Plus, Hand, Music2, Zap, Waves,
  Settings2, Save, Trash2, ChevronDown, ChevronUp,
  Volume2, VolumeX, SkipForward, Eye, EyeOff
} from "lucide-react";

interface MetronomeProps {
  tempo?: number;
  playing?: boolean;
  onTempoChange?: (tempo: number) => void;
  onPlayingChange?: (playing: boolean) => void;
}

// ─── Types ──────────────────────────────────────────────────
type MetronomeMode = 'practice' | 'performance' | 'flow';
type SoundType = 'click' | 'woodblock' | 'kick' | 'soft' | 'hihat';

interface SetlistItem {
  name: string;
  bpm: number;
  timeSigIdx: number;
  beatsPerMeasure?: number;
}

// ─── Constants ──────────────────────────────────────────────
const TIME_SIGNATURES = [
  { label: '4/4', beats: 4, subdivision: 4 },
  { label: '3/4', beats: 3, subdivision: 4 },
  { label: '6/8', beats: 6, subdivision: 8 },
  { label: '5/4', beats: 5, subdivision: 4 },
  { label: '7/8', beats: 7, subdivision: 8 },
  { label: '2/4', beats: 2, subdivision: 4 },
  { label: '5/8', beats: 5, subdivision: 8 },
  { label: '9/8', beats: 9, subdivision: 8 },
  { label: '12/8', beats: 12, subdivision: 8 },
];

const SUBDIVISIONS = [
  { label: 'Quarter', short: '♩', value: 1 },
  { label: 'Eighth', short: '♫', value: 2 },
  { label: 'Triplet', short: '³', value: 3 },
  { label: 'Sixteenth', short: '♬', value: 4 },
];

const BPM_PRESETS = [
  { label: 'Largo', bpm: 50 },
  { label: 'Adagio', bpm: 70 },
  { label: 'Andante', bpm: 92 },
  { label: 'Moderato', bpm: 110 },
  { label: 'Allegro', bpm: 132 },
  { label: 'Vivace', bpm: 160 },
  { label: 'Presto', bpm: 184 },
];

const SOUNDS: { id: SoundType; label: string; accent: number; normal: number; sub: number; wave: OscillatorType }[] = [
  { id: 'click', label: 'Click', accent: 1200, normal: 800, sub: 600, wave: 'sine' },
  { id: 'woodblock', label: 'Woodblock', accent: 1400, normal: 1000, sub: 700, wave: 'triangle' },
  { id: 'kick', label: 'Kick/Snare', accent: 180, normal: 400, sub: 600, wave: 'sine' },
  { id: 'soft', label: 'Soft Tone', accent: 880, normal: 660, sub: 440, wave: 'sine' },
  { id: 'hihat', label: 'Hi-hat', accent: 8000, normal: 6000, sub: 4000, wave: 'square' },
];

// ─── Audio Engine ───────────────────────────────────────────
function createClick(
  audioCtx: AudioContext,
  time: number,
  isAccent: boolean,
  isSubdivision: boolean,
  sound: typeof SOUNDS[0],
  volume: number
) {
  const freq = isSubdivision ? sound.sub : isAccent ? sound.accent : sound.normal;
  const baseVol = isSubdivision ? 0.03 : isAccent ? 0.12 : 0.08;
  const dur = sound.id === 'kick' && isAccent ? 0.08 : 0.03;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  // For kick sound, add a pitch sweep
  if (sound.id === 'kick' && isAccent) {
    osc.frequency.setValueAtTime(freq * 3, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.04);
  } else {
    osc.frequency.value = freq;
  }

  // For hihat, use noise-like approach
  if (sound.id === 'hihat') {
    osc.type = 'square';
    osc.frequency.value = freq;
  } else {
    osc.type = sound.wave;
  }

  gain.gain.setValueAtTime(baseVol * volume, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur + 0.03);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(time);
  osc.stop(time + dur + 0.05);
}

function createAmbientPulse(audioCtx: AudioContext, time: number, volume: number) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 220;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.04 * volume, time + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(time);
  osc.stop(time + 0.7);
}

// ─── Helpers ────────────────────────────────────────────────
function getTempoLabel(bpm: number): string {
  return BPM_PRESETS.reduce((closest, p) =>
    Math.abs(p.bpm - bpm) < Math.abs(closest.bpm - bpm) ? p : closest
  ).label;
}

function loadSetlist(): SetlistItem[] {
  try {
    const raw = localStorage.getItem('metronome_setlist');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSetlist(items: SetlistItem[]) {
  localStorage.setItem('metronome_setlist', JSON.stringify(items));
}

// ─── Main Component ─────────────────────────────────────────
const Metronome = ({
  tempo: controlledTempo,
  playing: controlledPlaying,
  onTempoChange,
  onPlayingChange,
}: MetronomeProps) => {
  // Core state. bpm is fully controlled when a tempo prop is provided (the
  // local copy only serves prop-less mounts); playing is ENGINE state — it
  // reflects whether the scheduler is actually running, and the controlled
  // prop is reconciled into it via start/stop below.
  const [localBpm, setLocalBpm] = useState(controlledTempo ?? 120);
  const bpm = controlledTempo ?? localBpm;
  const [playing, setPlaying] = useState(false);
  const [timeSigIdx, setTimeSigIdx] = useState(0);
  const [subdivIdx, setSubdivIdx] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [accentFirst, setAccentFirst] = useState(true);
  const [swing, setSwing] = useState(50);
  const [volume, setVolume] = useState(1);
  const [soundIdx, setSoundIdx] = useState(0);

  const changeBpm = useCallback((next: number) => {
    const clamped = Math.min(300, Math.max(20, Math.round(next)));
    setLocalBpm(clamped);
    onTempoChange?.(clamped);
  }, [onTempoChange]);

  // Mode
  const [mode, setMode] = useState<MetronomeMode>('practice');

  // Practice mode
  const [tempoRamp, setTempoRamp] = useState(0); // BPM increase per loop
  const [loopBars, setLoopBars] = useState(4);
  const [dropout, setDropout] = useState(false);
  const [dropoutChance, setDropoutChance] = useState(30);

  // Performance mode
  const [setlist, setSetlist] = useState<SetlistItem[]>(loadSetlist);
  const [activeSetlistIdx, setActiveSetlistIdx] = useState(-1);
  const [newSongName, setNewSongName] = useState('');
  const [showSetlist, setShowSetlist] = useState(false);

  // Flow mode
  const [ambientSound, setAmbientSound] = useState(false);
  const [flowPulse, setFlowPulse] = useState(0); // 0-1 animation value

  // Tap tempo
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [tapStability, setTapStability] = useState<number | null>(null);

  // Timing feedback
  const [timingHistory, setTimingHistory] = useState<number[]>([]);
  const [timingFeedback, setTimingFeedback] = useState<'perfect' | 'rushing' | 'dragging' | null>(null);

  // Refs
  const intervalRef = useRef<number | null>(null);
  const beatRef = useRef(0);
  const barCountRef = useRef(0);
  const rampBpmRef = useRef(bpm);
  const lastBeatTimeRef = useRef(0);
  const playingRef = useRef(false);

  const timeSig = TIME_SIGNATURES[timeSigIdx];
  const subdivision = SUBDIVISIONS[subdivIdx].value;
  const sound = SOUNDS[soundIdx];

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  // ─── Audio Control ─────────────────────────────────────
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
    setPlaying(false);
    onPlayingChange?.(false);
    setCurrentBeat(-1);
    beatRef.current = 0;
    barCountRef.current = 0;
    rampBpmRef.current = bpm;
  }, [bpm, onPlayingChange]);

  const start = useCallback(() => {
    const ctx = getAudioContext();

    beatRef.current = 0;
    barCountRef.current = 0;
    rampBpmRef.current = bpm;
    setPlaying(true);
    onPlayingChange?.(true);

    const totalSubBeats = timeSig.beats * subdivision;
    const currentBpm = () => rampBpmRef.current;
    const swingRatio = swing / 100;

    const playBeat = () => {
      const activeBpm = currentBpm();
      const beatDuration = 60 / activeBpm;
      const mainBeat = Math.floor(beatRef.current / subdivision);
      const isAcc = accentFirst && beatRef.current === 0;
      const isSubBeat = beatRef.current % subdivision !== 0;

      // Dropout logic
      const shouldMute = dropout && !isAcc && Math.random() * 100 < dropoutChance;

      if (!shouldMute) {
        if (mode === 'flow' && ambientSound) {
          if (!isSubBeat) createAmbientPulse(ctx, ctx.currentTime, volume);
        } else {
          createClick(ctx, ctx.currentTime, isAcc, isSubBeat, sound, volume);
        }
      }

      setCurrentBeat(mainBeat);
      lastBeatTimeRef.current = performance.now();

      // Flow pulse
      if (mode === 'flow') {
        setFlowPulse(1);
        setTimeout(() => setFlowPulse(0), beatDuration * 500);
      }

      // Advance beat
      beatRef.current = (beatRef.current + 1) % totalSubBeats;

      // Bar counting for tempo ramp
      if (beatRef.current === 0) {
        barCountRef.current++;
        if (tempoRamp > 0 && barCountRef.current >= loopBars) {
          barCountRef.current = 0;
          rampBpmRef.current = Math.min(300, rampBpmRef.current + tempoRamp);
        }
      }

      // Calculate next delay with swing
      const subBeatInMain = beatRef.current % subdivision;
      let delayMs: number;

      if (subdivision === 1) {
        delayMs = beatDuration * 1000;
      } else if (subBeatInMain % 2 === 1) {
        delayMs = swingRatio * beatDuration * 1000 * (2 / subdivision);
      } else {
        delayMs = (subBeatInMain === 0 ? (1 - swingRatio) : (1 - swingRatio)) * beatDuration * 1000 * (2 / subdivision);
      }

      intervalRef.current = window.setTimeout(playBeat, delayMs);
    };

    playBeat();
  }, [bpm, timeSig, subdivision, accentFirst, swing, volume, sound, mode, ambientSound, dropout, dropoutChance, tempoRamp, loopBars, onPlayingChange]);

  // Restart on param change while playing
  useEffect(() => {
    if (!playingRef.current) {
      return;
    }

    stop();
    const t = window.setTimeout(() => start(), 50);
    return () => clearTimeout(t);
  }, [start, stop]);

  // Spacebar control
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        if (playing) stop(); else start();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [playing, start, stop]);

  // Cleanup
  useEffect(() => {
    return () => { if (intervalRef.current) clearTimeout(intervalRef.current); };
  }, []);

  // ─── Tap Tempo ─────────────────────────────────────────
  const handleTap = useCallback(() => {
    const now = performance.now();
    setTapTimes(prev => {
      const recent = [...prev, now].filter(t => now - t < 3000);
      if (recent.length >= 2) {
        const intervals = [];
        for (let i = 1; i < recent.length; i++) {
          intervals.push(recent[i] - recent[i - 1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const detectedBpm = Math.round(60000 / avgInterval);
        changeBpm(detectedBpm);

        // Stability
        if (intervals.length >= 3) {
          const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
          const stdDev = Math.sqrt(variance);
          const stability = Math.max(0, Math.min(100, 100 - (stdDev / avgInterval) * 200));
          setTapStability(Math.round(stability));
        }
      }
      return recent;
    });
  }, [changeBpm]);

  // ─── Timing Feedback (tap while playing) ───────────────
  const handleTimingTap = useCallback(() => {
    if (!playing) return;
    const now = performance.now();
    const expectedInterval = (60000 / bpm);
    const timeSinceLastBeat = now - lastBeatTimeRef.current;
    const offset = timeSinceLastBeat - expectedInterval;

    // Only track if we're within a reasonable window
    if (Math.abs(timeSinceLastBeat) < expectedInterval * 1.5) {
      const normalizedOffset = (timeSinceLastBeat % expectedInterval) - expectedInterval / 2;
      setTimingHistory(prev => [...prev.slice(-19), normalizedOffset]);

      if (Math.abs(normalizedOffset) < expectedInterval * 0.05) {
        setTimingFeedback('perfect');
      } else if (normalizedOffset < 0) {
        setTimingFeedback('rushing');
      } else {
        setTimingFeedback('dragging');
      }

      setTimeout(() => setTimingFeedback(null), 1000);
    }
  }, [playing, bpm]);

  // ─── Setlist ───────────────────────────────────────────
  const addToSetlist = () => {
    if (!newSongName.trim()) return;
    const item: SetlistItem = { name: newSongName.trim(), bpm, timeSigIdx };
    const updated = [...setlist, item];
    setSetlist(updated);
    saveSetlist(updated);
    setNewSongName('');
  };

  const removeFromSetlist = (idx: number) => {
    const updated = setlist.filter((_, i) => i !== idx);
    setSetlist(updated);
    saveSetlist(updated);
    if (activeSetlistIdx === idx) setActiveSetlistIdx(-1);
  };

  const loadSetlistItem = (idx: number) => {
    const item = setlist[idx];
    if (!item) return;
    changeBpm(item.bpm);
    setTimeSigIdx(item.timeSigIdx);
    setActiveSetlistIdx(idx);
  };

  const handleBpmChange = (delta: number) => {
    changeBpm(bpm + delta);
  };

  // ─── BPM Drag ──────────────────────────────────────────
  const dragRef = useRef<{ startY: number; startBpm: number } | null>(null);

  const handleBpmDragStart = (e: React.PointerEvent) => {
    dragRef.current = { startY: e.clientY, startBpm: bpm };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleBpmDragMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const delta = (dragRef.current.startY - e.clientY) * 0.5;
    changeBpm(dragRef.current.startBpm + delta);
  };

  const handleBpmDragEnd = () => { dragRef.current = null; };

  // Wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    handleBpmChange(e.deltaY < 0 ? 1 : -1);
  };

  const tempoLabel = getTempoLabel(bpm);

  // Desired-state reconciliation: the owner's playing prop drives the
  // scheduler. start/stop report the engine state back, so this converges
  // without echo suppression.
  useEffect(() => {
    if (typeof controlledPlaying !== "boolean" || controlledPlaying === playing) {
      return;
    }

    if (controlledPlaying) {
      start();
    } else {
      stop();
    }
  }, [controlledPlaying, playing, start, stop]);

  // ─── Render ────────────────────────────────────────────
  const isPerformance = mode === 'performance';
  const isFlow = mode === 'flow';

  return (
    <div className={`rounded-lg border border-border ${isPerformance ? 'bg-black' : 'bg-card'} p-3 sm:p-4 md:p-6 transition-colors`}>
      {/* Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
        <h3 className={`text-lg font-semibold ${isPerformance ? 'text-white' : ''}`}>Metronome</h3>
        <div className="flex gap-1">
          {([
            { id: 'practice' as const, label: 'Practice', shortLabel: 'Prac', icon: <Music2 size={14} /> },
            { id: 'performance' as const, label: 'Perform', shortLabel: 'Perf', icon: <Zap size={14} /> },
            { id: 'flow' as const, label: 'Flow', shortLabel: 'Flow', icon: <Waves size={14} /> },
          ]).map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-full border transition-colors touch-manipulation ${
                mode === m.id
                  ? 'border-amber-500 bg-amber-500/15 text-amber-400'
                  : `border-border ${isPerformance ? 'text-white/60 hover:text-white' : 'text-muted-foreground'} hover:bg-accent/50`
              }`}
            >
              {m.icon} <span className="hidden sm:inline">{m.label}</span><span className="sm:hidden">{m.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Flow Mode Visual ─────────────────────────── */}
      {isFlow && (
        <div className="flex flex-col items-center mb-8">
          <div
            className="relative flex items-center justify-center"
            style={{ width: 200, height: 200 }}
          >
            {/* Outer pulse ring */}
            <div
              className="absolute rounded-full border-2 border-amber-500/30 transition-all duration-300"
              style={{
                width: `${140 + flowPulse * 60}px`,
                height: `${140 + flowPulse * 60}px`,
                opacity: 0.3 + flowPulse * 0.5,
              }}
            />
            {/* Inner pulse ring */}
            <div
              className="absolute rounded-full border border-amber-500/20 transition-all duration-500"
              style={{
                width: `${120 + flowPulse * 80}px`,
                height: `${120 + flowPulse * 80}px`,
                opacity: 0.15 + flowPulse * 0.3,
              }}
            />
            {/* Center circle */}
            <div
              className="rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer select-none"
              style={{
                width: `${80 + flowPulse * 20}px`,
                height: `${80 + flowPulse * 20}px`,
                background: `radial-gradient(circle, hsl(40 95% 55% / ${0.2 + flowPulse * 0.4}), transparent)`,
                border: `2px solid hsl(40 95% 55% / ${0.3 + flowPulse * 0.5})`,
              }}
              onClick={() => playing ? stop() : start()}
            >
              {playing ? <Pause size={24} className="text-amber-400" /> : <Play size={24} className="text-amber-400" />}
            </div>
          </div>
        </div>
      )}

      {/* ─── BPM Display ──────────────────────────────── */}
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleBpmChange(-5)}
            className={`w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors ${isPerformance ? 'text-white' : ''}`}
          >
            <Minus size={16} />
          </button>
          <div
            className="text-center cursor-ns-resize select-none"
            onPointerDown={handleBpmDragStart}
            onPointerMove={handleBpmDragMove}
            onPointerUp={handleBpmDragEnd}
            onPointerCancel={handleBpmDragEnd}
            onWheel={handleWheel}
          >
            <div className={`text-5xl font-bold tabular-nums ${isPerformance ? 'text-white text-7xl' : 'text-foreground'}`}>
              {bpm}
            </div>
            <p className={`text-xs mt-1 ${isPerformance ? 'text-white/50' : 'text-muted-foreground'}`}>
              {tempoLabel} · drag or scroll
            </p>
          </div>
          <button
            onClick={() => handleBpmChange(5)}
            className={`w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors ${isPerformance ? 'text-white' : ''}`}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* BPM Slider */}
        {!isFlow && (
          <input
            type="range"
            min={20}
            max={300}
            value={bpm}
            onChange={(e) => changeBpm(Number(e.target.value))}
            className="w-full max-w-xs mt-3 accent-amber-500"
          />
        )}

        {/* Tempo presets (practice only) */}
        {mode === 'practice' && (
          <div className="flex flex-wrap gap-1 mt-3 justify-center">
            {BPM_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => changeBpm(p.bpm)}
                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                  Math.abs(bpm - p.bpm) < 10
                    ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                    : 'border-border text-muted-foreground hover:bg-accent'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Tap Tempo ────────────────────────────────── */}
      <div className="flex justify-center gap-3 mb-6">
        <button
          onClick={handleTap}
          className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium border transition-colors touch-manipulation active:scale-95 ${
            isPerformance
              ? 'border-white/30 text-white hover:bg-white/10'
              : 'border-border text-foreground hover:bg-accent'
          }`}
        >
          <Hand size={16} /> Tap Tempo
        </button>
        {tapStability !== null && (
          <div className={`flex items-center gap-1 text-xs ${isPerformance ? 'text-white/60' : 'text-muted-foreground'}`}>
            <div className={`w-2 h-2 rounded-full ${
              tapStability > 80 ? 'bg-emerald-500' : tapStability > 50 ? 'bg-amber-500' : 'bg-red-500'
            }`} />
            {tapStability}% stable
          </div>
        )}
      </div>

      {/* ─── Beat Indicator ───────────────────────────── */}
      <div className="flex justify-center flex-wrap gap-1.5 sm:gap-2 mb-6">
        {Array.from({ length: timeSig.beats }).map((_, i) => (
          <div
            key={i}
            onClick={handleTimingTap}
            className={`w-9 h-9 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-100 cursor-pointer touch-manipulation ${
              currentBeat === i
                ? i === 0 && accentFirst
                  ? 'bg-amber-500 border-amber-400 text-black scale-110'
                  : isPerformance
                    ? 'bg-white border-white text-black scale-110'
                    : 'bg-primary border-primary text-primary-foreground scale-110'
                : isPerformance
                  ? 'border-white/30 text-white/40'
                  : 'border-border text-muted-foreground'
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Timing Feedback */}
      {timingFeedback && (
        <div className="flex justify-center mb-4">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            timingFeedback === 'perfect' ? 'bg-emerald-500/15 text-emerald-400' :
            timingFeedback === 'rushing' ? 'bg-red-500/15 text-red-400' :
            'bg-orange-500/15 text-orange-400'
          }`}>
            {timingFeedback === 'perfect' ? '✓ Perfect' :
             timingFeedback === 'rushing' ? '⚡ Rushing' : '🐌 Dragging'}
          </span>
        </div>
      )}

      {/* ─── Play / Stop ──────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        <button
          onClick={() => (playing ? stop() : start())}
          className={`flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-semibold transition-colors ${
            playing
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              : isPerformance
                ? 'bg-white text-black hover:bg-white/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
          {playing ? 'Stop' : 'Start'}
        </button>
        <span className={`text-[10px] ${isPerformance ? 'text-white/30' : 'text-muted-foreground/50'}`}>
          or press Space
        </span>
      </div>

      {/* ─── Controls Grid ────────────────────────────── */}
      {!isFlow && (
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 p-4 rounded-lg ${isPerformance ? 'bg-white/5' : 'bg-secondary/30'} border border-border/50`}>
          {/* Time signature */}
          <div>
            <label className={`text-[10px] uppercase tracking-wider ${isPerformance ? 'text-white/40' : 'text-muted-foreground'}`}>Time</label>
            <select
              value={timeSigIdx}
              onChange={(e) => setTimeSigIdx(Number(e.target.value))}
              className="w-full mt-1 bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {TIME_SIGNATURES.map((ts, i) => (
                <option key={ts.label} value={i}>{ts.label}</option>
              ))}
            </select>
          </div>

          {/* Subdivision */}
          <div>
            <label className={`text-[10px] uppercase tracking-wider ${isPerformance ? 'text-white/40' : 'text-muted-foreground'}`}>Subdivide</label>
            <div className="flex gap-1 mt-1">
              {SUBDIVISIONS.map((s, i) => (
                <button
                  key={s.short}
                  onClick={() => setSubdivIdx(i)}
                  className={`flex-1 h-8 rounded border text-xs transition-colors ${
                    subdivIdx === i
                      ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                      : 'border-border text-muted-foreground hover:bg-accent'
                  }`}
                  title={s.label}
                >
                  {s.short}
                </button>
              ))}
            </div>
          </div>

          {/* Sound */}
          <div>
            <label className={`text-[10px] uppercase tracking-wider ${isPerformance ? 'text-white/40' : 'text-muted-foreground'}`}>Sound</label>
            <select
              value={soundIdx}
              onChange={(e) => setSoundIdx(Number(e.target.value))}
              className="w-full mt-1 bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {SOUNDS.map((s, i) => (
                <option key={s.id} value={i}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Volume */}
          <div>
            <label className={`text-[10px] uppercase tracking-wider ${isPerformance ? 'text-white/40' : 'text-muted-foreground'}`}>Volume</label>
            <div className="flex items-center gap-2 mt-1">
              {volume === 0 ? <VolumeX size={14} className="text-muted-foreground" /> : <Volume2 size={14} className="text-muted-foreground" />}
              <input
                type="range"
                min={0}
                max={100}
                value={volume * 100}
                onChange={(e) => setVolume(Number(e.target.value) / 100)}
                className="flex-1 accent-amber-500"
              />
            </div>
          </div>

          {/* Accent */}
          <div>
            <button
              onClick={() => setAccentFirst(!accentFirst)}
              className={`text-xs px-3 py-1.5 rounded border transition-colors w-full ${
                accentFirst
                  ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                  : 'border-border text-muted-foreground hover:bg-accent'
              }`}
            >
              Accent Beat 1
            </button>
          </div>

          {/* Swing */}
          <div className="col-span-1 md:col-span-3">
            <div className="flex items-center gap-3">
              <label className={`text-[10px] uppercase tracking-wider whitespace-nowrap ${isPerformance ? 'text-white/40' : 'text-muted-foreground'}`}>Swing</label>
              <input
                type="range"
                min={50}
                max={75}
                value={swing}
                onChange={(e) => setSwing(Number(e.target.value))}
                className="flex-1 accent-amber-500"
              />
              <span className={`text-xs font-mono w-10 text-right ${swing > 50 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                {swing}%
              </span>
              <div className="flex gap-1">
                {[
                  { label: 'Str', value: 50 },
                  { label: 'Lite', value: 58 },
                  { label: 'Trip', value: 67 },
                  { label: 'Hard', value: 72 },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setSwing(p.value)}
                    className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                      swing === p.value
                        ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                        : 'border-border text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Practice Mode Extras ─────────────────────── */}
      {mode === 'practice' && (
        <div className="p-4 rounded-lg bg-secondary/30 border border-border/50 mb-4 space-y-4">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Settings2 size={14} /> Practice Tools
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tempo Ramp */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Tempo Ramp</label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">+</span>
                <input
                  type="number"
                  value={tempoRamp}
                  min={0}
                  max={20}
                  onChange={(e) => setTempoRamp(Math.max(0, Number(e.target.value) || 0))}
                  className="w-14 bg-secondary border border-border rounded px-2 py-1 text-sm text-foreground text-center focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <span className="text-[10px] text-muted-foreground">BPM every</span>
                <input
                  type="number"
                  value={loopBars}
                  min={1}
                  max={32}
                  onChange={(e) => setLoopBars(Math.max(1, Number(e.target.value) || 1))}
                  className="w-12 bg-secondary border border-border rounded px-2 py-1 text-sm text-foreground text-center focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <span className="text-[10px] text-muted-foreground">bars</span>
              </div>
              {tempoRamp > 0 && (
                <p className="text-[10px] text-amber-400/60 mt-1">
                  Will increase from {bpm} → {Math.min(300, bpm + tempoRamp * 5)} over {loopBars * 5} bars
                </p>
              )}
            </div>

            {/* Dropout Training */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Drop-Out Training</label>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => setDropout(!dropout)}
                  className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                    dropout
                      ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                      : 'border-border text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {dropout ? <Eye size={12} className="inline mr-1" /> : <EyeOff size={12} className="inline mr-1" />}
                  {dropout ? 'On' : 'Off'}
                </button>
                {dropout && (
                  <div className="flex items-center gap-1">
                    <input
                      type="range"
                      min={10}
                      max={80}
                      value={dropoutChance}
                      onChange={(e) => setDropoutChance(Number(e.target.value))}
                      className="w-20 accent-amber-500"
                    />
                    <span className="text-[10px] text-muted-foreground">{dropoutChance}%</span>
                  </div>
                )}
              </div>
              {dropout && (
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  Randomly mutes {dropoutChance}% of beats to train internal timing
                </p>
              )}
            </div>

            {/* Timing Analysis */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Timing Feedback</label>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                Tap the beat circles while playing to get timing analysis
              </p>
              {timingHistory.length > 3 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-6 bg-secondary rounded overflow-hidden flex items-end">
                    {timingHistory.slice(-10).map((offset, i) => {
                      const normalized = Math.max(-1, Math.min(1, offset / (60000 / bpm / 2)));
                      return (
                        <div
                          key={i}
                          className="flex-1 mx-px rounded-t"
                          style={{
                            height: `${Math.abs(normalized) * 100}%`,
                            background: Math.abs(normalized) < 0.1 ? '#22c55e' : normalized < 0 ? '#ef4444' : '#f97316',
                            minHeight: '2px',
                          }}
                        />
                      );
                    })}
                  </div>
                  <span className="text-[9px] text-muted-foreground">timing</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Performance Mode Extras ──────────────────── */}
      {mode === 'performance' && (
        <div className="p-4 rounded-lg bg-white/5 border border-white/10 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Zap size={14} /> Setlist
            </p>
            <button
              onClick={() => setShowSetlist(!showSetlist)}
              className="text-white/40 hover:text-white"
            >
              {showSetlist ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {showSetlist && (
            <>
              {/* Add song */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newSongName}
                  onChange={(e) => setNewSongName(e.target.value)}
                  placeholder="Song name..."
                  className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  onKeyDown={(e) => e.key === 'Enter' && addToSetlist()}
                />
                <button
                  onClick={addToSetlist}
                  disabled={!newSongName.trim()}
                  className="px-3 py-1.5 rounded border border-white/20 text-white/60 text-xs hover:bg-white/10 disabled:opacity-30"
                >
                  <Save size={14} />
                </button>
              </div>

              {/* Song list */}
              {setlist.length === 0 ? (
                <p className="text-xs text-white/30 italic">No songs yet — add one above</p>
              ) : (
                <div className="space-y-1">
                  {setlist.map((song, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${
                        activeSetlistIdx === i
                          ? 'bg-amber-500/20 border border-amber-500/40'
                          : 'hover:bg-white/10 border border-transparent'
                      }`}
                      onClick={() => loadSetlistItem(i)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-white/30 text-xs w-4">{i + 1}</span>
                        <span className={`text-sm ${activeSetlistIdx === i ? 'text-amber-400 font-semibold' : 'text-white'}`}>
                          {song.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-white/40">{song.bpm} BPM</span>
                        <span className="text-xs text-white/30">{TIME_SIGNATURES[song.timeSigIdx]?.label}</span>
                        {activeSetlistIdx === i && i < setlist.length - 1 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); loadSetlistItem(i + 1); }}
                            className="text-white/40 hover:text-white"
                            title="Next song"
                          >
                            <SkipForward size={12} />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFromSetlist(i); }}
                          className="text-white/20 hover:text-red-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── Flow Mode Controls ───────────────────────── */}
      {isFlow && (
        <div className="flex justify-center gap-3 mb-4">
          <button
            onClick={() => setAmbientSound(!ambientSound)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              ambientSound
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-border text-muted-foreground hover:bg-accent'
            }`}
          >
            {ambientSound ? '🔔 Ambient Tone' : '🔊 Click Sound'}
          </button>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-muted-foreground">Vol</label>
            <input
              type="range"
              min={0}
              max={100}
              value={volume * 100}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              className="w-20 accent-amber-500"
            />
          </div>
        </div>
      )}

      {/* Subdivision hint for swing */}
      {subdivision === 1 && swing > 50 && !isFlow && (
        <p className="text-center text-[10px] text-muted-foreground/60 italic">
          Swing is audible with subdivisions (♫ or ♬)
        </p>
      )}
    </div>
  );
};

export default Metronome;
