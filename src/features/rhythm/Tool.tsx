import { lazy, Suspense, useCallback } from "react";

import ToolPageLayout from "@/components/tools/ToolPageLayout";
import { useToolPerformance } from "@/hooks/useToolPerformance";

import { rhythmToolMeta } from "./toolData";
import { useTool } from "./useTool";
import RhythmToolUI from "./ToolUI";

const GlobalRhythmEngine = lazy(() => import("@/components/Blipblox/GlobalRhythmEngine"));

const loadingCard = (
  <div className="rounded-[1.5rem] border border-border/70 bg-card/60 p-5 text-sm text-muted-foreground">
    Loading tool workspace…
  </div>
);

const RhythmTool = () => {
  useToolPerformance("rhythm-route");
  const tool = useTool();
  // Stable for the life of the component (memoized on the singleton store),
  // so the callback names them directly in its dependency array.
  const { setRhythm, suggestTempo } = tool;
  const handleRhythmChange = useCallback(
    (next: { rhythmId: string; region: string; suggestedTempo?: number }) => {
      setRhythm(next.rhythmId, next.region);
      // The rhythm's default tempo is a suggestion — the store ignores it
      // once the user has explicitly set a tempo anywhere.
      if (typeof next.suggestedTempo === "number") {
        suggestTempo(next.suggestedTempo);
      }
    },
    [setRhythm, suggestTempo],
  );

  return (
    <ToolPageLayout
      meta={rhythmToolMeta}
      eyebrow="Rhythm"
      title="Rhythm Engine"
      description="A rhythm workspace that keeps the atlas, browser, tempo, and playback in sync."
      summary={
        <div className="space-y-3">
          <p>
            The rhythm browser, map, sequencer, and playback all work from the same groove.
            The active rhythm is <strong className="text-foreground">{tool.summaryLabel}</strong> at{" "}
            <strong className="text-foreground">{tool.tempo} BPM</strong>.
          </p>
          <p>
            Choose a rhythm anywhere — the browser, the map, the sequencer — and every view follows, so you are always hearing and seeing the same groove.
          </p>
        </div>
      }
      engineering={
        <>
          <p>
            The sequencer does not schedule notes with{" "}
            <code className="rounded bg-secondary/60 px-1.5 py-0.5 text-xs">setTimeout</code>. A
            timer wakes every 25&nbsp;ms and queues every step that falls inside the next
            100&nbsp;ms, stamping each one with a time taken from the{" "}
            <code className="rounded bg-secondary/60 px-1.5 py-0.5 text-xs">AudioContext</code>{" "}
            clock. The timer is allowed to be late; the audio is not. When a Blipblox is
            connected over Web MIDI the same loop also emits a 24-pulse-per-quarter MIDI clock,
            so the hardware and the browser stay on one timebase.
          </p>
          <p>
            Playback is a single-owner lock rather than a boolean. Asking to play hands the
            transport to one tool and takes it from whoever held it, which is why opening the
            harmony lab mid-groove stops the groove instead of layering two clocks on top of
            each other. The exclusivity is asserted in the unit suite, not left to convention.
          </p>
        </>
      }
    >
      <RhythmToolUI
        summaryLabel={tool.summaryLabel}
        tempo={tool.tempo}
        source={tool.canonicalSource}
        engine={
          <Suspense fallback={loadingCard}>
            <GlobalRhythmEngine
              tempo={tool.tempo}
              playing={tool.playing}
              selectedRegion={tool.region}
              selectedRhythmId={tool.rhythmId}
              onTempoChange={tool.setTempo}
              onPlayingChange={tool.setPlaying}
              onRegionChange={tool.setRegion}
              onRhythmChange={handleRhythmChange}
            />
          </Suspense>
        }
      />
    </ToolPageLayout>
  );
};

export default RhythmTool;
