import { type ReactNode } from "react";

interface MapToolUIProps {
  engine: ReactNode;
}

const MapToolUI = ({ engine }: MapToolUIProps) => (
  <section aria-labelledby="map-tool-section" className="space-y-4">
    <header className="space-y-2">
      <h2 id="map-tool-section" className="text-2xl font-semibold text-foreground">
        Atlas-Driven Rhythm Selection
      </h2>
      <p className="text-sm text-muted-foreground">
        Pick a country on the map, filter the browser, or play the sequencer — they all follow the same rhythm.
      </p>
    </header>
    {engine}
  </section>
);

export default MapToolUI;

