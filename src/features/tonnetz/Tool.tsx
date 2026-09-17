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
      engineering={
        <>
          <p>
            The lattice is a 12&nbsp;&times;&nbsp;6 hex grid whose triads are related by the
            neo-Riemannian transforms — P flips a triad between major and minor, L moves it by
            a major third, R by a minor third, and S, N and H are compounds of those three.
            Each is a pure function from one triad to another, so chord suggestion is not a
            lookup table of progressions: it applies every transform to whatever you are
            currently on and labels each result by whether it stays inside the active scale.
          </p>
          <p>
            The grid animates in SVG with SMIL, and a CSS{" "}
            <code className="rounded bg-secondary/60 px-1.5 py-0.5 text-xs">
              prefers-reduced-motion
            </code>{" "}
            rule cannot reach SMIL — so the preference is read in JavaScript at mount and the
            looping animations are simply not rendered. Chords play through the shared audio
            context and, when a device is present, out over Web MIDI.
          </p>
        </>
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

