import { lazy, Suspense, useCallback } from "react";

import ToolPageLayout from "@/components/tools/ToolPageLayout";
import { useToolPerformance } from "@/hooks/useToolPerformance";
import { useLanguage } from "@/i18n/site";

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
  const { t } = useLanguage();
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
      eyebrow={t("tools.rhythm.label")}
      title={t("tools.rhythm.title")}
      description={t("tools.rhythm.routeDescription")}
      summary={
        <div className="space-y-3">
          <p>
            {t("tools.rhythm.summary1")} {t("tools.rhythm.activePrefix")} <strong className="text-foreground">{tool.summaryLabel}</strong> {t("tools.rhythm.at")}{" "}
            <strong className="text-foreground">{tool.tempo} BPM</strong>.
          </p>
          <p>
            {t("tools.rhythm.summary2")}
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
              selectedRegion={tool.region as any}
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

export default RhythmTool;
