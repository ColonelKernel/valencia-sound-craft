import { type ReactNode } from "react";

interface RhythmToolUIProps {
  summaryLabel: string;
  tempo: number;
  source: string;
  engine: ReactNode;
}

const RhythmToolUI = ({ summaryLabel, tempo, source, engine }: RhythmToolUIProps) => (
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
  </div>
);

export default RhythmToolUI;
