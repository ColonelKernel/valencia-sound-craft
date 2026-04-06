import { useState } from "react";
import {
  GUITAR_TUNING,
  BASS_TUNING,
  getNoteAtFret,
  noteInScale,
  getScaleNote,
  getIntervalName,
  isSharp,
  isFlat,
} from "./scaleData";

interface FretboardProps {
  scaleNotes: string[];
  root: string;
  mode: string;
  type: "guitar" | "bass";
  lefty: boolean;
  showIntervals: boolean;
  hoveredNote: string | null;
  onNoteHover: (note: string | null) => void;
}

const FRET_COUNT = 22;
const FRET_MARKERS = [3, 5, 7, 9, 12, 15, 17, 19, 21];
const DOUBLE_MARKERS = [12];

const Fretboard = ({
  scaleNotes,
  root,
  mode,
  type,
  lefty,
  showIntervals,
  hoveredNote,
  onNoteHover,
}: FretboardProps) => {
  const tuning = type === "guitar" ? GUITAR_TUNING : BASS_TUNING;
  const strings = lefty ? [...tuning].reverse() : tuning;
  const frets = Array.from({ length: FRET_COUNT + 1 }, (_, i) => i);
  const displayFrets = lefty ? [...frets].reverse() : frets;

  const getNoteColor = (note: string, isRoot: boolean, isHovered: boolean) => {
    if (isRoot) {
      return "bg-amber-500 text-black border-2 border-yellow-300 shadow-lg shadow-amber-500/30";
    }
    if (isSharp(note)) {
      return `bg-blue-600 text-white ${isHovered ? "ring-2 ring-blue-300" : ""}`;
    }
    if (isFlat(note)) {
      return `bg-orange-500 text-white ${isHovered ? "ring-2 ring-orange-300" : ""}`;
    }
    return `bg-stone-500 text-white ${isHovered ? "ring-2 ring-stone-300" : ""}`;
  };

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="min-w-[900px]">
        {/* Fret numbers */}
        <div className="flex">
          <div className="w-10 shrink-0" />
          {displayFrets.map((fret) => (
            <div
              key={fret}
              className="flex-1 text-center text-[10px] text-muted-foreground font-mono"
            >
              {fret}
            </div>
          ))}
        </div>

        {/* Strings */}
        <div
          className="relative rounded-lg border border-stone-700 overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, hsl(30 20% 12%) 0%, hsl(25 25% 10%) 100%)",
          }}
        >
          {strings.map((stringTuning, stringIdx) => (
            <div key={stringIdx} className="flex items-center border-b border-stone-700/50 last:border-b-0">
              {/* Open note label */}
              <div className="w-10 shrink-0 text-center text-xs font-bold text-stone-400 py-2">
                {stringTuning.note}
              </div>

              {displayFrets.map((fret) => {
                const rawNote = getNoteAtFret(stringTuning.note, fret);
                const scaleMatch = getScaleNote(rawNote, scaleNotes);
                const inScale = scaleMatch !== null;
                const displayNote = scaleMatch || rawNote;
                const isRoot = displayNote === root;
                const isHovered = hoveredNote !== null && (
                  displayNote === hoveredNote ||
                  rawNote === hoveredNote
                );

                const intervalLabel = showIntervals
                  ? getIntervalName(rawNote, scaleNotes, mode)
                  : null;

                return (
                  <div
                    key={fret}
                    className={`flex-1 flex items-center justify-center py-2 border-l ${
                      fret === 0
                        ? "border-l-4 border-stone-400 bg-stone-800/30"
                        : "border-stone-700/40"
                    }`}
                  >
                    {inScale ? (
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all duration-150 ${getNoteColor(
                          displayNote,
                          isRoot,
                          isHovered
                        )} ${isHovered ? "scale-125" : "hover:scale-110"}`}
                        onMouseEnter={() => onNoteHover(displayNote)}
                        onMouseLeave={() => onNoteHover(null)}
                      >
                        {showIntervals ? intervalLabel : displayNote}
                      </div>
                    ) : (
                      <div className="w-7 h-7" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Fret markers */}
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
      </div>
    </div>
  );
};

export default Fretboard;
