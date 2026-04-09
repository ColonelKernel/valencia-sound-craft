import { lazy, Suspense } from "react";

import ToolPageLayout from "@/components/tools/ToolPageLayout";
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

  return (
    <ToolPageLayout
      meta={rhythmToolMeta}
      eyebrow="Rhythm"
      title="Rhythm Engine"
      description="A routed, shared-state rhythm workspace that keeps the atlas, browser, tempo, and transport in sync."
      summary={
        <div className="space-y-3">
          <p>
            This route keeps the rhythm browser, map selection, sequencer, and playback transport on one shared state model.
            The active rhythm is <strong className="text-foreground">{tool.summaryLabel}</strong> at{" "}
            <strong className="text-foreground">{tool.tempo} BPM</strong>.
          </p>
          <p>
            Rhythm selection updates the global region and rhythm identifiers directly, so the map and sequencer describe the same musical object instead of competing states.
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
              selectedRegion={tool.region as RhythmBrowserRegion | "All"}
              selectedRhythmId={tool.rhythmId}
              onTempoChange={tool.setTempo}
              onPlayingChange={tool.setPlaying}
              onRegionChange={tool.setRegion}
              onRhythmChange={(next) => {
                tool.setRhythm(next.rhythmId, next.region);
              }}
            />
          </Suspense>
        }
        legacyWorkspace={
          <Suspense fallback={loadingCard}>
            <DrumMachine
              tempo={tool.tempo}
              playing={tool.playing}
              selectedRegion={tool.region}
              selectedRhythmId={tool.rhythmId}
              onTempoChange={tool.setTempo}
              onPlayingChange={tool.setPlaying}
              onRegionChange={tool.setRegion}
              onRhythmChange={(next) => {
                tool.setRhythm(next.rhythmId, next.region);
              }}
            />
          </Suspense>
        }
      />
    </ToolPageLayout>
  );
};

export default RhythmTool;
