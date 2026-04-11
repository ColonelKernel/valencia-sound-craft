import { type ReactNode } from "react";

interface RhythmToolUIProps {
  summaryLabel: string;
  tempo: number;
  source: string;
  engine: ReactNode;
  legacyWorkspace: ReactNode;
}

const RhythmToolUI = ({ summaryLabel, tempo, source, engine, legacyWorkspace }: RhythmToolUIProps) => (
  <div className="space-y-6">
    <section aria-labelledby="rhythm-engine-section" className="space-y-4">
      <header className="space-y-2">
        <h2 id="rhythm-engine-section" className="text-2xl font-semibold text-foreground">
          Unified Rhythm Engine
        </h2>
        <p className="text-sm text-muted-foreground">
          Current rhythm: {summaryLabel}. Shared tempo: {tempo} BPM.
        </p>
        <p className="text-xs text-muted-foreground">Source thread: {source}</p>
      </header>
      {engine}
    </section>

    <article className="space-y-4 rounded-[1.5rem] border border-border/70 bg-card/60 p-5">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Classic Groove Workspace</h2>
        <p className="text-sm text-muted-foreground">
          The original drum-machine editor remains available inside the new route structure so legacy workflows stay intact.
        </p>
      </header>
      {legacyWorkspace}
    </article>
  </div>
);

export default RhythmToolUI;
