import { lazy, Suspense, useCallback } from "react";

import ToolPageLayout from "@/components/tools/ToolPageLayout";
import type { Region } from "@/components/DrumMachine/rhythmData";
import { useToolPerformance } from "@/hooks/useToolPerformance";

import { rhythmToolMeta } from "./toolData";
import { useTool } from "./useTool";
import RhythmToolUI from "./ToolUI";

const GlobalRhythmEngine = lazy(() => import("@/components/Blipblox/GlobalRhythmEngine"));
const DrumMachine = lazy(() => import("@/components/DrumMachine"));

const loadingCard = (
  <div className="rounded-[1.5rem] border border-border/70 bg-card/60 p-5 text-sm text-muted-foreground">
    Loading tool workspace…
  </div>
);

const RhythmTool = () => {
  useToolPerformance("rhythm-route");
  const tool = useTool();
  const handleRhythmChange = useCallback(
    (next: { rhythmId: string; region: string }) => {
      tool.setRhythm(next.rhythmId, next.region);
    },
    [tool.setRhythm],
  );

  return (
    <ToolPageLayout
      meta={rhythmToolMeta}
      eyebrow="Rhythm"
      title="Rhythm Engine"
      description="A rhythm workspace that keeps the atlas, browser, tempo, and playback in sync."
      summary={
        <div className="space-y-3">
          <p>
            The rhythm browser, map, sequencer, and playback all work from the same groove.
            The active rhythm is <strong className="text-foreground">{tool.summaryLabel}</strong> at{" "}
            <strong className="text-foreground">{tool.tempo} BPM</strong>.
          </p>
          <p>
            Choose a rhythm anywhere — the browser, the map, the sequencer — and every view follows, so you are always hearing and seeing the same groove.
          </p>
        </div>
      }
    >
      <RhythmToolUI
        summaryLabel={tool.summaryLabel}
        tempo={tool.tempo}
        source={tool.canonicalSource}
        engine={
          <Suspense fallback={loadingCard}>
            <GlobalRhythmEngine
              tempo={tool.tempo}
              playing={tool.playing}
              selectedRegion={tool.region}
              selectedRhythmId={tool.rhythmId}
              onTempoChange={tool.setTempo}
              onPlayingChange={tool.setPlaying}
              onRegionChange={tool.setRegion}
              onRhythmChange={handleRhythmChange}
            />
          </Suspense>
        }
        legacyWorkspace={
          <Suspense fallback={loadingCard}>
            <DrumMachine
              tempo={tool.tempo}
              playing={tool.playing}
              selectedRegion={tool.region as Region}
              selectedRhythmId={tool.rhythmId}
              onTempoChange={tool.setTempo}
              onPlayingChange={tool.setPlaying}
              onRegionChange={tool.setRegion}
              onRhythmChange={handleRhythmChange}
            />
          </Suspense>
        }
      />
    </ToolPageLayout>
  );
};

export default RhythmTool;
