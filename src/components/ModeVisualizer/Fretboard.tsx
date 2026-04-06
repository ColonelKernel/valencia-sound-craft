import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { playNoteAtOctave, type InstrumentTimbre } from "./audioSynth";
import {
  StringTuning,
  getNoteAtFret,
  getScaleNote,
  getIntervalName,
  isSharp,
  isFlat,
} from "./scaleData";

const ENHARMONIC_MAP: Record<string, string> = {
  'C#':'Db','Db':'C#','D#':'Eb','Eb':'D#','F#':'Gb','Gb':'F#','G#':'Ab','Ab':'G#','A#':'Bb','Bb':'A#',
};

function noteMatchesChord(note: string, chordNotes: string[]): boolean {
  if (chordNotes.includes(note)) return true;
  const enh = ENHARMONIC_MAP[note];
  return !!(enh && chordNotes.includes(enh));
}

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
  chordFilter: string[] | null;
  onNoteClick?: (note: string, octave: number) => void;
  timbre?: InstrumentTimbre;
}

const FRET_COUNT = 22;
const FRET_MARKERS = [3, 5, 7, 9, 12, 15, 17, 19, 21];
const DOUBLE_MARKERS = [12];

const FINGER_COLORS: Record<number, string> = {
  0: 'bg-stone-600',
  1: 'bg-emerald-600',
  2: 'bg-sky-600',
  3: 'bg-violet-600',
  4: 'bg-rose-600',
};
const FINGER_LABELS: Record<number, string> = { 0: 'O', 1: '1', 2: '2', 3: '3', 4: '4' };

/**
 * Compute proper guitar fingering per position.
 * For each string, find scale notes in groups of up to 4 frets (a "position").
 * Within each 4-fret span, assign fingers 1-4 based on relative fret offset.
 * Open string (fret 0) gets finger 0.
 */
function computeFingerMap(
  tuning: StringTuning[],
  scaleNotes: string[],
  startPosition: number
): Map<string, number> {
  // key: `${stringIdx}-${fret}`, value: finger number
  const fingerMap = new Map<string, number>();
  const posEnd = startPosition + 3; // 4 frets: startPosition to startPosition+3

  for (let s = 0; s < tuning.length; s++) {
    // Open string
    const openRaw = getNoteAtFret(tuning[s].note, 0);
    if (getScaleNote(openRaw, scaleNotes) !== null) {
      fingerMap.set(`${s}-0`, 0);
    }

    // Notes within the position window
    for (let f = startPosition; f <= posEnd; f++) {
      if (f < 1 || f > FRET_COUNT) continue;
      const raw = getNoteAtFret(tuning[s].note, f);
      if (getScaleNote(raw, scaleNotes) !== null) {
        const finger = f - startPosition + 1; // 1-4
        fingerMap.set(`${s}-${f}`, Math.min(finger, 4));
      }
    }
  }

  return fingerMap;
}

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
  chordFilter,
  onNoteClick,
  timbre = 'piano',
}: FretboardProps) => {
  const [positionOverride, setPositionOverride] = useState<number | null>(null);

  const strings = lefty ? [...tuning].reverse() : tuning;
  const frets = Array.from({ length: FRET_COUNT + 1 }, (_, i) => i);
  const displayFrets = lefty ? [...frets].reverse() : frets;

  // Auto-detect a default starting position based on root
  let autoPos = 1;
  if (showFingers) {
    for (let f = 1; f <= 12; f++) {
      const raw = getNoteAtFret(tuning[0].note, f);
      if (getScaleNote(raw, scaleNotes) === root) {
        autoPos = Math.max(1, f - 1);
        break;
      }
    }
  }

  const startPos = showFingers ? (positionOverride ?? autoPos) : 1;

  const fingerMap = showFingers ? computeFingerMap(tuning, scaleNotes, startPos) : new Map();
  const posEnd = startPos + 3;

  const getNoteColor = (note: string, isRoot: boolean, isHovered: boolean) => {
    if (isRoot) return "bg-amber-500 text-black border-2 border-yellow-300 shadow-lg shadow-amber-500/30";
    if (isSharp(note)) return `bg-blue-600 text-white ${isHovered ? "ring-2 ring-blue-300" : ""}`;
    if (isFlat(note)) return `bg-orange-500 text-white ${isHovered ? "ring-2 ring-orange-300" : ""}`;
    return `bg-stone-500 text-white ${isHovered ? "ring-2 ring-stone-300" : ""}`;
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
          {strings.map((stringTuning, displayIdx) => {
            // Find original string index for fingerMap lookup
            const origIdx = tuning.indexOf(stringTuning);
            const sIdx = origIdx >= 0 ? origIdx : displayIdx;

            return (
              <div key={displayIdx} className="flex items-center border-b border-stone-700/50 last:border-b-0">
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

                  // Compute actual octave: open string octave + semitones crossed
                  const CHROMATIC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
                  const openIdx = CHROMATIC.indexOf(stringTuning.note) !== -1 ? CHROMATIC.indexOf(stringTuning.note) : (() => {
                    const FLATS: Record<string,string> = {'Db':'C#','Eb':'D#','Gb':'F#','Ab':'G#','Bb':'A#'};
                    return CHROMATIC.indexOf(FLATS[stringTuning.note] || stringTuning.note);
                  })();
                  const noteOctave = stringTuning.octave + Math.floor((openIdx + fret) / 12);

                  const fingerKey = `${sIdx}-${fret}`;
                  const finger = fingerMap.get(fingerKey);
                  const hasFingerAssignment = showFingers && finger !== undefined;
                  const isInPosition = showFingers && (fret === 0 || (fret >= startPos && fret <= posEnd));

                  let displayLabel = displayNote;
                  let circleStyle = getNoteColor(displayNote, isRoot, isHovered);

                  if (showFingers) {
                    if (hasFingerAssignment) {
                      displayLabel = FINGER_LABELS[finger];
                      circleStyle = `${FINGER_COLORS[finger]} text-white ${isRoot ? 'border-2 border-yellow-300' : ''}`;
                    } else if (inScale && !isInPosition) {
                      // Out-of-position notes shown dimmed
                      circleStyle = 'bg-stone-800 text-stone-500 border border-stone-700';
                    }
                  } else if (showIntervals) {
                    displayLabel = getIntervalName(rawNote, scaleNotes, mode);
                  }

                  return (
                    <div
                      key={fret}
                      className={`flex-1 flex items-center justify-center py-2 border-l ${
                        fret === 0 ? "border-l-4 border-stone-400 bg-stone-800/30" : "border-stone-700/40"
                      } ${showFingers && isInPosition && fret > 0 ? "bg-white/[0.03]" : ""}`}
                    >
                      {inScale ? (() => {
const dimmedByChord = chordFilter && !noteMatchesChord(displayNote, chordFilter);
                        const finalStyle = dimmedByChord
                          ? 'bg-stone-800 text-stone-500 border border-stone-700'
                          : circleStyle;
                        return (
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all duration-150 ${finalStyle} ${isHovered && !dimmedByChord ? "scale-125" : "hover:scale-110"}`}
                            onMouseEnter={() => onNoteHover(displayNote)}
                            onMouseLeave={() => onNoteHover(null)}
                            onClick={() => {
                              onNoteClick?.(displayNote, noteOctave);
                              playNoteAtOctave(displayNote, noteOctave, 0.4, timbre);
                            }}
                          >
                            {displayLabel}
                          </div>
                        );
                      })() : (
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
          <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              Position:
              <button
                onClick={() => setPositionOverride(Math.max(1, (positionOverride ?? autoPos) - 1))}
                disabled={(positionOverride ?? autoPos) <= 1}
                className="p-0.5 rounded border border-border hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous position"
              >
                <ChevronLeft size={14} />
              </button>
              <select
                value={positionOverride ?? autoPos}
                onChange={(e) => setPositionOverride(Number(e.target.value))}
                className="bg-secondary border border-border rounded px-2 py-0.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {Array.from({ length: 19 }, (_, i) => i + 1).map((p) => (
                  <option key={p} value={p}>Frets {p}–{p + 3}</option>
                ))}
              </select>
              <button
                onClick={() => setPositionOverride(Math.min(19, (positionOverride ?? autoPos) + 1))}
                disabled={(positionOverride ?? autoPos) >= 19}
                className="p-0.5 rounded border border-border hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next position"
              >
                <ChevronRight size={14} />
              </button>
            </span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-stone-600 inline-block" /> Open</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" /> Index (1)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-sky-600 inline-block" /> Middle (2)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-violet-600 inline-block" /> Ring (3)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-rose-600 inline-block" /> Pinky (4)</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Fretboard;
