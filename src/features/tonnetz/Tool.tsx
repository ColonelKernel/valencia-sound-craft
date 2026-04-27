import ToolPageLayout from "@/components/tools/ToolPageLayout";
import Tonnetz from "@/components/ModeVisualizer/Tonnetz";
import { useToolPerformance } from "@/hooks/useToolPerformance";
import { useLanguage } from "@/i18n/site";

import { tonnetzToolMeta } from "./toolData";
import { useTool } from "./useTool";
import TonnetzToolUI from "./ToolUI";

const TonnetzTool = () => {
  const { t } = useLanguage();
  useToolPerformance("tonnetz-route");
  const tool = useTool();

  return (
    <ToolPageLayout
      meta={tonnetzToolMeta}
      eyebrow={t("tools.harmony.label")}
      title={t("tools.tonnetz.title")}
      description={t("tools.tonnetz.routeDescription")}
      summary={
        <div className="space-y-3">
          <p>
            {t("tools.tonnetz.summary1Prefix")} <strong className="text-foreground">{tool.key}</strong> {tool.mode} at{" "}
            <strong className="text-foreground">{tool.tempo} BPM</strong>.
          </p>
          <p>
            {t("tools.tonnetz.summary2")}
          </p>
        </div>
      }
    >
      <TonnetzToolUI
        tool={
          <Tonnetz
            scaleNotes={tool.scaleNotes}
            root={tool.key}
            tempo={tool.tempo}
            playing={tool.playing}
            onTempoChange={tool.setTempo}
            onPlayingChange={tool.setPlaying}
          />
        }
      />
    </ToolPageLayout>
  );
};

export default TonnetzTool;
