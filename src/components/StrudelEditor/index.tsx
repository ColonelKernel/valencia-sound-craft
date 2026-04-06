/**
 * StrudelEditor — full pattern editor with code editor, transport controls,
 * and live audio visualization.
 *
 * This component is completely isolated from the rest of the UI.
 * It communicates ONLY through the rhythm event bus + strudelEngine API.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Volume2, VolumeX, Zap, RotateCcw, ChevronDown, ChevronRight, Send } from 'lucide-react';
import { strudelEngine, type StrudelEngineState } from '@/lib/strudelEngine';
import { rhythmBus, type RhythmPayload } from '@/lib/rhythmBus';
import { generateExamplePattern } from '@/lib/drumToStrudel';

// ─── Example patterns ────────────────────────────────────────────────────────

const EXAMPLE_PATTERNS = [
  {
    label: 'Basic Rock',
    pattern: `stack(
  sound("bd ~ bd ~"),
  sound("~ sn ~ sn"),
  sound("hh hh hh hh")
)`,
  },
  {
    label: 'Bossa Nova',
    pattern: `stack(
  sound("bd ~ ~ bd ~ bd ~ ~"),
  sound("~ ~ rm ~ ~ ~ rm ~"),
  sound("hh*4").gain(0.5)
)`,
  },
  {
    label: 'Afrobeat',
    pattern: `stack(
  sound("bd ~ bd ~ ~ bd ~ ~"),
  sound("~ ~ ~ sn ~ ~ sn ~"),
  sound("hh*8").gain(0.4),
  sound("cl ~ cl ~ cl ~ ~ cl").gain(0.5)
)`,
  },
  {
    label: 'Trap',
    pattern: `stack(
  sound("bd ~ ~ ~ bd ~ ~ ~"),
  sound("~ ~ ~ ~ sn ~ ~ ~"),
  sound("hh*16").gain(0.25)
)`,
  },
  {
    label: 'Tabla',
    pattern: `sound("bd hh cp hh bd bd cp hh")`,
  },
  {
    label: 'Synthwave',
    pattern: `stack(
  sound("bd ~ ~ bd ~ ~ bd ~"),
  sound("~ ~ cp ~ ~ ~ cp ~"),
  sound("hh*8").gain(0.2),
  sound("oh ~ ~ ~ oh ~ ~ ~").gain(0.3)
)`,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

const StrudelEditor = () => {
  const [code, setCode] = useState(EXAMPLE_PATTERNS[0].pattern);
  const [engineState, setEngineState] = useState<StrudelEngineState>({
    playing: false,
    tempo: 120,
    volume: 0.8,
    currentPattern: null,
    ready: false,
    error: null,
  });
  const [tempo, setTempo] = useState(120);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Subscribe to engine state
  useEffect(() => {
    const unsub = strudelEngine.subscribe(setEngineState);
    return () => { unsub(); };
  }, []);

  // Subscribe to incoming rhythm data from other tools
  useEffect(() => {
    const unsubs = [
      rhythmBus.on('PLAY_REQUESTED', (data: RhythmPayload) => {
        if (data.pattern) {
          setCode(data.pattern);
          if (data.tempo) setTempo(data.tempo);
        }
      }),
      rhythmBus.on('RHYTHM_SELECTED', (data: RhythmPayload) => {
        if (data.pattern) {
          setCode(data.pattern);
          if (data.tempo) setTempo(data.tempo);
        }
      }),
      rhythmBus.on('PATTERN_UPDATED', (data: RhythmPayload) => {
        if (data.pattern) {
          setCode(data.pattern);
        }
      }),
    ];
    return () => unsubs.forEach(fn => fn());
  }, []);

  const handlePlay = useCallback(async () => {
    if (engineState.playing) {
      strudelEngine.stop();
    } else {
      await strudelEngine.play(code, { tempo, volume: muted ? 0 : volume });
    }
  }, [code, tempo, volume, muted, engineState.playing]);

  const handleStop = useCallback(() => {
    strudelEngine.stop();
  }, []);

  const handleTempoChange = useCallback((newTempo: number) => {
    setTempo(newTempo);
    strudelEngine.setTempo(newTempo);
    rhythmBus.emit('TEMPO_CHANGED', { tempo: newTempo });
  }, []);

  const handleVolumeChange = useCallback((newVol: number) => {
    setVolume(newVol);
    if (!muted) {
      strudelEngine.setVolume(newVol);
      rhythmBus.emit('VOLUME_CHANGED', { volume: newVol });
    }
  }, [muted]);

  const handleMuteToggle = useCallback(() => {
    setMuted(m => {
      strudelEngine.setVolume(m ? volume : 0);
      return !m;
    });
  }, [volume]);

  const handleLoadExample = useCallback((pattern: string) => {
    setCode(pattern);
    if (engineState.playing) {
      strudelEngine.update(pattern);
    }
  }, [engineState.playing]);

  const handleUpdateLive = useCallback(async () => {
    if (engineState.playing) {
      await strudelEngine.update(code);
    } else {
      await strudelEngine.play(code, { tempo, volume: muted ? 0 : volume });
    }
  }, [code, tempo, volume, muted, engineState.playing]);

  return (
    <div className="rounded-lg border border-border bg-card p-3 sm:p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Strudel Pattern Editor
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Live-code rhythms using Strudel mini-notation. Patterns from other tools appear here automatically.
          </p>
        </div>
        {!engineState.ready && !initError && (
          <span className="text-xs text-muted-foreground animate-pulse">Initializing audio engine…</span>
        )}
        {initError && (
          <span className="text-xs text-destructive">{initError}</span>
        )}
      </div>

      {/* Transport Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Play / Stop */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePlay}
            className={`inline-flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
              engineState.playing
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
            title={engineState.playing ? 'Stop' : 'Play'}
          >
            {engineState.playing ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={handleUpdateLive}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="Evaluate & update live"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Tempo */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">BPM</label>
          <input
            type="number"
            min={20}
            max={400}
            value={tempo}
            onChange={e => handleTempoChange(Number(e.target.value))}
            className="w-16 bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground text-center focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleMuteToggle}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={e => handleVolumeChange(Number(e.target.value))}
            className="w-20 accent-primary"
          />
        </div>

        {/* Status indicator */}
        <div className="ml-auto flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${
            engineState.playing ? 'bg-green-500 animate-pulse' : engineState.ready ? 'bg-muted-foreground/40' : 'bg-amber-500'
          }`} />
          <span className="text-[10px] text-muted-foreground">
            {engineState.playing ? 'Playing' : engineState.ready ? 'Ready' : 'Loading'}
          </span>
        </div>
      </div>

      {/* Code Editor */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => {
            // Ctrl/Cmd+Enter to evaluate
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleUpdateLive();
            }
          }}
          spellCheck={false}
          className="w-full h-48 sm:h-56 bg-secondary/80 border border-border rounded-lg p-4 font-mono text-sm text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed"
          placeholder='Type a Strudel pattern, e.g. sound("bd sn hh hh")'
        />
        <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground/50">
          Ctrl+Enter to evaluate
        </div>
      </div>

      {/* Error display */}
      {engineState.error && (
        <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2">
          {engineState.error}
        </div>
      )}

      {/* Example Patterns */}
      <div>
        <button
          onClick={() => setShowExamples(s => !s)}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {showExamples ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          Example Patterns
        </button>
        {showExamples && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mt-3">
            {EXAMPLE_PATTERNS.map(ex => (
              <button
                key={ex.label}
                onClick={() => handleLoadExample(ex.pattern)}
                className="px-3 py-2 text-xs font-medium rounded-md border border-border bg-secondary/50 text-foreground hover:bg-accent hover:border-primary/30 transition-colors text-left"
              >
                {ex.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-[10px] text-muted-foreground/60 border-t border-border pt-3 space-y-1">
        <p>
          <strong>Mini-notation:</strong> <code className="bg-secondary px-1 rounded">sound("bd sn")</code> plays kick then snare.
          Use <code className="bg-secondary px-1 rounded">stack()</code> for layers, <code className="bg-secondary px-1 rounded">*n</code> for repeats, <code className="bg-secondary px-1 rounded">~</code> for rests.
        </p>
        <p>
          Patterns sent from the Rhythm Engine or Map will appear here automatically.
        </p>
      </div>
    </div>
  );
};

export default StrudelEditor;
