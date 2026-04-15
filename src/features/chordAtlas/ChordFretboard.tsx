import { memo, useCallback, useState } from "react";
import Fretboard from "@/components/ModeVisualizer/Fretboard";
import { getScaleNotes, TUNING_PRESETS } from "@/components/ModeVisualizer/scaleData";
import { playChord } from "@/components/ModeVisualizer/audioSynth";
import type { ChordAtlasEntry } from "./chordEngine";

interface ChordFretboardProps {
  rootKey: string;
  mode: string;
  selectedChord: ChordAtlasEntry | null;
}

const ChordFretboard = memo(({ rootKey, mode, selectedChord }: ChordFretboardProps) => {
  const [hoveredNote, setHoveredNote] = useState<string | null>(null);
  const scaleNotes = getScaleNotes(rootKey, mode);
  const tuning = TUNING_PRESETS[0].guitar; // Standard tuning

  const handlePlayChord = useCallback(() => {
    if (selectedChord) {
      playChord(selectedChord.notes, 0.8, "guitar");
    }
  }, [selectedChord]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {selectedChord
            ? `${selectedChord.name} on fretboard`
            : `${rootKey} ${mode} — full neck`}
        </h3>
        {selectedChord && (
          <button
            onClick={handlePlayChord}
            className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground hover:bg-primary/15 transition-colors"
          >
            ▶ Play chord
          </button>
        )}
      </div>
      <Fretboard
        scaleNotes={scaleNotes}
        root={rootKey}
        mode={mode}
        tuning={tuning}
        label="Standard"
        lefty={false}
        showIntervals={false}
        showFingers={false}
        hoveredNote={hoveredNote}
        onNoteHover={setHoveredNote}
        chordFilter={selectedChord?.notes ?? null}
        timbre="guitar"
      />
    </div>
  );
});

ChordFretboard.displayName = "ChordFretboard";

export default ChordFretboard;
