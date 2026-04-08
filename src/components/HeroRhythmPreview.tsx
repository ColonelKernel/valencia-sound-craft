import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import { Link } from "react-router-dom";

import StepSequencer from "@/components/Blipblox/StepSequencer";
import { buildCompositePattern, type SequencerLayer } from "@/components/Blipblox/rhythmEngineModel";
import { cn } from "@/lib/utils";

const HERO_STEP_COUNT = 8;
const HERO_BPM = 108;

const HERO_TRACKS: SequencerLayer[] = [
  {
    id: "hero-kick",
    label: "Kick",
    instrumentId: "kick",
    instrument: "Kick",
    role: "bass",
    band: "low",
    pattern: [1, 0, 0, 1, 0, 0, 1, 0],
    velocity: [122, 0, 0, 108, 0, 0, 98, 0],
  },
  {
    id: "hero-clap",
    label: "Clap",
    instrumentId: "snare",
    instrument: "Clap",
    role: "lead",
    band: "mid",
    pattern: [0, 0, 1, 0, 0, 0, 1, 0],
    velocity: [0, 0, 94, 0, 0, 0, 102, 0],
  },
  {
    id: "hero-hat",
    label: "Hat",
    instrumentId: "hh-closed",
    instrument: "Hi-Hat",
    role: "timeline",
    band: "high",
    pattern: [1, 1, 1, 1, 1, 1, 1, 1],
    velocity: [74, 58, 68, 56, 76, 60, 70, 58],
  },
];

function cloneHeroTracks(tracks: SequencerLayer[]) {
  return tracks.map((track) => ({
    ...track,
    pattern: [...track.pattern],
    velocity: [...track.velocity],
  }));
}

function createEmptyHeroTracks() {
  return HERO_TRACKS.map((track) => ({
    ...track,
    pattern: new Array(HERO_STEP_COUNT).fill(0),
    velocity: new Array(HERO_STEP_COUNT).fill(0),
  }));
}

const HeroRhythmPreview = () => {
  const [layers, setLayers] = useState<SequencerLayer[]>(() => createEmptyHeroTracks());
  const [currentStep, setCurrentStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [showPulse, setShowPulse] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const stepRef = useRef(0);
  const compositePlayback = useMemo(() => buildCompositePattern(layers), [layers]);

  const activeStepCount = useMemo(
    () =>
      layers.reduce(
        (count, layer) => count + layer.pattern.reduce((layerTotal, step) => layerTotal + step, 0),
        0,
      ),
    [layers],
  );

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }

    if (audioCtxRef.current.state === "suspended") {
      void audioCtxRef.current.resume();
    }

    return audioCtxRef.current;
  }, []);

  const playPreviewTone = useCallback((index: number, step: number, nextVelocity: number, layerId?: string) => {
    if (step === 0 || nextVelocity <= 0) {
      return;
    }

    const audioContext = getAudioContext();
    const time = audioContext.currentTime;
    const layer = layerId ? layers.find((entry) => entry.id === layerId) : null;
    const band = layer?.band ?? "mid";
    const accent = index % 4 === 0 || nextVelocity >= 100;
    const bodyStartFrequency = band === "low" ? 110 : band === "high" ? 320 : 188;
    const bodyEndFrequency = band === "low" ? 52 : band === "high" ? 150 : 84;
    const clickStartFrequency = band === "low" ? 420 : band === "high" ? 1680 : 980;
    const clickEndFrequency = band === "low" ? 160 : band === "high" ? 720 : 320;
    const bodyPeakGain = band === "low" ? 0.22 : band === "high" ? 0.08 : 0.16;
    const clickPeakGain = band === "low" ? 0.035 : band === "high" ? 0.045 : 0.05;

    const bodyOscillator = audioContext.createOscillator();
    const bodyGain = audioContext.createGain();
    const clickOscillator = audioContext.createOscillator();
    const clickGain = audioContext.createGain();

    bodyOscillator.type = band === "low" ? "triangle" : accent ? "square" : "sine";
    bodyOscillator.frequency.setValueAtTime(accent ? bodyStartFrequency : bodyStartFrequency * 0.88, time);
    bodyOscillator.frequency.exponentialRampToValueAtTime(bodyEndFrequency, time + 0.14);

    bodyGain.gain.setValueAtTime(0.0001, time);
    bodyGain.gain.exponentialRampToValueAtTime(bodyPeakGain, time + 0.01);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);

    clickOscillator.type = band === "high" ? "triangle" : "square";
    clickOscillator.frequency.setValueAtTime(accent ? clickStartFrequency : clickStartFrequency * 0.82, time);
    clickOscillator.frequency.exponentialRampToValueAtTime(clickEndFrequency, time + 0.04);

    clickGain.gain.setValueAtTime(0.0001, time);
    clickGain.gain.exponentialRampToValueAtTime(clickPeakGain, time + 0.005);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

    bodyOscillator.connect(bodyGain);
    clickOscillator.connect(clickGain);
    bodyGain.connect(audioContext.destination);
    clickGain.connect(audioContext.destination);

    bodyOscillator.start(time);
    clickOscillator.start(time);
    bodyOscillator.stop(time + 0.2);
    clickOscillator.stop(time + 0.08);
  }, [getAudioContext, layers]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      setLayers(cloneHeroTracks(HERO_TRACKS));
      setShowPulse(true);
      return;
    }

    const activateTimer = window.setTimeout(() => {
      setLayers(cloneHeroTracks(HERO_TRACKS));
      setShowPulse(true);
    }, 240);

    return () => {
      window.clearTimeout(activateTimer);
    };
  }, []);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }

      stepRef.current = 0;
      setCurrentStep(-1);
      return;
    }

    const stepDurationMs = ((60 / HERO_BPM) * 1000) / 2;

    timerRef.current = window.setInterval(() => {
      const nextStep = stepRef.current;

      setCurrentStep(nextStep);

      layers.forEach((layer) => {
        if (layer.pattern[nextStep] === 1) {
          playPreviewTone(nextStep, layer.pattern[nextStep], layer.velocity[nextStep] ?? 0, layer.id);
        }
      });

      stepRef.current = (nextStep + 1) % HERO_STEP_COUNT;
    }, stepDurationMs);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [layers, playPreviewTone, playing]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleLayersChange = (nextLayers: SequencerLayer[]) => {
    setLayers(cloneHeroTracks(nextLayers));
    setShowPulse(false);
  };

  return (
    <div className="hero-preview-glow rounded-3xl border border-primary-foreground/14 bg-black/35 p-4 shadow-[0_28px_80px_-36px_rgba(0,0,0,0.85)] backdrop-blur-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-primary-foreground/55">
            Rhythm Engine
          </p>
          <h2 className="mt-2 text-2xl font-bold text-primary-foreground">Start with the groove</h2>
        </div>
        <span className="rounded-full border border-primary-foreground/15 bg-primary-foreground/8 px-3 py-1 text-[11px] text-primary-foreground/70">
          {HERO_BPM} BPM
        </span>
      </div>

      <p className="mt-4 rounded-2xl border border-primary-foreground/12 bg-primary-foreground/6 px-4 py-3 text-sm font-medium text-primary-foreground">
        Stack kick, clap, and hats into a groove → Press play
      </p>

      <div className="mt-4 rounded-2xl border border-primary-foreground/10 bg-black/25 p-4">
        <StepSequencer
          pattern={compositePlayback.pattern}
          velocityPattern={compositePlayback.velocity}
          layers={layers}
          layout="compact"
          onLayersChange={handleLayersChange}
          onStepPreview={playPreviewTone}
          pulseSteps={showPulse ? [0, 2, 4, 6] : []}
          currentStep={currentStep}
          stepOptions={[]}
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => {
            setShowPulse(false);
            setPlaying((value) => !value);
          }}
          disabled={activeStepCount === 0}
          className={cn(
            "inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl px-6 text-base font-semibold shadow-[0_16px_36px_-18px_rgba(255,255,255,0.45)]",
            playing
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
            activeStepCount === 0 && "cursor-not-allowed opacity-50 shadow-none",
          )}
        >
          {playing ? <Square size={18} /> : <Play size={18} />}
          {playing ? "Stop Preview" : "Play Rhythm"}
        </button>

        <Link
          to="/tools/rhythm"
          className="inline-flex items-center justify-center rounded-2xl border border-primary-foreground/18 px-4 py-3 text-sm font-medium text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
        >
          Open the full rhythm system
        </Link>
      </div>
    </div>
  );
};

export default HeroRhythmPreview;
