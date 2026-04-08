import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play, Square } from "lucide-react";

import StepSequencer from "@/components/Blipblox/StepSequencer";
import { cn } from "@/lib/utils";

const HERO_STEP_COUNT = 8;
const SEEDED_PATTERN = [1, 0, 0, 1, 0, 0, 0, 0];
const SEEDED_VELOCITY = [112, 0, 0, 88, 0, 0, 0, 0];
const HERO_BPM = 108;

const HeroRhythmPreview = () => {
  const [pattern, setPattern] = useState<number[]>(() => new Array(HERO_STEP_COUNT).fill(0));
  const [velocity, setVelocity] = useState<number[]>(() => new Array(HERO_STEP_COUNT).fill(0));
  const [currentStep, setCurrentStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [showPulse, setShowPulse] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const stepRef = useRef(0);

  const activeStepCount = useMemo(
    () => pattern.reduce((count, step) => count + (step > 0 ? 1 : 0), 0),
    [pattern],
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

  const playPreviewTone = useCallback((index: number, step: number, nextVelocity: number) => {
    if (step === 0 || nextVelocity <= 0) {
      return;
    }

    const audioContext = getAudioContext();
    const time = audioContext.currentTime;
    const accent = index % 4 === 0 || nextVelocity >= 100;

    const bodyOscillator = audioContext.createOscillator();
    const bodyGain = audioContext.createGain();
    const clickOscillator = audioContext.createOscillator();
    const clickGain = audioContext.createGain();

    bodyOscillator.type = accent ? "triangle" : "sine";
    bodyOscillator.frequency.setValueAtTime(accent ? 188 : 152, time);
    bodyOscillator.frequency.exponentialRampToValueAtTime(72, time + 0.14);

    bodyGain.gain.setValueAtTime(0.0001, time);
    bodyGain.gain.exponentialRampToValueAtTime(0.18, time + 0.01);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);

    clickOscillator.type = "square";
    clickOscillator.frequency.setValueAtTime(accent ? 980 : 760, time);
    clickOscillator.frequency.exponentialRampToValueAtTime(320, time + 0.04);

    clickGain.gain.setValueAtTime(0.0001, time);
    clickGain.gain.exponentialRampToValueAtTime(0.05, time + 0.005);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

    bodyOscillator.connect(bodyGain);
    clickOscillator.connect(clickGain);
    bodyGain.connect(audioContext.destination);
    clickGain.connect(audioContext.destination);

    bodyOscillator.start(time);
    clickOscillator.start(time);
    bodyOscillator.stop(time + 0.2);
    clickOscillator.stop(time + 0.08);
  }, [getAudioContext]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      setPattern([...SEEDED_PATTERN]);
      setVelocity([...SEEDED_VELOCITY]);
      setShowPulse(true);
      return;
    }

    const activateTimer = window.setTimeout(() => {
      setPattern([...SEEDED_PATTERN]);
      setVelocity([...SEEDED_VELOCITY]);
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

      if (pattern[nextStep] === 1) {
        playPreviewTone(nextStep, pattern[nextStep], velocity[nextStep] ?? 0);
      }

      stepRef.current = (nextStep + 1) % pattern.length;
    }, stepDurationMs);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [pattern, playPreviewTone, playing, velocity]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const handlePatternChange = (nextPattern: number[], nextVelocity: number[]) => {
    setPattern(nextPattern);
    setVelocity(nextVelocity);
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
        Click any step to build a rhythm → Press play
      </p>

      <div className="mt-4 rounded-2xl border border-primary-foreground/10 bg-black/25 p-4">
        <StepSequencer
          pattern={pattern}
          velocityPattern={velocity}
          onChange={handlePatternChange}
          onStepPreview={playPreviewTone}
          pulseSteps={showPulse ? [0, 3] : []}
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

        <a
          href="#mode-visualizer"
          className="inline-flex items-center justify-center rounded-2xl border border-primary-foreground/18 px-4 py-3 text-sm font-medium text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
        >
          Open the full rhythm system
        </a>
      </div>
    </div>
  );
};

export default HeroRhythmPreview;
