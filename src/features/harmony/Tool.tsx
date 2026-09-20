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
      engineering={
        <>
          <p>
            Key, mode, tempo, chord progression and transport live in one hand-written store
            read through{" "}
            <code className="rounded bg-secondary/60 px-1.5 py-0.5 text-xs">useSyncExternalStore</code>{" "}
            with a selector per subscriber, so changing the tempo does not re-render the tools
            that only care about the key. There is no state library here — the store is about
            two hundred lines, and every transition it allows is covered by a test.
          </p>
          <p>
            Two details are load-bearing. Selecting a rhythm may only <em>suggest</em> a tempo,
            and the suggestion is ignored the moment the user sets a tempo anywhere — a
            command and a hint are different events, and collapsing them is how a shared
            transport starts overwriting the user. And mode names are normalized at the
            boundary, so &ldquo;major&rdquo; and &ldquo;Ionian&rdquo; can never end up compared
            as strings and found unequal.
          </p>
        </>
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
          />
        }
      />
    </ToolPageLayout>
  );
};

export default HarmonyTool;
