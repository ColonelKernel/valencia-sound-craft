import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface StepSequencerProps {
  pattern: number[];
  velocityPattern?: number[];
  onChange?: (pattern: number[], velocity: number[]) => void;
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
  stepMode = 16,
  onStepModeChange,
  stepOptions = [16, 32],
  currentStep = -1,
  readOnly = false,
}: StepSequencerProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState<number | null>(null);

  const velocity = velocityPattern || pattern.map(s => s ? 100 : 0);

  const toggleStep = useCallback((index: number) => {
    if (readOnly) return;
    const newPattern = [...pattern];
    const newVelocity = [...velocity];

    if (newPattern[index] === 0) {
      newPattern[index] = 1;
      newVelocity[index] = 100;
    } else if (newVelocity[index] >= 90) {
      newVelocity[index] = 60; // medium
    } else if (newVelocity[index] >= 50) {
      newVelocity[index] = 30; // ghost
    } else {
      newPattern[index] = 0;
      newVelocity[index] = 0;
    }

    onChange?.(newPattern, newVelocity);
  }, [pattern, velocity, onChange, readOnly]);

  const handleMouseDown = (index: number) => {
    if (readOnly) return;
    setIsDragging(true);
    const newVal = pattern[index] === 0 ? 1 : 0;
    setDragValue(newVal);
    const newPattern = [...pattern];
    const newVelocity = [...velocity];
    newPattern[index] = newVal;
    newVelocity[index] = newVal ? 100 : 0;
    onChange?.(newPattern, newVelocity);
  };

  const handleMouseEnter = (index: number) => {
    if (!isDragging || readOnly || dragValue === null) return;
    const newPattern = [...pattern];
    const newVelocity = [...velocity];
    newPattern[index] = dragValue;
    newVelocity[index] = dragValue ? 100 : 0;
    onChange?.(newPattern, newVelocity);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragValue(null);
  };

  const getStepColor = (step: number, vel: number, idx: number) => {
    const isCurrent = idx === currentStep;
    if (step === 0) {
      const isDownbeat = idx % 4 === 0;
      return cn(
        isDownbeat ? 'bg-secondary/80' : 'bg-secondary/40',
        !readOnly && 'hover:bg-accent',
        isCurrent && 'ring-1 ring-primary/40'
      );
    }
    // Active step — color by velocity
    if (vel >= 90) return cn('bg-primary text-primary-foreground', isCurrent && 'ring-2 ring-primary-foreground/60 scale-110');
    if (vel >= 50) return cn('bg-primary/70 text-primary-foreground', isCurrent && 'ring-2 ring-primary-foreground/40 scale-105');
    return cn('bg-primary/40 text-primary-foreground', isCurrent && 'ring-1 ring-primary/40');
  };

  const totalSteps = pattern.length;
  const minCellWidth = totalSteps >= 128 ? 10 : totalSteps >= 64 ? 12 : totalSteps >= 32 ? 14 : 20;
  const gridStyle = {
    gridTemplateColumns: `repeat(${Math.max(1, totalSteps)}, minmax(${minCellWidth}px, 1fr))`,
  };

  return (
    <div className="space-y-2" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {onStepModeChange && stepOptions.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Steps:</span>
          {stepOptions.map(mode => (
            <button
              key={mode}
              onClick={() => onStepModeChange(mode)}
              className={cn(
                'text-[10px] px-2 py-0.5 rounded transition-colors',
                stepMode === mode
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border text-muted-foreground hover:bg-accent'
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto pb-1">
        <div className="grid gap-[2px] min-w-max" style={gridStyle}>
          {pattern.map((step, i) => (
            <div
              key={i}
              onClick={() => toggleStep(i)}
              onMouseDown={() => handleMouseDown(i)}
              onMouseEnter={() => handleMouseEnter(i)}
              className={cn(
                'aspect-square rounded-sm transition-all select-none flex items-center justify-center',
                readOnly ? 'cursor-default' : 'cursor-pointer',
                getStepColor(step, velocity[i], i)
              )}
            >
              {step === 1 && velocity[i] >= 90 && (
                <span className="text-[6px] font-bold">▉</span>
              )}
              {step === 1 && velocity[i] >= 50 && velocity[i] < 90 && (
                <span className="text-[6px]">●</span>
              )}
              {step === 1 && velocity[i] > 0 && velocity[i] < 50 && (
                <span className="text-[6px] opacity-60">·</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Beat markers */}
      <div className="overflow-x-auto">
        <div className="grid gap-[2px] min-w-max" style={gridStyle}>
          {pattern.map((_, i) => (
            <div key={i} className="flex justify-center">
              {i % 4 === 0 && (
                <span className="text-[7px] text-muted-foreground">{Math.floor(i / 4) + 1}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepSequencer;
