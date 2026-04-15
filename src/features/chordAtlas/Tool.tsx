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
import { getPositionZones, type PositionSystemType } from "./positionEngine";

const ImprovPanel = lazy(() => import("./ImprovPanel"));

const ChordAtlasTool = () => {
  useToolPerformance("chord-atlas-route");
  const tool = useTool();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState<ChordFilterCategory>("all");
  const [mode, setMode] = useState<"atlas" | "improv">("atlas");
  const [improvChordHighlight, setImprovChordHighlight] = useState<string[] | null>(null);

  // Biomechanical state
  const [showFingers, setShowFingers] = useState(false);
  const [positionSystem, setPositionSystem] = useState<PositionSystemType>("caged");
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [stayInPosition, setStayInPosition] = useState(false);

  const allChords = useMemo(
    () => generateChordAtlas(tool.key, tool.mode),
    [tool.key, tool.mode]
  );

  const filteredChords = useMemo(
    () => filterChords(allChords, filter),
    [allChords, filter]
  );

  const selectedChord = selectedIndex !== null ? filteredChords[selectedIndex] ?? null : null;

  // Resolve active zone object
  const activeZone = useMemo(() => {
    if (!activeZoneId) return null;
    const zones = getPositionZones(positionSystem, tool.key);
    return zones.find((z) => z.id === activeZoneId) ?? null;
  }, [activeZoneId, positionSystem, tool.key]);

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

  const controlPanel = (
    <ControlPanel
      rootKey={tool.key}
      mode={tool.mode}
      filter={filter}
      onKeyChange={tool.setKey}
      onModeChange={tool.setMode}
      onFilterChange={handleFilterChange}
      showFingers={showFingers}
      onShowFingersChange={setShowFingers}
      positionSystem={positionSystem}
      onPositionSystemChange={setPositionSystem}
      activeZoneId={activeZoneId}
      onActiveZoneChange={setActiveZoneId}
      stayInPosition={stayInPosition}
      onStayInPositionChange={setStayInPosition}
    />
  );

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
            {showFingers && activeZone
              ? ` Hand position: ${activeZone.label} (frets ${activeZone.startFret}–${activeZone.endFret}).`
              : ""}
            {mode === "improv"
              ? " Improvisation engine active."
              : " Select any chord to see voicings, intervals, and fretboard mapping."}
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
          controls={controlPanel}
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
                showFingers={showFingers}
                activeZone={activeZone}
                stayInPosition={stayInPosition}
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
              showFingers={showFingers}
              activeZone={activeZone}
              stayInPosition={stayInPosition}
            />
          </div>
          <aside className="space-y-4 rounded-xl border border-border/70 bg-card/70 p-4">
            {controlPanel}
          </aside>
        </div>
      )}
    </ToolPageLayout>
  );
};

export default ChordAtlasTool;
