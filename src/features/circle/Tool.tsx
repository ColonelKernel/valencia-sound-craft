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
      description="A dedicated harmony route that shares the current key and mode with the rest of the music system."
      summary={
        <div className="space-y-3">
          <p>
            The current shared tonal center is <strong className="text-foreground">{tool.key}</strong> in{" "}
            <strong className="text-foreground">{tool.mode}</strong>.
          </p>
          <p>
            Any key choice made in this route propagates to the harmony workspace and the Tonnetz, keeping the system musically coherent across direct links.
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

