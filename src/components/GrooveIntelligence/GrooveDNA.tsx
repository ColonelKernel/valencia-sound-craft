import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

interface Props {
  groove: NormalizedGroove | null;
  grooveMap: Map<string, NormalizedGroove>;
  onSelectGroove: (groove: NormalizedGroove) => void;
}

// Per-groove narrative cache. Successful responses and definite "no narrative"
// results are cached; transport errors are NOT, so a reselect retries.
const narrativeCache = new Map<string, string | null>();

type NarrativeStatus = "loading" | "ready" | "unavailable";

function AINarrative({ groove }: { groove: NormalizedGroove }) {
  const [status, setStatus] = useState<NarrativeStatus>("loading");
  const [narrative, setNarrative] = useState<string | null>(null);
  const grooveId = groove.id;

  useEffect(() => {
    const cached = narrativeCache.get(grooveId);
    if (cached !== undefined) {
      setNarrative(cached);
      setStatus(cached ? "ready" : "unavailable");
      return;
    }

    // Automated runs (Playwright sets navigator.webdriver) skip the live AI
    // call entirely so e2e stays deterministic and spends no credits.
    if (typeof navigator !== "undefined" && navigator.webdriver) {
      setNarrative(null);
      setStatus("unavailable");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setNarrative(null);

    // The debounce IS the timeout: browsing quickly through grooves clears the
    // pending timer before any request fires. Errors surface only as UI state —
    // never console output (the console-clean e2e gate counts own-origin errors).
    const timer = window.setTimeout(() => {
      // Loaded on first narrative fetch: supabase-js otherwise rides the
      // atlas feel-space chunk for every visitor.
      import("@/integrations/supabase/client")
        .then(({ supabase }) =>
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
          }),
        )
        .then(({ data, error }) => {
          if (cancelled) return;
          const text = !error && typeof data?.narrative === "string" && data.narrative
            ? (data.narrative as string)
            : null;
          if (!error) narrativeCache.set(grooveId, text);
          setNarrative(text);
          setStatus(text ? "ready" : "unavailable");
        })
        .catch(() => {
          if (!cancelled) {
            setNarrative(null);
            setStatus("unavailable");
          }
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // Keyed on the id, not the object — scene rebuilds must not refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grooveId]);

  return (
    <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">AI Narrative</p>
        {status === "loading" && (
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary/70" aria-hidden="true" />
        )}
      </div>
      {status === "loading" && (
        <div className="mt-3 space-y-2" aria-hidden="true">
          <div className="h-3 w-full animate-pulse rounded bg-secondary" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-secondary" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-secondary" />
        </div>
      )}
      {status === "ready" && narrative && (
        <p className="mt-2 text-sm italic leading-6 text-foreground/80">&ldquo;{narrative}&rdquo;</p>
      )}
      {status === "unavailable" && (
        <p className="mt-2 text-sm text-muted-foreground" role="status">Narrative unavailable</p>
      )}
    </div>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="font-mono uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground/60">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${value * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function MiniPreview({ groove, pattern }: { groove: NormalizedGroove; pattern: DrumPattern }) {
  const activitySteps = new Set<number>();
  for (const lane of [pattern.kick, pattern.snare, pattern.hihat, pattern.perc]) {
    for (const hit of lane) activitySteps.add(hit.step);
  }

  const metrics = [
    { value: groove.norm_density, color: "hsl(30, 90%, 55%)" },
    { value: groove.norm_swing, color: "hsl(180, 70%, 50%)" },
    { value: groove.norm_syncopation, color: "hsl(280, 70%, 60%)" },
    { value: groove.norm_velocity, color: "hsl(350, 80%, 55%)" },
  ];

  return (
    <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Mini Preview</p>
        <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">SVG</span>
      </div>
      <svg viewBox="0 0 180 96" className="w-full">
        <rect x="0" y="0" width="180" height="96" rx="18" fill="rgba(255,255,255,0.03)" />

        {metrics.map((metric, index) => {
          const barHeight = 18 + metric.value * 28;
          return (
            <g key={index}>
              <rect
                x={20 + index * 34}
                y={46 - barHeight / 2}
                width={20}
                height={barHeight}
                rx={8}
                fill={metric.color}
                opacity={0.85}
              />
            </g>
          );
        })}

        {Array.from({ length: 16 }, (_, step) => {
          const active = activitySteps.has(step);
          return (
            <rect
              key={step}
              x={16 + step * 9.25}
              y={74}
              width={6}
              height={active ? 10 : 4}
              rx={3}
              fill={active ? groove.color : "rgba(255,255,255,0.12)"}
            />
          );
        })}
      </svg>
    </div>
  );
}

function StepGrid({ pattern, active }: { pattern: DrumPattern; active: boolean }) {
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
          : (isActive ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)");
        cell.style.opacity = `${velocity ? 0.45 + velocity * 0.55 : 1}`;
        cell.style.boxShadow = velocity && isActive ? `0 0 8px ${lane.color}` : "none";
      }
    }

    for (let stepIndex = 0; stepIndex < 16; stepIndex++) {
      const indicator = indicatorRefs.current[stepIndex];
      if (!indicator) continue;
      indicator.style.background = step === stepIndex
        ? "rgba(255,255,255,0.7)"
        : stepIndex % 4 === 0
          ? "rgba(255,255,255,0.1)"
          : "transparent";
    }
  }, [lanes]);

  useEffect(() => {
    paintStep(active ? getPlaybackState().currentStep : -1);
  }, [active, paintStep]);

  useEffect(() => {
    const unsubscribe = subscribePlaybackSteps(step => {
      if (active) paintStep(step);
    });

    return unsubscribe;
  }, [active, paintStep]);

  return (
    <div className="space-y-1">
      {lanes.map((lane, laneIndex) => (
        <div key={lane.name} className="flex items-center gap-1">
          <span className="w-6 shrink-0 text-[10px] font-mono text-muted-foreground">{lane.name}</span>
          <div className="flex flex-1 gap-[2px]">
            {Array.from({ length: 16 }, (_, stepIndex) => (
              <div
                key={stepIndex}
                ref={setCellRef(laneIndex, stepIndex)}
                className="h-3 flex-1 rounded-[3px] transition-all duration-75"
              />
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-1">
        <span className="w-6 shrink-0" />
        <div className="flex flex-1 gap-[2px]">
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

export default function GrooveDNA({ groove, grooveMap, onSelectGroove }: Props) {
  const [playing, setPlaying] = useState(() => {
    const playback = getPlaybackState();
    return Boolean(groove && playback.playing && playback.grooveId === groove.id);
  });

  useEffect(() => {
    if (!groove) {
      setPlaying(false);
      return;
    }

    return subscribePlaybackState(state => {
      setPlaying(state.playing && state.grooveId === groove.id);
    });
  }, [groove]);

  useEffect(() => () => stopPlayback(), []);

  const pattern = useMemo(() => (
    groove ? generatePattern(groove) : null
  ), [groove]);

  const interpretation = useMemo(() => (
    groove ? interpretGroove(groove) : ""
  ), [groove]);

  const neighbors = useMemo(() => {
    if (!groove) return [];
    return groove.similar
      .map(id => grooveMap.get(id))
      .filter((candidate): candidate is NormalizedGroove => Boolean(candidate));
  }, [groove, grooveMap]);

  const togglePlayback = useCallback(() => {
    if (!groove || !pattern) return;

    if (playing) stopPlayback();
    else startPlayback(groove, pattern);
  }, [groove, pattern, playing]);

  const exportMidi = useCallback(() => {
    if (groove && pattern) downloadMidi(groove, pattern);
  }, [groove, pattern]);

  if (!groove || !pattern) {
    return (
      <div className="rounded-[1.5rem] border border-border/70 bg-card/75 p-6 text-sm text-muted-foreground">
        Select a groove to inspect its feel, pattern, and nearby matches.
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-[1.5rem] border border-border/70 bg-card/75 p-5 sm:p-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Selected Groove</p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold capitalize text-foreground">{groove.genre}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {groove.substyle || groove.beat_type || "Responsive sample detail"}
            </p>
          </div>
          <span className="rounded-full border border-border/70 px-3 py-1 text-xs font-mono text-muted-foreground">
            {groove.bpm} BPM
          </span>
        </div>
      </div>

      <MiniPreview groove={groove} pattern={pattern} />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={togglePlayback}
          className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            playing
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "border border-border/70 bg-background/80 text-foreground hover:bg-accent"
          }`}
        >
          {playing ? "Stop Playback" : "Play Groove"}
        </button>
        <button
          onClick={exportMidi}
          className="inline-flex items-center justify-center rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          Export MIDI
        </button>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Step Pattern</p>
        <StepGrid pattern={pattern} active={playing} />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Feel Metrics</p>
        <MetricBar label="Energy" value={groove.norm_density} color="hsl(30, 90%, 55%)" />
        <MetricBar label="Swing" value={groove.norm_swing} color="hsl(180, 70%, 50%)" />
        <MetricBar label="Syncopation" value={groove.norm_syncopation} color="hsl(280, 70%, 60%)" />
        <MetricBar label="Dynamics" value={groove.norm_velocity} color="hsl(350, 80%, 55%)" />
      </div>

      <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
        <p className="text-sm font-semibold text-foreground">Interpretation</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{interpretation}</p>
      </div>

      <AINarrative groove={groove} />

      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Nearest in Feel Space</p>
        <div className="space-y-2">
          {neighbors.map((neighbor, index) => (
            <button
              key={neighbor.id}
              onClick={() => onSelectGroove(neighbor)}
              className="flex w-full items-center gap-3 rounded-[1rem] border border-border/70 bg-background/70 p-3 text-left transition-colors hover:bg-accent/60"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: neighbor.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium capitalize text-foreground">
                  {neighbor.genre} · {neighbor.bpm} BPM
                </div>
                <div className="mt-1 flex gap-2">
                  {[
                    { value: neighbor.norm_density, color: "hsl(30, 90%, 55%)" },
                    { value: neighbor.norm_swing, color: "hsl(180, 70%, 50%)" },
                    { value: neighbor.norm_syncopation, color: "hsl(280, 70%, 60%)" },
                  ].map((metric, metricIndex) => (
                    <div key={metricIndex} className="h-1 flex-1 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${metric.value * 100}%`, backgroundColor: metric.color }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                #{index + 1}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
