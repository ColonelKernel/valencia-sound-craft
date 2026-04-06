import { useState, useRef, useCallback, useMemo } from "react";
import { Play, Pause, Plus, X, Volume2, RotateCcw, Sparkles, ArrowRightLeft, Music2, ChevronDown, ChevronUp, Download, ArrowLeft, ArrowRight, GripVertical } from "lucide-react";
import { type ChordSpelling, getScaleNotes, getChordSpellings, MODE_INTERVALS, ALL_ROOTS, MODE_CATEGORIES } from "./scaleData";
import { type InstrumentTimbre, INSTRUMENT_TIMBRES } from "./audioSynth";

// ─── Constants ──────────────────────────────────────────────
const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

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

// Parallel modes for borrowing depending on current mode type
const PARALLEL_BORROW_MODES: Record<string, string[]> = {
  'Ionian': ['Aeolian', 'Dorian', 'Mixolydian', 'Phrygian', 'Lydian'],
  'Dorian': ['Ionian', 'Aeolian', 'Mixolydian'],
  'Phrygian': ['Aeolian', 'Phrygian Dominant'],
  'Lydian': ['Ionian', 'Mixolydian'],
  'Mixolydian': ['Ionian', 'Dorian', 'Aeolian'],
  'Aeolian': ['Ionian', 'Dorian', 'Mixolydian', 'Harmonic Minor'],
  'Locrian': ['Aeolian', 'Phrygian'],
  'Harmonic Minor': ['Aeolian', 'Ionian'],
  'Melodic Minor': ['Aeolian', 'Ionian', 'Dorian'],
};

interface ProgressionChord {
  chord: ChordSpelling;
  source: 'diatonic' | 'borrowed' | 'secondary-dom' | 'tritone-sub';
  sourceLabel?: string;
}

interface ChordProgressionBuilderProps {
  chordSpellings: ChordSpelling[];
  root: string;
  mode: string;
}

// ─── MIDI Export ────────────────────────────────────────────
const NOTE_MIDI: Record<string, number> = {
  'C': 60, 'C#': 61, 'Db': 61, 'D': 62, 'D#': 63, 'Eb': 63,
  'E': 64, 'F': 65, 'F#': 66, 'Gb': 66, 'G': 67, 'G#': 68, 'Ab': 68,
  'A': 69, 'A#': 70, 'Bb': 70, 'B': 71,
};

function writeVarLen(value: number): number[] {
  const bytes: number[] = [];
  let v = value;
  bytes.unshift(v & 0x7f);
  while ((v >>= 7) > 0) {
    bytes.unshift((v & 0x7f) | 0x80);
  }
  return bytes;
}

function buildMidiFile(chords: ProgressionChord[], bpm: number, beatsPerChord: number): Uint8Array {
  const ticksPerBeat = 480;
  const chordTicks = ticksPerBeat * beatsPerChord;
  const velocity = 100;

  // Build track data
  const trackEvents: number[] = [];

  // Tempo meta event: FF 51 03 tt tt tt (microseconds per beat)
  const usPerBeat = Math.round(60_000_000 / bpm);
  trackEvents.push(0x00, 0xff, 0x51, 0x03,
    (usPerBeat >> 16) & 0xff, (usPerBeat >> 8) & 0xff, usPerBeat & 0xff);

  chords.forEach((pc) => {
    const midiNotes = pc.chord.notes
      .map(n => NOTE_MIDI[n])
      .filter((n): n is number => n !== undefined);

    // Note-on events (delta=0 for all notes in chord)
    midiNotes.forEach((note, i) => {
      trackEvents.push(...writeVarLen(i === 0 ? 0 : 0));
      trackEvents.push(0x90, note, velocity);
    });

    // Note-off events after chord duration
    midiNotes.forEach((note, i) => {
      trackEvents.push(...writeVarLen(i === 0 ? chordTicks : 0));
      trackEvents.push(0x80, note, 0);
    });
  });

  // End of track
  trackEvents.push(0x00, 0xff, 0x2f, 0x00);

  // Build MIDI file
  const header = [
    0x4d, 0x54, 0x68, 0x64, // "MThd"
    0x00, 0x00, 0x00, 0x06, // header length
    0x00, 0x00,             // format 0
    0x00, 0x01,             // 1 track
    (ticksPerBeat >> 8) & 0xff, ticksPerBeat & 0xff,
  ];

  const trackHeader = [
    0x4d, 0x54, 0x72, 0x6b, // "MTrk"
    (trackEvents.length >> 24) & 0xff,
    (trackEvents.length >> 16) & 0xff,
    (trackEvents.length >> 8) & 0xff,
    trackEvents.length & 0xff,
  ];

  return new Uint8Array([...header, ...trackHeader, ...trackEvents]);
}

function downloadMidi(chords: ProgressionChord[], bpm: number, beatsPerChord: number, root: string, mode: string) {
  const data = buildMidiFile(chords, bpm, beatsPerChord);
  const blob = new Blob([data.buffer as ArrayBuffer], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${root}_${mode}_progression.mid`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Audio ──────────────────────────────────────────────────
function playChordTones(notes: string[], duration = 0.8, timbre: InstrumentTimbre = 'piano') {
  const ctx = new AudioContext();
  const NOTE_FREQ: Record<string, number> = {
    'C': 261.63, 'C#': 277.18, 'Db': 277.18,
    'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
    'E': 329.63, 'F': 349.23, 'F#': 369.99, 'Gb': 369.99,
    'G': 392.00, 'G#': 415.30, 'Ab': 415.30,
    'A': 440.00, 'A#': 466.16, 'Bb': 466.16, 'B': 493.88,
  };

  const volume = 0.08;

  notes.forEach((note, i) => {
    const freq = NOTE_FREQ[note];
    if (!freq) return;
    const startTime = ctx.currentTime + i * 0.03;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Apply simple timbre mapping
    switch (timbre) {
      case 'guitar': osc.type = 'triangle'; break;
      case 'organ': osc.type = 'sine'; break;
      case 'synth-pad': osc.type = 'sawtooth'; break;
      case 'bright-lead': osc.type = 'square'; break;
      case 'warm-bass': osc.type = 'sine'; break;
      default: osc.type = 'triangle'; break;
    }
    osc.frequency.value = timbre === 'warm-bass' ? freq / 2 : freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.stop(startTime + duration + 0.05);
  });
}

// ─── Helpers ────────────────────────────────────────────────
function getNoteAtSemitone(root: string, semitones: number): string {
  const useFlats = root.includes('b') || ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'].includes(root);
  const chromatic = useFlats ? NOTES_FLAT : NOTES_SHARP;
  let idx = chromatic.indexOf(root);
  if (idx === -1) {
    const alt = useFlats ? NOTES_SHARP : NOTES_FLAT;
    idx = alt.indexOf(root);
    if (idx === -1) return root;
    return chromatic[(idx + semitones) % 12];
  }
  return chromatic[(idx + semitones) % 12];
}

function getSecondaryDominants(root: string, mode: string, diatonicChords: ChordSpelling[]): ProgressionChord[] {
  const intervals = MODE_INTERVALS[mode];
  if (!intervals || intervals.length < 7) return [];
  
  const results: ProgressionChord[] = [];
  const useFlats = root.includes('b') || ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'].includes(root);
  const chromatic = useFlats ? NOTES_FLAT : NOTES_SHARP;
  const rootIdx = chromatic.indexOf(root);
  if (rootIdx === -1) return results;

  // For each diatonic chord (except the tonic), create its V7
  diatonicChords.forEach((target, i) => {
    if (i === 0) return; // skip V/I (that's just the V)
    const targetRoot = target.rootNote;
    let targetIdx = chromatic.indexOf(targetRoot);
    if (targetIdx === -1) {
      const alt = useFlats ? NOTES_SHARP : NOTES_FLAT;
      targetIdx = alt.indexOf(targetRoot);
      if (targetIdx === -1) return;
    }
    // V of target = 7 semitones below target = 5 semitones above
    const domRoot = chromatic[(targetIdx + 7) % 12];
    // Skip if this is already a diatonic chord with the same root and dominant quality
    const alreadyDiatonic = diatonicChords.some(c => c.rootNote === domRoot && c.symbol.includes('7') && !c.symbol.includes('m'));
    if (alreadyDiatonic) return;

    const domNotes = [
      domRoot,
      chromatic[(chromatic.indexOf(domRoot) + 4) % 12],
      chromatic[(chromatic.indexOf(domRoot) + 7) % 12],
      chromatic[(chromatic.indexOf(domRoot) + 10) % 12],
    ];

    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    results.push({
      chord: {
        symbol: `V7/${romanNumerals[i] || (i + 1).toString()}`,
        rootNote: domRoot,
        name: `${domRoot}7 → ${target.symbol}`,
        notes: domNotes,
        intervals: ['1', '3', '5', 'b7'],
      },
      source: 'secondary-dom',
      sourceLabel: `resolves to ${target.symbol}`,
    });
  });

  return results;
}

function getTritoneSubs(secondaryDoms: ProgressionChord[]): ProgressionChord[] {
  const results: ProgressionChord[] = [];
  
  secondaryDoms.forEach((sd) => {
    const domRoot = sd.chord.rootNote;
    const useFlats = domRoot.includes('b') || ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'].includes(domRoot);
    const chromatic = useFlats ? NOTES_FLAT : NOTES_SHARP;
    let idx = chromatic.indexOf(domRoot);
    if (idx === -1) {
      const alt = useFlats ? NOTES_SHARP : NOTES_FLAT;
      idx = alt.indexOf(domRoot);
      if (idx === -1) return;
    }
    const subRoot = chromatic[(idx + 6) % 12];
    const subNotes = [
      subRoot,
      chromatic[(chromatic.indexOf(subRoot) + 4) % 12],
      chromatic[(chromatic.indexOf(subRoot) + 7) % 12],
      chromatic[(chromatic.indexOf(subRoot) + 10) % 12],
    ];

    results.push({
      chord: {
        symbol: `sub(${sd.chord.symbol})`,
        rootNote: subRoot,
        name: `${subRoot}7 (tritone sub of ${sd.chord.rootNote}7)`,
        notes: subNotes,
        intervals: ['1', '3', '5', 'b7'],
      },
      source: 'tritone-sub',
      sourceLabel: `tritone sub of ${sd.chord.rootNote}7`,
    });
  });

  return results;
}

function getBorrowedChords(root: string, currentMode: string, diatonicChords: ChordSpelling[]): { mode: string; chords: ProgressionChord[] }[] {
  const borrowModes = PARALLEL_BORROW_MODES[currentMode] || [];
  const diatonicSymbols = new Set(diatonicChords.map(c => `${c.rootNote}-${c.notes.join(',')}`));
  
  return borrowModes.map(borrowMode => {
    const borrowScale = getScaleNotes(root, borrowMode);
    const borrowChords = getChordSpellings(borrowScale, borrowMode);
    
    const unique = borrowChords
      .filter(c => !diatonicSymbols.has(`${c.rootNote}-${c.notes.join(',')}`))
      .map(c => ({
        chord: c,
        source: 'borrowed' as const,
        sourceLabel: borrowMode,
      }));

    return { mode: borrowMode, chords: unique };
  }).filter(g => g.chords.length > 0);
}

// ─── Chord Badge Component ──────────────────────────────────
const sourceColors = {
  'diatonic': 'border-border hover:border-amber-500/50 hover:bg-amber-500/5',
  'borrowed': 'border-violet-500/40 hover:border-violet-500/70 hover:bg-violet-500/10',
  'secondary-dom': 'border-sky-500/40 hover:border-sky-500/70 hover:bg-sky-500/10',
  'tritone-sub': 'border-emerald-500/40 hover:border-emerald-500/70 hover:bg-emerald-500/10',
};

const sourceActiveColors = {
  'diatonic': 'border-amber-500 bg-amber-500/15 text-amber-300',
  'borrowed': 'border-violet-500 bg-violet-500/15 text-violet-300',
  'secondary-dom': 'border-sky-500 bg-sky-500/15 text-sky-300',
  'tritone-sub': 'border-emerald-500 bg-emerald-500/15 text-emerald-300',
};

const sourceDotColors = {
  'diatonic': 'bg-amber-500',
  'borrowed': 'bg-violet-500',
  'secondary-dom': 'bg-sky-500',
  'tritone-sub': 'bg-emerald-500',
};

// ─── Main Component ─────────────────────────────────────────
const ChordProgressionBuilder = ({
  chordSpellings: initialChordSpellings,
  root: initialRoot,
  mode: initialMode,
}: ChordProgressionBuilderProps) => {
  const [progression, setProgression] = useState<ProgressionChord[]>([]);
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [bpm, setBpm] = useState(100);
  const [beatsPerChord, setBeatsPerChord] = useState(4);
  const [showBorrowed, setShowBorrowed] = useState(false);
  const [showSecondaryDoms, setShowSecondaryDoms] = useState(false);
  const [showTritoneSubs, setShowTritoneSubs] = useState(false);
  const [expandedBorrowMode, setExpandedBorrowMode] = useState<string | null>(null);
  const [timbre, setTimbre] = useState<InstrumentTimbre>('piano');
  const [localRoot, setLocalRoot] = useState(initialRoot);
  const [localMode, setLocalMode] = useState(initialMode);
  const timeoutRef = useRef<number[]>([]);

  // Derive chords from local key/mode
  const root = localRoot;
  const mode = localMode;
  const localScaleNotes = useMemo(() => getScaleNotes(root, mode), [root, mode]);
  const chordSpellings = useMemo(() => getChordSpellings(localScaleNotes, mode), [localScaleNotes, mode]);
  const allModes = useMemo(() => MODE_CATEGORIES.flatMap(c => c.modes), []);

  // Compute harmonic tools
  const secondaryDoms = useMemo(() => getSecondaryDominants(root, mode, chordSpellings), [root, mode, chordSpellings]);
  const tritoneSubs = useMemo(() => getTritoneSubs(secondaryDoms), [secondaryDoms]);
  const borrowedGroups = useMemo(() => getBorrowedChords(root, mode, chordSpellings), [root, mode, chordSpellings]);

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
      setPlaying(false);
      setCurrentIdx(-1);
    }, progression.length * chordDuration);
    ids.push(endId);

    timeoutRef.current = ids;
  }, [progression, bpm, beatsPerChord, stop, timbre]);

  const addChord = (pc: ProgressionChord) => {
    setProgression(prev => [...prev, pc]);
  };

  const removeChord = (idx: number) => {
    setProgression(prev => prev.filter((_, i) => i !== idx));
  };

  const moveChord = (idx: number, direction: -1 | 1) => {
    setProgression(prev => {
      const next = [...prev];
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= next.length) return prev;
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next;
    });
  };

  const loadTemplate = (degrees: number[]) => {
    stop();
    setProgression(degrees.map(d => ({
      chord: chordSpellings[Math.min(d, chordSpellings.length - 1)],
      source: 'diatonic',
    })));
  };

  if (chordSpellings.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-2">Chord Progression Builder</h3>
        <p className="text-sm text-muted-foreground">No chords available for this scale. Try a 7-note mode.</p>
      </div>
    );
  }

  const has7Notes = (MODE_INTERVALS[mode]?.length ?? 0) >= 7;

  return (
    <div className="rounded-lg border border-border bg-card p-4 md:p-6">
      <h3 className="text-lg font-semibold mb-4">Chord Progression Builder</h3>

      {/* Key & Timbre controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Key</label>
          <select
            value={localRoot}
            onChange={(e) => { setLocalRoot(e.target.value); setProgression([]); }}
            className="bg-secondary border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {ALL_ROOTS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Mode</label>
          <select
            value={localMode}
            onChange={(e) => { setLocalMode(e.target.value); setProgression([]); }}
            className="bg-secondary border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {allModes.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Sound</label>
          <select
            value={timbre}
            onChange={(e) => setTimbre(e.target.value as InstrumentTimbre)}
            className="bg-secondary border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {INSTRUMENT_TIMBRES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── Progression Timeline ─────────────────────────────── */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">Your Progression</p>
        <div className="flex flex-wrap gap-2 min-h-[56px] p-3 rounded-lg border border-dashed border-border bg-secondary/30">
          {progression.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Click chords below to add them here…</p>
          ) : (
            progression.map((pc, i) => (
              <div
                key={i}
                className={`relative group flex flex-col items-center justify-center px-4 py-2 rounded-lg border text-sm transition-all ${
                  currentIdx === i
                    ? `${sourceActiveColors[pc.source]} scale-105 shadow-lg`
                    : 'border-border bg-card hover:border-muted-foreground'
                }`}
              >
                {/* Move & remove controls */}
                <div className="absolute -top-2 left-0 right-0 flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {i > 0 && (
                    <button
                      onClick={() => moveChord(i, -1)}
                      className="w-4 h-4 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-accent"
                      title="Move left"
                    >
                      <ArrowLeft size={8} />
                    </button>
                  )}
                  <button
                    onClick={() => removeChord(i)}
                    className="w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  >
                    <X size={8} />
                  </button>
                  {i < progression.length - 1 && (
                    <button
                      onClick={() => moveChord(i, 1)}
                      className="w-4 h-4 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-accent"
                      title="Move right"
                    >
                      <ArrowRight size={8} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${sourceDotColors[pc.source]}`} />
                  <span className="font-bold">{pc.chord.symbol}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{pc.chord.notes.join(' ')}</span>
                {pc.source !== 'diatonic' && (
                  <span className="text-[9px] text-muted-foreground/60 italic">{pc.sourceLabel}</span>
                )}
              </div>
            ))
          )}
        </div>
        {/* Legend */}
        {progression.some(p => p.source !== 'diatonic') && (
          <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Diatonic</span>
            {progression.some(p => p.source === 'borrowed') && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500" /> Borrowed</span>}
            {progression.some(p => p.source === 'secondary-dom') && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500" /> Secondary Dom.</span>}
            {progression.some(p => p.source === 'tritone-sub') && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Tritone Sub</span>}
          </div>
        )}
      </div>

      {/* ── Diatonic Chords ──────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">Diatonic Chords</p>
        <div className="flex flex-wrap gap-2">
          {chordSpellings.map((chord, i) => (
            <button
              key={i}
              onClick={() => addChord({ chord, source: 'diatonic' })}
              className={`flex flex-col items-center px-3 py-2 rounded-lg border ${sourceColors['diatonic']} transition-colors text-sm`}
            >
              <span className="font-bold">{chord.symbol}</span>
              <span className="text-[10px] text-muted-foreground">{chord.notes.join('-')}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Harmonic Tools Panel ─────────────────────────────── */}
      <div className="mb-6 rounded-lg border border-dashed border-accent bg-accent/5 p-4">
        <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
          <Sparkles size={14} className="text-amber-400" />
          Harmonic Tools
        </p>
        <p className="text-[11px] text-muted-foreground mb-4">
          Add color to your progressions with borrowed chords, secondary dominants, and tritone substitutions.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {has7Notes && borrowedGroups.length > 0 && (
            <button
              onClick={() => { setShowBorrowed(!showBorrowed); if (showBorrowed) setExpandedBorrowMode(null); }}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                showBorrowed
                  ? 'border-violet-500 bg-violet-500/15 text-violet-300'
                  : 'border-border text-muted-foreground hover:border-violet-500/50'
              }`}
            >
              <Music2 size={12} />
              Borrowed Chords
              {showBorrowed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
          {has7Notes && secondaryDoms.length > 0 && (
            <button
              onClick={() => setShowSecondaryDoms(!showSecondaryDoms)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                showSecondaryDoms
                  ? 'border-sky-500 bg-sky-500/15 text-sky-300'
                  : 'border-border text-muted-foreground hover:border-sky-500/50'
              }`}
            >
              <ArrowRightLeft size={12} />
              Secondary Dominants
              {showSecondaryDoms ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
          {has7Notes && tritoneSubs.length > 0 && (
            <button
              onClick={() => setShowTritoneSubs(!showTritoneSubs)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                showTritoneSubs
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                  : 'border-border text-muted-foreground hover:border-emerald-500/50'
              }`}
            >
              <Sparkles size={12} />
              Tritone Substitutions
              {showTritoneSubs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>

        {/* Borrowed Chords expanded */}
        {showBorrowed && (
          <div className="mb-4">
            <p className="text-[11px] text-violet-400/80 mb-2">
              Borrow chords from parallel modes of <span className="font-semibold">{root}</span> to add unexpected color.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {borrowedGroups.map(g => (
                <button
                  key={g.mode}
                  onClick={() => setExpandedBorrowMode(expandedBorrowMode === g.mode ? null : g.mode)}
                  className={`text-[11px] px-2.5 py-1 rounded border transition-colors ${
                    expandedBorrowMode === g.mode
                      ? 'border-violet-500/60 bg-violet-500/10 text-violet-300'
                      : 'border-border text-muted-foreground hover:border-violet-500/40'
                  }`}
                >
                  {g.mode} <span className="text-muted-foreground/50">({g.chords.length})</span>
                </button>
              ))}
            </div>
            {expandedBorrowMode && (
              <div className="flex flex-wrap gap-2 p-2 rounded bg-violet-500/5 border border-violet-500/20">
                {borrowedGroups.find(g => g.mode === expandedBorrowMode)?.chords.map((pc, i) => (
                  <button
                    key={i}
                    onClick={() => addChord(pc)}
                    className={`flex flex-col items-center px-3 py-2 rounded-lg border ${sourceColors['borrowed']} transition-colors text-sm`}
                  >
                    <span className="font-bold">{pc.chord.symbol}</span>
                    <span className="text-[10px] text-muted-foreground">{pc.chord.notes.join('-')}</span>
                    <span className="text-[9px] text-violet-400/60 italic">from {pc.sourceLabel}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Secondary Dominants expanded */}
        {showSecondaryDoms && (
          <div className="mb-4">
            <p className="text-[11px] text-sky-400/80 mb-2">
              Dominant 7th chords that resolve to each diatonic chord — add tension before resolution.
            </p>
            <div className="flex flex-wrap gap-2 p-2 rounded bg-sky-500/5 border border-sky-500/20">
              {secondaryDoms.map((pc, i) => (
                <button
                  key={i}
                  onClick={() => addChord(pc)}
                  className={`flex flex-col items-center px-3 py-2 rounded-lg border ${sourceColors['secondary-dom']} transition-colors text-sm`}
                >
                  <span className="font-bold">{pc.chord.symbol}</span>
                  <span className="text-[10px] text-muted-foreground">{pc.chord.notes.join('-')}</span>
                  <span className="text-[9px] text-sky-400/60 italic">{pc.sourceLabel}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tritone Subs expanded */}
        {showTritoneSubs && (
          <div className="mb-4">
            <p className="text-[11px] text-emerald-400/80 mb-2">
              Replace any dominant chord with its tritone substitution — a dominant chord a tritone away with shared guide tones.
            </p>
            <div className="flex flex-wrap gap-2 p-2 rounded bg-emerald-500/5 border border-emerald-500/20">
              {tritoneSubs.map((pc, i) => (
                <button
                  key={i}
                  onClick={() => addChord(pc)}
                  className={`flex flex-col items-center px-3 py-2 rounded-lg border ${sourceColors['tritone-sub']} transition-colors text-sm`}
                >
                  <span className="font-bold">{pc.chord.symbol}</span>
                  <span className="text-[10px] text-muted-foreground">{pc.chord.notes.join('-')}</span>
                  <span className="text-[9px] text-emerald-400/60 italic">{pc.sourceLabel}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!has7Notes && (
          <p className="text-[11px] text-muted-foreground/60 italic">
            Harmonic tools work best with 7-note scales. Try a major or minor mode.
          </p>
        )}
      </div>

      {/* ── Templates ────────────────────────────────────────── */}
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

      {/* ── Playback Controls ────────────────────────────────── */}
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
              playChordTones(progression[0].chord.notes);
            }
          }}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border hover:bg-accent transition-colors text-muted-foreground"
          title="Preview first chord"
        >
          <Volume2 size={12} /> Preview
        </button>

        <button
          onClick={() => downloadMidi(progression, bpm, beatsPerChord, root, mode)}
          disabled={progression.length === 0}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border hover:bg-accent transition-colors text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          title="Download as MIDI file"
        >
          <Download size={12} /> MIDI
        </button>
      </div>
    </div>
  );
};

export default ChordProgressionBuilder;
