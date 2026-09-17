import { lazy, Suspense, useCallback } from "react";

import ToolPageLayout from "@/components/tools/ToolPageLayout";
import { useToolPerformance } from "@/hooks/useToolPerformance";

import { mapToolMeta } from "./toolData";
import { useTool } from "./useTool";
import MapToolUI from "./ToolUI";

const GlobalRhythmEngine = lazy(() => import("@/components/Blipblox/GlobalRhythmEngine"));

const MapTool = () => {
  useToolPerformance("map-route");
  const tool = useTool();
  const regionLabel = tool.activeDefinition?.regionLabel ?? tool.region;
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
      meta={mapToolMeta}
      eyebrow="Atlas"
      title="Rhythm Map"
      description="An atlas-first view of world rhythms, playing the same groove and tempo as the sequencer."
      summary={
        <div className="space-y-3">
          <p>
            The map pairs the interactive atlas with a clear description of each rhythm, so you can see where a groove comes from and what is playing at a glance.
          </p>
          <p>
            You are exploring <strong className="text-foreground">{regionLabel}</strong>, and the rhythm you pick here follows you into the Rhythm Engine.
          </p>
        </div>
      }
      engineering={
        <>
          <p>
            The map is Leaflet, loaded in its own chunk behind a suspense boundary, because a
            tiling library is dead weight on every route that never draws a map. Markers are
            placed from a table of 195 country centroids rather than geocoded at runtime, so
            the page makes no third-party request to render.
          </p>
          <p>
            What the map browses is a typed catalog: 50 rhythm records across 10 regions and 12
            distinct meters — 12/8 bulería, 9/8 čoček, 7/8 lesnoto, 15/8 buchimish — each
            carrying its instruments, MIDI notes, step pattern, tempo range and a provenance
            note. The shape of that data is enforced by tests, so a malformed record fails the
            build instead of rendering an empty country.
          </p>
        </>
      }
    >
      <MapToolUI
        engine={
          <Suspense
            fallback={
              <div className="rounded-[1.5rem] border border-border/70 bg-card/60 p-5 text-sm text-muted-foreground">
                Loading atlas…
              </div>
            }
          >
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

export default MapTool;
