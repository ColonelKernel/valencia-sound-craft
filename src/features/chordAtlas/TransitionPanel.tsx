import { memo, useMemo } from "react";
import type { ChordAtlasEntry } from "./chordEngine";
import {
  analyzeTransition,
  voicingToFingerAssignments,
  type FingerAssignment,
  type TransitionAnalysis,
} from "./positionEngine";

interface TransitionPanelProps {
  fromChord: ChordAtlasEntry;
  toChord: ChordAtlasEntry;
}

const FINGER_LABEL: Record<number, string> = { 0: "Open", 1: "Index", 2: "Middle", 3: "Ring", 4: "Pinky" };
const FINGER_COLOR: Record<number, string> = {
  0: "bg-stone-600",
  1: "bg-emerald-600",
  2: "bg-sky-600",
  3: "bg-violet-600",
  4: "bg-rose-600",
};
const STRING_LABELS = ["E", "A", "D", "G", "B", "e"];

function difficultyLabel(total: number): { text: string; color: string } {
  if (total === 0) return { text: "Identical", color: "text-emerald-400" };
  if (total <= 2) return { text: "Easy", color: "text-emerald-400" };
  if (total <= 5) return { text: "Moderate", color: "text-amber-400" };
  return { text: "Challenging", color: "text-rose-400" };
}

function fretLabel(a: FingerAssignment) {
  return a.fret === 0 ? "open" : `fret ${a.fret}`;
}

const TransitionPanel = memo(({ fromChord, toChord }: TransitionPanelProps) => {
  const analysis = useMemo<TransitionAnalysis | null>(() => {
    const fromVoicing = fromChord.voicings[0];
    const toVoicing = toChord.voicings[0];
    if (!fromVoicing || !toVoicing) return null;

    const fromAssignments = voicingToFingerAssignments(fromVoicing.frets, fromChord.notes);
    const toAssignments = voicingToFingerAssignments(toVoicing.frets, toChord.notes);

    return analyzeTransition(fromAssignments, toAssignments);
  }, [fromChord, toChord]);

  if (!analysis) {
    return (
      <div className="rounded-lg border border-border/50 bg-secondary/20 p-3 text-xs text-muted-foreground">
        No voicing data available to analyze transition.
      </div>
    );
  }

  const difficulty = difficultyLabel(analysis.totalMovement);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm">
        <span className="font-bold text-foreground">{fromChord.name}</span>
        <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
        <span className="font-bold text-foreground">{toChord.name}</span>
      </div>

      {/* Difficulty badge */}
      <div className="flex items-center gap-3">
        <span className={`text-xs font-semibold ${difficulty.color}`}>{difficulty.text}</span>
        <span className="text-[10px] text-muted-foreground">
          Movement: {analysis.totalMovement} • Position shift: {analysis.positionShift} frets
        </span>
      </div>

      {/* Anchors — fingers that stay */}
      {analysis.anchors.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            🔒 Anchors (stay put)
          </h4>
          <div className="space-y-1">
            {analysis.anchors.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md bg-emerald-500/5 border border-emerald-500/10 px-2.5 py-1.5 transition-all"
              >
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${FINGER_COLOR[a.finger]}`}>
                  {a.finger}
                </span>
                <span className="text-xs text-foreground">
                  {FINGER_LABEL[a.finger]} stays on {STRING_LABELS[a.string]} string, {fretLabel(a)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Movers — fingers that relocate */}
      {analysis.movers.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            ➡️ Movers
          </h4>
          <div className="space-y-1.5">
            {analysis.movers.map((m, i) => (
              <div
                key={i}
                className="rounded-md border border-border/50 bg-card/50 px-2.5 py-2 transition-all"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${FINGER_COLOR[m.from.finger]}`}>
                    {m.from.finger}
                  </span>
                  <span className="text-xs text-foreground">{FINGER_LABEL[m.from.finger]}</span>
                </div>
                <div className="ml-7 mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span>{STRING_LABELS[m.from.string]} {fretLabel(m.from)}</span>
                  <svg className="h-3 w-3 text-primary/60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <span className="text-foreground font-medium">{STRING_LABELS[m.to.string]} {fretLabel(m.to)}</span>
                  <span className="ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                    {m.distance} {m.distance === 1 ? "step" : "steps"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="rounded-lg border border-border/30 bg-secondary/20 px-3 py-2 text-[11px] text-muted-foreground">
        {analysis.anchors.length > 0
          ? `Keep ${analysis.anchors.map((a) => FINGER_LABEL[a.finger].toLowerCase()).join(" & ")} planted while moving the rest.`
          : analysis.totalMovement <= 3
            ? "Small shift — try to keep your hand shape as you slide."
            : "Larger movement — approach the new shape from the lowest fret first."}
      </div>
    </div>
  );
});

TransitionPanel.displayName = "TransitionPanel";

export default TransitionPanel;
