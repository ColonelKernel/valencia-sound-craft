import { memo } from "react";
import { Target, Music, AlertTriangle, ArrowRight } from "lucide-react";
import type { ChordAnalysis } from "./improvEngine";

interface ImprovSoloMapProps {
  analyses: ChordAnalysis[];
  activeChordIdx: number | null;
  onChordHover: (idx: number | null) => void;
  complexity: number;
}

const ImprovSoloMap = memo(({ analyses, activeChordIdx, onChordHover, complexity }: ImprovSoloMapProps) => {
  if (analyses.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 text-center text-xs text-muted-foreground">
        Enter a chord progression above to see your improvisation map
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Target className="h-3 w-3" />
        Solo Map
      </h4>

      {/* Timeline */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {analyses.map((analysis, i) => {
          const isActive = activeChordIdx === i;
          return (
            <div
              key={i}
              onMouseEnter={() => onChordHover(i)}
              onMouseLeave={() => onChordHover(null)}
              className={`min-w-[160px] flex-shrink-0 rounded-xl border p-3 transition-all duration-150 cursor-pointer ${
                isActive
                  ? "border-primary/50 bg-primary/10 shadow-lg shadow-primary/5"
                  : "border-border/50 bg-card/70 hover:border-primary/30"
              }`}
            >
              <p className="text-lg font-bold text-foreground">{analysis.chord.name}</p>

              {/* Primary scale */}
              <div className="mt-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Scale</p>
                <p className="text-xs font-medium text-foreground">
                  {analysis.scales[0]?.name}
                </p>
              </div>

              {/* Guide tones */}
              <div className="mt-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Guide Tones</p>
                <div className="mt-1 flex gap-1">
                  {analysis.guideTones.map((note, ni) => (
                    <span
                      key={ni}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-[9px] font-bold text-amber-400"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tensions (show based on complexity) */}
              {complexity > 30 && analysis.tensions.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tensions</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {analysis.tensions
                      .slice(0, Math.ceil(analysis.tensions.length * (complexity / 100)))
                      .map((t, ti) => (
                        <span
                          key={ti}
                          className="inline-flex items-center gap-0.5 rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-medium text-violet-400"
                        >
                          {t.label} ({t.note})
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Strategy hint */}
              <div className="mt-2 text-[10px] text-muted-foreground italic">
                {analysis.strategy.emphasis}
              </div>

              {/* Voice leading arrow */}
              {i < analyses.length - 1 && (
                <div className="mt-2 flex items-center gap-1 text-[9px] text-muted-foreground">
                  <ArrowRight className="h-3 w-3" />
                  <span>→ {analysis.strategy.exitNotes.join(", ")}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Safety Ladder (for active chord) */}
      {activeChordIdx !== null && analyses[activeChordIdx] && (
        <div className="rounded-xl border border-border/50 bg-secondary/20 p-3 space-y-2">
          <h5 className="text-xs font-semibold text-foreground">
            Safety Ladder — {analyses[activeChordIdx].chord.name}
          </h5>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div>
              <p className="font-semibold text-emerald-400">Safe</p>
              <p className="text-muted-foreground">{analyses[activeChordIdx].safetyLevel.safe.join(" ")}</p>
            </div>
            <div>
              <p className="font-semibold text-amber-400">Color</p>
              <p className="text-muted-foreground">{analyses[activeChordIdx].safetyLevel.color.join(" ") || "—"}</p>
            </div>
            <div>
              <p className="font-semibold text-rose-400">Outside</p>
              <p className="text-muted-foreground">{analyses[activeChordIdx].safetyLevel.outside.join(" ") || "—"}</p>
            </div>
          </div>

          {/* Entry/Exit/Avoid */}
          <div className="grid grid-cols-3 gap-2 text-[10px] border-t border-border/30 pt-2">
            <div>
              <p className="font-semibold text-blue-400">Entry</p>
              <p className="text-muted-foreground">{analyses[activeChordIdx].strategy.entryNotes.join(", ")}</p>
            </div>
            <div>
              <p className="font-semibold text-blue-400">Exit</p>
              <p className="text-muted-foreground">{analyses[activeChordIdx].strategy.exitNotes.join(", ")}</p>
            </div>
            <div>
              <p className="font-semibold text-rose-400 flex items-center gap-0.5">
                <AlertTriangle className="h-2.5 w-2.5" /> Avoid
              </p>
              <p className="text-muted-foreground">{analyses[activeChordIdx].strategy.avoidNotes.join(", ") || "—"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ImprovSoloMap.displayName = "ImprovSoloMap";

export default ImprovSoloMap;
