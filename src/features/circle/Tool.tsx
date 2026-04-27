import ToolPageLayout from "@/components/tools/ToolPageLayout";
import CircleOfFifths from "@/components/ModeVisualizer/CircleOfFifths";
import { useToolPerformance } from "@/hooks/useToolPerformance";
import { useLanguage } from "@/i18n/site";

import { circleToolMeta } from "./toolData";
import { useTool } from "./useTool";
import CircleToolUI from "./ToolUI";

const CircleTool = () => {
  const { t } = useLanguage();
  useToolPerformance("circle-route");
  const tool = useTool();

  return (
    <ToolPageLayout
      meta={circleToolMeta}
      eyebrow={t("tools.harmony.label")}
      title={t("tools.circle.title")}
      description={t("tools.circle.routeDescription")}
      summary={
        <div className="space-y-3">
          <p>
            {t("tools.circle.summary1Prefix")} <strong className="text-foreground">{tool.key}</strong> {t("tools.circle.summary1In")}{" "}
            <strong className="text-foreground">{tool.mode}</strong>.
          </p>
          <p>
            {t("tools.circle.summary2")}
          </p>
        </div>
      }
    >
      <CircleToolUI
        tool={
          <CircleOfFifths
            scaleNotes={tool.scaleNotes}
            root={tool.key}
            onSelectKey={(nextKey, nextMode) => {
              tool.setKey(nextKey);
              tool.setMode(nextMode);
            }}
          />
        }
      />
    </ToolPageLayout>
  );
};

export default CircleTool;
