import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  Globe,
  MapPinned,
  Music,
  Play,
  Search,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Square,
  TimerReset,
  Zap,
} from "lucide-react";

import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

import StepSequencer from "./StepSequencer";
import PatternMorpher from "./PatternMorpher";
import GlobalRhythmMap from "./GlobalRhythmMap";
import {
  GLOBAL_RHYTHM_ATLAS,
  type Rhythm,
  type RhythmContinent,
  validateRhythm,
} from "./globalRhythmAtlas";
import { adaptiveEngine, type RegionId, type VariationType } from "./adaptiveEngine";
import { generateHarmonic } from "./harmonicEngine";
import {
  buildCompositePattern,
  buildMorphOverlayLayer,
  createGlobalRhythmState,
  filterRhythmLibrary,
  getDefaultRhythmDefinitionForCountry,
  getQuickPlayRhythms,
  getRhythmDefinitionById,
  getRegionCountries,
  RHYTHM_LIBRARY,
  RHYTHM_LIBRARY_FEELS,
  RHYTHM_LIBRARY_METERS,
  RHYTHM_LIBRARY_REGIONS,
  type GlobalRhythmState,
  type RhythmBrowserRegion,
  type RhythmTempoBand,
  type StructuredRhythmDefinition,
  type SequencerLayer,
  validateStructuredRhythm,
} from "./rhythmEngineModel";
import { generateMidiFile, downloadMidiFile } from "../DrumMachine/midiExport";
import { DRUM_PRESETS, type PatternPreset, type TimeFeel } from "../DrumMachine/drumPresets";
import { getInstrument } from "../DrumMachine/drumSoundEngine";

const BlipbloxConnector = lazy(() => import("./BlipbloxConnector"));

interface GlobalRhythmEngineProps {
  root?: string;
  mode?: string;
  embeddedPreset?: PatternPreset;
  tempo?: number;
  playing?: boolean;
  selectedRegion?: RhythmBrowserRegion | "All";
  selectedRhythmId?: string;
  onTempoChange?: (tempo: number) => void;
  onPlayingChange?: (playing: boolean) => void;
  onRegionChange?: (region: RhythmBrowserRegion | "All") => void;
  onRhythmChange?: (next: { rhythmId: string; region: RhythmBrowserRegion; country: string }) => void;
}

const VARIATION_LABELS: Record<VariationType, string> = {
  "ghost-notes": "Ghost Notes",
  syncopation: "Syncopation",
  "accent-shift": "Accent Shift",
  fill: "Fill",
  "micro-timing": "Micro Timing",
  "subdivision-swap": "Subdivision Swap",
};

const FEEL_LABELS: Record<TimeFeel, string> = {
  straight: "Straight",
  swing: "Swing",
  compound: "Compound",
  asymmetric: "Additive",
  polyrhythmic: "Polyrhythm",
};

const TEMPO_BAND_LABELS: Record<RhythmTempoBand, string> = {
  slow: "Slow",
  medium: "Medium",
  fast: "Fast",
};

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function parseMeterSignature(signature: string): [number, number] {
  const [numerator, denominator] = signature.split("/").map(Number);

  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return [4, 4];
  }

  return [numerator, denominator];
}

function getStepDurationSeconds(
  bpm: number,
  meter: string,
  grouping: number[],
  totalSteps: number,
) {
  const [numerator, denominator] = parseMeterSignature(meter);
  const cycleDuration = numerator * (4 / denominator) * (60 / Math.max(1, bpm));
  const normalizedSteps = Math.max(1, totalSteps || sum(grouping) || numerator);

  return cycleDuration / normalizedSteps;
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

function getAdaptiveRegionId(definition: StructuredRhythmDefinition): RegionId {
  switch (definition.region) {
    case "west_africa":
      return "west_africa";
    case "balkans":
      return "balkans";
    case "flamenco":
      return "flamenco";
    case "afro_cuban":
      return "afro_cuban";
    case "brazil":
      return "brazil";
    case "india":
      return "india";
    case "middle_east":
      return "middle_east";
    case "argentina":
      return "argentina";
    case "afro_peruvian":
      return "afro_peruvian";
    case "uruguay":
      return "uruguay";
    default:
      return "general";
  }
}

function cloneLayers(layers: SequencerLayer[]) {
  return layers.map((layer) => ({
    ...layer,
    pattern: [...layer.pattern],
    velocity: [...layer.velocity],
  }));
}

function scaleMorphOverlay(
  pattern: number[],
  velocity: number[],
  targetLength: number,
  amount: number,
) {
  const overlay = buildMorphOverlayLayer(pattern, velocity, targetLength);

  if (!overlay || amount <= 0) {
    return null;
  }

  const scaledVelocity = overlay.velocity.map((value) =>
    value > 0 ? Math.max(0, Math.round(value * amount)) : 0,
  );

  return {
    ...overlay,
    pattern: scaledVelocity.map((value) => (value >= 18 ? 1 : 0)),
    velocity: scaledVelocity,
  };
}

function getValidationTone(errors: string[]) {
  return errors.length === 0
    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
    : "border-amber-500/40 bg-amber-500/10 text-amber-100";
}

function playFallbackTone(
  audioContext: AudioContext,
  time: number,
  velocity: number,
  band: SequencerLayer["band"],
) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = band === "low" ? "sine" : band === "mid" ? "triangle" : "square";
  oscillator.frequency.setValueAtTime(
    band === "low" ? 110 : band === "mid" ? 320 : 1500,
    time,
  );
  gainNode.gain.setValueAtTime(Math.max(0.08, velocity / 127) * (band === "low" ? 0.7 : 0.28), time);
  gainNode.gain.exponentialRampToValueAtTime(0.001, time + (band === "low" ? 0.28 : 0.1));

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start(time);
  oscillator.stop(time + (band === "low" ? 0.3 : 0.12));
}

function playLayerHit(
  audioContext: AudioContext,
  time: number,
  layer: SequencerLayer,
  velocity: number,
  accented: boolean,
) {
  const instrument = getInstrument(layer.instrumentId);

  if (!instrument) {
    playFallbackTone(audioContext, time, velocity, layer.band);
    return;
  }

  const velocityScale = Math.max(0.12, velocity / 127) * (accented ? 1.06 : 1);
  instrument.play(
    audioContext,
    time,
    velocityScale,
    instrument.defaultPitch,
    accented ? instrument.defaultDecay * 1.05 : instrument.defaultDecay,
  );
}

function mergeCompositeIntoLayers(
  layers: SequencerLayer[],
  nextPattern: number[],
  nextVelocity: number[],
  accentMap: number[],
  pulse: number[],
) {
  const nextLayers = cloneLayers(layers);
  const editableLayers = nextLayers.filter((layer) => !layer.locked);
  const lowLayer = editableLayers.find((layer) => layer.band === "low") || editableLayers[0];
  const midLayer = editableLayers.find((layer) => layer.band === "mid") || editableLayers[1] || lowLayer;
  const highLayer = editableLayers.find((layer) => layer.band === "high") || editableLayers[editableLayers.length - 1] || midLayer;
  const accentSet = new Set([...accentMap, ...pulse]);

  editableLayers.forEach((layer) => {
    layer.pattern.fill(0);
    layer.velocity.fill(0);
  });

  nextPattern.forEach((step, index) => {
    if (!step) {
      return;
    }

    const velocity = nextVelocity[index] ?? 96;
    const targetLayer = accentSet.has(index) && lowLayer
      ? lowLayer
      : velocity >= 104 && midLayer
        ? midLayer
        : highLayer;

    targetLayer.pattern[index] = 1;
    targetLayer.velocity[index] = velocity;
  });

  pulse.forEach((index) => {
    if (!lowLayer) {
      return;
    }

    if (lowLayer.pattern[index] === 0 && nextPattern[index] === 1) {
      lowLayer.pattern[index] = 1;
      lowLayer.velocity[index] = Math.max(108, nextVelocity[index] ?? 108);
    }
  });

  return nextLayers;
}

function getDefinitionForPreset(preset?: PatternPreset) {
  if (!preset) {
    return getDefaultRhythmDefinitionForCountry("Argentina") || RHYTHM_LIBRARY[0] || null;
  }

  return getRhythmDefinitionById(preset.id)
    || getDefaultRhythmDefinitionForCountry(preset.country)
    || RHYTHM_LIBRARY[0]
    || null;
}

const GlobalRhythmEngine = ({
  root = "C",
  mode = "major",
  embeddedPreset,
  tempo: controlledTempo,
  playing: controlledPlaying,
  selectedRegion,
  selectedRhythmId,
  onTempoChange,
  onPlayingChange,
  onRegionChange,
  onRhythmChange,
}: GlobalRhythmEngineProps) => {
  const initialDefinition = (
    getDefinitionForPreset(embeddedPreset)
    || RHYTHM_LIBRARY[0]
    || getDefaultRhythmDefinitionForCountry("Argentina")
  )!;

  const initialComposite = buildCompositePattern(initialDefinition.layers);

  const [rhythmState, setRhythmState] = useState<GlobalRhythmState>(() =>
    createGlobalRhythmState(initialDefinition, embeddedPreset?.bpm ?? initialDefinition.defaultTempo),
  );
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [swing, setSwing] = useState(0);
  const [browserRegion, setBrowserRegion] = useState<RhythmBrowserRegion | "All">(initialDefinition.region);
  const [browserCountry, setBrowserCountry] = useState(initialDefinition.country);
  const [meterFilter, setMeterFilter] = useState<string | "All">("All");
  const [feelFilter, setFeelFilter] = useState<TimeFeel | "All">("All");
  const [tempoBandFilter, setTempoBandFilter] = useState<RhythmTempoBand | "All">("All");
  const [continentFilter, setContinentFilter] = useState<RhythmContinent | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [showAtlas, setShowAtlas] = useState(true);
  const [showMorph, setShowMorph] = useState(false);
  const [showBlipblox, setShowBlipblox] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const [morphAmount, setMorphAmount] = useState(0);
  const [secondaryPattern, setSecondaryPattern] = useState<number[]>([...initialComposite.pattern]);
  const [secondaryVelocity, setSecondaryVelocity] = useState<number[]>([...initialComposite.velocity]);

  const [adaptiveMode, setAdaptiveMode] = useState(false);
  const [variationStrength, setVariationStrength] = useState(0.5);
  const [lastVariationType, setLastVariationType] = useState<VariationType | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const playheadRafRef = useRef<number | null>(null);
  const playingRef = useRef(false);
  const nextTimeRef = useRef(0);
  const stepRef = useRef(0);
  const loopCountRef = useRef(0);
  const playheadQueueRef = useRef<Array<{ step: number; time: number }>>([]);
  const baseLayersRef = useRef(rhythmState.layers);
  const effectiveLayersRef = useRef(rhythmState.layers);
  const rhythmStateRef = useRef(rhythmState);
  const currentDefinitionRef = useRef(initialDefinition);
  const swingRef = useRef(swing);
  const adaptiveModeRef = useRef(adaptiveMode);
  const variationStrengthRef = useRef(variationStrength);

  const activeDefinition = useMemo(
    () => getRhythmDefinitionById(rhythmState.rhythmId) || initialDefinition,
    [initialDefinition, rhythmState.rhythmId],
  );
  const morphOverlay = useMemo(
    () => scaleMorphOverlay(
      secondaryPattern,
      secondaryVelocity,
      rhythmState.layers[0]?.pattern.length ?? activeDefinition.cycleLength,
      morphAmount,
    ),
    [activeDefinition.cycleLength, morphAmount, rhythmState.layers, secondaryPattern, secondaryVelocity],
  );
  const effectiveLayers = useMemo(
    () => morphOverlay ? [...rhythmState.layers, morphOverlay] : rhythmState.layers,
    [morphOverlay, rhythmState.layers],
  );
  const compositePlayback = useMemo(
    () => buildCompositePattern(effectiveLayers),
    [effectiveLayers],
  );
  const activeValidationErrors = useMemo(
    () => unique([
      ...validateStructuredRhythm(activeDefinition),
      ...validateRhythm(activeDefinition.atlasRhythm),
    ]),
    [activeDefinition],
  );
  const quickPlayRhythms = useMemo(() => getQuickPlayRhythms(10), []);
  const morphSources = useMemo(
    () => RHYTHM_LIBRARY
      .filter((definition) => definition.classification !== "proxy")
      .slice(0, 14)
      .map((definition) => {
        const composite = buildCompositePattern(definition.layers);

        return {
          name: `${definition.country} · ${definition.name}`,
          midiPattern: composite.pattern,
          velocityPattern: composite.velocity,
        };
      }),
    [],
  );

  const filteredDefinitions = useMemo(
    () => filterRhythmLibrary({
      region: browserRegion,
      meter: meterFilter,
      feel: feelFilter,
      tempoBand: tempoBandFilter,
      search: searchQuery || undefined,
    }),
    [browserRegion, feelFilter, meterFilter, searchQuery, tempoBandFilter],
  );
  const regionCountries = useMemo(
    () => getRegionCountries(browserRegion).filter((country) =>
      filteredDefinitions.some((definition) => definition.country === country),
    ),
    [browserRegion, filteredDefinitions],
  );
  const browserRhythms = useMemo(
    () => filteredDefinitions.filter((definition) =>
      browserCountry ? definition.country === browserCountry : true,
    ),
    [browserCountry, filteredDefinitions],
  );
  const visibleAtlasRhythms = useMemo(() => {
    const visibleCountries = new Set(filteredDefinitions.map((definition) => definition.country));

    return GLOBAL_RHYTHM_ATLAS.filter((rhythm) => {
      if (continentFilter !== "All" && rhythm.continent !== continentFilter) {
        return false;
      }

      return visibleCountries.has(rhythm.country);
    });
  }, [continentFilter, filteredDefinitions]);

  useEffect(() => {
    if (typeof controlledTempo === "number" && controlledTempo !== rhythmState.tempo) {
      setRhythmState((currentState) => ({
        ...currentState,
        tempo: controlledTempo,
      }));
    }
  }, [controlledTempo, rhythmState.tempo]);

  const onTempoChangeRef = useRef(onTempoChange);
  onTempoChangeRef.current = onTempoChange;
  const onPlayingChangeRef = useRef(onPlayingChange);
  onPlayingChangeRef.current = onPlayingChange;
  const onRegionChangeRef = useRef(onRegionChange);
  onRegionChangeRef.current = onRegionChange;
  const onRhythmChangeRef = useRef(onRhythmChange);
  onRhythmChangeRef.current = onRhythmChange;

  useEffect(() => {
    onTempoChangeRef.current?.(rhythmState.tempo);
  }, [rhythmState.tempo]);

  useEffect(() => {
    onPlayingChangeRef.current?.(playing);
  }, [playing]);

  useEffect(() => {
    onRegionChangeRef.current?.(browserRegion);
  }, [browserRegion]);

  useEffect(() => {
    onRhythmChangeRef.current?.({
      rhythmId: activeDefinition.id,
      region: activeDefinition.region,
      country: activeDefinition.country,
    });
  }, [activeDefinition.country, activeDefinition.id, activeDefinition.region]);

  useEffect(() => {
    if (selectedRegion && selectedRegion !== browserRegion) {
      setBrowserRegion(selectedRegion);
    }
  }, [browserRegion, selectedRegion]);

  useEffect(() => {
    baseLayersRef.current = rhythmState.layers;
    rhythmStateRef.current = rhythmState;
  }, [rhythmState]);

  useEffect(() => {
    currentDefinitionRef.current = activeDefinition;
  }, [activeDefinition]);

  useEffect(() => {
    effectiveLayersRef.current = effectiveLayers;
  }, [effectiveLayers]);

  useEffect(() => {
    swingRef.current = swing;
  }, [swing]);

  useEffect(() => {
    adaptiveModeRef.current = adaptiveMode;
  }, [adaptiveMode]);

  useEffect(() => {
    variationStrengthRef.current = variationStrength;
  }, [variationStrength]);

  useEffect(() => {
    if (!regionCountries.length) {
      return;
    }

    if (!regionCountries.includes(browserCountry)) {
      setBrowserCountry(regionCountries[0]);
    }
  }, [browserCountry, regionCountries]);

  useEffect(() => {
    if (browserRhythms.length === 0) {
      return;
    }

    if (!browserRhythms.some((definition) => definition.id === activeDefinition.id)) {
      const nextDefinition = browserRhythms[0];

      if (nextDefinition) {
        setRhythmState(createGlobalRhythmState(nextDefinition));
      }
    }
  }, [activeDefinition.id, browserRhythms]);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }

    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }

    return audioCtxRef.current;
  }, []);

  const stopPlaybackTimers = useCallback(() => {
    playingRef.current = false;

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (playheadRafRef.current) {
      window.cancelAnimationFrame(playheadRafRef.current);
      playheadRafRef.current = null;
    }

    playheadQueueRef.current = [];
    setCurrentStep(-1);
  }, []);

  const loadRhythmDefinition = useCallback((
    definition: StructuredRhythmDefinition,
    options?: { tempo?: number; syncBrowser?: boolean },
  ) => {
    const composite = buildCompositePattern(definition.layers);

    setRhythmState(createGlobalRhythmState(definition, options?.tempo ?? definition.defaultTempo));
    setPlaying(false);
    setCurrentStep(-1);
    setMorphAmount(0);
    setSecondaryPattern([...composite.pattern]);
    setSecondaryVelocity([...composite.velocity]);
    adaptiveEngine.reset();
    setLastVariationType(null);

    if (options?.syncBrowser !== false) {
      setBrowserRegion(definition.region);
      setBrowserCountry(definition.country);
    }
  }, []);

  useEffect(() => {
    const nextDefinition = getDefinitionForPreset(embeddedPreset);

    if (!nextDefinition) {
      return;
    }

    loadRhythmDefinition(nextDefinition, {
      tempo: embeddedPreset?.bpm ?? nextDefinition.defaultTempo,
      syncBrowser: true,
    });
  }, [embeddedPreset, loadRhythmDefinition]);

  useEffect(() => {
    if (typeof controlledPlaying !== "boolean" || controlledPlaying === playing) {
      return;
    }

    setPlaying(controlledPlaying);
  }, [controlledPlaying, playing]);

  useEffect(() => {
    if (!selectedRhythmId || selectedRhythmId === activeDefinition.id) {
      return;
    }

    const nextDefinition = getRhythmDefinitionById(selectedRhythmId);

    if (nextDefinition) {
      loadRhythmDefinition(nextDefinition, {
        tempo: controlledTempo ?? rhythmState.tempo,
        syncBrowser: true,
      });
    }
  }, [activeDefinition.id, controlledTempo, loadRhythmDefinition, rhythmState.tempo, selectedRhythmId]);

  const handleLayersChange = useCallback((nextLayers: SequencerLayer[]) => {
    const sanitizedLayers = nextLayers.filter((layer) => layer.id !== "morph-overlay");
    const previousComposite = buildCompositePattern(baseLayersRef.current);
    const nextComposite = buildCompositePattern(sanitizedLayers);

    adaptiveEngine.trackEdit(previousComposite.pattern, nextComposite.pattern);
    setRhythmState((currentState) => ({
      ...currentState,
      layers: cloneLayers(sanitizedLayers),
    }));
  }, []);

  const handleStepPreview = useCallback((index: number, step: number, velocity: number, layerId?: string) => {
    if (step === 0 || velocity <= 0) {
      return;
    }

    const audioContext = getCtx();
    const previewTime = audioContext.currentTime + 0.01;
    const layer = effectiveLayersRef.current.find((entry) => entry.id === layerId) || effectiveLayersRef.current[0];

    if (!layer) {
      return;
    }

    playLayerHit(audioContext, previewTime, layer, velocity, activeDefinition.accentMap.includes(index));
  }, [activeDefinition.accentMap, getCtx]);

  const runPlayhead = useCallback(() => {
    if (!playingRef.current || !audioCtxRef.current) {
      return;
    }

    const queue = playheadQueueRef.current;

    while (queue.length > 0 && queue[0].time <= audioCtxRef.current.currentTime + 0.01) {
      const nextStep = queue.shift();

      if (typeof nextStep?.step === "number") {
        setCurrentStep(nextStep.step);
      }
    }

    playheadRafRef.current = window.requestAnimationFrame(runPlayhead);
  }, []);

  const scheduler = useCallback(() => {
    if (!playingRef.current) {
      return;
    }

    const audioContext = getCtx();
    const currentDefinitionValue = currentDefinitionRef.current;
    const layers = effectiveLayersRef.current;
    const totalSteps = layers[0]?.pattern.length ?? 0;

    if (totalSteps === 0) {
      timerRef.current = window.setTimeout(scheduler, 25);
      return;
    }

    const accentSet = new Set(currentDefinitionValue.accentMap);
    const stepDuration = getStepDurationSeconds(
      rhythmStateRef.current.tempo,
      currentDefinitionValue.meter,
      currentDefinitionValue.grouping,
      totalSteps,
    );

    while (nextTimeRef.current < audioContext.currentTime + 0.12) {
      const scheduledStep = stepRef.current;
      const scheduledTime = nextTimeRef.current;

      layers.forEach((layer) => {
        if (!layer.pattern[scheduledStep]) {
          return;
        }

        const velocity = layer.velocity[scheduledStep] ?? 0;

        if (velocity <= 0) {
          return;
        }

        playLayerHit(audioContext, scheduledTime, layer, velocity, accentSet.has(scheduledStep));
      });

      playheadQueueRef.current.push({ step: scheduledStep, time: scheduledTime });
      if (playheadQueueRef.current.length > totalSteps * 4) {
        playheadQueueRef.current = playheadQueueRef.current.slice(-totalSteps * 2);
      }

      stepRef.current = (scheduledStep + 1) % totalSteps;

      if (stepRef.current === 0) {
        loopCountRef.current += 1;

        if (adaptiveModeRef.current && loopCountRef.current >= 2) {
          loopCountRef.current = 0;
          const composite = buildCompositePattern(baseLayersRef.current);
          const result = adaptiveEngine.suggestVariation(
            composite.pattern,
            composite.velocity,
            getAdaptiveRegionId(currentDefinitionValue),
            variationStrengthRef.current,
          );

          setRhythmState((currentState) => ({
            ...currentState,
            layers: mergeCompositeIntoLayers(
              currentState.layers,
              result.pattern,
              result.velocity,
              currentDefinitionValue.accentMap,
              currentDefinitionValue.pulse,
            ),
          }));
          setLastVariationType(result.type);
        }
      }

      nextTimeRef.current += getSwingAdjustedStepAdvance(stepDuration, scheduledStep, swingRef.current);
    }

    timerRef.current = window.setTimeout(scheduler, 25);
  }, [getCtx]);

  useEffect(() => {
    if (playing) {
      playingRef.current = true;
      const audioContext = getCtx();
      nextTimeRef.current = audioContext.currentTime + 0.05;
      stepRef.current = 0;
      loopCountRef.current = 0;
      playheadQueueRef.current = [];
      runPlayhead();
      scheduler();
      return;
    }

    stopPlaybackTimers();
    setLastVariationType(null);
  }, [getCtx, playing, runPlayhead, scheduler, stopPlaybackTimers]);

  useEffect(() => {
    return () => {
      stopPlaybackTimers();
    };
  }, [stopPlaybackTimers]);

  const handleMapSelect = useCallback((rhythm: Rhythm) => {
    const definition = getDefaultRhythmDefinitionForCountry(rhythm.country);

    if (definition) {
      loadRhythmDefinition(definition, { syncBrowser: true });
    }
  }, [loadRhythmDefinition]);

  const handleExportMidi = useCallback(() => {
    const exportTracks = effectiveLayers
      .filter((layer) => layer.pattern.some((step) => step === 1))
      .map((layer) => ({
        instrumentId: layer.instrumentId,
        steps: layer.pattern.map((step, index) => step === 1 ? (layer.velocity[index] / 127) : 0),
        subdivisions: layer.pattern.length,
      }));

    const midiData = generateMidiFile(
      exportTracks,
      rhythmState.tempo,
      "general-midi",
      0,
      false,
      1,
      parseMeterSignature(activeDefinition.meter),
      true,
    );

    downloadMidiFile(
      midiData,
      `${activeDefinition.country.toLowerCase().replace(/[^a-z0-9]+/g, "-")}_${rhythmState.tempo}bpm.mid`,
    );
  }, [activeDefinition.country, activeDefinition.meter, effectiveLayers, rhythmState.tempo]);

  const handleExportJson = useCallback(() => {
    const payload = {
      rhythm: activeDefinition,
      state: rhythmState,
      composite: compositePlayback,
      harmonic: generateHarmonic(compositePlayback.pattern, compositePlayback.velocity, root, mode),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${activeDefinition.country.toLowerCase().replace(/[^a-z0-9]+/g, "-")}_atlas.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [activeDefinition, compositePlayback, mode, rhythmState, root]);

  const hasActiveSteps = compositePlayback.pattern.some((step) => step === 1);
  const playbackSummary = `${activeDefinition.meter} · ${activeDefinition.grouping.join("+")} · ${FEEL_LABELS[activeDefinition.feel]}`;

  return (
    <div className="space-y-5 rounded-[1.75rem] border border-border/70 bg-card p-4 shadow-[0_24px_70px_-42px_rgba(0,0,0,0.85)] sm:p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-bold">
            <Globe className="h-5 w-5 text-primary" />
            Global Rhythm Atlas Engine
          </h3>
          <p className="mt-2 max-w-3xl text-xs text-muted-foreground sm:text-sm">
            Atlas-backed rhythm selection, documented cultural structures, and a full-width playable sequencer.
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
          <span className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-[11px] font-medium text-foreground">
            {activeDefinition.country}
          </span>
          <span className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-[11px] font-medium text-foreground">
            {activeDefinition.name}
          </span>
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-[11px] font-medium",
              getValidationTone(activeValidationErrors),
            )}
          >
            {activeValidationErrors.length === 0 ? "Validated" : "Needs review"}
          </span>
          {lastVariationType && adaptiveMode && (
            <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-medium text-accent-foreground">
              {VARIATION_LABELS[lastVariationType]}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {quickPlayRhythms.map((definition) => (
          <button
            key={definition.id}
            type="button"
            onClick={() => loadRhythmDefinition(definition, { syncBrowser: true })}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium",
              definition.id === activeDefinition.id
                ? "border-primary/30 bg-primary/10 text-foreground"
                : "border-border bg-secondary/35 text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {definition.country} · {definition.name}
          </button>
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-secondary/30 p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Transport</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setPlaying((value) => !value)}
              disabled={!hasActiveSteps}
              className={cn(
                "inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl px-5 text-base font-semibold shadow-[0_16px_36px_-22px_rgba(255,255,255,0.35)]",
                playing
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
                !hasActiveSteps && "cursor-not-allowed opacity-50 shadow-none",
              )}
            >
              {playing ? <Square size={18} /> : <Play size={18} />}
              {playing ? "Stop" : "Play"}
            </button>

            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">
                {playing ? "Transport running" : "Ready to play"}
              </div>
              <div className="text-xs text-muted-foreground">
                {playbackSummary}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-secondary/30 p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Tempo</p>
          <div className="mt-4 flex items-center gap-3">
            <input
              type="range"
              min={40}
              max={220}
              value={rhythmState.tempo}
              onChange={(event) => {
                const tempo = Number(event.target.value);
                setRhythmState((currentState) => ({ ...currentState, tempo }));
              }}
              className="w-full accent-primary"
            />
            <span className="min-w-14 rounded-full border border-border bg-card px-3 py-1.5 text-center text-sm font-semibold text-foreground">
              {rhythmState.tempo}
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Suggested range {activeDefinition.tempoRange[0]}-{activeDefinition.tempoRange[1]} BPM
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
            Push the offbeats later without changing the cycle structure.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-secondary/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Adaptive Mode</p>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={adaptiveMode}
                onChange={(event) => {
                  setAdaptiveMode(event.target.checked);
                  adaptiveEngine.reset();
                  setLastVariationType(null);
                }}
                className="accent-primary"
              />
              Active
            </label>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="w-14 text-xs text-muted-foreground">Strength</span>
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

          <p className="mt-3 text-xs text-muted-foreground">
            Keeps the groove centered while letting the engine suggest small variations.
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <div className="rounded-2xl border border-border bg-secondary/15 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                <Music className="h-3.5 w-3.5" />
                Playable Sequencer
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Full-width lanes with native grouping, direct painting, velocity shaping, and visible downbeats.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setRhythmState((currentState) => ({
                  ...currentState,
                  layers: currentState.layers.map((layer) => ({
                    ...layer,
                    pattern: new Array(layer.pattern.length).fill(0),
                    velocity: new Array(layer.velocity.length).fill(0),
                  })),
                }));
              }}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Clear Pattern
            </button>
          </div>

          <div className="mt-4">
            <StepSequencer
              pattern={compositePlayback.pattern}
              velocityPattern={compositePlayback.velocity}
              layers={effectiveLayers}
              grouping={activeDefinition.grouping}
              pulseSteps={activeDefinition.pulse}
              accentSteps={activeDefinition.accentMap}
              onLayersChange={handleLayersChange}
              onStepPreview={handleStepPreview}
              currentStep={currentStep}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-secondary/20 p-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              Rhythm Identity Panel
            </p>
            <h4 className="mt-2 text-lg font-semibold text-foreground">
              {activeDefinition.name} - {activeDefinition.country}
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeDefinition.tradition}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-xl border border-border bg-card/80 p-3">
              <div className="text-muted-foreground">Meter</div>
              <div className="mt-1 font-medium text-foreground">{activeDefinition.meter}</div>
            </div>
            <div className="rounded-xl border border-border bg-card/80 p-3">
              <div className="text-muted-foreground">Grouping</div>
              <div className="mt-1 font-medium text-foreground">{activeDefinition.grouping.join(" + ")}</div>
            </div>
            <div className="rounded-xl border border-border bg-card/80 p-3">
              <div className="text-muted-foreground">Feel</div>
              <div className="mt-1 font-medium text-foreground">{FEEL_LABELS[activeDefinition.feel]}</div>
            </div>
            <div className="rounded-xl border border-border bg-card/80 p-3">
              <div className="text-muted-foreground">Region</div>
              <div className="mt-1 font-medium text-foreground">{activeDefinition.regionLabel}</div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/80 p-3">
            <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Instrument Roles</div>
            <div className="mt-2 grid gap-2 text-sm text-foreground">
              <div>Low: {activeDefinition.instrumentRoles.low || "n/a"}</div>
              <div>Mid: {activeDefinition.instrumentRoles.mid || "n/a"}</div>
              <div>High: {activeDefinition.instrumentRoles.high || "n/a"}</div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/80 p-3">
            <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Sources</div>
            <div className="mt-2 space-y-2 text-sm text-foreground">
              {activeDefinition.sources.slice(0, 4).map((source) => (
                <div key={`${source.title}-${source.detail}`} className="rounded-lg border border-white/6 bg-black/10 px-3 py-2">
                  <div className="font-medium">{source.title}</div>
                  <div className="text-xs text-muted-foreground">{source.detail}</div>
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex text-xs text-primary hover:underline"
                    >
                      Open reference
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {activeValidationErrors.length > 0 && (
            <div className={cn("rounded-xl border p-3 text-[11px]", getValidationTone(activeValidationErrors))}>
              <div className="font-medium text-foreground">Validation</div>
              <div className="mt-2 space-y-1 text-foreground/90">
                {activeValidationErrors.map((error) => (
                  <p key={error}>{error}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showAtlas && (
        <div className="grid gap-4 xl:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-4 rounded-2xl border border-border bg-secondary/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Rhythm Browser</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Region to country to rhythm, with filters that stay aligned with the atlas.
                </p>
              </div>
              <span className="rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] text-muted-foreground">
                {filteredDefinitions.length} rhythms
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/70 px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search rhythm, country, or instrument"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
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
                  {RHYTHM_LIBRARY_METERS.map((meter) => (
                    <option key={meter} value={meter}>{meter}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  Feel
                </label>
                <select
                  value={feelFilter}
                  onChange={(event) => setFeelFilter(event.target.value as TimeFeel | "All")}
                  className="w-full rounded-2xl border border-border bg-card px-3 py-3 text-sm text-foreground"
                >
                  <option value="All">All feels</option>
                  {RHYTHM_LIBRARY_FEELS.map((feel) => (
                    <option key={feel} value={feel}>{FEEL_LABELS[feel]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  Tempo Band
                </label>
                <select
                  value={tempoBandFilter}
                  onChange={(event) => setTempoBandFilter(event.target.value as RhythmTempoBand | "All")}
                  className="w-full rounded-2xl border border-border bg-card px-3 py-3 text-sm text-foreground"
                >
                  <option value="All">All tempi</option>
                  {(Object.keys(TEMPO_BAND_LABELS) as RhythmTempoBand[]).map((band) => (
                    <option key={band} value={band}>{TEMPO_BAND_LABELS[band]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  Atlas Scope
                </label>
                <select
                  value={continentFilter}
                  onChange={(event) => setContinentFilter(event.target.value as RhythmContinent | "All")}
                  className="w-full rounded-2xl border border-border bg-card px-3 py-3 text-sm text-foreground"
                >
                  <option value="All">All continents</option>
                  {unique(GLOBAL_RHYTHM_ATLAS.map((rhythm) => rhythm.continent)).map((continent) => (
                    <option key={continent} value={continent}>{continent}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Region</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setBrowserRegion("All")}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium",
                    browserRegion === "All"
                      ? "border-primary/30 bg-primary/10 text-foreground"
                      : "border-border bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  All
                </button>
                {RHYTHM_LIBRARY_REGIONS.map((region) => (
                  <button
                    key={region}
                    type="button"
                    onClick={() => setBrowserRegion(region)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium",
                      browserRegion === region
                        ? "border-primary/30 bg-primary/10 text-foreground"
                        : "border-border bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {region === "global" ? "Global" : region.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Country</div>
                <div className="max-h-[20rem] space-y-2 overflow-y-auto pr-1">
                  {regionCountries.map((country) => (
                    <button
                      key={country}
                      type="button"
                      onClick={() => {
                        setBrowserCountry(country);
                        const nextDefinition = filteredDefinitions.find((definition) => definition.country === country);
                        if (nextDefinition) {
                          loadRhythmDefinition(nextDefinition, { syncBrowser: true });
                        }
                      }}
                      className={cn(
                        "w-full rounded-2xl border px-3 py-2 text-left text-sm",
                        browserCountry === country
                          ? "border-primary/30 bg-primary/10 text-foreground"
                          : "border-border bg-card/70 text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      {country}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Rhythm</div>
                <div className="max-h-[20rem] space-y-2 overflow-y-auto pr-1">
                  {browserRhythms.map((definition) => (
                    <button
                      key={definition.id}
                      type="button"
                      onClick={() => loadRhythmDefinition(definition, { syncBrowser: true })}
                      className={cn(
                        "w-full rounded-2xl border px-3 py-3 text-left",
                        definition.id === activeDefinition.id
                          ? "border-primary/30 bg-primary/10 text-foreground"
                          : "border-border bg-card/70 text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <div className="text-sm font-medium">{definition.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {definition.meter} · {definition.grouping.join(" + ")} · {FEEL_LABELS[definition.feel]}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-secondary/20 p-3">
            <GlobalRhythmMap
              rhythms={visibleAtlasRhythms}
              selectedCountry={rhythmState.country}
              onCountrySelect={handleMapSelect}
            />
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
        <div className="space-y-4 rounded-2xl border border-border bg-secondary/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">Morph Overlay</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Blend a secondary cultural groove into the current instrument lanes without losing the active rhythm.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMorphAmount(0)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <TimerReset size={12} />
              Reset Morph
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="shrink-0 text-[10px] text-muted-foreground">Blend</span>
            <Slider
              value={[morphAmount * 100]}
              onValueChange={([value]) => setMorphAmount(value / 100)}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="w-10 text-right text-[10px] text-muted-foreground">
              {Math.round(morphAmount * 100)}%
            </span>
          </div>

          {morphSources.length >= 2 && (
            <PatternMorpher
              sources={morphSources}
              onResult={(nextPattern, nextVelocity) => {
                setSecondaryPattern(nextPattern);
                setSecondaryVelocity(nextVelocity);
                setMorphAmount(0.55);
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

          <div className="rounded-xl border border-border bg-card/80 p-3 text-xs text-muted-foreground">
            Export includes the layered rhythm state plus the current harmonic translation.
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalRhythmEngine;
