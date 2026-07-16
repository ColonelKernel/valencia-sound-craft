import ToolPageLayout from "@/components/tools/ToolPageLayout";
import CircleOfFifths from "@/components/ModeVisualizer/CircleOfFifths";
import { useToolPerformance } from "@/hooks/useToolPerformance";

import { circleToolMeta } from "./toolData";
import { useTool } from "./useTool";
import CircleToolUI from "./ToolUI";

const CircleTool = () => {
  useToolPerformance("circle-route");
  const tool = useTool();

  return (
    <ToolPageLayout
      meta={circleToolMeta}
      eyebrow="Harmony"
      title="Circle of Fifths"
      description="Explore key relationships — the key and mode you choose here carry across the whole music system."
      summary={
        <div className="space-y-3">
          <p>
            The current shared tonal center is <strong className="text-foreground">{tool.key}</strong> in{" "}
            <strong className="text-foreground">{tool.mode}</strong>.
          </p>
          <p>
            Pick a key here and the harmony lab and Tonnetz follow along, so everything you play stays in the same musical world.
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

