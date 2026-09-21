import { Link } from "react-router-dom";

import { cardClasses } from "@/components/ui/card";
import { ROUTE_META } from "@/app/routeMeta";

/**
 * The method, on the page that uses it.
 *
 * This route carried seven chart tabs, about eighty words of prose, and no
 * outward link of any kind — including to its own case study,
 * which was reachable only from /projects. A reader arriving from the
 * homepage could see every number the dashboard produces and nothing about
 * how any of them is computed, or that the underlying figures are not
 * streams at all.
 *
 * Every threshold quoted here is asserted in src/lib/catalogAnalytics.test.ts,
 * so this copy cannot drift from the code while the suite passes.
 */
const HowThisWorks = () => (
  <section className="border-t border-border/70 bg-secondary/20 py-12">
    <div className="container mx-auto">
      <article className={cardClasses({ padding: "md" }, "max-w-3xl")}>
        <h2 className="text-xl font-semibold text-foreground">How this works</h2>
        <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
          <p>
            These are not streams. The dataset carries a <em>popularity</em> integer per
            track, multiplied by a million so the axes read like streams, and bucketed by
            album release month — so the time axis is a release timeline, not a listening
            one.
          </p>
          <p>
            Three rules shape what you see. Sparse final buckets are dropped below half the
            median of the preceding six, because the latest release month is usually
            incomplete. The acquisition score is four fixed weights — growth 0.30, stability
            0.30, longevity 0.20, momentum 0.20 — cut at 80, 60 and 40; they are not fitted,
            because this dataset records no realized catalog sales to fit against. The
            forecast band is 1.96 · SE · √(1 + 1/n), which does not widen with the horizon,
            so it is too narrow exactly where you would lean on it hardest.
          </p>
          <p>
            Each of those has a cost, and the case study argues them properly rather than
            asking you to take the numbers on trust.
          </p>
        </div>

        <Link
          to={ROUTE_META.catalogIntelligence.path}
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground underline underline-offset-4 hover:text-primary"
        >
          Read the full case study
        </Link>
      </article>
    </div>
  </section>
);

export default HowThisWorks;
