import { memo, useState, useMemo, useCallback } from "react";
import type { ChordAtlasEntry } from "./chordEngine";
import { voicingToFingerAssignments, type FingerAssignment } from "./positionEngine";
import { playNoteAtOctave } from "@/components/ModeVisualizer/audioSynth";

interface LearningModeProps {
  chord: ChordAtlasEntry;
  /** Called with the notes that should be visible on the fretboard at the current step */
  onVisibleNotesChange: (notes: string[] | null) => void;
}

const FINGER_LABEL: Record<number, string> = { 0: "Open", 1: "Index", 2: "Middle", 3: "Ring", 4: "Pinky" };
const FINGER_COLOR: Record<number, string> = {
  0: "border-stone-500 bg-stone-600",
  1: "border-emerald-400 bg-emerald-600",
  2: "border-sky-400 bg-sky-600",
  3: "border-violet-400 bg-violet-600",
  4: "border-rose-400 bg-rose-600",
};
const STRING_LABELS = ["low E", "A", "D", "G", "B", "high e"];

function fretInstruction(a: FingerAssignment): string {
  if (a.fret === 0) return `${STRING_LABELS[a.string]} string open`;
  return `fret ${a.fret} on the ${STRING_LABELS[a.string]} string`;
}

function stepInstruction(a: FingerAssignment, stepNum: number, total: number): string {
  if (a.fret === 0) {
    return `Let the ${STRING_LABELS[a.string]} string ring open (${a.note}).`;
  }
  const verb = stepNum === 1 ? "Place" : "Add";
  return `${verb} your ${FINGER_LABEL[a.finger].toLowerCase()} finger on ${fretInstruction(a)} — that's ${a.note}.`;
}

const LearningMode = memo(({ chord, onVisibleNotesChange }: LearningModeProps) => {
  const voicing = chord.voicings[0];

  const steps = useMemo<FingerAssignment[]>(() => {
    if (!voicing) return [];
    const assignments = voicingToFingerAssignments(voicing.frets, chord.notes);
    // Sort: open strings first, then by fret ascending (natural placement order)
    return assignments.sort((a, b) => {
      if (a.fret === 0 && b.fret !== 0) return -1;
      if (a.fret !== 0 && b.fret === 0) return 1;
      return a.fret - b.fret || a.string - b.string;
    });
  }, [voicing, chord.notes]);

  const [currentStep, setCurrentStep] = useState(0);

  // Compute visible notes for fretboard up to current step
  const visibleNotes = useMemo(() => {
    if (steps.length === 0) return null;
    if (currentStep >= steps.length) {
      // All steps done — show all
      onVisibleNotesChange(null);
      return null;
    }
    const notes = steps.slice(0, currentStep + 1).map((s) => s.note);
    onVisibleNotesChange(notes);
    return notes;
  }, [currentStep, steps, onVisibleNotesChange]);

  const isComplete = currentStep >= steps.length;
  const activeStep = !isComplete ? steps[currentStep] : null;

  const handleNext = useCallback(() => {
    if (currentStep < steps.length) {
      // Play the note being placed
      const step = steps[currentStep];
      if (step) {
        playNoteAtOctave(step.note, step.fret === 0 ? 3 : 3 + Math.floor(step.fret / 12), 0.5, "guitar");
      }
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, steps]);

  const handlePrev = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  const handleReset = useCallback(() => {
    setCurrentStep(0);
    onVisibleNotesChange(steps.length > 0 ? [steps[0].note] : null);
  }, [steps, onVisibleNotesChange]);

  const handleShowAll = useCallback(() => {
    setCurrentStep(steps.length);
    onVisibleNotesChange(null);
  }, [steps, onVisibleNotesChange]);

  if (!voicing || steps.length === 0) {
    return (
      <div className="rounded-lg border border-border/50 bg-secondary/20 p-3 text-xs text-muted-foreground">
        No voicing data — select a chord with voicings to enter learning mode.
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Learning Mode
          </h4>
          <span className="text-[10px] text-muted-foreground">
            Step {Math.min(currentStep + 1, steps.length)} / {steps.length}
          </span>
        </div>
        <p className="mt-1 text-sm font-bold text-foreground">{chord.name}</p>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-secondary/50 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${((isComplete ? steps.length : currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Current instruction */}
      <div className={`rounded-xl border px-4 py-3 transition-all duration-300 ${
        isComplete
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-primary/20 bg-primary/5"
      }`}>
        {isComplete ? (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-emerald-400">✓ Chord complete!</p>
            <p className="text-xs text-muted-foreground">
              Strum all non-muted strings. Listen to the {chord.name} ring out.
            </p>
          </div>
        ) : activeStep ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold text-white ${FINGER_COLOR[activeStep.finger]}`}>
                {activeStep.finger === 0 ? "O" : activeStep.finger}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {FINGER_LABEL[activeStep.finger]}
              </span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {stepInstruction(activeStep, currentStep + 1, steps.length)}
            </p>
          </div>
        ) : null}
      </div>

      {/* Step timeline */}
      <div className="space-y-1">
        {steps.map((step, i) => {
          const isDone = i < currentStep;
          const isCurrent = i === currentStep && !isComplete;
          return (
            <div
              key={`${step.string}-${step.fret}-${i}`}
              className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] transition-all duration-200 ${
                isCurrent
                  ? "bg-primary/10 border border-primary/20"
                  : isDone
                    ? "opacity-100"
                    : "opacity-30"
              }`}
            >
              <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white shrink-0 ${
                isDone ? FINGER_COLOR[step.finger] : isCurrent ? FINGER_COLOR[step.finger] : "bg-stone-700"
              }`}>
                {isDone ? "✓" : step.finger === 0 ? "O" : step.finger}
              </span>
              <span className={isDone || isCurrent ? "text-foreground" : "text-muted-foreground"}>
                {FINGER_LABEL[step.finger]}: {fretInstruction(step)} ({step.note})
              </span>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Back
        </button>
        {isComplete ? (
          <button
            onClick={handleReset}
            className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary/15 transition-colors"
          >
            Restart
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary/15 transition-colors"
          >
            Next →
          </button>
        )}
        {!isComplete && (
          <button
            onClick={handleShowAll}
            className="ml-auto rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            Show all
          </button>
        )}
      </div>
    </div>
  );
});

LearningMode.displayName = "LearningMode";

export default LearningMode;
