import {
  StringTuning,
  getNoteAtFret,
  getScaleNote,
  getIntervalName,
  getFingerForFret,
  isSharp,
  isFlat,
} from "./scaleData";

interface FretboardProps {
  scaleNotes: string[];
  root: string;
  mode: string;
  tuning: StringTuning[];
  label: string;
  lefty: boolean;
  showIntervals: boolean;
  showFingers: boolean;
  hoveredNote: string | null;
  onNoteHover: (note: string | null) => void;
}

const FRET_COUNT = 22;
const FRET_MARKERS = [3, 5, 7, 9, 12, 15, 17, 19, 21];
const DOUBLE_MARKERS = [12];

const FINGER_COLORS = [
  '', // 0 = open
  'bg-emerald-600',
  'bg-sky-600',
  'bg-violet-600',
  'bg-rose-600',
];
const FINGER_LABELS = ['O', '1', '2', '3', '4'];

const Fretboard = ({
  scaleNotes,
  root,
  mode,
  tuning,
  label,
  lefty,
  showIntervals,
  showFingers,
  hoveredNote,
  onNoteHover,
}: FretboardProps) => {
  const strings = lefty ? [...tuning].reverse() : tuning;
  const frets = Array.from({ length: FRET_COUNT + 1 }, (_, i) => i);
  const displayFrets = lefty ? [...frets].reverse() : frets;

  const getNoteColor = (note: string, isRoot: boolean, isHovered: boolean) => {
    if (isRoot) return "bg-amber-500 text-black border-2 border-yellow-300 shadow-lg shadow-amber-500/30";
    if (isSharp(note)) return `bg-blue-600 text-white ${isHovered ? "ring-2 ring-blue-300" : ""}`;
    if (isFlat(note)) return `bg-orange-500 text-white ${isHovered ? "ring-2 ring-orange-300" : ""}`;
    return `bg-stone-500 text-white ${isHovered ? "ring-2 ring-stone-300" : ""}`;
  };

  // Find lowest fret with a scale note per string for finger positioning
  const getLowestFretForString = (openNote: string): number => {
    for (let f = 1; f <= 4; f++) {
      const raw = getNoteAtFret(openNote, f);
      if (getScaleNote(raw, scaleNotes) !== null) return f;
    }
    return 1;
  };

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="min-w-[900px]">
        <div className="flex">
          <div className="w-10 shrink-0" />
          {displayFrets.map((fret) => (
            <div key={fret} className="flex-1 text-center text-[10px] text-muted-foreground font-mono">
              {fret}
            </div>
          ))}
        </div>

        <div
          className="relative rounded-lg border border-stone-700 overflow-hidden"
          style={{ background: "linear-gradient(180deg, hsl(30 20% 12%) 0%, hsl(25 25% 10%) 100%)" }}
        >
          {strings.map((stringTuning, stringIdx) => {
            const lowestFret = getLowestFretForString(stringTuning.note);
            return (
              <div key={stringIdx} className="flex items-center border-b border-stone-700/50 last:border-b-0">
                <div className="w-10 shrink-0 text-center text-xs font-bold text-stone-400 py-2">
                  {stringTuning.note}
                </div>
                {displayFrets.map((fret) => {
                  const rawNote = getNoteAtFret(stringTuning.note, fret);
                  const scaleMatch = getScaleNote(rawNote, scaleNotes);
                  const inScale = scaleMatch !== null;
                  const displayNote = scaleMatch || rawNote;
                  const isRoot = displayNote === root;
                  const isHovered = hoveredNote !== null && (displayNote === hoveredNote || rawNote === hoveredNote);

                  let displayLabel = displayNote;
                  if (showFingers && inScale) {
                    const finger = getFingerForFret(fret, lowestFret);
                    displayLabel = FINGER_LABELS[finger];
                  } else if (showIntervals) {
                    displayLabel = getIntervalName(rawNote, scaleNotes, mode);
                  }

                  const fingerIdx = showFingers && inScale ? getFingerForFret(fret, lowestFret) : -1;
                  const fingerColor = showFingers && inScale && fingerIdx > 0 ? FINGER_COLORS[fingerIdx] : '';

                  return (
                    <div
                      key={fret}
                      className={`flex-1 flex items-center justify-center py-2 border-l ${
                        fret === 0 ? "border-l-4 border-stone-400 bg-stone-800/30" : "border-stone-700/40"
                      }`}
                    >
                      {inScale ? (
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all duration-150 ${
                            showFingers && fingerIdx > 0
                              ? `${fingerColor} text-white ${isRoot ? 'border-2 border-yellow-300' : ''}`
                              : getNoteColor(displayNote, isRoot, isHovered)
                          } ${isHovered ? "scale-125" : "hover:scale-110"}`}
                          onMouseEnter={() => onNoteHover(displayNote)}
                          onMouseLeave={() => onNoteHover(null)}
                        >
                          {displayLabel}
                        </div>
                      ) : (
                        <div className="w-7 h-7" />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          <div className="flex absolute bottom-0 left-10 right-0 pointer-events-none">
            {displayFrets.map((fret) => (
              <div key={fret} className="flex-1 flex justify-center pb-0.5">
                {FRET_MARKERS.includes(fret) && (
                  <div className="flex gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-500/40" />
                    {DOUBLE_MARKERS.includes(fret) && (
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-500/40" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {showFingers && (
          <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-stone-600 inline-block" /> Open</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" /> Index</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-sky-600 inline-block" /> Middle</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-violet-600 inline-block" /> Ring</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-rose-600 inline-block" /> Pinky</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Fretboard;
