import type { ReactNode } from "react";

/**
 * The labelled section a tool page's body sits in.
 *
 * Harmony, Circle and Tonnetz each had their own ToolUI.tsx holding the same
 * eleven lines — a <section> with an aria-labelledby pointing at an <h2>, a
 * muted paragraph under it, then the tool itself. Only the id, the heading and
 * the sentence differed, and the prop carrying the child was called
 * `workspace` in one and `tool` in the other two for no reason.
 *
 * Rhythm's is genuinely different — four props, an extra wrapper, and a live
 * "Current rhythm / Shared tempo / Source" readout — so it keeps its own file.
 * Three of four was the real duplication, not four of four.
 */
const ToolSection = ({
  id,
  heading,
  blurb,
  children,
}: {
  /** Anchors aria-labelledby to the heading; keep it unique per route. */
  id: string;
  heading: string;
  blurb: string;
  children: ReactNode;
}) => (
  <section aria-labelledby={id} className="space-y-4">
    <header className="space-y-2">
      <h2 id={id} className="text-2xl font-semibold text-foreground">
        {heading}
      </h2>
      <p className="text-sm text-muted-foreground">{blurb}</p>
    </header>
    {children}
  </section>
);

export default ToolSection;
