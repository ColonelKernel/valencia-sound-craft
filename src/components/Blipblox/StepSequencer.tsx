import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface StepSequencerProps {
  pattern: number[];
  velocityPattern?: number[];
  onChange?: (pattern: number[], velocity: number[]) => void;
  onStepPreview?: (index: number, step: number, velocity: number) => void;
  pulseSteps?: number[];
  stepMode?: number;
  onStepModeChange?: (mode: number) => void;
  stepOptions?: number[];
  currentStep?: number;
  readOnly?: boolean;
}

const StepSequencer = ({
  pattern,
  velocityPattern,
  onChange,
  onStepPreview,
  pulseSteps = [],
  stepMode = 16,
  onStepModeChange,
  stepOptions = [16, 32],
  currentStep = -1,
  readOnly = false,
}: StepSequencerProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const [pressedStep, setPressedStep] = useState<number | null>(null);
  const [animatedStep, setAnimatedStep] = useState<number | null>(null);

  const suppressClickRef = useRef(false);
  const dragStartIndexRef = useRef<number | null>(null);
  const dragAppliedStepsRef = useRef<Set<number>>(new Set());
  const animationTimerRef = useRef<number | null>(null);
  const latestPatternRef = useRef(pattern);
  const latestVelocityRef = useRef(velocityPattern || pattern.map((step) => (step ? 100 : 0)));

  const velocity = velocityPattern || pattern.map((step) => (step ? 100 : 0));

  useEffect(() => {
    latestPatternRef.current = [...pattern];
  }, [pattern]);

  useEffect(() => {
    latestVelocityRef.current = [...velocity];
  }, [velocity]);

  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        window.clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  const triggerStepAnimation = useCallback((index: number) => {
    if (animationTimerRef.current) {
      window.clearTimeout(animationTimerRef.current);
    }

    setAnimatedStep(index);
    animationTimerRef.current = window.setTimeout(() => {
      setAnimatedStep(null);
    }, 180);
  }, []);

  const emitChange = useCallback((nextPattern: number[], nextVelocity: number[]) => {
    latestPatternRef.current = nextPattern;
    latestVelocityRef.current = nextVelocity;
    onChange?.(nextPattern, nextVelocity);
  }, [onChange]);

  const previewStep = useCallback((index: number, step: number, nextVelocity: number) => {
    if (step > 0 && nextVelocity > 0) {
      onStepPreview?.(index, step, nextVelocity);
    }
  }, [onStepPreview]);

  const cycleStep = useCallback((index: number) => {
    if (readOnly) {
      return;
    }

    const nextPattern = [...latestPatternRef.current];
    const nextVelocity = [...latestVelocityRef.current];

    if (nextPattern[index] === 0) {
      nextPattern[index] = 1;
      nextVelocity[index] = 100;
    } else if (nextVelocity[index] >= 90) {
      nextVelocity[index] = 60;
    } else if (nextVelocity[index] >= 50) {
      nextVelocity[index] = 30;
    } else {
      nextPattern[index] = 0;
      nextVelocity[index] = 0;
    }

    triggerStepAnimation(index);
    emitChange(nextPattern, nextVelocity);
    previewStep(index, nextPattern[index], nextVelocity[index]);
  }, [emitChange, previewStep, readOnly, triggerStepAnimation]);

  const paintStep = useCallback((index: number, value: number) => {
    if (readOnly || dragAppliedStepsRef.current.has(index)) {
      return;
    }

    const nextPattern = [...latestPatternRef.current];
    const nextVelocity = [...latestVelocityRef.current];
    const nextStep = value ? 1 : 0;
    const nextStepVelocity = value ? 100 : 0;

    nextPattern[index] = nextStep;
    nextVelocity[index] = nextStepVelocity;
    dragAppliedStepsRef.current.add(index);

    triggerStepAnimation(index);
    emitChange(nextPattern, nextVelocity);
    previewStep(index, nextStep, nextStepVelocity);
  }, [emitChange, previewStep, readOnly, triggerStepAnimation]);

  const handleMouseDown = (index: number) => {
    if (readOnly) {
      return;
    }

    setIsDragging(true);
    setPressedStep(index);
    setDragValue(pattern[index] === 0 ? 1 : 0);
    dragStartIndexRef.current = index;
    dragAppliedStepsRef.current = new Set();
    suppressClickRef.current = false;
    latestPatternRef.current = [...pattern];
    latestVelocityRef.current = [...velocity];
  };

  const handleMouseEnter = (index: number) => {
    if (!isDragging || readOnly || dragValue === null) {
      return;
    }

    suppressClickRef.current = true;

    if (
      dragStartIndexRef.current !== null &&
      !dragAppliedStepsRef.current.has(dragStartIndexRef.current)
    ) {
      paintStep(dragStartIndexRef.current, dragValue);
    }

    paintStep(index, dragValue);
    setPressedStep(index);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragValue(null);
    setPressedStep(null);
    dragStartIndexRef.current = null;
    dragAppliedStepsRef.current = new Set();
  };

  const handleClick = (index: number) => {
    if (readOnly) {
      return;
    }

    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    cycleStep(index);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (readOnly) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      cycleStep(index);
    }
  };

  const getStepTone = (step: number, vel: number, idx: number) => {
    const isCurrent = idx === currentStep;

    if (step === 0) {
      const isDownbeat = idx % 4 === 0;

      return cn(
        isDownbeat
          ? "border-border/80 bg-secondary/85 text-muted-foreground"
          : "border-border/50 bg-secondary/45 text-muted-foreground/80",
        !readOnly && "hover:scale-[1.05] hover:brightness-125",
        isCurrent && "ring-2 ring-primary/45 ring-offset-2 ring-offset-card",
      );
    }

    if (vel >= 90) {
      return cn(
        "border-amber-200/70 bg-amber-300 text-slate-950 shadow-[0_0_24px_rgba(251,191,36,0.35)]",
        !readOnly && "hover:scale-[1.05] hover:brightness-110",
        isCurrent && "ring-2 ring-amber-100/80 ring-offset-2 ring-offset-card",
      );
    }

    if (vel >= 50) {
      return cn(
        "border-primary/70 bg-primary/85 text-primary-foreground shadow-[0_0_18px_rgba(255,255,255,0.18)]",
        !readOnly && "hover:scale-[1.05] hover:brightness-110",
        isCurrent && "ring-2 ring-primary/70 ring-offset-2 ring-offset-card",
      );
    }

    return cn(
      "border-primary/35 bg-primary/45 text-primary-foreground shadow-[0_0_14px_rgba(255,255,255,0.12)]",
      !readOnly && "hover:scale-[1.05] hover:brightness-110",
      isCurrent && "ring-2 ring-primary/45 ring-offset-2 ring-offset-card",
    );
  };

  const totalSteps = pattern.length;
  const minCellWidth = totalSteps >= 128 ? 10 : totalSteps >= 64 ? 12 : totalSteps >= 32 ? 14 : 20;
  const gridStyle = {
    gridTemplateColumns: `repeat(${Math.max(1, totalSteps)}, minmax(${minCellWidth}px, 1fr))`,
  };

  return (
    <div className="space-y-3" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {onStepModeChange && stepOptions.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Steps:</span>
          {stepOptions.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onStepModeChange(mode)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[10px] font-medium",
                stepMode === mode
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto pb-1">
        <div className="grid min-w-max gap-2" style={gridStyle}>
          {pattern.map((step, index) => {
            const isPressed = pressedStep === index;
            const shouldPulse = pulseSteps.includes(index) && step === 1 && currentStep === -1;

            return (
              <button
                key={index}
                type="button"
                aria-label={`Step ${index + 1}${step ? " active" : " inactive"}`}
                aria-pressed={step === 1}
                onClick={() => handleClick(index)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                onMouseDown={() => handleMouseDown(index)}
                onMouseEnter={() => handleMouseEnter(index)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-md border text-[7px] font-semibold transition-[transform,background-color,border-color,box-shadow,filter] duration-200 ease-out select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                  readOnly ? "cursor-default" : "cursor-pointer",
                  getStepTone(step, velocity[index], index),
                  isPressed && "scale-[0.98]",
                  animatedStep === index && "sequencer-step-press",
                  shouldPulse && "sequencer-step-pulse",
                )}
              >
                {step === 1 && velocity[index] >= 90 && <span>▉</span>}
                {step === 1 && velocity[index] >= 50 && velocity[index] < 90 && <span>●</span>}
                {step === 1 && velocity[index] > 0 && velocity[index] < 50 && (
                  <span className="opacity-70">·</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-max gap-2" style={gridStyle}>
          {pattern.map((_, index) => (
            <div key={index} className="flex justify-center">
              {index % 4 === 0 && (
                <span className="text-[8px] text-muted-foreground">{Math.floor(index / 4) + 1}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepSequencer;
