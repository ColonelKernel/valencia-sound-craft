import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { buildCompositePattern, type SequencerLayer } from "./rhythmEngineModel";

interface StepSequencerProps {
  pattern: number[];
  velocityPattern?: number[];
  layers?: SequencerLayer[];
  grouping?: number[];
  onChange?: (pattern: number[], velocity: number[]) => void;
  onLayersChange?: (layers: SequencerLayer[]) => void;
  onStepPreview?: (index: number, step: number, velocity: number, layerId?: string) => void;
  pulseSteps?: number[];
  accentSteps?: number[];
  stepMode?: number;
  onStepModeChange?: (mode: number) => void;
  stepOptions?: number[];
  currentStep?: number;
  readOnly?: boolean;
}

type DragSession = {
  rowIndex: number;
  layerId: string;
  mode: "paint" | "erase" | "accent";
  velocity: number;
  originIndex: number;
  originY: number;
  lastVelocity: number;
  appliedSteps: Set<number>;
};

type StepMeta = {
  index: number;
  groupIndex: number;
  isGroupStart: boolean;
  isGroupEnd: boolean;
  isPulse: boolean;
};

type DisplayLayer = SequencerLayer & {
  velocity: number[];
};

const DEFAULT_STEP_OPTIONS = [16, 32];

const LAYER_BADGES: Record<DisplayLayer["band"], string> = {
  low: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  mid: "border-sky-400/30 bg-sky-400/10 text-sky-100",
  high: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
};

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function buildDefaultGrouping(totalSteps: number) {
  if (totalSteps <= 0) {
    return [];
  }

  if (totalSteps === 12) {
    return [3, 3, 3, 3];
  }

  if (totalSteps % 4 === 0) {
    return new Array(totalSteps / 4).fill(4);
  }

  if (totalSteps % 3 === 0) {
    return new Array(totalSteps / 3).fill(3);
  }

  return [totalSteps];
}

function buildResolvedLayers(
  pattern: number[],
  velocityPattern: number[] | undefined,
  layers: SequencerLayer[] | undefined,
): DisplayLayer[] {
  if (layers && layers.length > 0) {
    return layers.map((layer) => ({
      ...layer,
      pattern: [...layer.pattern],
      velocity: layer.velocity?.length ? [...layer.velocity] : layer.pattern.map((step) => (step ? 96 : 0)),
    }));
  }

  const velocity = velocityPattern || pattern.map((step) => (step ? 96 : 0));

  return [
    {
      id: "primary-lane",
      label: "Pattern",
      instrumentId: "primary-lane",
      instrument: "Pattern",
      role: "lead",
      band: "mid",
      pattern: [...pattern],
      velocity: [...velocity],
    },
  ];
}

function cloneDisplayLayers(layers: DisplayLayer[]) {
  return layers.map((layer) => ({
    ...layer,
    pattern: [...layer.pattern],
    velocity: [...layer.velocity],
  }));
}

function getDefaultVelocity(layer: DisplayLayer) {
  switch (layer.band) {
    case "low":
      return 112;
    case "mid":
      return 98;
    case "high":
      return 78;
    default:
      return 96;
  }
}

function buildStepMeta(totalSteps: number, grouping: number[], pulseSteps: number[]) {
  const resolvedGrouping = grouping.length > 0 && sum(grouping) === totalSteps
    ? grouping
    : buildDefaultGrouping(totalSteps);
  const pulseSet = new Set(pulseSteps);
  const meta: StepMeta[] = [];
  let offset = 0;

  resolvedGrouping.forEach((groupSize, groupIndex) => {
    for (let index = 0; index < groupSize; index += 1) {
      const stepIndex = offset + index;

      meta.push({
        index: stepIndex,
        groupIndex,
        isGroupStart: index === 0,
        isGroupEnd: index === groupSize - 1,
        isPulse: pulseSet.has(stepIndex) || index === 0,
      });
    }

    offset += groupSize;
  });

  if (meta.length === totalSteps) {
    return meta;
  }

  return Array.from({ length: totalSteps }, (_, index) => ({
    index,
    groupIndex: 0,
    isGroupStart: index === 0,
    isGroupEnd: index === totalSteps - 1,
    isPulse: pulseSet.has(index) || index === 0,
  }));
}

function StepCell({
  layer,
  meta,
  isActive,
  velocity,
  isCurrent,
  isAccent,
  isPressed,
  isAnimated,
  readOnly,
  onMouseDown,
  onMouseEnter,
  onMouseMove,
  onMouseUp,
  onKeyDown,
}: {
  layer: DisplayLayer;
  meta: StepMeta;
  isActive: boolean;
  velocity: number;
  isCurrent: boolean;
  isAccent: boolean;
  isPressed: boolean;
  isAnimated: boolean;
  readOnly: boolean;
  onMouseDown: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseEnter: () => void;
  onMouseMove: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseUp: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
}) {
  const isLocked = readOnly || layer.locked;
  const inactiveTone = layer.band === "low"
    ? "border-amber-400/12 bg-amber-400/6"
    : layer.band === "high"
      ? "border-cyan-300/12 bg-cyan-300/6"
      : "border-border/50 bg-secondary/55";
  const activeTone = !isActive
    ? inactiveTone
    : layer.band === "low"
      ? velocity >= 110
        ? "border-amber-200/80 bg-amber-300 text-slate-950 shadow-[0_0_28px_rgba(251,191,36,0.35)]"
        : "border-amber-300/60 bg-amber-400/70 text-amber-950 shadow-[0_0_18px_rgba(251,191,36,0.2)]"
      : layer.band === "high"
        ? velocity >= 96
          ? "border-cyan-100/80 bg-cyan-300 text-slate-950 shadow-[0_0_26px_rgba(103,232,249,0.3)]"
          : "border-cyan-300/55 bg-cyan-400/70 text-slate-950 shadow-[0_0_16px_rgba(34,211,238,0.22)]"
        : velocity >= 110
          ? "border-primary/80 bg-primary text-primary-foreground shadow-[0_0_24px_rgba(248,250,252,0.22)]"
          : "border-primary/55 bg-primary/80 text-primary-foreground shadow-[0_0_16px_rgba(248,250,252,0.16)]";

  return (
    <button
      type="button"
      aria-label={`${layer.instrument} step ${meta.index + 1}${isActive ? " active" : " inactive"}`}
      aria-pressed={isActive}
      disabled={isLocked}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onKeyDown={onKeyDown}
      className={cn(
        "relative flex aspect-square min-h-[clamp(1.75rem,5vw,3rem)] w-full items-center justify-center rounded-xl border text-[9px] font-semibold transition-[transform,background-color,border-color,box-shadow,filter] duration-150 ease-out select-none",
        isLocked ? "cursor-default opacity-95" : "cursor-pointer",
        activeTone,
        meta.isGroupStart && "ring-1 ring-white/6 ring-inset",
        meta.isPulse && !isActive && "border-border/70",
        isAccent && "after:absolute after:inset-x-[18%] after:top-[10%] after:h-1 after:rounded-full after:bg-white/70",
        isCurrent && "ring-2 ring-white/70 ring-offset-2 ring-offset-card",
        isPressed && "scale-[0.97]",
        isAnimated && "sequencer-step-press",
        !isLocked && "hover:brightness-110",
      )}
    >
      {isActive && velocity >= 118 && <span>!</span>}
      {isActive && velocity >= 92 && velocity < 118 && <span>●</span>}
      {isActive && velocity > 0 && velocity < 92 && <span className="opacity-80">·</span>}
    </button>
  );
}

const MemoStepCell = memo(StepCell);

const StepSequencer = ({
  pattern,
  velocityPattern,
  layers,
  grouping,
  onChange,
  onLayersChange,
  onStepPreview,
  pulseSteps = [],
  accentSteps = [],
  stepMode = 16,
  onStepModeChange,
  stepOptions = DEFAULT_STEP_OPTIONS,
  currentStep = -1,
  readOnly = false,
}: StepSequencerProps) => {
  const [pressedCell, setPressedCell] = useState<string | null>(null);
  const [animatedKey, setAnimatedKey] = useState<string | null>(null);

  const animationTimerRef = useRef<number | null>(null);
  const dragSessionRef = useRef<DragSession | null>(null);
  const latestLayersRef = useRef<DisplayLayer[]>(buildResolvedLayers(pattern, velocityPattern, layers));

  const resolvedLayers = useMemo(
    () => buildResolvedLayers(pattern, velocityPattern, layers),
    [layers, pattern, velocityPattern],
  );

  useEffect(() => {
    latestLayersRef.current = cloneDisplayLayers(resolvedLayers);
  }, [resolvedLayers]);

  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        window.clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  const totalSteps = resolvedLayers[0]?.pattern.length || pattern.length;
  const resolvedGrouping = useMemo(() => {
    if (grouping && grouping.length > 0 && sum(grouping) === totalSteps) {
      return grouping;
    }

    return buildDefaultGrouping(totalSteps);
  }, [grouping, totalSteps]);
  const resolvedPulseSteps = useMemo(
    () => pulseSteps.length > 0 ? pulseSteps : resolvedGrouping.reduce<number[]>((steps, _, index) => {
      const offset = resolvedGrouping.slice(0, index).reduce((total, value) => total + value, 0);
      steps.push(offset);
      return steps;
    }, []),
    [pulseSteps, resolvedGrouping],
  );
  const stepMeta = useMemo(
    () => buildStepMeta(totalSteps, resolvedGrouping, resolvedPulseSteps),
    [resolvedGrouping, resolvedPulseSteps, totalSteps],
  );
  const accentSet = useMemo(() => new Set(accentSteps), [accentSteps]);

  const emitLayers = useCallback((nextLayers: DisplayLayer[]) => {
    latestLayersRef.current = cloneDisplayLayers(nextLayers);

    onLayersChange?.(nextLayers);

    const composite = buildCompositePattern(nextLayers);
    onChange?.(composite.pattern, composite.velocity);
  }, [onChange, onLayersChange]);

  const previewStep = useCallback((layer: DisplayLayer, index: number, step: number, velocity: number) => {
    if (step > 0 && velocity > 0) {
      onStepPreview?.(index, step, velocity, layer.id);
    }
  }, [onStepPreview]);

  const triggerAnimation = useCallback((layerId: string, index: number) => {
    if (animationTimerRef.current) {
      window.clearTimeout(animationTimerRef.current);
    }

    const nextKey = `${layerId}:${index}`;
    setAnimatedKey(nextKey);
    animationTimerRef.current = window.setTimeout(() => {
      setAnimatedKey(null);
    }, 180);
  }, []);

  const applyStepUpdate = useCallback((
    rowIndex: number,
    index: number,
    nextStep: number,
    nextVelocity: number,
  ) => {
    const nextLayers = cloneDisplayLayers(latestLayersRef.current);
    const targetLayer = nextLayers[rowIndex];

    if (!targetLayer || targetLayer.locked) {
      return;
    }

    targetLayer.pattern[index] = nextStep;
    targetLayer.velocity[index] = nextStep ? nextVelocity : 0;

    emitLayers(nextLayers);
    triggerAnimation(targetLayer.id, index);
    previewStep(targetLayer, index, nextStep, nextVelocity);
  }, [emitLayers, previewStep, triggerAnimation]);

  const resetDragSession = useCallback(() => {
    dragSessionRef.current = null;
    setPressedCell(null);
  }, []);

  useEffect(() => {
    const handleMouseUp = () => {
      resetDragSession();
    };

    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resetDragSession]);

  const handleMouseDown = useCallback((
    layer: DisplayLayer,
    rowIndex: number,
    index: number,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (readOnly || layer.locked) {
      return;
    }

    const isActive = latestLayersRef.current[rowIndex]?.pattern[index] === 1;
    const currentVelocity = latestLayersRef.current[rowIndex]?.velocity[index] ?? 0;
    const mode: DragSession["mode"] = event.shiftKey ? "accent" : isActive ? "erase" : "paint";
    const velocity = event.shiftKey
      ? 127
      : currentVelocity > 0
        ? currentVelocity
        : getDefaultVelocity(layer);

    dragSessionRef.current = {
      rowIndex,
      layerId: layer.id,
      mode,
      velocity,
      originIndex: index,
      originY: event.clientY,
      lastVelocity: velocity,
      appliedSteps: new Set(),
    };

    setPressedCell(`${layer.id}:${index}`);
    applyStepUpdate(rowIndex, index, mode === "erase" ? 0 : 1, mode === "erase" ? 0 : velocity);
    dragSessionRef.current.appliedSteps.add(index);
  }, [applyStepUpdate, readOnly]);

  const handleMouseEnter = useCallback((layer: DisplayLayer, rowIndex: number, index: number) => {
    const session = dragSessionRef.current;

    if (!session || readOnly || layer.locked || session.rowIndex !== rowIndex || session.layerId !== layer.id) {
      return;
    }

    if (session.appliedSteps.has(index)) {
      setPressedCell(`${layer.id}:${index}`);
      return;
    }

    const nextVelocity = session.mode === "erase" ? 0 : session.lastVelocity;
    applyStepUpdate(rowIndex, index, session.mode === "erase" ? 0 : 1, nextVelocity);
    session.appliedSteps.add(index);
    setPressedCell(`${layer.id}:${index}`);
  }, [applyStepUpdate, readOnly]);

  const handleMouseMove = useCallback((
    layer: DisplayLayer,
    rowIndex: number,
    index: number,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    const session = dragSessionRef.current;

    if (!session || readOnly || layer.locked || session.rowIndex !== rowIndex || session.layerId !== layer.id) {
      return;
    }

    if (session.mode === "erase" || session.originIndex !== index) {
      return;
    }

    const nextVelocity = Math.max(30, Math.min(127, Math.round(session.velocity - (event.clientY - session.originY) * 0.8)));

    if (Math.abs(nextVelocity - session.lastVelocity) < 4) {
      return;
    }

    session.lastVelocity = nextVelocity;
    applyStepUpdate(rowIndex, index, 1, nextVelocity);
  }, [applyStepUpdate, readOnly]);

  const handleKeyDown = useCallback((
    layer: DisplayLayer,
    rowIndex: number,
    index: number,
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (readOnly || layer.locked) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();

    const currentLayer = latestLayersRef.current[rowIndex];
    const isActive = currentLayer?.pattern[index] === 1;
    const nextVelocity = event.shiftKey
      ? 127
      : isActive
        ? 0
        : currentLayer?.velocity[index] || getDefaultVelocity(layer);

    applyStepUpdate(rowIndex, index, isActive && !event.shiftKey ? 0 : 1, nextVelocity);
  }, [applyStepUpdate, readOnly]);

  return (
    <div className="space-y-4" onMouseLeave={resetDragSession}>
      {onStepModeChange && stepOptions.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Resolution</span>
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

      <div className="rounded-3xl border border-border/70 bg-card/70 p-3 sm:p-4">
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/8 bg-secondary/35 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                Cycle Grouping
              </div>
              <div className="text-[11px] text-muted-foreground">
                {resolvedGrouping.join(" + ")}
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              {resolvedGrouping.map((groupSize, index) => (
                <div
                  key={`${groupSize}-${index}`}
                  className="flex min-h-9 items-center justify-between rounded-xl border border-white/8 bg-black/20 px-3 text-xs text-foreground"
                  style={{ flex: `${groupSize} 1 0` }}
                >
                  <span className="font-medium">{groupSize}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {resolvedGrouping.slice(0, index).reduce((total, value) => total + value, 0) + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[minmax(4.5rem,6.5rem)_minmax(0,1fr)] gap-2 px-1 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            <div className="flex items-center">Lane</div>
            <div
              className="grid gap-0"
              style={{ gridTemplateColumns: `repeat(${Math.max(1, totalSteps)}, minmax(0, 1fr))` }}
            >
              {stepMeta.map((meta) => (
                <div
                  key={`step-label-${meta.index}`}
                  className={cn(
                    "flex justify-center px-[1px] py-1",
                    meta.isGroupStart && meta.index !== 0 && "pl-2",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1",
                      currentStep === meta.index && "bg-primary text-primary-foreground",
                      meta.isPulse && currentStep !== meta.index && "bg-white/6 text-foreground",
                    )}
                  >
                    {meta.index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {resolvedLayers.map((layer, rowIndex) => (
            <div
              key={layer.id}
              className="grid grid-cols-[minmax(4.5rem,6.5rem)_minmax(0,1fr)] items-center gap-2"
            >
              <div className="space-y-1">
                <span className={cn(
                  "inline-flex min-h-9 w-full items-center justify-center rounded-2xl border px-3 text-[11px] font-medium",
                  LAYER_BADGES[layer.band],
                )}>
                  {layer.label}
                </span>
                <p className="truncate px-1 text-[10px] text-muted-foreground">{layer.instrument}</p>
              </div>

              <div
                className="grid gap-0"
                style={{ gridTemplateColumns: `repeat(${Math.max(1, totalSteps)}, minmax(0, 1fr))` }}
              >
                {stepMeta.map((meta) => {
                  const key = `${layer.id}:${meta.index}`;
                  const velocity = layer.velocity[meta.index] ?? 0;
                  const isActive = layer.pattern[meta.index] === 1;

                  return (
                    <div
                      key={key}
                      className={cn(
                        "relative px-[1px] py-[1px]",
                        meta.isGroupStart && meta.index !== 0 && "pl-2",
                      )}
                    >
                      {meta.isGroupStart && meta.index !== 0 && (
                        <span className="absolute inset-y-1 left-0 w-px rounded-full bg-white/10" aria-hidden />
                      )}

                      <MemoStepCell
                        layer={layer}
                        meta={meta}
                        isActive={isActive}
                        velocity={velocity}
                        isCurrent={currentStep === meta.index}
                        isAccent={accentSet.has(meta.index)}
                        isPressed={pressedCell === key}
                        isAnimated={animatedKey === key}
                        readOnly={readOnly}
                        onMouseDown={(event) => handleMouseDown(layer, rowIndex, meta.index, event)}
                        onMouseEnter={() => handleMouseEnter(layer, rowIndex, meta.index)}
                        onMouseMove={(event) => handleMouseMove(layer, rowIndex, meta.index, event)}
                        onMouseUp={resetDragSession}
                        onKeyDown={(event) => handleKeyDown(layer, rowIndex, meta.index, event)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!readOnly && (
        <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
          <span className="rounded-full border border-border bg-card/70 px-3 py-1">
            Click or drag to paint
          </span>
          <span className="rounded-full border border-border bg-card/70 px-3 py-1">
            Drag vertically to shape velocity
          </span>
          <span className="rounded-full border border-border bg-card/70 px-3 py-1">
            Hold Shift for accents
          </span>
        </div>
      )}
    </div>
  );
};

export default StepSequencer;
