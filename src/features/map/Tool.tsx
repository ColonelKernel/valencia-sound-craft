import { lazy, Suspense, useCallback } from "react";

import ToolPageLayout from "@/components/tools/ToolPageLayout";
import { useToolPerformance } from "@/hooks/useToolPerformance";

import { mapToolMeta } from "./toolData";
import { useTool } from "./useTool";
import MapToolUI from "./ToolUI";

const GlobalRhythmEngine = lazy(() => import("@/components/Blipblox/GlobalRhythmEngine"));

const MapTool = () => {
  useToolPerformance("map-route");
  const tool = useTool();
  const regionLabel = tool.activeDefinition?.regionLabel ?? tool.region;
  const handleRhythmChange = useCallback(
    (next: { rhythmId: string; region: string }) => {
      tool.setRhythm(next.rhythmId, next.region);
    },
    [tool.setRhythm],
  );

  return (
    <ToolPageLayout
      meta={mapToolMeta}
      eyebrow="Atlas"
      title="Rhythm Map"
      description="An atlas-first view of world rhythms, playing the same groove and tempo as the sequencer."
      summary={
        <div className="space-y-3">
          <p>
            The map pairs the interactive atlas with a clear description of each rhythm, so you can see where a groove comes from and what is playing at a glance.
          </p>
          <p>
            You are exploring <strong className="text-foreground">{regionLabel}</strong>, and the rhythm you pick here follows you into the Rhythm Engine.
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
              onRhythmChange={handleRhythmChange}
            />
          </Suspense>
        }
      />
    </ToolPageLayout>
  );
};

export default MapTool;
