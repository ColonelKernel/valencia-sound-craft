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
      description="A direct harmonic-space route with shared key, tempo, and transport state."
      summary={
        <div className="space-y-3">
          <p>
            The Tonnetz is currently aligned to <strong className="text-foreground">{tool.key}</strong> {tool.mode} at{" "}
            <strong className="text-foreground">{tool.tempo} BPM</strong>.
          </p>
          <p>
            Shared tempo and transport let Tonnetz playback cooperate with the rhythm and harmony routes instead of running as an isolated subsystem.
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

