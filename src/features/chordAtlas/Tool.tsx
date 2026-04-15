import { useMemo, useState, useCallback } from "react";
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

const ChordAtlasTool = () => {
  useToolPerformance("chord-atlas-route");
  const tool = useTool();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState<ChordFilterCategory>("all");

  const allChords = useMemo(
    () => generateChordAtlas(tool.key, tool.mode),
    [tool.key, tool.mode]
  );

  const filteredChords = useMemo(
    () => filterChords(allChords, filter),
    [allChords, filter]
  );

  const selectedChord = selectedIndex !== null ? filteredChords[selectedIndex] ?? null : null;

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
            Select any chord to see its voicings, intervals, substitutions, and fretboard mapping.
          </p>
        </div>
      }
    >
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
            />
          </>
        }
        detail={<ChordDetail chord={selectedChord} />}
      />
    </ToolPageLayout>
  );
};

export default ChordAtlasTool;
