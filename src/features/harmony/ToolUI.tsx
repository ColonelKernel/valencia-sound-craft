import { type ReactNode } from "react";

interface HarmonyToolUIProps {
  workspace: ReactNode;
}

const HarmonyToolUI = ({ workspace }: HarmonyToolUIProps) => (
  <section aria-labelledby="harmony-tool-section" className="space-y-4">
    <header className="space-y-2">
      <h2 id="harmony-tool-section" className="text-2xl font-semibold text-foreground">
        Shared Harmony Workspace
      </h2>
      <p className="text-sm text-muted-foreground">
        Key, mode, tempo, and transport now come from the shared store, while the existing visualizer and builders keep their established workflow.
      </p>
    </header>
    {workspace}
  </section>
);

export default HarmonyToolUI;

