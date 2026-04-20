import { memo, useCallback, useState } from "react";
import Fretboard from "@/components/ModeVisualizer/Fretboard";
import { getScaleNotes, TUNING_PRESETS } from "@/components/ModeVisualizer/scaleData";
import { playChord } from "@/components/ModeVisualizer/audioSynth";
import type { ChordAtlasEntry } from "./chordEngine";
import type { PositionZone, ConstraintMode } from "./positionEngine";

export interface FretSpanControls {
  spanEnabled: boolean;
  onSpanEnabledChange: (v: boolean) => void;
  fretSpan: 3 | 4 | 5;
  onFretSpanChange: (v: 3 | 4 | 5) => void;
  anchorFret: number;
  onAnchorFretChange: (v: number) => void;
  constraintMode: ConstraintMode;
  onConstraintModeChange: (v: ConstraintMode) => void;
}

interface ChordFretboardProps {
  rootKey: string;
  mode: string;
  selectedChord: ChordAtlasEntry | null;
  overrideChordFilter?: string[] | null;
  showFingers: boolean;
  activeZone: PositionZone | null;
  stayInPosition: boolean;
  fretSpanControls?: FretSpanControls;
}

const ChordFretboard = memo(({
  rootKey,
  mode,
  selectedChord,
  overrideChordFilter,
  showFingers,
  activeZone,
  stayInPosition,
  fretSpanControls,
}: ChordFretboardProps) => {
  const [hoveredNote, setHoveredNote] = useState<string | null>(null);
  const scaleNotes = getScaleNotes(rootKey, mode);
  const tuning = TUNING_PRESETS[0].guitar;

  const handlePlayChord = useCallback(() => {
    if (selectedChord) {
      playChord(selectedChord.notes, 0.8, "guitar");
    }
  }, [selectedChord]);

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
        fretSpanOverlay={
          fretSpanControls?.spanEnabled
            ? {
                startFret: fretSpanControls.anchorFret,
                endFret: fretSpanControls.anchorFret + fretSpanControls.fretSpan - 1,
                mode: fretSpanControls.constraintMode,
              }
            : null
        }
      />

      {/* Fret Span Controls — rendered below fretboard */}
      {fretSpanControls && (
        <div className="rounded-lg border border-border/50 bg-card/50 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fret Span Zone</h4>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={fretSpanControls.spanEnabled}
                onChange={(e) => fretSpanControls.onSpanEnabledChange(e.target.checked)}
                className="rounded border-border accent-primary"
              />
              <span className="text-[11px] text-foreground">Enable</span>
            </label>
          </div>

          {fretSpanControls.spanEnabled && (
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              {/* Span width */}
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">Span Width</label>
                <div className="mt-1 flex gap-1">
                  {([3, 4, 5] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => fretSpanControls.onFretSpanChange(s)}
                      className={`flex-1 rounded-md border py-1 text-[11px] font-medium transition-colors ${
                        fretSpanControls.fretSpan === s
                          ? "border-primary/30 bg-primary/10 text-foreground"
                          : "border-border bg-card/70 text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Anchor fret */}
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">
                  Anchor: {fretSpanControls.anchorFret}–{fretSpanControls.anchorFret + fretSpanControls.fretSpan - 1}
                </label>
                <input
                  type="range"
                  min={0}
                  max={17}
                  value={fretSpanControls.anchorFret}
                  onChange={(e) => fretSpanControls.onAnchorFretChange(Number(e.target.value))}
                  className="mt-1 w-full accent-primary"
                />
              </div>

              {/* Constraint mode */}
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">Mode</label>
                <div className="mt-1 flex gap-1">
                  <button
                    onClick={() => fretSpanControls.onConstraintModeChange("hard")}
                    className={`rounded-md border px-2 py-1 text-[10px] font-medium transition-colors ${
                      fretSpanControls.constraintMode === "hard"
                        ? "border-primary/30 bg-primary/10 text-foreground"
                        : "border-border bg-card/70 text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    🔒
                  </button>
                  <button
                    onClick={() => fretSpanControls.onConstraintModeChange("soft")}
                    className={`rounded-md border px-2 py-1 text-[10px] font-medium transition-colors ${
                      fretSpanControls.constraintMode === "soft"
                        ? "border-primary/30 bg-primary/10 text-foreground"
                        : "border-border bg-card/70 text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    🔓
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Finger legend */}
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
