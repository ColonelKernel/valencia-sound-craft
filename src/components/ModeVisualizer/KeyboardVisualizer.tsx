import { playNote, type InstrumentTimbre } from "./audioSynth";

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK_KEYS = new Set([1, 3, 6, 8, 10]); // indices of sharps in ALL_NOTES

interface KeyboardVisualizerProps {
  scaleNotes: string[];
  root: string;
  hoveredNote: string | null;
  onNoteHover: (note: string | null) => void;
  onNoteClick?: (note: string) => void;
  chordFilter: string[] | null;
  showIntervals: boolean;
  intervals: string[];
  timbre?: InstrumentTimbre;
}

// Normalize note for matching (e.g., Db -> C#)
const ENHARMONIC: Record<string, string> = {
  'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B',
  'E#': 'F', 'B#': 'C',
};

function normalize(note: string): string {
  return ENHARMONIC[note] || note;
}

const KeyboardVisualizer = ({
  scaleNotes,
  root,
  hoveredNote,
  onNoteHover,
  onNoteClick,
  chordFilter,
  showIntervals,
  intervals,
  timbre = 'piano',
}: KeyboardVisualizerProps) => {
  const normalizedScale = scaleNotes.map(normalize);
  const normalizedFilter = chordFilter ? chordFilter.map(normalize) : null;
  const normalizedRoot = normalize(root);

  // 2 octaves of keys
  const octaves = 2;
  const keys: { note: string; isBlack: boolean; octave: number }[] = [];
  for (let oct = 0; oct < octaves; oct++) {
    ALL_NOTES.forEach((note, idx) => {
      keys.push({ note, isBlack: BLACK_KEYS.has(idx), octave: oct });
    });
  }

  const whiteKeys = keys.filter(k => !k.isBlack);
  const totalWhiteKeys = whiteKeys.length;

  function getScaleIndex(note: string): number {
    return normalizedScale.indexOf(normalize(note));
  }

  function isInScale(note: string): boolean {
    return normalizedScale.includes(normalize(note));
  }

  function isFiltered(note: string): boolean {
    if (!normalizedFilter) return false;
    return !normalizedFilter.includes(normalize(note));
  }

  function isRoot(note: string): boolean {
    return normalize(note) === normalizedRoot;
  }

  function getKeyColor(note: string, isBlack: boolean): string {
    if (!isInScale(note)) {
      return isBlack ? 'bg-stone-800' : 'bg-stone-100 dark:bg-stone-200';
    }
    if (isFiltered(note)) {
      return isBlack ? 'bg-stone-700 opacity-40' : 'bg-stone-200 opacity-40';
    }
    if (isRoot(note)) {
      return 'bg-amber-500';
    }
    // In scale
    return isBlack ? 'bg-blue-600' : 'bg-amber-200 dark:bg-amber-100';
  }

  function getTextColor(note: string, isBlack: boolean): string {
    if (!isInScale(note)) return isBlack ? 'text-stone-600' : 'text-stone-400';
    if (isRoot(note)) return 'text-black font-bold';
    return isBlack ? 'text-white font-semibold' : 'text-stone-800 font-semibold';
  }

  // Map white key index to get black key positions
  // Black keys sit between specific white keys
  const blackKeyPositions: { keyData: typeof keys[0]; leftPercent: number }[] = [];
  let whiteIdx = 0;
  for (let i = 0; i < keys.length; i++) {
    if (!keys[i].isBlack) {
      whiteIdx++;
    } else {
      // Position black key between previous and next white key
      const leftPercent = ((whiteIdx - 0.35) / totalWhiteKeys) * 100;
      blackKeyPositions.push({ keyData: keys[i], leftPercent });
    }
  }

  const displayNote = (note: string): string => {
    // Show the original scale note name if it matches
    const idx = getScaleIndex(note);
    if (idx >= 0) return scaleNotes[idx];
    return note;
  };

  return (
    <div className="relative select-none" style={{ height: '160px' }}>
      {/* White keys */}
      <div className="flex h-full">
        {whiteKeys.map((k, i) => {
          const inScale = isInScale(k.note);
          const hovered = hoveredNote && normalize(hoveredNote) === normalize(k.note);
          const scaleIdx = getScaleIndex(k.note);
          return (
            <div
              key={`w-${i}`}
              className={`relative flex-1 border border-border rounded-b-md cursor-pointer transition-all ${getKeyColor(k.note, false)} ${
                hovered ? 'ring-2 ring-amber-400 scale-[1.02] z-10' : ''
              }`}
              onMouseEnter={() => inScale && onNoteHover(displayNote(k.note, 0, 0.4, timbre))}
              onMouseLeave={() => onNoteHover(null)}
              onClick={() => {
                if (inScale) {
                  playNote(k.note, 0, 0.4, timbre);
                  onNoteClick?.(displayNote(k.note, 0, 0.4, timbre));
                }
              }}
            >
              {inScale && (
                <span className={`absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] ${getTextColor(k.note, false)}`}>
                  {showIntervals && scaleIdx >= 0 ? intervals[scaleIdx] : displayNote(k.note, 0, 0.4, timbre)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Black keys */}
      {blackKeyPositions.map(({ keyData: k, leftPercent }, i) => {
        const inScale = isInScale(k.note);
        const hovered = hoveredNote && normalize(hoveredNote) === normalize(k.note);
        const scaleIdx = getScaleIndex(k.note);
        return (
          <div
            key={`b-${i}`}
            className={`absolute top-0 rounded-b-md cursor-pointer transition-all z-20 ${getKeyColor(k.note, true)} ${
              hovered ? 'ring-2 ring-amber-400 scale-[1.05]' : ''
            }`}
            style={{
              left: `${leftPercent}%`,
              width: `${(0.7 / totalWhiteKeys) * 100}%`,
              height: '60%',
            }}
            onMouseEnter={() => inScale && onNoteHover(displayNote(k.note, 0, 0.4, timbre))}
            onMouseLeave={() => onNoteHover(null)}
            onClick={() => {
              if (inScale) {
                playNote(k.note, 0, 0.4, timbre);
                onNoteClick?.(displayNote(k.note, 0, 0.4, timbre));
              }
            }}
          >
            {inScale && (
              <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] ${getTextColor(k.note, true)}`}>
                {showIntervals && scaleIdx >= 0 ? intervals[scaleIdx] : displayNote(k.note, 0, 0.4, timbre)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default KeyboardVisualizer;
