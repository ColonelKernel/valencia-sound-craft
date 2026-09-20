import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { ROUTE_META } from "@/app/routeMeta";

/**
 * The end of a case study, which until now was mostly a wall.
 *
 * Three of the four case studies ran out with their last link in the header —
 * Transit at line 55 of 424, Session-State at 52 of 272, Catalog at 68 of 283.
 * A reader who got through four hundred lines of method had no next move but
 * the back button, on the one page where they had just finished demonstrating
 * interest. AutoHarm alone closed with "Back to projects"; this generalizes
 * that pattern rather than inventing a second one, and adds the two
 * destinations that were missing: the next case study, and the CV.
 *
 * The order is fixed and the "next" wraps, so every study points at another
 * one and none is a terminus.
 */
const ORDER = ["autoharm", "catalogIntelligence", "transitAtlas", "sessionState"] as const;

export type CaseStudySlug = (typeof ORDER)[number];

/** Short labels; ROUTE_META titles carry "| Zach Scheffler" and the words "Case Study". */
const SHORT_TITLE: Record<CaseStudySlug, string> = {
  autoharm: "AutoHarm",
  catalogIntelligence: "Music Catalog Intelligence",
  transitAtlas: "World Transit Atlas",
  sessionState: "Session-State Analyzer",
};

const CaseStudyFooter = ({ current }: { current: CaseStudySlug }) => {
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];

  return (
    <div className="fade-up mt-14 border-t border-border/70 pt-8">
      <Link
        to={ROUTE_META[next].path}
        className="group flex flex-col gap-1 text-sm no-underline"
      >
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          Next case study
        </span>
        <span className="inline-flex items-center gap-2 font-display text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
          {SHORT_TITLE[next]}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
        <Link
          to={ROUTE_META.projects.path}
          className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} /> All projects
        </Link>
        <Link to={ROUTE_META.cv.path} className="transition-colors hover:text-foreground">
          CV
        </Link>
        <a href="/#contact" className="transition-colors hover:text-foreground">
          Get in touch
        </a>
      </div>
    </div>
  );
};

export default CaseStudyFooter;
