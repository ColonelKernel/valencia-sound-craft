import { useEffect, useMemo, useCallback, useRef, useState, type MutableRefObject } from "react";
import type { NormalizedGroove } from "./types";
import type { DrumPattern } from "./audioEngine";
import {
  downloadMidi,
  generatePattern,
  getPlaybackState,
  startPlayback,
  stopPlayback,
  subscribePlaybackState,
  subscribePlaybackSteps,
} from "./audioEngine";
import { interpretGroove } from "./utils";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  groove: NormalizedGroove | null;
  grooveMap: Map<string, NormalizedGroove>;
  onSelectGroove: (g: NormalizedGroove) => void;
}

const narrativeCache = new Map<string, string | null>();

function AnimBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground font-mono uppercase tracking-wider">{label}</span>
        <span className="text-foreground/60 font-mono">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${value * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}

function StepGrid({
  pattern,
  stepRef,
  active,
}: {
  pattern: DrumPattern;
  stepRef: MutableRefObject<number>;
  active: boolean;
}) {
  const lanes = useMemo(() => ([
    { name: "KK", hits: pattern.kick, color: "hsl(30, 90%, 55%)" },
    { name: "SN", hits: pattern.snare, color: "hsl(350, 80%, 55%)" },
    { name: "HH", hits: pattern.hihat, color: "hsl(180, 70%, 50%)" },
    { name: "PC", hits: pattern.perc, color: "hsl(280, 70%, 60%)" },
  ]).map(lane => ({
    ...lane,
    hitMap: new Map(lane.hits.map(hit => [hit.step, hit.vel])),
  })), [pattern]);

  const cellRefs = useRef<HTMLDivElement[][]>([]);
  const indicatorRefs = useRef<(HTMLDivElement | null)[]>([]);

  const setCellRef = useCallback((laneIndex: number, stepIndex: number) => (node: HTMLDivElement | null) => {
    if (!cellRefs.current[laneIndex]) cellRefs.current[laneIndex] = [];
    cellRefs.current[laneIndex][stepIndex] = node;
  }, []);

  const setIndicatorRef = useCallback((stepIndex: number) => (node: HTMLDivElement | null) => {
    indicatorRefs.current[stepIndex] = node;
  }, []);

  const paintStep = useCallback((step: number) => {
    for (let laneIndex = 0; laneIndex < lanes.length; laneIndex++) {
      const lane = lanes[laneIndex];
      const cells = cellRefs.current[laneIndex] ?? [];
      for (let stepIndex = 0; stepIndex < 16; stepIndex++) {
        const cell = cells[stepIndex];
        if (!cell) continue;

        const velocity = lane.hitMap.get(stepIndex);
        const isActive = step === stepIndex;
        cell.style.background = velocity
          ? (isActive ? "white" : lane.color)
          : (isActive ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)");
        cell.style.opacity = `${velocity ? 0.4 + velocity * 0.6 : 1}`;
        cell.style.boxShadow = velocity && isActive ? `0 0 6px ${lane.color}` : "none";
      }
    }

    for (let stepIndex = 0; stepIndex < 16; stepIndex++) {
      const indicator = indicatorRefs.current[stepIndex];
      if (!indicator) continue;
      indicator.style.background = step === stepIndex
        ? "rgba(255,255,255,0.6)"
        : stepIndex % 4 === 0
          ? "rgba(255,255,255,0.08)"
          : "transparent";
    }
  }, [lanes]);

  useEffect(() => {
    paintStep(active ? stepRef.current : -1);
    let raf = 0;
    let lastStep = Number.NaN;

    const loop = () => {
      const step = active ? stepRef.current : -1;
      if (step !== lastStep) {
        paintStep(step);
        lastStep = step;
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, paintStep, stepRef]);

  return (
    <div className="space-y-1">
      {lanes.map((lane, laneIndex) => (
        <div key={lane.name} className="flex items-center gap-1">
          <span className="text-[8px] text-muted-foreground font-mono w-5 shrink-0">{lane.name}</span>
          <div className="flex gap-[2px] flex-1">
            {Array.from({ length: 16 }, (_, stepIndex) => (
              <div
                key={stepIndex}
                ref={setCellRef(laneIndex, stepIndex)}
                className="h-3 flex-1 rounded-[2px] transition-all duration-75"
              />
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-1 mt-0.5">
        <span className="w-5 shrink-0" />
        <div className="flex gap-[2px] flex-1">
          {Array.from({ length: 16 }, (_, stepIndex) => (
            <div
              key={stepIndex}
              ref={setIndicatorRef(stepIndex)}
              className="h-0.5 flex-1 rounded-full transition-colors duration-75"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AINarrative({ groove }: { groove: NormalizedGroove }) {
  const [narrative, setNarrative] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cached = narrativeCache.get(groove.id);
    if (cached !== undefined) {
      setNarrative(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setNarrative(null);

    supabase.functions.invoke("groove-narrative", {
      body: {
        genre: groove.genre,
        bpm: groove.bpm,
        duration: groove.duration,
        density: groove.norm_density,
        swing: groove.norm_swing,
        syncopation: groove.norm_syncopation,
        velocity: groove.norm_velocity,
        substyle: groove.substyle,
      },
    }).then(({ data, error }) => {
      if (cancelled) return;

      if (error) {
        console.error("Narrative error:", error);
        narrativeCache.set(groove.id, null);
        setNarrative(null);
      } else {
        const nextNarrative = data?.narrative || null;
        narrativeCache.set(groove.id, nextNarrative);
        setNarrative(nextNarrative);
      }

      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [groove]);

  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2 font-mono flex items-center gap-2">
        AI Narrative
        {loading && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
      </div>
      {loading && (
        <div className="space-y-1.5">
          <div className="h-3 bg-foreground/5 rounded animate-pulse w-full" />
          <div className="h-3 bg-foreground/5 rounded animate-pulse w-4/5" />
          <div className="h-3 bg-foreground/5 rounded animate-pulse w-3/5" />
        </div>
      )}
      {!loading && narrative && (
        <p className="text-sm text-foreground/80 leading-relaxed italic">&ldquo;{narrative}&rdquo;</p>
      )}
      {!loading && !narrative && (
        <p className="text-xs text-muted-foreground/40 font-mono">Narrative unavailable</p>
      )}
    </div>
  );
}

export default function GrooveDNA({ groove, grooveMap, onSelectGroove }: Props) {
  const stepRef = useRef(getPlaybackState().currentStep);
  const [playing, setPlaying] = useState(() => {
    const playback = getPlaybackState();
    return playback.playing && playback.grooveId === groove?.id;
  });

  useEffect(() => subscribePlaybackSteps(step => {
    stepRef.current = step;
  }), []);

  useEffect(() => {
    return subscribePlaybackState(state => {
      const isCurrentGroove = state.playing && state.grooveId === groove?.id;
      stepRef.current = isCurrentGroove ? state.currentStep : -1;
      setPlaying(isCurrentGroove);
    });
  }, [groove?.id]);

  useEffect(() => {
    if (!groove) {
      stepRef.current = -1;
      setPlaying(false);
    }
  }, [groove]);

  useEffect(() => () => stopPlayback(), []);

  const pattern = useMemo(() => (
    groove ? generatePattern(groove) : null
  ), [groove]);

  const nearest = useMemo(() => {
    if (!groove) return [];
    return groove.similar
      .map(id => grooveMap.get(id))
      .filter((candidate): candidate is NormalizedGroove => Boolean(candidate));
  }, [groove, grooveMap]);

  const interpretation = useMemo(() => (
    groove ? interpretGroove(groove) : ""
  ), [groove]);

  const togglePlay = useCallback(() => {
    if (!groove || !pattern) return;

    if (playing) stopPlayback();
    else startPlayback(groove, pattern);
  }, [groove, pattern, playing]);

  const handleExportMidi = useCallback(() => {
    if (groove && pattern) downloadMidi(groove, pattern);
  }, [groove, pattern]);

  if (!groove) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground/40 text-sm font-mono">
        Select a groove to inspect
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2 font-mono">Identity</div>
        <div className="text-lg font-semibold capitalize text-foreground">{groove.genre}</div>
        <div className="text-xs text-muted-foreground mt-1 space-x-3 font-mono">
          <span>{groove.bpm} BPM</span>
          <span>·</span>
          <span>{groove.duration.toFixed(1)}s</span>
          {groove.substyle && <><span>·</span><span>{groove.substyle}</span></>}
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2 font-mono">Performance</div>
        <div className="flex gap-2 mb-3">
          <button
            onClick={togglePlay}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
              playing
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10 border border-white/5"
            }`}
          >
            <span className={`w-2 h-2 rounded-sm ${playing ? "bg-green-400 animate-pulse" : "bg-foreground/40"}`} />
            {playing ? "Stop" : "Play"}
          </button>
          <button
            onClick={handleExportMidi}
            className="px-3 py-2 rounded-md text-xs font-mono uppercase tracking-wider bg-foreground/5 text-foreground/70 hover:bg-foreground/10 border border-white/5 transition-colors"
            title="Export MIDI"
          >
            MIDI ↓
          </button>
        </div>

        {pattern && <StepGrid pattern={pattern} stepRef={stepRef} active={playing} />}
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3 font-mono">Groove DNA</div>
        <div className="space-y-3">
          <AnimBar label="Energy" value={groove.norm_density} color="hsl(30, 90%, 55%)" />
          <AnimBar label="Swing" value={groove.norm_swing} color="hsl(180, 70%, 50%)" />
          <AnimBar label="Syncopation" value={groove.norm_syncopation} color="hsl(280, 70%, 60%)" />
          <AnimBar label="Expressiveness" value={groove.norm_velocity} color="hsl(350, 80%, 55%)" />
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2 font-mono">Interpretation</div>
        <p className="text-sm text-foreground/70 italic leading-relaxed">&ldquo;{interpretation}&rdquo;</p>
      </div>

      <AINarrative groove={groove} />

      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3 font-mono">
          Nearest in Feel Space
        </div>
        <div className="space-y-2">
          {nearest.map((neighbor, index) => (
            <button
              key={neighbor.id}
              onClick={() => onSelectGroove(neighbor)}
              className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-secondary/60 transition-colors text-left group"
            >
              <div
                className="w-3 h-3 rounded-full shrink-0 group-hover:scale-125 transition-transform"
                style={{ background: neighbor.color, boxShadow: `0 0 ${4 + neighbor.glowIntensity * 6}px ${neighbor.color}` }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium capitalize text-foreground/80 truncate">{neighbor.genre} · {neighbor.bpm} bpm</div>
                <div className="flex gap-2 mt-1">
                  {[
                    { v: neighbor.norm_density, c: "hsl(30,90%,55%)" },
                    { v: neighbor.norm_swing, c: "hsl(180,70%,50%)" },
                    { v: neighbor.norm_syncopation, c: "hsl(280,70%,60%)" },
                  ].map((bar, barIndex) => (
                    <div key={barIndex} className="h-1 flex-1 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${bar.v * 100}%`, background: bar.c }} />
                    </div>
                  ))}
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">#{index + 1}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
