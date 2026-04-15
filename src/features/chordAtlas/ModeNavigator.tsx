/**
 * Mode Navigator — Chord Progression → Modes → Positions → Improv Plan
 */
import { memo, useState, useCallback, useMemo } from "react";
import { Compass, Music, Target, Lightbulb, ArrowRight } from "lucide-react";
import {
  analyzeProgression,
  parseProgression,
  type ProgressionAnalysis,
  type PositionRecommendation,
} from "./progressionAnalyzer";
import type { PositionSystemType, PositionZone } from "./positionEngine";
import { filterNotesToFretSpan } from "./positionEngine";

interface ModeNavigatorProps {
  rootKey: string;
  mode: string;
  positionSystem: PositionSystemType;
  onPositionSelect: (zone: PositionZone) => void;
  onChordHighlight: (notes: string[] | null) => void;
  /** If set, filter highlighted notes to this fret range */
  fretSpanStart?: number;
  fretSpanEnd?: number;
}

const EXAMPLE_PROGRESSIONS = [
  { label: "ii–V–I", value: "Am7 D7 Gmaj7" },
  { label: "I–V–vi–IV", value: "C G Am F" },
  { label: "Jazz Minor ii–V–i", value: "Dm7b5 G7 Cm7" },
  { label: "Neo Soul", value: "Dmaj7 Dbmaj7 Cm7 Bm7" },
  { label: "Flamenco", value: "Am G F E7" },
  { label: "Coltrane", value: "Cmaj7 Ab7 Dbmaj7 A7" },
];

const ModeNavigator = memo(({
  rootKey,
  mode: currentMode,
  positionSystem,
  onPositionSelect,
  onChordHighlight,
}: ModeNavigatorProps) => {
  const [inputText, setInputText] = useState("Am7 D7 Gmaj7");
  const [activeChordIdx, setActiveChordIdx] = useState<number | null>(null);
  const [lockedPosition, setLockedPosition] = useState<number | null>(null);

  const analysis = useMemo(
    () => analyzeProgression(inputText, positionSystem),
    [inputText, positionSystem]
  );

  const handlePreset = useCallback((val: string) => {
    setInputText(val);
    setActiveChordIdx(null);
    setLockedPosition(null);
  }, []);

  const handleChordHover = useCallback((idx: number | null) => {
    setActiveChordIdx(idx);
    if (idx !== null && analysis.assignments[idx]) {
      onChordHighlight(analysis.assignments[idx].primaryMode.notes);
    } else {
      onChordHighlight(null);
    }
  }, [analysis.assignments, onChordHighlight]);

  const handlePositionLock = useCallback((posIdx: number) => {
    setLockedPosition(prev => prev === posIdx ? null : posIdx);
    const rec = analysis.recommendedPositions[posIdx];
    if (rec) onPositionSelect(rec.zone);
  }, [analysis.recommendedPositions, onPositionSelect]);

  const hasAnalysis = analysis.assignments.length > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Compass className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Mode Navigator</h3>
      </div>

      {/* Progression Input */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Chord Progression
        </label>
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="e.g. Am7 D7 Gmaj7"
          className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_PROGRESSIONS.map(p => (
            <button
              key={p.value}
              onClick={() => handlePreset(p.value)}
              className="rounded-full border border-border bg-card/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {hasAnalysis && (
        <>
          {/* Key Detection */}
          <div className="rounded-lg border border-border/50 bg-card/80 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key Detection</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-foreground">
                {analysis.bestKey.key} {analysis.bestKey.mode}
              </span>
              <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
                {Math.round(analysis.bestKey.confidence * 100)}% confidence
              </span>
            </div>
            {analysis.keyCandidates.length > 1 && (
              <div className="text-[10px] text-muted-foreground">
                Alt: {analysis.keyCandidates.slice(1).map(k => `${k.key} (${Math.round(k.confidence * 100)}%)`).join(", ")}
              </div>
            )}
          </div>

          {/* Chord Timeline with Functional Analysis + Mode Assignment */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Functional Analysis & Modes
            </span>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(analysis.assignments.length, 4)}, 1fr)` }}>
              {analysis.assignments.map((a, i) => (
                <button
                  key={i}
                  onMouseEnter={() => handleChordHover(i)}
                  onMouseLeave={() => handleChordHover(null)}
                  className={`rounded-lg border p-2.5 text-left transition-all ${
                    activeChordIdx === i
                      ? "border-primary/40 bg-primary/10 shadow-sm"
                      : "border-border/50 bg-card/50 hover:bg-card/80"
                  }`}
                >
                  <div className="text-sm font-bold text-foreground">{a.chord.name}</div>
                  <div className="mt-0.5 text-[10px] font-medium text-primary">
                    {a.functional.roman}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {a.functional.functionName}
                  </div>
                  <div className="mt-1 border-t border-border/30 pt-1">
                    <div className="text-[10px] font-medium text-foreground">
                      {a.chord.root} {a.primaryMode.name}
                    </div>
                    {a.secondaryModes.length > 0 && (
                      <div className="text-[9px] text-muted-foreground mt-0.5">
                        Alt: {a.secondaryModes.map(m => m.name).join(", ")}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Mode Transitions */}
          {analysis.transitions.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mode Transitions
              </span>
              <div className="space-y-1.5">
                {analysis.transitions.map((t, i) => (
                  <div key={i} className="rounded-lg border border-border/50 bg-card/50 px-3 py-2 text-[11px]">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <span>{t.fromMode}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span>{t.toMode}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {t.sharedNotes.map(n => (
                        <span key={n} className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-emerald-400 font-mono text-[9px]">
                          {n} ✓
                        </span>
                      ))}
                      {t.movingNotes.map((m, mi) => (
                        <span key={mi} className="rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-amber-400 font-mono text-[9px]">
                          {m.from}→{m.to}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Position Recommendations */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recommended Positions
            </span>
            <div className="space-y-1.5">
              {analysis.recommendedPositions.slice(0, 3).map((rec, i) => (
                <button
                  key={rec.zone.id}
                  onClick={() => handlePositionLock(i)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-all ${
                    lockedPosition === i
                      ? "border-primary/40 bg-primary/10"
                      : "border-border/50 bg-card/50 hover:bg-card/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-foreground">{rec.zone.label}</span>
                      <span className="ml-2 text-[10px] text-muted-foreground">
                        Frets {rec.zone.startFret}–{rec.zone.endFret}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.round(rec.coverage * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {Math.round(rec.coverage * 100)}%
                      </span>
                    </div>
                  </div>
                  {lockedPosition === i && (
                    <span className="mt-1 inline-block rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] text-emerald-400 font-medium">
                      🔒 Locked
                    </span>
                  )}
                  {i === 0 && lockedPosition !== 0 && (
                    <span className="mt-1 inline-block text-[9px] text-muted-foreground">★ Best fit</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Improvisation Plan */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                What to Play
              </span>
            </div>
            <div className="space-y-2">
              {analysis.improvPlan.map((inst, i) => (
                <div
                  key={i}
                  className={`rounded-lg border px-3 py-2.5 transition-all ${
                    activeChordIdx === i
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/50 bg-card/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">Over {inst.chordName}</span>
                    <span className="text-[10px] text-muted-foreground">• {inst.mode}</span>
                  </div>
                  <div className="mt-1.5 text-[11px] text-muted-foreground space-y-0.5">
                    <div>
                      Start on <span className="font-mono text-foreground">{inst.startOn}</span>
                      {inst.focusNotes.length > 0 && (
                        <> • Focus: <span className="font-mono text-primary">{inst.focusNotes.join(", ")}</span></>
                      )}
                    </div>
                    {inst.colorNotes.length > 0 && (
                      <div>
                        Color tones: <span className="font-mono text-amber-400">{inst.colorNotes.join(", ")}</span>
                      </div>
                    )}
                    <div className="italic text-muted-foreground/80">{inst.tip}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
});

ModeNavigator.displayName = "ModeNavigator";

export default ModeNavigator;
