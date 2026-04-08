import { lazy, Suspense } from "react";

import ToolPageLayout from "@/components/tools/ToolPageLayout";
import { useToolPerformance } from "@/hooks/useToolPerformance";

import { mapToolMeta } from "./toolData";
import { useTool } from "./useTool";
import MapToolUI from "./ToolUI";

const GlobalRhythmEngine = lazy(() => import("@/components/Blipblox/GlobalRhythmEngine"));

const MapTool = () => {
  useToolPerformance("map-route");
  const tool = useTool();

  return (
    <ToolPageLayout
      meta={mapToolMeta}
      eyebrow="Atlas"
      title="Rhythm Map"
      description="A direct URL into the atlas-first experience, backed by the same rhythm state and playback transport as the sequencer."
      summary={
        <div className="space-y-3">
          <p>
            The map route exposes readable rhythm metadata alongside the interactive atlas so search engines and musicians can both understand the current state without opening hidden controls.
          </p>
          <p>
            The selected region is <strong className="text-foreground">{tool.region}</strong>, and the active rhythm stays synchronized with the rhythm route through the shared store.
          </p>
        </div>
      }
    >
      <MapToolUI
        engine={
          <Suspense
            fallback={
              <div className="rounded-[1.5rem] border border-border/70 bg-card/60 p-5 text-sm text-muted-foreground">
                Loading atlas…
              </div>
            }
          >
            <GlobalRhythmEngine
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

export default MapTool;

