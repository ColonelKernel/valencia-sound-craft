import { type ReactNode } from "react";

import { useInView } from "@/hooks/useInView";

interface RhythmToolUIProps {
  summaryLabel: string;
  tempo: number;
  source: string;
  engine: ReactNode;
  legacyWorkspace: ReactNode;
}

const RhythmToolUI = ({ summaryLabel, tempo, source, engine, legacyWorkspace }: RhythmToolUIProps) => {
  // Rendering legacyWorkspace is what triggers the lazy DrumMachine import —
  // deferring it until the section nears the viewport keeps the ~28 KB drum
  // stack out of the route's first request waves.
  const { ref: workspaceRef, inView: workspaceInView } = useInView<HTMLElement>("600px");

  return (
    <div className="space-y-6">
      <section aria-labelledby="rhythm-engine-section" className="space-y-4">
        <header className="space-y-2">
          <h2 id="rhythm-engine-section" className="text-2xl font-semibold text-foreground">
            Unified Rhythm Engine
          </h2>
          <p className="text-sm text-muted-foreground">
            Current rhythm: {summaryLabel}. Shared tempo: {tempo} BPM.
          </p>
          <p className="text-xs text-muted-foreground">Source: {source}</p>
        </header>
        {engine}
      </section>

      <article ref={workspaceRef} className="space-y-4 rounded-[1.5rem] border border-border/70 bg-card/60 p-5">
        <header className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">Classic Groove Workspace</h2>
          <p className="text-sm text-muted-foreground">
            The full drum-machine editor — program grooves step by step, with the same rhythm and tempo as the engine above.
          </p>
        </header>
        {workspaceInView ? (
          legacyWorkspace
        ) : (
          <div className="flex min-h-[24rem] items-center justify-center rounded-2xl border border-border bg-secondary/20 text-sm text-muted-foreground">
            Loading tool workspace…
          </div>
        )}
      </article>
    </div>
  );
};

export default RhythmToolUI;
