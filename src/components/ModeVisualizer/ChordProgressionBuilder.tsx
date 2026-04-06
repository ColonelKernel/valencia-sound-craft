import { useState, useRef, useCallback } from "react";
import { Play, Pause, Plus, X, Volume2, RotateCcw } from "lucide-react";
import { type ChordSpelling } from "./scaleData";

// Common progressions templates (by degree index, 0-based)
const PROGRESSION_TEMPLATES = [
  { label: 'I – V – vi – IV', degrees: [0, 4, 5, 3], desc: 'Pop classic' },
  { label: 'I – IV – V – I', degrees: [0, 3, 4, 0], desc: 'Blues/rock' },
  { label: 'ii – V – I', degrees: [1, 4, 0], desc: 'Jazz standard' },
  { label: 'I – vi – IV – V', degrees: [0, 5, 3, 4], desc: '50s progression' },
  { label: 'vi – IV – I – V', degrees: [5, 3, 0, 4], desc: 'Axis of awesome' },
  { label: 'I – IV – vi – V', degrees: [0, 3, 5, 4], desc: 'Modern pop' },
  { label: 'i – bVI – bIII – bVII', degrees: [0, 5, 2, 6], desc: 'Andalusian' },
  { label: 'I – V – vi – iii – IV', degrees: [0, 4, 5, 2, 3], desc: 'Canon in D' },
];

interface ChordProgressionBuilderProps {
  chordSpellings: ChordSpelling[];
  root: string;
  mode: string;
}

// Simple chord audio using Web Audio API
function playChordTones(notes: string[], duration = 0.8) {
  const ctx = new AudioContext();
  const NOTE_FREQ: Record<string, number> = {
    'C': 261.63, 'C#': 277.18, 'Db': 277.18,
    'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
    'E': 329.63, 'F': 349.23, 'F#': 369.99, 'Gb': 369.99,
    'G': 392.00, 'G#': 415.30, 'Ab': 415.30,
    'A': 440.00, 'A#': 466.16, 'Bb': 466.16, 'B': 493.88,
  };

  notes.forEach((note, i) => {
    const freq = NOTE_FREQ[note];
    if (!freq) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq * (i > 1 ? 1 : 1); // keep same octave
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration + 0.05);
  });
}

const ChordProgressionBuilder = ({
  chordSpellings,
  root,
  mode,
}: ChordProgressionBuilderProps) => {
  const [progression, setProgression] = useState<number[]>([0, 3, 4, 0]);
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [bpm, setBpm] = useState(100);
  const [beatsPerChord, setBeatsPerChord] = useState(4);
  const timeoutRef = useRef<number[]>([]);

  const stop = useCallback(() => {
    timeoutRef.current.forEach(clearTimeout);
    timeoutRef.current = [];
    setPlaying(false);
    setCurrentIdx(-1);
  }, []);

  const playProgression = useCallback(() => {
    if (chordSpellings.length === 0 || progression.length === 0) return;
    stop();
    setPlaying(true);

    const chordDuration = (60 / bpm) * beatsPerChord * 1000;
    const ids: number[] = [];

    progression.forEach((degreeIdx, i) => {
      const chord = chordSpellings[degreeIdx % chordSpellings.length];
      if (!chord) return;
      const id = window.setTimeout(() => {
        setCurrentIdx(i);
        playChordTones(chord.notes, (chordDuration / 1000) * 0.9);
      }, i * chordDuration);
      ids.push(id);
    });

    // Stop after last chord
    const endId = window.setTimeout(() => {
      setPlaying(false);
      setCurrentIdx(-1);
    }, progression.length * chordDuration);
    ids.push(endId);

    timeoutRef.current = ids;
  }, [chordSpellings, progression, bpm, beatsPerChord, stop]);

  const addChord = (degreeIdx: number) => {
    setProgression([...progression, degreeIdx]);
  };

  const removeChord = (idx: number) => {
    setProgression(progression.filter((_, i) => i !== idx));
  };

  const loadTemplate = (degrees: number[]) => {
    stop();
    // Clamp degrees to available chords
    setProgression(degrees.map(d => Math.min(d, chordSpellings.length - 1)));
  };

  if (chordSpellings.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-2">Chord Progression Builder</h3>
        <p className="text-sm text-muted-foreground">No chords available for this scale. Try a 7-note mode.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 md:p-6">
      <h3 className="text-lg font-semibold mb-4">Chord Progression Builder</h3>

      {/* Current key context */}
      <p className="text-xs text-muted-foreground mb-4">
        Key: <span className="font-semibold text-foreground">{root} {mode}</span> — click chords below to build your progression
      </p>

      {/* Progression Timeline */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">Your Progression</p>
        <div className="flex flex-wrap gap-2 min-h-[56px] p-3 rounded-lg border border-dashed border-border bg-secondary/30">
          {progression.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Click chords below to add them here…</p>
          ) : (
            progression.map((degreeIdx, i) => {
              const chord = chordSpellings[degreeIdx % chordSpellings.length];
              if (!chord) return null;
              return (
                <div
                  key={i}
                  className={`relative group flex flex-col items-center justify-center px-4 py-2 rounded-lg border text-sm transition-all ${
                    currentIdx === i
                      ? 'border-amber-500 bg-amber-500/15 text-amber-300 scale-105 shadow-lg shadow-amber-500/20'
                      : 'border-border bg-card hover:border-muted-foreground'
                  }`}
                >
                  <span className="font-bold">{chord.roman}</span>
                  <span className="text-[10px] text-muted-foreground">{chord.notes.join(' ')}</span>
                  <button
                    onClick={() => removeChord(i)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Available Chords */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">Available Chords</p>
        <div className="flex flex-wrap gap-2">
          {chordSpellings.map((chord, i) => (
            <button
              key={i}
              onClick={() => addChord(i)}
              className="flex flex-col items-center px-3 py-2 rounded-lg border border-border hover:border-amber-500/50 hover:bg-amber-500/5 transition-colors text-sm"
            >
              <span className="font-bold">{chord.roman}</span>
              <span className="text-[10px] text-muted-foreground">{chord.notes.join('-')}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Templates */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">Common Progressions</p>
        <div className="flex flex-wrap gap-2">
          {PROGRESSION_TEMPLATES.filter(t => t.degrees.every(d => d < chordSpellings.length)).map((t) => (
            <button
              key={t.label}
              onClick={() => loadTemplate(t.degrees)}
              className="text-xs px-3 py-1.5 rounded border border-border hover:bg-accent transition-colors text-muted-foreground"
              title={t.desc}
            >
              {t.label} <span className="text-muted-foreground/60">({t.desc})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={() => (playing ? stop() : playProgression())}
          disabled={progression.length === 0}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            playing
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
          {playing ? 'Stop' : 'Play'}
        </button>

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">BPM</label>
          <input
            type="number"
            value={bpm}
            min={40}
            max={240}
            onChange={(e) => setBpm(Math.min(240, Math.max(40, Number(e.target.value) || 40)))}
            className="w-16 bg-secondary border border-border rounded px-2 py-1 text-sm text-foreground text-center focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Beats/chord</label>
          <select
            value={beatsPerChord}
            onChange={(e) => setBeatsPerChord(Number(e.target.value))}
            className="bg-secondary border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {[1, 2, 4, 8].map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => { stop(); setProgression([]); }}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border hover:bg-accent transition-colors text-muted-foreground"
        >
          <RotateCcw size={12} /> Clear
        </button>

        <button
          onClick={() => {
            if (progression.length > 0) {
              const chord = chordSpellings[progression[0] % chordSpellings.length];
              if (chord) playChordTones(chord.notes);
            }
          }}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border hover:bg-accent transition-colors text-muted-foreground"
          title="Preview first chord"
        >
          <Volume2 size={12} /> Preview
        </button>
      </div>
    </div>
  );
};

export default ChordProgressionBuilder;
