import { useState, useCallback, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import {
  Download,
  Globe,
  Music,
  Play,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Square,
  Zap,
} from "lucide-react";

import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

import StepSequencer from "./StepSequencer";
import PatternMorpher from "./PatternMorpher";
import GlobalRhythmMap from "./GlobalRhythmMap";
import {
  GLOBAL_RHYTHM_ATLAS,
  GLOBAL_RHYTHM_CONTINENTS,
  GLOBAL_RHYTHM_METERS,
  filterAtlasRhythms,
  getAtlasRhythmByCountry,
  getAtlasSummary,
  getPlaybackVelocityPattern,
  type Rhythm,
  type RhythmContinent,
  validateRhythm,
} from "./globalRhythmAtlas";
import { adaptiveEngine, type RegionId, type VariationType } from "./adaptiveEngine";
import { generateHarmonic } from "./harmonicEngine";
import { generateMidiFile, downloadMidiFile } from "../DrumMachine/midiExport";
import { DRUM_PRESETS, type PatternPreset } from "../DrumMachine/drumPresets";
import { buildCompositeGroove, resamplePatternValues } from "../DrumMachine/rhythmComposition";

const BlipbloxConnector = lazy(() => import("./BlipbloxConnector"));

interface GlobalRhythmEngineProps {
  root?: string;
  mode?: string;
  embeddedPreset?: PatternPreset;
}

type OscillatorVoice = {
  type: OscillatorType;
  frequency: number;
  gain: number;
  decay: number;
  sweep: number;
};

const VARIATION_LABELS: Record<VariationType, string> = {
  "ghost-notes": "Ghost Notes",
  syncopation: "Syncopation",
  "accent-shift": "Accent Shift",
  fill: "Fill",
  "micro-timing": "Micro Timing",
  "subdivision-swap": "Subdivision Swap",
};

const TIMBRE_SYNTHS: Record<string, OscillatorVoice[]> = {
  djembe: [
    { type: "triangle", frequency: 180, gain: 0.18, decay: 0.14, sweep: 0.62 },
    { type: "sine", frequency: 88, gain: 0.12, decay: 0.18, sweep: 0.78 },
  ],
  "conga/clave": [
    { type: "square", frequency: 840, gain: 0.08, decay: 0.05, sweep: 0.88 },
    { type: "triangle", frequency: 240, gain: 0.16, decay: 0.12, sweep: 0.72 },
  ],
  surdo: [
    { type: "sine", frequency: 86, gain: 0.24, decay: 0.22, sweep: 0.7 },
    { type: "triangle", frequency: 160, gain: 0.09, decay: 0.08, sweep: 0.85 },
  ],
  "cajón": [
    { type: "triangle", frequency: 140, gain: 0.18, decay: 0.12, sweep: 0.74 },
    { type: "square", frequency: 460, gain: 0.06, decay: 0.05, sweep: 0.82 },
  ],
  tupan: [
    { type: "triangle", frequency: 118, gain: 0.2, decay: 0.16, sweep: 0.72 },
    { type: "sine", frequency: 228, gain: 0.08, decay: 0.07, sweep: 0.88 },
  ],
  tabla: [
    { type: "sine", frequency: 196, gain: 0.15, decay: 0.15, sweep: 0.9 },
    { type: "triangle", frequency: 294, gain: 0.08, decay: 0.09, sweep: 0.94 },
  ],
  darbuka: [
    { type: "triangle", frequency: 208, gain: 0.16, decay: 0.11, sweep: 0.78 },
    { type: "square", frequency: 520, gain: 0.07, decay: 0.06, sweep: 0.86 },
  ],
  taiko: [
    { type: "sine", frequency: 108, gain: 0.24, decay: 0.26, sweep: 0.66 },
    { type: "triangle", frequency: 196, gain: 0.08, decay: 0.09, sweep: 0.84 },
  ],
  "log drum": [
    { type: "triangle", frequency: 280, gain: 0.14, decay: 0.16, sweep: 0.82 },
    { type: "sine", frequency: 190, gain: 0.09, decay: 0.13, sweep: 0.88 },
  ],
  "neutral kit": [
    { type: "triangle", frequency: 164, gain: 0.16, decay: 0.1, sweep: 0.8 },
  ],
};

function parseMeterSignature(signature: string): [number, number] {
  const [numerator, denominator] = signature.split("/").map(Number);

  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return [4, 4];
  }

  return [numerator, denominator];
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function resizeStepSequence(values: number[], targetLength: number): number[] {
  if (targetLength <= 0) {
    return [];
  }

  if (values.length === 0) {
    return new Array(targetLength).fill(0);
  }

  if (values.length === targetLength) {
    return [...values];
  }

  const resized = new Array(targetLength).fill(0);
  const ratio = values.length / targetLength;

  for (let index = 0; index < targetLength; index += 1) {
    const sourceIndex = Math.min(values.length - 1, Math.floor(index * ratio));
    resized[index] = values[sourceIndex] ?? 0;
  }

  return resized;
}

function getBarUnitsForRhythm(meter: string, subdivision: number[]) {
  const [numerator] = parseMeterSignature(meter);
  const subdivisionTotal = sum(subdivision);
  const candidates = [numerator * 4, numerator * 2, numerator];

  return candidates.find((candidate) => subdivisionTotal % candidate === 0) || subdivisionTotal;
}

function inferBarsInCycle(meter: string, subdivision: number[]) {
  const subdivisionTotal = sum(subdivision);
  const unitsPerBar = getBarUnitsForRhythm(meter, subdivision);

  return Math.max(1, Math.round(subdivisionTotal / unitsPerBar));
}

function getStepDurationSeconds(bpm: number, meter: string, subdivision: number[], totalSteps: number) {
  const [numerator, denominator] = parseMeterSignature(meter);
  const barsInCycle = inferBarsInCycle(meter, subdivision);
  const barDurationSeconds = numerator * (4 / denominator) * (60 / Math.max(1, bpm));
  const cycleDurationSeconds = barDurationSeconds * barsInCycle;

  return cycleDurationSeconds / Math.max(1, totalSteps);
}

function getAdaptiveRegionId(rhythm: Rhythm | null): RegionId {
  if (!rhythm) {
    return "general";
  }

  switch (rhythm.timbreProfile) {
    case "djembe":
      return "west_africa";
    case "tupan":
      return "balkans";
    case "cajón":
      return rhythm.country === "Spain" ? "flamenco" : "afro_peruvian";
    case "conga/clave":
      return "afro_cuban";
    case "surdo":
      return rhythm.country === "Uruguay" ? "uruguay" : "brazil";
    case "tabla":
      return "india";
    case "darbuka":
      return "middle_east";
    default:
      return "general";
  }
}

function getValidationTone(errors: string[]) {
  return errors.length === 0
    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
    : "border-amber-500/40 bg-amber-500/10 text-amber-100";
}

function getSwingAdjustedStepAdvance(stepDuration: number, stepIndex: number, swingAmount: number) {
  if (swingAmount <= 0) {
    return stepDuration;
  }

  const clampedSwing = Math.min(0.32, Math.max(0, swingAmount));

  return stepIndex % 2 === 0
    ? stepDuration * (1 + clampedSwing)
    : stepDuration * (1 - clampedSwing);
}

function playTimbreHit(
  audioContext: AudioContext,
  time: number,
  velocity: number,
  timbreProfile: string,
  accented: boolean,
) {
  const voices = TIMBRE_SYNTHS[timbreProfile] || TIMBRE_SYNTHS["neutral kit"];
  const velocityScale = Math.max(0.15, velocity / 127);
  const accentScale = accented ? 1.12 : 1;

  voices.forEach((voice) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = voice.type;
    oscillator.frequency.setValueAtTime(voice.frequency * accentScale, time);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(50, voice.frequency * voice.sweep),
      time + voice.decay,
    );

    gainNode.gain.setValueAtTime(voice.gain * velocityScale, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + voice.decay);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(time);
    oscillator.stop(time + voice.decay + 0.02);
  });
}

const GlobalRhythmEngine = ({ root = "C", mode = "major", embeddedPreset }: GlobalRhythmEngineProps) => {
  const initialRhythm = getAtlasRhythmByCountry("Argentina") || GLOBAL_RHYTHM_ATLAS[0];
  const initialSummary = getAtlasSummary(initialRhythm);

  const [pattern, setPattern] = useState<number[]>([...initialRhythm.midiPattern]);
  const [velocityPattern, setVelocityPattern] = useState<number[]>([...initialSummary.velocityPattern]);
  const [bpm, setBpm] = useState(initialSummary.bpm);
  const [swing, setSwing] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [stepMode, setStepMode] = useState(32);

  const [activeRhythm, setActiveRhythm] = useState<Rhythm | null>(initialRhythm);
  const [selectedCountry, setSelectedCountry] = useState(initialRhythm.country);
  const [continentFilter, setContinentFilter] = useState<RhythmContinent | "All">("All");
  const [meterFilter, setMeterFilter] = useState<string | "All">("All");

  const [showAtlas, setShowAtlas] = useState(true);
  const [showMorph, setShowMorph] = useState(false);
  const [showBlipblox, setShowBlipblox] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const [morphAmount, setMorphAmount] = useState(0);
  const [secondaryPattern, setSecondaryPattern] = useState<number[]>([...initialRhythm.midiPattern]);
  const [secondaryVelocity, setSecondaryVelocity] = useState<number[]>([...initialSummary.velocityPattern]);

  const [adaptiveMode, setAdaptiveMode] = useState(false);
  const [variationStrength, setVariationStrength] = useState(0.5);
  const [lastVariationType, setLastVariationType] = useState<VariationType | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const playingRef = useRef(false);
  const nextTimeRef = useRef(0);
  const stepRef = useRef(0);
  const loopCountRef = useRef(0);
  const stepTimeoutsRef = useRef<number[]>([]);

  const filteredRhythms = useMemo(() => {
    return filterAtlasRhythms({
      continent: continentFilter,
      meter: meterFilter,
    });
  }, [continentFilter, meterFilter]);

  const selectedRhythmFromFilters = useMemo(() => {
    return filteredRhythms.find((rhythm) => rhythm.country === selectedCountry) || null;
  }, [filteredRhythms, selectedCountry]);

  const activeValidationErrors = useMemo(() => {
    return activeRhythm ? validateRhythm(activeRhythm) : [];
  }, [activeRhythm]);

  const effectivePattern = useMemo(() => {
    if (morphAmount <= 0) {
      return pattern;
    }

    const maxLength = Math.max(pattern.length, secondaryPattern.length);

    return Array.from({ length: maxLength }, (_, index) => {
      const primary = pattern[index % pattern.length] || 0;
      const secondary = secondaryPattern[index % secondaryPattern.length] || 0;

      return Math.random() < morphAmount ? secondary : primary;
    });
  }, [morphAmount, pattern, secondaryPattern]);

  const effectiveVelocity = useMemo(() => {
    if (morphAmount <= 0) {
      return velocityPattern;
    }

    const maxLength = Math.max(velocityPattern.length, secondaryVelocity.length);

    return Array.from({ length: maxLength }, (_, index) => {
      const primary = velocityPattern[index % velocityPattern.length] || 0;
      const secondary = secondaryVelocity[index % secondaryVelocity.length] || 0;

      return Math.round(primary * (1 - morphAmount) + secondary * morphAmount);
    });
  }, [morphAmount, velocityPattern, secondaryVelocity]);

  const morphSources = useMemo(() => {
    return GLOBAL_RHYTHM_ATLAS
      .filter((rhythm) => rhythm.classification !== "proxy")
      .slice(0, 12)
      .map((rhythm) => ({
        name: `${rhythm.country} · ${rhythm.name}`,
        midiPattern: rhythm.midiPattern,
        velocityPattern: getPlaybackVelocityPattern(rhythm),
      }));
  }, []);

  const hasActiveSteps = useMemo(() => {
    return effectivePattern.some((step) => step === 1);
  }, [effectivePattern]);

  const currentMeter = useMemo(() => activeRhythm?.meter || "4/4", [activeRhythm]);
  const currentSubdivision = useMemo(
    () => activeRhythm?.subdivision || [4, 4, 4, 4],
    [activeRhythm],
  );
  const currentTimbreProfile = useMemo(
    () => activeRhythm?.timbreProfile || "neutral kit",
    [activeRhythm],
  );

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }

    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }

    return audioCtxRef.current;
  }, []);

  const clearStepTimeouts = useCallback(() => {
    stepTimeoutsRef.current.forEach((timerId) => clearTimeout(timerId));
    stepTimeoutsRef.current = [];
  }, []);

  const loadAtlasRhythm = useCallback((rhythm: Rhythm) => {
    const summary = getAtlasSummary(rhythm);

    setActiveRhythm(rhythm);
    setSelectedCountry(rhythm.country);
    setStepMode(32);
    setPattern([...rhythm.midiPattern]);
    setVelocityPattern([...summary.velocityPattern]);
    setSecondaryPattern([...rhythm.midiPattern]);
    setSecondaryVelocity([...summary.velocityPattern]);
    setBpm(summary.bpm);
    setMorphAmount(0);
    setPlaying(false);
    adaptiveEngine.reset();
    setLastVariationType(null);
  }, []);

  useEffect(() => {
    if (filteredRhythms.length === 0) {
      return;
    }

    if (!selectedRhythmFromFilters) {
      loadAtlasRhythm(filteredRhythms[0]);
    }
  }, [filteredRhythms, selectedRhythmFromFilters, loadAtlasRhythm]);

  useEffect(() => {
    if (!embeddedPreset) {
      return;
    }

    const atlasMatch = getAtlasRhythmByCountry(embeddedPreset.country);

    if (atlasMatch) {
      loadAtlasRhythm(atlasMatch);
      return;
    }

    const groove = buildCompositeGroove(embeddedPreset);
    const resizedRaw = resamplePatternValues(groove.rawPattern, 32);

    setPattern(resizedRaw.map((value) => (value > 0 ? 1 : 0)));
    setVelocityPattern(resizedRaw.map((value) => (value > 0 ? Math.max(48, Math.round(value * 127)) : 0)));
    setBpm(embeddedPreset.bpm);
    setPlaying(false);
    adaptiveEngine.reset();
    setLastVariationType(null);
  }, [embeddedPreset, loadAtlasRhythm]);

  const scheduler = useCallback(() => {
    if (!playingRef.current) {
      return;
    }

    const audioContext = getCtx();
    const stepDuration = getStepDurationSeconds(
      bpm,
      currentMeter,
      currentSubdivision,
      effectivePattern.length,
    );

    while (nextTimeRef.current < audioContext.currentTime + 0.1) {
      const scheduledStep = stepRef.current;
      const scheduledTime = nextTimeRef.current;
      const isHit = effectivePattern[scheduledStep] === 1;
      const velocity = effectiveVelocity[scheduledStep] ?? 0;
      const accented = velocity >= 100;

      if (isHit && velocity > 0) {
        playTimbreHit(audioContext, scheduledTime, velocity, currentTimbreProfile, accented);
      }

      const stepDelayMs = Math.max(0, (scheduledTime - audioContext.currentTime) * 1000);
      const stepTimerId = window.setTimeout(() => {
        if (playingRef.current) {
          setCurrentStep(scheduledStep);
        }

        stepTimeoutsRef.current = stepTimeoutsRef.current.filter((timerId) => timerId !== stepTimerId);
      }, stepDelayMs);

      stepTimeoutsRef.current.push(stepTimerId);
      stepRef.current = (scheduledStep + 1) % effectivePattern.length;

      if (stepRef.current === 0) {
        loopCountRef.current += 1;

        if (adaptiveMode && loopCountRef.current >= 2) {
          loopCountRef.current = 0;
          const result = adaptiveEngine.suggestVariation(
            pattern,
            velocityPattern,
            getAdaptiveRegionId(activeRhythm),
            variationStrength,
          );

          setPattern(result.pattern);
          setVelocityPattern(result.velocity);
          setLastVariationType(result.type);
        }
      }

      nextTimeRef.current += getSwingAdjustedStepAdvance(stepDuration, scheduledStep, swing);
    }

    timerRef.current = window.setTimeout(scheduler, 25);
  }, [
    activeRhythm,
    adaptiveMode,
    bpm,
    currentMeter,
    currentSubdivision,
    currentTimbreProfile,
    effectivePattern,
    effectiveVelocity,
    getCtx,
    pattern,
    swing,
    variationStrength,
    velocityPattern,
  ]);

  useEffect(() => {
    if (playing) {
      playingRef.current = true;
      const audioContext = getCtx();
      nextTimeRef.current = audioContext.currentTime + 0.05;
      stepRef.current = 0;
      loopCountRef.current = 0;
      clearStepTimeouts();
      scheduler();
    } else {
      playingRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      clearStepTimeouts();
      setCurrentStep(-1);
      setLastVariationType(null);
    }

    return () => {
      playingRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      clearStepTimeouts();
    };
  }, [playing, scheduler, getCtx, clearStepTimeouts]);

  const handlePatternChange = useCallback((nextPattern: number[], nextVelocity: number[]) => {
    adaptiveEngine.trackEdit(pattern, nextPattern);
    setPattern(nextPattern);
    setVelocityPattern(nextVelocity);
  }, [pattern]);

  const handleStepPreview = useCallback((index: number, step: number, velocity: number) => {
    if (step === 0 || velocity <= 0) {
      return;
    }

    const audioContext = getCtx();
    const previewTime = audioContext.currentTime + 0.01;
    const accented = velocity >= 100 || index % 4 === 0;

    playTimbreHit(audioContext, previewTime, velocity, currentTimbreProfile, accented);
  }, [currentTimbreProfile, getCtx]);

  const handleExportMidi = useCallback(() => {
    const exportTracks = [{
      instrumentId: "kick",
      steps: effectivePattern.map((step, index) => step === 1 ? (effectiveVelocity[index] / 127) : 0),
      subdivisions: effectivePattern.length,
    }];

    const phraseBars = inferBarsInCycle(currentMeter, currentSubdivision);
    const midiData = generateMidiFile(
      exportTracks,
      bpm,
      "general-midi",
      0,
      false,
      phraseBars,
      parseMeterSignature(currentMeter),
      true,
    );

    const exportStem = activeRhythm?.country || "atlas";
    downloadMidiFile(midiData, `${exportStem.toLowerCase().replace(/[^a-z0-9]+/g, "-")}_${bpm}bpm.mid`);
  }, [activeRhythm, bpm, currentMeter, currentSubdivision, effectivePattern, effectiveVelocity]);

  const handleExportJson = useCallback(() => {
    const payload = {
      rhythm: activeRhythm,
      pattern: effectivePattern,
      velocity: effectiveVelocity,
      bpm,
      harmonic: generateHarmonic(effectivePattern, effectiveVelocity, root, mode),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${(activeRhythm?.country || "atlas").toLowerCase().replace(/[^a-z0-9]+/g, "-")}_atlas.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [activeRhythm, bpm, effectivePattern, effectiveVelocity, mode, root]);

  return (
    <div className="space-y-5 rounded-[1.75rem] border border-border/70 bg-card p-4 shadow-[0_24px_70px_-42px_rgba(0,0,0,0.85)] sm:p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-bold">
            <Globe className="h-5 w-5 text-primary" />
            Global Rhythm Atlas Engine
          </h3>
          <p className="mt-2 max-w-2xl text-xs text-muted-foreground sm:text-sm">
            Atlas-backed rhythm selection for all 195 globally recognized countries with documented,
            regional, or proxy classification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]",
              playing
                ? "border-primary/25 bg-primary/12 text-foreground"
                : "border-border bg-secondary/60 text-muted-foreground",
            )}
          >
            {playing ? "Playing" : "Stopped"}
          </span>
          {activeRhythm && (
            <span className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-[11px] font-medium text-foreground">
              {activeRhythm.country}
            </span>
          )}
          {lastVariationType && adaptiveMode && (
            <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-medium text-accent-foreground">
              {VARIATION_LABELS[lastVariationType]}
            </span>
          )}
          {activeRhythm && (
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] font-medium",
                getValidationTone(activeValidationErrors),
              )}
            >
              {activeValidationErrors.length === 0 ? "Validated" : "Needs review"}
            </span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-primary/15 bg-primary/8 px-4 py-3 text-sm font-medium text-foreground">
        Click any step to build a rhythm → Press play
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <div className="rounded-2xl border border-border bg-secondary/30 p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Play / Stop</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setPlaying((value) => !value)}
              className={cn(
                "inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl px-6 text-base font-semibold shadow-[0_16px_36px_-22px_rgba(255,255,255,0.35)]",
                playing
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
                !hasActiveSteps && "cursor-not-allowed opacity-50 shadow-none",
              )}
              disabled={!hasActiveSteps}
            >
              {playing ? <Square size={18} /> : <Play size={18} />}
              {playing ? "Stop" : "Play"}
            </button>

            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">
                {playing ? "Transport running" : "Ready to play"}
              </div>
              <div className="text-xs text-muted-foreground">
                {hasActiveSteps
                  ? "Press play to hear the loop sweep across the grid."
                  : "Turn on at least one step to start the transport."}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-secondary/30 p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Tempo Control</p>
          <div className="mt-4 flex items-center gap-3">
            <input
              type="range"
              min={40}
              max={220}
              value={bpm}
              onChange={(event) => setBpm(Number(event.target.value))}
              className="w-full accent-primary"
            />
            <span className="min-w-14 rounded-full border border-border bg-card px-3 py-1.5 text-center text-sm font-semibold text-foreground">
              {bpm}
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Shift the pace instantly from sparse practice loops to fast percussive motion.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-secondary/30 p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Swing</p>
          <div className="mt-4 flex items-center gap-3">
            <Slider
              value={[swing * 100]}
              onValueChange={([value]) => setSwing(value / 100)}
              min={0}
              max={30}
              step={1}
              className="flex-1"
            />
            <span className="min-w-16 rounded-full border border-border bg-card px-3 py-1.5 text-center text-sm font-semibold text-foreground">
              {Math.round(swing * 100)}%
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Push the offbeats later for a more human, loping feel without changing the pattern.
          </p>
        </div>
      </div>

      {showAtlas && (
        <div className="rounded-2xl border border-border bg-secondary/20 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Region Selector</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Choose a rhythmic tradition, then shape the pattern directly in the sequencer.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeRhythm && (
                <span className="rounded-full border border-primary/18 bg-primary/10 px-3 py-1 text-[11px] font-medium text-foreground">
                  Selected: {activeRhythm.country}
                </span>
              )}
              <span className="rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] text-muted-foreground">
                {filteredRhythms.length} visible countries
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(140px,0.7fr)_minmax(140px,0.7fr)_minmax(280px,1.2fr)_auto]">
            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Continent
              </label>
              <select
                value={continentFilter}
                onChange={(event) => setContinentFilter(event.target.value as RhythmContinent | "All")}
                className="w-full rounded-2xl border border-border bg-card px-3 py-3 text-sm text-foreground"
              >
                <option value="All">All continents</option>
                {GLOBAL_RHYTHM_CONTINENTS.map((continent) => (
                  <option key={continent} value={continent}>
                    {continent}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Meter
              </label>
              <select
                value={meterFilter}
                onChange={(event) => setMeterFilter(event.target.value)}
                className="w-full rounded-2xl border border-border bg-card px-3 py-3 text-sm text-foreground"
              >
                <option value="All">All meters</option>
                {GLOBAL_RHYTHM_METERS.map((meter) => (
                  <option key={meter} value={meter}>
                    {meter}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Country
              </label>
              <select
                value={selectedCountry}
                onChange={(event) => {
                  const rhythm = filteredRhythms.find((entry) => entry.country === event.target.value);
                  if (rhythm) {
                    loadAtlasRhythm(rhythm);
                  }
                }}
                className="w-full rounded-2xl border border-border bg-card px-3 py-3 text-sm text-foreground"
              >
                {filteredRhythms.map((rhythm) => (
                  <option key={rhythm.country} value={rhythm.country}>
                    {rhythm.country} · {rhythm.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <div className="flex w-full items-center gap-2 rounded-2xl border border-border bg-card/70 px-4 py-3 text-sm text-muted-foreground xl:w-auto">
                <SlidersHorizontal className="h-4 w-4" />
                {activeRhythm?.meter || currentMeter} · {activeRhythm?.timbreProfile || currentTimbreProfile}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-secondary/15 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              <Music className="h-3.5 w-3.5" />
              Sequencer Grid
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Click to cycle accent levels, drag to paint, and hear a preview immediately.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setPattern(new Array(stepMode).fill(0));
              setVelocityPattern(new Array(stepMode).fill(0));
            }}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Clear Pattern
          </button>
        </div>

        <div className="mt-4">
          <StepSequencer
            pattern={effectivePattern}
            velocityPattern={effectiveVelocity}
            onChange={handlePatternChange}
            onStepPreview={handleStepPreview}
            stepMode={stepMode}
            currentStep={currentStep}
            stepOptions={[32]}
          />
        </div>
      </div>

      {showAtlas && activeRhythm && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="rounded-2xl border border-border bg-secondary/20 p-3">
            <GlobalRhythmMap
              rhythms={filteredRhythms}
              selectedCountry={selectedCountry}
              onCountrySelect={loadAtlasRhythm}
            />
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-secondary/20 p-4">
            <div>
              <h4 className="text-lg font-semibold text-foreground">{activeRhythm.country}</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeRhythm.name} · {activeRhythm.tradition}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-xl border border-border bg-card/80 p-3">
                <div className="text-muted-foreground">Classification</div>
                <div className="mt-1 font-medium text-foreground">
                  {activeRhythm.classification} · {activeRhythm.confidence}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card/80 p-3">
                <div className="text-muted-foreground">Meter</div>
                <div className="mt-1 font-medium text-foreground">{activeRhythm.meter}</div>
              </div>
              <div className="rounded-xl border border-border bg-card/80 p-3">
                <div className="text-muted-foreground">Cycle</div>
                <div className="mt-1 font-medium text-foreground">{activeRhythm.cycleLength} units</div>
              </div>
              <div className="rounded-xl border border-border bg-card/80 p-3">
                <div className="text-muted-foreground">Timbre</div>
                <div className="mt-1 font-medium text-foreground">{activeRhythm.timbreProfile}</div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card/80 p-3">
              <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Instruments</div>
              <div className="mt-2 text-sm text-foreground">{activeRhythm.instruments.join(" · ")}</div>
            </div>

            <div className="rounded-xl border border-border bg-card/80 p-3">
              <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Source</div>
              <div className="mt-2 text-sm text-foreground">
                {activeRhythm.source.title} · {activeRhythm.source.type}
              </div>
            </div>

            {activeValidationErrors.length > 0 && (
              <div className={cn("rounded-xl border p-3 text-[11px]", getValidationTone(activeValidationErrors))}>
                <div className="font-medium text-foreground">Atlas data checks</div>
                <div className="mt-2 space-y-1 text-foreground/90">
                  {activeValidationErrors.map((error) => (
                    <p key={error}>{error}</p>
                  ))}
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={adaptiveMode}
                onChange={(event) => {
                  setAdaptiveMode(event.target.checked);
                  adaptiveEngine.reset();
                }}
                className="accent-primary"
              />
              Adaptive variation
            </label>

            {adaptiveMode && (
              <div className="flex items-center gap-3">
                <span className="w-16 text-xs text-muted-foreground">Strength</span>
                <Slider
                  value={[variationStrength * 100]}
                  onValueChange={([value]) => setVariationStrength(value / 100)}
                  min={10}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="w-12 text-right text-xs text-muted-foreground">
                  {Math.round(variationStrength * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Workspace Panels</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Open the atlas, morphing, hardware, or export layers as needed.
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { id: "atlas", label: "Atlas", icon: <Sparkles className="h-3.5 w-3.5" /> },
            { id: "morph", label: "Morph", icon: <Shuffle className="h-3.5 w-3.5" /> },
            { id: "hardware", label: "Hardware", icon: <Zap className="h-3.5 w-3.5" /> },
            { id: "export", label: "Export", icon: <Download className="h-3.5 w-3.5" /> },
          ].map((tab) => {
            const isActive =
              (tab.id === "atlas" && showAtlas) ||
              (tab.id === "morph" && showMorph) ||
              (tab.id === "hardware" && showBlipblox) ||
              (tab.id === "export" && showExport);

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.id === "atlas") setShowAtlas((value) => !value);
                  if (tab.id === "morph") setShowMorph((value) => !value);
                  if (tab.id === "hardware") setShowBlipblox((value) => !value);
                  if (tab.id === "export") setShowExport((value) => !value);
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium whitespace-nowrap",
                  isActive
                    ? "border-primary/30 bg-primary/10 text-foreground"
                    : "border-border bg-secondary/25 text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {showMorph && (
        <div className="space-y-3 rounded-2xl border border-border bg-secondary/30 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">Groove Morph</p>
          <div className="flex items-center gap-3">
            <span className="shrink-0 text-[10px] text-muted-foreground">Current</span>
            <Slider
              value={[morphAmount * 100]}
              onValueChange={([value]) => setMorphAmount(value / 100)}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="shrink-0 text-[10px] text-muted-foreground">Secondary</span>
            <span className="w-8 text-[10px] text-muted-foreground">{Math.round(morphAmount * 100)}%</span>
          </div>
          {morphSources.length >= 2 && (
            <PatternMorpher
              sources={morphSources}
              onResult={(nextPattern, nextVelocity) => {
                setSecondaryPattern(resizeStepSequence(nextPattern, 32));
                setSecondaryVelocity(resizeStepSequence(nextVelocity, 32));
              }}
            />
          )}
        </div>
      )}

      {showBlipblox && (
        <Suspense fallback={<div className="p-3 text-xs text-muted-foreground">Loading Blipblox…</div>}>
          <BlipbloxConnector root={root} mode={mode} presets={DRUM_PRESETS} />
        </Suspense>
      )}

      {showExport && (
        <div className="space-y-3 rounded-2xl border border-border bg-secondary/30 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">Export</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportMidi}
              disabled={!hasActiveSteps}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Download size={12} />
              MIDI File
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              disabled={!hasActiveSteps}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent disabled:opacity-50"
            >
              <Download size={12} />
              JSON Pattern
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalRhythmEngine;
