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
        Tonnetz moves follow the same key and timing as the rest of the tools, so what you hear here fits what you play everywhere else.
      </p>
    </header>
    {tool}
  </section>
);

export default TonnetzToolUI;

