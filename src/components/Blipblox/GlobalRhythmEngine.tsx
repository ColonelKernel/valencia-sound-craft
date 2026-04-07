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

      nextTimeRef.current += stepDuration;
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
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Global Rhythm Atlas Engine
          </h3>
          <p className="text-[10px] text-muted-foreground mt-1 max-w-2xl">
            Atlas-backed rhythm selection for all 195 globally recognized countries with documented, regional, or proxy classification.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastVariationType && adaptiveMode && (
            <span className="text-[9px] rounded-full bg-accent px-2 py-1 text-accent-foreground">
              {VARIATION_LABELS[lastVariationType]}
            </span>
          )}
          <span className="text-xs font-medium text-foreground">{bpm} BPM</span>
          {activeRhythm && (
            <span className={cn(
              "text-[10px] rounded-full px-2 py-1 border",
              getValidationTone(activeValidationErrors),
            )}>
              {activeValidationErrors.length === 0 ? "Validated" : "Needs review"}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1.5 border-b border-border pb-0 overflow-x-auto">
        {[
          { id: "atlas", label: "Atlas", icon: <Sparkles className="w-3.5 h-3.5" /> },
          { id: "morph", label: "Morph", icon: <Shuffle className="w-3.5 h-3.5" /> },
          { id: "hardware", label: "Hardware", icon: <Zap className="w-3.5 h-3.5" /> },
          { id: "export", label: "Export", icon: <Download className="w-3.5 h-3.5" /> },
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
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md transition-colors border-b-2 whitespace-nowrap",
                isActive
                  ? "border-primary text-foreground bg-secondary/50"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>

      {showAtlas && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-secondary/20 p-3 sm:p-4 space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Continent</label>
                <select
                  value={continentFilter}
                  onChange={(event) => setContinentFilter(event.target.value as RhythmContinent | "All")}
                  className="bg-card border border-border rounded px-2 py-1.5 text-xs text-foreground"
                >
                  <option value="All">All continents</option>
                  {GLOBAL_RHYTHM_CONTINENTS.map((continent) => (
                    <option key={continent} value={continent}>{continent}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Meter</label>
                <select
                  value={meterFilter}
                  onChange={(event) => setMeterFilter(event.target.value)}
                  className="bg-card border border-border rounded px-2 py-1.5 text-xs text-foreground"
                >
                  <option value="All">All meters</option>
                  {GLOBAL_RHYTHM_METERS.map((meter) => (
                    <option key={meter} value={meter}>{meter}</option>
                  ))}
                </select>
              </div>

              <div className="min-w-[220px]">
                <label className="text-[10px] text-muted-foreground block mb-1">Country</label>
                <select
                  value={selectedCountry}
                  onChange={(event) => {
                    const rhythm = filteredRhythms.find((entry) => entry.country === event.target.value);
                    if (rhythm) {
                      loadAtlasRhythm(rhythm);
                    }
                  }}
                  className="w-full bg-card border border-border rounded px-2 py-1.5 text-xs text-foreground"
                >
                  {filteredRhythms.map((rhythm) => (
                    <option key={rhythm.country} value={rhythm.country}>
                      {rhythm.country} · {rhythm.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{filteredRhythms.length} visible countries</span>
              </div>
            </div>

            {activeRhythm && (
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
                <GlobalRhythmMap
                  rhythms={filteredRhythms}
                  selectedCountry={selectedCountry}
                  onCountrySelect={loadAtlasRhythm}
                />

                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{activeRhythm.country}</h4>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {activeRhythm.name} · {activeRhythm.tradition}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-lg border border-border bg-secondary/20 p-2">
                      <div className="text-muted-foreground">Classification</div>
                      <div className="text-foreground font-medium mt-1">
                        {activeRhythm.classification} · {activeRhythm.confidence}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-secondary/20 p-2">
                      <div className="text-muted-foreground">Meter</div>
                      <div className="text-foreground font-medium mt-1">{activeRhythm.meter}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-secondary/20 p-2">
                      <div className="text-muted-foreground">Cycle</div>
                      <div className="text-foreground font-medium mt-1">{activeRhythm.cycleLength} units</div>
                    </div>
                    <div className="rounded-lg border border-border bg-secondary/20 p-2">
                      <div className="text-muted-foreground">Timbre</div>
                      <div className="text-foreground font-medium mt-1">{activeRhythm.timbreProfile}</div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-secondary/20 p-3">
                    <div className="text-[10px] text-muted-foreground">Instruments</div>
                    <div className="text-[11px] text-foreground mt-1">
                      {activeRhythm.instruments.join(" · ")}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-secondary/20 p-3">
                    <div className="text-[10px] text-muted-foreground">Source</div>
                    <div className="text-[11px] text-foreground mt-1">
                      {activeRhythm.source.title} · {activeRhythm.source.type}
                    </div>
                  </div>

                  <div className={cn(
                    "rounded-lg border p-3 text-[10px]",
                    getValidationTone(activeValidationErrors),
                  )}>
                    {activeValidationErrors.length === 0
                      ? "validateRhythm() passed for subdivision, bpm range, normalization, and classification."
                      : activeValidationErrors.join(" ")}
                  </div>

                  <label className="flex items-center gap-2 text-[10px] text-muted-foreground">
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
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-14">Strength</span>
                      <Slider
                        value={[variationStrength * 100]}
                        onValueChange={([value]) => setVariationStrength(value / 100)}
                        min={10}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-[10px] text-muted-foreground w-10">
                        {Math.round(variationStrength * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5" />
            Normalized 32-Step Pattern
          </span>
          <button
            type="button"
            onClick={() => {
              setPattern(new Array(stepMode).fill(0));
              setVelocityPattern(new Array(stepMode).fill(0));
            }}
            className="text-[10px] px-2 py-0.5 rounded border border-border text-muted-foreground hover:bg-accent"
          >
            Clear
          </button>
        </div>
        <StepSequencer
          pattern={effectivePattern}
          velocityPattern={effectiveVelocity}
          onChange={handlePatternChange}
          stepMode={stepMode}
          currentStep={currentStep}
          stepOptions={[32]}
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setPlaying((value) => !value)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm",
            playing
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
          disabled={effectivePattern.every((step) => step === 0)}
        >
          {playing ? <Square size={14} /> : <Play size={14} />}
          {playing ? "Stop" : "Play"}
        </button>

        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[10px] text-muted-foreground">BPM</span>
          <input
            type="range"
            min={40}
            max={220}
            value={bpm}
            onChange={(event) => setBpm(Number(event.target.value))}
            className="w-24 accent-primary"
          />
          <span className="text-xs font-medium text-foreground w-8">{bpm}</span>
        </div>
      </div>

      {showMorph && (
        <div className="p-3 rounded-lg bg-secondary/30 border border-border space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Groove Morph</p>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground shrink-0">Current</span>
            <Slider
              value={[morphAmount * 100]}
              onValueChange={([value]) => setMorphAmount(value / 100)}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-[10px] text-muted-foreground shrink-0">Secondary</span>
            <span className="text-[10px] text-muted-foreground w-8">{Math.round(morphAmount * 100)}%</span>
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
        <Suspense fallback={<div className="text-xs text-muted-foreground p-3">Loading Blipblox…</div>}>
          <BlipbloxConnector root={root} mode={mode} presets={DRUM_PRESETS} />
        </Suspense>
      )}

      {showExport && (
        <div className="p-3 rounded-lg bg-secondary/30 border border-border space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Export</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportMidi}
              disabled={effectivePattern.every((step) => step === 0)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Download size={12} />
              MIDI File
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              disabled={effectivePattern.every((step) => step === 0)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-foreground hover:bg-accent transition-colors disabled:opacity-50"
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
