import type { ReactNode } from "react";

/**
 * What was found, above the spec sheet.
 *
 * All four case studies opened on an AT_A_GLANCE table — "What it is / Stack /
 * Coverage / Methods", six to eight rows of it. A skimmer learned what the
 * thing *was* and never what it *found*, which on these four pages is the
 * whole point: a regression that did not survive its own data, an interval
 * defect shipped with the defect disclosed, a 99.3% that is in-sample.
 *
 * Three lines, in order: what I did, what came back, what it cost. The glance
 * table still follows for the reader who wants the spec.
 */
const CaseStudyFinding = ({ children }: { children: ReactNode }) => (
  <div className="fade-up mb-8 border-l-2 border-primary pl-5 sm:pl-6">
    <p className="eyebrow mb-3">The finding</p>
    <div className="max-w-2xl space-y-3 text-[15px] leading-relaxed text-foreground sm:text-base">
      {children}
    </div>
  </div>
);

export default CaseStudyFinding;
