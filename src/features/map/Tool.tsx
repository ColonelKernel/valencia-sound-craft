import { lazy, Suspense, useCallback } from "react";

import ToolPageLayout from "@/components/tools/ToolPageLayout";
import { useToolPerformance } from "@/hooks/useToolPerformance";
import { useLanguage } from "@/i18n/site";

import { mapToolMeta } from "./toolData";
import { useTool } from "./useTool";
import MapToolUI from "./ToolUI";

const GlobalRhythmEngine = lazy(() => import("@/components/Blipblox/GlobalRhythmEngine"));

const MapTool = () => {
  const { t } = useLanguage();
  useToolPerformance("map-route");
  const tool = useTool();
  const handleRhythmChange = useCallback(
    (next: { rhythmId: string; region: string }) => {
      tool.setRhythm(next.rhythmId, next.region);
    },
    [tool.setRhythm],
  );

  return (
    <ToolPageLayout
      meta={mapToolMeta}
      eyebrow={t("tools.map.eyebrow")}
      title={t("tools.map.title")}
      description={t("tools.map.routeDescription")}
      summary={
        <div className="space-y-3">
          <p>
            {t("tools.map.summary1")}
          </p>
          <p>
            {t("tools.map.summary2Prefix")} <strong className="text-foreground">{tool.region}</strong>, {t("tools.map.summary2Suffix")}
          </p>
        </div>
      }
    >
      <MapToolUI
        engine={
          <Suspense
            fallback={
              <div className="rounded-[1.5rem] border border-border/70 bg-card/60 p-5 text-sm text-muted-foreground">
                {t("tools.map.loading")}
              </div>
            }
          >
            <GlobalRhythmEngine
              tempo={tool.tempo}
              playing={tool.playing}
              selectedRegion={tool.region as any}
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
