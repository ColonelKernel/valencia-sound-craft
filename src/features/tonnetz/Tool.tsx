import ToolPageLayout from "@/components/tools/ToolPageLayout";
import Tonnetz from "@/components/ModeVisualizer/Tonnetz";
import { useToolPerformance } from "@/hooks/useToolPerformance";

import { tonnetzToolMeta } from "./toolData";
import { useTool } from "./useTool";
import TonnetzToolUI from "./ToolUI";

const TonnetzTool = () => {
  useToolPerformance("tonnetz-route");
  const tool = useTool();

  return (
    <ToolPageLayout
      meta={tonnetzToolMeta}
      eyebrow="Harmony"
      title="Tonnetz"
      description="Navigate harmonic space with the same key, tempo, and playback as the rest of the tools."
      summary={
        <div className="space-y-3">
          <p>
            The Tonnetz is currently aligned to <strong className="text-foreground">{tool.key}</strong> {tool.mode} at{" "}
            <strong className="text-foreground">{tool.tempo} BPM</strong>.
          </p>
          <p>
            Tempo and playback stay locked to the rhythm and harmony tools, so the Tonnetz always plays in time with everything else.
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

