import { memo, useCallback, useState } from "react";
import Fretboard from "@/components/ModeVisualizer/Fretboard";
import { getScaleNotes, TUNING_PRESETS } from "@/components/ModeVisualizer/scaleData";
import { playChord } from "@/components/ModeVisualizer/audioSynth";
import type { ChordAtlasEntry } from "./chordEngine";
import type { PositionZone } from "./positionEngine";

interface ChordFretboardProps {
  rootKey: string;
  mode: string;
  selectedChord: ChordAtlasEntry | null;
  overrideChordFilter?: string[] | null;
  showFingers: boolean;
  activeZone: PositionZone | null;
  stayInPosition: boolean;
}

const ChordFretboard = memo(({
  rootKey,
  mode,
  selectedChord,
  overrideChordFilter,
  showFingers,
  activeZone,
  stayInPosition,
}: ChordFretboardProps) => {
  const [hoveredNote, setHoveredNote] = useState<string | null>(null);
  const scaleNotes = getScaleNotes(rootKey, mode);
  const tuning = TUNING_PRESETS[0].guitar;

  const handlePlayChord = useCallback(() => {
    if (selectedChord) {
      playChord(selectedChord.notes, 0.8, "guitar");
    }
  }, [selectedChord]);

  // Build chord filter: if stayInPosition + activeZone, we'll still use chord filter
  // The Fretboard's showFingers already handles position-based dim
  const chordFilter = overrideChordFilter ?? selectedChord?.notes ?? null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          {selectedChord
            ? `${selectedChord.name} on fretboard`
            : `${rootKey} ${mode} — full neck`}
          {showFingers && activeZone && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({activeZone.label} • Frets {activeZone.startFret}–{activeZone.endFret})
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {selectedChord && (
            <button
              onClick={handlePlayChord}
              className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground hover:bg-primary/15 transition-colors"
            >
              ▶ Play chord
            </button>
          )}
        </div>
      </div>

      {/* Position zone overlay indicator */}
      {activeZone && (
        <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 px-3 py-2 text-[11px]">
          <span className="font-medium text-foreground">{activeZone.label}</span>
          <span className="text-muted-foreground">{activeZone.description}</span>
          {stayInPosition && (
            <span className="ml-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-emerald-400 font-medium">
              Locked
            </span>
          )}
        </div>
      )}

      <Fretboard
        scaleNotes={scaleNotes}
        root={rootKey}
        mode={mode}
        tuning={tuning}
        label="Standard"
        lefty={false}
        showIntervals={false}
        showFingers={showFingers}
        hoveredNote={hoveredNote}
        onNoteHover={setHoveredNote}
        chordFilter={chordFilter}
        timbre="guitar"
      />

      {/* Finger legend (shown alongside Fretboard's own legend) */}
      {showFingers && (
        <div className="text-[10px] text-muted-foreground mt-1">
          Finger numbers: <span className="text-emerald-400">1</span> Index &nbsp;
          <span className="text-sky-400">2</span> Middle &nbsp;
          <span className="text-violet-400">3</span> Ring &nbsp;
          <span className="text-rose-400">4</span> Pinky &nbsp;
          <span className="text-stone-400">O</span> Open
        </div>
      )}
    </div>
  );
});

ChordFretboard.displayName = "ChordFretboard";

export default ChordFretboard;
