import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import CaseStudyFooter from "@/components/CaseStudyFooter";
import RouteHead from "@/components/seo/RouteHead";
import { ROUTE_META } from "@/app/routeMeta";
import { CATALOG_INTELLIGENCE_JSONLD } from "@/app/routeStructuredData";
import { buttonClasses } from "@/components/ui/button";
import { cardClasses } from "@/components/ui/card";
import { useFadeIn } from "@/hooks/useFadeIn";

/**
 * Case study for the catalog analytics platform on /music-analytics.
 *
 * Every figure here is checked against the code it describes — the weights and
 * cut points against src/lib/catalogAnalytics.ts, the interval formula against
 * src/lib/linearRegression.ts, the dataset claims against
 * src/lib/musicDataService.ts. Nothing is rounded up, and the limitations
 * section names things that are genuinely wrong rather than things that are
 * merely unfinished.
 *
 * The dashboard keeps its own demonstration-data disclaimer. That caveat must
 * never live only here, on a page a visitor might not read.
 */

const AT_A_GLANCE: { label: string; value: string }[] = [
  { label: "What it is", value: "A catalog analytics dashboard: forecasting, risk scoring, segmentation and side-by-side comparison" },
  { label: "Data", value: "The public 2020 TidyTuesday Spotify sample — 32,833 rows, self-hosted and slimmed to the three columns actually read" },
  { label: "Methods", value: "OLS trend with a prediction band, coefficient of variation, a trailing-median robustness rule, a four-component weighted score" },
  { label: "Stack", value: "TypeScript, React, Recharts, Papa Parse — all arithmetic client-side" },
  { label: "Backend", value: "One Supabase edge function, and only for the written memo" },
  { label: "Status", value: "Demonstration dataset with modeled proxies. Not live streaming figures, and not investment advice." },
];

const CatalogIntelligenceCaseStudy = () => {
  const ref = useFadeIn();

  return (
    <div className="min-h-screen" ref={ref}>
      <RouteHead
        title={ROUTE_META.catalogIntelligence.title}
        description={ROUTE_META.catalogIntelligence.description}
        canonicalPath={ROUTE_META.catalogIntelligence.path}
        jsonLd={CATALOG_INTELLIGENCE_JSONLD}
      />

      <main className="pt-16">
        <section className="section-padding bg-background">
          <div className="container mx-auto">
            <div className="fade-up mb-10">
              <Link
                to="/projects"
                className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft size={14} /> All projects
              </Link>

              <p className="eyebrow mb-3">Case study</p>
              <h1 className="type-h1 mb-5">Music Catalog Intelligence</h1>

              <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
                A dashboard that treats a music catalog as a financial asset — forecasting
                performance, scoring acquisition risk, and comparing catalogs side by side.
                It runs entirely in the browser over a public dataset, and most of what is
                interesting about it is the decisions made where the data is weakest.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/music-analytics" className={buttonClasses({ variant: "primary" })}>
                  Open the dashboard <ArrowUpRight size={15} />
                </Link>
                <a
                  href="https://github.com/ColonelKernel/valencia-sound-craft"
                  className={buttonClasses({ variant: "secondary" })}
                >
                  Source <ArrowUpRight size={15} />
                </a>
              </div>
            </div>

            <dl className={cardClasses({ padding: "none", flush: true }, "fade-up mb-16 divide-y divide-border")}>
              {AT_A_GLANCE.map((row) => (
                <div key={row.label} className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                  <dt className="text-sm font-medium text-foreground">{row.label}</dt>
                  <dd className="text-sm leading-relaxed text-muted-foreground">{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className="fade-up max-w-2xl space-y-12">
              <div>
                <h2 className="type-h2 mb-4">What the data is, and what it is not</h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    The dataset is the public 2020 TidyTuesday Spotify sample, and it contains
                    no streams. It contains a <em>popularity</em> integer per track, which the
                    service multiplies by one million so the axes read like streams. Rows are
                    then bucketed by album release month, so the time axis is a release
                    timeline, not a listening one — every conclusion here describes how a
                    catalog's releases are distributed, not how anyone listened.
                  </p>
                  <p>
                    One fallback is worth naming because the code can manufacture a season: if
                    date parsing yields nothing usable, the service synthesizes twelve months
                    per artist under a sine factor running 0.55 to 1.15. The twelve terms
                    cancel over a full period, so a synthesized year carries 85% of the
                    artist's total rather than all of it. It fires only on a completely empty
                    aggregation, which this dataset never produces. Both figures are asserted
                    in <code className="text-xs">musicDataService.test.ts</code>.
                  </p>
                  <p>
                    The CSV is self-hosted rather than fetched from a third party at runtime,
                    slimmed to the three columns the service actually reads.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="type-h2 mb-4">The bug that shaped the metrics</h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    Because rows bucket by release month, the most recent bucket is usually
                    thin — a partial month with few tracks in it. Month-over-month growth
                    read that as a catastrophic collapse, every time, for almost every
                    artist. The first version of this dashboard confidently reported that
                    most catalogs were falling off a cliff.
                  </p>
                  <p>
                    The fix is a stated rule rather than a tuned constant: drop the final
                    bucket when its total falls below half the median of the preceding six
                    complete buckets. Median rather than mean, because the thing being
                    guarded against is an outlier, and a mean that includes the outlier is
                    partly defined by it.
                  </p>
                  <p>
                    This page used to claim the rule was conservative enough that a genuine
                    60% decline still got reported. Writing unit tests for the filter showed
                    that is not true, and the correction is worth more than the claim was.
                    The comparison is against the trailing median, not against the previous
                    month — so in a catalog that has been flat, the median <em>is</em> the
                    previous month, and anything more than 50% below it is discarded. A real
                    collapse and a partial month look identical to this rule, and it throws
                    away both.
                  </p>
                  <p>
                    What survives, then, is a decline of up to half. Past that the dashboard
                    goes quiet rather than reporting a fall it cannot distinguish from
                    missing data. Fixing it properly means separating the two cases with
                    something the dataset does not currently carry — track counts per
                    bucket, so a thin month is identifiable as thin rather than as small.
                    Until then the filter's silence is a known blind spot, and the test that
                    found it now pins the behaviour so the prose cannot drift back.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="type-h2 mb-4">Scoring a catalog is a prior, not a model</h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    The acquisition score is four normalized components combined with fixed
                    weights: growth 0.30, stability 0.30, longevity 0.20, momentum 0.20.
                    Growth is a regression slope divided by the mean, normalized over
                    −0.2 to 0.2. Stability inverts the coefficient of variation. Longevity
                    counts active months against a 1–36 window. Momentum is the last three
                    months against the historical average, normalized over 0.5 to 1.5. The
                    result is cut at 80, 60 and 40 into Strong Acquisition, Promising, Hold
                    and High Risk.
                  </p>
                  <p>
                    Those weights are not fitted. They cannot be: this dataset contains no
                    realized catalog sales, so there is no label to regress against. They
                    encode an opinion about what matters when buying a catalog, and the
                    honest description of the output is a structured, reproducible prior —
                    not a prediction.
                  </p>
                  <p>
                    That is why the interface shows the four components alongside the score.
                    A single number invites the reader to trust it; the breakdown invites
                    them to disagree with a specific weight, which is the argument I would
                    rather have.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="type-h2 mb-4">The prediction interval is wrong, and here is how</h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    The forecast draws a band at{" "}
                    <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">
                      1.96 · SE · √(1 + 1/n)
                    </code>
                    . That term has no dependence on how far ahead the point is, so the band
                    is the same width at one month out as at twelve. A real prediction
                    interval carries a leverage term — (x₀ − x̄)² / Sₓₓ — that widens it as
                    the forecast moves away from the centre of the observed data.
                  </p>
                  <p>
                    So the band is too narrow, and it is most too narrow exactly where a
                    reader is most likely to rely on it. I know the correction and it is a
                    small change; I am naming it here rather than quietly shipping a
                    confident-looking band, because a forecast that understates its own
                    uncertainty is worse than one that declines to draw a band at all.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="type-h2 mb-4">Where the language model sits</h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    One tab writes an analyst memo. It is fed the same aggregates the other
                    tabs render, so the prose cannot contradict the numbers on screen, and
                    it adds no data of its own. The response shape is pinned by the API's
                    structured-output config rather than by asking for JSON and hoping, and
                    a runtime guard validates the result before any of it reaches the DOM.
                  </p>
                  <p>
                    If the model is unavailable the page says so. It never falls back to
                    canned text dressed up as analysis — which is the failure mode that
                    would make every other number on the page untrustworthy by association.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="type-h2 mb-4">Making a hundred kilobytes of charts free</h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    Recharts is roughly 100 KB gzipped, so every tab is code-split —
                    including the one that opens first. The page already has a loading state
                    while the CSV parses, and that window hides the chart chunk's fetch, so
                    the split costs nothing a user can perceive.
                  </p>
                  <p>
                    All tabs used to stay mounted behind <code className="font-mono text-xs">display:none</code>{" "}
                    to dodge a Recharts DOM reconciliation crash. That is a workaround that
                    keeps every chart in memory forever. The real fix was an error boundary
                    keyed to the active tab, plus an explicit min-height on every chart
                    wrapper so the responsive container always mounts into a parent that
                    already has a size.
                  </p>
                  <p>
                    Animation uses framer-motion's lazy feature bundle in strict mode, so a
                    future full import throws during development instead of silently
                    re-inflating the payload — and reduced-motion is honoured through the
                    library, because the CSS rule that zeroes durations never reached
                    transforms driven in JavaScript.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="type-h2 mb-4">What is missing</h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    No seasonality model, so the trend absorbs anything cyclical. No holdout
                    backtest, which means the forecast has never been scored against data it
                    did not see. Revenue is a single constant — $0.003 per stream — where it
                    should be a distribution that varies by territory and platform.
                  </p>
                  <p>
                    And the honest headline limitation is the one at the top: this is a
                    release-date distribution wearing a listening timeline's clothes. The
                    methods are real and they would transfer to real streaming data
                    unchanged. The conclusions belong to the dataset they came from.
                  </p>
                </div>
              </div>
            </div>

            <CaseStudyFooter current="catalogIntelligence" />
          </div>
        </section>
      </main>
    </div>
  );
};

export default CatalogIntelligenceCaseStudy;
