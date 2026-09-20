import { ArrowRight, BarChart3, TrendingUp, Shield, Target } from "lucide-react";
import { Link } from "react-router-dom";

import { buttonClasses } from "@/components/ui/button";
import { cardClasses } from "@/components/ui/card";
import { sparklineBars, sparklineGeometry } from "@/lib/sparkline";
import { ANALYTICS_SPARKS } from "@/content/analyticsSparks";

/**
 * These four series used to be hand-written arrays — invented numbers plotted
 * beside four real statistical method names, under a heading about evaluating
 * catalogs as financial assets. They carried aria-hidden, so a screen reader
 * skipped them and the markup was defensible; a sighted reviewer still read
 * four charts next to "Revenue Forecasting / Linear Regression" with no way
 * to tell they were decoration.
 *
 * They are now derived from public/data/spotify_songs.csv by
 * scripts/generate-analytics-sparks.ts, through the same src/lib functions
 * /music-analytics runs on. Committed rather than computed at load, because
 * the landing page must not pull an 820 KB CSV onto its scroll path — which
 * is the same reason these are inline SVG rather than recharts.
 * src/content/analyticsSparks.test.ts fails if the file and the CSV drift.
 */
const sparkData = ANALYTICS_SPARKS;

/**
 * Inline SVG sparklines — deliberately not recharts. These four 40px decorative
 * charts don't justify pulling a charting library (recharts + d3) onto the
 * landing page's scroll path; the geometry helpers draw them as plain paths.
 * `preserveAspectRatio="none"` stretches them to the card width, and
 * `vector-effect="non-scaling-stroke"` keeps strokes crisp under that scale.
 */

const SPARK_W = 100;
const SPARK_H = 40;

const AreaSpark = ({
  values,
  stroke,
  gradientId,
}: {
  values: readonly number[];
  stroke: string;
  gradientId: string;
}) => {
  const { line, area } = sparklineGeometry(values, { width: SPARK_W, height: SPARK_H });
  return (
    <svg
      width="100%"
      height={SPARK_H}
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      preserveAspectRatio="none"
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.3} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} stroke="none" />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

const LineSpark = ({ values, stroke }: { values: readonly number[]; stroke: string }) => {
  const { line } = sparklineGeometry(values, { width: SPARK_W, height: SPARK_H });
  return (
    <svg
      width="100%"
      height={SPARK_H}
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      preserveAspectRatio="none"
      role="presentation"
      aria-hidden="true"
    >
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

const BarSpark = ({ values }: { values: readonly number[] }) => {
  const bars = sparklineBars(values, { width: SPARK_W, height: SPARK_H, gap: 0.3 });
  return (
    <svg
      width="100%"
      height={SPARK_H}
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      preserveAspectRatio="none"
      role="presentation"
      aria-hidden="true"
    >
      {bars.map((bar, index) => (
        <rect
          key={index}
          x={bar.x}
          y={bar.y}
          width={bar.width}
          height={bar.height}
          rx={1}
          fill="hsl(var(--foreground))"
          opacity={0.4}
        />
      ))}
    </svg>
  );
};

const metrics = [
  {
    icon: Target,
    label: "Acquisition Scoring",
    value: "0–100",
    desc: "Weighted model evaluating growth, stability, longevity & momentum",
    plotted: "Scores for the twelve largest catalogs in the sample",
    spark: <AreaSpark values={sparkData.acquisition} stroke="hsl(var(--primary))" gradientId="sparkAcq" />,
  },
  {
    icon: TrendingUp,
    label: "Revenue Forecasting",
    value: "Linear Regression",
    desc: "Stream-to-revenue projections with confidence bands",
    plotted: "Modeled revenue by release month, last 24 months of the sample",
    spark: <LineSpark values={sparkData.revenue} stroke="hsl(142 71% 45%)" />,
  },
  {
    icon: Shield,
    label: "Risk Analysis",
    value: "Rolling Variance",
    desc: "Volatility tracking and catalog diversification scoring",
    plotted: "Rolling three-month variance over those same months",
    spark: <AreaSpark values={sparkData.risk} stroke="hsl(0 84% 60%)" gradientId="sparkRisk" />,
  },
  {
    icon: BarChart3,
    label: "Catalog Depth",
    value: "Album Distribution",
    desc: "Release distribution across a catalog",
    plotted: "Releases per year across the sample, most recent first",
    spark: <BarSpark values={sparkData.catalog} />,
  },
];

const AnalyticsPreview = () => (
  <section className="section-padding-tight scroll-mt-24">
    <div className="container mx-auto space-y-8">
      <div className="space-y-4">
        <p className="eyebrow">Intelligence</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h2 className="type-h1">
              Music Catalog Intelligence Platform
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              Investment-grade analytics for evaluating music catalogs as financial assets.
              Modeled catalog metrics, acquisition scoring, and AI-driven insights.
            </p>
          </div>

          <Link
            to="/music-analytics"
            className={buttonClasses({ variant: "secondary" })}
          >
            Open Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <article
            key={m.label}
            className={cardClasses()}
          >
            <m.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">{m.label}</h3>
            <p className="mt-1 text-xs font-medium text-primary/80">{m.value}</p>
            <div className="mt-3">{m.spark}</div>
            {/* The chart itself is aria-hidden, so this caption is the only
                thing that says what it plots — to a screen reader and to a
                sighted reader who reasonably assumes it is decoration. */}
            <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground/70">{m.plotted}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{m.desc}</p>
          </article>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground/60">
        Built on a public Spotify popularity dataset (2020 sample), self-hosted, and simplified
        financial modeling
      </p>
    </div>
  </section>
);

export default AnalyticsPreview;
