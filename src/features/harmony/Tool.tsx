import ModeVisualizer from "@/components/ModeVisualizer";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import { useToolPerformance } from "@/hooks/useToolPerformance";
import { useLanguage } from "@/i18n/site";

import { harmonyToolMeta } from "./toolData";
import { useTool } from "./useTool";
import HarmonyToolUI from "./ToolUI";

const HarmonyTool = () => {
  const { t } = useLanguage();
  useToolPerformance("harmony-route");
  const tool = useTool();

  return (
    <ToolPageLayout
      meta={harmonyToolMeta}
      eyebrow={t("tools.harmony.label")}
      title={t("tools.harmony.title")}
      description={t("tools.harmony.routeDescription")}
      summary={
        <div className="space-y-3">
          <p>
            {t("tools.harmony.summary1")} <strong className="text-foreground">{tool.key}</strong> {tool.mode} at{" "}
            <strong className="text-foreground">{tool.tempo} BPM</strong>.
          </p>
          <p>
            {t("tools.harmony.summary2")}
          </p>
        </div>
      }
    >
      <HarmonyToolUI
        workspace={
          <ModeVisualizer
            root={tool.key}
            mode={tool.mode}
            tempo={tool.tempo}
            playing={tool.playing}
            onRootChange={tool.setKey}
            onModeChange={tool.setMode}
            onTempoChange={tool.setTempo}
            onPlayingChange={tool.setPlaying}
            chordProgression={tool.chordProgression}
            onChordProgressionChange={tool.setChordProgression}
            initialTab="visualizer"
            showOnlyTabs={["visualizer", "progression", "metronome", "reference"]}
            hideShellHeading
            hideToolSelector
            disableToolPreload
          />
        }
      />
    </ToolPageLayout>
  );
};

export default HarmonyTool;
