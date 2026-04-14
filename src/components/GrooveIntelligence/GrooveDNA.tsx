import { useEffect, useState } from "react";
import type { NormalizedGroove } from "./types";
import { interpretGroove, kNearest } from "./utils";

interface Props {
  groove: NormalizedGroove | null;
  allGrooves: NormalizedGroove[];
  onSelectGroove: (g: NormalizedGroove) => void;
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

export default function GrooveDNA({ groove, allGrooves, onSelectGroove }: Props) {
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
    <div className="space-y-6 animate-fade-in">
      {/* Identity */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3 font-mono">Identity</div>
        <div className="text-lg font-semibold capitalize text-foreground">{groove.genre}</div>
        <div className="text-xs text-muted-foreground mt-1 space-x-3 font-mono">
          <span>{groove.bpm} BPM</span>
          <span>·</span>
          <span>{groove.duration.toFixed(1)}s</span>
          {groove.substyle && <><span>·</span><span>{groove.substyle}</span></>}
        </div>
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
