import { useMemo, useState, useCallback, useRef, lazy, Suspense } from "react";
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
import TransitionPanel from "./TransitionPanel";
import LearningMode from "./LearningMode";
import ModeNavigator from "./ModeNavigator";

const ImprovPanel = lazy(() => import("./ImprovPanel"));

const ChordAtlasTool = () => {
  useToolPerformance("chord-atlas-route");
  const tool = useTool();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState<ChordFilterCategory>("all");
  const [mode, setMode] = useState<"atlas" | "hand" | "improv" | "navigator">("atlas");
  const [navigatorChordHighlight, setNavigatorChordHighlight] = useState<string[] | null>(null);
  const [improvChordHighlight, setImprovChordHighlight] = useState<string[] | null>(null);

  const [showFingers, setShowFingers] = useState(false);
  const [positionSystem, setPositionSystem] = useState<PositionSystemType>("caged");
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [stayInPosition, setStayInPosition] = useState(false);
  const prevChordRef = useRef<typeof selectedChord>(null);
  const [learningNotes, setLearningNotes] = useState<string[] | null>(null);
  const [learningActive, setLearningActive] = useState(false);
  const isHandMode = mode === "hand";
  const handMappingEnabled = isHandMode || showFingers;

  const allChords = useMemo(
    () => generateChordAtlas(tool.key, tool.mode),
    [tool.key, tool.mode]
  );

  const filteredChords = useMemo(
    () => filterChords(allChords, filter),
    [allChords, filter]
  );

  const selectedChord = selectedIndex !== null ? filteredChords[selectedIndex] ?? null : null;

  const availableZones = useMemo(
    () => getPositionZones(positionSystem, tool.key),
    [positionSystem, tool.key]
  );

  const activeZone = useMemo(() => {
    if (activeZoneId) {
      return availableZones.find((z) => z.id === activeZoneId) ?? null;
    }

    if (isHandMode) {
      return availableZones[0] ?? null;
    }

    return null;
  }, [activeZoneId, availableZones, isHandMode]);

  const handleSelect = useCallback((i: number) => {
    setSelectedIndex((prev) => {
      // Track previous chord for transition analysis
      if (prev !== null && prev !== i) {
        prevChordRef.current = filteredChords[prev] ?? null;
      }
      return prev === i ? null : i;
    });
  }, [filteredChords]);

  const handleFilterChange = useCallback((f: ChordFilterCategory) => {
    setFilter(f);
    setSelectedIndex(null);
  }, []);

  const handleModeChange = useCallback((nextMode: "atlas" | "hand" | "improv" | "navigator") => {
    setMode(nextMode);

    if (nextMode === "hand") {
      setShowFingers(true);
      setStayInPosition(true);
      setActiveZoneId((prev) => prev ?? getPositionZones(positionSystem, tool.key)[0]?.id ?? null);
    }
    if (nextMode === "navigator") {
      setShowFingers(true);
      setStayInPosition(true);
    }
  }, [positionSystem, tool.key]);

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
      forceHandMode={isHandMode}
    />
  );

  const prevChord = prevChordRef.current;

  const handleLearningNotesChange = useCallback((notes: string[] | null) => {
    setLearningNotes(notes);
  }, []);

  const handMappingDetail = (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Biomechanical layer</p>
        <h3 className="mt-1 text-2xl font-bold text-foreground">Hand Mapping Engine</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Finger numbers, active position zones, and stay-in-position guidance are now active.
        </p>
      </div>

      {/* Learning Mode toggle */}
      {selectedChord && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={learningActive}
            onChange={(e) => {
              setLearningActive(e.target.checked);
              if (!e.target.checked) setLearningNotes(null);
            }}
            className="rounded border-border accent-primary"
          />
          <span className="text-xs font-medium text-foreground">📖 Learning Mode</span>
        </label>
      )}

      {/* Learning Mode steps */}
      {learningActive && selectedChord ? (
        <LearningMode
          chord={selectedChord}
          onVisibleNotesChange={handleLearningNotesChange}
        />
      ) : null}

      {/* Transition analysis */}
      {!learningActive && prevChord && selectedChord && prevChord.name !== selectedChord.name ? (
        <TransitionPanel fromChord={prevChord} toChord={selectedChord} />
      ) : !learningActive ? (
        <div className="rounded-lg border border-border/50 bg-secondary/30 px-3 py-3 text-sm text-muted-foreground">
          {selectedChord
            ? "Select another chord to see transition analysis, or enable Learning Mode above."
            : "Pick a chord to start. Enable Learning Mode for step-by-step finger placement."}
        </div>
      ) : null}

      {selectedChord && !learningActive ? <ChordDetail chord={selectedChord} /> : null}
    </div>
  );

  return (
    <ToolPageLayout
      meta={chordAtlasToolMeta}
      eyebrow="Chord Atlas"
      title="Chord Atlas"
      description="Navigate every chord in any key. See harmonic functions, voicings, interval colors, and hand-position intelligence mapped to the guitar neck."
      summary={
        <div className="space-y-3">
          <p>
            Exploring chords in <strong className="text-foreground">{tool.key} {tool.mode}</strong> at <strong className="text-foreground">{tool.tempo} BPM</strong>.
            {isHandMode
              ? " Hand Mapping Engine active — finger assignments and position zones are locked on."
              : mode === "improv"
                ? " Improvisation engine active."
                : " Select any chord to see voicings, intervals, and fretboard mapping."}
          </p>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => handleModeChange("atlas")}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            mode === "atlas"
              ? "border-primary/30 bg-primary/10 text-foreground"
              : "border-border bg-card/70 text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          Chord Atlas
        </button>
        <button
          onClick={() => handleModeChange("hand")}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            mode === "hand"
              ? "border-primary/30 bg-primary/10 text-foreground"
              : "border-border bg-card/70 text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          Hand Mapping Engine
        </button>
        <button
          onClick={() => handleModeChange("improv")}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            mode === "improv"
              ? "border-primary/30 bg-primary/10 text-foreground"
              : "border-border bg-card/70 text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          Improvisation Engine
        </button>
      </div>

      {mode !== "improv" ? (
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
                overrideChordFilter={learningActive && learningNotes ? learningNotes : null}
                showFingers={handMappingEnabled}
                activeZone={activeZone}
                stayInPosition={stayInPosition || isHandMode}
              />
            </>
          }
          detail={isHandMode ? handMappingDetail : <ChordDetail chord={selectedChord} />}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading improvisation engine…</div>}>
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
              showFingers={handMappingEnabled}
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
