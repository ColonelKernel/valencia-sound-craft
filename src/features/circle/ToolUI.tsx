import { type ReactNode } from "react";

interface CircleToolUIProps {
  tool: ReactNode;
}

const CircleToolUI = ({ tool }: CircleToolUIProps) => (
  <section aria-labelledby="circle-tool-section" className="space-y-4">
    <header className="space-y-2">
      <h2 id="circle-tool-section" className="text-2xl font-semibold text-foreground">
        Shared Harmonic Center
      </h2>
      <p className="text-sm text-muted-foreground">
        Selecting a key here updates the harmony route and Tonnetz immediately through the global music store.
      </p>
    </header>
    {tool}
  </section>
);

export default CircleToolUI;

