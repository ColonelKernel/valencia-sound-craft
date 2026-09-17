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
      engineering={
        <>
          <p>
            This page holds no key of its own. The wheel renders from the shared tonal center
            and writes back to it, which is the whole reason the harmony lab and the Tonnetz
            are already in the right key when you open them. A local copy would have been
            easier and would have started drifting the first time two tabs disagreed.
          </p>
          <p>
            Everything else on screen is derived, not stored: the key signature, the relative
            minor, the chord summary and the relationship lines between segments are all
            memoized computations over the current key. Drawing is plain SVG with hit targets
            sized for touch, so there is no charting library in the chunk.
          </p>
        </>
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

