import { ArrowRight, BarChart3, TrendingUp, Shield, Target } from "lucide-react";
import { Link } from "react-router-dom";

import { sparklineBars, sparklineGeometry } from "@/lib/sparkline";

const sparkData = {
  acquisition: [42, 48, 45, 55, 58, 52, 61, 67, 63, 72, 78, 74],
  revenue: [12, 18, 22, 28, 31, 35, 33, 40, 46, 52, 55, 61],
  risk: [30, 45, 25, 50, 35, 55, 28, 42, 38, 48, 32, 40],
  catalog: [85, 62, 48, 35, 28, 20, 15, 12],
};

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
  values: number[];
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

const LineSpark = ({ values, stroke }: { values: number[]; stroke: string }) => {
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

const BarSpark = ({ values }: { values: number[] }) => {
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
    desc: "Weighted model evaluating growth, volatility, longevity & momentum",
    spark: <AreaSpark values={sparkData.acquisition} stroke="hsl(var(--primary))" gradientId="sparkAcq" />,
  },
  {
    icon: TrendingUp,
    label: "Revenue Forecasting",
    value: "Linear Regression",
    desc: "Stream-to-revenue projections with confidence bands",
    spark: <LineSpark values={sparkData.revenue} stroke="hsl(142 71% 45%)" />,
  },
  {
    icon: Shield,
    label: "Risk Analysis",
    value: "Rolling Variance",
    desc: "Volatility tracking and catalog diversification scoring",
    spark: <AreaSpark values={sparkData.risk} stroke="hsl(0 84% 60%)" gradientId="sparkRisk" />,
  },
  {
    icon: BarChart3,
    label: "Catalog Depth",
    value: "Album Distribution",
    desc: "Playcount concentration across discography",
    spark: <BarSpark values={sparkData.catalog} />,
  },
];

const AnalyticsPreview = () => (
  <section className="section-padding border-y border-border/70 bg-secondary/50 scroll-mt-24">
    <div className="container mx-auto space-y-8">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Intelligence</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
              Music Catalog Intelligence Platform
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              Investment-grade analytics for evaluating music catalogs as financial assets.
              Modeled catalog metrics, acquisition scoring, and AI-driven insights.
            </p>
          </div>

          <Link
            to="/music-analytics"
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-5 py-3 text-sm font-semibold text-foreground hover:bg-primary/15"
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
            className="rounded-[1.5rem] border border-border/70 bg-card/75 p-5 shadow-[0_20px_45px_-34px_rgba(0,0,0,0.8)]"
          >
            <m.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">{m.label}</h3>
            <p className="mt-1 text-xs font-medium text-primary/80">{m.value}</p>
            <div className="mt-3">{m.spark}</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{m.desc}</p>
          </article>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground/60">
        Built on a public Spotify popularity dataset (2020 sample), public APIs, and simplified
        financial modeling
      </p>
    </div>
  </section>
);

export default AnalyticsPreview;
