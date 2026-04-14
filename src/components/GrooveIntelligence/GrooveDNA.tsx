import { useEffect, useState, useCallback, useRef } from "react";
import type { NormalizedGroove } from "./types";
import type { DrumPattern, PlaybackState } from "./audioEngine";
import { interpretGroove, kNearest } from "./utils";
import { generatePattern, startPlayback, stopPlayback, downloadMidi } from "./audioEngine";

interface Props {
  groove: NormalizedGroove | null;
  allGrooves: NormalizedGroove[];
  onSelectGroove: (g: NormalizedGroove) => void;
  currentStep: number;
}

function AnimBar({ label, value, delay, color }: { label: string; value: number; delay: number; color: string }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(value * 100), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground font-mono uppercase tracking-wider">{label}</span>
        <span className="text-foreground/60 font-mono">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${w}%`, background: color }}
        />
      </div>
    </div>
  );
}

function StepGrid({ pattern, currentStep }: { pattern: DrumPattern; currentStep: number }) {
  const lanes: { name: string; hits: { step: number; vel: number }[]; color: string }[] = [
    { name: "KK", hits: pattern.kick, color: "hsl(30, 90%, 55%)" },
    { name: "SN", hits: pattern.snare, color: "hsl(350, 80%, 55%)" },
    { name: "HH", hits: pattern.hihat, color: "hsl(180, 70%, 50%)" },
    { name: "PC", hits: pattern.perc, color: "hsl(280, 70%, 60%)" },
  ];

  return (
    <div className="space-y-1">
      {lanes.map(lane => (
        <div key={lane.name} className="flex items-center gap-1">
          <span className="text-[8px] text-muted-foreground font-mono w-5 shrink-0">{lane.name}</span>
          <div className="flex gap-[2px] flex-1">
            {Array.from({ length: 16 }, (_, i) => {
              const hit = lane.hits.find(h => h.step === i);
              const isActive = currentStep === i;
              return (
                <div
                  key={i}
                  className="h-3 flex-1 rounded-[2px] transition-all duration-75"
                  style={{
                    background: hit
                      ? isActive
                        ? "white"
                        : lane.color
                      : isActive
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(255,255,255,0.03)",
                    opacity: hit ? 0.4 + hit.vel * 0.6 : 1,
                    boxShadow: hit && isActive ? `0 0 6px ${lane.color}` : "none",
                  }}
                />
              );
            })}
          </div>
        </div>
      ))}
      {/* Step indicators */}
      <div className="flex items-center gap-1 mt-0.5">
        <span className="w-5 shrink-0" />
        <div className="flex gap-[2px] flex-1">
          {Array.from({ length: 16 }, (_, i) => (
            <div
              key={i}
              className="h-0.5 flex-1 rounded-full transition-colors duration-75"
              style={{ background: currentStep === i ? "rgba(255,255,255,0.6)" : i % 4 === 0 ? "rgba(255,255,255,0.08)" : "transparent" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GrooveDNA({ groove, allGrooves, onSelectGroove, currentStep }: Props) {
  const [playing, setPlaying] = useState(false);
  const [pattern, setPattern] = useState<DrumPattern | null>(null);
  const patternRef = useRef<DrumPattern | null>(null);

  // Generate pattern when groove changes
  useEffect(() => {
    if (groove) {
      const p = generatePattern(groove);
      setPattern(p);
      patternRef.current = p;
    } else {
      setPattern(null);
      patternRef.current = null;
      setPlaying(false);
      stopPlayback();
    }
  }, [groove?.id]);

  // Cleanup on unmount
  useEffect(() => () => stopPlayback(), []);

  const togglePlay = useCallback(() => {
    if (!groove || !patternRef.current) return;
    if (playing) {
      stopPlayback();
      setPlaying(false);
    } else {
      startPlayback(groove, patternRef.current, () => {});
      setPlaying(true);
    }
  }, [groove, playing]);

  const handleExportMidi = useCallback(() => {
    if (groove && patternRef.current) {
      downloadMidi(groove, patternRef.current);
    }
  }, [groove]);

  if (!groove) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground/40 text-sm font-mono">
        Select a groove to inspect
      </div>
    );
  }

  const nearest = kNearest(allGrooves, groove, 5);
  const interpretation = interpretGroove(groove);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Identity */}
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

      {/* Playback Controls */}
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

        {/* Step Grid */}
        {pattern && <StepGrid pattern={pattern} currentStep={playing ? currentStep : -1} />}
      </div>

      {/* DNA Metrics */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3 font-mono">Groove DNA</div>
        <div className="space-y-3">
          <AnimBar label="Energy" value={groove.norm_density} delay={0} color="hsl(30, 90%, 55%)" />
          <AnimBar label="Swing" value={groove.norm_swing} delay={80} color="hsl(180, 70%, 50%)" />
          <AnimBar label="Syncopation" value={groove.norm_syncopation} delay={160} color="hsl(280, 70%, 60%)" />
          <AnimBar label="Expressiveness" value={groove.norm_velocity} delay={240} color="hsl(350, 80%, 55%)" />
        </div>
      </div>

      {/* Interpretation */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2 font-mono">Interpretation</div>
        <p className="text-sm text-foreground/70 italic leading-relaxed">&ldquo;{interpretation}&rdquo;</p>
      </div>

      {/* Nearest */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3 font-mono">
          Nearest in Feel Space
        </div>
        <div className="space-y-2">
          {nearest.map((n, i) => (
            <button
              key={n.id}
              onClick={() => onSelectGroove(n)}
              className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-secondary/60 transition-colors text-left group"
            >
              <div
                className="w-3 h-3 rounded-full shrink-0 group-hover:scale-125 transition-transform"
                style={{ background: n.color, boxShadow: `0 0 ${4 + n.glowIntensity * 6}px ${n.color}` }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium capitalize text-foreground/80 truncate">{n.genre} · {n.bpm} bpm</div>
                <div className="flex gap-2 mt-1">
                  {[
                    { v: n.norm_density, c: "hsl(30,90%,55%)" },
                    { v: n.norm_swing, c: "hsl(180,70%,50%)" },
                    { v: n.norm_syncopation, c: "hsl(280,70%,60%)" },
                  ].map((b, j) => (
                    <div key={j} className="h-1 flex-1 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${b.v * 100}%`, background: b.c }} />
                    </div>
                  ))}
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">#{i + 1}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
