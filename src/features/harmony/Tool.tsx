import ModeVisualizer from "@/components/ModeVisualizer";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import { useToolPerformance } from "@/hooks/useToolPerformance";

import { harmonyToolMeta } from "./toolData";
import { useTool } from "./useTool";
import HarmonyToolUI from "./ToolUI";

const HarmonyTool = () => {
  useToolPerformance("harmony-route");
  const tool = useTool();

  return (
    <ToolPageLayout
      meta={harmonyToolMeta}
      eyebrow="Harmony"
      title="Harmony Lab"
      description="Visualize scales, build chord progressions, and practice — always in time with the rest of the music system."
      summary={
        <div className="space-y-3">
          <p>
            The harmony workspace is centered on <strong className="text-foreground">{tool.key}</strong> {tool.mode} at{" "}
            <strong className="text-foreground">{tool.tempo} BPM</strong>.
          </p>
          <p>
            Your chord progression travels with you — open the circle of fifths or the Tonnetz and the same key and harmony are already there.
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
