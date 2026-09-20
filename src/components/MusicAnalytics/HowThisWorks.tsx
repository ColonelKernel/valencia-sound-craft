import { Link } from "react-router-dom";

import { cardClasses } from "@/components/ui/card";
import { ROUTE_META } from "@/app/routeMeta";

/**
 * The method, on the page that uses it.
 *
 * This route carried seven chart tabs, about eighty words of prose, and no
 * outward link of any kind — including to its own 2,300-word case study,
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
            The underlying figures are not streams. The dataset is the public 2020
            TidyTuesday Spotify sample, which carries a <em>popularity</em> integer per
            track; the service multiplies it by a million so the axes read like streams.
            Rows are then bucketed by album release month, which means the time axis is a
            release timeline rather than a listening one. Every statement on this page is
            about how a catalog's releases are distributed — not about how anyone listened.
          </p>
          <p>
            Because buckets follow release dates, the most recent one is usually a partial
            month, and month-over-month growth read that as a collapse for nearly every
            artist. The filter is a stated rule rather than a tuned constant: drop the final
            bucket when it falls below half the median of the preceding six. Median rather
            than mean, because the thing being guarded against is an outlier and a mean that
            includes the outlier is partly defined by it. The cost is real and worth naming —
            in a flat catalog the rule cannot tell a genuine collapse from an incomplete
            month, so declines past that point are suppressed rather than reported.
          </p>
          <p>
            The acquisition score is four normalized components under fixed weights: growth
            0.30, stability 0.30, longevity 0.20, momentum 0.20, cut at 80, 60 and 40 into
            Strong Acquisition, Promising, Hold and High Risk. Those weights are not fitted,
            and they cannot be — this dataset records no realized catalog sales, so there is
            no label to regress against. They encode an opinion about what matters when
            buying a catalog. The honest description of the output is a structured,
            reproducible prior, which is why the four components are always shown beside the
            score: a single number asks to be trusted, a breakdown invites you to disagree
            with a specific weight.
          </p>
          <p>
            The forecast band is drawn at 1.96 · SE · √(1 + 1/n), which carries no dependence
            on how far ahead the point is — so it is the same width twelve months out as one,
            where a real prediction interval would widen. It is too narrow exactly where a
            reader would lean on it hardest. The case study explains the correction and why
            it is stated here instead of quietly shipped.
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
