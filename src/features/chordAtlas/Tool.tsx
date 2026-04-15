import { useMemo, useState, useCallback, lazy, Suspense } from "react";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import { useToolPerformance } from "@/hooks/useToolPerformance";

import { chordAtlasToolMeta } from "./toolData";
import { useTool } from "./useTool";
import ChordAtlasToolUI from "./ToolUI";
import ControlPanel from "./ControlPanel";
import ChordGrid from "./ChordGrid";
import ChordDetail from "./ChordDetail";
import ChordFretboard from "./ChordFretboard";
import { generateChordAtlas, filterChords, type ChordFilterCategory } from "./chordEngine";

const ImprovPanel = lazy(() => import("./ImprovPanel"));

const ChordAtlasTool = () => {
  useToolPerformance("chord-atlas-route");
  const tool = useTool();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState<ChordFilterCategory>("all");
  const [mode, setMode] = useState<"atlas" | "improv">("atlas");
  const [improvChordHighlight, setImprovChordHighlight] = useState<string[] | null>(null);

  const allChords = useMemo(
    () => generateChordAtlas(tool.key, tool.mode),
    [tool.key, tool.mode]
  );

  const filteredChords = useMemo(
    () => filterChords(allChords, filter),
    [allChords, filter]
  );

  const selectedChord = selectedIndex !== null ? filteredChords[selectedIndex] ?? null : null;

  // For fretboard: use improv highlight if in improv mode, else selected chord
  const fretboardChordFilter = mode === "improv" && improvChordHighlight
    ? improvChordHighlight
    : selectedChord?.notes ?? null;

  const handleSelect = useCallback((i: number) => {
    setSelectedIndex((prev) => (prev === i ? null : i));
  }, []);

  const handleFilterChange = useCallback((f: ChordFilterCategory) => {
    setFilter(f);
    setSelectedIndex(null);
  }, []);

  return (
    <ToolPageLayout
      meta={chordAtlasToolMeta}
      eyebrow="Chord Atlas"
      title="Chord Atlas"
      description="Navigate every chord in any key. See harmonic functions, voicings, and interval colors mapped to the guitar neck."
      summary={
        <div className="space-y-3">
          <p>
            Exploring chords in <strong className="text-foreground">{tool.key} {tool.mode}</strong> at{" "}
            <strong className="text-foreground">{tool.tempo} BPM</strong>.
            {mode === "improv"
              ? " Improvisation engine active — hover chords in the solo map to see scale overlays on the fretboard."
              : " Select any chord to see its voicings, intervals, substitutions, and fretboard mapping."}
          </p>
        </div>
      }
    >
      {/* Mode Toggle */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => setMode("atlas")}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            mode === "atlas"
              ? "border-primary/30 bg-primary/10 text-foreground"
              : "border-border bg-card/70 text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          Chord Atlas
        </button>
        <button
          onClick={() => setMode("improv")}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            mode === "improv"
              ? "border-primary/30 bg-primary/10 text-foreground"
              : "border-border bg-card/70 text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          Improvisation Engine
        </button>
      </div>

      {mode === "atlas" ? (
        <ChordAtlasToolUI
          controls={
            <ControlPanel
              rootKey={tool.key}
              mode={tool.mode}
              filter={filter}
              onKeyChange={tool.setKey}
              onModeChange={tool.setMode}
              onFilterChange={handleFilterChange}
            />
          }
          chordGrid={
            <>
              <ChordGrid
                chords={filteredChords}
                selectedIndex={selectedIndex}
                onSelect={handleSelect}
              />
              <ChordFretboard
                rootKey={tool.key}
                mode={tool.mode}
                selectedChord={selectedChord}
                overrideChordFilter={null}
              />
            </>
          }
          detail={<ChordDetail chord={selectedChord} />}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <Suspense fallback={<div className="text-sm text-muted-foreground p-4">Loading improvisation engine…</div>}>
              <ImprovPanel
                atlasChords={allChords}
                rootKey={tool.key}
                mode={tool.mode}
                tempo={tool.tempo}
                onChordHighlight={setImprovChordHighlight}
              />
            </Suspense>
            <ChordFretboard
              rootKey={tool.key}
              mode={tool.mode}
              selectedChord={null}
              overrideChordFilter={improvChordHighlight}
            />
          </div>
          <aside className="space-y-4 rounded-xl border border-border/70 bg-card/70 p-4">
            <ControlPanel
              rootKey={tool.key}
              mode={tool.mode}
              filter={filter}
              onKeyChange={tool.setKey}
              onModeChange={tool.setMode}
              onFilterChange={handleFilterChange}
            />
          </aside>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default ChordAtlasTool;
