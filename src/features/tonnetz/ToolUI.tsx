import { type ReactNode } from "react";

interface TonnetzToolUIProps {
  tool: ReactNode;
}

const TonnetzToolUI = ({ tool }: TonnetzToolUIProps) => (
  <section aria-labelledby="tonnetz-tool-section" className="space-y-4">
    <header className="space-y-2">
      <h2 id="tonnetz-tool-section" className="text-2xl font-semibold text-foreground">
        Harmonic Space
      </h2>
      <p className="text-sm text-muted-foreground">
        Tonnetz transformations now follow the shared tonal center and transport timing used across the rest of the tool suite.
      </p>
    </header>
    {tool}
  </section>
);

export default TonnetzToolUI;

