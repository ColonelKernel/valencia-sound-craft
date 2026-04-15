import { memo } from "react";
import type { ChordAtlasEntry } from "./chordEngine";
import { getIntervalColor } from "./chordEngine";

interface ChordGridProps {
  chords: ChordAtlasEntry[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

const ChordGrid = memo(({ chords, selectedIndex, onSelect }: ChordGridProps) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7">
    {chords.map((chord, i) => {
      const isSelected = selectedIndex === i;
      return (
        <button
          key={chord.symbol + i}
          onClick={() => onSelect(i)}
          className={`group relative rounded-xl border p-4 text-left transition-all duration-150 ${
            isSelected
              ? "border-primary/50 bg-primary/10 shadow-lg shadow-primary/10"
              : "border-border/70 bg-card/70 hover:border-primary/30 hover:bg-accent/30"
          }`}
        >
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {ROMAN[i] || chord.symbol}
          </p>
          <p className="mt-1 text-lg font-bold text-foreground">{chord.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{chord.function}</p>
          <div className="mt-2 flex gap-1">
            {chord.notes.map((note, ni) => (
              <span
                key={note + ni}
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${getIntervalColor(chord.intervals[ni])}`}
              >
                {note}
              </span>
            ))}
          </div>
        </button>
      );
    })}
  </div>
));

ChordGrid.displayName = "ChordGrid";

export default ChordGrid;
