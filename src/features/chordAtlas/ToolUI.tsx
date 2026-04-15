import { type ReactNode } from "react";

interface ChordAtlasToolUIProps {
  controls: ReactNode;
  chordGrid: ReactNode;
  detail: ReactNode;
}

const ChordAtlasToolUI = ({ controls, chordGrid, detail }: ChordAtlasToolUIProps) => (
  <section aria-labelledby="chord-atlas-section" className="space-y-4">
    <div className="grid gap-4 lg:grid-cols-[280px_1fr_320px]">
      {/* Left: Controls */}
      <aside className="space-y-4 rounded-xl border border-border/70 bg-card/70 p-4">
        {controls}
      </aside>

      {/* Center: Chord Grid + Fretboard */}
      <div className="space-y-4">{chordGrid}</div>

      {/* Right: Detail Panel */}
      <aside className="space-y-4 rounded-xl border border-border/70 bg-card/70 p-4">
        {detail}
      </aside>
    </div>
  </section>
);

export default ChordAtlasToolUI;
