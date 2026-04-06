import { useState, useMemo, useCallback, useRef } from "react";
import { getScaleNotes, MODE_INTERVALS } from "./scaleData";
import { playScale, InstrumentTimbre, INSTRUMENT_TIMBRES } from "./audioSynth";
import { Play, Square } from "lucide-react";

// ─── Scale Families ──────────────────────────────────────────
// "modal" families derive modes from a parent scale (each mode starts on a different degree).
// "standalone" families list scales that all start from the selected root.

interface ScaleFamily {
  label: string;
  modes: string[];
  degrees: string[];
  type: 'modal' | 'standalone';
}

const SCALE_FAMILIES: ScaleFamily[] = [
  {
    label: 'Major Modes',
    type: 'modal',
    modes: ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'],
    degrees: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
  },
  {
    label: 'Melodic Minor Modes',
    type: 'modal',
    modes: ['Melodic Minor', 'Dorian b2', 'Lydian Augmented', 'Lydian Dominant', 'Mixolydian b6', 'Aeolian b5 (Locrian #2)', 'Altered (Super Locrian)'],
    degrees: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii'],
  },
  {
    label: 'Harmonic Minor Modes',
    type: 'modal',
    modes: ['Harmonic Minor', 'Locrian #6', 'Ionian #5', 'Dorian #4', 'Phrygian Dominant', 'Lydian #2', 'Ultra Locrian'],
    degrees: ['I', 'ii', 'III', 'iv', 'V', 'VI', 'vii°'],
  },
  {
    label: 'Pentatonic & Blues',
    type: 'standalone',
    modes: ['Major Pentatonic', 'Minor Pentatonic', 'Blues'],
    degrees: ['—', '—', '—'],
  },
  {
    label: 'Symmetric & Other',
    type: 'standalone',
    modes: ['Whole Tone', 'Diminished (HW)', 'Diminished (WH)', 'Chromatic'],
    degrees: ['—', '—', '—', '—'],
  },
];

// Chromatic note-to-semitone lookup
const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function noteToSemitone(note: string): number {
  let idx = NOTES_SHARP.indexOf(note);
  if (idx >= 0) return idx;
  idx = NOTES_FLAT.indexOf(note);
  return idx >= 0 ? idx : 0;
}

type Deviation = 'root' | 'natural' | 'flat' | 'sharp';

/** Compare mode notes against the major scale of the same root */
function getDeviations(modeRoot: string, modeNotes: string[]): Deviation[] {
  const majorNotes = getScaleNotes(modeRoot, 'Ionian');
  if (majorNotes.length === 0) return modeNotes.map(() => 'natural');

  const majorSemitones = majorNotes.map(n => noteToSemitone(n));

  return modeNotes.map((note, i) => {
    if (i === 0) return 'root';
    const modeSemi = noteToSemitone(note);
    const majorSemi = majorSemitones[i];
    if (majorSemi === undefined) return 'natural';
    const diff = ((modeSemi - majorSemi) % 12 + 12) % 12;
    if (diff === 0) return 'natural';
    return diff <= 6 ? 'sharp' : 'flat';
  });
}

function getDeviationLabel(dev: Deviation, degreeNum: number): string | null {
  if (dev === 'flat') return `♭${degreeNum}`;
  if (dev === 'sharp') return `♯${degreeNum}`;
  return null;
}

const getNoteClass = (note: string, isRoot: boolean, deviation: Deviation) => {
  if (isRoot) return "bg-amber-500 text-black font-bold";
  if (deviation === 'flat') return "bg-sky-500/80 text-white ring-2 ring-sky-400/40";
  if (deviation === 'sharp') return "bg-rose-500/80 text-white ring-2 ring-rose-400/40";
  return "bg-stone-500/80 text-white";
};

const COMMON_ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const MasterScaleReference = () => {
  const [root, setRoot] = useState("C");
  const [familyIdx, setFamilyIdx] = useState(0);
  const [timbre, setTimbre] = useState<InstrumentTimbre>('piano');
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const playingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePlayScale = useCallback((notes: string[], rowIdx: number) => {
    if (playingIdx === rowIdx) {
      setPlayingIdx(null);
      if (playingTimeout.current) clearTimeout(playingTimeout.current);
      return;
    }
    setPlayingIdx(rowIdx);
    const notesWithOctave = [...notes, notes[0]];
    playScale(notesWithOctave, 200, timbre);
    const totalDuration = notesWithOctave.length * 200 + 350;
    if (playingTimeout.current) clearTimeout(playingTimeout.current);
    playingTimeout.current = setTimeout(() => setPlayingIdx(null), totalDuration);
  }, [playingIdx, timbre]);

  const family = SCALE_FAMILIES[familyIdx];
  const parentNotes = useMemo(() => getScaleNotes(root, family.modes[0]), [root, family]);

  const modeRows = useMemo(() => {
    if (family.type === 'standalone') {
      // Each scale starts from the selected root
      return family.modes.map((modeName, i) => {
        const notes = getScaleNotes(root, modeName);
        const deviations = getDeviations(root, notes);
        const devLabels = deviations
          .map((d, idx) => getDeviationLabel(d, idx + 1))
          .filter(Boolean);
        return {
          degree: family.degrees[i] || '—',
          modeName,
          root,
          notes,
          deviations,
          devSummary: devLabels.length > 0 ? devLabels.join(' ') : 'no deviations',
        };
      });
    }
    // Modal: derive from parent scale degrees
    return family.modes.map((modeName, i) => {
      const modeRoot = parentNotes[i] || parentNotes[0];
      const notes = getScaleNotes(modeRoot, modeName);
      const deviations = getDeviations(modeRoot, notes);
      const devLabels = deviations
        .map((d, idx) => getDeviationLabel(d, idx + 1))
        .filter(Boolean);
      return {
        degree: family.degrees[i],
        modeName,
        root: modeRoot,
        notes,
        deviations,
        devSummary: devLabels.length > 0 ? devLabels.join(' ') : 'no deviations',
      };
    });
  }, [parentNotes, family, root]);

  // Max note count for table columns
  const maxNotes = useMemo(() => {
    return Math.max(...modeRows.map(r => r.notes.length), 1);
  }, [modeRows]);

  return (
    <div className="rounded-lg border border-border bg-card p-3 sm:p-4 md:p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Master Scale Reference</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Select a root to see all modes. Deviations from each mode root's own major scale are highlighted.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Root</label>
          <select
            value={root}
            onChange={e => setRoot(e.target.value)}
            className="bg-secondary border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {COMMON_ROOTS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Family</label>
          <select
            value={familyIdx}
            onChange={e => setFamilyIdx(Number(e.target.value))}
            className="bg-secondary border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {SCALE_FAMILIES.map((f, i) => (
              <option key={f.label} value={i}>{f.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Sound</label>
          <select
            value={timbre}
            onChange={e => setTimbre(e.target.value as InstrumentTimbre)}
            className="bg-secondary border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {INSTRUMENT_TIMBRES.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mode Table */}
      <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
        <table className="w-full text-xs sm:text-sm min-w-[500px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-center text-xs text-muted-foreground font-medium px-1 py-2 w-10">▶</th>
              <th className="text-left text-xs text-muted-foreground font-medium px-2 py-2 w-16">Mode</th>
              <th className="text-left text-xs text-muted-foreground font-medium px-2 py-2 w-10">Deg</th>
              <th className="text-left text-xs text-muted-foreground font-medium px-2 py-2 w-24">vs Major</th>
              {Array.from({ length: maxNotes + 1 }).map((_, i) => (
                <th key={i} className="text-center text-[10px] text-muted-foreground font-medium px-1 py-2 w-9">
                  {i < maxNotes ? (i + 1) : '8'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modeRows.map((row, rowIdx) => (
              <tr key={row.modeName}
                className={`border-b border-border/30 transition-colors hover:bg-accent/20 ${
                  rowIdx === 0 ? 'bg-primary/5' : ''
                }`}
              >
                <td className="px-1 py-2.5 text-center">
                  <button
                    onClick={() => handlePlayScale(row.notes, rowIdx)}
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
                      playingIdx === rowIdx
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                    }`}
                    title={playingIdx === rowIdx ? 'Stop' : `Play ${row.modeName}`}
                  >
                    {playingIdx === rowIdx ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </button>
                </td>
                <td className="px-2 py-2.5">
                  <span className="text-xs font-semibold">{row.modeName}</span>
                </td>
                <td className="px-2 py-2.5">
                  <span className="text-xs text-muted-foreground font-medium">{row.degree}</span>
                </td>
                <td className="px-2 py-2.5">
                  {row.devSummary === 'no deviations' ? (
                    <span className="text-[10px] text-muted-foreground/60 italic">natural</span>
                  ) : (
                    <span className="flex flex-wrap gap-0.5">
                      {row.deviations.map((d, i) => {
                        const label = getDeviationLabel(d, i + 1);
                        if (!label) return null;
                        return (
                          <span key={i} className={`text-[10px] font-bold px-1 py-0.5 rounded ${
                            d === 'flat' ? 'bg-sky-500/20 text-sky-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {label}
                          </span>
                        );
                      })}
                    </span>
                  )}
                </td>
                {Array.from({ length: maxNotes + 1 }).map((_, i) => {
                  if (i > row.notes.length) {
                    return <td key={i} className="px-1 py-2.5" />;
                  }
                  if (i === row.notes.length) {
                    // Octave repeat
                    const note = row.notes[0];
                    return (
                      <td key={i} className="px-1 py-2.5 text-center">
                        <span className={`inline-flex w-8 h-8 rounded-full items-center justify-center text-[10px] font-bold ${getNoteClass(note, true, 'root')}`}>
                          {note}
                        </span>
                      </td>
                    );
                  }
                  const note = row.notes[i];
                  const isRoot = i === 0;
                  const dev = row.deviations[i];
                  return (
                    <td key={i} className="px-1 py-2.5 text-center">
                      <span className={`inline-flex w-8 h-8 rounded-full items-center justify-center text-[10px] font-bold ${getNoteClass(note, isRoot, dev)}`}>
                        {note}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground pt-2 border-t border-border">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500" /> Root</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-stone-500" /> Natural (matches major)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-sky-500" /> Flatted vs major</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-rose-500" /> Sharped vs major</span>
        <span className="ml-auto">Compared to each mode root's own major scale</span>
      </div>
    </div>
  );
};

export default MasterScaleReference;
